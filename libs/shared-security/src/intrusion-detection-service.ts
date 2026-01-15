// Intrusion Detection Service for identifying potential security threats
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { SecurityEventType, RequestContext } from '@strengthos/shared-types';
import { IDb } from '@strengthos/shared-database';

export interface IntrusionRule {
  id: string;
  name: string;
  description: string;
  eventType: SecurityEventType;
  conditions: IntrusionCondition[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntrusionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range' | 'regex';
  value: any;
  timeWindow?: number; // minutes
}

export interface IntrusionDetection {
  id: string;
  ruleId: string;
  ruleName: string;
  eventId: string;
  severity: string;
  description: string;
  metadata: any;
  detectedAt: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export interface DetectionConfig {
  enableRealTimeDetection: boolean;
  enableBehavioralAnalysis: boolean;
  enableAnomalyDetection: boolean;
  maxDetectionsPerHour: number;
  autoBlockThreshold: number;
}

export class IntrusionDetectionService {
  private static readonly DEFAULT_CONFIG: DetectionConfig = {
    enableRealTimeDetection: true,
    enableBehavioralAnalysis: true,
    enableAnomalyDetection: false,
    maxDetectionsPerHour: 100,
    autoBlockThreshold: 5
  };

  private config: DetectionConfig;
  private rules: Map<string, IntrusionRule> = new Map();

  constructor(
    private db: IDb,
    private logger?: ILogger,
    config?: Partial<DetectionConfig>
  ) {
    this.config = { ...IntrusionDetectionService.DEFAULT_CONFIG, ...config };
    this.initializeDefaultRules();
  }

  /**
   * Analyze a security event for potential intrusions
   */
  public async analyzeEvent(eventId: string, eventData: any): Promise<Results<IntrusionDetection[]>> {
    try {
      if (!this.config.enableRealTimeDetection) {
        return Results.ok([]);
      }

      const detections: IntrusionDetection[] = [];

      // Check against all active rules
      for (const rule of this.rules.values()) {
        if (!rule.enabled || rule.eventType !== eventData.eventType) {
          continue;
        }

        const matches = await this.evaluateRule(rule, eventData);
        if (matches) {
          const detection = await this.createDetection(rule, eventId, eventData);
          if (detection.isOk) {
            detections.push(detection.returnValue!);
          }
        }
      }

      // Perform behavioral analysis if enabled
      if (this.config.enableBehavioralAnalysis) {
        const behavioralDetections = await this.performBehavioralAnalysis(eventData);
        if (behavioralDetections.isOk) {
          detections.push(...behavioralDetections.returnValue!);
        }
      }

      return Results.ok(detections);
    } catch (error) {
      return Results.fail<IntrusionDetection[]>(null, `Failed to analyze event: ${error}`);
    }
  }

