import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@strengthos/shared-logging';
import { SecurityMonitoringService } from '@strengthos/shared-security';
import { 
  SecurityEventType, 
  SecurityEventSeverity, 
  SecurityEventStatus, 
  ThreatLevel 
} from '@strengthos/shared-types';

export interface SecurityConfig {
  enableIpWhitelist?: boolean;
  allowedIps?: string[];
  enableUserAgentValidation?: boolean;
  blockedUserAgents?: string[];
  enableSuspiciousActivityDetection?: boolean;
  maxRequestsPerSecond?: number;
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    enableIpWhitelist: false,
    enableUserAgentValidation: true,
    enableSuspiciousActivityDetection: true,
    maxRequestsPerSecond: 10,
    blockedUserAgents: [
      'bot',
      'crawler',
      'spider',
      'scraper',
    ],
  };

  private config: SecurityConfig;
  private requestCounts = new Map<string, { count: number; timestamp: number }>();

  constructor(
    private readonly logger: ILogger,
    private readonly securityMonitoring: SecurityMonitoringService,
    config?: Partial<SecurityConfig>,
  ) {
    // this.config = { ...SecurityMiddleware.DEFAULT_CONFIG, ...config };
    this.config = { ...SecurityMiddleware.DEFAULT_CONFIG };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || '';
      const path = req.path;
      const method = req.method;

      // IP whitelist check
      if (this.config.enableIpWhitelist && this.config.allowedIps) {
        if (!this.config.allowedIps.includes(ip)) {
          await this.logSecurityEvent(SecurityEventType.BLOCKED_IP, {
            ip,
            userAgent,
            path,
            method,
            reason: 'IP not in whitelist',
          });

          res.status(403).json({
            statusCode: 403,
            message: 'Access denied',
            error: 'Forbidden',
          });
          return;
        }
      }

      // User agent validation
      if (this.config.enableUserAgentValidation && this.config.blockedUserAgents) {
        const isBlocked = this.config.blockedUserAgents.some(blocked =>
          userAgent.toLowerCase().includes(blocked.toLowerCase())
        );

        if (isBlocked) {
          await this.logSecurityEvent(SecurityEventType.BLOCKED_USER_AGENT, {
            ip,
            userAgent,
            path,
            method,
            reason: 'Blocked user agent',
          });

          res.status(403).json({
            statusCode: 403,
            message: 'Access denied',
            error: 'Forbidden',
          });
          return;
        }
      }

      // Suspicious activity detection
      if (this.config.enableSuspiciousActivityDetection) {
        const isSuspicious = await this.detectSuspiciousActivity(req);
        if (isSuspicious) {
          await this.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
            ip,
            userAgent,
            path,
            method,
            reason: 'Suspicious activity detected',
          });

          // Don't block, but log for monitoring
        }
      }

      // Request rate monitoring (per IP)
      if (this.config.maxRequestsPerSecond) {
        const now = Date.now();
        const key = `${ip}:${Math.floor(now / 1000)}`; // Per second bucket
        const current = this.requestCounts.get(key) || { count: 0, timestamp: now };

        current.count++;
        this.requestCounts.set(key, current);

        if (current.count > this.config.maxRequestsPerSecond) {
          await this.logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
            ip,
            userAgent,
            path,
            method,
            requestCount: current.count,
            maxAllowed: this.config.maxRequestsPerSecond,
          });
        }

        // Cleanup old entries
        this.cleanupRequestCounts(now);
      }

      next();
    } catch (error) {
      await this.logger.error({
        message: 'Security middleware error',
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

  private async detectSuspiciousActivity(req: Request): Promise<boolean> {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      // Path traversal
      /\.\.[\/\\]/,
      // Command injection
      /[;&|`$(){}[\]]/,
    ];

    const checkString = `${req.url} ${JSON.stringify(req.query)} ${JSON.stringify(req.body)}`;

    return suspiciousPatterns.some(pattern => pattern.test(checkString));
  }

  private async logSecurityEvent(eventType: SecurityEventType, metadata: any): Promise<void> {
    try {
      await this.securityMonitoring.logSecurityEvent({
        eventType,
        severity: 'medium',
        ipAddress: metadata.ip || 'unknown',
        metadata,
      });
    } catch (error) {
      await this.logger.error({
        message: 'Failed to log security event',
        metadata: {
          eventType,
          error: (error as any).message,
        },
      });
    }
  }

  private cleanupRequestCounts(now: number): void {
    const cutoff = now - 5000; // Keep last 5 seconds
    for (const [key, data] of this.requestCounts.entries()) {
      if (data.timestamp < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }
}

// Factory function
export function createSecurityMiddleware(
  logger: ILogger,
  securityMonitoring: SecurityMonitoringService,
  config?: Partial<SecurityConfig>,
): SecurityMiddleware {
  return new SecurityMiddleware(logger, securityMonitoring, config);
}