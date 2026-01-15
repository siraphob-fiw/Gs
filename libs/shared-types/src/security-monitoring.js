"use strict";
/**
 * Security Monitoring and Incident Response Types
 *
 * This module defines types for security event monitoring, intrusion detection,
 * incident response, and compliance monitoring systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseAction = exports.IncidentStatus = exports.ThreatLevel = exports.SecurityEventStatus = exports.SecurityEventSeverity = exports.SecurityEventType = void 0;
// Security Event Types
var SecurityEventType;
(function (SecurityEventType) {
    // Authentication Events
    SecurityEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    SecurityEventType["LOGIN_FAILURE"] = "LOGIN_FAILURE";
    SecurityEventType["LOGOUT"] = "LOGOUT";
    SecurityEventType["LOGOUT_ALL"] = "LOGOUT_ALL";
    SecurityEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    SecurityEventType["PASSWORD_RESET_REQUEST"] = "PASSWORD_RESET_REQUEST";
    SecurityEventType["PASSWORD_RESET"] = "PASSWORD_RESET";
    SecurityEventType["PASSWORD_RESET_SUCCESS"] = "PASSWORD_RESET_SUCCESS";
    SecurityEventType["ACCOUNT_LOCKOUT"] = "ACCOUNT_LOCKOUT";
    SecurityEventType["ACCOUNT_UNLOCK"] = "ACCOUNT_UNLOCK";
    SecurityEventType["SESSION_REVOKED"] = "SESSION_REVOKED";
    SecurityEventType["EMAIL_VERIFICATION_SENT"] = "EMAIL_VERIFICATION_SENT";
    SecurityEventType["EMAIL_VERIFIED"] = "EMAIL_VERIFIED";
    // Authorization Events
    SecurityEventType["ACCESS_GRANTED"] = "ACCESS_GRANTED";
    SecurityEventType["ACCESS_DENIED"] = "ACCESS_DENIED";
    SecurityEventType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    SecurityEventType["PERMISSION_ESCALATION"] = "PERMISSION_ESCALATION";
    SecurityEventType["ROLE_ASSIGNMENT"] = "ROLE_ASSIGNMENT";
    SecurityEventType["ROLE_REVOCATION"] = "ROLE_REVOCATION";
    SecurityEventType["USER_ROLE_CHANGED"] = "USER_ROLE_CHANGED";
    // Tenant Isolation Events
    SecurityEventType["CROSS_TENANT_ACCESS_ATTEMPT"] = "CROSS_TENANT_ACCESS_ATTEMPT";
    SecurityEventType["TENANT_ISOLATION_BREACH"] = "TENANT_ISOLATION_BREACH";
    SecurityEventType["TENANT_DATA_ACCESS"] = "TENANT_DATA_ACCESS";
    // Data Events
    SecurityEventType["SENSITIVE_DATA_ACCESS"] = "SENSITIVE_DATA_ACCESS";
    SecurityEventType["DATA_EXPORT"] = "DATA_EXPORT";
    SecurityEventType["DATA_DELETION"] = "DATA_DELETION";
    SecurityEventType["DATA_MODIFICATION"] = "DATA_MODIFICATION";
    SecurityEventType["BULK_DATA_OPERATION"] = "BULK_DATA_OPERATION";
    // System Events
    SecurityEventType["ADMIN_ACTION"] = "ADMIN_ACTION";
    SecurityEventType["CONFIGURATION_CHANGE"] = "CONFIGURATION_CHANGE";
    SecurityEventType["SERVICE_START"] = "SERVICE_START";
    SecurityEventType["SERVICE_STOP"] = "SERVICE_STOP";
    // Suspicious Activity
    SecurityEventType["MULTIPLE_FAILED_LOGINS"] = "MULTIPLE_FAILED_LOGINS";
    SecurityEventType["UNUSUAL_ACCESS_PATTERN"] = "UNUSUAL_ACCESS_PATTERN";
    SecurityEventType["SUSPICIOUS_IP_ACCESS"] = "SUSPICIOUS_IP_ACCESS";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    SecurityEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    SecurityEventType["MALICIOUS_REQUEST"] = "MALICIOUS_REQUEST";
    SecurityEventType["BLOCKED_IP"] = "BLOCKED_IP";
    SecurityEventType["BLOCKED_USER_AGENT"] = "BLOCKED_USER_AGENT";
    // Compliance Events
    SecurityEventType["GDPR_REQUEST"] = "GDPR_REQUEST";
    SecurityEventType["HIPAA_ACCESS"] = "HIPAA_ACCESS";
    SecurityEventType["AUDIT_LOG_ACCESS"] = "AUDIT_LOG_ACCESS";
    SecurityEventType["COMPLIANCE_VIOLATION"] = "COMPLIANCE_VIOLATION";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
var SecurityEventSeverity;
(function (SecurityEventSeverity) {
    SecurityEventSeverity["LOW"] = "LOW";
    SecurityEventSeverity["MEDIUM"] = "MEDIUM";
    SecurityEventSeverity["HIGH"] = "HIGH";
    SecurityEventSeverity["CRITICAL"] = "CRITICAL";
})(SecurityEventSeverity || (exports.SecurityEventSeverity = SecurityEventSeverity = {}));
var SecurityEventStatus;
(function (SecurityEventStatus) {
    SecurityEventStatus["DETECTED"] = "DETECTED";
    SecurityEventStatus["INVESTIGATING"] = "INVESTIGATING";
    SecurityEventStatus["CONFIRMED"] = "CONFIRMED";
    SecurityEventStatus["FALSE_POSITIVE"] = "FALSE_POSITIVE";
    SecurityEventStatus["RESOLVED"] = "RESOLVED";
    SecurityEventStatus["ESCALATED"] = "ESCALATED";
})(SecurityEventStatus || (exports.SecurityEventStatus = SecurityEventStatus = {}));
var ThreatLevel;
(function (ThreatLevel) {
    ThreatLevel["NONE"] = "NONE";
    ThreatLevel["LOW"] = "LOW";
    ThreatLevel["MEDIUM"] = "MEDIUM";
    ThreatLevel["HIGH"] = "HIGH";
    ThreatLevel["CRITICAL"] = "CRITICAL";
})(ThreatLevel || (exports.ThreatLevel = ThreatLevel = {}));
var IncidentStatus;
(function (IncidentStatus) {
    IncidentStatus["OPEN"] = "OPEN";
    IncidentStatus["INVESTIGATING"] = "INVESTIGATING";
    IncidentStatus["CONTAINED"] = "CONTAINED";
    IncidentStatus["RESOLVED"] = "RESOLVED";
    IncidentStatus["CLOSED"] = "CLOSED";
})(IncidentStatus || (exports.IncidentStatus = IncidentStatus = {}));
var ResponseAction;
(function (ResponseAction) {
    ResponseAction["LOG_ONLY"] = "LOG_ONLY";
    ResponseAction["ALERT"] = "ALERT";
    ResponseAction["BLOCK_IP"] = "BLOCK_IP";
    ResponseAction["LOCK_ACCOUNT"] = "LOCK_ACCOUNT";
    ResponseAction["REVOKE_SESSION"] = "REVOKE_SESSION";
    ResponseAction["ESCALATE"] = "ESCALATE";
    ResponseAction["NOTIFY_ADMIN"] = "NOTIFY_ADMIN";
    ResponseAction["QUARANTINE"] = "QUARANTINE";
})(ResponseAction || (exports.ResponseAction = ResponseAction = {}));
//# sourceMappingURL=security-monitoring.js.map