import { PrismaClient } from '@prisma/client';
import { DatabaseReplicationManager } from './databaseReplication';

const primaryPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const dbReplicationManager = new DatabaseReplicationManager(primaryPrisma);

// 100% backward-compatible direct export: existing code, migrations, and transactions continue using primary
export const prisma = primaryPrisma;

// Dedicated multi-region routing helpers
export const getReadClient = (region?: string): PrismaClient => dbReplicationManager.getReadClient(region);
export const getWriteClient = (): PrismaClient => dbReplicationManager.getWriteClient();
export const executeRead = <T>(op: (client: PrismaClient) => Promise<T>, region?: string): Promise<T> =>
  dbReplicationManager.executeRead(op, region);

export default prisma;