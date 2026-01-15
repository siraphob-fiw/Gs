// Cache invalidation service migrated from human-lift-training-api/src/Services/Caches/CacheInvalidationService.ts
import { ILogger } from '@strengthos/shared-logging';
import { Results } from '@strengthos/shared-utils';
import { IRedisCacheService } from './redis-cache-service';

export interface ICacheInvalidationStrategy {
  invalidateUserData(userId: string): Promise<Results<void>>;
  invalidateTenantData(tenantId: string): Promise<Results<void>>;
  invalidatePermissions(userId: string): Promise<Results<void>>;
  invalidateSession(sessionId: string): Promise<Results<void>>;
  invalidateUserSessions(userId: string): Promise<Results<void>>;
  invalidateRelatedData(entityType: string, entityId: string, relatedEntities?: string[]): Promise<Results<void>>;
}

export interface InvalidationEvent {
  type: InvalidationEventType;
  entityType: string;
  entityId: string;
  tenantId?: string;
  userId?: string;
  relatedEntities?: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum InvalidationEventType {
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  TENANT_UPDATED = 'TENANT_UPDATED',
  TENANT_DELETED = 'TENANT_DELETED',
  PERMISSIONS_UPDATED = 'PERMISSIONS_UPDATED',
  RELATIONSHIP_CREATED = 'RELATIONSHIP_CREATED',
  RELATIONSHIP_UPDATED = 'RELATIONSHIP_UPDATED',
  RELATIONSHIP_DELETED = 'RELATIONSHIP_DELETED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  PREFERENCES_UPDATED = 'PREFERENCES_UPDATED',
  EQUIPMENT_PROFILE_UPDATED = 'EQUIPMENT_PROFILE_UPDATED',
  HEALTH_DATA_UPDATED = 'HEALTH_DATA_UPDATED',
}

export class CacheInvalidationService implements ICacheInvalidationStrategy {
  private invalidationQueue: InvalidationEvent[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly redisCache: IRedisCacheService,
    private readonly logger: ILogger
  ) {
    this.startInvalidationProcessor();
  }

  // ============================================================================
  // PUBLIC INVALIDATION METHODS
  // ============================================================================

