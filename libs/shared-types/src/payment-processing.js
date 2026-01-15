"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Region = exports.Currency = exports.WebhookEventType = exports.TaxType = exports.BillingPeriodType = exports.ProrationBehavior = exports.PaymentErrorType = exports.NextActionType = exports.ConfirmationMethod = exports.CaptureMethod = exports.FeeType = exports.ProviderStatus = exports.DisputeStatus = exports.DisputeReason = exports.RefundReason = exports.RefundStatus = exports.InvoiceStatus = exports.SubscriptionStatus = exports.PaymentIntentStatus = exports.PaymentStatus = exports.CryptocurrencyType = exports.DigitalWalletType = exports.CardFunding = exports.CardBrand = exports.PromptPayType = exports.PaymentProviderType = exports.PaymentMethodType = void 0;
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethodType["DEBIT_CARD"] = "DEBIT_CARD";
    PaymentMethodType["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethodType["PROMPTPAY"] = "PROMPTPAY";
    PaymentMethodType["DIGITAL_WALLET"] = "DIGITAL_WALLET";
    PaymentMethodType["CRYPTOCURRENCY"] = "CRYPTOCURRENCY";
    PaymentMethodType["CASH"] = "CASH";
    PaymentMethodType["CHECK"] = "CHECK";
    PaymentMethodType["WIRE_TRANSFER"] = "WIRE_TRANSFER";
    PaymentMethodType["ACH"] = "ACH";
    PaymentMethodType["SEPA"] = "SEPA";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var PaymentProviderType;
(function (PaymentProviderType) {
    PaymentProviderType["STRIPE"] = "STRIPE";
    PaymentProviderType["PROMPTPAY"] = "PROMPTPAY";
    PaymentProviderType["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentProviderType["OMISE"] = "OMISE";
    PaymentProviderType["PAYPAL"] = "PAYPAL";
    PaymentProviderType["SQUARE"] = "SQUARE";
    PaymentProviderType["ADYEN"] = "ADYEN";
    PaymentProviderType["BRAINTREE"] = "BRAINTREE";
    PaymentProviderType["RAZORPAY"] = "RAZORPAY";
    PaymentProviderType["CUSTOM"] = "CUSTOM";
})(PaymentProviderType || (exports.PaymentProviderType = PaymentProviderType = {}));
var PromptPayType;
(function (PromptPayType) {
    PromptPayType["PHONE"] = "PHONE";
    PromptPayType["ID_CARD"] = "ID_CARD";
    PromptPayType["E_WALLET"] = "E_WALLET";
    PromptPayType["BANK_ACCOUNT"] = "BANK_ACCOUNT";
})(PromptPayType || (exports.PromptPayType = PromptPayType = {}));
var CardBrand;
(function (CardBrand) {
    CardBrand["VISA"] = "VISA";
    CardBrand["MASTERCARD"] = "MASTERCARD";
    CardBrand["AMERICAN_EXPRESS"] = "AMERICAN_EXPRESS";
    CardBrand["DISCOVER"] = "DISCOVER";
    CardBrand["JCB"] = "JCB";
    CardBrand["DINERS_CLUB"] = "DINERS_CLUB";
    CardBrand["UNIONPAY"] = "UNIONPAY";
    CardBrand["UNKNOWN"] = "UNKNOWN";
})(CardBrand || (exports.CardBrand = CardBrand = {}));
var CardFunding;
(function (CardFunding) {
    CardFunding["CREDIT"] = "CREDIT";
    CardFunding["DEBIT"] = "DEBIT";
    CardFunding["PREPAID"] = "PREPAID";
    CardFunding["UNKNOWN"] = "UNKNOWN";
})(CardFunding || (exports.CardFunding = CardFunding = {}));
var DigitalWalletType;
(function (DigitalWalletType) {
    DigitalWalletType["APPLE_PAY"] = "APPLE_PAY";
    DigitalWalletType["GOOGLE_PAY"] = "GOOGLE_PAY";
    DigitalWalletType["SAMSUNG_PAY"] = "SAMSUNG_PAY";
    DigitalWalletType["PAYPAL"] = "PAYPAL";
    DigitalWalletType["ALIPAY"] = "ALIPAY";
    DigitalWalletType["WECHAT_PAY"] = "WECHAT_PAY";
    DigitalWalletType["GRAB_PAY"] = "GRAB_PAY";
    DigitalWalletType["TRUE_MONEY"] = "TRUE_MONEY";
})(DigitalWalletType || (exports.DigitalWalletType = DigitalWalletType = {}));
var CryptocurrencyType;
(function (CryptocurrencyType) {
    CryptocurrencyType["BITCOIN"] = "BITCOIN";
    CryptocurrencyType["ETHEREUM"] = "ETHEREUM";
    CryptocurrencyType["LITECOIN"] = "LITECOIN";
    CryptocurrencyType["BITCOIN_CASH"] = "BITCOIN_CASH";
    CryptocurrencyType["RIPPLE"] = "RIPPLE";
    CryptocurrencyType["CARDANO"] = "CARDANO";
    CryptocurrencyType["POLKADOT"] = "POLKADOT";
    CryptocurrencyType["CHAINLINK"] = "CHAINLINK";
})(CryptocurrencyType || (exports.CryptocurrencyType = CryptocurrencyType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["SUCCEEDED"] = "SUCCEEDED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELED"] = "CANCELED";
    PaymentStatus["REQUIRES_ACTION"] = "REQUIRES_ACTION";
    PaymentStatus["REQUIRES_CONFIRMATION"] = "REQUIRES_CONFIRMATION";
    PaymentStatus["REQUIRES_PAYMENT_METHOD"] = "REQUIRES_PAYMENT_METHOD";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentIntentStatus;
(function (PaymentIntentStatus) {
    PaymentIntentStatus["REQUIRES_PAYMENT_METHOD"] = "REQUIRES_PAYMENT_METHOD";
    PaymentIntentStatus["REQUIRES_CONFIRMATION"] = "REQUIRES_CONFIRMATION";
    PaymentIntentStatus["REQUIRES_ACTION"] = "REQUIRES_ACTION";
    PaymentIntentStatus["PROCESSING"] = "PROCESSING";
    PaymentIntentStatus["REQUIRES_CAPTURE"] = "REQUIRES_CAPTURE";
    PaymentIntentStatus["CANCELED"] = "CANCELED";
    PaymentIntentStatus["SUCCEEDED"] = "SUCCEEDED";
})(PaymentIntentStatus || (exports.PaymentIntentStatus = PaymentIntentStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["INCOMPLETE"] = "INCOMPLETE";
    SubscriptionStatus["INCOMPLETE_EXPIRED"] = "INCOMPLETE_EXPIRED";
    SubscriptionStatus["TRIALING"] = "TRIALING";
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["UNPAID"] = "UNPAID";
    SubscriptionStatus["PAUSED"] = "PAUSED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["OPEN"] = "OPEN";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["UNCOLLECTIBLE"] = "UNCOLLECTIBLE";
    InvoiceStatus["VOID"] = "VOID";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "PENDING";
    RefundStatus["SUCCEEDED"] = "SUCCEEDED";
    RefundStatus["FAILED"] = "FAILED";
    RefundStatus["CANCELED"] = "CANCELED";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
var RefundReason;
(function (RefundReason) {
    RefundReason["DUPLICATE"] = "DUPLICATE";
    RefundReason["FRAUDULENT"] = "FRAUDULENT";
    RefundReason["REQUESTED_BY_CUSTOMER"] = "REQUESTED_BY_CUSTOMER";
    RefundReason["EXPIRED_UNCAPTURED_CHARGE"] = "EXPIRED_UNCAPTURED_CHARGE";
})(RefundReason || (exports.RefundReason = RefundReason = {}));
var DisputeReason;
(function (DisputeReason) {
    DisputeReason["DUPLICATE"] = "DUPLICATE";
    DisputeReason["FRAUDULENT"] = "FRAUDULENT";
    DisputeReason["SUBSCRIPTION_CANCELED"] = "SUBSCRIPTION_CANCELED";
    DisputeReason["PRODUCT_UNACCEPTABLE"] = "PRODUCT_UNACCEPTABLE";
    DisputeReason["PRODUCT_NOT_RECEIVED"] = "PRODUCT_NOT_RECEIVED";
    DisputeReason["UNRECOGNIZED"] = "UNRECOGNIZED";
    DisputeReason["CREDIT_NOT_PROCESSED"] = "CREDIT_NOT_PROCESSED";
    DisputeReason["GENERAL"] = "GENERAL";
    DisputeReason["INCORRECT_ACCOUNT_DETAILS"] = "INCORRECT_ACCOUNT_DETAILS";
    DisputeReason["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    DisputeReason["BANK_CANNOT_PROCESS"] = "BANK_CANNOT_PROCESS";
    DisputeReason["DEBIT_NOT_AUTHORIZED"] = "DEBIT_NOT_AUTHORIZED";
    DisputeReason["CUSTOMER_INITIATED"] = "CUSTOMER_INITIATED";
})(DisputeReason || (exports.DisputeReason = DisputeReason = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["WARNING_NEEDS_RESPONSE"] = "WARNING_NEEDS_RESPONSE";
    DisputeStatus["WARNING_UNDER_REVIEW"] = "WARNING_UNDER_REVIEW";
    DisputeStatus["WARNING_CLOSED"] = "WARNING_CLOSED";
    DisputeStatus["NEEDS_RESPONSE"] = "NEEDS_RESPONSE";
    DisputeStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    DisputeStatus["CHARGE_REFUNDED"] = "CHARGE_REFUNDED";
    DisputeStatus["WON"] = "WON";
    DisputeStatus["LOST"] = "LOST";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
var ProviderStatus;
(function (ProviderStatus) {
    ProviderStatus["ACTIVE"] = "ACTIVE";
    ProviderStatus["INACTIVE"] = "INACTIVE";
    ProviderStatus["TESTING"] = "TESTING";
    ProviderStatus["DEPRECATED"] = "DEPRECATED";
    ProviderStatus["MAINTENANCE"] = "MAINTENANCE";
})(ProviderStatus || (exports.ProviderStatus = ProviderStatus = {}));
var FeeType;
(function (FeeType) {
    FeeType["FIXED"] = "FIXED";
    FeeType["PERCENTAGE"] = "PERCENTAGE";
    FeeType["TIERED"] = "TIERED";
    FeeType["VOLUME"] = "VOLUME";
})(FeeType || (exports.FeeType = FeeType = {}));
var CaptureMethod;
(function (CaptureMethod) {
    CaptureMethod["AUTOMATIC"] = "AUTOMATIC";
    CaptureMethod["MANUAL"] = "MANUAL";
})(CaptureMethod || (exports.CaptureMethod = CaptureMethod = {}));
var ConfirmationMethod;
(function (ConfirmationMethod) {
    ConfirmationMethod["AUTOMATIC"] = "AUTOMATIC";
    ConfirmationMethod["MANUAL"] = "MANUAL";
})(ConfirmationMethod || (exports.ConfirmationMethod = ConfirmationMethod = {}));
var NextActionType;
(function (NextActionType) {
    NextActionType["REDIRECT_TO_URL"] = "REDIRECT_TO_URL";
    NextActionType["USE_STRIPE_SDK"] = "USE_STRIPE_SDK";
    NextActionType["DISPLAY_BANK_TRANSFER_INSTRUCTIONS"] = "DISPLAY_BANK_TRANSFER_INSTRUCTIONS";
    NextActionType["VERIFY_WITH_MICRODEPOSITS"] = "VERIFY_WITH_MICRODEPOSITS";
})(NextActionType || (exports.NextActionType = NextActionType = {}));
var PaymentErrorType;
(function (PaymentErrorType) {
    PaymentErrorType["API_CONNECTION_ERROR"] = "API_CONNECTION_ERROR";
    PaymentErrorType["API_ERROR"] = "API_ERROR";
    PaymentErrorType["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    PaymentErrorType["CARD_ERROR"] = "CARD_ERROR";
    PaymentErrorType["IDEMPOTENCY_ERROR"] = "IDEMPOTENCY_ERROR";
    PaymentErrorType["INVALID_REQUEST_ERROR"] = "INVALID_REQUEST_ERROR";
    PaymentErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
})(PaymentErrorType || (exports.PaymentErrorType = PaymentErrorType = {}));
var ProrationBehavior;
(function (ProrationBehavior) {
    ProrationBehavior["CREATE_PRORATIONS"] = "CREATE_PRORATIONS";
    ProrationBehavior["NONE"] = "NONE";
    ProrationBehavior["ALWAYS_INVOICE"] = "ALWAYS_INVOICE";
})(ProrationBehavior || (exports.ProrationBehavior = ProrationBehavior = {}));
var BillingPeriodType;
(function (BillingPeriodType) {
    BillingPeriodType["DAILY"] = "DAILY";
    BillingPeriodType["WEEKLY"] = "WEEKLY";
    BillingPeriodType["MONTHLY"] = "MONTHLY";
    BillingPeriodType["QUARTERLY"] = "QUARTERLY";
    BillingPeriodType["YEARLY"] = "YEARLY";
    BillingPeriodType["CUSTOM"] = "CUSTOM";
})(BillingPeriodType || (exports.BillingPeriodType = BillingPeriodType = {}));
var TaxType;
(function (TaxType) {
    TaxType["VAT"] = "VAT";
    TaxType["GST"] = "GST";
    TaxType["SALES_TAX"] = "SALES_TAX";
    TaxType["EXCISE_TAX"] = "EXCISE_TAX";
    TaxType["CUSTOMS_DUTY"] = "CUSTOMS_DUTY";
})(TaxType || (exports.TaxType = TaxType = {}));
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["PAYMENT_INTENT_SUCCEEDED"] = "PAYMENT_INTENT_SUCCEEDED";
    WebhookEventType["PAYMENT_INTENT_PAYMENT_FAILED"] = "PAYMENT_INTENT_PAYMENT_FAILED";
    WebhookEventType["PAYMENT_INTENT_CANCELED"] = "PAYMENT_INTENT_CANCELED";
    WebhookEventType["PAYMENT_METHOD_ATTACHED"] = "PAYMENT_METHOD_ATTACHED";
    WebhookEventType["PAYMENT_METHOD_DETACHED"] = "PAYMENT_METHOD_DETACHED";
    WebhookEventType["INVOICE_PAYMENT_SUCCEEDED"] = "INVOICE_PAYMENT_SUCCEEDED";
    WebhookEventType["INVOICE_PAYMENT_FAILED"] = "INVOICE_PAYMENT_FAILED";
    WebhookEventType["INVOICE_FINALIZED"] = "INVOICE_FINALIZED";
    WebhookEventType["CUSTOMER_SUBSCRIPTION_CREATED"] = "CUSTOMER_SUBSCRIPTION_CREATED";
    WebhookEventType["CUSTOMER_SUBSCRIPTION_UPDATED"] = "CUSTOMER_SUBSCRIPTION_UPDATED";
    WebhookEventType["CUSTOMER_SUBSCRIPTION_DELETED"] = "CUSTOMER_SUBSCRIPTION_DELETED";
    WebhookEventType["CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END"] = "CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END";
    WebhookEventType["CHARGE_DISPUTE_CREATED"] = "CHARGE_DISPUTE_CREATED";
    WebhookEventType["CHARGE_DISPUTE_UPDATED"] = "CHARGE_DISPUTE_UPDATED";
    WebhookEventType["CHARGE_DISPUTE_CLOSED"] = "CHARGE_DISPUTE_CLOSED";
})(WebhookEventType || (exports.WebhookEventType = WebhookEventType = {}));
var Currency;
(function (Currency) {
    Currency["USD"] = "USD";
    Currency["THB"] = "THB";
    Currency["EUR"] = "EUR";
    Currency["GBP"] = "GBP";
    Currency["JPY"] = "JPY";
    Currency["CNY"] = "CNY";
    Currency["KRW"] = "KRW";
    Currency["AUD"] = "AUD";
    Currency["CAD"] = "CAD";
    Currency["SGD"] = "SGD";
})(Currency || (exports.Currency = Currency = {}));
var Region;
(function (Region) {
    Region["NORTH_AMERICA"] = "NORTH_AMERICA";
    Region["SOUTH_AMERICA"] = "SOUTH_AMERICA";
    Region["EUROPE"] = "EUROPE";
    Region["ASIA_PACIFIC"] = "ASIA_PACIFIC";
    Region["MIDDLE_EAST"] = "MIDDLE_EAST";
    Region["AFRICA"] = "AFRICA";
    Region["OCEANIA"] = "OCEANIA";
})(Region || (exports.Region = Region = {}));
//# sourceMappingURL=payment-processing.js.map