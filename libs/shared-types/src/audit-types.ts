// Audit and Compliance Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

// Audit Enums
export enum AuditEventType {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED'
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum DataCategory {
  PERSONAL = 'PERSONAL',
  SENSITIVE = 'SENSITIVE',
  FINANCIAL = 'FINANCIAL',
  HEALTH = 'HEALTH',
  SYSTEM = 'SYSTEM'
}

export enum ComplianceFramework {
  GDPR = 'GDPR',
  PDPA = 'PDPA',
  HIPAA = 'HIPAA',
  SOX = 'SOX',
  PCI_DSS = 'PCI_DSS'
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  UNDER_REVIEW = 'UNDER_REVIEW'
}

export enum FindingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ACCEPTED_RISK = 'ACCEPTED_RISK'
}

export enum DataRetentionPeriod {
  DAYS_30 = 'DAYS_30',
  DAYS_90 = 'DAYS_90',
  MONTHS_6 = 'MONTHS_6',
  YEAR_1 = 'YEAR_1',
  YEARS_7 = 'YEARS_7',
  INDEFINITE = 'INDEFINITE'
}

// Audit Interfaces
export interface CreateAuditLogRequest {
  eventType: AuditEventType;
  userId?: string;
  tenantId?: string;
  resourceId?: string;
  resourceType?: string;
  action: string;
  details?: Record<string, any>;
  severity?: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  tenantId?: string;
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ComplianceStatusData {
  framework: ComplianceFramework;
  status: ComplianceStatus;
  lastAuditDate: Date;
  nextAuditDate: Date;
  findings: ComplianceFinding[];
  score: number;
}

export interface ComplianceFinding {
  id: string;
  severity: AuditSeverity;
  description: string;
  recommendation: string;
  status: FindingStatus;
  dueDate?: Date;
}

export interface ConsentUpdateRequest {
  consentType: string;
  granted: boolean;
  version: string;
  metadata?: Record<string, any>;
}

export interface DataExportRequestInput {
  dataTypes: string[];
  format: string;
  includeMetadata: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface DataDeletionRequestInput {
  dataTypes: string[];
  reason: string;
  confirmationRequired: boolean;
  retentionOverride?: boolean;
}