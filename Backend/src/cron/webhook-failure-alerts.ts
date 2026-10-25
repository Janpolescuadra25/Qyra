import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import { prisma as defaultPrisma } from '../lib/prisma';
import { sendSyncFailureAlert } from '../lib/email';

const log = logger.child({ module: 'WebhookFailureAlerts' });

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export async function checkAndAlertWebhookFailures(
  prisma: PrismaClient = defaultPrisma,
): Promise<{ failedCount: number; alerted: boolean }> {
  try {
    const windowStart = new Date(Date.now() - FAILURE_WINDOW_MS);

    const failedLogs = await prisma.webhookDeliveryLog.findMany({
      where: {
        status: 'FAILED',
        receivedAt: {
          gte: windowStart,
        },
      },
      select: {
        id: true,
        eventType: true,
        errorMessage: true,
        receivedAt: true,
      },
    });

    const failedCount = failedLogs.length;

    if (failedCount === 0) {
      log.info('No webhook delivery failures detected in the current alert window');
      return { failedCount: 0, alerted: false };
    }

    log.warn({ failedCount, windowStart }, 'Webhook delivery failures detected; dispatching administrative alert');

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SUPPORT_EMAIL || 'support@qyra.io';

    await sendSyncFailureAlert({
      to: adminEmail,
      name: 'System Administrator',
      staleCount: 0,
      maxRetriedCount: 0,
      oldFailureCount: failedCount,
      dashboardLink: `${process.env.APP_URL || 'https://app.qyra.io'}/admin/billing/webhooks`,
    });

    return { failedCount, alerted: true };
  } catch (error) {
    log.error({ err: error }, 'Error executing webhook failure alert check');
    return { failedCount: 0, alerted: false };
  }
}

export function startWebhookFailureAlertCron(prisma: PrismaClient = defaultPrisma): void {
  if (intervalHandle) {
    log.warn('Webhook failure alert cron already running; skipping start request');
    return;
  }

  log.info({ intervalMs: CHECK_INTERVAL_MS }, 'Starting webhook failure alert cron');

  void checkAndAlertWebhookFailures(prisma).catch((error) => {
    log.error({ err: error }, 'Initial webhook failure alert check failed');
  });

  intervalHandle = setInterval(() => {
    void checkAndAlertWebhookFailures(prisma).catch((error) => {
      log.error({ err: error }, 'Periodic webhook failure alert check failed');
    });
  }, CHECK_INTERVAL_MS);

  if (intervalHandle.unref) {
    intervalHandle.unref();
  }
}

export function stopWebhookFailureAlertCron(): void {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
  log.info('Stopped webhook failure alert cron');
}
