import { NotificationType, NotificationStatus, NotificationFrequency, PriorityLevel, SupportedLanguage, UserRole, TransitionType } from './user-management-enums';
export { SupportedLanguage, NotificationType, NotificationStatus, NotificationFrequency, PriorityLevel, UserRole, TransitionType, } from './user-management-enums';
export interface Notification {
    id: string;
    tenantId: string;
    recipientId: string;
    recipientRole: UserRole;
    type: NotificationType;
    status: NotificationStatus;
    priority: PriorityLevel;
    content: NotificationContent;
    metadata: NotificationMetadata;
    channels: NotificationChannel[];
    scheduledAt?: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationContent {
    subject: string;
    body: string;
    language: SupportedLanguage;
    templateId?: string;
    templateVariables?: Record<string, any>;
    actionUrl?: string;
    actionText?: string;
}
export interface NotificationMetadata {
    sourceUserId?: string;
    sourceType?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    transitionId?: string;
    campaignId?: string;
    tags?: string[];
    customData?: Record<string, any>;
}
export interface NotificationChannel {
    type: NotificationChannelType;
    address: string;
    status: NotificationChannelStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
    retryCount: number;
    maxRetries: number;
}
export interface NotificationPreferences {
    userId: string;
    tenantId: string;
    email: EmailNotificationSettings;
    push: PushNotificationSettings;
    sms: SMSNotificationSettings;
    inApp: InAppNotificationSettings;
    globalSettings: GlobalNotificationSettings;
    updatedAt: Date;
}
export interface EmailNotificationSettings {
    enabled: boolean;
    address: string;
    verified: boolean;
    workoutReminders: boolean;
    coachMessages: boolean;
    transitionUpdates: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
    frequency: NotificationFrequency;
    quietHours: QuietHours;
}
export interface PushNotificationSettings {
    enabled: boolean;
    deviceTokens: PushDeviceToken[];
    workoutReminders: boolean;
    coachMessages: boolean;
    transitionUpdates: boolean;
    systemAlerts: boolean;
    quietHours: QuietHours;
}
export interface SMSNotificationSettings {
    enabled: boolean;
    phoneNumber: string;
    verified: boolean;
    emergencyOnly: boolean;
    transitionUpdates: boolean;
    quietHours: QuietHours;
}
export interface InAppNotificationSettings {
    enabled: boolean;
    showBadges: boolean;
    playSound: boolean;
    categories: NotificationCategoryPreference[];
    maxNotifications: number;
    autoMarkRead: boolean;
}
export interface GlobalNotificationSettings {
    timezone: string;
    language: SupportedLanguage;
    doNotDisturb: boolean;
    quietHours: QuietHours;
    unsubscribeAll: boolean;
}
export interface QuietHours {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    days: number[];
}
export interface NotificationCategoryPreference {
    type: NotificationType;
    enabled: boolean;
    priority: PriorityLevel;
    channels: NotificationChannelType[];
}
export interface PushDeviceToken {
    token: string;
    platform: PushPlatform;
    appVersion: string;
    isActive: boolean;
    registeredAt: Date;
    lastUsedAt?: Date;
}
export interface NotificationTemplate {
    id: string;
    tenantId: string;
    name: string;
    type: NotificationType;
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
export interface TemplateVariable {
    name: string;
    type: TemplateVariableType;
    required: boolean;
    defaultValue?: string;
    description?: string;
}
export interface NotificationTemplateSet {
    baseTemplateId: string;
    translations: Record<SupportedLanguage, NotificationTemplate>;
}
export interface TransitionNotification extends Notification {
    transitionId: string;
    transitionType: TransitionType;
    fromCoachId?: string;
    toCoachId?: string;
    athleteId: string;
    approvalRequired: boolean;
    approvalUrl?: string;
    deadlineAt?: Date;
}
export interface TransitionNotificationRequest {
    transitionId: string;
    recipientIds: string[];
    notificationType: NotificationType;
    templateId?: string;
    customContent?: Partial<NotificationContent>;
    scheduledAt?: Date;
    priority?: PriorityLevel;
}
export interface BulkNotificationRequest {
    tenantId: string;
    recipientFilters: RecipientFilter[];
    content: NotificationContent;
    type: NotificationType;
    priority: PriorityLevel;
    channels: NotificationChannelType[];
    scheduledAt?: Date;
    expiresAt?: Date;
    campaignId?: string;
}
export interface RecipientFilter {
    roles?: UserRole[];
    userIds?: string[];
    tags?: string[];
    excludeUserIds?: string[];
    customFilters?: Record<string, any>;
}
export interface BulkNotificationResult {
    campaignId: string;
    totalRecipients: number;
    successfulNotifications: number;
    failedNotifications: number;
    scheduledNotifications: number;
    errors: NotificationError[];
}
export interface NotificationDeliveryRequest {
    notificationId: string;
    channels: NotificationChannelType[];
    priority: PriorityLevel;
    retryPolicy?: RetryPolicy;
}
export interface NotificationDeliveryResult {
    notificationId: string;
    channelResults: ChannelDeliveryResult[];
    overallStatus: NotificationDeliveryStatus;
    deliveredAt?: Date;
    failureReason?: string;
}
export interface ChannelDeliveryResult {
    channel: NotificationChannelType;
    status: NotificationChannelStatus;
    deliveredAt?: Date;
    failureReason?: string;
    retryCount: number;
    nextRetryAt?: Date;
}
export interface RetryPolicy {
    maxRetries: number;
    retryDelays: number[];
    backoffMultiplier: number;
    maxDelay: number;
}
export interface NotificationAnalytics {
    tenantId: string;
    period: AnalyticsPeriod;
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    deliveryRate: number;
    readRate: number;
    channelBreakdown: ChannelAnalytics[];
    typeBreakdown: TypeAnalytics[];
    topFailureReasons: FailureReasonAnalytics[];
}
export interface ChannelAnalytics {
    channel: NotificationChannelType;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    avgDeliveryTime: number;
}
export interface TypeAnalytics {
    type: NotificationType;
    sent: number;
    delivered: number;
    read: number;
    readRate: number;
    avgTimeToRead: number;
}
export interface FailureReasonAnalytics {
    reason: string;
    count: number;
    percentage: number;
    affectedChannels: NotificationChannelType[];
}
export interface AnalyticsPeriod {
    startDate: Date;
    endDate: Date;
    granularity: AnalyticsGranularity;
}
export declare enum NotificationChannelType {
    EMAIL = "EMAIL",
    PUSH = "PUSH",
    SMS = "SMS",
    IN_APP = "IN_APP",
    WEBHOOK = "WEBHOOK"
}
export declare enum NotificationChannelStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    BOUNCED = "BOUNCED",
    UNSUBSCRIBED = "UNSUBSCRIBED"
}
export declare enum NotificationDeliveryStatus {
    SUCCESS = "SUCCESS",
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS",
    FAILED = "FAILED",
    PENDING = "PENDING"
}
export declare enum PushPlatform {
    IOS = "IOS",
    ANDROID = "ANDROID",
    WEB = "WEB"
}
export declare enum TemplateVariableType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    DATE = "DATE",
    BOOLEAN = "BOOLEAN",
    URL = "URL",
    EMAIL = "EMAIL"
}
export declare enum AnalyticsGranularity {
    HOUR = "HOUR",
    DAY = "DAY",
    WEEK = "WEEK",
    MONTH = "MONTH"
}
export interface NotificationError {
    code: NotificationErrorCode;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
}
export declare enum NotificationErrorCode {
    INVALID_RECIPIENT = "INVALID_RECIPIENT",
    TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
    CHANNEL_UNAVAILABLE = "CHANNEL_UNAVAILABLE",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    CONTENT_TOO_LARGE = "CONTENT_TOO_LARGE",
    INVALID_TEMPLATE_VARIABLES = "INVALID_TEMPLATE_VARIABLES",
    DELIVERY_FAILED = "DELIVERY_FAILED",
    UNSUBSCRIBED = "UNSUBSCRIBED",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
}
export interface NotificationServiceInterface {
    createNotification(request: CreateNotificationRequest): Promise<Notification>;
    sendNotification(notificationId: string): Promise<NotificationDeliveryResult>;
    getNotification(notificationId: string): Promise<Notification>;
    updateNotificationStatus(notificationId: string, status: NotificationStatus): Promise<Notification>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    sendBulkNotification(request: BulkNotificationRequest): Promise<BulkNotificationResult>;
    getNotifications(filters: NotificationFilters): Promise<Notification[]>;
    getUserPreferences(userId: string): Promise<NotificationPreferences>;
    updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
    getTemplate(templateId: string, language: SupportedLanguage): Promise<NotificationTemplate>;
    renderTemplate(templateId: string, variables: Record<string, any>, language: SupportedLanguage): Promise<NotificationContent>;
    getAnalytics(tenantId: string, period: AnalyticsPeriod): Promise<NotificationAnalytics>;
}
export interface CreateNotificationRequest {
    tenantId: string;
    recipientId: string;
    type: NotificationType;
    content?: NotificationContent;
    templateId?: string;
    templateVariables?: Record<string, any>;
    channels?: NotificationChannelType[];
    priority?: PriorityLevel;
    scheduledAt?: Date;
    expiresAt?: Date;
    metadata?: NotificationMetadata;
}
export interface NotificationFilters {
    tenantId?: string;
    recipientId?: string;
    type?: NotificationType;
    status?: NotificationStatus;
    priority?: PriorityLevel;
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    limit?: number;
    offset?: number;
}
//# sourceMappingURL=notifications.d.ts.map