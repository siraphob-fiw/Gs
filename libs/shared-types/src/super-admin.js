"use strict";
// Super Admin Management Types
// Types for super admin functionality and platform-wide management
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkActionType = exports.BulkActionTargetType = exports.ApprovalSortField = exports.ApprovalQueueType = exports.UserSortField = exports.TenantSortField = exports.FindingStatus = exports.ComplianceCategory = exports.ComplianceSeverity = exports.ReportStatus = exports.ComplianceReportType = exports.MetricCategory = exports.AlertStatus = exports.AlertSource = exports.AlertSeverity = exports.AlertType = exports.SafetyRating = exports.ExerciseDifficulty = exports.ExerciseCategory = exports.TemplateDifficulty = exports.TemplateCategory = exports.ValidationType = exports.ConfigurationDataType = exports.ConfigurationCategory = exports.ApprovalStatus = exports.CoachApprovalType = exports.TenantManagementAction = exports.CoachManagementAction = void 0;
var CoachManagementAction;
(function (CoachManagementAction) {
    CoachManagementAction["APPROVE"] = "APPROVE";
    CoachManagementAction["SUSPEND"] = "SUSPEND";
    CoachManagementAction["REACTIVATE"] = "REACTIVATE";
    CoachManagementAction["DELETE"] = "DELETE";
    CoachManagementAction["CHANGE_TENANT"] = "CHANGE_TENANT";
    CoachManagementAction["UPDATE_LIMITS"] = "UPDATE_LIMITS";
})(CoachManagementAction || (exports.CoachManagementAction = CoachManagementAction = {}));
var TenantManagementAction;
(function (TenantManagementAction) {
    TenantManagementAction["SUSPEND"] = "SUSPEND";
    TenantManagementAction["REACTIVATE"] = "REACTIVATE";
    TenantManagementAction["DELETE"] = "DELETE";
    TenantManagementAction["UPGRADE_PLAN"] = "UPGRADE_PLAN";
    TenantManagementAction["DOWNGRADE_PLAN"] = "DOWNGRADE_PLAN";
    TenantManagementAction["EXTEND_TRIAL"] = "EXTEND_TRIAL";
    TenantManagementAction["FORCE_BILLING"] = "FORCE_BILLING";
})(TenantManagementAction || (exports.TenantManagementAction = TenantManagementAction = {}));
var CoachApprovalType;
(function (CoachApprovalType) {
    CoachApprovalType["NEW_COACH_REGISTRATION"] = "NEW_COACH_REGISTRATION";
    CoachApprovalType["PLAN_UPGRADE"] = "PLAN_UPGRADE";
    CoachApprovalType["FEATURE_ACCESS"] = "FEATURE_ACCESS";
    CoachApprovalType["TENANT_TRANSFER"] = "TENANT_TRANSFER";
})(CoachApprovalType || (exports.CoachApprovalType = CoachApprovalType = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "PENDING";
    ApprovalStatus["APPROVED"] = "APPROVED";
    ApprovalStatus["REJECTED"] = "REJECTED";
    ApprovalStatus["CANCELLED"] = "CANCELLED";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
var ConfigurationCategory;
(function (ConfigurationCategory) {
    ConfigurationCategory["AUTHENTICATION"] = "AUTHENTICATION";
    ConfigurationCategory["BILLING"] = "BILLING";
    ConfigurationCategory["FEATURES"] = "FEATURES";
    ConfigurationCategory["LIMITS"] = "LIMITS";
    ConfigurationCategory["NOTIFICATIONS"] = "NOTIFICATIONS";
    ConfigurationCategory["SECURITY"] = "SECURITY";
    ConfigurationCategory["INTEGRATIONS"] = "INTEGRATIONS";
    ConfigurationCategory["PERFORMANCE"] = "PERFORMANCE";
})(ConfigurationCategory || (exports.ConfigurationCategory = ConfigurationCategory = {}));
var ConfigurationDataType;
(function (ConfigurationDataType) {
    ConfigurationDataType["STRING"] = "STRING";
    ConfigurationDataType["NUMBER"] = "NUMBER";
    ConfigurationDataType["BOOLEAN"] = "BOOLEAN";
    ConfigurationDataType["JSON"] = "JSON";
    ConfigurationDataType["ARRAY"] = "ARRAY";
})(ConfigurationDataType || (exports.ConfigurationDataType = ConfigurationDataType = {}));
var ValidationType;
(function (ValidationType) {
    ValidationType["REQUIRED"] = "REQUIRED";
    ValidationType["MIN_LENGTH"] = "MIN_LENGTH";
    ValidationType["MAX_LENGTH"] = "MAX_LENGTH";
    ValidationType["MIN_VALUE"] = "MIN_VALUE";
    ValidationType["MAX_VALUE"] = "MAX_VALUE";
    ValidationType["PATTERN"] = "PATTERN";
    ValidationType["ENUM"] = "ENUM";
})(ValidationType || (exports.ValidationType = ValidationType = {}));
var TemplateCategory;
(function (TemplateCategory) {
    TemplateCategory["POWERLIFTING"] = "POWERLIFTING";
    TemplateCategory["WEIGHTLIFTING"] = "WEIGHTLIFTING";
    TemplateCategory["BODYBUILDING"] = "BODYBUILDING";
    TemplateCategory["STRONGMAN"] = "STRONGMAN";
    TemplateCategory["GENERAL_FITNESS"] = "GENERAL_FITNESS";
    TemplateCategory["REHABILITATION"] = "REHABILITATION";
    TemplateCategory["SPORT_SPECIFIC"] = "SPORT_SPECIFIC";
})(TemplateCategory || (exports.TemplateCategory = TemplateCategory = {}));
var TemplateDifficulty;
(function (TemplateDifficulty) {
    TemplateDifficulty["BEGINNER"] = "BEGINNER";
    TemplateDifficulty["INTERMEDIATE"] = "INTERMEDIATE";
    TemplateDifficulty["ADVANCED"] = "ADVANCED";
    TemplateDifficulty["EXPERT"] = "EXPERT";
})(TemplateDifficulty || (exports.TemplateDifficulty = TemplateDifficulty = {}));
var ExerciseCategory;
(function (ExerciseCategory) {
    ExerciseCategory["COMPOUND"] = "COMPOUND";
    ExerciseCategory["ISOLATION"] = "ISOLATION";
    ExerciseCategory["CARDIO"] = "CARDIO";
    ExerciseCategory["MOBILITY"] = "MOBILITY";
    ExerciseCategory["PLYOMETRIC"] = "PLYOMETRIC";
    ExerciseCategory["ISOMETRIC"] = "ISOMETRIC";
})(ExerciseCategory || (exports.ExerciseCategory = ExerciseCategory = {}));
var ExerciseDifficulty;
(function (ExerciseDifficulty) {
    ExerciseDifficulty["BEGINNER"] = "BEGINNER";
    ExerciseDifficulty["INTERMEDIATE"] = "INTERMEDIATE";
    ExerciseDifficulty["ADVANCED"] = "ADVANCED";
})(ExerciseDifficulty || (exports.ExerciseDifficulty = ExerciseDifficulty = {}));
var SafetyRating;
(function (SafetyRating) {
    SafetyRating["LOW_RISK"] = "LOW_RISK";
    SafetyRating["MODERATE_RISK"] = "MODERATE_RISK";
    SafetyRating["HIGH_RISK"] = "HIGH_RISK";
    SafetyRating["REQUIRES_SUPERVISION"] = "REQUIRES_SUPERVISION";
})(SafetyRating || (exports.SafetyRating = SafetyRating = {}));
var AlertType;
(function (AlertType) {
    AlertType["SYSTEM_ERROR"] = "SYSTEM_ERROR";
    AlertType["PERFORMANCE_DEGRADATION"] = "PERFORMANCE_DEGRADATION";
    AlertType["SECURITY_INCIDENT"] = "SECURITY_INCIDENT";
    AlertType["BILLING_ISSUE"] = "BILLING_ISSUE";
    AlertType["USER_ACTIVITY"] = "USER_ACTIVITY";
    AlertType["RESOURCE_LIMIT"] = "RESOURCE_LIMIT";
    AlertType["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "LOW";
    AlertSeverity["MEDIUM"] = "MEDIUM";
    AlertSeverity["HIGH"] = "HIGH";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertSource;
(function (AlertSource) {
    AlertSource["APPLICATION"] = "APPLICATION";
    AlertSource["DATABASE"] = "DATABASE";
    AlertSource["CACHE"] = "CACHE";
    AlertSource["EXTERNAL_API"] = "EXTERNAL_API";
    AlertSource["MONITORING"] = "MONITORING";
    AlertSource["SECURITY"] = "SECURITY";
})(AlertSource || (exports.AlertSource = AlertSource = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "ACTIVE";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    AlertStatus["RESOLVED"] = "RESOLVED";
    AlertStatus["SUPPRESSED"] = "SUPPRESSED";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var MetricCategory;
(function (MetricCategory) {
    MetricCategory["PERFORMANCE"] = "PERFORMANCE";
    MetricCategory["USAGE"] = "USAGE";
    MetricCategory["ERROR"] = "ERROR";
    MetricCategory["BUSINESS"] = "BUSINESS";
    MetricCategory["SECURITY"] = "SECURITY";
})(MetricCategory || (exports.MetricCategory = MetricCategory = {}));
var ComplianceReportType;
(function (ComplianceReportType) {
    ComplianceReportType["GDPR_COMPLIANCE"] = "GDPR_COMPLIANCE";
    ComplianceReportType["PDPA_COMPLIANCE"] = "PDPA_COMPLIANCE";
    ComplianceReportType["HIPAA_COMPLIANCE"] = "HIPAA_COMPLIANCE";
    ComplianceReportType["SECURITY_AUDIT"] = "SECURITY_AUDIT";
    ComplianceReportType["DATA_RETENTION"] = "DATA_RETENTION";
    ComplianceReportType["ACCESS_REVIEW"] = "ACCESS_REVIEW";
})(ComplianceReportType || (exports.ComplianceReportType = ComplianceReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["GENERATING"] = "GENERATING";
    ReportStatus["COMPLETED"] = "COMPLETED";
    ReportStatus["FAILED"] = "FAILED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ComplianceSeverity;
(function (ComplianceSeverity) {
    ComplianceSeverity["INFO"] = "INFO";
    ComplianceSeverity["LOW"] = "LOW";
    ComplianceSeverity["MEDIUM"] = "MEDIUM";
    ComplianceSeverity["HIGH"] = "HIGH";
    ComplianceSeverity["CRITICAL"] = "CRITICAL";
})(ComplianceSeverity || (exports.ComplianceSeverity = ComplianceSeverity = {}));
var ComplianceCategory;
(function (ComplianceCategory) {
    ComplianceCategory["DATA_PROTECTION"] = "DATA_PROTECTION";
    ComplianceCategory["ACCESS_CONTROL"] = "ACCESS_CONTROL";
    ComplianceCategory["AUDIT_LOGGING"] = "AUDIT_LOGGING";
    ComplianceCategory["ENCRYPTION"] = "ENCRYPTION";
    ComplianceCategory["RETENTION"] = "RETENTION";
    ComplianceCategory["CONSENT"] = "CONSENT";
})(ComplianceCategory || (exports.ComplianceCategory = ComplianceCategory = {}));
var FindingStatus;
(function (FindingStatus) {
    FindingStatus["OPEN"] = "OPEN";
    FindingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    FindingStatus["RESOLVED"] = "RESOLVED";
    FindingStatus["ACCEPTED_RISK"] = "ACCEPTED_RISK";
})(FindingStatus || (exports.FindingStatus = FindingStatus = {}));
var TenantSortField;
(function (TenantSortField) {
    TenantSortField["NAME"] = "NAME";
    TenantSortField["CREATED_AT"] = "CREATED_AT";
    TenantSortField["USER_COUNT"] = "USER_COUNT";
    TenantSortField["REVENUE"] = "REVENUE";
    TenantSortField["LAST_ACTIVITY"] = "LAST_ACTIVITY";
})(TenantSortField || (exports.TenantSortField = TenantSortField = {}));
var UserSortField;
(function (UserSortField) {
    UserSortField["EMAIL"] = "EMAIL";
    UserSortField["CREATED_AT"] = "CREATED_AT";
    UserSortField["LAST_LOGIN"] = "LAST_LOGIN";
    UserSortField["ROLE"] = "ROLE";
    UserSortField["STATUS"] = "STATUS";
})(UserSortField || (exports.UserSortField = UserSortField = {}));
var ApprovalQueueType;
(function (ApprovalQueueType) {
    ApprovalQueueType["COACHES"] = "COACHES";
    ApprovalQueueType["TEMPLATES"] = "TEMPLATES";
    ApprovalQueueType["EXERCISES"] = "EXERCISES";
})(ApprovalQueueType || (exports.ApprovalQueueType = ApprovalQueueType = {}));
var ApprovalSortField;
(function (ApprovalSortField) {
    ApprovalSortField["SUBMITTED_AT"] = "SUBMITTED_AT";
    ApprovalSortField["PRIORITY"] = "PRIORITY";
    ApprovalSortField["TYPE"] = "TYPE";
})(ApprovalSortField || (exports.ApprovalSortField = ApprovalSortField = {}));
var BulkActionTargetType;
(function (BulkActionTargetType) {
    BulkActionTargetType["USERS"] = "USERS";
    BulkActionTargetType["TENANTS"] = "TENANTS";
    BulkActionTargetType["APPROVALS"] = "APPROVALS";
})(BulkActionTargetType || (exports.BulkActionTargetType = BulkActionTargetType = {}));
var BulkActionType;
(function (BulkActionType) {
    BulkActionType["APPROVE"] = "APPROVE";
    BulkActionType["REJECT"] = "REJECT";
    BulkActionType["SUSPEND"] = "SUSPEND";
    BulkActionType["REACTIVATE"] = "REACTIVATE";
    BulkActionType["DELETE"] = "DELETE";
    BulkActionType["UPDATE_STATUS"] = "UPDATE_STATUS";
})(BulkActionType || (exports.BulkActionType = BulkActionType = {}));
//# sourceMappingURL=super-admin.js.map