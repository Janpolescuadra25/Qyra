import { Router } from 'express';
import { asyncHandler, AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { stripe, isStripeConfigured } from '../lib/stripe';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware';

const router = Router();

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

export default router;
