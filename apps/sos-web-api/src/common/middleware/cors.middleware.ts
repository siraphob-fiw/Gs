import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@strengthos/shared-logging';

export interface CorsConfig {
  origin?:
    | string
    | string[]
    | boolean
    | ((
        origin: string,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => void);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private static readonly DEFAULT_CONFIG: CorsConfig = {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
      'x-tenant-id',
      'X-User-ID',
      'X-Refresh-Token',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204,
  };

  private config: CorsConfig;

  constructor(
    private readonly logger: ILogger,
    config?: Partial<CorsConfig>,
  ) {
    this.config = { ...CorsMiddleware.DEFAULT_CONFIG, ...config };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const origin = req.get('Origin');
      const requestMethod = req.method;
      const requestHeaders = req.get('Access-Control-Request-Headers');

      // Handle origin
      if (this.config.origin !== undefined) {
        const allowedOrigin = await this.getAllowedOrigin(
          origin,
          this.config.origin,
        );
        if (allowedOrigin !== null) {
          res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        }
      }

      // Handle credentials
      if (this.config.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Handle exposed headers
      if (this.config.exposedHeaders) {
        const exposedHeaders = Array.isArray(this.config.exposedHeaders)
          ? this.config.exposedHeaders.join(', ')
          : this.config.exposedHeaders;
        res.setHeader('Access-Control-Expose-Headers', exposedHeaders);
      }

      // Handle preflight requests
      if (requestMethod === 'OPTIONS') {
        // Handle methods
        if (this.config.methods) {
          const methods = Array.isArray(this.config.methods)
            ? this.config.methods.join(', ')
            : this.config.methods;
          res.setHeader('Access-Control-Allow-Methods', methods);
        }

        // Handle headers
        if (this.config.allowedHeaders) {
          const headers = Array.isArray(this.config.allowedHeaders)
            ? this.config.allowedHeaders.join(', ')
            : this.config.allowedHeaders;
          res.setHeader('Access-Control-Allow-Headers', headers);
        } else if (requestHeaders) {
          res.setHeader('Access-Control-Allow-Headers', requestHeaders);
        }

        // Handle max age
        if (this.config.maxAge !== undefined) {
          res.setHeader(
            'Access-Control-Max-Age',
            this.config.maxAge.toString(),
          );
        }

        if (this.config.preflightContinue) {
          next();
        } else {
          res.status(this.config.optionsSuccessStatus || 204).end();
        }
        return;
      }

      next();
    } catch (error) {
      await this.logger.error({
        message: 'CORS middleware error',
        metadata: {
          error: (error as Error).message,
          method: req.method,
          ip: req.ip,
        },
      });

      // On error, allow the request to proceed
      next();
    }
  }

  private async getAllowedOrigin(
    requestOrigin: string | undefined,
    configOrigin: CorsConfig['origin'],
  ): Promise<string | null> {
    if (configOrigin === false) {
      return null;
    }

    if (configOrigin === true || configOrigin === undefined) {
      return requestOrigin || '*';
    }

    if (typeof configOrigin === 'string') {
      return configOrigin;
    }

    if (Array.isArray(configOrigin)) {
      if (!requestOrigin) {
        return null;
      }
      return configOrigin.includes(requestOrigin) ? requestOrigin : null;
    }

    if (typeof configOrigin === 'function') {
      return new Promise((resolve) => {
        configOrigin(requestOrigin || '', (err, allow) => {
          if (err || !allow) {
            resolve(null);
          } else {
            resolve(requestOrigin || '*');
          }
        });
      });
    }

    return null;
  }
}

// Factory function for creating CORS middleware
export function createCorsMiddleware(
  logger: ILogger,
  config?: Partial<CorsConfig>,
): CorsMiddleware {
  return new CorsMiddleware(logger, config);
}

// Predefined CORS configurations
export const ProductionCorsConfig: Partial<CorsConfig> = {
  origin: (origin, callback) => {
    // Define allowed origins for production
    const allowedOrigins = [
      'https://app.strengthos.com',
      'https://admin.strengthos.com',
      // Add other production domains
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'x-tenant-id',
    'X-User-ID',
    'X-Refresh-Token',
  ],
};

export const DevelopmentCorsConfig: Partial<CorsConfig> = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'x-tenant-id',
    'X-User-ID',
    'X-Refresh-Token',
  ],
};

export const RestrictiveCorsConfig: Partial<CorsConfig> = {
  origin: false, // No CORS allowed
  credentials: false,
};
