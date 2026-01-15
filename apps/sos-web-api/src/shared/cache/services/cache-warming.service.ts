import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ILogger } from '@strengthos/shared-logging';
import { Results } from '@strengthos/shared-utils';

export interface CacheWarmingStrategy {
  name: string;
  priority: number;
  execute(tenantId: string, userId?: string): Promise<Results<void>>;
}

export interface CacheWarmingConfig {
  enabled: boolean;
  strategies: string[];
  batchSize: number;
  delayBetweenBatches: number;
  maxConcurrentWarmups: number;
}

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private strategies: Map<string, CacheWarmingStrategy> = new Map();
  private warmingQueue: Array<{
    tenantId: string;
    userId?: string;
    priority: number;
  }> = [];
  private isWarming = false;
  private warmingInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  onModuleInit() {
    this.startWarmingProcessor();
  }

  // ============================================================================
  // STRATEGY REGISTRATION
  // ============================================================================

  registerStrategy(strategy: CacheWarmingStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.logger.debug({
      message: 'Cache warming strategy registered',
      fullMessage: JSON.stringify({
        name: strategy.name,
        priority: strategy.priority,
      }),
    });
  }

  unregisterStrategy(name: string): void {
    this.strategies.delete(name);
    this.logger.debug({
      message: 'Cache warming strategy unregistered',
      fullMessage: JSON.stringify({ name }),
    });
  }

  // ============================================================================
  // CACHE WARMING OPERATIONS
  // ============================================================================

  async warmCache(
    tenantId: string,
    userId?: string,
    strategies?: string[],
  ): Promise<Results<void>> {
    try {
      const strategiesToExecute =
        strategies || Array.from(this.strategies.keys());

      // Sort strategies by priority
      const sortedStrategies = strategiesToExecute
        .map((name) => this.strategies.get(name))
        .filter(Boolean)
        .sort((a, b) => (b?.priority || 0) - (a?.priority || 0));

      for (const strategy of sortedStrategies) {
        if (strategy) {
          const result = await strategy.execute(tenantId, userId);
          if (!result.isOk) {
            this.logger.warning({
              message: 'Cache warming strategy failed',
              fullMessage: JSON.stringify({
                strategy: strategy.name,
                tenantId,
                userId,
                error: result.message,
              }),
            });
          }
        }
      }

      this.logger.info({
        message: 'Cache warming completed',
        fullMessage: JSON.stringify({
          tenantId,
          userId,
          strategiesExecuted: sortedStrategies.length,
        }),
      });

      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({
        message: 'Cache warming failed',
        fullMessage: JSON.stringify({
          error: (error as Error).message,
          tenantId,
          userId,
        }),
      });
      return Results.fail<void>(null, 'Cache warming failed');
    }
  }

  async queueWarmup(
    tenantId: string,
    userId?: string,
    priority: number = 5,
  ): Promise<Results<void>> {
    try {
      this.warmingQueue.push({ tenantId, userId, priority });

      // Sort queue by priority
      this.warmingQueue.sort((a, b) => b.priority - a.priority);

      this.logger.debug({
        message: 'Cache warmup queued',
        fullMessage: JSON.stringify({
          tenantId,
          userId,
          priority,
          queueLength: this.warmingQueue.length,
        }),
      });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(
        null,
        `Failed to queue cache warmup: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // CRITICAL DATA WARMING
  // ============================================================================

  async warmCriticalData(
    tenantId: string,
    userId?: string,
  ): Promise<Results<void>> {
    try {
      // Warm only high-priority, frequently accessed data
      const criticalStrategies = [
        'user-sessions',
        'user-permissions',
        'tenant-settings',
      ];
      return await this.warmCache(tenantId, userId, criticalStrategies);
    } catch (error) {
      this.logger.error({
        message: 'Critical data warming failed',
        fullMessage: JSON.stringify({
          error: (error as Error).message,
          tenantId,
          userId,
        }),
      });
      return Results.fail<void>(null, 'Critical data warming failed');
    }
  }

  async warmUserData(userId: string, tenantId: string): Promise<Results<void>> {
    try {
      const userStrategies = [
        'user-profile',
        'user-permissions',
        'user-preferences',
      ];
      return await this.warmCache(tenantId, userId, userStrategies);
    } catch (error) {
      return Results.fail<void>(
        null,
        `Failed to warm user data: ${(error as Error).message}`,
      );
    }
  }

  async warmTenantData(tenantId: string): Promise<Results<void>> {
    try {
      const tenantStrategies = [
        'tenant-settings',
        'tenant-users',
        'tenant-subscriptions',
      ];
      return await this.warmCache(tenantId, undefined, tenantStrategies);
    } catch (error) {
      return Results.fail<void>(
        null,
        `Failed to warm tenant data: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // BACKGROUND PROCESSING
  // ============================================================================

  private startWarmingProcessor(): void {
    this.warmingInterval = setInterval(async () => {
      if (!this.isWarming && this.warmingQueue.length > 0) {
        await this.processWarmingQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  private async processWarmingQueue(): Promise<void> {
    if (this.isWarming) return;

    this.isWarming = true;

    try {
      const batchSize = 3; // Process 3 warmups at a time
      const batch = this.warmingQueue.splice(0, batchSize);

      await Promise.allSettled(
        batch.map((item) => this.warmCache(item.tenantId, item.userId)),
      );

      if (batch.length > 0) {
        this.logger.debug({
          message: 'Processed cache warming batch',
          fullMessage: JSON.stringify({
            batchSize: batch.length,
            remainingQueue: this.warmingQueue.length,
          }),
        });
      }
    } catch (error) {
      this.logger.error({
        message: 'Failed to process cache warming queue',
        fullMessage: JSON.stringify({
          error: (error as Error).message,
        }),
      });
    } finally {
      this.isWarming = false;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getQueueStatus(): Results<{
    queueLength: number;
    isWarming: boolean;
    strategies: string[];
  }> {
    try {
      return Results.ok({
        queueLength: this.warmingQueue.length,
        isWarming: this.isWarming,
        strategies: Array.from(this.strategies.keys()),
      });
    } catch (error) {
      return Results.fail<any>(
        null,
        `Failed to get warming queue status: ${(error as Error).message}`,
      );
    }
  }

  async clearQueue(): Promise<Results<void>> {
    try {
      this.warmingQueue = [];
      this.logger.info({ message: 'Cache warming queue cleared' });
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(
        null,
        `Failed to clear warming queue: ${(error as Error).message}`,
      );
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }
  }
}
