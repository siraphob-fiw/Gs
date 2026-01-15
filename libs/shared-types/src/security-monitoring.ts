/**
 * Security Monitoring and Incident Response Types
 * 
 * This module defines types for security event monitoring, intrusion detection,
 * incident response, and compliance monitoring systems.
 */

// Security Event Types
export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  LOGOUT_ALL = 'LOGOUT_ALL',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  ACCOUNT_LOCKOUT = 'ACCOUNT_LOCKOUT',
  ACCOUNT_UNLOCK = 'ACCOUNT_UNLOCK',
  SESSION_REVOKED = 'SESSION_REVOKED',
  EMAIL_VERIFICATION_SENT = 'EMAIL_VERIFICATION_SENT',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  REGISTER_FAILURE = 'REGISTER_FAILURE',
  
  // Authorization Events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_ESCALATION = 'PERMISSION_ESCALATION',
  ROLE_ASSIGNMENT = 'ROLE_ASSIGNMENT',
  ROLE_REVOCATION = 'ROLE_REVOCATION',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  
  // Tenant Isolation Events
  CROSS_TENANT_ACCESS_ATTEMPT = 'CROSS_TENANT_ACCESS_ATTEMPT',
  TENANT_ISOLATION_BREACH = 'TENANT_ISOLATION_BREACH',
  TENANT_DATA_ACCESS = 'TENANT_DATA_ACCESS',
  
  // Data Events
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  BULK_DATA_OPERATION = 'BULK_DATA_OPERATION',
  
  // System Events
  ADMIN_ACTION = 'ADMIN_ACTION',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  SERVICE_START = 'SERVICE_START',
  SERVICE_STOP = 'SERVICE_STOP',
  
  // Suspicious Activity
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  UNUSUAL_ACCESS_PATTERN = 'UNUSUAL_ACCESS_PATTERN',
  SUSPICIOUS_IP_ACCESS = 'SUSPICIOUS_IP_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MALICIOUS_REQUEST = 'MALICIOUS_REQUEST',
  BLOCKED_IP = 'BLOCKED_IP',
  BLOCKED_USER_AGENT = 'BLOCKED_USER_AGENT',
  
  // Compliance Events
  GDPR_REQUEST = 'GDPR_REQUEST',
  HIPAA_ACCESS = 'HIPAA_ACCESS',
  AUDIT_LOG_ACCESS = 'AUDIT_LOG_ACCESS',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
}

export enum SecurityEventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SecurityEventStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  CONFIRMED = 'CONFIRMED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum ThreatLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  CONTAINED = 'CONTAINED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ResponseAction {
  LOG_ONLY = 'LOG_ONLY',
  ALERT = 'ALERT',
  BLOCK_IP = 'BLOCK_IP',
  LOCK_ACCOUNT = 'LOCK_ACCOUNT',
  REVOKE_SESSION = 'REVOKE_SESSION',
  ESCALATE = 'ESCALATE',
  NOTIFY_ADMIN = 'NOTIFY_ADMIN',
  QUARANTINE = 'QUARANTINE',
}

// Core Security Event Interface
export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  status: SecurityEventStatus;
  timestamp: Date;
  
  // Context Information
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  requestId?: string;
  
  // Network Information
  ipAddress: string;
  userAgent?: string;
  geolocation?: GeolocationInfo;
  
  // Event Details
  resource?: string;
  action?: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  // Metadata
  metadata: Record<string, any>;
  tags: string[];
  
  // Risk Assessment
  riskScore: number;
  threatLevel: ThreatLevel;
  
  // Response
  responseActions: ResponseAction[];
  responseTimestamp?: Date;
  
  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  investigatedBy?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface GeolocationInfo {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
}

// Intrusion Detection
export interface IntrusionDetectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Rule Configuration
  eventTypes: SecurityEventType[];
  conditions: DetectionCondition[];
  threshold: DetectionThreshold;
  
  // Response Configuration
  severity: SecurityEventSeverity;
  responseActions: ResponseAction[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface DetectionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'regex';
  value: any;
  caseSensitive?: boolean;
}

export interface DetectionThreshold {
  type: 'count' | 'rate' | 'pattern';
  value: number;
  timeWindow?: number; // seconds
  groupBy?: string[];
}

// Suspicious Activity Detection
export interface SuspiciousActivityPattern {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Pattern Configuration
  patternType: 'behavioral' | 'statistical' | 'rule_based';
  baselineWindow: number; // hours
  deviationThreshold: number;
  
  // Detection Parameters
  minEvents: number;
  maxEvents?: number;
  timeWindow: number; // seconds
  
  // Response
  severity: SecurityEventSeverity;
  responseActions: ResponseAction[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastDetection?: Date;
  detectionCount: number;
}

export interface ActivityBaseline {
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  
  // Baseline Metrics
  avgLoginFrequency: number;
  avgSessionDuration: number;
  commonAccessPatterns: string[];
  typicalAccessTimes: TimeRange[];
  geographicLocations: string[];
  
  // Statistical Data
  standardDeviations: Record<string, number>;
  percentiles: Record<string, number>;
  
  // Metadata
  calculatedAt: Date;
  sampleSize: number;
  confidenceLevel: number;
}

export interface TimeRange {
  startHour: number;
  endHour: number;
  dayOfWeek?: number;
}

// Security Incident Management
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: SecurityEventSeverity;
  
