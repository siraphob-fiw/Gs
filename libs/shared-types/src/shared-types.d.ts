export declare class Results<T> {
    success: boolean;
    data: T | null;
    message: string | null;
    error: string | null;
    constructor(success: boolean, data?: T | null, message?: string | null, error?: string | null);
    get isError(): boolean;
    get isSuccess(): boolean;
    static ok<T>(data: T, message?: string): Results<T>;
    static fail<T>(data?: T | null, message?: string): Results<T>;
}
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    TENANT_ADMIN = "TENANT_ADMIN",
    COACH = "COACH",
    COACH_ADMIN = "COACH_ADMIN",
    ATHLETE = "ATHLETE",
    SELF_COACHED = "SELF_COACHED",
    USER = "USER"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
}
export declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING = "PENDING",
    TRIAL = "TRIAL",
    CANCELLED = "CANCELLED"
}
export declare enum WeightUnit {
    KG = "KG",
    LBS = "LBS"
}
export declare enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"
}
export declare enum NotificationType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    IN_APP = "IN_APP",
    WORKOUT_REMINDER = "WORKOUT_REMINDER",
    COACH_MESSAGE = "COACH_MESSAGE",
    TRANSITION_REQUEST = "TRANSITION_REQUEST",
    TRANSITION_APPROVED = "TRANSITION_APPROVED",
    TRANSITION_REJECTED = "TRANSITION_REJECTED",
    SYSTEM_ALERT = "SYSTEM_ALERT",
    WELCOME = "WELCOME",
    SECURITY_ALERT = "SECURITY_ALERT"
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Tenant {
    id: string;
    name: string;
    domain: string;
    status: TenantStatus;
    subscriptionId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TenantSettings {
    allowSelfCoached: boolean;
    requireCoachApproval: boolean;
    enableVideoAnalysis: boolean;
    enableAIFeedback: boolean;
    defaultLanguage: string;
    availableLanguages: string[];
    maxCoaches: number;
    maxAthletes: number;
    customBranding?: BrandingSettings;
    complianceSettings: ComplianceSettings;
}
export interface BrandingSettings {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    companyName?: string;
}
export interface ComplianceSettings {
    gdprEnabled: boolean;
    pdpaEnabled: boolean;
    hipaaEnabled: boolean;
}
export interface SubscriptionInfo {
    id: string;
    planId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd?: Date;
    usage: Record<string, number>;
}
export interface BillingInfo {
    customerId: string;
    paymentMethodId?: string;
    billingAddress?: Address;
    taxId?: string;
    currency: string;
    nextBillingDate: Date;
    lastPaymentDate?: Date;
    outstandingBalance: number;
}
export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export declare class AppError extends Error {
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
export declare function getErrorMessage(error: unknown): string;
export interface RequestContext {
    userId?: string;
    tenantId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
}
export interface LogData {
    message: string;
    fullMessage?: string;
    level?: string;
    timestamp?: Date;
    userId?: string;
    tenantId?: string;
    method?: string;
    [key: string]: any;
}
export interface ILogger {
    info(data: LogData): Promise<void>;
    warn(data: LogData): Promise<void>;
    error(data: LogData): Promise<void>;
    debug(data: LogData): Promise<void>;
}
//# sourceMappingURL=shared-types.d.ts.map