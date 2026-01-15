import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { CacheService } from '../cache.service';
import { ILogger } from '@strengthos/shared-logging';

// Decorator to mark endpoints for caching
// Decorator to mark endpoints for caching
export const CacheResponse = (_ttlSeconds: number = 300, _keyPrefix?: string) =>
  Reflector.createDecorator<{ ttl: number; keyPrefix?: string }>();

// Decorator to exclude endpoints from caching
export const NoCacheResponse = () => Reflector.createDecorator<boolean>();

@Injectable()
export class CacheResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if caching is disabled for this endpoint
    const noCacheResponse = this.reflector.get(
      NoCacheResponse,
      context.getHandler(),
    );
    if (noCacheResponse) {
      return next.handle();
    }

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache configuration from decorator
    const cacheConfig = this.reflector.get(CacheResponse, context.getHandler());
    if (!cacheConfig) {
      return next.handle();
    }

    const { ttl, keyPrefix } = cacheConfig;

    // Generate cache key
    const cacheKey = this.generateCacheKey(request, keyPrefix);
    const tenantId = this.extractTenantId(request);

    try {
      // Try to get cached response
      let cachedResponse;
      if (tenantId) {
        const result = await this.cacheService.getTenantData<any>(
          tenantId,
          cacheKey,
        );
        cachedResponse = result.isOk ? result.returnValue : null;
      } else {
        // For non-tenant specific data, use a global cache key
        const result = await this.cacheService.getTenantData<any>(
          'global',
          cacheKey,
        );
        cachedResponse = result.isOk ? result.returnValue : null;
      }

      if (cachedResponse) {
        // Set cache headers
        response.setHeader('X-Cache', 'HIT');
        response.setHeader('X-Cache-Key', cacheKey);

        this.logger.debug({
          message: 'Cache hit for API response',
          fullMessage: JSON.stringify({ cacheKey, tenantId }),
        });

        return of(cachedResponse);
      }

      // Cache miss - execute handler and cache the result
      response.setHeader('X-Cache', 'MISS');
      response.setHeader('X-Cache-Key', cacheKey);

      return next.handle().pipe(
        tap(async (data) => {
          try {
            // Cache the response data
            if (tenantId) {
              await this.cacheService.setTenantData(
                tenantId,
                cacheKey,
                data,
                ttl,
              );
            } else {
              await this.cacheService.setTenantData(
                'global',
                cacheKey,
                data,
                ttl,
              );
            }

            this.logger.debug({
              message: 'Cached API response',
              fullMessage: JSON.stringify({ cacheKey, tenantId, ttl }),
            });
          } catch (error) {
            this.logger.error({
              message: 'Failed to cache API response',
              fullMessage: JSON.stringify({
                error: (error as Error).message,
                cacheKey,
                tenantId,
              }),
            });
          }
        }),
      );
    } catch (error) {
      this.logger.error({
        message: 'Cache interceptor error',
        fullMessage: JSON.stringify({
          error: (error as Error).message,
          cacheKey,
        }),
      });

      // Continue without caching on error
      return next.handle();
    }
  }

  private generateCacheKey(request: Request, keyPrefix?: string): string {
    const baseKey = keyPrefix || 'api_response';
    const path = request.path;
    const query = JSON.stringify(request.query);
    const userId = this.extractUserId(request);

    // Include user ID in cache key for user-specific responses
    const userPart = userId ? `:user:${userId}` : '';

    return `${baseKey}:${path}${userPart}:${Buffer.from(query).toString('base64')}`;
  }

  private extractTenantId(request: Request): string | null {
    // Try to get tenant ID from various sources
    return (
      (request.headers['x-tenant-id'] as string) ||
      (request.query.tenantId as string) ||
      (request as any).tenantId ||
      null
    );
  }

  private extractUserId(request: Request): string | null {
    // Try to get user ID from various sources
    return (
      (request.headers['x-user-id'] as string) ||
      (request as any).user?.id ||
      (request as any).userId ||
      null
    );
  }
}
