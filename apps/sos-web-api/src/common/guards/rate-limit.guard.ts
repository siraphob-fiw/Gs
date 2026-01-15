import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { ILogger } from '@strengthos/shared-logging';
import NodeCache from 'node-cache';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

export interface RateLimitOptions extends Partial<RateLimitConfig> {
  skipIf?: (request: Request) => boolean;
}

// Decorator to set rate limiting options
export const RateLimit = (options: RateLimitOptions) => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    } else {
      // Class decorator
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, target);
    }
  };
};

// In-memory rate limit cache (Redis disabled)
const rateLimitCache = new NodeCache({
  stdTTL: 60 * 15, // 15 minutes default
  checkperiod: 60, // Check for expired keys every minute
});

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get rate limit options from method or class metadata
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitOptions) {
      return true; // No rate limiting configured
    }

    // Check if we should skip rate limiting
    if (rateLimitOptions.skipIf && rateLimitOptions.skipIf(request)) {
      return true;
    }

    try {
      const config: RateLimitConfig = {
        windowMs: rateLimitOptions.windowMs || 15 * 60 * 1000,
        maxRequests: rateLimitOptions.maxRequests || 100,
        message:
          rateLimitOptions.message ||
          'Too many requests, please try again later.',
      };

      // Generate key from IP and user ID
      const ip = request.ip || 'unknown';
      const userId = (request as any).user?.userId;
      const key = `rate_limit:${userId ? `user:${userId}` : `ip:${ip}`}`;

      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get current request count for this key
      const requestLog: number[] = rateLimitCache.get(key) || [];

      // Filter out requests outside the current window
      const requestsInWindow = requestLog.filter(
        (timestamp: number) => timestamp > windowStart,
      );

      // Check if limit exceeded
      if (requestsInWindow.length >= config.maxRequests) {
        const resetTime = new Date(
          Math.min(...requestsInWindow) + config.windowMs,
        );

        await this.logger.warning({
          message: 'Rate limit exceeded',
          metadata: {
            key,
            ip,
            userAgent: request.get('User-Agent'),
            path: request.path,
            method: request.method,
            currentRequests: requestsInWindow.length,
            maxRequests: config.maxRequests,
            resetTime,
          },
        });

        // Set rate limit headers
        response.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.getTime().toString(),
          'Retry-After': Math.ceil(
            (resetTime.getTime() - now) / 1000,
          ).toString(),
        });

        response.status(429).json({
          statusCode: 429,
          message: config.message,
          error: 'Too Many Requests',
        });
        return false;
      }

      // Add current request to log
      requestsInWindow.push(now);

      // Store updated request log with TTL
      const ttlSeconds = Math.ceil(config.windowMs / 1000);
      rateLimitCache.set(key, requestsInWindow, ttlSeconds);

      // Set rate limit headers
      const remaining = Math.max(
        0,
        config.maxRequests - requestsInWindow.length,
      );
      const resetTime = new Date(now + config.windowMs);

      response.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.getTime().toString(),
      });

      return true;
    } catch (error) {
      // If rate limiting fails, log the error but allow the request
      await this.logger.error({
        message: 'Rate limiting guard error',
        metadata: {
          error: (error as Error).message,
          path: request.path,
          method: request.method,
          ip: request.ip,
        },
      });

      return true;
    }
  }
}

// Predefined rate limit configurations
export const AuthRateLimit = (options?: Partial<RateLimitOptions>) =>
  RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    ...options,
  });

export const ApiRateLimit = (options?: Partial<RateLimitOptions>) =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'API rate limit exceeded, please slow down.',
    ...options,
  });

export const StrictRateLimit = (options?: Partial<RateLimitOptions>) =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    message: 'Rate limit exceeded for sensitive operations.',
    ...options,
  });

export const UploadRateLimit = (options?: Partial<RateLimitOptions>) =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    message: 'Upload rate limit exceeded, please wait before uploading again.',
    ...options,
  });