  /**
   * Add a new intrusion detection rule
   */
  public async addRule(rule: Omit<IntrusionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Results<string>> {
    try {
      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newRule: IntrusionRule = {
        ...rule,
        id: ruleId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in database
      await this.db.knex('intrusion_rules').insert({
        id: newRule.id,
        name: newRule.name,
        description: newRule.description,
        event_type: newRule.eventType,
        conditions: JSON.stringify(newRule.conditions),
        severity: newRule.severity,
        enabled: newRule.enabled,
        created_at: newRule.createdAt,
        updated_at: newRule.updatedAt
      });

      // Add to memory cache
      this.rules.set(ruleId, newRule);

      return Results.ok(ruleId);
    } catch (error) {
      return Results.fail<string>(null, `Failed to add rule: ${error}`);
    }
  }

  /**
   * Update an existing rule
   */
  public async updateRule(ruleId: string, updates: Partial<IntrusionRule>): Promise<Results<void>> {
    try {
      const existingRule = this.rules.get(ruleId);
      if (!existingRule) {
        return Results.fail<void>(null, 'Rule not found');
      }

      const updatedRule: IntrusionRule = {
        ...existingRule,
        ...updates,
        updatedAt: new Date()
      };

      // Update in database
      await this.db.knex('intrusion_rules')
        .where({ id: ruleId })
        .update({
          name: updatedRule.name,
          description: updatedRule.description,
          event_type: updatedRule.eventType,
          conditions: JSON.stringify(updatedRule.conditions),
          severity: updatedRule.severity,
          enabled: updatedRule.enabled,
          updated_at: updatedRule.updatedAt
        });

      // Update memory cache
      this.rules.set(ruleId, updatedRule);

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to update rule: ${error}`);
    }
  }

  /**
   * Get all intrusion detections with filtering
   */
  public async getDetections(filters: {
    ruleId?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Results<IntrusionDetection[]>> {
    try {
      let query = this.db.knex('intrusion_detections');

      if (filters.ruleId) {
        query = query.where('rule_id', filters.ruleId);
      }
      if (filters.severity) {
        query = query.where('severity', filters.severity);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.startDate) {
        query = query.where('detected_at', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('detected_at', '<=', filters.endDate);
      }

      const detections = await query
        .orderBy('detected_at', 'desc')
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);

      const results: IntrusionDetection[] = detections.map(detection => ({
        id: detection.id,
        ruleId: detection.rule_id,
        ruleName: detection.rule_name,
        eventId: detection.event_id,
        severity: detection.severity,
        description: detection.description,
        metadata: detection.metadata ? JSON.parse(detection.metadata) : null,
        detectedAt: detection.detected_at,
        status: detection.status
      }));

      return Results.ok(results);
    } catch (error) {
      return Results.fail<IntrusionDetection[]>(null, `Failed to get detections: ${error}`);
    }
  }

  /**
   * Update detection status
   */
  public async updateDetectionStatus(detectionId: string, status: string, notes?: string): Promise<Results<void>> {
    try {
      await this.db.knex('intrusion_detections')
        .where({ id: detectionId })
        .update({
          status,
          notes,
          updated_at: new Date()
        });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to update detection status: ${error}`);
    }
  }

  /**
   * Get detection statistics
   */
  public async getDetectionStats(timeRange: { start: Date; end: Date }): Promise<Results<any>> {
    try {
      const stats = await this.db.knex('intrusion_detections')
        .where('detected_at', '>=', timeRange.start)
        .where('detected_at', '<=', timeRange.end)
        .select(
          this.db.knex.raw('COUNT(*) as total_detections'),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as critical_count', ['critical']),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as high_count', ['high']),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as medium_count', ['medium']),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as low_count', ['low']),
          this.db.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as active_count', ['active']),
          this.db.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as resolved_count', ['resolved'])
        )
        .first();

      return Results.ok(stats);
    } catch (error) {
      return Results.fail<any>(null, `Failed to get detection stats: ${error}`);
    }
  }

  // Private helper methods

