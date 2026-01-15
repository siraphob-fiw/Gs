import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@strengthos/shared-logging';
import { IRedisCacheService } from '@strengthos/shared-cache';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip successful requests from count
  skipFailedRequests?: boolean; // Skip failed requests from count
  message?: string; // Custom error message
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsPerWindow: number;
  resetTime: Date;
}

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    message: 'Too many requests, please try again later.',
  };

  private config: RateLimitConfig;

  constructor(
    private readonly cache: IRedisCacheService,
    private readonly logger: ILogger,
    config?: Partial<RateLimitConfig>,
  ) {
    this.config = { ...RateLimitingMiddleware.DEFAULT_CONFIG, ...config };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = this.generateKey(req);
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Get current request count for this key
      const cacheKey = `rate_limit:${key}`;
      const requestLog = await this.cache.get<number[]>(cacheKey) || [];

      // Filter out requests outside the current window
      const requestsInWindow = requestLog.filter((timestamp: number) => timestamp > windowStart);

      // Check if limit exceeded
      if (requestsInWindow.length >= this.config.maxRequests) {
        const resetTime = new Date(Math.min(...requestsInWindow) + this.config.windowMs);
        
        await this.logger.warn({
          message: 'Rate limit exceeded',
          metadata: {
            key,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            currentRequests: requestsInWindow.length,
            maxRequests: this.config.maxRequests,
            resetTime,
          },
        });

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.getTime().toString(),
          'Retry-After': Math.ceil((resetTime.getTime() - now) / 1000).toString(),
        });

        res.status(429).json({
          statusCode: 429,
          message: this.config.message,
          error: 'Too Many Requests',
        });
        return;
      }

      // Add current request to log
      requestsInWindow.push(now);

      // Store updated request log with TTL
      await this.cache.set(cacheKey, requestsInWindow, Math.ceil(this.config.windowMs / 1000));

      // Set rate limit headers
      const remaining = Math.max(0, this.config.maxRequests - requestsInWindow.length);
      const resetTime = new Date(now + this.config.windowMs);

      res.set({
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.getTime().toString(),
      });

      next();
    } catch (error) {
      await this.logger.error({
        message: 'Rate limiting middleware error',
        metadata: {
          error: (error as any).message,
          path: req.path,
          method: req.method,
          ip: req.ip,
        },
      });

      // On error, allow the request to proceed
      next();
    }
  }

  private generateKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation: IP + User ID (if authenticated)
    const ip = req.ip;
    const userId = (req as any).user?.userId;
    
    return userId ? `user:${userId}` : `ip:${ip}`;
  }
}

// Factory function for creating rate limiting middleware
export function createRateLimitingMiddleware(
  cache: IRedisCacheService,
  logger: ILogger,
  config?: Partial<RateLimitConfig>,
): RateLimitingMiddleware {
  return new RateLimitingMiddleware(cache, logger, config);
}

// Specific rate limiting configurations
export const AuthRateLimitConfig: Partial<RateLimitConfig> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
};

export const ApiRateLimitConfig: Partial<RateLimitConfig> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  message: 'API rate limit exceeded, please slow down.',
};

export const StrictRateLimitConfig: Partial<RateLimitConfig> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: 'Rate limit exceeded for sensitive operations.',
};