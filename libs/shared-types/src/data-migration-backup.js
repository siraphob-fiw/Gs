"use strict";
// Data Migration and Backup Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpactLevel = exports.PlanStatus = exports.RecommendationCategory = exports.RecommendationPriority = exports.RiskLevel = exports.IntegrityScope = exports.ReportStatus = exports.IntegrityReportType = exports.CheckStatus = exports.IntegrityCheckType = exports.ArchiveStatus = exports.ArchiveType = exports.RestoreErrorType = exports.RestoreStatus = exports.RestoreType = exports.VerificationStatus = exports.StorageProvider = exports.CompressionType = exports.BackupFormat = exports.BackupStatus = exports.BackupScope = exports.BackupType = exports.RollbackOperation = exports.MigrationErrorType = exports.MigrationStatus = exports.MigrationType = void 0;
// Enums
var MigrationType;
(function (MigrationType) {
    MigrationType["SCHEMA_MIGRATION"] = "SCHEMA_MIGRATION";
    MigrationType["DATA_MIGRATION"] = "DATA_MIGRATION";
    MigrationType["TENANT_MIGRATION"] = "TENANT_MIGRATION";
    MigrationType["USER_MIGRATION"] = "USER_MIGRATION";
    MigrationType["FULL_MIGRATION"] = "FULL_MIGRATION";
    MigrationType["INCREMENTAL_MIGRATION"] = "INCREMENTAL_MIGRATION";
})(MigrationType || (exports.MigrationType = MigrationType = {}));
var MigrationStatus;
(function (MigrationStatus) {
    MigrationStatus["PENDING"] = "PENDING";
    MigrationStatus["RUNNING"] = "RUNNING";
    MigrationStatus["PAUSED"] = "PAUSED";
    MigrationStatus["COMPLETED"] = "COMPLETED";
    MigrationStatus["FAILED"] = "FAILED";
    MigrationStatus["CANCELLED"] = "CANCELLED";
    MigrationStatus["ROLLED_BACK"] = "ROLLED_BACK";
})(MigrationStatus || (exports.MigrationStatus = MigrationStatus = {}));
var MigrationErrorType;
(function (MigrationErrorType) {
    MigrationErrorType["SCHEMA_ERROR"] = "SCHEMA_ERROR";
    MigrationErrorType["DATA_ERROR"] = "DATA_ERROR";
    MigrationErrorType["CONSTRAINT_VIOLATION"] = "CONSTRAINT_VIOLATION";
    MigrationErrorType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    MigrationErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    MigrationErrorType["PERMISSION_ERROR"] = "PERMISSION_ERROR";
    MigrationErrorType["RESOURCE_ERROR"] = "RESOURCE_ERROR";
    MigrationErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
})(MigrationErrorType || (exports.MigrationErrorType = MigrationErrorType = {}));
var RollbackOperation;
(function (RollbackOperation) {
    RollbackOperation["INSERT"] = "INSERT";
    RollbackOperation["UPDATE"] = "UPDATE";
    RollbackOperation["DELETE"] = "DELETE";
    RollbackOperation["CREATE_TABLE"] = "CREATE_TABLE";
    RollbackOperation["DROP_TABLE"] = "DROP_TABLE";
    RollbackOperation["ALTER_TABLE"] = "ALTER_TABLE";
    RollbackOperation["CREATE_INDEX"] = "CREATE_INDEX";
    RollbackOperation["DROP_INDEX"] = "DROP_INDEX";
})(RollbackOperation || (exports.RollbackOperation = RollbackOperation = {}));
var BackupType;
(function (BackupType) {
    BackupType["FULL_BACKUP"] = "FULL_BACKUP";
    BackupType["INCREMENTAL_BACKUP"] = "INCREMENTAL_BACKUP";
    BackupType["DIFFERENTIAL_BACKUP"] = "DIFFERENTIAL_BACKUP";
    BackupType["TENANT_BACKUP"] = "TENANT_BACKUP";
    BackupType["USER_BACKUP"] = "USER_BACKUP";
    BackupType["COMPLIANCE_BACKUP"] = "COMPLIANCE_BACKUP";
})(BackupType || (exports.BackupType = BackupType = {}));
var BackupScope;
(function (BackupScope) {
    BackupScope["FULL_DATABASE"] = "FULL_DATABASE";
    BackupScope["TENANT_DATA"] = "TENANT_DATA";
    BackupScope["USER_DATA"] = "USER_DATA";
    BackupScope["AUDIT_DATA"] = "AUDIT_DATA";
    BackupScope["CONFIGURATION_DATA"] = "CONFIGURATION_DATA";
    BackupScope["CUSTOM_SCOPE"] = "CUSTOM_SCOPE";
})(BackupScope || (exports.BackupScope = BackupScope = {}));
var BackupStatus;
(function (BackupStatus) {
    BackupStatus["SCHEDULED"] = "SCHEDULED";
    BackupStatus["RUNNING"] = "RUNNING";
    BackupStatus["COMPLETED"] = "COMPLETED";
    BackupStatus["FAILED"] = "FAILED";
    BackupStatus["CANCELLED"] = "CANCELLED";
    BackupStatus["EXPIRED"] = "EXPIRED";
    BackupStatus["ARCHIVED"] = "ARCHIVED";
})(BackupStatus || (exports.BackupStatus = BackupStatus = {}));
var BackupFormat;
(function (BackupFormat) {
    BackupFormat["SQL_DUMP"] = "SQL_DUMP";
    BackupFormat["BINARY"] = "BINARY";
    BackupFormat["JSON"] = "JSON";
    BackupFormat["CSV"] = "CSV";
    BackupFormat["PARQUET"] = "PARQUET";
    BackupFormat["CUSTOM"] = "CUSTOM";
})(BackupFormat || (exports.BackupFormat = BackupFormat = {}));
var CompressionType;
(function (CompressionType) {
    CompressionType["NONE"] = "NONE";
    CompressionType["GZIP"] = "GZIP";
    CompressionType["BZIP2"] = "BZIP2";
    CompressionType["LZ4"] = "LZ4";
    CompressionType["ZSTD"] = "ZSTD";
})(CompressionType || (exports.CompressionType = CompressionType = {}));
var StorageProvider;
(function (StorageProvider) {
    StorageProvider["LOCAL"] = "LOCAL";
    StorageProvider["AWS_S3"] = "AWS_S3";
    StorageProvider["AZURE_BLOB"] = "AZURE_BLOB";
    StorageProvider["GOOGLE_CLOUD"] = "GOOGLE_CLOUD";
    StorageProvider["MINIO"] = "MINIO";
    StorageProvider["CUSTOM"] = "CUSTOM";
})(StorageProvider || (exports.StorageProvider = StorageProvider = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["FAILED"] = "FAILED";
    VerificationStatus["SKIPPED"] = "SKIPPED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var RestoreType;
(function (RestoreType) {
    RestoreType["FULL_RESTORE"] = "FULL_RESTORE";
    RestoreType["PARTIAL_RESTORE"] = "PARTIAL_RESTORE";
    RestoreType["POINT_IN_TIME_RESTORE"] = "POINT_IN_TIME_RESTORE";
    RestoreType["TABLE_RESTORE"] = "TABLE_RESTORE";
    RestoreType["TENANT_RESTORE"] = "TENANT_RESTORE";
    RestoreType["USER_RESTORE"] = "USER_RESTORE";
})(RestoreType || (exports.RestoreType = RestoreType = {}));
var RestoreStatus;
(function (RestoreStatus) {
    RestoreStatus["PENDING"] = "PENDING";
    RestoreStatus["RUNNING"] = "RUNNING";
    RestoreStatus["COMPLETED"] = "COMPLETED";
    RestoreStatus["FAILED"] = "FAILED";
    RestoreStatus["CANCELLED"] = "CANCELLED";
    RestoreStatus["PARTIALLY_COMPLETED"] = "PARTIALLY_COMPLETED";
})(RestoreStatus || (exports.RestoreStatus = RestoreStatus = {}));
var RestoreErrorType;
(function (RestoreErrorType) {
    RestoreErrorType["BACKUP_NOT_FOUND"] = "BACKUP_NOT_FOUND";
    RestoreErrorType["CORRUPTION_ERROR"] = "CORRUPTION_ERROR";
    RestoreErrorType["SCHEMA_MISMATCH"] = "SCHEMA_MISMATCH";
    RestoreErrorType["CONSTRAINT_VIOLATION"] = "CONSTRAINT_VIOLATION";
    RestoreErrorType["PERMISSION_ERROR"] = "PERMISSION_ERROR";
    RestoreErrorType["STORAGE_ERROR"] = "STORAGE_ERROR";
    RestoreErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
})(RestoreErrorType || (exports.RestoreErrorType = RestoreErrorType = {}));
var ArchiveType;
(function (ArchiveType) {
    ArchiveType["DATA_ARCHIVE"] = "DATA_ARCHIVE";
    ArchiveType["COMPLIANCE_ARCHIVE"] = "COMPLIANCE_ARCHIVE";
    ArchiveType["AUDIT_ARCHIVE"] = "AUDIT_ARCHIVE";
    ArchiveType["USER_ARCHIVE"] = "USER_ARCHIVE";
    ArchiveType["TENANT_ARCHIVE"] = "TENANT_ARCHIVE";
})(ArchiveType || (exports.ArchiveType = ArchiveType = {}));
var ArchiveStatus;
(function (ArchiveStatus) {
    ArchiveStatus["PENDING"] = "PENDING";
    ArchiveStatus["RUNNING"] = "RUNNING";
    ArchiveStatus["COMPLETED"] = "COMPLETED";
    ArchiveStatus["FAILED"] = "FAILED";
    ArchiveStatus["CANCELLED"] = "CANCELLED";
})(ArchiveStatus || (exports.ArchiveStatus = ArchiveStatus = {}));
var IntegrityCheckType;
(function (IntegrityCheckType) {
    IntegrityCheckType["CHECKSUM"] = "CHECKSUM";
    IntegrityCheckType["ROW_COUNT"] = "ROW_COUNT";
    IntegrityCheckType["REFERENTIAL_INTEGRITY"] = "REFERENTIAL_INTEGRITY";
    IntegrityCheckType["DATA_TYPE_VALIDATION"] = "DATA_TYPE_VALIDATION";
    IntegrityCheckType["CONSTRAINT_VALIDATION"] = "CONSTRAINT_VALIDATION";
    IntegrityCheckType["CUSTOM_VALIDATION"] = "CUSTOM_VALIDATION";
})(IntegrityCheckType || (exports.IntegrityCheckType = IntegrityCheckType = {}));
var CheckStatus;
(function (CheckStatus) {
    CheckStatus["PENDING"] = "PENDING";
    CheckStatus["RUNNING"] = "RUNNING";
    CheckStatus["PASSED"] = "PASSED";
    CheckStatus["FAILED"] = "FAILED";
    CheckStatus["WARNING"] = "WARNING";
    CheckStatus["SKIPPED"] = "SKIPPED";
})(CheckStatus || (exports.CheckStatus = CheckStatus = {}));
var IntegrityReportType;
(function (IntegrityReportType) {
    IntegrityReportType["FULL_INTEGRITY_CHECK"] = "FULL_INTEGRITY_CHECK";
    IntegrityReportType["TENANT_INTEGRITY_CHECK"] = "TENANT_INTEGRITY_CHECK";
    IntegrityReportType["USER_INTEGRITY_CHECK"] = "USER_INTEGRITY_CHECK";
    IntegrityReportType["POST_MIGRATION_CHECK"] = "POST_MIGRATION_CHECK";
    IntegrityReportType["POST_RESTORE_CHECK"] = "POST_RESTORE_CHECK";
    IntegrityReportType["SCHEDULED_CHECK"] = "SCHEDULED_CHECK";
})(IntegrityReportType || (exports.IntegrityReportType = IntegrityReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["GENERATING"] = "GENERATING";
    ReportStatus["COMPLETED"] = "COMPLETED";
    ReportStatus["FAILED"] = "FAILED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var IntegrityScope;
(function (IntegrityScope) {
    IntegrityScope["FULL_DATABASE"] = "FULL_DATABASE";
    IntegrityScope["TENANT_DATA"] = "TENANT_DATA";
    IntegrityScope["USER_DATA"] = "USER_DATA";
    IntegrityScope["SPECIFIC_TABLES"] = "SPECIFIC_TABLES";
})(IntegrityScope || (exports.IntegrityScope = IntegrityScope = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["LOW"] = "LOW";
    RecommendationPriority["MEDIUM"] = "MEDIUM";
    RecommendationPriority["HIGH"] = "HIGH";
    RecommendationPriority["CRITICAL"] = "CRITICAL";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
var RecommendationCategory;
(function (RecommendationCategory) {
    RecommendationCategory["PERFORMANCE"] = "PERFORMANCE";
    RecommendationCategory["SECURITY"] = "SECURITY";
    RecommendationCategory["DATA_INTEGRITY"] = "DATA_INTEGRITY";
    RecommendationCategory["COMPLIANCE"] = "COMPLIANCE";
    RecommendationCategory["MAINTENANCE"] = "MAINTENANCE";
})(RecommendationCategory || (exports.RecommendationCategory = RecommendationCategory = {}));
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["DRAFT"] = "DRAFT";
    PlanStatus["ACTIVE"] = "ACTIVE";
    PlanStatus["TESTING"] = "TESTING";
    PlanStatus["ARCHIVED"] = "ARCHIVED";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
var ImpactLevel;
(function (ImpactLevel) {
    ImpactLevel["LOW"] = "LOW";
    ImpactLevel["MEDIUM"] = "MEDIUM";
    ImpactLevel["HIGH"] = "HIGH";
    ImpactLevel["CRITICAL"] = "CRITICAL";
})(ImpactLevel || (exports.ImpactLevel = ImpactLevel = {}));
//# sourceMappingURL=data-migration-backup.js.map