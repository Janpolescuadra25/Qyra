import { Router, Request, Response } from 'express';
import { dbReplicationManager } from '../lib/prisma';

export const healthRouter = Router();

healthRouter.get('/db-replication', async (req: Request, res: Response) => {
  try {
    const status = await dbReplicationManager.checkHealth();
    return res.status(status.primaryHealthy ? 200 : 503).json({
      status: status.primaryHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      cluster: status,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Failed to inspect cluster health',
    });
  }
});