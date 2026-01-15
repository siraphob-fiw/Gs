// Security Incident Service for managing security incidents and responses
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { SecurityEventType, RequestContext } from '@strengthos/shared-types';
import { IDb } from '@strengthos/shared-database';

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  category: 'unauthorized_access' | 'data_breach' | 'malware' | 'phishing' | 'ddos' | 'other';
  assignedTo?: string;
  reportedBy: string;
  affectedSystems: string[];
  affectedUsers: string[];
  detectionIds: string[];
  eventIds: string[];
  timeline: IncidentTimelineEntry[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  timestamp: Date;
  action: string;
  description: string;
  performedBy: string;
  metadata?: any;
}

export interface IncidentResponse {
  id: string;
  incidentId: string;
  responseType: 'containment' | 'eradication' | 'recovery' | 'communication';
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string;
  dueDate?: Date;
  completedAt?: Date;
  metadata?: any;
}

export interface IncidentConfig {
  autoCreateFromDetections: boolean;
  autoAssignmentRules: boolean;
  notificationChannels: string[];
  escalationRules: {
    severity: string;
    timeToEscalate: number; // minutes
    escalateTo: string;
  }[];
}

export class SecurityIncidentService {
  private static readonly DEFAULT_CONFIG: IncidentConfig = {
    autoCreateFromDetections: true,
    autoAssignmentRules: true,
    notificationChannels: ['email', 'slack'],
    escalationRules: [
      { severity: 'critical', timeToEscalate: 15, escalateTo: 'security_team_lead' },
      { severity: 'high', timeToEscalate: 60, escalateTo: 'security_team' },
      { severity: 'medium', timeToEscalate: 240, escalateTo: 'security_analyst' }
    ]
  };

  private config: IncidentConfig;

