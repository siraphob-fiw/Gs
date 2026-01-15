import { UserRole, UserStatus, TenantStatus } from './shared-types';
import { SubscriptionStatus } from './payment-types';
export interface PlatformAnalytics {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalCoaches: number;
    totalAthletes: number;
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
    growthRate: number;
    storageUsed: number;
    apiCallsThisMonth: number;
    lastUpdated: Date;
}
export interface TenantAnalytics {
    tenantId: string;
    tenantName: string;
    status: TenantStatus;
    userCount: number;
    coachCount: number;
    athleteCount: number;
    subscriptionStatus: SubscriptionStatus;
    monthlyRevenue: number;
    storageUsed: number;
    lastActivity: Date;
    createdAt: Date;
    healthScore: number;
}
export interface UserAnalytics {
    userId: string;
    tenantId: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt?: Date;
    sessionCount: number;
    createdAt: Date;
    isActive: boolean;
}
export interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
    databaseHealth: DatabaseHealth;
    cacheHealth: CacheHealth;
    externalServicesHealth: ExternalServiceHealth[];
    lastChecked: Date;
}
export interface DatabaseHealth {
    status: 'healthy' | 'warning' | 'critical';
    connectionCount: number;
    queryPerformance: number;
    diskUsage: number;
    replicationLag?: number;
}
export interface CacheHealth {
    status: 'healthy' | 'warning' | 'critical';
    hitRate: number;
    memoryUsage: number;
    connectionCount: number;
}
export interface ExternalServiceHealth {
    serviceName: string;
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    lastChecked: Date;
    errorCount: number;
}
export interface CoachManagementRequest {
    coachId: string;
    action: CoachManagementAction;
    reason?: string;
    metadata?: Record<string, any>;
}
export declare enum CoachManagementAction {
    APPROVE = "APPROVE",
    SUSPEND = "SUSPEND",
    REACTIVATE = "REACTIVATE",
    DELETE = "DELETE",
    CHANGE_TENANT = "CHANGE_TENANT",
    UPDATE_LIMITS = "UPDATE_LIMITS"
}
export interface TenantManagementRequest {
    tenantId: string;
    action: TenantManagementAction;
    reason?: string;
    metadata?: Record<string, any>;
}
export declare enum TenantManagementAction {
    SUSPEND = "SUSPEND",
    REACTIVATE = "REACTIVATE",
    DELETE = "DELETE",
    UPGRADE_PLAN = "UPGRADE_PLAN",
    DOWNGRADE_PLAN = "DOWNGRADE_PLAN",
    EXTEND_TRIAL = "EXTEND_TRIAL",
    FORCE_BILLING = "FORCE_BILLING"
}
export interface CoachApprovalRequest {
    id: string;
    coachId: string;
    tenantId: string;
    requestType: CoachApprovalType;
    status: ApprovalStatus;
    requestedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    reason?: string;
    metadata?: Record<string, any>;
}
export declare enum CoachApprovalType {
    NEW_COACH_REGISTRATION = "NEW_COACH_REGISTRATION",
    PLAN_UPGRADE = "PLAN_UPGRADE",
    FEATURE_ACCESS = "FEATURE_ACCESS",
    TENANT_TRANSFER = "TENANT_TRANSFER"
}
export declare enum ApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export interface SystemConfiguration {
    id: string;
    category: ConfigurationCategory;
    key: string;
    value: any;
    dataType: ConfigurationDataType;
    description: string;
    isEditable: boolean;
    requiresRestart: boolean;
    validationRules?: ValidationRule[];
    updatedBy?: string;
    updatedAt: Date;
}
export declare enum ConfigurationCategory {
    AUTHENTICATION = "AUTHENTICATION",
    BILLING = "BILLING",
    FEATURES = "FEATURES",
    LIMITS = "LIMITS",
    NOTIFICATIONS = "NOTIFICATIONS",
    SECURITY = "SECURITY",
    INTEGRATIONS = "INTEGRATIONS",
    PERFORMANCE = "PERFORMANCE"
}
export declare enum ConfigurationDataType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    BOOLEAN = "BOOLEAN",
    JSON = "JSON",
    ARRAY = "ARRAY"
}
export interface ValidationRule {
    type: ValidationType;
    value: any;
    message: string;
}
export declare enum ValidationType {
    REQUIRED = "REQUIRED",
    MIN_LENGTH = "MIN_LENGTH",
    MAX_LENGTH = "MAX_LENGTH",
    MIN_VALUE = "MIN_VALUE",
    MAX_VALUE = "MAX_VALUE",
    PATTERN = "PATTERN",
    ENUM = "ENUM"
}
export interface TemplateApprovalRequest {
    id: string;
    templateId: string;
    templateName: string;
    createdBy: string;
    tenantId: string;
    category: TemplateCategory;
    status: ApprovalStatus;
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    reviewNotes?: string;
    rejectionReason?: string;
    metadata?: TemplateMetadata;
}
export declare enum TemplateCategory {
    POWERLIFTING = "POWERLIFTING",
    WEIGHTLIFTING = "WEIGHTLIFTING",
    BODYBUILDING = "BODYBUILDING",
    STRONGMAN = "STRONGMAN",
    GENERAL_FITNESS = "GENERAL_FITNESS",
    REHABILITATION = "REHABILITATION",
    SPORT_SPECIFIC = "SPORT_SPECIFIC"
}
export interface TemplateMetadata {
    difficulty: TemplateDifficulty;
    duration: number;
    sessionsPerWeek: number;
    targetAudience: string[];
    equipment: string[];
    tags: string[];
}
export declare enum TemplateDifficulty {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED",
    EXPERT = "EXPERT"
}
export interface ExerciseApprovalRequest {
    id: string;
    exerciseId: string;
    exerciseName: string;
    createdBy: string;
    tenantId: string;
    category: ExerciseCategory;
    status: ApprovalStatus;
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    reviewNotes?: string;
    rejectionReason?: string;
    metadata?: ExerciseMetadata;
}
export declare enum ExerciseCategory {
    COMPOUND = "COMPOUND",
    ISOLATION = "ISOLATION",
    CARDIO = "CARDIO",
    MOBILITY = "MOBILITY",
    PLYOMETRIC = "PLYOMETRIC",
    ISOMETRIC = "ISOMETRIC"
}
export interface ExerciseMetadata {
    muscleGroups: string[];
    equipment: string[];
    difficulty: ExerciseDifficulty;
    safetyRating: SafetyRating;
    instructions: string;
    videoUrl?: string;
    tags: string[];
}
export declare enum ExerciseDifficulty {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED"
}
export declare enum SafetyRating {
    LOW_RISK = "LOW_RISK",
    MODERATE_RISK = "MODERATE_RISK",
    HIGH_RISK = "HIGH_RISK",
    REQUIRES_SUPERVISION = "REQUIRES_SUPERVISION"
}
export interface SystemAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    source: AlertSource;
    status: AlertStatus;
    triggeredAt: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    metadata?: Record<string, any>;
}
export declare enum AlertType {
    SYSTEM_ERROR = "SYSTEM_ERROR",
    PERFORMANCE_DEGRADATION = "PERFORMANCE_DEGRADATION",
    SECURITY_INCIDENT = "SECURITY_INCIDENT",
    BILLING_ISSUE = "BILLING_ISSUE",
    USER_ACTIVITY = "USER_ACTIVITY",
    RESOURCE_LIMIT = "RESOURCE_LIMIT",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE"
}
export declare enum AlertSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum AlertSource {
    APPLICATION = "APPLICATION",
    DATABASE = "DATABASE",
    CACHE = "CACHE",
    EXTERNAL_API = "EXTERNAL_API",
    MONITORING = "MONITORING",
    SECURITY = "SECURITY"
}
export declare enum AlertStatus {
    ACTIVE = "ACTIVE",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    RESOLVED = "RESOLVED",
    SUPPRESSED = "SUPPRESSED"
}
export interface MonitoringMetric {
    id: string;
    name: string;
    category: MetricCategory;
    value: number;
    unit: string;
    timestamp: Date;
    tags?: Record<string, string>;
}
export declare enum MetricCategory {
    PERFORMANCE = "PERFORMANCE",
    USAGE = "USAGE",
    ERROR = "ERROR",
    BUSINESS = "BUSINESS",
    SECURITY = "SECURITY"
}
export interface ComplianceReport {
    id: string;
    reportType: ComplianceReportType;
    period: ReportPeriod;
    generatedAt: Date;
    generatedBy: string;
    status: ReportStatus;
    findings: ComplianceFinding[];
    recommendations: string[];
    metadata?: Record<string, any>;
}
export declare enum ComplianceReportType {
    GDPR_COMPLIANCE = "GDPR_COMPLIANCE",
    PDPA_COMPLIANCE = "PDPA_COMPLIANCE",
    HIPAA_COMPLIANCE = "HIPAA_COMPLIANCE",
    SECURITY_AUDIT = "SECURITY_AUDIT",
    DATA_RETENTION = "DATA_RETENTION",
    ACCESS_REVIEW = "ACCESS_REVIEW"
}
export interface ReportPeriod {
    startDate: Date;
    endDate: Date;
    description: string;
}
export declare enum ReportStatus {
    GENERATING = "GENERATING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export interface ComplianceFinding {
    id: string;
    severity: ComplianceSeverity;
    category: ComplianceCategory;
    description: string;
    affectedResources: string[];
    recommendation: string;
    status: FindingStatus;
}
export declare enum ComplianceSeverity {
    INFO = "INFO",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ComplianceCategory {
    DATA_PROTECTION = "DATA_PROTECTION",
    ACCESS_CONTROL = "ACCESS_CONTROL",
    AUDIT_LOGGING = "AUDIT_LOGGING",
    ENCRYPTION = "ENCRYPTION",
    RETENTION = "RETENTION",
    CONSENT = "CONSENT"
}
export declare enum FindingStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    ACCEPTED_RISK = "ACCEPTED_RISK"
}
export interface SuperAdminDashboardRequest {
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    includeAnalytics?: boolean;
    includeHealth?: boolean;
    includeAlerts?: boolean;
}
export interface SuperAdminDashboardResponse {
    analytics: PlatformAnalytics;
    systemHealth: SystemHealth;
    recentAlerts: SystemAlert[];
    pendingApprovals: {
        coaches: number;
        templates: number;
        exercises: number;
    };
    topTenants: TenantAnalytics[];
}
export interface TenantSearchRequest {
    query?: string;
    status?: TenantStatus;
    subscriptionStatus?: SubscriptionStatus;
    createdAfter?: Date;
    createdBefore?: Date;
    limit?: number;
    offset?: number;
    sortBy?: TenantSortField;
    sortOrder?: 'ASC' | 'DESC';
}
export declare enum TenantSortField {
    NAME = "NAME",
    CREATED_AT = "CREATED_AT",
    USER_COUNT = "USER_COUNT",
    REVENUE = "REVENUE",
    LAST_ACTIVITY = "LAST_ACTIVITY"
}
export interface UserSearchRequest {
    query?: string;
    role?: UserRole;
    status?: UserStatus;
    tenantId?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
    limit?: number;
    offset?: number;
    sortBy?: UserSortField;
    sortOrder?: 'ASC' | 'DESC';
}
export declare enum UserSortField {
    EMAIL = "EMAIL",
    CREATED_AT = "CREATED_AT",
    LAST_LOGIN = "LAST_LOGIN",
    ROLE = "ROLE",
    STATUS = "STATUS"
}
export interface ApprovalQueueRequest {
    type?: ApprovalQueueType;
    status?: ApprovalStatus;
    limit?: number;
    offset?: number;
    sortBy?: ApprovalSortField;
    sortOrder?: 'ASC' | 'DESC';
}
export declare enum ApprovalQueueType {
    COACHES = "COACHES",
    TEMPLATES = "TEMPLATES",
    EXERCISES = "EXERCISES"
}
export declare enum ApprovalSortField {
    SUBMITTED_AT = "SUBMITTED_AT",
    PRIORITY = "PRIORITY",
    TYPE = "TYPE"
}
export interface BulkActionRequest {
    targetType: BulkActionTargetType;
    targetIds: string[];
    action: BulkActionType;
    reason?: string;
    metadata?: Record<string, any>;
}
export declare enum BulkActionTargetType {
    USERS = "USERS",
    TENANTS = "TENANTS",
    APPROVALS = "APPROVALS"
}
export declare enum BulkActionType {
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    SUSPEND = "SUSPEND",
    REACTIVATE = "REACTIVATE",
    DELETE = "DELETE",
    UPDATE_STATUS = "UPDATE_STATUS"
}
export interface BulkActionResponse {
    totalRequested: number;
    successful: number;
    failed: number;
    errors: BulkActionError[];
}
export interface BulkActionError {
    targetId: string;
    error: string;
    code?: string;
}
export interface SuperAdminFilters {
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    tenantIds?: string[];
    userRoles?: UserRole[];
    statuses?: string[];
    limit?: number;
    offset?: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
//# sourceMappingURL=super-admin.d.ts.map