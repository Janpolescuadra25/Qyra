import { Router } from 'express';
import { asyncHandler, AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { stripe, isStripeConfigured, PLANS, type PlanKey } from '../lib/stripe';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const BILLABLE_PLAN_KEYS = ['starter', 'professional', 'premium', 'enterprise'] as const;
type BillablePlanKey = Exclude<PlanKey, 'free'>;
type BillingInterval = 'month' | 'year';

function normalizeBillingInterval(value: unknown): BillingInterval | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'month' || normalized === 'monthly') return 'month';
  if (normalized === 'year' || normalized === 'annual' || normalized === 'yearly') return 'year';
  return null;
}

function parseTargetPlan(value: unknown): BillablePlanKey {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (normalized === 'free') {
    throw new AppError(
      'Transitions to the free tier require subscription cancellation via /api/billing/cancel-subscription',
      400
    );
  }

  if (!BILLABLE_PLAN_KEYS.includes(normalized as BillablePlanKey)) {
    throw new AppError(
      `Invalid target plan. Must be one of: ${BILLABLE_PLAN_KEYS.join(', ')}`,
      400
    );
  }

  return normalized as BillablePlanKey;
}

function stripeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Stripe error';
}

function assertBillingAuthority(req: AuthRequest): string {
  const isOwner = !req.user!.adminId;
  const isAdmin = req.user!.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AppError('Only organization admins can modify subscriptions', 403);
  }

  return isOwner ? req.user!.userId : req.user!.adminId!;
}

/**
 * GET /api/billing/status
 * Returns subscription tier, status, period end, renewal indicators, and scan balances for the authenticated team.
 */
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const teamId = req.user!.adminId ?? req.user!.userId;
    const isOwner = !req.user!.adminId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Only account owners and administrators have billing authority', 403);
    }

    const team = await prisma.user.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        email: true,
        currentPlan: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        paymentIssue: true,
        planInterval: true,
        poolScans: true,
        bonusScans: true,
      },
    });

    if (!team) {
      throw new AppError('Team or account not found', 404);
    }

    res.json({
      success: true,
      tier: team.currentPlan,
      status: team.status,
      current_period_end: team.currentPeriodEnd ? team.currentPeriodEnd.toISOString() : null,
      cancel_at_period_end: Boolean(team.cancelAtPeriodEnd),
      payment_issue: Boolean(team.paymentIssue),
      plan_interval: team.planInterval,
      pool_scans: team.poolScans ?? 0,
      bonus_scans: team.bonusScans ?? 0,
    });
  })
);

router.post(
  '/cancel-subscription',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const isOwner = !req.user!.adminId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Only organization admins can modify subscriptions', 403);
    }

    if (!isStripeConfigured || !stripe) {
      throw new AppError('Stripe billing is not configured in this environment', 503);
    }

    const targetUserId = isOwner ? req.user!.userId : req.user!.adminId!;
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        stripeSubscriptionId: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      throw new AppError('No active subscription found to cancel', 400);
    }

    if (user.cancelAtPeriodEnd) {
      return res.json({
        success: true,
        message: 'Subscription is already scheduled to cancel at the end of the current billing period',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: user.currentPeriodEnd,
      });
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { cancelAtPeriodEnd: true },
      select: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    });

    return res.json({
      success: true,
      message: 'Subscription scheduled for cancellation at the end of the billing period',
      cancelAtPeriodEnd: updatedUser.cancelAtPeriodEnd,
      currentPeriodEnd: updatedUser.currentPeriodEnd,
    });
  })
);

router.post(
  '/reactivate-subscription',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const isOwner = !req.user!.adminId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Only organization admins can modify subscriptions', 403);
    }

    if (!isStripeConfigured || !stripe) {
      throw new AppError('Stripe billing is not configured in this environment', 503);
    }

    const targetUserId = isOwner ? req.user!.userId : req.user!.adminId!;
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        stripeSubscriptionId: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      throw new AppError('No active subscription found to reactivate', 400);
    }

    if (!user.cancelAtPeriodEnd) {
      throw new AppError('Subscription is not currently scheduled for cancellation', 400);
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { cancelAtPeriodEnd: false },
      select: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    });

    return res.json({
      success: true,
      message: 'Subscription successfully reactivated and scheduled to renew automatically',
      cancelAtPeriodEnd: updatedUser.cancelAtPeriodEnd,
      currentPeriodEnd: updatedUser.currentPeriodEnd,
    });
  })
);

/**
 * GET /api/billing/preview-proration
 * Preview the Stripe invoice impact of a paid-tier or billing-interval change.
 */
