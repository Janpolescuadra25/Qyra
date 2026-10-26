import express from 'express';
import request from 'supertest';
import { createErrorHandler } from '../src/lib/errors';
import checkoutRouter from '../src/routes/checkout';

var mockUser: any;
var stripeCheckoutSessionCreate: jest.Mock;
var prismaUserFindUnique: jest.Mock;

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

jest.mock('../src/lib/prisma', () => {
  prismaUserFindUnique = jest.fn();

  return {
    prisma: {
      user: {
        findUnique: prismaUserFindUnique,
        update: jest.fn(),
      },
    },
  };
});

jest.mock('../src/lib/stripe', () => {
  stripeCheckoutSessionCreate = jest.fn();

  return {
    __esModule: true,
    isStripeConfigured: true,
    stripe: {
      checkout: { sessions: { create: stripeCheckoutSessionCreate } },
      customers: { create: jest.fn() },
      billingPortal: { sessions: { create: jest.fn() } },
    },
    PLANS: {
      free: { monthlyPriceId: undefined, annualPriceId: undefined },
      starter: { monthlyPriceId: 'price_starter_month', annualPriceId: 'price_starter_year' },
      professional: { monthlyPriceId: 'price_professional_month', annualPriceId: 'price_professional_year' },
      premium: { monthlyPriceId: 'price_premium_month', annualPriceId: 'price_premium_year' },
      enterprise: { monthlyPriceId: 'price_enterprise_month', annualPriceId: 'price_enterprise_year' },
    },
    getScanPack: (key: string) => key === 'scan_pack_100'
      ? {
          id: 'scan_pack_100',
          name: '100 Scan Pack',
          scans: 100,
          price: 19,
          stripePriceId: 'price_scan_pack_100',
          description: '100 bonus scans',
        }
      : undefined,
    getScanPacks: () => [],
  };
});

describe('Deliverable 12.4 checkout payment methods', () => {
  let app: express.Application;
  const expectedPaymentMethodTypes = ['card', 'paypal'];

  beforeAll(() => {
    process.env.FRONTEND_URL = 'https://qyra.space';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      userId: 'owner-user-123',
      email: 'owner@qyra.space',
      role: 'OWNER',
      adminId: null,
    };
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      stripeCustomerId: 'cus_test_123',
      stripeSubscriptionId: null,
      subscriptionSource: null,
      managedById: null,
    });
    stripeCheckoutSessionCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });

    app = express();
    app.use(express.json());
    app.use('/api/checkout', checkoutRouter);
    app.use(createErrorHandler());
  });

  it('creates subscription Checkout with card wallets and PayPal enabled', async () => {
    const response = await request(app)
      .post('/api/checkout/create-session')
      .send({ plan: 'starter', interval: 'month' });

    expect(response.status).toBe(200);
    expect(response.body.url).toContain('checkout.stripe.com');
    expect(stripeCheckoutSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'subscription',
      payment_method_types: expectedPaymentMethodTypes,
    }));
  });

  it('creates scan-pack Checkout with card wallets and PayPal enabled', async () => {
    const response = await request(app)
      .post('/api/checkout/create-scan-pack-session')
      .send({ scanPack: 'scan_pack_100' });

    expect(response.status).toBe(200);
    expect(response.body.url).toContain('checkout.stripe.com');
    expect(stripeCheckoutSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'payment',
      payment_method_types: expectedPaymentMethodTypes,
    }));
  });

  it('returns the standard 500 response when subscription Checkout creation fails', async () => {
    stripeCheckoutSessionCreate.mockRejectedValue(new Error('Stripe subscription Checkout failure'));

    const response = await request(app)
      .post('/api/checkout/create-session')
      .send({ plan: 'starter', interval: 'month' });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Stripe subscription Checkout failure');
  });

  it('returns the standard 500 response when scan-pack Checkout creation fails', async () => {
    stripeCheckoutSessionCreate.mockRejectedValue(new Error('Stripe scan-pack Checkout failure'));

    const response = await request(app)
      .post('/api/checkout/create-scan-pack-session')
      .send({ scanPack: 'scan_pack_100' });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Stripe scan-pack Checkout failure');
  });
});
