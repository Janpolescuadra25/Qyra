import express from 'express';
import request from 'supertest';
import { createErrorHandler } from '../src/lib/errors';

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
  },
  requireFeaturePermission: (_feature: string, _action: string) => (req: any, res: any, next: any) => next(),
  locationFilter: (_user: any) => ({ userId: 'user-1' }),
}));

jest.mock('../src/middleware/effective-role', () => ({
  enforceEffectiveRole: (req: any, res: any, next: any) => next(),
}));

jest.mock('../src/lib/prisma', () => {
  const __prismaMocks = {
    mappingPreset: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
  };
  return {
    __prismaMocks,
    prisma: __prismaMocks,
  };
});

const { prisma } = jest.requireMock('../src/lib/prisma') as any;

function buildApp() {
  const presetsRouter = require('../src/routes/presets').default;
  const app = express();
  app.use(express.json());
  app.use('/api/presets', presetsRouter);
  app.use(createErrorHandler());
  return app;
}

describe('Mapping presets API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.location.findFirst.mockResolvedValue({ id: 'location-1', userId: 'user-1' });
    prisma.mappingPreset.findMany.mockImplementation(async ({ where }: any) => {
      if (where?.isBuiltIn === true) {
        return [{
          id: 'preset-1',
          name: 'Retail',
          isBuiltIn: true,
          locationId: null,
          mappings: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }];
      }
      return [{
        id: 'preset-2',
        name: 'Custom',
        isBuiltIn: false,
        locationId: 'location-1',
        mappings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
    });
  });

  it('returns 401 when no Authorization header is present', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/presets');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('lists built-in and user-accessible custom presets', async () => {
    prisma.mappingPreset.findMany
      .mockResolvedValueOnce([
        { id: 'preset-1', name: 'Retail', isBuiltIn: true, locationId: null, mappings: [], createdAt: new Date(), updatedAt: new Date() },
      ])
      .mockResolvedValueOnce([
        { id: 'preset-2', name: 'Custom', isBuiltIn: false, locationId: 'location-1', mappings: [], createdAt: new Date(), updatedAt: new Date() },
      ]);

    const app = buildApp();
    const res = await request(app)
      .get('/api/presets')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(prisma.mappingPreset.findMany).toHaveBeenCalledTimes(2);
  });

  it('creates a custom preset with valid name and mappings', async () => {
    prisma.mappingPreset.create.mockResolvedValue({
      id: 'preset-3',
      name: 'Ops',
      description: null,
      industry: 'retail',
      isBuiltIn: false,
      mappings: [{ sourceField: 'vendor', targetAccount: 'Account 1' }],
      locationId: 'location-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/presets')
      .set('Authorization', 'Bearer test-token')
      .send({
        locationId: 'location-1',
        name: 'Ops',
        description: 'Business ops',
        industry: 'retail',
        mappings: [{ sourceField: 'vendor', targetAccount: 'Account 1' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Ops');
    expect(res.body.locationId).toBe('location-1');
  });

  it('updates a custom preset but rejects built-in preset updates', async () => {
    prisma.mappingPreset.findUnique.mockResolvedValue({
      id: 'preset-9',
      name: 'Retail',
      isBuiltIn: true,
      locationId: null,
      mappings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = buildApp();
    const res = await request(app)
      .put('/api/presets/preset-9')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Updated Retail' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Built-in presets cannot be modified');
  });

  it('deletes a custom preset but rejects deleting built-in presets', async () => {
    prisma.mappingPreset.findUnique.mockResolvedValue({
      id: 'preset-10',
      name: 'Restaurant',
      isBuiltIn: true,
      locationId: null,
      mappings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = buildApp();
    const res = await request(app)
      .delete('/api/presets/preset-10')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Built-in presets cannot be deleted');
  });

  it('clones a preset into a custom copy', async () => {
    prisma.mappingPreset.findUnique.mockResolvedValue({
      id: 'preset-11',
      name: 'Retail',
      description: 'Base config',
      industry: 'retail',
      isBuiltIn: true,
      mappings: [{ sourceField: 'amount', targetAccount: 'Sales Revenue' }],
      locationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.mappingPreset.create.mockResolvedValue({
      id: 'preset-copy',
      name: 'Retail (Copy)',
      description: 'Base config',
      industry: 'retail',
      isBuiltIn: false,
      mappings: [{ sourceField: 'amount', targetAccount: 'Sales Revenue' }],
      locationId: 'location-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/presets/preset-11/clone')
      .set('Authorization', 'Bearer test-token')
      .send({ locationId: 'location-1' });

    expect(res.status).toBe(201);
    expect(res.body.isBuiltIn).toBe(false);
    expect(res.body.locationId).toBe('location-1');
  });

  it('exports a preset as portable JSON', async () => {
    prisma.mappingPreset.findUnique.mockResolvedValue({
      id: 'preset-12',
      name: 'Restaurant',
      description: 'Dining config',
      industry: 'restaurant',
      isBuiltIn: true,
      mappings: [{ sourceField: 'merchantFees', targetAccount: 'Merchant Fees' }],
      locationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = buildApp();
    const res = await request(app)
      .get('/api/presets/preset-12/export')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(200);
    expect(res.body.version).toBe('1.0');
    expect(res.body.name).toBe('Restaurant');
    expect(Array.isArray(res.body.mappings)).toBe(true);
  });

  it('imports valid preset JSON into a new custom preset', async () => {
    prisma.mappingPreset.create.mockResolvedValue({
      id: 'preset-imported',
      name: 'Imported',
      description: 'Imported config',
      industry: 'professional-services',
      isBuiltIn: false,
      mappings: [{ sourceField: 'hours', targetAccount: 'Consulting Revenue' }],
      locationId: 'location-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/presets/import')
      .set('Authorization', 'Bearer test-token')
      .send({
        locationId: 'location-1',
        name: 'Imported',
        description: 'Imported config',
        industry: 'professional-services',
        version: '1.0',
        mappings: [{ sourceField: 'hours', targetAccount: 'Consulting Revenue' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Imported');
    expect(res.body.isBuiltIn).toBe(false);
  });
});
