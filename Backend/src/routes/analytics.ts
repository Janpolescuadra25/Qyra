import { Router, Response } from 'express';
import { authenticate, requireFeaturePermission, type AuthRequest } from '../middleware/auth.middleware';
import { AppError, asyncHandler } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { analyticsDashboardQuerySchema } from '../lib/validators';
import { validate } from '../middleware/validate';
import { logger } from '../lib/logger';

const log = logger.child({ module: 'Analytics' });

const router = Router();

router.get('/dashboard', authenticate, requireFeaturePermission('scan', 'write'), validate(analyticsDashboardQuerySchema, 'query'), asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const toDate = req.query.dateTo ? new Date(String(req.query.dateTo)) : now;
    const fromDate = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formattedFrom = fromDate.toISOString();
    const formattedTo = toDate.toISOString();
    const monthlyScanVolumeRaw = await prisma.$queryRaw<
      { month: string; count: string }[]
    >`
      SELECT to_char("scanDate", 'YYYY-MM') AS month,
             COUNT(*) AS count
      FROM "scan_records"
      WHERE "scanDate" BETWEEN ${formattedFrom}::timestamp AND ${formattedTo}::timestamp
        AND "locationId" IN (
          SELECT id FROM "locations" WHERE "userId" = ${req.user!.id}
        )
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12;
    `;

    const monthlyScanVolume = monthlyScanVolumeRaw.map((item) => ({
      month: item.month,
      count: Number(item.count),
    }));

    const statusGroups = await prisma.scanRecord.groupBy({
      by: ['syncStatus'],
      where: {
        scanDate: {
          gte: fromDate,
          lte: toDate,
        },
        location: {
          user: {
            id: req.user!.id,
          },
        },
      },
      _count: { _all: true },
    });

    const statusMap = statusGroups.reduce<Record<string, number>>((acc, item) => {
      acc[item.syncStatus] = item._count._all;
      return acc;
    }, {});

    const [mappedAccounts, storageUsageScanCount] = await Promise.all([
      prisma.mapping.groupBy({
        by: ['targetAccount', 'postingType'],
        where: {
          location: {
            user: {
              id: req.user!.id,
            },
          },
        },
        _count: { targetAccount: true },
        orderBy: { _count: { targetAccount: 'desc' } },
        take: 5,
      }),
      prisma.scanRecord.count({
        where: {
          location: {
            user: {
              id: req.user!.id,
            },
          },
        },
      }),
    ]);

    const topMappedAccounts = mappedAccounts.map((result) => ({
      accountName: result.targetAccount,
      accountType: result.postingType,
      usageCount: result._count.targetAccount,
    }));

    const total = req.user!.allocatedScans ?? 0;
    const percentage = total > 0 ? Math.round((storageUsageScanCount / total) * 100) : 0;

    return res.json({
      monthlyScanVolume,
      syncStatusBreakdown: {
        synced: statusMap['SYNCED'] ?? 0,
        failed: statusMap['FAILED'] ?? 0,
        pending: statusMap['PENDING'] ?? 0,
      },
      topMappedAccounts,
      storageUsage: {
        used: storageUsageScanCount,
        total,
        percentage,
      },
    });
  } catch (error) {
    log.error({ err: error }, 'dashboard error');
    throw new AppError('Failed to load dashboard analytics', 500);
  }
}));

router.get('/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userWhere = { userId };

    const [
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      recoveredRetries,
      transientFailures,
      permanentFailures,
      pendingQueueCount,
    ] = await Promise.all([
      prisma.syncLog.count({ where: userWhere }),
      prisma.syncLog.count({ where: { ...userWhere, status: 'SUCCESS' } }),
      prisma.syncLog.count({ where: { ...userWhere, status: 'FAILED' } }),
      prisma.syncLog.count({ where: { ...userWhere, status: 'SUCCESS', attemptCount: { gt: 1 } } }),
      prisma.syncLog.count({ where: { ...userWhere, status: 'FAILED', errorType: 'TRANSIENT' } }),
      prisma.syncLog.count({ where: { ...userWhere, status: 'FAILED', errorType: 'FATAL' } }),
      prisma.syncLog.count({
        where: {
          ...userWhere,
          status: 'FAILED',
          nextRetryAt: { lte: new Date() },
          retryCount: { lt: 5 },
        },
      }),
    ]);

    const successRate = totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 100;
    const retryConversionRate = failedSyncs + recoveredRetries > 0
      ? Math.round((recoveredRetries / (failedSyncs + recoveredRetries)) * 100)
      : 0;

    log.info({ userId, totalSyncs, successfulSyncs, failedSyncs, recoveredRetries, pendingQueueCount }, 'Sync metrics requested');

    return res.json({
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      recoveredRetries,
      successRate,
      retryConversionRate,
      errorBreakdown: {
        transient: transientFailures,
        permanent: permanentFailures,
      },
      pendingQueueCount,
    });
  } catch (error) {
    log.error({ err: error, userId: req.user?.id }, 'Failed to load sync metrics');
    return res.status(500).json({ error: 'Failed to retrieve sync metrics' });
  }
});

export default router;
