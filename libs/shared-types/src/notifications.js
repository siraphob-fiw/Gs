"use strict";
// Notification System Types
// Comprehensive notification management for user events, transitions, and communications
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationErrorCode = exports.AnalyticsGranularity = exports.TemplateVariableType = exports.PushPlatform = exports.NotificationDeliveryStatus = exports.NotificationChannelStatus = exports.NotificationChannelType = exports.TransitionType = exports.UserRole = exports.PriorityLevel = exports.NotificationFrequency = exports.NotificationStatus = exports.NotificationType = exports.SupportedLanguage = void 0;
// Re-export for convenience
var user_management_enums_1 = require("./user-management-enums");
Object.defineProperty(exports, "SupportedLanguage", { enumerable: true, get: function () { return user_management_enums_1.SupportedLanguage; } });
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return user_management_enums_1.NotificationType; } });
Object.defineProperty(exports, "NotificationStatus", { enumerable: true, get: function () { return user_management_enums_1.NotificationStatus; } });
Object.defineProperty(exports, "NotificationFrequency", { enumerable: true, get: function () { return user_management_enums_1.NotificationFrequency; } });
Object.defineProperty(exports, "PriorityLevel", { enumerable: true, get: function () { return user_management_enums_1.PriorityLevel; } });
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return user_management_enums_1.UserRole; } });
Object.defineProperty(exports, "TransitionType", { enumerable: true, get: function () { return user_management_enums_1.TransitionType; } });
// ============================================================================
// ENUMS
// ============================================================================
var NotificationChannelType;
(function (NotificationChannelType) {
    NotificationChannelType["EMAIL"] = "EMAIL";
    NotificationChannelType["PUSH"] = "PUSH";
    NotificationChannelType["SMS"] = "SMS";
    NotificationChannelType["IN_APP"] = "IN_APP";
    NotificationChannelType["WEBHOOK"] = "WEBHOOK";
})(NotificationChannelType || (exports.NotificationChannelType = NotificationChannelType = {}));
var NotificationChannelStatus;
(function (NotificationChannelStatus) {
    NotificationChannelStatus["PENDING"] = "PENDING";
    NotificationChannelStatus["SENT"] = "SENT";
    NotificationChannelStatus["DELIVERED"] = "DELIVERED";
    NotificationChannelStatus["FAILED"] = "FAILED";
    NotificationChannelStatus["BOUNCED"] = "BOUNCED";
    NotificationChannelStatus["UNSUBSCRIBED"] = "UNSUBSCRIBED";
})(NotificationChannelStatus || (exports.NotificationChannelStatus = NotificationChannelStatus = {}));
var NotificationDeliveryStatus;
(function (NotificationDeliveryStatus) {
    NotificationDeliveryStatus["SUCCESS"] = "SUCCESS";
    NotificationDeliveryStatus["PARTIAL_SUCCESS"] = "PARTIAL_SUCCESS";
    NotificationDeliveryStatus["FAILED"] = "FAILED";
    NotificationDeliveryStatus["PENDING"] = "PENDING";
})(NotificationDeliveryStatus || (exports.NotificationDeliveryStatus = NotificationDeliveryStatus = {}));
var PushPlatform;
(function (PushPlatform) {
    PushPlatform["IOS"] = "IOS";
    PushPlatform["ANDROID"] = "ANDROID";
    PushPlatform["WEB"] = "WEB";
})(PushPlatform || (exports.PushPlatform = PushPlatform = {}));
var TemplateVariableType;
(function (TemplateVariableType) {
    TemplateVariableType["STRING"] = "STRING";
    TemplateVariableType["NUMBER"] = "NUMBER";
    TemplateVariableType["DATE"] = "DATE";
    TemplateVariableType["BOOLEAN"] = "BOOLEAN";
    TemplateVariableType["URL"] = "URL";
    TemplateVariableType["EMAIL"] = "EMAIL";
})(TemplateVariableType || (exports.TemplateVariableType = TemplateVariableType = {}));
var AnalyticsGranularity;
(function (AnalyticsGranularity) {
    AnalyticsGranularity["HOUR"] = "HOUR";
    AnalyticsGranularity["DAY"] = "DAY";
    AnalyticsGranularity["WEEK"] = "WEEK";
    AnalyticsGranularity["MONTH"] = "MONTH";
})(AnalyticsGranularity || (exports.AnalyticsGranularity = AnalyticsGranularity = {}));
var NotificationErrorCode;
(function (NotificationErrorCode) {
    NotificationErrorCode["INVALID_RECIPIENT"] = "INVALID_RECIPIENT";
    NotificationErrorCode["TEMPLATE_NOT_FOUND"] = "TEMPLATE_NOT_FOUND";
    NotificationErrorCode["CHANNEL_UNAVAILABLE"] = "CHANNEL_UNAVAILABLE";
    NotificationErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    NotificationErrorCode["CONTENT_TOO_LARGE"] = "CONTENT_TOO_LARGE";
    NotificationErrorCode["INVALID_TEMPLATE_VARIABLES"] = "INVALID_TEMPLATE_VARIABLES";
    NotificationErrorCode["DELIVERY_FAILED"] = "DELIVERY_FAILED";
    NotificationErrorCode["UNSUBSCRIBED"] = "UNSUBSCRIBED";
    NotificationErrorCode["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    NotificationErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
})(NotificationErrorCode || (exports.NotificationErrorCode = NotificationErrorCode = {}));
//# sourceMappingURL=notifications.js.map