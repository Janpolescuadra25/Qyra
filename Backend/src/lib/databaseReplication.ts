import { PrismaClient } from '@prisma/client';

export type SupportedRegion = 'us-east' | 'us-west' | 'eu-west' | 'ap-southeast';

export interface ReplicaConfig {
  region: SupportedRegion;
  url: string;
  isHealthy: boolean;
  latencyMs: number;
  lastChecked: Date;
}

export interface ClusterStatus {
  primaryHealthy: boolean;
  activeReplicas: number;
  totalReplicas: number;
  replicationEnabled: boolean;
  regions: Record<string, { healthy: boolean; latencyMs: number }>;
}

export class DatabaseReplicationManager {
  private primaryClient: PrismaClient;
  private replicaClients: Map<SupportedRegion, PrismaClient> = new Map();
  private replicaConfigs: Map<SupportedRegion, ReplicaConfig> = new Map();
  private replicationEnabled: boolean = false;
  private defaultRegion: SupportedRegion = 'us-east';

  constructor(primaryClient: PrismaClient) {
    this.primaryClient = primaryClient;
    this.initializeReplicas();
  }

  private initializeReplicas(): void {
    const isEnabled = process.env.DATABASE_REPLICATION_ENABLED === 'true';
    this.replicationEnabled = isEnabled;
    this.defaultRegion = (process.env.DATABASE_DEFAULT_REGION as SupportedRegion) || 'us-east';

    const regionalEnvMap: Record<SupportedRegion, string | undefined> = {
      'us-east': process.env.DATABASE_REPLICA_US_EAST_URL,
      'us-west': process.env.DATABASE_REPLICA_US_WEST_URL,
      'eu-west': process.env.DATABASE_REPLICA_EU_WEST_URL,
      'ap-southeast': process.env.DATABASE_REPLICA_AP_SOUTHEAST_URL,
    };

    for (const [region, url] of Object.entries(regionalEnvMap) as [SupportedRegion, string | undefined][]) {
      if (url && url.trim().length > 0) {
        try {
          const connectionUrl = url.includes('?') 
            ? `${url}&connection_limit=10` 
            : `${url}?connection_limit=10`;

          const client = new PrismaClient({
            datasources: { db: { url: connectionUrl } },
          });

          this.replicaClients.set(region, client);
          this.replicaConfigs.set(region, {
            region,
            url,
            isHealthy: true,
            latencyMs: 0,
            lastChecked: new Date(),
          });
        } catch (error) {
          console.error(`[DatabaseReplication] Failed to initialize replica for region ${region}:`, error);
        }
      }
    }
  }

  public getWriteClient(): PrismaClient {
    return this.primaryClient;
  }

  public getReadClient(preferredRegion?: string): PrismaClient {
    if (!this.replicationEnabled || this.replicaClients.size === 0) {
      return this.primaryClient;
    }

    if (preferredRegion && this.replicaClients.has(preferredRegion as SupportedRegion)) {
      const config = this.replicaConfigs.get(preferredRegion as SupportedRegion);
      if (config && config.isHealthy) {
        const client = this.replicaClients.get(preferredRegion as SupportedRegion);
        if (client) return client;
      }
    }

    if (this.replicaClients.has(this.defaultRegion)) {
      const defaultConfig = this.replicaConfigs.get(this.defaultRegion);
      if (defaultConfig && defaultConfig.isHealthy) {
        const defaultClient = this.replicaClients.get(this.defaultRegion);
        if (defaultClient) return defaultClient;
      }
    }

    for (const [region, client] of this.replicaClients.entries()) {
      const config = this.replicaConfigs.get(region);
      if (config && config.isHealthy) {
        return client;
      }
    }

    return this.primaryClient;
  }

  public assertWriteOperation(operation: string): void {
    const forbidden = ['create', 'update', 'delete', 'upsert', '$executeRaw', '$transaction'];
    const lower = operation.toLowerCase();
    for (const term of forbidden) {
      if (lower.includes(term.toLowerCase())) {
        throw new Error(`Write operation [${operation}] is strictly forbidden on read replicas.`);
      }
    }
  }

  public async executeRead<T>(
    operation: (client: PrismaClient) => Promise<T>,
    preferredRegion?: string
  ): Promise<T> {
    const client = this.getReadClient(preferredRegion);
    try {
      return await operation(client);
    } catch (error) {
      if (client !== this.primaryClient) {
        console.warn('[DatabaseReplication] Read replica query failed. Falling back to primary.', error);
        return await operation(this.primaryClient);
      }
      throw error;
    }
  }

  public async checkHealth(): Promise<ClusterStatus> {
    let primaryHealthy = false;
    try {
      await this.primaryClient.$queryRaw`SELECT 1`;
      primaryHealthy = true;
    } catch (err) {
      console.error('[DatabaseReplication] Primary database health check failed:', err);
      primaryHealthy = false;
    }

    let activeReplicas = 0;
    const regions: Record<string, { healthy: boolean; latencyMs: number }> = {};

    for (const [region, client] of this.replicaClients.entries()) {
      const config = this.replicaConfigs.get(region);
      const start = Date.now();
      try {
        await client.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;
        if (config) {
          config.isHealthy = true;
          config.latencyMs = latency;
          config.lastChecked = new Date();
        }
        activeReplicas++;
        regions[region] = { healthy: true, latencyMs: latency };
      } catch (err) {
        if (config) {
          config.isHealthy = false;
          config.latencyMs = -1;
          config.lastChecked = new Date();
        }
        regions[region] = { healthy: false, latencyMs: -1 };
      }
    }

    return {
      primaryHealthy,
      activeReplicas,
      totalReplicas: this.replicaClients.size,
      replicationEnabled: this.replicationEnabled,
      regions,
    };
  }
}