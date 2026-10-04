import { checkAndAlertSyncFailures, startSyncFailureAlertCron, stopSyncFailureAlertCron } from '../src/cron/sync-failure-alerts';
import { sendSyncFailureAlert } from '../src/lib/email';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    scanRecord: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
    },
    auditLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/email', () => ({
  sendSyncFailureAlert: jest.fn(),
}));

describe('Sync Failure Alert Cron Job', () => {
  const { prisma } = require('../src/lib/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
    stopSyncFailureAlertCron();
  });

  afterAll(() => {
    stopSyncFailureAlertCron();
  });

  it('starts and stops the sync failure alert cron without throwing', () => {
    expect(() => {
      startSyncFailureAlertCron();
      stopSyncFailureAlertCron();
    }).not.toThrow();
  });

  it('detects stale scans and sends a team alert when the lead is active', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'lead-1',
      email: 'lead@example.com',
      name: 'Alex',
      status: 'ACTIVE',
    });
    prisma.scanRecord.findMany
      .mockResolvedValueOnce([
        {
          id: 'scan-1',
          status: 'PENDING',
          scanDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          location: {
            user: {
              id: 'lead-1',
              adminId: null,
              email: 'lead@example.com',
              name: 'Alex',
              status: 'ACTIVE',
            },
          },
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.notificationPreference.findUnique.mockResolvedValue({
      userId: 'lead-1',
      syncFailureAlerts: true,
    });
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
    (sendSyncFailureAlert as jest.Mock).mockResolvedValue({ success: true });

    await expect(checkAndAlertSyncFailures()).resolves.toBeUndefined();

    expect(sendSyncFailureAlert).toHaveBeenCalledWith(expect.objectContaining({
      to: 'lead@example.com',
      staleCount: 1,
    }));
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('suppresses alerts when the team lead has already been notified within the 24h cooldown window', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'lead-1',
      email: 'lead@example.com',
      name: 'Alex',
      status: 'ACTIVE',
    });
    prisma.scanRecord.findMany
      .mockResolvedValueOnce([
        {
          id: 'scan-2',
          status: 'PENDING',
          scanDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          location: {
            user: {
              id: 'lead-1',
              adminId: null,
              email: 'lead@example.com',
              name: 'Alex',
              status: 'ACTIVE',
            },
          },
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.notificationPreference.findUnique.mockResolvedValue({
      userId: 'lead-1',
      syncFailureAlerts: true,
    });
    prisma.auditLog.findFirst.mockResolvedValue({
      createdAt: new Date(),
    });

    await checkAndAlertSyncFailures();

    expect(sendSyncFailureAlert).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('flags scans that have reached the max retry threshold', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'lead-2',
      email: 'lead2@example.com',
      name: 'Morgan',
      status: 'ACTIVE',
    });
    prisma.scanRecord.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'scan-3',
          status: 'FAILED',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          location: {
            user: {
              id: 'lead-2',
              adminId: null,
              email: 'lead2@example.com',
              name: 'Morgan',
              status: 'ACTIVE',
            },
          },
          syncLogs: [{
            attemptCount: 3,
            syncedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          }],
        },
      ]);
    prisma.notificationPreference.findUnique.mockResolvedValue({
      userId: 'lead-2',
      syncFailureAlerts: true,
    });
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-2' });
    (sendSyncFailureAlert as jest.Mock).mockResolvedValue({ success: true });

    await expect(checkAndAlertSyncFailures()).resolves.toBeUndefined();

    expect(sendSyncFailureAlert).toHaveBeenCalledWith(expect.objectContaining({
      to: 'lead2@example.com',
      maxRetriedCount: 1,
    }));
  });
});
