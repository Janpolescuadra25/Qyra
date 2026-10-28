import { prisma } from '../lib/prisma';
import { PLANS, type PlanKey } from '../lib/stripe';

export const CANCELLATION_REASONS = [
  'too_expensive',
  'missing_features',
  'switched_service',
  'temporary_pause',
  'other',
] as const;

export type CancellationReason = typeof CANCELLATION_REASONS[number];
export type SubscriptionEventType = 'CANCEL' | 'REACTIVATE' | 'UPGRADE' | 'DOWNGRADE' | 'INTERVAL_CHANGE' | 'NEW_SUBSCRIPTION' | 'CHURN';

export function computePlanMRR(plan: string | null | undefined, interval: string | null | undefined): number {
  const normalizedPlan = plan?.trim().toLowerCase();
  if (!normalizedPlan || normalizedPlan === 'free' || !(normalizedPlan in PLANS)) return 0;
  const config = PLANS[normalizedPlan as PlanKey];
  const normalizedInterval = interval?.trim().toLowerCase();
  return normalizedInterval === 'year' || normalizedInterval === 'annual' || normalizedInterval === 'yearly'
    ? config.annualPrice
    : config.monthlyPrice;
}

export async function recordSubscriptionEvent(data: {
  userId: string;
  eventType: SubscriptionEventType;
  fromPlan?: string | null;
  toPlan?: string | null;
  fromInterval?: string | null;
  toInterval?: string | null;
  mrrDelta?: number;
  reason?: string | null;
  feedback?: string | null;
}) {
  try {
    return await prisma.subscriptionEvent.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        fromPlan: data.fromPlan ?? null,
        toPlan: data.toPlan ?? null,
        fromInterval: data.fromInterval ?? null,
        toInterval: data.toInterval ?? null,
        mrrDelta: data.mrrDelta ?? 0,
        reason: data.reason ?? null,
        feedback: data.feedback ?? null,
      },
    });
  } catch (error) {
    console.error('[SubscriptionMetrics] Non-fatal event recording failure:', error);
    return null;
  }
}

export async function getSubscriptionMetrics() {
  const subscribers = await prisma.user.findMany({
    where: { stripeSubscriptionId: { not: null }, currentPlan: { not: null } },
    select: { currentPlan: true, planInterval: true, cancelAtPeriodEnd: true },
  });

  const planBreakdown = Object.fromEntries(
    ['starter', 'professional', 'premium', 'enterprise'].map(plan => [plan, { month: 0, year: 0, total: 0, mrr: 0 }]),
  ) as Record<string, { month: number; year: number; total: number; mrr: number }>;
  let mrr = 0;
  let totalSubscribers = 0;
  let scheduledCancellations = 0;

  for (const subscriber of subscribers) {
    const plan = subscriber.currentPlan?.toLowerCase() ?? '';
    if (!(plan in planBreakdown)) continue;
    const interval = subscriber.planInterval === 'year' ? 'year' : 'month';
    planBreakdown[plan]![interval] += 1;
    planBreakdown[plan]!.total += 1;
    if (subscriber.cancelAtPeriodEnd) {
      scheduledCancellations += 1;
      continue;
    }
    const planMrr = computePlanMRR(plan, interval);
    planBreakdown[plan]!.mrr += planMrr;
    mrr += planMrr;
    totalSubscribers += 1;
  }

  return { mrr, arr: mrr * 12, totalSubscribers, scheduledCancellations, planBreakdown };
}

export async function getChurnMetrics(days = 30) {
  const boundedDays = Number.isFinite(days) ? Math.min(Math.max(Math.trunc(days), 1), 365) : 30;
  const since = new Date(Date.now() - boundedDays * 86_400_000);
  const [subscriptionMetrics, cancellations, recentEvents] = await Promise.all([
    getSubscriptionMetrics(),
    prisma.subscriptionEvent.findMany({
      where: { eventType: { in: ['CANCEL', 'CHURN'] }, createdAt: { gte: since } },
      select: { reason: true },
    }),
    prisma.subscriptionEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);
  const reasonBreakdown: Record<string, number> = Object.fromEntries(CANCELLATION_REASONS.map(reason => [reason, 0]));
  for (const cancellation of cancellations) {
    const reason = cancellation.reason && cancellation.reason in reasonBreakdown ? cancellation.reason : 'other';
    reasonBreakdown[reason] = (reasonBreakdown[reason] ?? 0) + 1;
  }
  const denominator = subscriptionMetrics.totalSubscribers + cancellations.length;
  const churnRate = denominator === 0 ? 0 : (cancellations.length / denominator) * 100;
  return {
    churnRate: Math.round(churnRate * 100) / 100,
    totalCancellations: cancellations.length,
    reasonBreakdown,
    recentEvents,
    windowDays: boundedDays,
  };
}
