import { DatabaseReplicationManager } from '../databaseReplication';
import { PrismaClient } from '@prisma/client';

describe('DatabaseReplicationManager Unit Tests', () => {
  let mockPrimaryClient: any;

  beforeEach(() => {
    mockPrimaryClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'usr_1', email: 'test@qyra.space' }]),
        create: jest.fn().mockResolvedValue({ id: 'usr_2', email: 'created@qyra.space' }),
      },
    };
    process.env.DATABASE_REPLICATION_ENABLED = 'false';
    process.env.DATABASE_DEFAULT_REGION = 'us-east';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.DATABASE_REPLICATION_ENABLED;
    delete process.env.DATABASE_DEFAULT_REGION;
    delete process.env.DATABASE_REPLICA_US_EAST_URL;
    delete process.env.DATABASE_REPLICA_EU_WEST_URL;
  });

  it('should return primary client when replication is disabled', () => {
    const manager = new DatabaseReplicationManager(mockPrimaryClient as PrismaClient);
    const client = manager.getReadClient('eu-west');
    expect(client).toBe(mockPrimaryClient);
  });

  it('should return primary client for write operations', () => {
    const manager = new DatabaseReplicationManager(mockPrimaryClient as PrismaClient);
    const client = manager.getWriteClient();
    expect(client).toBe(mockPrimaryClient);
  });

  it('should assert and block write operations on read replicas', () => {
    const manager = new DatabaseReplicationManager(mockPrimaryClient as PrismaClient);
    expect(() => manager.assertWriteOperation('create')).toThrow(
      'Write operation [create] is strictly forbidden on read replicas.'
    );
    expect(() => manager.assertWriteOperation('delete')).toThrow(
      'Write operation [delete] is strictly forbidden on read replicas.'
    );
    expect(() => manager.assertWriteOperation('$transaction')).toThrow(
      'Write operation [$transaction] is strictly forbidden on read replicas.'
    );
    expect(() => manager.assertWriteOperation('findUnique')).not.toThrow();
  });

  it('should execute read queries successfully on the returned client', async () => {
    const manager = new DatabaseReplicationManager(mockPrimaryClient as PrismaClient);
    const result = await manager.executeRead(async (client) => {
      return await client.user.findMany();
    }, 'us-east');

    expect(result).toEqual([{ id: 'usr_1', email: 'test@qyra.space' }]);
    expect(mockPrimaryClient.user.findMany).toHaveBeenCalledTimes(1);
  });

  it('should check cluster health and report primary status', async () => {
    const manager = new DatabaseReplicationManager(mockPrimaryClient as PrismaClient);
    const health = await manager.checkHealth();

    expect(health.primaryHealthy).toBe(true);
    expect(health.replicationEnabled).toBe(false);
    expect(health.totalReplicas).toBe(0);
  });
});