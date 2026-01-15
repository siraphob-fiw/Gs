"use strict";
// Audit and Compliance Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRetentionPeriod = exports.FindingStatus = exports.ComplianceStatus = exports.ComplianceFramework = exports.DataCategory = exports.AuditSeverity = exports.AuditEventType = void 0;
// Audit Enums
var AuditEventType;
(function (AuditEventType) {
    AuditEventType["USER_CREATED"] = "USER_CREATED";
    AuditEventType["USER_UPDATED"] = "USER_UPDATED";
    AuditEventType["USER_DELETED"] = "USER_DELETED";
    AuditEventType["LOGIN"] = "LOGIN";
    AuditEventType["LOGOUT"] = "LOGOUT";
    AuditEventType["PERMISSION_GRANTED"] = "PERMISSION_GRANTED";
    AuditEventType["PERMISSION_REVOKED"] = "PERMISSION_REVOKED";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "LOW";
    AuditSeverity["MEDIUM"] = "MEDIUM";
    AuditSeverity["HIGH"] = "HIGH";
    AuditSeverity["CRITICAL"] = "CRITICAL";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
var DataCategory;
(function (DataCategory) {
    DataCategory["PERSONAL"] = "PERSONAL";
    DataCategory["SENSITIVE"] = "SENSITIVE";
    DataCategory["FINANCIAL"] = "FINANCIAL";
    DataCategory["HEALTH"] = "HEALTH";
    DataCategory["SYSTEM"] = "SYSTEM";
})(DataCategory || (exports.DataCategory = DataCategory = {}));
var ComplianceFramework;
(function (ComplianceFramework) {
    ComplianceFramework["GDPR"] = "GDPR";
    ComplianceFramework["PDPA"] = "PDPA";
    ComplianceFramework["HIPAA"] = "HIPAA";
    ComplianceFramework["SOX"] = "SOX";
    ComplianceFramework["PCI_DSS"] = "PCI_DSS";
})(ComplianceFramework || (exports.ComplianceFramework = ComplianceFramework = {}));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "COMPLIANT";
    ComplianceStatus["NON_COMPLIANT"] = "NON_COMPLIANT";
    ComplianceStatus["PARTIALLY_COMPLIANT"] = "PARTIALLY_COMPLIANT";
    ComplianceStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
var FindingStatus;
(function (FindingStatus) {
    FindingStatus["OPEN"] = "OPEN";
    FindingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    FindingStatus["RESOLVED"] = "RESOLVED";
    FindingStatus["ACCEPTED_RISK"] = "ACCEPTED_RISK";
})(FindingStatus || (exports.FindingStatus = FindingStatus = {}));
var DataRetentionPeriod;
(function (DataRetentionPeriod) {
    DataRetentionPeriod["DAYS_30"] = "DAYS_30";
    DataRetentionPeriod["DAYS_90"] = "DAYS_90";
    DataRetentionPeriod["MONTHS_6"] = "MONTHS_6";
    DataRetentionPeriod["YEAR_1"] = "YEAR_1";
    DataRetentionPeriod["YEARS_7"] = "YEARS_7";
    DataRetentionPeriod["INDEFINITE"] = "INDEFINITE";
})(DataRetentionPeriod || (exports.DataRetentionPeriod = DataRetentionPeriod = {}));
//# sourceMappingURL=audit-types.js.map