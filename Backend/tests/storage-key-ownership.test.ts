process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

import request from 'supertest';
import express from 'express';
import { createErrorHandler } from '../src/lib/errors';
import { prisma } from '../src/lib/prisma';
import scanRoutes from '../src/routes/scans';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    location: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    scanRecord: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    attachment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/storage', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getPresignedUrl: jest.fn(),
}));

jest.mock('../src/middleware/auth.middleware', () => {
  const actual = jest.requireActual('../src/middleware/auth.middleware');
  return {
    ...actual,
    authenticate: jest.fn((req: any, _res: any, next: () => void) => {
      req.user = {
        userId: 'user-1',
        adminId: 'admin-1',
        role: 'ADMIN',
        permissions: [],
        status: 'ACTIVE',
        blocked: false,
        timeBombAt: null,
        gracePeriodHours: 0,
      };
      next();
    }),
    requireFeaturePermission: () => (_req: any, _res: any, next: () => void) => next(),
  };
});

jest.mock('../src/middleware/effective-role', () => ({
  enforceEffectiveRole: (_req: any, _res: any, next: () => void) => next(),
}));

jest.mock('../src/middleware/capacity', () => ({
  requireCapacity: () => (_req: any, _res: any, next: () => void) => next(),
  checkStorageQuota: jest.fn(() => true),
}));

describe('Wave W1 Task QF11: Storage Key Ownership & Attachment Defense', () => {
  const mockedPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1', adminId: 'admin-1' });
    mockedPrisma.scanRecord.create.mockResolvedValue({ id: 'scan-1' });
    mockedPrisma.scanRecord.findFirst.mockResolvedValue({ id: 'scan-1', status: 'PENDING', locationId: 'loc-1' });
    mockedPrisma.attachment.findUnique.mockResolvedValue(null);
    mockedPrisma.attachment.findFirst.mockResolvedValue(null);
    mockedPrisma.attachment.create.mockResolvedValue({
      id: 'att-1',
      fileName: 'valid.pdf',
      storageKey: 'tests/qf11/valid.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
    });
  });

  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/scans', scanRoutes);
    app.use(createErrorHandler());
    return app;
  };

  it('creates a scan with a valid attachment storageKey (200/201)', async () => {
    const res = await request(buildApp())
      .post('/api/scans')
      .send({
        locationId: 'loc-1',
        scanDate: new Date().toISOString(),
        rawData: { invoice: 'QF11_VALID' },
        source: 'pos',
        attachment: {
          fileName: 'valid.pdf',
          storageKey: 'tests/qf11/valid_1.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBe('scan-1');
    expect(mockedPrisma.attachment.findUnique).toHaveBeenCalledWith({
      where: { storageKey: 'tests/qf11/valid_1.pdf' },
    });
  });

  it('rejects duplicate attachment storageKey collisions with 409', async () => {
    mockedPrisma.attachment.findUnique.mockResolvedValueOnce({ id: 'att-existing', storageKey: 'tests/qf11/duplicate.pdf' });

    const res = await request(buildApp())
      .post('/api/scans')
      .send({
        locationId: 'loc-1',
        scanDate: new Date().toISOString(),
        rawData: { invoice: 'QF11_DUPLICATE' },
        source: 'pos',
        attachment: {
          fileName: 'duplicate.pdf',
          storageKey: 'tests/qf11/duplicate.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Storage key already in use');
  });

  it('rejects invalid traversal storageKey values with 400', async () => {
    const res = await request(buildApp())
      .post('/api/scans')
      .send({
        locationId: 'loc-1',
        scanDate: new Date().toISOString(),
        rawData: { invoice: 'QF11_BAD_KEY' },
        source: 'pos',
        attachment: {
          fileName: 'evil.pdf',
          storageKey: '../secrets/key',
          fileSize: 256,
          mimeType: 'application/pdf',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid attachment storageKey format or unsafe path/i);
  });

  it('blocks cross-tenant unattached upload ticket hijacking with 403', async () => {
    const crossTenantStorageKey = 'scans/user-2/1690000000-tenant-a-invoice.pdf';
    const res = await request(buildApp())
      .post('/api/scans')
      .send({
        locationId: 'loc-1',
        scanDate: new Date().toISOString(),
        rawData: { invoice: 'QF11_CROSS_TENANT' },
        source: 'pos',
        attachment: {
          fileName: 'stolen.pdf',
          storageKey: crossTenantStorageKey,
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/must belong to your tenant/i);
    expect(mockedPrisma.attachment.create).not.toHaveBeenCalled();
  });

  it('blocks cross-tenant attachment URL access with 404', async () => {
    mockedPrisma.attachment.findFirst.mockResolvedValue(null);

    const res = await request(buildApp())
      .get('/api/scans/scan-42/attachment-url');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Attachment not found');
  });
});
