export declare enum SecurityEventSeverity {
    INFO = "INFO",
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
export declare enum IncidentCategory {
    DATA_BREACH = "DATA_BREACH",
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
    MALWARE = "MALWARE",
    PHISHING = "PHISHING",
    DENIAL_OF_SERVICE = "DENIAL_OF_SERVICE",
    INSIDER_THREAT = "INSIDER_THREAT",
    OTHER = "OTHER"
}
export declare enum IncidentResponseAction {
    ISOLATE_SYSTEM = "ISOLATE_SYSTEM",
    RESET_PASSWORDS = "RESET_PASSWORDS",
    NOTIFY_USERS = "NOTIFY_USERS",
    CONTACT_AUTHORITIES = "CONTACT_AUTHORITIES",
    BACKUP_DATA = "BACKUP_DATA",
    RESTORE_FROM_BACKUP = "RESTORE_FROM_BACKUP"
}
export declare enum DetectionThreshold {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ResponseAction {
    LOG_ONLY = "LOG_ONLY",
    ALERT = "ALERT",
    BLOCK = "BLOCK",
    QUARANTINE = "QUARANTINE",
    ESCALATE = "ESCALATE"
}
export declare enum ErrorCategory {
    VALIDATION = "VALIDATION",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    RATE_LIMIT = "RATE_LIMIT",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    DATABASE = "DATABASE",
    NETWORK = "NETWORK",
    SYSTEM = "SYSTEM"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RecoveryStrategy {
    RETRY = "RETRY",
    FALLBACK = "FALLBACK",
    CIRCUIT_BREAKER = "CIRCUIT_BREAKER",
    MANUAL_INTERVENTION = "MANUAL_INTERVENTION",
    IGNORE = "IGNORE"
}
export declare enum BackoffStrategy {
    LINEAR = "LINEAR",
    EXPONENTIAL = "EXPONENTIAL",
    FIXED = "FIXED"
}
export declare enum RollbackType {
    AUTOMATIC = "AUTOMATIC",
    MANUAL = "MANUAL",
    CONDITIONAL = "CONDITIONAL"
}
export declare enum RecoveryAction {
    RETRY = "RETRY",
    FALLBACK = "FALLBACK",
    CIRCUIT_BREAK = "CIRCUIT_BREAK",
    ESCALATE = "ESCALATE",
    IGNORE = "IGNORE"
}
export declare enum OAuthProvider {
    GOOGLE = "GOOGLE",
    FACEBOOK = "FACEBOOK",
    APPLE = "APPLE",
    GITHUB = "GITHUB"
}
export declare enum OAuthErrorCode {
    INVALID_REQUEST = "INVALID_REQUEST",
    UNAUTHORIZED_CLIENT = "UNAUTHORIZED_CLIENT",
    ACCESS_DENIED = "ACCESS_DENIED",
    UNSUPPORTED_RESPONSE_TYPE = "UNSUPPORTED_RESPONSE_TYPE",
    INVALID_SCOPE = "INVALID_SCOPE",
    SERVER_ERROR = "SERVER_ERROR"
}
export declare enum WebhookProvider {
    STRIPE = "STRIPE",
    PAYPAL = "PAYPAL",
    PROMPTPAY = "PROMPTPAY",
    CUSTOM = "CUSTOM"
}
export declare enum WebhookErrorCode {
    INVALID_SIGNATURE = "INVALID_SIGNATURE",
    INVALID_PAYLOAD = "INVALID_PAYLOAD",
    PROCESSING_ERROR = "PROCESSING_ERROR",
    TIMEOUT = "TIMEOUT"
}
export interface SecurityIncident {
    id: string;
    title: string;
    description: string;
    severity: SecurityEventSeverity;
    status: IncidentStatus;
    category: IncidentCategory;
    affectedSystems: string[];
    reportedBy: string;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}
export interface UpdateIncidentRequest {
    status?: IncidentStatus;
    assignedTo?: string;
    notes?: string;
    resolution?: string;
}
export interface ErrorHandlingConfig {
    maxRetries: number;
    retryDelay: number;
    circuitBreakerThreshold: number;
    fallbackEnabled: boolean;
    notificationEnabled: boolean;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    statusCode: number;
}
export interface OAuthError {
    code: OAuthErrorCode;
    description: string;
    uri?: string;
}
export interface WebhookError {
    code: WebhookErrorCode;
    message: string;
    details?: Record<string, any>;
}
export interface UserSession {
    id: string;
    userId: string;
    tenantId: string;
    token: string;
    refreshToken?: string;
    expiresAt: Date;
    createdAt: Date;
    lastAccessedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
}
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    conditions?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=security-types.d.ts.map