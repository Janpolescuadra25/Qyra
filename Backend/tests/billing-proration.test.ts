import express from 'express';
import request from 'supertest';
import { createErrorHandler } from '../src/lib/errors';
import billingRouter from '../src/routes/billing';

var mockUser: any;
var stripeConfigured = true;
var prismaUserFindUnique: jest.Mock;
var prismaUserUpdate: jest.Mock;
var stripeSubscriptionsRetrieve: jest.Mock;
var stripeSubscriptionsUpdate: jest.Mock;
var stripeInvoicesCreatePreview: jest.Mock;

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
  stripeSubscriptionsRetrieve = jest.fn();
  stripeSubscriptionsUpdate = jest.fn();
  stripeInvoicesCreatePreview = jest.fn();

  return {
    __esModule: true,
    PLANS: {
      starter: { monthlyPriceId: 'price_starter_month', annualPriceId: 'price_starter_year' },
      professional: { monthlyPriceId: 'price_professional_month', annualPriceId: 'price_professional_year' },
      premium: { monthlyPriceId: 'price_premium_month', annualPriceId: 'price_premium_year' },
      enterprise: { monthlyPriceId: 'price_enterprise_month', annualPriceId: 'price_enterprise_year' },
    },
    stripe: {
      subscriptions: {
        retrieve: stripeSubscriptionsRetrieve,
        update: stripeSubscriptionsUpdate,
      },
      invoices: {
        createPreview: stripeInvoicesCreatePreview,
      },
    },
    get isStripeConfigured() {
      return stripeConfigured;
    },
  };
});

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if (!mockUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = mockUser;
    next();
  },
}));