router.get(
  '/preview-proration',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const targetUserId = assertBillingAuthority(req);

    if (!isStripeConfigured || !stripe) {
      throw new AppError('Stripe billing is not configured in this environment', 503);
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        currentPlan: true,
        planInterval: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw new AppError('Team or account not found', 404);
    }

    if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
      throw new AppError('Account does not have an active Stripe subscription to modify', 400);
    }

    const targetPlan = parseTargetPlan(req.query.plan);
    const currentInterval = normalizeBillingInterval(user.planInterval) ?? 'month';
    const targetInterval = req.query.interval === undefined
      ? currentInterval
      : normalizeBillingInterval(req.query.interval);

    if (!targetInterval) {
      throw new AppError('Invalid target interval. Must be month/monthly or year/annual', 400);
    }

    if (user.currentPlan?.toLowerCase() === targetPlan && currentInterval === targetInterval) {
      throw new AppError('Target plan and interval are identical to the current subscription', 400);
    }

    const targetPriceId = targetInterval === 'year'
      ? PLANS[targetPlan].annualPriceId
      : PLANS[targetPlan].monthlyPriceId;

    if (!targetPriceId) {
      throw new AppError(`Stripe price is not configured for ${targetPlan} (${targetInterval})`, 400);
    }

    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    } catch (error) {
      throw new AppError(`Failed to retrieve Stripe subscription: ${stripeErrorMessage(error)}`, 400);
    }

    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      throw new AppError('Active Stripe subscription does not contain a subscription item', 400);
    }

    const prorationDate = Math.floor(Date.now() / 1000);
    let upcomingInvoice;
    try {
      upcomingInvoice = await stripe.invoices.createPreview({
        customer: user.stripeCustomerId,
        subscription: user.stripeSubscriptionId,
        subscription_details: {
          items: [{ id: subscriptionItemId, price: targetPriceId }],
          proration_behavior: 'create_prorations',
          proration_date: prorationDate,
        },
      });
    } catch (error) {
      throw new AppError(`Failed to calculate Stripe proration preview: ${stripeErrorMessage(error)}`, 400);
    }

    return res.json({
      status: 'success',
      data: {
        currentPlan: user.currentPlan,
        currentInterval,
        targetPlan,
        targetInterval,
        prorationDate,
        amountDue: upcomingInvoice.amount_due,
        subtotal: upcomingInvoice.subtotal,
        total: upcomingInvoice.total,
        currency: upcomingInvoice.currency,
        nextPaymentAttempt: upcomingInvoice.next_payment_attempt
          ? new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString()
          : null,
        lines: upcomingInvoice.lines.data.map((line) => ({
          id: line.id,
          description: line.description,
          amount: line.amount,
          proration: Boolean(
            line.parent?.subscription_item_details?.proration
              ?? line.parent?.invoice_item_details?.proration
          ),
          period: {
            start: new Date(line.period.start * 1000).toISOString(),
            end: new Date(line.period.end * 1000).toISOString(),
          },
        })),
      },
    });
  })
);

/**
 * POST /api/billing/change-plan
 * Apply an immediate paid-tier or billing-interval change with Stripe prorations.
 */
router.post(
  '/change-plan',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const targetUserId = assertBillingAuthority(req);

    if (!isStripeConfigured || !stripe) {
      throw new AppError('Stripe billing is not configured in this environment', 503);
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        currentPlan: true,
        planInterval: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw new AppError('Team or account not found', 404);
    }

    if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
      throw new AppError('Account does not have an active Stripe subscription to modify', 400);
    }

    const targetPlan = parseTargetPlan(req.body?.plan);
    const currentInterval = normalizeBillingInterval(user.planInterval) ?? 'month';
    const targetInterval = req.body?.interval === undefined
      ? currentInterval
      : normalizeBillingInterval(req.body.interval);

    if (!targetInterval) {
      throw new AppError('Invalid target interval. Must be month/monthly or year/annual', 400);
    }

    if (user.currentPlan?.toLowerCase() === targetPlan && currentInterval === targetInterval) {
      throw new AppError('Target plan and interval are identical to the current subscription', 400);
    }

    const requestedProrationDate = req.body?.prorationDate;
    if (
      requestedProrationDate !== undefined
      && (!Number.isInteger(requestedProrationDate) || requestedProrationDate <= 0)
    ) {
      throw new AppError('prorationDate must be a positive Unix timestamp', 400);
    }

    const targetPriceId = targetInterval === 'year'
      ? PLANS[targetPlan].annualPriceId
      : PLANS[targetPlan].monthlyPriceId;

    if (!targetPriceId) {
      throw new AppError(`Stripe price is not configured for ${targetPlan} (${targetInterval})`, 400);
    }

    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    } catch (error) {
      throw new AppError(`Failed to retrieve Stripe subscription: ${stripeErrorMessage(error)}`, 400);
    }

    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      throw new AppError('Active Stripe subscription does not contain a subscription item', 400);
    }

    let updatedSubscription;
    try {
      updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{ id: subscriptionItemId, price: targetPriceId }],
        proration_behavior: 'create_prorations',
        ...(requestedProrationDate === undefined ? {} : { proration_date: requestedProrationDate }),
      });
    } catch (error) {
      throw new AppError(`Failed to update Stripe subscription: ${stripeErrorMessage(error)}`, 400);
    }

    const updatedPeriodEndUnix = updatedSubscription.items.data[0]?.current_period_end;
    if (!updatedPeriodEndUnix) {
      throw new AppError('Updated Stripe subscription did not return a valid billing period end', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        currentPlan: targetPlan,
        planInterval: targetInterval,
        currentPeriodEnd: new Date(updatedPeriodEndUnix * 1000),
        cancelAtPeriodEnd: false,
      },
      select: {
        currentPlan: true,
        planInterval: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    return res.json({
      status: 'success',
      message: `Subscription successfully updated to ${targetPlan} (${targetInterval})`,
      data: {
        plan: updatedUser.currentPlan,
        interval: updatedUser.planInterval,
        currentPeriodEnd: updatedUser.currentPeriodEnd,
        cancelAtPeriodEnd: updatedUser.cancelAtPeriodEnd,
        stripeSubscriptionStatus: updatedSubscription.status,
      },
    });
  })
);

export default router;
