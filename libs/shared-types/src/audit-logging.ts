/**
 * Audit Logging and Compliance Types
 * Comprehensive types for audit logging, compliance tracking, and data protection
 */

export enum AuditEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // User Management Events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  
  // Data Access Events
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_MODIFIED = 'DATA_MODIFIED',
  
  // Privacy and Consent Events
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  CONSENT_UPDATED = 'CONSENT_UPDATED',
  PRIVACY_SETTINGS_CHANGED = 'PRIVACY_SETTINGS_CHANGED',
  
  // Health Data Events
  HEALTH_DATA_ACCESSED = 'HEALTH_DATA_ACCESSED',
  HEALTH_DATA_MODIFIED = 'HEALTH_DATA_MODIFIED',
  HEALTH_DATA_SHARED = 'HEALTH_DATA_SHARED',
  HEALTH_DATA_DELETED = 'HEALTH_DATA_DELETED',
  
  // Security Events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // Compliance Events
  DATA_BREACH_DETECTED = 'DATA_BREACH_DETECTED',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  AUDIT_REPORT_GENERATED = 'AUDIT_REPORT_GENERATED',
  RETENTION_POLICY_APPLIED = 'RETENTION_POLICY_APPLIED',
  
  // Coach-Athlete Relationship Events
  COACH_ASSIGNED = 'COACH_ASSIGNED',
  COACH_REMOVED = 'COACH_REMOVED',
  ATHLETE_TRANSFERRED = 'ATHLETE_TRANSFERRED',
  RELATIONSHIP_STATUS_CHANGED = 'RELATIONSHIP_STATUS_CHANGED',
  
  // Administrative Events
  SYSTEM_CONFIGURATION_CHANGED = 'SYSTEM_CONFIGURATION_CHANGED',
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ComplianceFramework {
  GDPR = 'GDPR',
  PDPA = 'PDPA',
  HIPAA = 'HIPAA',
  CCPA = 'CCPA',
  SOX = 'SOX',
  ISO27001 = 'ISO27001',
}

export enum DataCategory {
  PERSONAL_DATA = 'PERSONAL_DATA',
  SENSITIVE_PERSONAL_DATA = 'SENSITIVE_PERSONAL_DATA',
  HEALTH_DATA = 'HEALTH_DATA',
  BIOMETRIC_DATA = 'BIOMETRIC_DATA',
  FINANCIAL_DATA = 'FINANCIAL_DATA',
  TRAINING_DATA = 'TRAINING_DATA',
  SYSTEM_DATA = 'SYSTEM_DATA',
}

export enum ConsentType {
  DATA_PROCESSING = 'DATA_PROCESSING',
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  HEALTH_DATA_COLLECTION = 'HEALTH_DATA_COLLECTION',
  DATA_SHARING = 'DATA_SHARING',
  COOKIES = 'COOKIES',
  THIRD_PARTY_INTEGRATIONS = 'THIRD_PARTY_INTEGRATIONS',
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
}

