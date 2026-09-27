import request from 'supertest';
import express from 'express';
import { createErrorHandler } from '../src/lib/errors';

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = {
      userId: 'user-1',
      role: 'OWNER',
      status: 'ACTIVE',
      blocked: false,
      timeBombAt: null,
      gracePeriodHours: 48,
      permissions: {},
    };
    return next();
  }),
  enforceEffectiveRole: jest.fn((_req: any, _res: any, next: any) => next()),
  requireFeaturePermission: () => (_req: any, _res: any, next: any) => next(),
  locationFilter: () => ({}),
}));

jest.mock('../src/services/qb.service', () => ({
  qbService: {
    callQB: jest.fn(),
    getVendors: jest.fn(),
  },
}));

import quickbooksRoute from '../src/routes/quickbooks';

describe('GET /quickbooks/vendors', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/quickbooks', quickbooksRoute);
    app.use(createErrorHandler());
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .get('/api/quickbooks/vendors');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 400 when QuickBooks is not connected', async () => {
    const { qbService } = require('../src/services/qb.service');
    qbService.callQB.mockRejectedValue(new Error('No active QuickBooks connection found')); 

    const res = await request(app)
      .get('/api/quickbooks/vendors')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('QuickBooks account not connected');
  });

  it('returns vendors when the user is connected to QuickBooks', async () => {
    const { qbService } = require('../src/services/qb.service');
    qbService.callQB.mockResolvedValue([
      { Id: 'vendor-1', DisplayName: 'Acme Supply', Active: true },
      { Id: 'vendor-2', DisplayName: 'Northwind', Active: true },
    ]);

    const res = await request(app)
      .get('/api/quickbooks/vendors')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.vendors)).toBe(true);
    expect(res.body.vendors).toHaveLength(2);
    expect(res.body.vendors[0].DisplayName).toBe('Acme Supply');
  });
});
