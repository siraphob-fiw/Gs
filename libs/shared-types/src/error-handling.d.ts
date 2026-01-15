/**
 * Error Handling Types for User Management & Multi-Tenancy System
 * Comprehensive error classification, handling, and recovery types
 */
export declare enum ErrorType {
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    SESSION_ERROR = "SESSION_ERROR",
    TOKEN_ERROR = "TOKEN_ERROR",
    TENANT_ISOLATION_ERROR = "TENANT_ISOLATION_ERROR",
    TENANT_NOT_FOUND_ERROR = "TENANT_NOT_FOUND_ERROR",
    CROSS_TENANT_ACCESS_ERROR = "CROSS_TENANT_ACCESS_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    SCHEMA_VALIDATION_ERROR = "SCHEMA_VALIDATION_ERROR",
    BUSINESS_RULE_ERROR = "BUSINESS_RULE_ERROR",
    TRANSITION_ERROR = "TRANSITION_ERROR",
    TRANSITION_CONFLICT_ERROR = "TRANSITION_CONFLICT_ERROR",
    TRANSITION_ROLLBACK_ERROR = "TRANSITION_ROLLBACK_ERROR",
    BILLING_ERROR = "BILLING_ERROR",
    PAYMENT_PROCESSING_ERROR = "PAYMENT_PROCESSING_ERROR",
    SUBSCRIPTION_ERROR = "SUBSCRIPTION_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
    WEBHOOK_ERROR = "WEBHOOK_ERROR",
    DATA_INTEGRITY_ERROR = "DATA_INTEGRITY_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    CACHE_ERROR = "CACHE_ERROR",
    SYSTEM_ERROR = "SYSTEM_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    SECURITY_ERROR = "SECURITY_ERROR",
    INTRUSION_DETECTION_ERROR = "INTRUSION_DETECTION_ERROR",
    COMPLIANCE_ERROR = "COMPLIANCE_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ErrorCategory {
    RECOVERABLE = "RECOVERABLE",
    NON_RECOVERABLE = "NON_RECOVERABLE",
    RETRY_REQUIRED = "RETRY_REQUIRED",
    MANUAL_INTERVENTION = "MANUAL_INTERVENTION"
}
export declare enum RecoveryStrategy {
    RETRY = "RETRY",
    FALLBACK = "FALLBACK",
    CIRCUIT_BREAKER = "CIRCUIT_BREAKER",
    GRACEFUL_DEGRADATION = "GRACEFUL_DEGRADATION",
    ROLLBACK = "ROLLBACK",
    MANUAL_RECOVERY = "MANUAL_RECOVERY",
    NO_RECOVERY = "NO_RECOVERY"
}
export interface BaseError {
    id: string;
    type: ErrorType;
    code: string;
    message: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    timestamp: Date;
    requestId?: string;
    userId?: string;
    tenantId?: string;
    correlationId?: string;
    source: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
}
export interface ErrorContext {
    userId?: string;
    tenantId?: string;
    requestId?: string;
    correlationId?: string;
    userAgent?: string;
    ipAddress?: string;
    endpoint?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    query?: Record<string, any>;
    params?: Record<string, any>;
}
export interface ErrorResponse {
    error: {
        id: string;
        type: ErrorType;
        code: string;
        message: string;
        details?: Record<string, any>;
        timestamp: Date;
        requestId?: string;
        correlationId?: string;
        retryable?: boolean;
        retryAfter?: number;
    };
}
export interface RecoveryAction {
    strategy: RecoveryStrategy;
    description: string;
    automated: boolean;
    maxAttempts?: number;
    backoffStrategy?: BackoffStrategy;
    fallbackAction?: RecoveryAction;
    conditions?: RecoveryCondition[];
}
export interface RecoveryCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
}
export interface BackoffStrategy {
    type: 'fixed' | 'linear' | 'exponential';
    baseDelay: number;
    maxDelay: number;
    multiplier?: number;
    jitter?: boolean;
}
export interface RecoveryResult {
    success: boolean;
    strategy: RecoveryStrategy;
    attempts: number;
    duration: number;
    error?: BaseError;
    fallbackUsed?: boolean;
    metadata?: Record<string, any>;
}
export interface ErrorMetrics {
    errorId: string;
    type: ErrorType;
    count: number;
    firstOccurrence: Date;
    lastOccurrence: Date;
    affectedUsers: number;
    affectedTenants: number;
    averageResolutionTime?: number;
    recoverySuccessRate?: number;
}
export interface ErrorAlert {
    id: string;
    errorType: ErrorType;
    severity: ErrorSeverity;
    threshold: AlertThreshold;
    triggered: boolean;
    triggeredAt?: Date;
    resolvedAt?: Date;
    notificationsSent: number;
    escalationLevel: number;
}
export interface AlertThreshold {
    type: 'count' | 'rate' | 'percentage';
    value: number;
    timeWindow: number;
    conditions?: AlertCondition[];
}
export interface AlertCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
}
export interface DegradationLevel {
    level: number;
    name: string;
    description: string;
    disabledFeatures: string[];
    fallbackBehaviors: FallbackBehavior[];
    userMessage?: string;
}
export interface FallbackBehavior {
    feature: string;
    fallbackType: 'cache' | 'default_value' | 'simplified_logic' | 'disabled';
    fallbackValue?: any;
    cacheKey?: string;
    cacheTtl?: number;
}
export interface SystemHealth {
    overall: HealthStatus;
    services: ServiceHealth[];
    degradationLevel: number;
    activeIncidents: number;
    lastUpdated: Date;
}
export interface ServiceHealth {
    name: string;
    status: HealthStatus;
    responseTime: number;
    errorRate: number;
    availability: number;
    lastCheck: Date;
    dependencies: ServiceDependency[];
}
export interface ServiceDependency {
    name: string;
    status: HealthStatus;
    critical: boolean;
    lastCheck: Date;
}
export declare enum HealthStatus {
    HEALTHY = "HEALTHY",
    DEGRADED = "DEGRADED",
    UNHEALTHY = "UNHEALTHY",
    UNKNOWN = "UNKNOWN"
}
export interface ErrorHandlingConfig {
    enableRetry: boolean;
    enableCircuitBreaker: boolean;
    enableGracefulDegradation: boolean;
    enableErrorMonitoring: boolean;
    enableAlerts: boolean;
    retryConfig: RetryConfig;
    circuitBreakerConfig: CircuitBreakerConfig;
    degradationConfig: DegradationConfig;
    alertConfig: AlertConfig;
}
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
    jitter: boolean;
    retryableErrors: ErrorType[];
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    halfOpenMaxCalls: number;
    minimumThroughput: number;
}
export interface DegradationConfig {
    enabled: boolean;
    levels: DegradationLevel[];
    autoRecovery: boolean;
    recoveryThreshold: number;
}
export interface AlertConfig {
    enabled: boolean;
    thresholds: Record<ErrorType, AlertThreshold>;
    notificationChannels: NotificationChannel[];
    escalationRules: EscalationRule[];
}
export interface NotificationChannel {
    type: 'email' | 'sms' | 'slack' | 'webhook';
    config: Record<string, any>;
    enabled: boolean;
}
export interface EscalationRule {
    level: number;
    timeThreshold: number;
    channels: string[];
    recipients: string[];
}
export interface RollbackOperation {
    id: string;
    type: RollbackType;
    description: string;
    targetState: any;
    rollbackData: any;
    automated: boolean;
    dependencies: string[];
    validationRules: ValidationRule[];
}
export interface ValidationRule {
    field: string;
    rule: string;
    message: string;
}
export declare enum RollbackType {
    DATA_ROLLBACK = "DATA_ROLLBACK",
    STATE_ROLLBACK = "STATE_ROLLBACK",
    CONFIGURATION_ROLLBACK = "CONFIGURATION_ROLLBACK",
    PERMISSION_ROLLBACK = "PERMISSION_ROLLBACK",
    RELATIONSHIP_ROLLBACK = "RELATIONSHIP_ROLLBACK"
}
export interface RollbackResult {
    success: boolean;
    rollbackId: string;
    type: RollbackType;
    duration: number;
    itemsRolledBack: number;
    errors: BaseError[];
    validationResults: ValidationResult[];
}
export interface ValidationResult {
    rule: string;
    passed: boolean;
    message?: string;
    details?: any;
}
export interface ErrorReport {
    id: string;
    period: ReportPeriod;
    generatedAt: Date;
    summary: ErrorSummary;
    topErrors: ErrorMetrics[];
    trends: ErrorTrend[];
    recommendations: ErrorRecommendation[];
}
export interface ReportPeriod {
    start: Date;
    end: Date;
    type: 'hourly' | 'daily' | 'weekly' | 'monthly';
}
export interface ErrorSummary {
    totalErrors: number;
    uniqueErrors: number;
    criticalErrors: number;
    recoveredErrors: number;
    affectedUsers: number;
    affectedTenants: number;
    averageResolutionTime: number;
    systemAvailability: number;
}
export interface ErrorTrend {
    errorType: ErrorType;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
    dataPoints: TrendDataPoint[];
}
export interface TrendDataPoint {
    timestamp: Date;
    count: number;
    rate: number;
}
export interface ErrorRecommendation {
    type: 'immediate' | 'short_term' | 'long_term';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    actions: string[];
    estimatedImpact: string;
}
export interface ErrorEvent {
    id: string;
    type: ErrorEventType;
    errorId: string;
    timestamp: Date;
    context: ErrorContext;
    metadata?: Record<string, any>;
}
export declare enum ErrorEventType {
    ERROR_OCCURRED = "ERROR_OCCURRED",
    ERROR_RECOVERED = "ERROR_RECOVERED",
    RECOVERY_FAILED = "RECOVERY_FAILED",
    CIRCUIT_OPENED = "CIRCUIT_OPENED",
    CIRCUIT_CLOSED = "CIRCUIT_CLOSED",
    DEGRADATION_ACTIVATED = "DEGRADATION_ACTIVATED",
    DEGRADATION_DEACTIVATED = "DEGRADATION_DEACTIVATED",
    ALERT_TRIGGERED = "ALERT_TRIGGERED",
    ALERT_RESOLVED = "ALERT_RESOLVED",
    ROLLBACK_INITIATED = "ROLLBACK_INITIATED",
    ROLLBACK_COMPLETED = "ROLLBACK_COMPLETED"
}
//# sourceMappingURL=error-handling.d.ts.map