describe('Deliverable 12.3 billing proration and plan changes', () => {
  let app: express.Application;

  const activeAccount = {
    id: 'owner-user-123',
    currentPlan: 'starter',
    planInterval: 'month',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    stripeConfigured = true;
    mockUser = { userId: 'owner-user-123', role: 'OWNER', adminId: null };
    prismaUserFindUnique.mockResolvedValue(activeAccount);
    stripeSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_123',
      items: { data: [{ id: 'si_123', current_period_end: 1798761600 }] },
    });

    app = express();
    app.use(express.json());
    app.use('/api/billing', billingRouter);
    app.use(createErrorHandler());
  });

  describe('GET /api/billing/preview-proration', () => {
    it('requires authentication', async () => {
      mockUser = null;

      const response = await request(app).get('/api/billing/preview-proration?plan=professional');

      expect(response.status).toBe(401);
      expect(stripeSubscriptionsRetrieve).not.toHaveBeenCalled();
    });

    it('enforces owner or team-admin billing authority', async () => {
      mockUser = { userId: 'member-1', role: 'USER', adminId: 'owner-user-123' };

      const response = await request(app).get('/api/billing/preview-proration?plan=professional');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only organization admins');
    });

    it('blocks direct transitions to the free tier', async () => {
      const response = await request(app).get('/api/billing/preview-proration?plan=free');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('/api/billing/cancel-subscription');
    });

    it('rejects unchanged plan and interval combinations', async () => {
      const response = await request(app).get('/api/billing/preview-proration?plan=starter&interval=monthly');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('identical');
    });

    it('rejects accounts without a complete active Stripe subscription mapping', async () => {
      prismaUserFindUnique.mockResolvedValue({ ...activeAccount, stripeCustomerId: null });

      const response = await request(app).get('/api/billing/preview-proration?plan=professional');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('active Stripe subscription');
    });

    it('returns a current-SDK invoice preview and reusable proration timestamp', async () => {
      stripeInvoicesCreatePreview.mockResolvedValue({
        amount_due: 1500,
        subtotal: 1500,
        total: 1500,
        currency: 'usd',
        next_payment_attempt: 1798761600,
        lines: {
          data: [{
            id: 'il_1',
            description: 'Prorated plan change',
            amount: 1500,
            parent: {
              subscription_item_details: { proration: true },
              invoice_item_details: null,
            },
            period: { start: 1796083200, end: 1798761600 },
          }],
        },
      });

      const response = await request(app)
        .get('/api/billing/preview-proration?plan=professional&interval=annual');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(expect.objectContaining({
        currentPlan: 'starter',
        currentInterval: 'month',
        targetPlan: 'professional',
        targetInterval: 'year',
        amountDue: 1500,
        currency: 'usd',
        prorationDate: expect.any(Number),
      }));
      expect(response.body.data.lines[0].proration).toBe(true);
      expect(stripeInvoicesCreatePreview).toHaveBeenCalledWith({
        customer: 'cus_123',
        subscription: 'sub_123',
        subscription_details: {
          items: [{ id: 'si_123', price: 'price_professional_year' }],
          proration_behavior: 'create_prorations',
          proration_date: response.body.data.prorationDate,
        },
      });
    });

    it('wraps Stripe preview failures as client-safe 400 errors', async () => {
      stripeInvoicesCreatePreview.mockRejectedValue(new Error('preview unavailable'));

      const response = await request(app).get('/api/billing/preview-proration?plan=premium');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Failed to calculate Stripe proration preview');
    });
  });

  describe('POST /api/billing/change-plan', () => {
    it('fails closed when Stripe is not configured', async () => {
      stripeConfigured = false;

      const response = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'professional' });

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('not configured');
    });

    it('validates plan, interval, and direct free-tier requests', async () => {
      const invalidPlan = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'pro' });
      const invalidInterval = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'professional', interval: 'weekly' });
      const freePlan = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'free' });

      expect(invalidPlan.status).toBe(400);
      expect(invalidInterval.status).toBe(400);
      expect(freePlan.status).toBe(400);
      expect(freePlan.body.error).toContain('cancellation');
    });

    it('rejects Stripe subscriptions without a subscription item', async () => {
      stripeSubscriptionsRetrieve.mockResolvedValue({ id: 'sub_123', items: { data: [] } });

      const response = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'premium' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('subscription item');
      expect(stripeSubscriptionsUpdate).not.toHaveBeenCalled();
    });

    it('updates Stripe and synchronizes the canonical local billing fields', async () => {
      const updatedPeriodEnd = new Date(1798761600 * 1000);
      stripeSubscriptionsUpdate.mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        items: { data: [{ id: 'si_123', current_period_end: 1798761600 }] },
      });
      prismaUserUpdate.mockResolvedValue({
        currentPlan: 'professional',
        planInterval: 'month',
        currentPeriodEnd: updatedPeriodEnd,
        cancelAtPeriodEnd: false,
      });

      const response = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'professional', prorationDate: 1796083200 });

      expect(response.status).toBe(200);
      expect(stripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
        items: [{ id: 'si_123', price: 'price_professional_month' }],
        proration_behavior: 'create_prorations',
        proration_date: 1796083200,
      });
      expect(prismaUserUpdate).toHaveBeenCalledWith({
        where: { id: 'owner-user-123' },
        data: {
          currentPlan: 'professional',
          planInterval: 'month',
          currentPeriodEnd: updatedPeriodEnd,
          cancelAtPeriodEnd: false,
        },
        select: {
          currentPlan: true,
          planInterval: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      });
      expect(response.body.data).toEqual(expect.objectContaining({
        plan: 'professional',
        interval: 'month',
        cancelAtPeriodEnd: false,
        stripeSubscriptionStatus: 'active',
      }));
    });

    it('supports interval-only switches and stores the repository canonical interval', async () => {
      stripeSubscriptionsUpdate.mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        items: { data: [{ id: 'si_123', current_period_end: 1830297600 }] },
      });
      prismaUserUpdate.mockResolvedValue({
        currentPlan: 'starter',
        planInterval: 'year',
        currentPeriodEnd: new Date(1830297600 * 1000),
        cancelAtPeriodEnd: false,
      });

      const response = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'starter', interval: 'annual' });

      expect(response.status).toBe(200);
      expect(stripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
        items: [{ id: 'si_123', price: 'price_starter_year' }],
        proration_behavior: 'create_prorations',
      });
      expect(prismaUserUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ planInterval: 'year' }),
      }));
    });

    it('wraps Stripe retrieval and update errors as 400 responses without local writes', async () => {
      stripeSubscriptionsRetrieve.mockRejectedValueOnce(new Error('retrieve failed'));
      const retrieveFailure = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'professional' });

      stripeSubscriptionsRetrieve.mockResolvedValueOnce({
        id: 'sub_123',
        items: { data: [{ id: 'si_123', current_period_end: 1798761600 }] },
      });
      stripeSubscriptionsUpdate.mockRejectedValueOnce(new Error('update failed'));
      const updateFailure = await request(app)
        .post('/api/billing/change-plan')
        .send({ plan: 'professional' });

      expect(retrieveFailure.status).toBe(400);
      expect(retrieveFailure.body.error).toContain('Failed to retrieve Stripe subscription');
      expect(updateFailure.status).toBe(400);
      expect(updateFailure.body.error).toContain('Failed to update Stripe subscription');
      expect(prismaUserUpdate).not.toHaveBeenCalled();
    });
  });
});
