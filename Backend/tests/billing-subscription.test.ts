import request from 'supertest';
import express from 'express';
import { createErrorHandler } from '../src/lib/errors';
import billingRouter from '../src/routes/billing';

var mockUser: any;
var stripeConfigured = true;
var prismaUserFindUnique: jest.Mock;
var prismaUserUpdate: jest.Mock;
var stripeSubscriptionsUpdate: jest.Mock;

jest.mock('../src/lib/prisma', () => {
  prismaUserFindUnique = jest.fn();
  prismaUserUpdate = jest.fn();

  return {
    prisma: {
      user: {
        findUnique: prismaUserFindUnique,
        update: prismaUserUpdate,
      },
    },
  };
});

jest.mock('../src/lib/stripe', () => {
  stripeSubscriptionsUpdate = jest.fn();

  return {
    __esModule: true,
    stripe: {
      subscriptions: {
        update: stripeSubscriptionsUpdate,
      },
    },
    get isStripeConfigured() {
      return stripeConfigured;
    },
  };
});

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

describe('Deliverable 12.2 billing lifecycle endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    stripeConfigured = true;
    mockUser = {
      userId: 'owner-user-123',
      role: 'OWNER',
      adminId: null,
    };
    prismaUserFindUnique.mockResolvedValue(null);
    prismaUserUpdate.mockResolvedValue({ cancelAtPeriodEnd: false, currentPeriodEnd: null });
    stripeSubscriptionsUpdate.mockResolvedValue({ id: 'sub_123' });

    app = express();
    app.use(express.json());
    app.use('/api/billing', billingRouter);
    app.use(createErrorHandler());
  });

  it('POST /api/billing/cancel-subscription schedules end-of-period cancellation for an owner', async () => {
    const currentPeriodEnd = new Date('2026-12-31T00:00:00.000Z');
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      stripeSubscriptionId: 'sub_123',
      cancelAtPeriodEnd: false,
      currentPeriodEnd,
    });
    prismaUserUpdate.mockResolvedValue({
      cancelAtPeriodEnd: true,
      currentPeriodEnd,
    });

    const response = await request(app).post('/api/billing/cancel-subscription');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('scheduled for cancellation');
    expect(response.body.cancelAtPeriodEnd).toBe(true);
    expect(stripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: true,
    });
    expect(prismaUserUpdate).toHaveBeenCalledWith({
      where: { id: 'owner-user-123' },
      data: { cancelAtPeriodEnd: true },
      select: { cancelAtPeriodEnd: true, currentPeriodEnd: true },
    });
  });

  it('POST /api/billing/cancel-subscription is idempotent when cancellation is already set', async () => {
    const currentPeriodEnd = new Date('2026-12-31T00:00:00.000Z');
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      stripeSubscriptionId: 'sub_123',
      cancelAtPeriodEnd: true,
      currentPeriodEnd,
    });

    const response = await request(app).post('/api/billing/cancel-subscription');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('already scheduled to cancel');
    expect(stripeSubscriptionsUpdate).not.toHaveBeenCalled();
    expect(prismaUserUpdate).not.toHaveBeenCalled();
  });

  it('POST /api/billing/cancel-subscription rejects non-admin members with 403', async () => {
    mockUser = {
      userId: 'member-user-123',
      role: 'USER',
      adminId: 'admin-1',
    };

    const response = await request(app).post('/api/billing/cancel-subscription');

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Only organization admins can modify subscriptions');
  });

  it('POST /api/billing/cancel-subscription fails with 400 when no active Stripe subscription exists', async () => {
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    });

    const response = await request(app).post('/api/billing/cancel-subscription');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('No active subscription found to cancel');
  });

  it('POST /api/billing/cancel-subscription fails with 503 when Stripe is disabled', async () => {
    stripeConfigured = false;

    const response = await request(app).post('/api/billing/cancel-subscription');

    expect(response.status).toBe(503);
    expect(response.body.error).toContain('Stripe billing is not configured in this environment');
  });

  it('POST /api/billing/reactivate-subscription restores renewal for a scheduled cancellation', async () => {
    const currentPeriodEnd = new Date('2026-12-31T00:00:00.000Z');
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      stripeSubscriptionId: 'sub_123',
      cancelAtPeriodEnd: true,
      currentPeriodEnd,
    });
    prismaUserUpdate.mockResolvedValue({
      cancelAtPeriodEnd: false,
      currentPeriodEnd,
    });

    const response = await request(app).post('/api/billing/reactivate-subscription');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('reactivated and scheduled to renew automatically');
    expect(response.body.cancelAtPeriodEnd).toBe(false);
    expect(stripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: false,
    });
    expect(prismaUserUpdate).toHaveBeenCalledWith({
      where: { id: 'owner-user-123' },
      data: { cancelAtPeriodEnd: false },
      select: { cancelAtPeriodEnd: true, currentPeriodEnd: true },
    });
  });

  it('POST /api/billing/reactivate-subscription rejects a non-cancelled subscription with 400', async () => {
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      stripeSubscriptionId: 'sub_123',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date('2026-12-31T00:00:00.000Z'),
    });

    const response = await request(app).post('/api/billing/reactivate-subscription');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Subscription is not currently scheduled for cancellation');
    expect(stripeSubscriptionsUpdate).not.toHaveBeenCalled();
  });

  it('POST /api/billing/reactivate-subscription allows admin role for team-owned subscriptions', async () => {
    mockUser = {
      userId: 'manager-user-1',
      role: 'ADMIN',
      adminId: 'owner-user-123',
    };

    const currentPeriodEnd = new Date('2026-12-31T00:00:00.000Z');
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      stripeSubscriptionId: 'sub_admin_123',
      cancelAtPeriodEnd: true,
      currentPeriodEnd,
    });
    prismaUserUpdate.mockResolvedValue({
      cancelAtPeriodEnd: false,
      currentPeriodEnd,
    });

    const response = await request(app).post('/api/billing/reactivate-subscription');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(prismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: 'owner-user-123' },
      select: {
        id: true,
        stripeSubscriptionId: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    });
  });
});
