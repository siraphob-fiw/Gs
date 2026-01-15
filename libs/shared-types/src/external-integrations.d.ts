export declare enum OAuthProvider {
    GOOGLE = "GOOGLE",
    FACEBOOK = "FACEBOOK",
    APPLE = "APPLE",
    MICROSOFT = "MICROSOFT",
    GITHUB = "GITHUB",
    LINKEDIN = "LINKEDIN",
    TWITTER = "TWITTER",
    CUSTOM = "CUSTOM"
}
export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    revokeUrl?: string;
}
export interface OAuthAuthorizationRequest {
    provider: OAuthProvider;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
}
export interface OAuthTokenRequest {
    grant_type: 'authorization_code' | 'refresh_token';
    client_id: string;
    client_secret: string;
    code?: string;
    redirect_uri?: string;
    refresh_token?: string;
    state?: string;
}
export interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
}
export interface OAuthUserInfo {
    id: string;
    email?: string;
    emailVerified?: boolean;
    name?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    locale?: string;
    provider: OAuthProvider;
    raw: Record<string, any>;
}
export declare enum OAuthErrorCode {
    INVALID_PROVIDER = "INVALID_PROVIDER",
    INVALID_REQUEST = "INVALID_REQUEST",
    INVALID_CLIENT = "INVALID_CLIENT",
    INVALID_GRANT = "INVALID_GRANT",
    UNAUTHORIZED_CLIENT = "UNAUTHORIZED_CLIENT",
    UNSUPPORTED_GRANT_TYPE = "UNSUPPORTED_GRANT_TYPE",
    INVALID_SCOPE = "INVALID_SCOPE",
    TOKEN_EXCHANGE_FAILED = "TOKEN_EXCHANGE_FAILED",
    USER_INFO_FAILED = "USER_INFO_FAILED",
    NETWORK_ERROR = "NETWORK_ERROR"
}
export declare class OAuthError extends Error {
    code: OAuthErrorCode;
    provider?: OAuthProvider | undefined;
    constructor(code: OAuthErrorCode, message: string, provider?: OAuthProvider | undefined);
}
export declare enum WebhookProvider {
    STRIPE = "STRIPE",
    PROMPTPAY = "PROMPTPAY",
    BANK_TRANSFER = "BANK_TRANSFER",
    OMISE = "OMISE",
    PAYPAL = "PAYPAL",
    CUSTOM = "CUSTOM"
}
export interface WebhookConfig {
    url: string;
    secret: string;
    events: string[];
    active: boolean;
}
export interface WebhookEvent {
    id: string;
    type: string;
    provider: WebhookProvider;
    data: Record<string, any>;
    createdAt: Date;
    livemode?: boolean;
    apiVersion?: string;
    raw: Record<string, any>;
}
export interface WebhookVerificationResult {
    isValid: boolean;
    error?: string;
}
export declare enum WebhookErrorCode {
    INVALID_PROVIDER = "INVALID_PROVIDER",
    INVALID_PAYLOAD = "INVALID_PAYLOAD",
    MISSING_SIGNATURE = "MISSING_SIGNATURE",
    INVALID_SIGNATURE = "INVALID_SIGNATURE",
    TIMESTAMP_TOO_OLD = "TIMESTAMP_TOO_OLD",
    NO_HANDLER = "NO_HANDLER",
    HANDLER_FAILED = "HANDLER_FAILED"
}
export declare class WebhookError extends Error {
    code: WebhookErrorCode;
    provider?: WebhookProvider | undefined;
    constructor(code: WebhookErrorCode, message: string, provider?: WebhookProvider | undefined);
}
export declare enum EmailProvider {
    SENDGRID = "SENDGRID",
    SES = "SES",
    MAILGUN = "MAILGUN",
    POSTMARK = "POSTMARK",
    SMTP = "SMTP",
    MOCK = "MOCK"
}
export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    language: string;
    variables: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"
}
export declare enum PaymentProviderType {
    STRIPE = "STRIPE",
    PROMPTPAY = "PROMPTPAY",
    BANK_TRANSFER = "BANK_TRANSFER",
    OMISE = "OMISE",
    PAYPAL = "PAYPAL",
    CUSTOM = "CUSTOM"
}
export declare enum PaymentMethodType {
    CREDIT_CARD = "CREDIT_CARD",
    DEBIT_CARD = "DEBIT_CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    PROMPTPAY = "PROMPTPAY",
    DIGITAL_WALLET = "DIGITAL_WALLET",
    CRYPTOCURRENCY = "CRYPTOCURRENCY"
}
export declare enum PromptPayType {
    PHONE = "PHONE",
    ID_CARD = "ID_CARD",
    E_WALLET = "E_WALLET"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    OPEN = "OPEN",
    PAID = "PAID",
    VOID = "VOID",
    UNCOLLECTIBLE = "UNCOLLECTIBLE"
}
export declare enum UsageMetricType {
    ACTIVE_COACHES = "ACTIVE_COACHES",
    ACTIVE_ATHLETES = "ACTIVE_ATHLETES",
    STORAGE_USED = "STORAGE_USED",
    API_CALLS = "API_CALLS",
    VIDEO_ANALYSIS_MINUTES = "VIDEO_ANALYSIS_MINUTES"
}
export declare enum UsageTrend {
    INCREASING = "INCREASING",
    DECREASING = "DECREASING",
    STABLE = "STABLE"
}
export declare enum BillingInterval {
    DAY = "DAY",
    WEEK = "WEEK",
    MONTH = "MONTH",
    YEAR = "YEAR"
}
export interface CircuitBreakerMetrics {
    circuitId: string;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    successCount: number;
    totalCalls: number;
    lastFailureTime?: Date;
    lastSuccessTime?: Date;
    nextAttemptTime?: Date;
}
export interface RetryMetrics {
    operationId: string;
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageRetries: number;
    lastAttemptTime: Date;
}
export interface ExternalAPIResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}
export interface ExternalAPIError extends Error {
    status?: number;
    statusText?: string;
    response?: ExternalAPIResponse;
    isRetryable: boolean;
}
//# sourceMappingURL=external-integrations.d.ts.map