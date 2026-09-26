import { Prisma, SyncStatus, SyncType } from '@prisma/client';
import { logger } from '../lib/logger';
import { calculateExponentialBackoff } from '../lib/dedup';
import { prisma } from '../lib/prisma';
import { qbService } from '../services/qb.service';

const log = logger.child({ module: 'RetryQueue' });

let retryIntervalTimer: ReturnType<typeof setInterval> | null = null;
let isProcessingQueue = false;

export async function queryPendingRetries(limit = 10) {
  const now = new Date();

  return prisma.syncLog.findMany({
    where: {
      status: SyncStatus.FAILED,
      nextRetryAt: { lte: now },
      retryCount: { lt: 5 },
    },
    take: limit,
    orderBy: { nextRetryAt: 'asc' },
  });
}

async function retrySyncLog(logEntry: {
  id: string;
  userId: string | null;
  syncType: SyncType;
  requestPayload: Prisma.JsonValue | null;
  scanRecordId: string | null;
  retryCount: number;
  attemptCount: number;
  maxAttempts: number;
}) {
  if (!logEntry.userId || !logEntry.requestPayload) {
    throw new Error('No user or payload available for retry');
  }

  const payload = logEntry.requestPayload as Record<string, unknown>;
  const userId = logEntry.userId;

  switch (logEntry.syncType) {
    case SyncType.JOURNAL_ENTRY: {
      const result = await qbService.callQB(userId, ({ accessToken, realmId }) =>
        qbService.createJournalEntry({
          ...(payload as any),
          realmId,
          accessToken,
        }),
      );
      return { qbJournalEntryId: result?.id ?? null };
    }

    case SyncType.BILL: {
      const result = await qbService.callQB(userId, ({ accessToken, realmId }) =>
        qbService.createBill({
          ...(payload as any),
          realmId,
          accessToken,
        }),
      );
      return { qbJournalEntryId: result?.id ?? null };
    }

    case SyncType.VENDOR_CREDIT: {
      const result = await qbService.callQB(userId, ({ accessToken, realmId }) =>
        qbService.createVendorCredit({
          ...(payload as any),
          realmId,
          accessToken,
        }),
      );
      return { qbJournalEntryId: result?.id ?? null };
    }

    case SyncType.CHEQUE: {
      const result = await qbService.callQB(userId, ({ accessToken, realmId }) =>
        qbService.createCheque({
          ...(payload as any),
          realmId,
          accessToken,
        }),
      );
      return { qbJournalEntryId: result?.id ?? null };
    }

    case SyncType.BILL_PAYMENT: {
      const result = await qbService.callQB(userId, ({ accessToken, realmId }) =>
        qbService.createBillPayment({
          ...(payload as any),
          realmId,
          accessToken,
        }),
      );
      return { qbJournalEntryId: result?.id ?? null };
    }

    default:
      throw new Error(`Unsupported sync type for auto-retry: ${String(logEntry.syncType)}`);
  }
}

export async function processRetryQueue(): Promise<number> {
  if (isProcessingQueue) {
    return 0;
  }

  isProcessingQueue = true;

  try {
    const pending = await queryPendingRetries(10);
    if (pending.length === 0) {
      return 0;
    }

    let processedCount = 0;

    for (const logEntry of pending) {
      const nextAttempt = logEntry.retryCount + 1;
      const nextDelay = calculateExponentialBackoff(nextAttempt);
      const nextRetryDate = new Date(Date.now() + nextDelay);

      try {
        const retryResult = await retrySyncLog(logEntry);

        await prisma.syncLog.update({
          where: { id: logEntry.id },
          data: {
            status: SyncStatus.SUCCESS,
            qbJournalEntryId: retryResult.qbJournalEntryId ?? logEntry.qbJournalEntryId ?? null,
            errorMessage: null,
            errorType: null,
            nextRetryAt: null,
            retryInterval: null,
            retryCount: nextAttempt,
            attemptCount: logEntry.attemptCount + 1,
            syncedAt: new Date(),
          },
        });

        if (logEntry.scanRecordId) {
          await prisma.scanRecord.update({
            where: { id: logEntry.scanRecordId },
            data: {
              status: 'SYNCED',
              syncStatus: 'SYNCED',
              lastSyncError: null,
            },
          });
        }

        processedCount += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        const willRetryAgain = nextAttempt < (logEntry.maxAttempts || 5);

        await prisma.syncLog.update({
          where: { id: logEntry.id },
          data: {
            status: SyncStatus.FAILED,
            retryCount: nextAttempt,
            retryInterval: willRetryAgain ? nextDelay : null,
            nextRetryAt: willRetryAgain ? nextRetryDate : null,
            attemptCount: logEntry.attemptCount + 1,
            errorMessage: message,
            errorType: willRetryAgain ? 'TRANSIENT' : 'FATAL',
          },
        });

        if (logEntry.scanRecordId && !willRetryAgain) {
          await prisma.scanRecord.update({
            where: { id: logEntry.scanRecordId },
            data: {
              status: 'FAILED',
              syncStatus: 'FAILED',
              lastSyncError: message,
            },
          });
        }
      }
    }

    return processedCount;
  } catch (error) {
    log.error({ err: error }, 'Retry queue processing failed');
    return 0;
  } finally {
    isProcessingQueue = false;
  }
}

export function startAutoRetryCron(intervalMs = 30_000): void {
  if (retryIntervalTimer) {
    return;
  }

  retryIntervalTimer = setInterval(() => {
    void processRetryQueue().catch((err) => {
      log.error({ err }, 'Auto retry cron iteration failed');
    });
  }, intervalMs);

  retryIntervalTimer.unref();
  log.info({ intervalMs }, 'Auto retry cron initialized');
}

export function stopAutoRetryCron(): void {
  if (!retryIntervalTimer) {
    return;
  }

  clearInterval(retryIntervalTimer);
  retryIntervalTimer = null;
}
