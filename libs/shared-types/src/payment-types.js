"use strict";
// Payment and Billing Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.ExportFormat = exports.UsageMetricType = exports.BillingPeriod = void 0;
// Payment Enums
var BillingPeriod;
(function (BillingPeriod) {
    BillingPeriod["MONTHLY"] = "MONTHLY";
    BillingPeriod["QUARTERLY"] = "QUARTERLY";
    BillingPeriod["YEARLY"] = "YEARLY";
})(BillingPeriod || (exports.BillingPeriod = BillingPeriod = {}));
var UsageMetricType;
(function (UsageMetricType) {
    UsageMetricType["ACTIVE_USERS"] = "ACTIVE_USERS";
    UsageMetricType["ACTIVE_COACHES"] = "ACTIVE_COACHES";
    UsageMetricType["STORAGE_USED"] = "STORAGE_USED";
    UsageMetricType["API_CALLS"] = "API_CALLS";
    UsageMetricType["NOTIFICATIONS_SENT"] = "NOTIFICATIONS_SENT";
})(UsageMetricType || (exports.UsageMetricType = UsageMetricType = {}));
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["JSON"] = "JSON";
    ExportFormat["CSV"] = "CSV";
    ExportFormat["XML"] = "XML";
    ExportFormat["PDF"] = "PDF";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
// Subscription interface (moved from shared-types.ts)
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["INACTIVE"] = "INACTIVE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["TRIAL"] = "TRIAL";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
//# sourceMappingURL=payment-types.js.map