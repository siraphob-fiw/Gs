"use strict";
// Notification and Communication Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushPlatform = exports.NotificationErrorCode = exports.NotificationChannelType = exports.TemplateVariableType = exports.SupportedLanguage = exports.NotificationChannelEnum = exports.TransitionNotificationType = exports.PriorityLevel = exports.NotificationStatus = void 0;
// Notification Enums
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "PENDING";
    NotificationStatus["SENT"] = "SENT";
    NotificationStatus["DELIVERED"] = "DELIVERED";
    NotificationStatus["READ"] = "READ";
    NotificationStatus["FAILED"] = "FAILED";
    NotificationStatus["EXPIRED"] = "EXPIRED";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var PriorityLevel;
(function (PriorityLevel) {
    PriorityLevel["LOW"] = "LOW";
    PriorityLevel["NORMAL"] = "NORMAL";
    PriorityLevel["HIGH"] = "HIGH";
    PriorityLevel["URGENT"] = "URGENT";
})(PriorityLevel || (exports.PriorityLevel = PriorityLevel = {}));
var TransitionNotificationType;
(function (TransitionNotificationType) {
    TransitionNotificationType["TRANSITION_REQUESTED"] = "TRANSITION_REQUESTED";
    TransitionNotificationType["TRANSITION_APPROVED"] = "TRANSITION_APPROVED";
    TransitionNotificationType["TRANSITION_REJECTED"] = "TRANSITION_REJECTED";
    TransitionNotificationType["TRANSITION_COMPLETED"] = "TRANSITION_COMPLETED";
})(TransitionNotificationType || (exports.TransitionNotificationType = TransitionNotificationType = {}));
var NotificationChannelEnum;
(function (NotificationChannelEnum) {
    NotificationChannelEnum["EMAIL"] = "EMAIL";
    NotificationChannelEnum["SMS"] = "SMS";
    NotificationChannelEnum["SLACK"] = "SLACK";
    NotificationChannelEnum["WEBHOOK"] = "WEBHOOK";
    NotificationChannelEnum["IN_APP"] = "IN_APP";
})(NotificationChannelEnum || (exports.NotificationChannelEnum = NotificationChannelEnum = {}));
var SupportedLanguage;
(function (SupportedLanguage) {
    SupportedLanguage["EN"] = "EN";
    SupportedLanguage["TH"] = "TH";
    SupportedLanguage["ZH"] = "ZH";
    SupportedLanguage["ES"] = "ES";
    SupportedLanguage["FR"] = "FR";
})(SupportedLanguage || (exports.SupportedLanguage = SupportedLanguage = {}));
var TemplateVariableType;
(function (TemplateVariableType) {
    TemplateVariableType["STRING"] = "STRING";
    TemplateVariableType["NUMBER"] = "NUMBER";
    TemplateVariableType["DATE"] = "DATE";
    TemplateVariableType["BOOLEAN"] = "BOOLEAN";
    TemplateVariableType["OBJECT"] = "OBJECT";
    TemplateVariableType["URL"] = "URL";
    TemplateVariableType["EMAIL"] = "EMAIL";
})(TemplateVariableType || (exports.TemplateVariableType = TemplateVariableType = {}));
var NotificationChannelType;
(function (NotificationChannelType) {
    NotificationChannelType["EMAIL"] = "EMAIL";
    NotificationChannelType["SMS"] = "SMS";
    NotificationChannelType["PUSH"] = "PUSH";
    NotificationChannelType["IN_APP"] = "IN_APP";
    NotificationChannelType["WEBHOOK"] = "WEBHOOK";
})(NotificationChannelType || (exports.NotificationChannelType = NotificationChannelType = {}));
var NotificationErrorCode;
(function (NotificationErrorCode) {
    NotificationErrorCode["INVALID_RECIPIENT"] = "INVALID_RECIPIENT";
    NotificationErrorCode["CONTENT_TOO_LARGE"] = "CONTENT_TOO_LARGE";
    NotificationErrorCode["DELIVERY_FAILED"] = "DELIVERY_FAILED";
    NotificationErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    NotificationErrorCode["CHANNEL_UNAVAILABLE"] = "CHANNEL_UNAVAILABLE";
    NotificationErrorCode["RATE_LIMITED"] = "RATE_LIMITED";
    NotificationErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
})(NotificationErrorCode || (exports.NotificationErrorCode = NotificationErrorCode = {}));
var PushPlatform;
(function (PushPlatform) {
    PushPlatform["IOS"] = "IOS";
    PushPlatform["ANDROID"] = "ANDROID";
    PushPlatform["WEB"] = "WEB";
})(PushPlatform || (exports.PushPlatform = PushPlatform = {}));
//# sourceMappingURL=notification-types.js.map