  constructor(
    private db: IDb,
    private logger?: ILogger,
    config?: Partial<IncidentConfig>
  ) {
    this.config = { ...SecurityIncidentService.DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new security incident
   */
  public async createIncident(incident: Omit<SecurityIncident, 'id' | 'timeline' | 'createdAt' | 'updatedAt'>): Promise<Results<string>> {
    try {
      const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newIncident: SecurityIncident = {
        ...incident,
        id: incidentId,
        timeline: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in database
      await this.db.knex('security_incidents').insert({
        id: newIncident.id,
        title: newIncident.title,
        description: newIncident.description,
        severity: newIncident.severity,
        status: newIncident.status,
        category: newIncident.category,
        assigned_to: newIncident.assignedTo,
        reported_by: newIncident.reportedBy,
        affected_systems: JSON.stringify(newIncident.affectedSystems),
        affected_users: JSON.stringify(newIncident.affectedUsers),
        detection_ids: JSON.stringify(newIncident.detectionIds),
        event_ids: JSON.stringify(newIncident.eventIds),
        metadata: JSON.stringify(newIncident.metadata),
        created_at: newIncident.createdAt,
        updated_at: newIncident.updatedAt
      });

      // Add initial timeline entry
      await this.addTimelineEntry(incidentId, {
        action: 'incident_created',
        description: 'Security incident created',
        performedBy: newIncident.reportedBy
      });

      // Auto-assign if rules are enabled
      if (this.config.autoAssignmentRules && !newIncident.assignedTo) {
        const assignee = await this.determineAssignee(newIncident);
        if (assignee) {
          await this.assignIncident(incidentId, assignee, 'system');
        }
      }

      // Send notifications
      await this.sendIncidentNotification(newIncident, 'created');

      if (this.logger) {
        await this.logger.info({
          message: `Security incident created: ${newIncident.title}`,
          metadata: { incidentId, severity: newIncident.severity }
        });
      }

      return Results.ok(incidentId);
    } catch (error) {
      return Results.fail<string>(null, `Failed to create incident: ${error}`);
    }
  }

  /**
   * Update an existing incident
   */
  public async updateIncident(incidentId: string, updates: Partial<SecurityIncident>, updatedBy: string): Promise<Results<void>> {
    try {
      const existingIncident = await this.getIncident(incidentId);
      if (!existingIncident.isOk) {
        return Results.fail<void>(null, 'Incident not found');
      }

      const incident = existingIncident.returnValue!;
      const updatedIncident = { ...incident, ...updates, updatedAt: new Date() };

      // Update in database
      await this.db.knex('security_incidents')
        .where({ id: incidentId })
        .update({
          title: updatedIncident.title,
          description: updatedIncident.description,
          severity: updatedIncident.severity,
          status: updatedIncident.status,
          category: updatedIncident.category,
          assigned_to: updatedIncident.assignedTo,
          affected_systems: JSON.stringify(updatedIncident.affectedSystems),
          affected_users: JSON.stringify(updatedIncident.affectedUsers),
          detection_ids: JSON.stringify(updatedIncident.detectionIds),
          event_ids: JSON.stringify(updatedIncident.eventIds),
          metadata: JSON.stringify(updatedIncident.metadata),
          updated_at: updatedIncident.updatedAt,
          resolved_at: updatedIncident.resolvedAt
        });

      // Add timeline entry for significant changes
      const significantFields = ['status', 'severity', 'assignedTo'];
      const changedFields = Object.keys(updates).filter(key => significantFields.includes(key));

      if (changedFields.length > 0) {
        await this.addTimelineEntry(incidentId, {
          action: 'incident_updated',
          description: `Updated fields: ${changedFields.join(', ')}`,
          performedBy: updatedBy,
          metadata: { changes: updates }
        });
      }

      // Send notification for status changes
      if (updates.status && updates.status !== incident.status) {
        await this.sendIncidentNotification(updatedIncident, 'status_changed');
      }

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to update incident: ${error}`);
    }
  }

  /**
   * Get incident by ID
   */
  public async getIncident(incidentId: string): Promise<Results<SecurityIncident>> {
    try {
      const incident = await this.db.knex('security_incidents')
        .where({ id: incidentId })
        .first();

      if (!incident) {
        return Results.fail<SecurityIncident>(null, 'Incident not found');
      }

      // Get timeline entries
      const timeline = await this.db.knex('incident_timeline')
        .where({ incident_id: incidentId })
        .orderBy('timestamp', 'asc');

      const securityIncident: SecurityIncident = {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        category: incident.category,
        assignedTo: incident.assigned_to,
        reportedBy: incident.reported_by,
        affectedSystems: JSON.parse(incident.affected_systems || '[]'),
        affectedUsers: JSON.parse(incident.affected_users || '[]'),
        detectionIds: JSON.parse(incident.detection_ids || '[]'),
        eventIds: JSON.parse(incident.event_ids || '[]'),
        timeline: timeline.map(entry => ({
          id: entry.id,
          incidentId: entry.incident_id,
          timestamp: entry.timestamp,
          action: entry.action,
          description: entry.description,
          performedBy: entry.performed_by,
          metadata: entry.metadata ? JSON.parse(entry.metadata) : null
        })),
        metadata: incident.metadata ? JSON.parse(incident.metadata) : null,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        resolvedAt: incident.resolved_at
      };

      return Results.ok(securityIncident);
    } catch (error) {
      return Results.fail<SecurityIncident>(null, `Failed to get incident: ${error}`);
    }
  }

  /**
   * Get incidents with filtering
   */
  public async getIncidents(filters: {
    status?: string;
    severity?: string;
    category?: string;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Results<SecurityIncident[]>> {
    try {
      let query = this.db.knex('security_incidents');

      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.severity) {
        query = query.where('severity', filters.severity);
      }
      if (filters.category) {
        query = query.where('category', filters.category);
      }
      if (filters.assignedTo) {
        query = query.where('assigned_to', filters.assignedTo);
      }
      if (filters.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      const incidents = await query
        .orderBy('created_at', 'desc')
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      const results: SecurityIncident[] = [];

      for (const incident of incidents) {
        const timeline = await this.db.knex('incident_timeline')
          .where({ incident_id: incident.id })
          .orderBy('timestamp', 'asc');

        results.push({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          status: incident.status,
          category: incident.category,
          assignedTo: incident.assigned_to,
          reportedBy: incident.reported_by,
          affectedSystems: JSON.parse(incident.affected_systems || '[]'),
          affectedUsers: JSON.parse(incident.affected_users || '[]'),
          detectionIds: JSON.parse(incident.detection_ids || '[]'),
          eventIds: JSON.parse(incident.event_ids || '[]'),
          timeline: timeline.map(entry => ({
            id: entry.id,
            incidentId: entry.incident_id,
            timestamp: entry.timestamp,
            action: entry.action,
            description: entry.description,
            performedBy: entry.performed_by,
            metadata: entry.metadata ? JSON.parse(entry.metadata) : null
          })),
          metadata: incident.metadata ? JSON.parse(incident.metadata) : null,
          createdAt: incident.created_at,
          updatedAt: incident.updated_at,
          resolvedAt: incident.resolved_at
        });
      }

      return Results.ok(results);
    } catch (error) {
      return Results.fail<SecurityIncident[]>(null, `Failed to get incidents: ${error}`);
    }
  }

  /**
   * Assign incident to a user
   */
  public async assignIncident(incidentId: string, assignedTo: string, assignedBy: string): Promise<Results<void>> {
    try {
      await this.db.knex('security_incidents')
        .where({ id: incidentId })
        .update({
          assigned_to: assignedTo,
          updated_at: new Date()
        });

      await this.addTimelineEntry(incidentId, {
        action: 'incident_assigned',
        description: `Incident assigned to ${assignedTo}`,
        performedBy: assignedBy
      });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to assign incident: ${error}`);
    }
  }

  /**
   * Add timeline entry to incident
   */
  public async addTimelineEntry(incidentId: string, entry: Omit<IncidentTimelineEntry, 'id' | 'incidentId' | 'timestamp'>): Promise<Results<string>> {
    try {
      const entryId = `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const timelineEntry: IncidentTimelineEntry = {
        id: entryId,
        incidentId,
        timestamp: new Date(),
        ...entry
      };

      await this.db.knex('incident_timeline').insert({
        id: timelineEntry.id,
        incident_id: timelineEntry.incidentId,
        timestamp: timelineEntry.timestamp,
        action: timelineEntry.action,
        description: timelineEntry.description,
        performed_by: timelineEntry.performedBy,
        metadata: timelineEntry.metadata ? JSON.stringify(timelineEntry.metadata) : null
      });

      return Results.ok(entryId);
    } catch (error) {
      return Results.fail<string>(null, `Failed to add timeline entry: ${error}`);
    }
  }

  /**
   * Create incident response task
   */
  public async createResponse(response: Omit<IncidentResponse, 'id'>): Promise<Results<string>> {
    try {
      const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const incidentResponse: IncidentResponse = {
        id: responseId,
        ...response
      };

      await this.db.knex('incident_responses').insert({
        id: incidentResponse.id,
        incident_id: incidentResponse.incidentId,
        response_type: incidentResponse.responseType,
        description: incidentResponse.description,
        status: incidentResponse.status,
        assigned_to: incidentResponse.assignedTo,
        due_date: incidentResponse.dueDate,
        completed_at: incidentResponse.completedAt,
        metadata: incidentResponse.metadata ? JSON.stringify(incidentResponse.metadata) : null
      });

      await this.addTimelineEntry(response.incidentId, {
        action: 'response_created',
        description: `Response task created: ${response.description}`,
        performedBy: response.assignedTo
      });

      return Results.ok(responseId);
    } catch (error) {
      return Results.fail<string>(null, `Failed to create response: ${error}`);
    }
  }

  /**
   * Get incident statistics
   */
  public async getIncidentStats(timeRange: { start: Date; end: Date }): Promise<Results<any>> {
    try {
      const stats = await this.db.knex('security_incidents')
        .where('created_at', '>=', timeRange.start)
        .where('created_at', '<=', timeRange.end)
        .select(
          this.db.knex.raw('COUNT(*) as total_incidents'),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as critical_count', ['critical']),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as high_count', ['high']),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as medium_count', ['medium']),
          this.db.knex.raw('COUNT(CASE WHEN severity = ? THEN 1 END) as low_count', ['low']),
          this.db.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as open_count', ['open']),
          this.db.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as resolved_count', ['resolved']),
          this.db.knex.raw('AVG(CASE WHEN resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 END) as avg_resolution_hours')
        )
        .first();

      return Results.ok(stats);
    } catch (error) {
      return Results.fail<any>(null, `Failed to get incident stats: ${error}`);
    }
  }

  // Private helper methods

  private async determineAssignee(incident: SecurityIncident): Promise<string | null> {
    // Simple assignment logic based on severity
    switch (incident.severity) {
      case 'critical':
        return 'security_team_lead';
      case 'high':
        return 'senior_security_analyst';
      case 'medium':
        return 'security_analyst';
      case 'low':
        return 'junior_security_analyst';
      default:
        return null;
    }
  }

  private async sendIncidentNotification(incident: SecurityIncident, eventType: string): Promise<void> {
    if (this.logger) {
      await this.logger.info({
        message: `Incident notification: ${eventType}`,
        metadata: {
          incidentId: incident.id,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          eventType
        }
      });
    }

    // TODO: Implement actual notification sending (email, Slack, etc.)
  }
}

// Factory function
export function createSecurityIncidentService(
  db: IDb,
  logger?: ILogger,
  config?: Partial<IncidentConfig>
): SecurityIncidentService {
  return new SecurityIncidentService(db, logger, config);
}
