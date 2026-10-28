import request from 'supertest';
import express from 'express';
import { createErrorHandler } from '../src/lib/errors';
import billingRouter from '../src/routes/billing';
import adminRouter from '../src/routes/admin';
import {
  computePlanMRR,
  getSubscriptionMetrics,
  getChurnMetrics,
} from '../src/services/subscriptionMetrics';

let mockUser: any;

jest.mock('../src/lib/prisma', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    subscriptionEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return { prisma: prismaMock };
});

jest.mock('../src/lib/stripe', () => {
  const stripeMock = {
    subscriptions: {
      update: jest.fn().mockResolvedValue({ id: 'sub_123' }),
    },
  };

  return {
    __esModule: true,
    stripe: stripeMock,
    isStripeConfigured: true,
    PLANS: {
      free: { monthlyPrice: 0, annualPrice: 0 },
      starter: { monthlyPrice: 19, annualPrice: 15 },
      professional: { monthlyPrice: 39, annualPrice: 31 },
      premium: { monthlyPrice: 79, annualPrice: 63 },
      enterprise: { monthlyPrice: 149, annualPrice: 119 },
    },
  };
});

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
  requireRole: (...allowed: string[]) => (req: any, res: any, next: any) => {
    if (allowed.includes(req.user?.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  },
}));

describe('Deliverable 12.6: Advanced subscription metrics & churn telemetry', () => {
  const prismaMock = jest.requireMock('../src/lib/prisma').prisma;
  const stripeModule = jest.requireMock('../src/lib/stripe');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      userId: 'owner-user-123',
      role: 'OWNER',
      adminId: null,
    };
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.subscriptionEvent.create.mockResolvedValue({ id: 'telemetry-event-1' });
    prismaMock.subscriptionEvent.findMany.mockResolvedValue([]);
    stripeModule.stripe.subscriptions.update.mockResolvedValue({ id: 'sub_123' });
  });

  it('computes annual and monthly MRR from the configured plan pricing constants', () => {
    expect(computePlanMRR('starter', 'month')).toBe(19);
    expect(computePlanMRR('starter', 'year')).toBe(15);
    expect(computePlanMRR('professional', 'annual')).toBe(31);
    expect(computePlanMRR('enterprise', 'yearly')).toBe(119);
    expect(computePlanMRR('free', 'month')).toBe(0);
  });

  it('aggregates MRR, ARR, and plan distribution across active subscribers', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { currentPlan: 'starter', planInterval: 'month', cancelAtPeriodEnd: false },
      { currentPlan: 'professional', planInterval: 'year', cancelAtPeriodEnd: false },
      { currentPlan: 'premium', planInterval: 'month', cancelAtPeriodEnd: true },
      { currentPlan: 'free', planInterval: 'month', cancelAtPeriodEnd: false },
    ]);

    const metrics = await getSubscriptionMetrics();

    expect(metrics.mrr).toBe(19 + 31);
    expect(metrics.arr).toBe((19 + 31) * 12);
    expect(metrics.totalSubscribers).toBe(2);
    expect(metrics.scheduledCancellations).toBe(1);
    expect(metrics.planBreakdown.starter.month).toBe(1);
    expect(metrics.planBreakdown.professional.year).toBe(1);
    expect(metrics.planBreakdown.premium.total).toBe(1);
    expect(metrics.planBreakdown.premium.mrr).toBe(0);
  });

  it('calculates churn rate and reason breakdown from recorded cancellations', async () => {
    prismaMock.subscriptionEvent.findMany.mockResolvedValue([
      { reason: 'too_expensive' },
      { reason: 'missing_features' },
      { reason: 'too_expensive' },
      { reason: 'other' },
    ]);

    const churn = await getChurnMetrics(30);

    expect(churn.windowDays).toBe(30);
    expect(churn.totalCancellations).toBe(4);
    expect(churn.reasonBreakdown.too_expensive).toBe(2);
    expect(churn.reasonBreakdown.missing_features).toBe(1);
    expect(churn.reasonBreakdown.other).toBe(1);
    expect(churn.churnRate).toBeGreaterThanOrEqual(0);
  });

  it('records structured cancellation reasons and feedback for end-of-period cancellations', async () => {
    const currentPeriodEnd = new Date('2026-12-31T00:00:00.000Z');
    const app = express();
    app.use(express.json());
    app.use('/api/billing', billingRouter);
    app.use(createErrorHandler());

    prismaMock.user.findUnique
      .mockResolvedValueOnce({
        id: 'owner-user-123',
        stripeSubscriptionId: 'sub_123',
        cancelAtPeriodEnd: false,
        currentPeriodEnd,
      })
      .mockResolvedValueOnce({
        currentPlan: 'starter',
        planInterval: 'month',
      });

    prismaMock.user.update
      .mockResolvedValueOnce({ cancelAtPeriodEnd: true, currentPeriodEnd })
      .mockResolvedValueOnce({ cancellationReason: 'too_expensive', cancellationFeedback: 'Budget changed' });

    const response = await request(app)
      .post('/api/billing/cancel-subscription')
      .send({
        reason: 'too_expensive',
        feedback: 'Budget changed',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(stripeModule.stripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: true,
    });
    expect(prismaMock.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'owner-user-123',
        eventType: 'CANCEL',
        fromPlan: 'starter',
        toPlan: 'starter',
        fromInterval: 'month',
        toInterval: 'month',
        mrrDelta: -19,
        reason: 'too_expensive',
        feedback: 'Budget changed',
      }),
    });
  });

  it('exposes subscription and churn metrics behind owner/admin authorization', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRouter);
    app.use(createErrorHandler());

    prismaMock.user.findMany.mockResolvedValue([
      { currentPlan: 'starter', planInterval: 'month', cancelAtPeriodEnd: false },
      { currentPlan: 'professional', planInterval: 'year', cancelAtPeriodEnd: false },
    ]);
    prismaMock.subscriptionEvent.findMany.mockResolvedValue([
      { reason: 'too_expensive' },
      { reason: 'missing_features' },
    ]);

    const subMetricsResponse = await request(app).get('/api/admin/metrics/subscriptions');
    expect(subMetricsResponse.status).toBe(200);
    expect(subMetricsResponse.body.success).toBe(true);
    expect(subMetricsResponse.body.metrics.mrr).toBe(19 + 31);

    const churnResponse = await request(app).get('/api/admin/metrics/churn');
    expect(churnResponse.status).toBe(200);
    expect(churnResponse.body.success).toBe(true);
    expect(churnResponse.body.churn.totalCancellations).toBe(2);
    expect(churnResponse.body.churn.reasonBreakdown.too_expensive).toBe(1);
  });
});
