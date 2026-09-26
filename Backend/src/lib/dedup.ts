import { createHash } from 'crypto';
import { Prisma, SyncStatus, SyncType } from '@prisma/client';
import { prisma } from './prisma';

function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
    const normalized: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      const item = (value as Record<string, unknown>)[key];
      if (item !== undefined) {
        normalized[key] = canonicalize(item);
      }
    }
    return normalized;
  }

  return value;
}

export function calculateExponentialBackoff(retryCount: number): number {
  const baseDelay = 1000;
  const maxDelay = 300000;
  const exponential = baseDelay * Math.pow(2, retryCount);
  const capped = Math.min(exponential, maxDelay);
  const jitter = 0.8 + (Math.random() * 0.4);
  return Math.round(capped * jitter);
}

export function hashSyncRequest(syncType: SyncType, payload: unknown): string {
  const normalized = JSON.stringify(canonicalize(payload));
  return createHash('sha256').update(`${syncType}:${normalized}`, 'utf8').digest('hex');
}

export async function findDuplicateSync(
  userId: string,
  syncType: SyncType,
  requestHash: string,
) {
  return prisma.syncLog.findFirst({
    where: {
      userId,
      syncType,
      requestHash,
      status: 'SUCCESS',
    },
    orderBy: { syncedAt: 'desc' },
  });
}

export async function countSyncAttempts(
  userId: string,
  syncType: SyncType,
  requestHash: string,
) {
  return prisma.syncLog.count({
    where: {
      userId,
      syncType,
      requestHash,
    },
  });
}

export async function createSyncLogEntry(params: {
  userId?: string | null;
  syncType: SyncType;
  scanRecordId?: string | null;
  qbJournalEntryId?: string | null;
  docNumber?: string | null;
  requestHash?: string | null;
  status: SyncStatus;
  requestPayload?: Prisma.JsonValue | null;
  attemptCount?: number;
  errorMessage?: string | null;
  errorType?: string | null;
  nextRetryAt?: Date | null;
  retryInterval?: number | null;
  maxAttempts?: number;
  retryCount?: number;
}) {
  const {
    userId,
    syncType,
    scanRecordId,
    qbJournalEntryId,
    docNumber,
    requestHash,
    status,
    requestPayload,
    attemptCount,
    errorMessage,
    errorType,
    nextRetryAt,
    retryInterval,
    maxAttempts,
    retryCount,
  } = params;

  return prisma.syncLog.create({
    data: {
      userId: userId ?? null,
      syncType,
      scanRecordId,
      qbJournalEntryId,
      docNumber,
      requestHash: requestHash ?? null,
      status,
      requestPayload: requestPayload === null ? Prisma.JsonNull : (requestPayload as Prisma.InputJsonValue | undefined),
      attemptCount: attemptCount ?? 1,
      errorMessage,
      errorType,
      nextRetryAt: nextRetryAt ?? null,
      retryInterval: retryInterval ?? null,
      maxAttempts: maxAttempts ?? 5,
      retryCount: retryCount ?? 0,
    },
  });
}
