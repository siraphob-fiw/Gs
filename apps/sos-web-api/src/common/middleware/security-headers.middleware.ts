import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface SecurityHeadersConfig {
  enableHSTS?: boolean;
  hstsMaxAge?: number;
  hstsIncludeSubDomains?: boolean;
  hstsPreload?: boolean;
  enableCSP?: boolean;
  cspDirectives?: Record<string, string | string[]>;
  enableXFrameOptions?: boolean;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  enableXContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
  referrerPolicy?: string;
  enablePermissionsPolicy?: boolean;
  permissionsPolicy?: Record<string, string[]>;
  customHeaders?: Record<string, string>;
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private static readonly DEFAULT_CONFIG: SecurityHeadersConfig = {
    enableHSTS: true,
    hstsMaxAge: 31536000, // 1 year
    hstsIncludeSubDomains: true,
    hstsPreload: true,
    enableCSP: true,
    cspDirectives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    },
    enableXFrameOptions: true,
    xFrameOptions: 'DENY',
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    enablePermissionsPolicy: true,
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
    },
  };

  private config: SecurityHeadersConfig;

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = { ...SecurityHeadersMiddleware.DEFAULT_CONFIG, ...config };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // HTTP Strict Transport Security (HSTS)
    if (this.config.enableHSTS) {
      let hstsValue = `max-age=${this.config.hstsMaxAge}`;
      if (this.config.hstsIncludeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.config.hstsPreload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // Content Security Policy (CSP)
    if (this.config.enableCSP && this.config.cspDirectives) {
      const cspValue = Object.entries(this.config.cspDirectives)
        .map(([directive, sources]) => {
          const sourceList = Array.isArray(sources)
            ? sources.join(' ')
            : sources;
          return `${directive} ${sourceList}`;
        })
        .join('; ');
      res.setHeader('Content-Security-Policy', cspValue);
    }

    // X-Frame-Options
    if (this.config.enableXFrameOptions) {
      res.setHeader('X-Frame-Options', this.config.xFrameOptions);
    }

    // X-Content-Type-Options
    if (this.config.enableXContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (this.config.enableReferrerPolicy) {
      res.setHeader('Referrer-Policy', this.config.referrerPolicy);
    }

    // Permissions Policy
    if (this.config.enablePermissionsPolicy && this.config.permissionsPolicy) {
      const permissionsValue = Object.entries(this.config.permissionsPolicy)
        .map(([directive, allowlist]) => {
          const allowlistStr =
            allowlist.length > 0 ? `(${allowlist.join(' ')})` : '()';
          return `${directive}=${allowlistStr}`;
        })
        .join(', ');
      res.setHeader('Permissions-Policy', permissionsValue);
    }

    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Custom headers
    if (this.config.customHeaders) {
      Object.entries(this.config.customHeaders).forEach(([name, value]) => {
        res.setHeader(name, value);
      });
    }

    next();
  }
}

// Factory function for creating security headers middleware
export function createSecurityHeadersMiddleware(
  config?: Partial<SecurityHeadersConfig>,
): SecurityHeadersMiddleware {
  return new SecurityHeadersMiddleware(config);
}

// Predefined configurations for different environments
export const ProductionSecurityConfig: Partial<SecurityHeadersConfig> = {
  enableHSTS: true,
  hstsMaxAge: 31536000,
  hstsIncludeSubDomains: true,
  hstsPreload: true,
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  },
  xFrameOptions: 'DENY',
};

export const DevelopmentSecurityConfig: Partial<SecurityHeadersConfig> = {
  enableHSTS: false,
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:', 'http:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'ws:', 'wss:'],
    'frame-ancestors': ["'self'"],
  },
  xFrameOptions: 'SAMEORIGIN',
};
