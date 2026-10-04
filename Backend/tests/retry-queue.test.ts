import { processRetryQueue, startAutoRetryCron, stopAutoRetryCron } from '../src/cron/retry-queue';
import { qbService } from '../src/services/qb.service';
import * as Sentry from '@sentry/node';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    syncLog: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    scanRecord: {
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/services/qb.service', () => ({
  qbService: {
    callQB: jest.fn(),
    createJournalEntry: jest.fn(),
    createBill: jest.fn(),
    createVendorCredit: jest.fn(),
    createCheque: jest.fn(),
    createBillPayment: jest.fn(),
  },
}));

jest.mock('@sentry/node', () => {
  const withScope = jest.fn((callback) => {
    const scope = {
      setTag: jest.fn(),
      setExtra: jest.fn(),
      setContext: jest.fn(),
    };
    callback(scope);
  });

  return {
    withScope,
    captureException: jest.fn(),
  };
});

describe('Automated Background Retry Queue', () => {
  const { prisma } = require('../src/lib/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
    stopAutoRetryCron();
    process.env.SENTRY_DSN = 'https://public@example.ingest.sentry.io/1';
  });

  afterAll(() => {
    stopAutoRetryCron();
  });

  it('starts and stops the auto retry cron without throwing', () => {
    expect(() => {
      startAutoRetryCron(1000);
      stopAutoRetryCron();
    }).not.toThrow();
  });

  it('prevents overlapping runs via a re-entrancy lock and processes a successful retry', async () => {
    const pendingLog = {
      id: 'log-1',
      userId: 'user-1',
      syncType: 'JOURNAL_ENTRY',
      requestPayload: { amount: 42 },
      scanRecordId: 'scan-1',
      retryCount: 0,
      attemptCount: 2,
      maxAttempts: 5,
      qbJournalEntryId: null,
      nextRetryAt: new Date(),
    };

    prisma.syncLog.findMany.mockResolvedValueOnce([pendingLog]);
    prisma.syncLog.update.mockResolvedValue({});
    prisma.scanRecord.update.mockResolvedValue({});
    (qbService.callQB as jest.Mock).mockImplementation((_userId, callback) => callback({ accessToken: 'token', realmId: 'realm-1' }));
    (qbService.createJournalEntry as jest.Mock).mockResolvedValue({ id: 'qb-123' });

    const firstPromise = processRetryQueue();
    const secondPromise = processRetryQueue();
    const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise]);

    expect(firstResult).toBe(1);
    expect(secondResult).toBe(0);
    expect(prisma.syncLog.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.syncLog.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'log-1' },
      data: expect.objectContaining({
        status: 'SUCCESS',
        retryCount: 1,
        attemptCount: 3,
      }),
    }));
  });

  it('marks transient failures, schedules the next retry, and captures Sentry context', async () => {
    const pendingLog = {
      id: 'log-2',
      userId: 'user-2',
      syncType: 'BILL',
      requestPayload: { amount: 99 },
      scanRecordId: 'scan-2',
      retryCount: 0,
      attemptCount: 2,
      maxAttempts: 5,
      qbJournalEntryId: null,
      nextRetryAt: new Date(),
    };

    prisma.syncLog.findMany.mockResolvedValueOnce([pendingLog]);
    prisma.syncLog.update.mockResolvedValue({});
    (qbService.callQB as jest.Mock).mockRejectedValueOnce(new Error('Service unavailable'));

    const result = await processRetryQueue();

    expect(result).toBe(0);
    expect(prisma.syncLog.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'log-2' },
      data: expect.objectContaining({
        status: 'FAILED',
        errorType: 'TRANSIENT',
        retryCount: 1,
        retryInterval: expect.any(Number),
        nextRetryAt: expect.any(Date),
      }),
    }));
    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
