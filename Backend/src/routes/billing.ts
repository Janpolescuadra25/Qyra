import { Router } from 'express';
import { asyncHandler, AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
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

export default router;