  // Classification
  incidentType: string;
  category: string;
  subcategory?: string;
  
  // Timeline
  detectedAt: Date;
  reportedAt: Date;
  acknowledgedAt?: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  
  // Assignment
  assignedTo?: string;
  reportedBy?: string;
  
  // Related Events
  relatedEvents: string[]; // SecurityEvent IDs
  rootCause?: string;
  
  // Impact Assessment
  affectedUsers: string[];
  affectedTenants: string[];
  affectedSystems: string[];
  businessImpact: string;
  
  // Response
  responseActions: IncidentResponseAction[];
  containmentActions: string[];
  recoveryActions: string[];
  
  // Documentation
  timeline: IncidentTimelineEntry[];
  notes: string[];
  attachments: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentResponseAction {
  id: string;
  action: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  result?: string;
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: Date;
  event: string;
  description: string;
  actor?: string;
  automated: boolean;
}

// Security Monitoring Configuration
export interface SecurityMonitoringConfig {
  // Event Collection
  enableRealTimeMonitoring: boolean;
  eventRetentionDays: number;
  batchSize: number;
  
  // Detection Settings
  enableIntrusionDetection: boolean;
  enableBehavioralAnalysis: boolean;
  enableAnomalyDetection: boolean;
  
  // Alerting
  enableAlerts: boolean;
  alertChannels: AlertChannel[];
  escalationRules: EscalationRule[];
  
  // Compliance
  enableComplianceMonitoring: boolean;
  complianceFrameworks: string[];
  
  // Performance
  maxEventsPerSecond: number;
  alertThrottling: boolean;
  
  // Integration
  externalSiemEnabled: boolean;
  siemEndpoint?: string;
  
  // Metadata
  lastUpdated: Date;
  updatedBy: string;
}

export interface AlertChannel {
  id: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
  severityFilter: SecurityEventSeverity[];
}

export interface EscalationRule {
  id: string;
  name: string;
  enabled: boolean;
  
  // Trigger Conditions
  severity: SecurityEventSeverity;
  timeThreshold: number; // minutes
  eventCount?: number;
  
  // Escalation Actions
  escalateTo: string[];
  notificationChannels: string[];
  
  // Metadata
  createdAt: Date;
  lastTriggered?: Date;
}

// Security Metrics and Reporting
export interface SecurityMetrics {
  timeRange: {
    start: Date;
    end: Date;
  };
  
  // Event Statistics
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecurityEventSeverity, number>;
  
  // Threat Statistics
  threatsDetected: number;
  threatsBlocked: number;
  falsePositives: number;
  
  // Incident Statistics
  incidentsCreated: number;
  incidentsResolved: number;
  avgResolutionTime: number; // minutes
  
  // User Activity
  uniqueUsers: number;
  failedLogins: number;
  suspiciousActivities: number;
  
  // System Health
  monitoringUptime: number; // percentage
  alertsGenerated: number;
  responseTime: number; // milliseconds
  
  // Compliance
  complianceViolations: number;
  auditRequests: number;
  dataExports: number;
}

export interface SecurityReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'incident' | 'compliance' | 'custom';
  
  // Report Content
  summary: string;
  metrics: SecurityMetrics;
  topThreats: ThreatSummary[];
  recommendations: string[];
  
  // Metadata
  generatedAt: Date;
  generatedBy?: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Distribution
  recipients: string[];
  deliveryStatus: 'pending' | 'sent' | 'failed';
}

export interface ThreatSummary {
  threatType: string;
  count: number;
  severity: SecurityEventSeverity;
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: number;
  status: 'active' | 'mitigated' | 'resolved';
}

// API Request/Response Types
export interface CreateSecurityEventRequest {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  tenantId?: string;
  resource?: string;
  action?: string;
  success: boolean;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface SecurityEventQuery {
  eventTypes?: SecurityEventType[];
  severities?: SecurityEventSeverity[];
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SecurityEventResponse {
  events: SecurityEvent[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  severity: SecurityEventSeverity;
  incidentType: string;
  category: string;
  relatedEvents?: string[];
  affectedUsers?: string[];
  affectedTenants?: string[];
}

export interface UpdateIncidentRequest {
  status?: IncidentStatus;
  assignedTo?: string;
  notes?: string;
  responseActions?: IncidentResponseAction[];
}

export interface SecurityDashboardData {
  realtimeMetrics: {
    activeThreats: number;
    eventsLastHour: number;
    failedLoginsLastHour: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  
  recentEvents: SecurityEvent[];
  activeIncidents: SecurityIncident[];
  threatTrends: ThreatTrendData[];
  complianceStatus: ComplianceStatusData;
}

export interface ThreatTrendData {
  date: Date;
  threatCount: number;
  severity: SecurityEventSeverity;
}

export interface ComplianceStatusData {
  framework: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  lastAssessment: Date;
  violations: number;
  recommendations: string[];
}

// Webhook and Integration Types
export interface SecurityWebhookPayload {
  eventType: 'security_event' | 'incident_created' | 'incident_updated' | 'threat_detected';
  timestamp: Date;
  data: SecurityEvent | SecurityIncident | ThreatSummary;
  metadata: {
    source: string;
    version: string;
    environment: string;
  };
}

export interface SiemIntegrationConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  format: 'json' | 'cef' | 'syslog';
  batchSize: number;
  retryAttempts: number;
  timeout: number;
}