  private async evaluateRule(rule: IntrusionRule, eventData: any): Promise<boolean> {
    try {
      for (const condition of rule.conditions) {
        const fieldValue = this.getFieldValue(eventData, condition.field);

        if (!this.evaluateCondition(condition, fieldValue, eventData)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      if (this.logger) {
        await this.logger.error({
          message: 'Failed to evaluate rule',
          metadata: { ruleId: rule.id, error: (error as Error).message }
        });
      }
      return false;
    }
  }

  private evaluateCondition(condition: IntrusionCondition, fieldValue: any, eventData: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in_range':
        const [min, max] = condition.value;
        return Number(fieldValue) >= min && Number(fieldValue) <= max;
      case 'regex':
        const regex = new RegExp(condition.value);
        return regex.test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(eventData: any, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value = eventData;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async createDetection(rule: IntrusionRule, eventId: string, eventData: any): Promise<Results<IntrusionDetection>> {
    try {
      const detectionId = `detection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const detection: IntrusionDetection = {
        id: detectionId,
        ruleId: rule.id,
        ruleName: rule.name,
        eventId,
        severity: rule.severity,
        description: `${rule.name}: ${rule.description}`,
        metadata: {
          rule: rule,
          eventData: eventData
        },
        detectedAt: new Date(),
        status: 'active'
      };

      // Store in database
      await this.db.knex('intrusion_detections').insert({
        id: detection.id,
        rule_id: detection.ruleId,
        rule_name: detection.ruleName,
        event_id: detection.eventId,
        severity: detection.severity,
        description: detection.description,
        metadata: JSON.stringify(detection.metadata),
        detected_at: detection.detectedAt,
        status: detection.status
      });

      // Log the detection
      if (this.logger) {
        await this.logger.info({
          message: `Intrusion detected: ${rule.name}`,
          metadata: detection
        });
      }

      return Results.ok(detection);
    } catch (error) {
      return Results.fail<IntrusionDetection>(null, `Failed to create detection: ${error}`);
    }
  }

  private async performBehavioralAnalysis(eventData: any): Promise<Results<IntrusionDetection[]>> {
    try {
      const detections: IntrusionDetection[] = [];

      // Analyze login patterns
      if (eventData.eventType === SecurityEventType.LOGIN_SUCCESS && eventData.userId) {
        const unusualLogin = await this.detectUnusualLoginPattern(eventData);
        if (unusualLogin.isOk && unusualLogin.returnValue) {
          detections.push(unusualLogin.returnValue);
        }
      }

      // Analyze access patterns
      if (eventData.eventType === SecurityEventType.PERMISSION_DENIED && eventData.userId) {
        const suspiciousAccess = await this.detectSuspiciousAccessPattern(eventData);
        if (suspiciousAccess.isOk && suspiciousAccess.returnValue) {
          detections.push(suspiciousAccess.returnValue);
        }
      }

      return Results.ok(detections);
    } catch (error) {
      return Results.fail<IntrusionDetection[]>(null, `Behavioral analysis failed: ${error}`);
    }
  }

  private async detectUnusualLoginPattern(eventData: any): Promise<Results<IntrusionDetection | null>> {
    try {
      // Check for login from unusual location/time
      const recentLogins = await this.db.knex('security_events')
        .where('event_type', SecurityEventType.LOGIN_SUCCESS)
        .where('user_id', eventData.userId)
        .where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        .select('ip_address', 'timestamp');

      const currentIP = eventData.ipAddress;
      const knownIPs = new Set(recentLogins.map(login => login.ip_address));

      if (currentIP && !knownIPs.has(currentIP)) {
        const detection: IntrusionDetection = {
          id: `behavioral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId: 'behavioral_unusual_login',
          ruleName: 'Unusual Login Location',
          eventId: eventData.id || 'unknown',
          severity: 'medium',
          description: 'User logged in from an unusual IP address',
          metadata: {
            userId: eventData.userId,
            newIP: currentIP,
            knownIPs: Array.from(knownIPs)
          },
          detectedAt: new Date(),
          status: 'active'
        };

        return Results.ok(detection);
      }

      return Results.ok(null);
    } catch (error) {
      return Results.fail<IntrusionDetection | null>(null, `Failed to detect unusual login pattern: ${error}`);
    }
  }

  private async detectSuspiciousAccessPattern(eventData: any): Promise<Results<IntrusionDetection | null>> {
    try {
      // Check for rapid permission denied events
      const recentDenials = await this.db.knex('security_events')
        .where('event_type', SecurityEventType.PERMISSION_DENIED)
        .where('user_id', eventData.userId)
        .where('timestamp', '>=', new Date(Date.now() - 5 * 60 * 1000)) // Last 5 minutes
        .count('* as count')
        .first();

      if (recentDenials && Number(recentDenials.count) >= 10) {
        const detection: IntrusionDetection = {
          id: `behavioral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId: 'behavioral_suspicious_access',
          ruleName: 'Suspicious Access Pattern',
          eventId: eventData.id || 'unknown',
          severity: 'high',
          description: 'User has multiple permission denied events in short time',
          metadata: {
            userId: eventData.userId,
            denialCount: recentDenials.count,
            timeWindow: '5 minutes'
          },
          detectedAt: new Date(),
          status: 'active'
        };

        return Results.ok(detection);
      }

      return Results.ok(null);
    } catch (error) {
      return Results.fail<IntrusionDetection | null>(null, `Failed to detect suspicious access pattern: ${error}`);
    }
  }

  private initializeDefaultRules(): void {
    // Default rules will be loaded from database on service initialization
    // This is a placeholder for the initialization logic
  }
}

// Factory function
export function createIntrusionDetectionService(
  db: IDb,
  logger?: ILogger,
  config?: Partial<DetectionConfig>
): IntrusionDetectionService {
  return new IntrusionDetectionService(db, logger, config);
}
