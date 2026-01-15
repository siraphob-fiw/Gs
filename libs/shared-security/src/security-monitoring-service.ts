// Security Monitoring Service for tracking security events and metrics
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { SecurityEventType, RequestContext } from '@strengthos/shared-types';
import { IDb } from '@strengthos/shared-database';

export interface SecurityEvent {
  id?: string;
  userId?: string;
  tenantId?: string;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  occurredAt: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<string, number>;
  uniqueUsers: number;
  uniqueIPs: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface MonitoringConfig {
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    failedLogins: number;
    suspiciousActivity: number;
    timeWindow: number; // minutes
  };
  retentionPeriod: number; // days
  enableMetricsCollection: boolean;
}

export class SecurityMonitoringService {
  private static readonly DEFAULT_CONFIG: MonitoringConfig = {
    enableRealTimeAlerts: true,
    alertThresholds: {
      failedLogins: 5,
      suspiciousActivity: 10,
      timeWindow: 15
    },
    retentionPeriod: 90,
    enableMetricsCollection: true
  };

  private config: MonitoringConfig;

  constructor(
    private db: IDb,
    private logger?: ILogger,
    config?: Partial<MonitoringConfig>
  ) {
    this.config = { ...SecurityMonitoringService.DEFAULT_CONFIG, ...config };
  }

