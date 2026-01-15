/**
 * Security Monitoring and Incident Response Types
 *
 * This module defines types for security event monitoring, intrusion detection,
 * incident response, and compliance monitoring systems.
 */
export declare enum SecurityEventType {
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    LOGIN_FAILURE = "LOGIN_FAILURE",
    LOGOUT = "LOGOUT",
    LOGOUT_ALL = "LOGOUT_ALL",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
    PASSWORD_RESET = "PASSWORD_RESET",
    PASSWORD_RESET_SUCCESS = "PASSWORD_RESET_SUCCESS",
    ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
    ACCOUNT_UNLOCK = "ACCOUNT_UNLOCK",
    SESSION_REVOKED = "SESSION_REVOKED",
    EMAIL_VERIFICATION_SENT = "EMAIL_VERIFICATION_SENT",
    EMAIL_VERIFIED = "EMAIL_VERIFIED",
    ACCESS_GRANTED = "ACCESS_GRANTED",
    ACCESS_DENIED = "ACCESS_DENIED",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    PERMISSION_ESCALATION = "PERMISSION_ESCALATION",
    ROLE_ASSIGNMENT = "ROLE_ASSIGNMENT",
    ROLE_REVOCATION = "ROLE_REVOCATION",
    USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
    CROSS_TENANT_ACCESS_ATTEMPT = "CROSS_TENANT_ACCESS_ATTEMPT",
    TENANT_ISOLATION_BREACH = "TENANT_ISOLATION_BREACH",
    TENANT_DATA_ACCESS = "TENANT_DATA_ACCESS",
    SENSITIVE_DATA_ACCESS = "SENSITIVE_DATA_ACCESS",
    DATA_EXPORT = "DATA_EXPORT",
    DATA_DELETION = "DATA_DELETION",
    DATA_MODIFICATION = "DATA_MODIFICATION",
    BULK_DATA_OPERATION = "BULK_DATA_OPERATION",
    ADMIN_ACTION = "ADMIN_ACTION",
    CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
    SERVICE_START = "SERVICE_START",
    SERVICE_STOP = "SERVICE_STOP",
    MULTIPLE_FAILED_LOGINS = "MULTIPLE_FAILED_LOGINS",
    UNUSUAL_ACCESS_PATTERN = "UNUSUAL_ACCESS_PATTERN",
    SUSPICIOUS_IP_ACCESS = "SUSPICIOUS_IP_ACCESS",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    MALICIOUS_REQUEST = "MALICIOUS_REQUEST",
    BLOCKED_IP = "BLOCKED_IP",
    BLOCKED_USER_AGENT = "BLOCKED_USER_AGENT",
    GDPR_REQUEST = "GDPR_REQUEST",
    HIPAA_ACCESS = "HIPAA_ACCESS",
    AUDIT_LOG_ACCESS = "AUDIT_LOG_ACCESS",
    COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION"
}
export declare enum SecurityEventSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum SecurityEventStatus {
    DETECTED = "DETECTED",
    INVESTIGATING = "INVESTIGATING",
    CONFIRMED = "CONFIRMED",
    FALSE_POSITIVE = "FALSE_POSITIVE",
    RESOLVED = "RESOLVED",
    ESCALATED = "ESCALATED"
}
export declare enum ThreatLevel {
    NONE = "NONE",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum IncidentStatus {
    OPEN = "OPEN",
    INVESTIGATING = "INVESTIGATING",
    CONTAINED = "CONTAINED",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED"
}
export declare enum ResponseAction {
    LOG_ONLY = "LOG_ONLY",
    ALERT = "ALERT",
    BLOCK_IP = "BLOCK_IP",
    LOCK_ACCOUNT = "LOCK_ACCOUNT",
    REVOKE_SESSION = "REVOKE_SESSION",
    ESCALATE = "ESCALATE",
    NOTIFY_ADMIN = "NOTIFY_ADMIN",
    QUARANTINE = "QUARANTINE"
}
export interface SecurityEvent {
    id: string;
    eventType: SecurityEventType;
    severity: SecurityEventSeverity;
    status: SecurityEventStatus;
    timestamp: Date;
    userId?: string;
    tenantId?: string;
    sessionId?: string;
    requestId?: string;
    ipAddress: string;
    userAgent?: string;
    geolocation?: GeolocationInfo;
    resource?: string;
    action?: string;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    metadata: Record<string, any>;
    tags: string[];
    riskScore: number;
    threatLevel: ThreatLevel;
    responseActions: ResponseAction[];
    responseTimestamp?: Date;
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
export interface IntrusionDetectionRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    eventTypes: SecurityEventType[];
    conditions: DetectionCondition[];
    threshold: DetectionThreshold;
    severity: SecurityEventSeverity;
    responseActions: ResponseAction[];
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
    timeWindow?: number;
    groupBy?: string[];
}
export interface SuspiciousActivityPattern {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    patternType: 'behavioral' | 'statistical' | 'rule_based';
    baselineWindow: number;
    deviationThreshold: number;
    minEvents: number;
    maxEvents?: number;
    timeWindow: number;
    severity: SecurityEventSeverity;
    responseActions: ResponseAction[];
    createdAt: Date;
    updatedAt: Date;
    lastDetection?: Date;
    detectionCount: number;
}
export interface ActivityBaseline {
    userId?: string;
    tenantId?: string;
    ipAddress?: string;
    avgLoginFrequency: number;
    avgSessionDuration: number;
    commonAccessPatterns: string[];
    typicalAccessTimes: TimeRange[];
    geographicLocations: string[];
    standardDeviations: Record<string, number>;
    percentiles: Record<string, number>;
    calculatedAt: Date;
    sampleSize: number;
    confidenceLevel: number;
}
export interface TimeRange {
    startHour: number;
    endHour: number;
    dayOfWeek?: number;
}
export interface SecurityIncident {
    id: string;
    title: string;
    description: string;
    status: IncidentStatus;
    severity: SecurityEventSeverity;
    incidentType: string;
    category: string;
    subcategory?: string;
    detectedAt: Date;
    reportedAt: Date;
    acknowledgedAt?: Date;
    containedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    assignedTo?: string;
    reportedBy?: string;
    relatedEvents: string[];
    rootCause?: string;
    affectedUsers: string[];
    affectedTenants: string[];
    affectedSystems: string[];
    businessImpact: string;
    responseActions: IncidentResponseAction[];
    containmentActions: string[];
    recoveryActions: string[];
    timeline: IncidentTimelineEntry[];
    notes: string[];
    attachments: string[];
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
export interface SecurityMonitoringConfig {
    enableRealTimeMonitoring: boolean;
    eventRetentionDays: number;
    batchSize: number;
    enableIntrusionDetection: boolean;
    enableBehavioralAnalysis: boolean;
    enableAnomalyDetection: boolean;
    enableAlerts: boolean;
    alertChannels: AlertChannel[];
    escalationRules: EscalationRule[];
    enableComplianceMonitoring: boolean;
    complianceFrameworks: string[];
    maxEventsPerSecond: number;
    alertThrottling: boolean;
    externalSiemEnabled: boolean;
    siemEndpoint?: string;
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
    severity: SecurityEventSeverity;
    timeThreshold: number;
    eventCount?: number;
    escalateTo: string[];
    notificationChannels: string[];
    createdAt: Date;
    lastTriggered?: Date;
}
export interface SecurityMetrics {
    timeRange: {
        start: Date;
        end: Date;
    };
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    threatsDetected: number;
    threatsBlocked: number;
    falsePositives: number;
    incidentsCreated: number;
    incidentsResolved: number;
    avgResolutionTime: number;
    uniqueUsers: number;
    failedLogins: number;
    suspiciousActivities: number;
    monitoringUptime: number;
    alertsGenerated: number;
    responseTime: number;
    complianceViolations: number;
    auditRequests: number;
    dataExports: number;
}
export interface SecurityReport {
    id: string;
    title: string;
    type: 'daily' | 'weekly' | 'monthly' | 'incident' | 'compliance' | 'custom';
    summary: string;
    metrics: SecurityMetrics;
    topThreats: ThreatSummary[];
    recommendations: string[];
    generatedAt: Date;
    generatedBy?: string;
    period: {
        start: Date;
        end: Date;
    };
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
//# sourceMappingURL=security-monitoring.d.ts.map