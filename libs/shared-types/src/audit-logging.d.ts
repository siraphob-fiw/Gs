/**
 * Audit Logging and Compliance Types
 * Comprehensive types for audit logging, compliance tracking, and data protection
 */
export declare enum AuditEventType {
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    LOGIN_FAILURE = "LOGIN_FAILURE",
    LOGOUT = "LOGOUT",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    PASSWORD_RESET = "PASSWORD_RESET",
    USER_CREATED = "USER_CREATED",
    USER_UPDATED = "USER_UPDATED",
    USER_DELETED = "USER_DELETED",
    USER_SUSPENDED = "USER_SUSPENDED",
    USER_REACTIVATED = "USER_REACTIVATED",
    DATA_ACCESSED = "DATA_ACCESSED",
    DATA_EXPORTED = "DATA_EXPORTED",
    DATA_IMPORTED = "DATA_IMPORTED",
    DATA_DELETED = "DATA_DELETED",
    DATA_MODIFIED = "DATA_MODIFIED",
    CONSENT_GRANTED = "CONSENT_GRANTED",
    CONSENT_REVOKED = "CONSENT_REVOKED",
    CONSENT_UPDATED = "CONSENT_UPDATED",
    PRIVACY_SETTINGS_CHANGED = "PRIVACY_SETTINGS_CHANGED",
    HEALTH_DATA_ACCESSED = "HEALTH_DATA_ACCESSED",
    HEALTH_DATA_MODIFIED = "HEALTH_DATA_MODIFIED",
    HEALTH_DATA_SHARED = "HEALTH_DATA_SHARED",
    HEALTH_DATA_DELETED = "HEALTH_DATA_DELETED",
    UNAUTHORIZED_ACCESS_ATTEMPT = "UNAUTHORIZED_ACCESS_ATTEMPT",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    SECURITY_VIOLATION = "SECURITY_VIOLATION",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    DATA_BREACH_DETECTED = "DATA_BREACH_DETECTED",
    COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION",
    AUDIT_REPORT_GENERATED = "AUDIT_REPORT_GENERATED",
    RETENTION_POLICY_APPLIED = "RETENTION_POLICY_APPLIED",
    COACH_ASSIGNED = "COACH_ASSIGNED",
    COACH_REMOVED = "COACH_REMOVED",
    ATHLETE_TRANSFERRED = "ATHLETE_TRANSFERRED",
    RELATIONSHIP_STATUS_CHANGED = "RELATIONSHIP_STATUS_CHANGED",
    SYSTEM_CONFIGURATION_CHANGED = "SYSTEM_CONFIGURATION_CHANGED",
    TENANT_CREATED = "TENANT_CREATED",
    TENANT_SUSPENDED = "TENANT_SUSPENDED",
    BACKUP_CREATED = "BACKUP_CREATED",
    BACKUP_RESTORED = "BACKUP_RESTORED"
}
export declare enum AuditSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ComplianceFramework {
    GDPR = "GDPR",
    PDPA = "PDPA",
    HIPAA = "HIPAA",
    CCPA = "CCPA",
    SOX = "SOX",
    ISO27001 = "ISO27001"
}
export declare enum DataCategory {
    PERSONAL_DATA = "PERSONAL_DATA",
    SENSITIVE_PERSONAL_DATA = "SENSITIVE_PERSONAL_DATA",
    HEALTH_DATA = "HEALTH_DATA",
    BIOMETRIC_DATA = "BIOMETRIC_DATA",
    FINANCIAL_DATA = "FINANCIAL_DATA",
    TRAINING_DATA = "TRAINING_DATA",
    SYSTEM_DATA = "SYSTEM_DATA"
}
export declare enum ConsentType {
    DATA_PROCESSING = "DATA_PROCESSING",
    MARKETING = "MARKETING",
    ANALYTICS = "ANALYTICS",
    HEALTH_DATA_COLLECTION = "HEALTH_DATA_COLLECTION",
    DATA_SHARING = "DATA_SHARING",
    COOKIES = "COOKIES",
    THIRD_PARTY_INTEGRATIONS = "THIRD_PARTY_INTEGRATIONS"
}
export declare enum ConsentStatus {
    GRANTED = "GRANTED",
    REVOKED = "REVOKED",
    PENDING = "PENDING",
    EXPIRED = "EXPIRED"
}
export declare enum DataRetentionStatus {
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED",
    SCHEDULED_FOR_DELETION = "SCHEDULED_FOR_DELETION",
    DELETED = "DELETED",
    ANONYMIZED = "ANONYMIZED"
}
export declare enum IncidentSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum IncidentStatus {
    DETECTED = "DETECTED",
    INVESTIGATING = "INVESTIGATING",
    CONTAINED = "CONTAINED",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED"
}
export interface AuditLogEntry {
    id: string;
    tenantId: string;
    userId?: string;
    sessionId?: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    resource: string;
    action: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    description: string;
    metadata: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    location?: GeoLocation;
    dataCategories: DataCategory[];
    complianceFrameworks: ComplianceFramework[];
    timestamp: Date;
    duration?: number;
    relatedEvents?: string[];
    correlationId?: string;
    retentionUntil: Date;
    isEncrypted: boolean;
    encryptionKeyId?: string;
}
export interface GeoLocation {
    country: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
}
export interface ConsentRecord {
    id: string;
    userId: string;
    tenantId: string;
    consentType: ConsentType;
    status: ConsentStatus;
    purpose: string;
    description: string;
    legalBasis: string;
    version: string;
    previousConsentId?: string;
    grantedAt?: Date;
    revokedAt?: Date;
    expiresAt?: Date;
    grantedVia: 'WEB' | 'MOBILE' | 'API' | 'ADMIN';
    ipAddress: string;
    userAgent?: string;
    complianceFrameworks: ComplianceFramework[];
    retentionPeriod: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface DataProcessingRecord {
    id: string;
    userId: string;
    tenantId: string;
    dataCategory: DataCategory;
    purpose: string;
    legalBasis: string;
    processingType: 'COLLECTION' | 'STORAGE' | 'ANALYSIS' | 'SHARING' | 'DELETION';
    dataFields: string[];
    dataSource: string;
    dataDestination?: string;
    consentRecordId?: string;
    isConsentRequired: boolean;
    complianceFrameworks: ComplianceFramework[];
    retentionPeriod: number;
    processedAt: Date;
    scheduledDeletionAt?: Date;
    metadata: Record<string, any>;
}
export interface DataExportRequest {
    id: string;
    userId: string;
    tenantId: string;
    requestedBy: string;
    dataCategories: DataCategory[];
    format: 'JSON' | 'CSV' | 'XML' | 'PDF';
    includeMetadata: boolean;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
    exportUrl?: string;
    exportSize?: number;
    recordCount?: number;
    encryptionEnabled: boolean;
    accessToken?: string;
    expiresAt: Date;
    requestedAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    legalBasis: string;
    complianceFrameworks: ComplianceFramework[];
    metadata: Record<string, any>;
}
export interface DataDeletionRequest {
    id: string;
    userId: string;
    tenantId: string;
    requestedBy: string;
    deletionType: 'FULL' | 'PARTIAL' | 'ANONYMIZATION';
    dataCategories: DataCategory[];
    retainAnalytics: boolean;
    status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    deletedRecords: DeletionSummary[];
    anonymizedRecords: DeletionSummary[];
    retainedRecords: DeletionSummary[];
    requestedAt: Date;
    scheduledFor?: Date;
    processedAt?: Date;
    completedAt?: Date;
    legalBasis: string;
    complianceFrameworks: ComplianceFramework[];
    metadata: Record<string, any>;
}
export interface DeletionSummary {
    table: string;
    recordCount: number;
    dataCategory: DataCategory;
    deletionMethod: 'HARD_DELETE' | 'SOFT_DELETE' | 'ANONYMIZATION';
}
export interface ComplianceReport {
    id: string;
    tenantId?: string;
    reportType: 'AUDIT_TRAIL' | 'CONSENT_SUMMARY' | 'DATA_PROCESSING' | 'BREACH_REPORT' | 'RETENTION_REPORT';
    title: string;
    description: string;
    framework: ComplianceFramework;
    startDate: Date;
    endDate: Date;
    dataCategories: DataCategory[];
    status: 'GENERATING' | 'COMPLETED' | 'FAILED';
    reportUrl?: string;
    reportSize?: number;
    findings: ComplianceFinding[];
    generatedBy: string;
    generatedAt: Date;
    expiresAt: Date;
    metadata: Record<string, any>;
}
export interface ComplianceFinding {
    id: string;
    severity: 'INFO' | 'WARNING' | 'VIOLATION' | 'CRITICAL';
    category: string;
    description: string;
    recommendation?: string;
    affectedRecords: number;
    complianceFramework: ComplianceFramework;
    metadata: Record<string, any>;
}
export interface SecurityIncident {
    id: string;
    tenantId?: string;
    title: string;
    description: string;
    incidentType: 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS' | 'SYSTEM_COMPROMISE' | 'PRIVACY_VIOLATION';
    severity: IncidentSeverity;
    status: IncidentStatus;
    detectedAt: Date;
    detectedBy: 'SYSTEM' | 'USER' | 'EXTERNAL';
    detectionMethod: string;
    affectedUsers: number;
    affectedDataCategories: DataCategory[];
    potentialImpact: string;
    responseTeam: string[];
    containmentActions: string[];
    investigationNotes: string[];
    containedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    notificationsSent: IncidentNotification[];
    regulatoryNotificationRequired: boolean;
    regulatoryNotificationSent?: boolean;
    complianceFrameworks: ComplianceFramework[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface IncidentNotification {
    id: string;
    incidentId: string;
    notificationType: 'USER' | 'ADMIN' | 'REGULATORY' | 'EXTERNAL';
    recipient: string;
    channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'API';
    sentAt: Date;
    acknowledged?: boolean;
    acknowledgedAt?: Date;
}
export interface DataRetentionPolicy {
    id: string;
    tenantId?: string;
    name: string;
    description: string;
    dataCategory: DataCategory;
    retentionPeriod: number;
    retentionBasis: 'LEGAL_REQUIREMENT' | 'BUSINESS_NEED' | 'CONSENT_BASED' | 'REGULATORY';
    actionAfterRetention: 'DELETE' | 'ANONYMIZE' | 'ARCHIVE' | 'REVIEW';
    automaticExecution: boolean;
    complianceFrameworks: ComplianceFramework[];
    legalBasis: string;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuditConfiguration {
    tenantId?: string;
    enabledEventTypes: AuditEventType[];
    logLevel: 'MINIMAL' | 'STANDARD' | 'DETAILED' | 'COMPREHENSIVE';
    defaultRetentionPeriod: number;
    encryptionEnabled: boolean;
    enabledFrameworks: ComplianceFramework[];
    automaticReporting: boolean;
    reportingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    alertOnViolations: boolean;
    alertRecipients: string[];
    batchSize: number;
    asyncProcessing: boolean;
    updatedBy: string;
    updatedAt: Date;
}
export interface CreateAuditLogRequest {
    eventType: AuditEventType;
    severity: AuditSeverity;
    resource: string;
    action: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    description: string;
    metadata?: Record<string, any>;
    dataCategories?: DataCategory[];
    complianceFrameworks?: ComplianceFramework[];
    correlationId?: string;
}
export interface AuditLogQuery {
    tenantId?: string;
    userId?: string;
    eventTypes?: AuditEventType[];
    severities?: AuditSeverity[];
    resources?: string[];
    startDate?: Date;
    endDate?: Date;
    dataCategories?: DataCategory[];
    complianceFrameworks?: ComplianceFramework[];
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'severity' | 'eventType';
    sortOrder?: 'ASC' | 'DESC';
}
export interface ConsentUpdateRequest {
    consentType: ConsentType;
    status: ConsentStatus;
    purpose: string;
    description: string;
    legalBasis: string;
    version: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}
export interface DataExportRequestInput {
    dataCategories: DataCategory[];
    format: 'JSON' | 'CSV' | 'XML' | 'PDF';
    includeMetadata?: boolean;
    legalBasis: string;
}
export interface DataDeletionRequestInput {
    deletionType: 'FULL' | 'PARTIAL' | 'ANONYMIZATION';
    dataCategories?: DataCategory[];
    retainAnalytics?: boolean;
    legalBasis: string;
    scheduledFor?: Date;
}
export interface ComplianceReportRequest {
    reportType: 'AUDIT_TRAIL' | 'CONSENT_SUMMARY' | 'DATA_PROCESSING' | 'BREACH_REPORT' | 'RETENTION_REPORT';
    framework: ComplianceFramework;
    startDate: Date;
    endDate: Date;
    dataCategories?: DataCategory[];
    tenantId?: string;
}
export interface SecurityIncidentRequest {
    title: string;
    description: string;
    incidentType: 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS' | 'SYSTEM_COMPROMISE' | 'PRIVACY_VIOLATION';
    severity: IncidentSeverity;
    affectedDataCategories: DataCategory[];
    potentialImpact: string;
    detectionMethod: string;
}
//# sourceMappingURL=audit-logging.d.ts.map