  async invalidateUserData(userId: string): Promise<Results<void>> {
    try {
      const results = await Promise.allSettled([
        this.redisCache.deleteUserPermissions(userId),
        this.redisCache.deleteTenantContext(userId),
      ]);

      // Check if any operations failed
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warning({ message: 'Some user data invalidation operations failed', fullMessage: JSON.stringify({ 
          userId, 
          failures: failures.length 
        }) });
      }

      this.logger.info({ message: 'User data invalidated from cache', fullMessage: JSON.stringify({ userId }) });
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to invalidate user data from cache', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        userId 
      }) });
      return Results.fail<void>(null, 'Failed to invalidate user data from cache');
    }
  }

  async invalidateTenantData(tenantId: string): Promise<Results<void>> {
    try {
      const result = await this.redisCache.invalidateTenantCache(tenantId);
      
      if (result.isOk) {
        this.logger.info({ 
          message: 'Tenant data invalidated from cache',
          fullMessage: `Tenant ${tenantId}, deleted keys: ${result.returnValue}`
        });
        return Results.ok(undefined);
      } else {
        return Results.fail<void>(null, result.message || 'Failed to invalidate tenant cache');
      }
    } catch (error) {
      this.logger.error({ message: 'Failed to invalidate tenant data from cache', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        tenantId 
      }) });
      return Results.fail<void>(null, 'Failed to invalidate tenant data from cache');
    }
  }

  async invalidatePermissions(userId: string): Promise<Results<void>> {
    try {
      const results = await Promise.allSettled([
        this.redisCache.deleteUserPermissions(userId),
      ]);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warning({ message: 'Some permission invalidation operations failed', fullMessage: JSON.stringify({ 
          userId, 
          failures: failures.length 
        }) });
      }

      this.logger.info({ message: 'User permissions invalidated from cache', fullMessage: JSON.stringify({ userId }) });
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to invalidate user permissions from cache', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        userId 
      }) });
      return Results.fail<void>(null, 'Failed to invalidate user permissions from cache');
    }
  }

  async invalidateSession(sessionId: string): Promise<Results<void>> {
    try {
      const results = await Promise.allSettled([
        this.redisCache.deleteSession(sessionId),
      ]);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warning({ message: 'Some session invalidation operations failed', fullMessage: JSON.stringify({ 
          sessionId, 
          failures: failures.length 
        }) });
      }

      this.logger.info({ message: 'Session invalidated from cache', fullMessage: JSON.stringify({ sessionId }) });
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to invalidate session from cache', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        sessionId 
      }) });
      return Results.fail<void>(null, 'Failed to invalidate session from cache');
    }
  }

  async invalidateUserSessions(userId: string): Promise<Results<void>> {
    try {
      const results = await Promise.allSettled([
        this.redisCache.deleteUserSessions(userId),
      ]);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warning({ message: 'Some user session invalidation operations failed', fullMessage: JSON.stringify({ 
          userId, 
          failures: failures.length 
        }) });
      }

      this.logger.info({ message: 'All user sessions invalidated from cache', fullMessage: JSON.stringify({ userId }) });
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to invalidate user sessions from cache', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        userId 
      }) });
      return Results.fail<void>(null, 'Failed to invalidate user sessions from cache');
    }
  }

  async invalidateRelatedData(
    entityType: string, 
    entityId: string, 
    relatedEntities?: string[]
  ): Promise<Results<void>> {
    try {
      const invalidationStrategies = this.getInvalidationStrategies(entityType);
      
      for (const strategy of invalidationStrategies) {
        await strategy(entityId, relatedEntities);
      }

      this.logger.info({ message: 'Related data invalidated from cache', fullMessage: JSON.stringify({ 
        entityType,
        entityId,
        relatedEntities 
      }) });
      
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to invalidate related data from cache', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        entityType,
        entityId 
      }) });
      return Results.fail<void>(null, 'Failed to invalidate related data from cache');
    }
  }

  // ============================================================================
  // EVENT-DRIVEN INVALIDATION
  // ============================================================================

  async queueInvalidation(event: InvalidationEvent): Promise<Results<void>> {
    try {
      this.invalidationQueue.push(event);
      
      this.logger.debug({ message: 'Invalidation event queued', fullMessage: JSON.stringify({ 
        eventType: event.type,
        entityType: event.entityType,
        entityId: event.entityId 
      }) });
      
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to queue invalidation event: ${(error as Error).message}`);
    }
  }

  async processInvalidationEvent(event: InvalidationEvent): Promise<Results<void>> {
    try {
      switch (event.type) {
        case InvalidationEventType.USER_UPDATED:
        case InvalidationEventType.USER_ROLE_CHANGED:
          return await this.invalidateUserData(event.entityId);

        case InvalidationEventType.USER_DELETED:
          await this.invalidateUserSessions(event.entityId);
          return await this.invalidateUserData(event.entityId);

        case InvalidationEventType.TENANT_UPDATED:
          if (event.tenantId) {
            return await this.invalidateTenantData(event.tenantId);
          }
          break;

        case InvalidationEventType.TENANT_DELETED:
          if (event.tenantId) {
            return await this.invalidateTenantData(event.tenantId);
          }
          break;

        case InvalidationEventType.PERMISSIONS_UPDATED:
          return await this.invalidatePermissions(event.entityId);

        case InvalidationEventType.RELATIONSHIP_CREATED:
        case InvalidationEventType.RELATIONSHIP_UPDATED:
        case InvalidationEventType.RELATIONSHIP_DELETED:
          return await this.invalidateRelationshipCache(event);

        case InvalidationEventType.PREFERENCES_UPDATED:
        case InvalidationEventType.EQUIPMENT_PROFILE_UPDATED:
        case InvalidationEventType.HEALTH_DATA_UPDATED:
          return await this.invalidateUserProfileCache(event);

        case InvalidationEventType.SUBSCRIPTION_UPDATED:
          return await this.invalidateSubscriptionCache(event);

        default:
          this.logger.warning({ message: 'Unknown invalidation event type', fullMessage: JSON.stringify({ eventType: event.type }) });
      }
      
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to process invalidation event', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        event 
      }) });
      return Results.fail<void>(null, 'Failed to process invalidation event');
    }
  }

  // ============================================================================
  // SPECIALIZED INVALIDATION HANDLERS
  // ============================================================================

  private async invalidateRelationshipCache(event: InvalidationEvent): Promise<Results<void>> {
    try {
      // Invalidate coach and athlete data when relationships change
      if (event.relatedEntities) {
        for (const relatedId of event.relatedEntities) {
          await this.invalidateUserData(relatedId);
          
          // Invalidate tenant-specific relationship data
          if (event.tenantId) {
            await this.redisCache.deleteTenantData(event.tenantId, `relationships:${relatedId}`);
            await this.redisCache.deleteTenantData(event.tenantId, `coach_athletes:${relatedId}`);
            await this.redisCache.deleteTenantData(event.tenantId, `athlete_coaches:${relatedId}`);
          }
        }
      }
      
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to invalidate relationship cache: ${(error as Error).message}`);
    }
  }

  private async invalidateUserProfileCache(event: InvalidationEvent): Promise<Results<void>> {
    try {
      // Invalidate user-specific profile data
      if (event.tenantId) {
        await this.redisCache.deleteTenantData(event.tenantId, `user_profile:${event.entityId}`);
        await this.redisCache.deleteTenantData(event.tenantId, `user_preferences:${event.entityId}`);
        await this.redisCache.deleteTenantData(event.tenantId, `equipment_profiles:${event.entityId}`);
        await this.redisCache.deleteTenantData(event.tenantId, `health_data:${event.entityId}`);
      }
      
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to invalidate user profile cache: ${(error as Error).message}`);
    }
  }

  private async invalidateSubscriptionCache(event: InvalidationEvent): Promise<Results<void>> {
    try {
      // Invalidate subscription and billing data
      if (event.tenantId) {
        await this.redisCache.deleteTenantData(event.tenantId, 'subscription_info');
        await this.redisCache.deleteTenantData(event.tenantId, 'billing_info');
        await this.redisCache.deleteTenantData(event.tenantId, 'usage_metrics');
        await this.redisCache.deleteTenantData(event.tenantId, 'payment_methods');
      }
      
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to invalidate subscription cache: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // INVALIDATION STRATEGIES
  // ============================================================================

  private getInvalidationStrategies(entityType: string): Array<(entityId: string, relatedEntities?: string[]) => Promise<void>> {
    const strategies: Record<string, Array<(entityId: string, relatedEntities?: string[]) => Promise<void>>> = {
      'user': [
        async (userId: string) => { await this.invalidateUserData(userId); },
        async (userId: string) => { await this.invalidatePermissions(userId); }
      ],
      'tenant': [
        async (tenantId: string) => { await this.invalidateTenantData(tenantId); }
      ],
      'session': [
        async (sessionId: string) => { await this.invalidateSession(sessionId); }
      ],
      'relationship': [
        async (relationshipId: string, relatedEntities?: string[]) => {
          if (relatedEntities) {
            for (const userId of relatedEntities) {
              await this.invalidateUserData(userId);
            }
          }
        }
      ]
    };

    return strategies[entityType] || [];
  }

  // ============================================================================
  // BACKGROUND PROCESSING
  // ============================================================================

  private startInvalidationProcessor(): void {
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing && this.invalidationQueue.length > 0) {
        await this.processInvalidationQueue();
      }
    }, 1000); // Process every second
  }

  private async processInvalidationQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    
    try {
      const batchSize = 10;
      const batch = this.invalidationQueue.splice(0, batchSize);
      
      await Promise.allSettled(
        batch.map(event => this.processInvalidationEvent(event))
      );

      if (batch.length > 0) {
        this.logger.debug({ message: 'Processed invalidation batch', fullMessage: JSON.stringify({ 
          batchSize: batch.length,
          remainingQueue: this.invalidationQueue.length 
        }) });
      }
    } catch (error) {
      this.logger.error({ message: 'Failed to process invalidation queue', fullMessage: JSON.stringify({ 
        error: (error as Error).message 
      }) });
    } finally {
      this.isProcessing = false;
    }
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  async warmCache(tenantId: string, userId?: string): Promise<Results<void>> {
    try {
      // This method can be called after invalidation to pre-populate
      // frequently accessed data
      
      this.logger.info({ message: 'Cache warming initiated', fullMessage: JSON.stringify({ tenantId, userId }) });

      // Implementation would depend on specific caching needs
      // For now, just log the intent
      
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to warm cache', fullMessage: JSON.stringify({ 
        error: (error as Error).message,
        tenantId,
        userId 
      }) });
      return Results.fail<void>(null, 'Failed to warm cache');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getQueueStatus(): Results<{ queueLength: number; isProcessing: boolean }> {
    try {
      return Results.ok({
        queueLength: this.invalidationQueue.length,
        isProcessing: this.isProcessing
      });
    } catch (error) {
      return Results.fail<any>(null, `Failed to get queue status: ${(error as Error).message}`);
    }
  }

  async clearQueue(): Promise<Results<void>> {
    try {
      this.invalidationQueue = [];
      this.logger.info({ message: 'Invalidation queue cleared' });
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to clear queue: ${(error as Error).message}`);
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Factory function
export function createCacheInvalidationService(
  redisCache: IRedisCacheService,
  logger: ILogger
): CacheInvalidationService {
  return new CacheInvalidationService(redisCache, logger);
}