"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingInterval = exports.UsageTrend = exports.UsageMetricType = exports.InvoiceStatus = exports.PromptPayType = exports.PaymentMethodType = exports.PaymentProviderType = exports.PaymentStatus = exports.EmailProvider = exports.WebhookError = exports.WebhookErrorCode = exports.WebhookProvider = exports.OAuthError = exports.OAuthErrorCode = exports.OAuthProvider = void 0;
// OAuth Types
var OAuthProvider;
(function (OAuthProvider) {
    OAuthProvider["GOOGLE"] = "GOOGLE";
    OAuthProvider["FACEBOOK"] = "FACEBOOK";
    OAuthProvider["APPLE"] = "APPLE";
    OAuthProvider["MICROSOFT"] = "MICROSOFT";
    OAuthProvider["GITHUB"] = "GITHUB";
    OAuthProvider["LINKEDIN"] = "LINKEDIN";
    OAuthProvider["TWITTER"] = "TWITTER";
    OAuthProvider["CUSTOM"] = "CUSTOM";
})(OAuthProvider || (exports.OAuthProvider = OAuthProvider = {}));
var OAuthErrorCode;
(function (OAuthErrorCode) {
    OAuthErrorCode["INVALID_PROVIDER"] = "INVALID_PROVIDER";
    OAuthErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    OAuthErrorCode["INVALID_CLIENT"] = "INVALID_CLIENT";
    OAuthErrorCode["INVALID_GRANT"] = "INVALID_GRANT";
    OAuthErrorCode["UNAUTHORIZED_CLIENT"] = "UNAUTHORIZED_CLIENT";
    OAuthErrorCode["UNSUPPORTED_GRANT_TYPE"] = "UNSUPPORTED_GRANT_TYPE";
    OAuthErrorCode["INVALID_SCOPE"] = "INVALID_SCOPE";
    OAuthErrorCode["TOKEN_EXCHANGE_FAILED"] = "TOKEN_EXCHANGE_FAILED";
    OAuthErrorCode["USER_INFO_FAILED"] = "USER_INFO_FAILED";
    OAuthErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
})(OAuthErrorCode || (exports.OAuthErrorCode = OAuthErrorCode = {}));
class OAuthError extends Error {
    constructor(code, message, provider) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.name = 'OAuthError';
    }
}
exports.OAuthError = OAuthError;
// Webhook Types
var WebhookProvider;
(function (WebhookProvider) {
    WebhookProvider["STRIPE"] = "STRIPE";
    WebhookProvider["PROMPTPAY"] = "PROMPTPAY";
    WebhookProvider["BANK_TRANSFER"] = "BANK_TRANSFER";
    WebhookProvider["OMISE"] = "OMISE";
    WebhookProvider["PAYPAL"] = "PAYPAL";
    WebhookProvider["CUSTOM"] = "CUSTOM";
})(WebhookProvider || (exports.WebhookProvider = WebhookProvider = {}));
var WebhookErrorCode;
(function (WebhookErrorCode) {
    WebhookErrorCode["INVALID_PROVIDER"] = "INVALID_PROVIDER";
    WebhookErrorCode["INVALID_PAYLOAD"] = "INVALID_PAYLOAD";
    WebhookErrorCode["MISSING_SIGNATURE"] = "MISSING_SIGNATURE";
    WebhookErrorCode["INVALID_SIGNATURE"] = "INVALID_SIGNATURE";
    WebhookErrorCode["TIMESTAMP_TOO_OLD"] = "TIMESTAMP_TOO_OLD";
    WebhookErrorCode["NO_HANDLER"] = "NO_HANDLER";
    WebhookErrorCode["HANDLER_FAILED"] = "HANDLER_FAILED";
})(WebhookErrorCode || (exports.WebhookErrorCode = WebhookErrorCode = {}));
class WebhookError extends Error {
    constructor(code, message, provider) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.name = 'WebhookError';
    }
}
exports.WebhookError = WebhookError;
// Email Provider Types
var EmailProvider;
(function (EmailProvider) {
    EmailProvider["SENDGRID"] = "SENDGRID";
    EmailProvider["SES"] = "SES";
    EmailProvider["MAILGUN"] = "MAILGUN";
    EmailProvider["POSTMARK"] = "POSTMARK";
    EmailProvider["SMTP"] = "SMTP";
    EmailProvider["MOCK"] = "MOCK";
})(EmailProvider || (exports.EmailProvider = EmailProvider = {}));
// Payment Provider Types (extending existing)
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["SUCCEEDED"] = "SUCCEEDED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["PARTIALLY_REFUNDED"] = "PARTIALLY_REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentProviderType;
(function (PaymentProviderType) {
    PaymentProviderType["STRIPE"] = "STRIPE";
    PaymentProviderType["PROMPTPAY"] = "PROMPTPAY";
    PaymentProviderType["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentProviderType["OMISE"] = "OMISE";
    PaymentProviderType["PAYPAL"] = "PAYPAL";
    PaymentProviderType["CUSTOM"] = "CUSTOM";
})(PaymentProviderType || (exports.PaymentProviderType = PaymentProviderType = {}));
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethodType["DEBIT_CARD"] = "DEBIT_CARD";
    PaymentMethodType["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethodType["PROMPTPAY"] = "PROMPTPAY";
    PaymentMethodType["DIGITAL_WALLET"] = "DIGITAL_WALLET";
    PaymentMethodType["CRYPTOCURRENCY"] = "CRYPTOCURRENCY";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var PromptPayType;
(function (PromptPayType) {
    PromptPayType["PHONE"] = "PHONE";
    PromptPayType["ID_CARD"] = "ID_CARD";
    PromptPayType["E_WALLET"] = "E_WALLET";
})(PromptPayType || (exports.PromptPayType = PromptPayType = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["OPEN"] = "OPEN";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["VOID"] = "VOID";
    InvoiceStatus["UNCOLLECTIBLE"] = "UNCOLLECTIBLE";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var UsageMetricType;
(function (UsageMetricType) {
    UsageMetricType["ACTIVE_COACHES"] = "ACTIVE_COACHES";
    UsageMetricType["ACTIVE_ATHLETES"] = "ACTIVE_ATHLETES";
    UsageMetricType["STORAGE_USED"] = "STORAGE_USED";
    UsageMetricType["API_CALLS"] = "API_CALLS";
    UsageMetricType["VIDEO_ANALYSIS_MINUTES"] = "VIDEO_ANALYSIS_MINUTES";
})(UsageMetricType || (exports.UsageMetricType = UsageMetricType = {}));
var UsageTrend;
(function (UsageTrend) {
    UsageTrend["INCREASING"] = "INCREASING";
    UsageTrend["DECREASING"] = "DECREASING";
    UsageTrend["STABLE"] = "STABLE";
})(UsageTrend || (exports.UsageTrend = UsageTrend = {}));
var BillingInterval;
(function (BillingInterval) {
    BillingInterval["DAY"] = "DAY";
    BillingInterval["WEEK"] = "WEEK";
    BillingInterval["MONTH"] = "MONTH";
    BillingInterval["YEAR"] = "YEAR";
})(BillingInterval || (exports.BillingInterval = BillingInterval = {}));
//# sourceMappingURL=external-integrations.js.map