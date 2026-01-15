import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CacheService } from '../cache.service';
import { InvalidationEventType } from '@strengthos/shared-cache';
import { ILogger } from '@strengthos/shared-logging';

// Decorator to configure cache invalidation
export const InvalidateCache = (_config: {
  entityType: string;
  eventType: InvalidationEventType;
  extractEntityId?: (request: Request, response?: any) => string;
  extractTenantId?: (request: Request, response?: any) => string;
  extractRelatedEntities?: (request: Request, response?: any) => string[];
  invalidatePatterns?: string[];
}) =>
  Reflector.createDecorator<{
    entityType: string;
    eventType: InvalidationEventType;
    extractEntityId?: (request: Request, response?: any) => string;
    extractTenantId?: (request: Request, response?: any) => string;
    extractRelatedEntities?: (request: Request, response?: any) => string[];
    invalidatePatterns?: string[];
  }>();

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Get invalidation configuration from decorator
    const invalidationConfig = this.reflector.get(
      InvalidateCache,
      context.getHandler(),
    );
    if (!invalidationConfig) {
      return next.handle();
    }

    // Only process non-GET requests (mutations)
    if (request.method === 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          await this.processInvalidation(
            request,
            responseData,
            invalidationConfig,
          );
        } catch (error) {
          this.logger.error({
            message: 'Cache invalidation failed',
            fullMessage: JSON.stringify({
              error: (error as Error).message,
              path: request.path,
              method: request.method,
            }),
          });
        }
      }),
    );
  }

  private async processInvalidation(
    request: Request,
    responseData: any,
    config: any,
  ): Promise<void> {
    const {
      entityType,
      eventType,
      extractEntityId,
      extractTenantId,
      extractRelatedEntities,
      invalidatePatterns,
    } = config;

    // Extract entity information
    const entityId = extractEntityId
      ? extractEntityId(request, responseData)
      : this.defaultExtractEntityId(request, responseData);

    const tenantId = extractTenantId
      ? extractTenantId(request, responseData)
      : this.defaultExtractTenantId(request, responseData);

    const relatedEntities = extractRelatedEntities
      ? extractRelatedEntities(request, responseData)
      : undefined;

    if (!entityId) {
      this.logger.warning({
        message: 'Could not extract entity ID for cache invalidation',
        fullMessage: JSON.stringify({ entityType, eventType }),
      });
      return;
    }

    // Queue invalidation event
    await this.cacheService.queueInvalidation({
      type: eventType,
      entityType,
      entityId,
      tenantId,
      relatedEntities,
      timestamp: new Date(),
      metadata: {
        path: request.path,
        method: request.method,
        userAgent: request.headers['user-agent'],
      },
    });

    // Process pattern-based invalidation
    if (invalidatePatterns && tenantId) {
      for (const pattern of invalidatePatterns) {
        const resolvedPattern = this.resolvePattern(pattern, {
          entityId,
          tenantId,
          userId: this.extractUserId(request),
        });

        await this.cacheService.deleteTenantData(tenantId, resolvedPattern);
      }
    }

    this.logger.debug({
      message: 'Cache invalidation queued',
      fullMessage: JSON.stringify({
        entityType,
        entityId,
        tenantId,
        eventType,
        relatedEntities: relatedEntities?.length || 0,
      }),
    });
  }

  private defaultExtractEntityId(
    request: Request,
    responseData: any,
  ): string | null {
    // Try to extract entity ID from various sources
    return (
      request.params.id ||
      request.params.userId ||
      request.params.tenantId ||
      responseData?.id ||
      responseData?.userId ||
      responseData?.data?.id ||
      null
    );
  }

  private defaultExtractTenantId(
    request: Request,
    responseData: any,
  ): string | null {
    // Try to extract tenant ID from various sources
    return (
      (request.headers['x-tenant-id'] as string) ||
      request.params.tenantId ||
      (request.query.tenantId as string) ||
      (request as any).tenantId ||
      responseData?.tenantId ||
      responseData?.data?.tenantId ||
      null
    );
  }

  private extractUserId(request: Request): string | null {
    return (
      (request.headers['x-user-id'] as string) ||
      (request as any).user?.id ||
      (request as any).userId ||
      null
    );
  }

  private resolvePattern(
    pattern: string,
    variables: Record<string, string | null>,
  ): string {
    let resolved = pattern;

    for (const [key, value] of Object.entries(variables)) {
      if (value) {
        resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }

    return resolved;
  }
}

// Common invalidation configurations
export const InvalidateUserCache = (
  eventType: InvalidationEventType = InvalidationEventType.USER_UPDATED,
) =>
  InvalidateCache({
    entityType: 'user',
    eventType,
    invalidatePatterns: [
      'user_profile:{entityId}',
      'user_permissions:{entityId}',
      'user_preferences:{entityId}',
    ],
  });

export const InvalidateTenantCache = (
  eventType: InvalidationEventType = InvalidationEventType.TENANT_UPDATED,
) =>
  InvalidateCache({
    entityType: 'tenant',
    eventType,
    extractEntityId: (req) => req.params.tenantId || req.params.id,
    invalidatePatterns: ['tenant_info', 'tenant_users', 'tenant_settings'],
  });

export const InvalidateRelationshipCache = (
  eventType: InvalidationEventType = InvalidationEventType.RELATIONSHIP_UPDATED,
) =>
  InvalidateCache({
    entityType: 'relationship',
    eventType,
    extractRelatedEntities: (req, res) => {
      // Extract coach and athlete IDs from request/response
      const coachId = req.body?.coachId || res?.coachId;
      const athleteId = req.body?.athleteId || res?.athleteId;
      return [coachId, athleteId].filter(Boolean);
    },
    invalidatePatterns: [
      'relationships:{entityId}',
      'coach_athletes:{userId}',
      'athlete_coaches:{userId}',
    ],
  });