export enum DataRetentionStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED_FOR_DELETION = 'SCHEDULED_FOR_DELETION',
  DELETED = 'DELETED',
  ANONYMIZED = 'ANONYMIZED',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  CONTAINED = 'CONTAINED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
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
  
  // Event Details
  description: string;
  metadata: Record<string, any>;
  
  // Context Information
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  
  // Data Classification
  dataCategories: DataCategory[];
  complianceFrameworks: ComplianceFramework[];
  
  // Timing
  timestamp: Date;
  duration?: number; // in milliseconds
  
  // Relationships
  relatedEvents?: string[]; // IDs of related audit entries
  correlationId?: string; // For tracking related operations
  
  // Compliance
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
  
  // Consent Details
  purpose: string;
  description: string;
  legalBasis: string;
  
  // Versioning
  version: string;
  previousConsentId?: string;
  
  // Timing
  grantedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  
  // Context
  grantedVia: 'WEB' | 'MOBILE' | 'API' | 'ADMIN';
  ipAddress: string;
  userAgent?: string;
  
  // Compliance
  complianceFrameworks: ComplianceFramework[];
  retentionPeriod: number; // in days
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataProcessingRecord {
  id: string;
  userId: string;
  tenantId: string;
  dataCategory: DataCategory;
  
  // Processing Details
  purpose: string;
  legalBasis: string;
  processingType: 'COLLECTION' | 'STORAGE' | 'ANALYSIS' | 'SHARING' | 'DELETION';
  
  // Data Details
  dataFields: string[];
  dataSource: string;
  dataDestination?: string;
  
  // Consent
  consentRecordId?: string;
  isConsentRequired: boolean;
  
  // Compliance
  complianceFrameworks: ComplianceFramework[];
  retentionPeriod: number; // in days
  
  // Timing
  processedAt: Date;
  scheduledDeletionAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  tenantId: string;
  requestedBy: string; // User ID who requested the export
  
  // Export Details
  dataCategories: DataCategory[];
  format: 'JSON' | 'CSV' | 'XML' | 'PDF';
  includeMetadata: boolean;
  
  // Status
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  
  // Results
  exportUrl?: string;
  exportSize?: number; // in bytes
  recordCount?: number;
  
  // Security
  encryptionEnabled: boolean;
  accessToken?: string;
  expiresAt: Date;
  
  // Timing
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Compliance
  legalBasis: string;
  complianceFrameworks: ComplianceFramework[];
  
  // Metadata
  metadata: Record<string, any>;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  tenantId: string;
  requestedBy: string; // User ID who requested the deletion
  
  // Deletion Details
  deletionType: 'FULL' | 'PARTIAL' | 'ANONYMIZATION';
  dataCategories: DataCategory[];
  retainAnalytics: boolean;
  
  // Status
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  
  // Approval
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Results
  deletedRecords: DeletionSummary[];
  anonymizedRecords: DeletionSummary[];
  retainedRecords: DeletionSummary[];
  
  // Timing
  requestedAt: Date;
  scheduledFor?: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Compliance
  legalBasis: string;
  complianceFrameworks: ComplianceFramework[];
  
  // Metadata
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
  tenantId?: string; // null for system-wide reports
  reportType: 'AUDIT_TRAIL' | 'CONSENT_SUMMARY' | 'DATA_PROCESSING' | 'BREACH_REPORT' | 'RETENTION_REPORT';
  
  // Report Details
  title: string;
  description: string;
  framework: ComplianceFramework;
  
  // Scope
  startDate: Date;
  endDate: Date;
  dataCategories: DataCategory[];
  
  // Status
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  
  // Results
  reportUrl?: string;
  reportSize?: number; // in bytes
  findings: ComplianceFinding[];
  
  // Generation
  generatedBy: string;
  generatedAt: Date;
  expiresAt: Date;
  
  // Metadata
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
  
  // Incident Details
  title: string;
  description: string;
  incidentType: 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS' | 'SYSTEM_COMPROMISE' | 'PRIVACY_VIOLATION';
  severity: IncidentSeverity;
  status: IncidentStatus;
  
  // Detection
  detectedAt: Date;
  detectedBy: 'SYSTEM' | 'USER' | 'EXTERNAL';
  detectionMethod: string;
  
  // Impact Assessment
  affectedUsers: number;
  affectedDataCategories: DataCategory[];
  potentialImpact: string;
  
  // Response
  responseTeam: string[];
  containmentActions: string[];
  investigationNotes: string[];
  
  // Timeline
  containedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  
  // Notifications
  notificationsSent: IncidentNotification[];
  regulatoryNotificationRequired: boolean;
  regulatoryNotificationSent?: boolean;
  
  // Compliance
  complianceFrameworks: ComplianceFramework[];
  
  // Metadata
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
  tenantId?: string; // null for system-wide policies
  
  // Policy Details
  name: string;
  description: string;
  dataCategory: DataCategory;
  
  // Retention Rules
  retentionPeriod: number; // in days
  retentionBasis: 'LEGAL_REQUIREMENT' | 'BUSINESS_NEED' | 'CONSENT_BASED' | 'REGULATORY';
  
  // Actions
  actionAfterRetention: 'DELETE' | 'ANONYMIZE' | 'ARCHIVE' | 'REVIEW';
  automaticExecution: boolean;
  
  // Compliance
  complianceFrameworks: ComplianceFramework[];
  legalBasis: string;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditConfiguration {
  tenantId?: string; // null for system-wide configuration
  
  // Logging Configuration
  enabledEventTypes: AuditEventType[];
  logLevel: 'MINIMAL' | 'STANDARD' | 'DETAILED' | 'COMPREHENSIVE';
  
  // Retention Configuration
  defaultRetentionPeriod: number; // in days
  encryptionEnabled: boolean;
  
  // Compliance Configuration
  enabledFrameworks: ComplianceFramework[];
  automaticReporting: boolean;
  reportingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  
  // Notification Configuration
  alertOnViolations: boolean;
  alertRecipients: string[];
  
  // Performance Configuration
  batchSize: number;
  asyncProcessing: boolean;
  
  // Metadata
  updatedBy: string;
  updatedAt: Date;
}

// Request/Response Types for API
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