  /**
   * Log a security event
   */
  public async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'occurredAt'>): Promise<Results<string>> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        occurredAt: new Date()
      };

      // Store in database
      const [eventId] = await this.db.knex('security_events').insert({
        event_type: securityEvent.eventType,
        user_id: securityEvent.userId,
        tenant_id: securityEvent.tenantId,
        ip_address: securityEvent.ipAddress,
        user_agent: securityEvent.userAgent,
        severity: securityEvent.severity,
        metadata: JSON.stringify(securityEvent.metadata),
        occurred_at: securityEvent.occurredAt
      }).returning('id');

      // Log to application logger
      if (this.logger) {
        await this.logger.info({
          message: `Security event: ${securityEvent.eventType}`,
          metadata: securityEvent
        });
      }

      // Check for real-time alerts
      if (this.config.enableRealTimeAlerts) {
        await this.checkAlertThresholds(securityEvent);
      }

      return Results.ok(eventId);
    } catch (error) {
      return Results.fail<string>(null, `Failed to log security event: ${error}`);
    }
  }

  /**
   * Get security events with filtering
   */
  public async getSecurityEvents(filters: {
    eventType?: SecurityEventType;
    userId?: string;
    tenantId?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Results<SecurityEvent[]>> {
    try {
      let query = this.db.knex('security_events');

      if (filters.eventType) {
        query = query.where('event_type', filters.eventType);
      }
      if (filters.userId) {
        query = query.where('user_id', filters.userId);
      }
      if (filters.tenantId) {
        query = query.where('tenant_id', filters.tenantId);
      }
      if (filters.severity) {
        query = query.where('severity', filters.severity);
      }
      if (filters.startDate) {
        query = query.where('occurred_at', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('occurred_at', '<=', filters.endDate);
      }

      const events = await query
        .orderBy('occurred_at', 'desc')
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);

      const securityEvents: SecurityEvent[] = events.map(event => ({
        id: event.id,
        eventType: event.event_type,
        userId: event.user_id,
        tenantId: event.tenant_id,
        ipAddress: event.ip_address,
        userAgent: event.user_agent,
        severity: event.severity,
        metadata: event.metadata ? JSON.parse(event.metadata) : null,
        occurredAt: event.occurred_at
      }));

      return Results.ok(securityEvents);
    } catch (error) {
      return Results.fail<SecurityEvent[]>(null, `Failed to get security events: ${error}`);
    }
  }

  /**
   * Get security metrics for a time period
   */
  public async getSecurityMetrics(startDate: Date, endDate: Date): Promise<Results<SecurityMetrics>> {
    try {
      if (!this.config.enableMetricsCollection) {
        return Results.fail<SecurityMetrics>(null, 'Metrics collection is disabled');
      }

      const events = await this.db.knex('security_events')
        .where('occurred_at', '>=', startDate)
        .where('occurred_at', '<=', endDate);

      const totalEvents = events.length;
      const eventsByType: Record<SecurityEventType, number> = {} as any;
      const eventsBySeverity: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      const uniqueIPs = new Set<string>();

      events.forEach(event => {
        // Count by type
        eventsByType[event.event_type as SecurityEventType] = (eventsByType[event.event_type as SecurityEventType] || 0) + 1;

        // Count by severity
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

        // Track unique users and IPs
        if (event.user_id) uniqueUsers.add(event.user_id);
        if (event.ip_address) uniqueIPs.add(event.ip_address);
      });

      const metrics: SecurityMetrics = {
        totalEvents,
        eventsByType,
        eventsBySeverity,
        uniqueUsers: uniqueUsers.size,
        uniqueIPs: uniqueIPs.size,
        timeRange: {
          start: startDate,
          end: endDate
        }
      };

      return Results.ok(metrics);
    } catch (error) {
      return Results.fail<SecurityMetrics>(null, `Failed to get security metrics: ${error}`);
    }
  }

  /**
   * Clean up old security events based on retention policy
   */
  public async cleanupOldEvents(): Promise<Results<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

      const deletedCount = await this.db.knex('security_events')
        .where('occurred_at', '<', cutoffDate)
        .del();

      if (this.logger) {
        await this.logger.info({
          message: `Cleaned up ${deletedCount} old security events`,
          metadata: { cutoffDate, retentionPeriod: this.config.retentionPeriod }
        });
      }

      return Results.ok(deletedCount);
    } catch (error) {
      return Results.fail<number>(null, `Failed to cleanup old events: ${error}`);
    }
  }

  /**
   * Get suspicious activity patterns
   */
  public async getSuspiciousActivity(timeWindow: number = 60): Promise<Results<any[]>> {
    try {
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);

      // Find IPs with multiple failed login attempts
      const suspiciousIPs = await this.db.knex('security_events')
        .where('event_type', SecurityEventType.LOGIN_FAILURE)
        .where('occurred_at', '>=', startTime)
        .groupBy('ip_address')
        .having(this.db.knex.raw('COUNT(*) >= ?', [this.config.alertThresholds.failedLogins]))
        .select('ip_address')
        .count('* as attempt_count');

      // Find users with multiple failed attempts
      const suspiciousUsers = await this.db.knex('security_events')
        .where('event_type', SecurityEventType.LOGIN_FAILURE)
        .where('occurred_at', '>=', startTime)
        .whereNotNull('user_id')
        .groupBy('user_id')
        .having(this.db.knex.raw('COUNT(*) >= ?', [this.config.alertThresholds.failedLogins]))
        .select('user_id')
        .count('* as attempt_count');

      return Results.ok([{
        suspiciousIPs,
        suspiciousUsers,
        timeWindow,
        threshold: this.config.alertThresholds.failedLogins
      }]);
    } catch (error) {
      return Results.fail<any[]>(null, `Failed to get suspicious activity: ${error}`);
    }
  }

  /**
   * Check alert thresholds and trigger alerts if needed
   */
  private async checkAlertThresholds(event: SecurityEvent): Promise<void> {
    try {
      const timeWindow = this.config.alertThresholds.timeWindow;
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);

      // Check for failed login threshold
      if (event.eventType === SecurityEventType.LOGIN_FAILURE && event.ipAddress) {
        const recentFailures = await this.db.knex('security_events')
          .where('event_type', SecurityEventType.LOGIN_FAILURE)
          .where('ip_address', event.ipAddress)
          .where('occurred_at', '>=', startTime)
          .count('* as count')
          .first();

        if (recentFailures && Number(recentFailures.count) >= this.config.alertThresholds.failedLogins) {
          await this.triggerAlert('FAILED_LOGIN_THRESHOLD', {
            ipAddress: event.ipAddress,
            attemptCount: recentFailures.count,
            timeWindow
          });
        }
      }

      // Check for permission denied threshold
      if (event.eventType === SecurityEventType.PERMISSION_DENIED && event.userId) {
        const recentDenials = await this.db.knex('security_events')
          .where('event_type', SecurityEventType.PERMISSION_DENIED)
          .where('user_id', event.userId)
          .where('occurred_at', '>=', startTime)
          .count('* as count')
          .first();

        if (recentDenials && Number(recentDenials.count) >= this.config.alertThresholds.suspiciousActivity) {
          await this.triggerAlert('PERMISSION_DENIED_THRESHOLD', {
            userId: event.userId,
            denialCount: recentDenials.count,
            timeWindow
          });
        }
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error({
          message: 'Failed to check alert thresholds',
          metadata: { error: (error as Error).message, event }
        });
      }
    }
  }

  /**
   * Trigger a security alert
   */
  private async triggerAlert(alertType: string, metadata: any): Promise<void> {
    if (this.logger) {
      await this.logger.info({
        message: `Security alert triggered: ${alertType}`,
        metadata: {
          alertType,
          ...metadata,
          timestamp: new Date()
        }
      });
    }

    // Store alert in database
    await this.db.knex('security_alerts').insert({
      alert_type: alertType,
      metadata: JSON.stringify(metadata),
      triggered_at: new Date(),
      status: 'active'
    });
  }
}

// Factory function
export function createSecurityMonitoringService(
  db: IDb,
  logger?: ILogger,
  config?: Partial<MonitoringConfig>
): SecurityMonitoringService {
  return new SecurityMonitoringService(db, logger, config);
}
