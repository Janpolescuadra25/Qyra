import request from 'supertest';
import express from 'express';

const mockDeliveryLog = {
  id: 'log_test_123',
  eventType: 'customer.subscription.updated',
  status: 'FAILED',
  payload: { id: 'evt_test_123', type: 'customer.subscription.updated' },
  errorMessage: 'Test error',
  receivedAt: new Date(),
  processedAt: null,
};

const mockPrisma = {
  webhookDeliveryLog: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  stripeEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../src/lib/prisma', () => ({
  prisma: mockPrisma,
}));

let mockUserRole = 'ADMIN';
let mockAuthUserId = 'admin-user-id';
let mockIsAuthenticated = true;

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    if (!mockIsAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = { id: mockAuthUserId, role: mockUserRole };
    next();
  }),
  requireRole: (...allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      next();
    };
  },
}));

jest.mock('../src/lib/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }),
  },
}));

import webhookRouter from '../src/routes/webhooks';

const app = express();
app.use(express.json());
app.use('/api/webhooks', webhookRouter);

describe('Webhook Replay & Alerting Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole = 'ADMIN';
    mockAuthUserId = 'admin-user-id';
    mockIsAuthenticated = true;
  });

  describe('POST /api/webhooks/replay/:deliveryLogId', () => {
    it('returns 401 when request is unauthenticated', async () => {
      mockIsAuthenticated = false;

      const res = await request(app).post('/api/webhooks/replay/log_test_123');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 403 when user does not have ADMIN, OWNER, or MANAGER role', async () => {
      mockUserRole = 'MEMBER';

      const res = await request(app).post('/api/webhooks/replay/log_test_123');
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('allows MANAGER role to replay an existing delivery log', async () => {
      mockUserRole = 'MANAGER';
      mockPrisma.webhookDeliveryLog.findUnique.mockResolvedValue(mockDeliveryLog);
      mockPrisma.webhookDeliveryLog.update.mockResolvedValue({
        ...mockDeliveryLog,
        status: 'SUCCESS',
        errorMessage: null,
      });

      const res = await request(app).post('/api/webhooks/replay/log_test_123');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.eventType).toBe('customer.subscription.updated');
    });

    it('returns 404 when deliveryLog is not found', async () => {
      mockPrisma.webhookDeliveryLog.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/webhooks/replay/log_non_existent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Webhook delivery log not found');
      expect(mockPrisma.webhookDeliveryLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log_non_existent' },
      });
    });

    it('successfully replays failed webhook log and updates status for ADMIN', async () => {
      mockPrisma.webhookDeliveryLog.findUnique.mockResolvedValue(mockDeliveryLog);
      mockPrisma.webhookDeliveryLog.update.mockResolvedValue({
        ...mockDeliveryLog,
        status: 'SUCCESS',
        errorMessage: null,
      });

      const res = await request(app).post('/api/webhooks/replay/log_test_123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deliveryLogId).toBe('log_test_123');
      expect(mockPrisma.webhookDeliveryLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'log_test_123' },
          data: expect.objectContaining({
            status: 'SUCCESS',
            errorMessage: null,
          }),
        }),
      );
    });
  });
});
