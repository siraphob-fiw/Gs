"use strict";
// Security and Error Handling Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookErrorCode = exports.WebhookProvider = exports.OAuthErrorCode = exports.OAuthProvider = exports.RecoveryAction = exports.RollbackType = exports.BackoffStrategy = exports.RecoveryStrategy = exports.ErrorSeverity = exports.ErrorCategory = exports.ResponseAction = exports.DetectionThreshold = exports.IncidentResponseAction = exports.IncidentCategory = exports.IncidentStatus = exports.SecurityEventSeverity = void 0;
// Security Enums
var SecurityEventSeverity;
(function (SecurityEventSeverity) {
    SecurityEventSeverity["INFO"] = "INFO";
    SecurityEventSeverity["LOW"] = "LOW";
    SecurityEventSeverity["MEDIUM"] = "MEDIUM";
    SecurityEventSeverity["HIGH"] = "HIGH";
    SecurityEventSeverity["CRITICAL"] = "CRITICAL";
})(SecurityEventSeverity || (exports.SecurityEventSeverity = SecurityEventSeverity = {}));
var IncidentStatus;
(function (IncidentStatus) {
    IncidentStatus["OPEN"] = "OPEN";
    IncidentStatus["INVESTIGATING"] = "INVESTIGATING";
    IncidentStatus["CONTAINED"] = "CONTAINED";
    IncidentStatus["RESOLVED"] = "RESOLVED";
    IncidentStatus["CLOSED"] = "CLOSED";
})(IncidentStatus || (exports.IncidentStatus = IncidentStatus = {}));
var IncidentCategory;
(function (IncidentCategory) {
    IncidentCategory["DATA_BREACH"] = "DATA_BREACH";
    IncidentCategory["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    IncidentCategory["MALWARE"] = "MALWARE";
    IncidentCategory["PHISHING"] = "PHISHING";
    IncidentCategory["DENIAL_OF_SERVICE"] = "DENIAL_OF_SERVICE";
    IncidentCategory["INSIDER_THREAT"] = "INSIDER_THREAT";
    IncidentCategory["OTHER"] = "OTHER";
})(IncidentCategory || (exports.IncidentCategory = IncidentCategory = {}));
var IncidentResponseAction;
(function (IncidentResponseAction) {
    IncidentResponseAction["ISOLATE_SYSTEM"] = "ISOLATE_SYSTEM";
    IncidentResponseAction["RESET_PASSWORDS"] = "RESET_PASSWORDS";
    IncidentResponseAction["NOTIFY_USERS"] = "NOTIFY_USERS";
    IncidentResponseAction["CONTACT_AUTHORITIES"] = "CONTACT_AUTHORITIES";
    IncidentResponseAction["BACKUP_DATA"] = "BACKUP_DATA";
    IncidentResponseAction["RESTORE_FROM_BACKUP"] = "RESTORE_FROM_BACKUP";
})(IncidentResponseAction || (exports.IncidentResponseAction = IncidentResponseAction = {}));
var DetectionThreshold;
(function (DetectionThreshold) {
    DetectionThreshold["LOW"] = "LOW";
    DetectionThreshold["MEDIUM"] = "MEDIUM";
    DetectionThreshold["HIGH"] = "HIGH";
    DetectionThreshold["CRITICAL"] = "CRITICAL";
})(DetectionThreshold || (exports.DetectionThreshold = DetectionThreshold = {}));
var ResponseAction;
(function (ResponseAction) {
    ResponseAction["LOG_ONLY"] = "LOG_ONLY";
    ResponseAction["ALERT"] = "ALERT";
    ResponseAction["BLOCK"] = "BLOCK";
    ResponseAction["QUARANTINE"] = "QUARANTINE";
    ResponseAction["ESCALATE"] = "ESCALATE";
})(ResponseAction || (exports.ResponseAction = ResponseAction = {}));
// Error Handling Enums
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorCategory["AUTHORIZATION"] = "AUTHORIZATION";
    ErrorCategory["NOT_FOUND"] = "NOT_FOUND";
    ErrorCategory["CONFLICT"] = "CONFLICT";
    ErrorCategory["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorCategory["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
    ErrorCategory["DATABASE"] = "DATABASE";
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["SYSTEM"] = "SYSTEM";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var RecoveryStrategy;
(function (RecoveryStrategy) {
    RecoveryStrategy["RETRY"] = "RETRY";
    RecoveryStrategy["FALLBACK"] = "FALLBACK";
    RecoveryStrategy["CIRCUIT_BREAKER"] = "CIRCUIT_BREAKER";
    RecoveryStrategy["MANUAL_INTERVENTION"] = "MANUAL_INTERVENTION";
    RecoveryStrategy["IGNORE"] = "IGNORE";
})(RecoveryStrategy || (exports.RecoveryStrategy = RecoveryStrategy = {}));
var BackoffStrategy;
(function (BackoffStrategy) {
    BackoffStrategy["LINEAR"] = "LINEAR";
    BackoffStrategy["EXPONENTIAL"] = "EXPONENTIAL";
    BackoffStrategy["FIXED"] = "FIXED";
})(BackoffStrategy || (exports.BackoffStrategy = BackoffStrategy = {}));
var RollbackType;
(function (RollbackType) {
    RollbackType["AUTOMATIC"] = "AUTOMATIC";
    RollbackType["MANUAL"] = "MANUAL";
    RollbackType["CONDITIONAL"] = "CONDITIONAL";
})(RollbackType || (exports.RollbackType = RollbackType = {}));
var RecoveryAction;
(function (RecoveryAction) {
    RecoveryAction["RETRY"] = "RETRY";
    RecoveryAction["FALLBACK"] = "FALLBACK";
    RecoveryAction["CIRCUIT_BREAK"] = "CIRCUIT_BREAK";
    RecoveryAction["ESCALATE"] = "ESCALATE";
    RecoveryAction["IGNORE"] = "IGNORE";
})(RecoveryAction || (exports.RecoveryAction = RecoveryAction = {}));
// OAuth and External Service Enums
var OAuthProvider;
(function (OAuthProvider) {
    OAuthProvider["GOOGLE"] = "GOOGLE";
    OAuthProvider["FACEBOOK"] = "FACEBOOK";
    OAuthProvider["APPLE"] = "APPLE";
    OAuthProvider["GITHUB"] = "GITHUB";
})(OAuthProvider || (exports.OAuthProvider = OAuthProvider = {}));
var OAuthErrorCode;
(function (OAuthErrorCode) {
    OAuthErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    OAuthErrorCode["UNAUTHORIZED_CLIENT"] = "UNAUTHORIZED_CLIENT";
    OAuthErrorCode["ACCESS_DENIED"] = "ACCESS_DENIED";
    OAuthErrorCode["UNSUPPORTED_RESPONSE_TYPE"] = "UNSUPPORTED_RESPONSE_TYPE";
    OAuthErrorCode["INVALID_SCOPE"] = "INVALID_SCOPE";
    OAuthErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
})(OAuthErrorCode || (exports.OAuthErrorCode = OAuthErrorCode = {}));
var WebhookProvider;
(function (WebhookProvider) {
    WebhookProvider["STRIPE"] = "STRIPE";
    WebhookProvider["PAYPAL"] = "PAYPAL";
    WebhookProvider["PROMPTPAY"] = "PROMPTPAY";
    WebhookProvider["CUSTOM"] = "CUSTOM";
})(WebhookProvider || (exports.WebhookProvider = WebhookProvider = {}));
var WebhookErrorCode;
(function (WebhookErrorCode) {
    WebhookErrorCode["INVALID_SIGNATURE"] = "INVALID_SIGNATURE";
    WebhookErrorCode["INVALID_PAYLOAD"] = "INVALID_PAYLOAD";
    WebhookErrorCode["PROCESSING_ERROR"] = "PROCESSING_ERROR";
    WebhookErrorCode["TIMEOUT"] = "TIMEOUT";
})(WebhookErrorCode || (exports.WebhookErrorCode = WebhookErrorCode = {}));
//# sourceMappingURL=security-types.js.map