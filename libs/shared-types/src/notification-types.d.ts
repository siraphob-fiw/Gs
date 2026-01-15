export declare enum NotificationStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    READ = "READ",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED"
}
export declare enum PriorityLevel {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum TransitionNotificationType {
    TRANSITION_REQUESTED = "TRANSITION_REQUESTED",
    TRANSITION_APPROVED = "TRANSITION_APPROVED",
    TRANSITION_REJECTED = "TRANSITION_REJECTED",
    TRANSITION_COMPLETED = "TRANSITION_COMPLETED"
}
export declare enum NotificationChannelEnum {
    EMAIL = "EMAIL",
    SMS = "SMS",
    SLACK = "SLACK",
    WEBHOOK = "WEBHOOK",
    IN_APP = "IN_APP"
}
export declare enum SupportedLanguage {
    EN = "EN",
    TH = "TH",
    ZH = "ZH",
    ES = "ES",
    FR = "FR"
}
export declare enum TemplateVariableType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    DATE = "DATE",
    BOOLEAN = "BOOLEAN",
    OBJECT = "OBJECT",
    URL = "URL",
    EMAIL = "EMAIL"
}
export declare enum NotificationChannelType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    IN_APP = "IN_APP",
    WEBHOOK = "WEBHOOK"
}
export declare enum NotificationErrorCode {
    INVALID_RECIPIENT = "INVALID_RECIPIENT",
    CONTENT_TOO_LARGE = "CONTENT_TOO_LARGE",
    DELIVERY_FAILED = "DELIVERY_FAILED",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    CHANNEL_UNAVAILABLE = "CHANNEL_UNAVAILABLE",
    RATE_LIMITED = "RATE_LIMITED",
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED"
}
export declare enum PushPlatform {
    IOS = "IOS",
    ANDROID = "ANDROID",
    WEB = "WEB"
}
export interface NotificationContent {
    subject: string;
    body: string;
    bodyHtml?: string;
    language: SupportedLanguage;
    templateId?: string;
    templateVariables?: Record<string, any>;
    data?: Record<string, any>;
    imageUrl?: string;
    actionUrl?: string;
}
export interface NotificationError {
    code: NotificationErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, any>;
}
export interface PushDeviceToken {
    token: string;
    platform: PushPlatform;
    appVersion?: string;
    deviceId?: string;
}
export interface TemplateVariable {
    name: string;
    type: TemplateVariableType;
    required: boolean;
    description?: string;
    defaultValue?: any;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    type: string;
    language: SupportedLanguage;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    variables: TemplateVariable[];
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationChannel {
    type: NotificationChannelType;
    address: string;
    status: string;
    retryCount: number;
    maxRetries: number;
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
}
export interface Notification {
    id: string;
    tenantId: string;
    recipientId: string;
    recipientRole?: string;
    type: string;
    status: NotificationStatus;
    priority: PriorityLevel;
    content: NotificationContent;
    metadata: Record<string, any>;
    channels: NotificationChannel[];
    scheduledAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
}
export interface CreateNotificationRequest {
    type: string;
    title: string;
    body: string;
    recipientId: string;
    data?: Record<string, any>;
    priority?: PriorityLevel;
    scheduledFor?: Date;
    expiresAt?: Date;
}
export interface NotificationFilters {
    type?: string;
    status?: NotificationStatus;
    priority?: PriorityLevel;
    recipientId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export interface BulkNotificationRequest {
    type: string;
    title: string;
    body: string;
    recipientIds: string[];
    data?: Record<string, any>;
    priority?: PriorityLevel;
    scheduledFor?: Date;
}
export interface NotificationPreferences {
    userId: string;
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    quietHours?: {
        start: string;
        end: string;
        timezone: string;
    };
    categories: Record<string, boolean>;
}
export interface TransitionNotificationRequest {
    transitionId: string;
    type: TransitionNotificationType;
    recipientIds: string[];
    data?: Record<string, any>;
}
//# sourceMappingURL=notification-types.d.ts.map