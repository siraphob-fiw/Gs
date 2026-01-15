"use strict";
/**
 * Audit Logging and Compliance Types
 * Comprehensive types for audit logging, compliance tracking, and data protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentStatus = exports.IncidentSeverity = exports.DataRetentionStatus = exports.ConsentStatus = exports.ConsentType = exports.DataCategory = exports.ComplianceFramework = exports.AuditSeverity = exports.AuditEventType = void 0;
var AuditEventType;
(function (AuditEventType) {
    // Authentication Events
    AuditEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditEventType["LOGIN_FAILURE"] = "LOGIN_FAILURE";
    AuditEventType["LOGOUT"] = "LOGOUT";
    AuditEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuditEventType["PASSWORD_RESET"] = "PASSWORD_RESET";
    // User Management Events
    AuditEventType["USER_CREATED"] = "USER_CREATED";
    AuditEventType["USER_UPDATED"] = "USER_UPDATED";
    AuditEventType["USER_DELETED"] = "USER_DELETED";
    AuditEventType["USER_SUSPENDED"] = "USER_SUSPENDED";
    AuditEventType["USER_REACTIVATED"] = "USER_REACTIVATED";
    // Data Access Events
    AuditEventType["DATA_ACCESSED"] = "DATA_ACCESSED";
    AuditEventType["DATA_EXPORTED"] = "DATA_EXPORTED";
    AuditEventType["DATA_IMPORTED"] = "DATA_IMPORTED";
    AuditEventType["DATA_DELETED"] = "DATA_DELETED";
    AuditEventType["DATA_MODIFIED"] = "DATA_MODIFIED";
    // Privacy and Consent Events
    AuditEventType["CONSENT_GRANTED"] = "CONSENT_GRANTED";
    AuditEventType["CONSENT_REVOKED"] = "CONSENT_REVOKED";
    AuditEventType["CONSENT_UPDATED"] = "CONSENT_UPDATED";
    AuditEventType["PRIVACY_SETTINGS_CHANGED"] = "PRIVACY_SETTINGS_CHANGED";
    // Health Data Events
    AuditEventType["HEALTH_DATA_ACCESSED"] = "HEALTH_DATA_ACCESSED";
    AuditEventType["HEALTH_DATA_MODIFIED"] = "HEALTH_DATA_MODIFIED";
    AuditEventType["HEALTH_DATA_SHARED"] = "HEALTH_DATA_SHARED";
    AuditEventType["HEALTH_DATA_DELETED"] = "HEALTH_DATA_DELETED";
    // Security Events
    AuditEventType["UNAUTHORIZED_ACCESS_ATTEMPT"] = "UNAUTHORIZED_ACCESS_ATTEMPT";
    AuditEventType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    AuditEventType["SECURITY_VIOLATION"] = "SECURITY_VIOLATION";
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    // Compliance Events
    AuditEventType["DATA_BREACH_DETECTED"] = "DATA_BREACH_DETECTED";
    AuditEventType["COMPLIANCE_VIOLATION"] = "COMPLIANCE_VIOLATION";
    AuditEventType["AUDIT_REPORT_GENERATED"] = "AUDIT_REPORT_GENERATED";
    AuditEventType["RETENTION_POLICY_APPLIED"] = "RETENTION_POLICY_APPLIED";
    // Coach-Athlete Relationship Events
    AuditEventType["COACH_ASSIGNED"] = "COACH_ASSIGNED";
    AuditEventType["COACH_REMOVED"] = "COACH_REMOVED";
    AuditEventType["ATHLETE_TRANSFERRED"] = "ATHLETE_TRANSFERRED";
    AuditEventType["RELATIONSHIP_STATUS_CHANGED"] = "RELATIONSHIP_STATUS_CHANGED";
    // Administrative Events
    AuditEventType["SYSTEM_CONFIGURATION_CHANGED"] = "SYSTEM_CONFIGURATION_CHANGED";
    AuditEventType["TENANT_CREATED"] = "TENANT_CREATED";
    AuditEventType["TENANT_SUSPENDED"] = "TENANT_SUSPENDED";
    AuditEventType["BACKUP_CREATED"] = "BACKUP_CREATED";
    AuditEventType["BACKUP_RESTORED"] = "BACKUP_RESTORED";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "LOW";
    AuditSeverity["MEDIUM"] = "MEDIUM";
    AuditSeverity["HIGH"] = "HIGH";
    AuditSeverity["CRITICAL"] = "CRITICAL";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
var ComplianceFramework;
(function (ComplianceFramework) {
    ComplianceFramework["GDPR"] = "GDPR";
    ComplianceFramework["PDPA"] = "PDPA";
    ComplianceFramework["HIPAA"] = "HIPAA";
    ComplianceFramework["CCPA"] = "CCPA";
    ComplianceFramework["SOX"] = "SOX";
    ComplianceFramework["ISO27001"] = "ISO27001";
})(ComplianceFramework || (exports.ComplianceFramework = ComplianceFramework = {}));
var DataCategory;
(function (DataCategory) {
    DataCategory["PERSONAL_DATA"] = "PERSONAL_DATA";
    DataCategory["SENSITIVE_PERSONAL_DATA"] = "SENSITIVE_PERSONAL_DATA";
    DataCategory["HEALTH_DATA"] = "HEALTH_DATA";
    DataCategory["BIOMETRIC_DATA"] = "BIOMETRIC_DATA";
    DataCategory["FINANCIAL_DATA"] = "FINANCIAL_DATA";
    DataCategory["TRAINING_DATA"] = "TRAINING_DATA";
    DataCategory["SYSTEM_DATA"] = "SYSTEM_DATA";
})(DataCategory || (exports.DataCategory = DataCategory = {}));
var ConsentType;
(function (ConsentType) {
    ConsentType["DATA_PROCESSING"] = "DATA_PROCESSING";
    ConsentType["MARKETING"] = "MARKETING";
    ConsentType["ANALYTICS"] = "ANALYTICS";
    ConsentType["HEALTH_DATA_COLLECTION"] = "HEALTH_DATA_COLLECTION";
    ConsentType["DATA_SHARING"] = "DATA_SHARING";
    ConsentType["COOKIES"] = "COOKIES";
    ConsentType["THIRD_PARTY_INTEGRATIONS"] = "THIRD_PARTY_INTEGRATIONS";
})(ConsentType || (exports.ConsentType = ConsentType = {}));
var ConsentStatus;
(function (ConsentStatus) {
    ConsentStatus["GRANTED"] = "GRANTED";
    ConsentStatus["REVOKED"] = "REVOKED";
    ConsentStatus["PENDING"] = "PENDING";
    ConsentStatus["EXPIRED"] = "EXPIRED";
})(ConsentStatus || (exports.ConsentStatus = ConsentStatus = {}));
var DataRetentionStatus;
(function (DataRetentionStatus) {
    DataRetentionStatus["ACTIVE"] = "ACTIVE";
    DataRetentionStatus["ARCHIVED"] = "ARCHIVED";
    DataRetentionStatus["SCHEDULED_FOR_DELETION"] = "SCHEDULED_FOR_DELETION";
    DataRetentionStatus["DELETED"] = "DELETED";
    DataRetentionStatus["ANONYMIZED"] = "ANONYMIZED";
})(DataRetentionStatus || (exports.DataRetentionStatus = DataRetentionStatus = {}));
var IncidentSeverity;
(function (IncidentSeverity) {
    IncidentSeverity["LOW"] = "LOW";
    IncidentSeverity["MEDIUM"] = "MEDIUM";
    IncidentSeverity["HIGH"] = "HIGH";
    IncidentSeverity["CRITICAL"] = "CRITICAL";
})(IncidentSeverity || (exports.IncidentSeverity = IncidentSeverity = {}));
var IncidentStatus;
(function (IncidentStatus) {
    IncidentStatus["DETECTED"] = "DETECTED";
    IncidentStatus["INVESTIGATING"] = "INVESTIGATING";
    IncidentStatus["CONTAINED"] = "CONTAINED";
    IncidentStatus["RESOLVED"] = "RESOLVED";
    IncidentStatus["CLOSED"] = "CLOSED";
})(IncidentStatus || (exports.IncidentStatus = IncidentStatus = {}));
//# sourceMappingURL=audit-logging.js.map