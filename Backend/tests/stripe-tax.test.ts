import express, { Express } from 'express';
import request from 'supertest';
import { createErrorHandler } from '../src/lib/errors';
import checkoutRouter from '../src/routes/checkout';

process.env.FRONTEND_URL = 'https://qyra.space';

var mockUser: any;
var stripeCheckoutSessionCreate: jest.Mock;
var prismaUserFindUnique: jest.Mock;

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

jest.mock('../src/lib/stripe', () => {
  stripeCheckoutSessionCreate = jest.fn();
  return {
    __esModule: true,
    isStripeConfigured: true,
    stripe: { checkout: { sessions: { create: (...args: any[]) => stripeCheckoutSessionCreate(...args) } } },
    PLANS: {
      starter: { monthlyPriceId: 'price_starter_mo', annualPriceId: 'price_starter_yr' },
      professional: { monthlyPriceId: 'price_pro_mo', annualPriceId: 'price_pro_yr' },
      premium: { monthlyPriceId: 'price_prem_mo', annualPriceId: 'price_prem_yr' },
      enterprise: { monthlyPriceId: 'price_ent_mo', annualPriceId: 'price_ent_yr' },
    },
    getScanPack: () => ({ id: 'scan_pack_100', name: 'Scan Pack 100', stripePriceId: 'price_pack_100', scans: 100 }),
  };
});

jest.mock('../src/lib/prisma', () => {
  prismaUserFindUnique = jest.fn();
  return {
    __esModule: true,
    prisma: {
      user: { findUnique: (...args: any[]) => prismaUserFindUnique(...args) },
      subscription: { findUnique: jest.fn().mockResolvedValue(null) },
    },
  };
});

describe('Stripe checkout tax enforcement', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { userId: 'owner-user-123', email: 'owner@qyra.space', role: 'OWNER', adminId: null };
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123', email: 'owner@qyra.space', role: 'OWNER', stripeCustomerId: 'cus_test123', subscription: null,
    });
    stripeCheckoutSessionCreate.mockResolvedValue({ id: 'cs_test_tax_123', url: 'https://checkout.stripe.com/pay/cs_test_tax_123' });
    app = express();
    app.use(express.json());
    app.use('/api/checkout', checkoutRouter);
    app.use(createErrorHandler());
  });

  const expectTaxConfiguration = () => {
    expect(stripeCheckoutSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
    }));
  };

  it('enforces tax configuration for monthly subscription checkout', async () => {
    const res = await request(app).post('/api/checkout/create-session').send({ plan: 'starter', interval: 'month' });
    expect(res.status).toBe(200);
    expectTaxConfiguration();
  });

  it('enforces tax configuration for annual subscription checkout', async () => {
    const res = await request(app).post('/api/checkout/create-session').send({ plan: 'professional', interval: 'year' });
    expect(res.status).toBe(200);
    expectTaxConfiguration();
  });

  it('enforces tax configuration for scan-pack checkout', async () => {
    const res = await request(app).post('/api/checkout/create-scan-pack-session').send({ scanPack: 'scan_pack_100' });
    expect(res.status).toBe(200);
    expectTaxConfiguration();
  });

  it('rejects non-owner and non-admin billing access for subscription checkout', async () => {
    mockUser = { userId: 'member-user-456', email: 'member@qyra.space', role: 'MANAGER', adminId: 'owner-user-123' };
    prismaUserFindUnique.mockResolvedValue({
      id: 'owner-user-123',
      email: 'owner@qyra.space',
      role: 'OWNER',
      stripeCustomerId: 'cus_test123',
      subscription: null,
    });

    const res = await request(app).post('/api/checkout/create-session').send({ plan: 'starter', interval: 'month' });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Only team owners and admins can initiate checkout');
  });
});
