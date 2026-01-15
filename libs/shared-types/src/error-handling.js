"use strict";
/**
 * Error Handling Types for User Management & Multi-Tenancy System
 * Comprehensive error classification, handling, and recovery types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorEventType = exports.RollbackType = exports.HealthStatus = exports.RecoveryStrategy = exports.ErrorCategory = exports.ErrorSeverity = exports.ErrorType = void 0;
// Error Classification
var ErrorType;
(function (ErrorType) {
    // Authentication & Authorization
    ErrorType["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorType["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorType["SESSION_ERROR"] = "SESSION_ERROR";
    ErrorType["TOKEN_ERROR"] = "TOKEN_ERROR";
    // Multi-Tenancy & Data Isolation
    ErrorType["TENANT_ISOLATION_ERROR"] = "TENANT_ISOLATION_ERROR";
    ErrorType["TENANT_NOT_FOUND_ERROR"] = "TENANT_NOT_FOUND_ERROR";
    ErrorType["CROSS_TENANT_ACCESS_ERROR"] = "CROSS_TENANT_ACCESS_ERROR";
    // Validation & Input
    ErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorType["SCHEMA_VALIDATION_ERROR"] = "SCHEMA_VALIDATION_ERROR";
    ErrorType["BUSINESS_RULE_ERROR"] = "BUSINESS_RULE_ERROR";
    // Coach Transitions
    ErrorType["TRANSITION_ERROR"] = "TRANSITION_ERROR";
    ErrorType["TRANSITION_CONFLICT_ERROR"] = "TRANSITION_CONFLICT_ERROR";
    ErrorType["TRANSITION_ROLLBACK_ERROR"] = "TRANSITION_ROLLBACK_ERROR";
    // Payment & Billing
    ErrorType["BILLING_ERROR"] = "BILLING_ERROR";
    ErrorType["PAYMENT_PROCESSING_ERROR"] = "PAYMENT_PROCESSING_ERROR";
    ErrorType["SUBSCRIPTION_ERROR"] = "SUBSCRIPTION_ERROR";
    // External Services
    ErrorType["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorType["EXTERNAL_API_ERROR"] = "EXTERNAL_API_ERROR";
    ErrorType["WEBHOOK_ERROR"] = "WEBHOOK_ERROR";
    // Data & Database
    ErrorType["DATA_INTEGRITY_ERROR"] = "DATA_INTEGRITY_ERROR";
    ErrorType["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorType["CACHE_ERROR"] = "CACHE_ERROR";
    // System & Infrastructure
    ErrorType["SYSTEM_ERROR"] = "SYSTEM_ERROR";
    ErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    // Security
    ErrorType["SECURITY_ERROR"] = "SECURITY_ERROR";
    ErrorType["INTRUSION_DETECTION_ERROR"] = "INTRUSION_DETECTION_ERROR";
    ErrorType["COMPLIANCE_ERROR"] = "COMPLIANCE_ERROR";
    // Unknown
    ErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["RECOVERABLE"] = "RECOVERABLE";
    ErrorCategory["NON_RECOVERABLE"] = "NON_RECOVERABLE";
    ErrorCategory["RETRY_REQUIRED"] = "RETRY_REQUIRED";
    ErrorCategory["MANUAL_INTERVENTION"] = "MANUAL_INTERVENTION";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var RecoveryStrategy;
(function (RecoveryStrategy) {
    RecoveryStrategy["RETRY"] = "RETRY";
    RecoveryStrategy["FALLBACK"] = "FALLBACK";
    RecoveryStrategy["CIRCUIT_BREAKER"] = "CIRCUIT_BREAKER";
    RecoveryStrategy["GRACEFUL_DEGRADATION"] = "GRACEFUL_DEGRADATION";
    RecoveryStrategy["ROLLBACK"] = "ROLLBACK";
    RecoveryStrategy["MANUAL_RECOVERY"] = "MANUAL_RECOVERY";
    RecoveryStrategy["NO_RECOVERY"] = "NO_RECOVERY";
})(RecoveryStrategy || (exports.RecoveryStrategy = RecoveryStrategy = {}));
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "HEALTHY";
    HealthStatus["DEGRADED"] = "DEGRADED";
    HealthStatus["UNHEALTHY"] = "UNHEALTHY";
    HealthStatus["UNKNOWN"] = "UNKNOWN";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
var RollbackType;
(function (RollbackType) {
    RollbackType["DATA_ROLLBACK"] = "DATA_ROLLBACK";
    RollbackType["STATE_ROLLBACK"] = "STATE_ROLLBACK";
    RollbackType["CONFIGURATION_ROLLBACK"] = "CONFIGURATION_ROLLBACK";
    RollbackType["PERMISSION_ROLLBACK"] = "PERMISSION_ROLLBACK";
    RollbackType["RELATIONSHIP_ROLLBACK"] = "RELATIONSHIP_ROLLBACK";
})(RollbackType || (exports.RollbackType = RollbackType = {}));
var ErrorEventType;
(function (ErrorEventType) {
    ErrorEventType["ERROR_OCCURRED"] = "ERROR_OCCURRED";
    ErrorEventType["ERROR_RECOVERED"] = "ERROR_RECOVERED";
    ErrorEventType["RECOVERY_FAILED"] = "RECOVERY_FAILED";
    ErrorEventType["CIRCUIT_OPENED"] = "CIRCUIT_OPENED";
    ErrorEventType["CIRCUIT_CLOSED"] = "CIRCUIT_CLOSED";
    ErrorEventType["DEGRADATION_ACTIVATED"] = "DEGRADATION_ACTIVATED";
    ErrorEventType["DEGRADATION_DEACTIVATED"] = "DEGRADATION_DEACTIVATED";
    ErrorEventType["ALERT_TRIGGERED"] = "ALERT_TRIGGERED";
    ErrorEventType["ALERT_RESOLVED"] = "ALERT_RESOLVED";
    ErrorEventType["ROLLBACK_INITIATED"] = "ROLLBACK_INITIATED";
    ErrorEventType["ROLLBACK_COMPLETED"] = "ROLLBACK_COMPLETED";
})(ErrorEventType || (exports.ErrorEventType = ErrorEventType = {}));
//# sourceMappingURL=error-handling.js.map