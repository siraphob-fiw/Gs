export interface DataMigrationJob {
    id: string;
    tenantId?: string;
    type: MigrationType;
    status: MigrationStatus;
    sourceVersion: string;
    targetVersion: string;
    affectedTables: string[];
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    startedAt: Date;
    completedAt?: Date;
    estimatedDuration?: number;
    actualDuration?: number;
    errors: MigrationError[];
    metadata: MigrationMetadata;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MigrationError {
    id: string;
    migrationJobId: string;
    errorType: MigrationErrorType;
    errorCode: string;
    message: string;
    details: Record<string, any>;
    recordId?: string;
    tableName?: string;
    stackTrace?: string;
    timestamp: Date;
    isRecoverable: boolean;
    retryCount: number;
    maxRetries: number;
}
export interface MigrationMetadata {
    batchSize: number;
    parallelWorkers: number;
    checksumBefore?: string;
    checksumAfter?: string;
    backupCreated: boolean;
    backupId?: string;
    rollbackPlan?: RollbackPlan;
    customSettings?: Record<string, any>;
}
export interface RollbackPlan {
    id: string;
    migrationJobId: string;
    steps: RollbackStep[];
    canRollback: boolean;
    rollbackTimeEstimate: number;
    dependencies: string[];
    createdAt: Date;
}
export interface RollbackStep {
    id: string;
    stepNumber: number;
    operation: RollbackOperation;
    tableName: string;
    query: string;
    parameters: Record<string, any>;
    estimatedDuration: number;
    isReversible: boolean;
}
export interface BackupJob {
    id: string;
    tenantId?: string;
    type: BackupType;
    scope: BackupScope;
    status: BackupStatus;
    format: BackupFormat;
    compression: CompressionType;
    encryption: EncryptionConfig;
    size: number;
    location: BackupLocation;
    retentionPolicy: RetentionPolicy;
    scheduledAt?: Date;
    startedAt: Date;
    completedAt?: Date;
    expiresAt?: Date;
    checksum: string;
    metadata: BackupMetadata;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface BackupMetadata {
    databaseVersion: string;
    applicationVersion: string;
    totalTables: number;
    totalRecords: number;
    includedTables: string[];
    excludedTables: string[];
    compressionRatio?: number;
    verificationStatus: VerificationStatus;
    customTags?: Record<string, string>;
}
export interface BackupLocation {
    provider: StorageProvider;
    region: string;
    bucket: string;
    path: string;
    url?: string;
    credentials?: StorageCredentials;
}
export interface StorageCredentials {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    endpoint?: string;
}
export interface EncryptionConfig {
    enabled: boolean;
    algorithm?: string;
    keyId?: string;
    keyRotation?: boolean;
}
export interface RetentionPolicy {
    id: string;
    name: string;
    retentionDays: number;
    maxBackups: number;
    deleteAfterRestore: boolean;
    archiveAfterDays?: number;
    complianceRequirements: string[];
}
export interface RestoreJob {
    id: string;
    backupId: string;
    tenantId?: string;
    type: RestoreType;
    status: RestoreStatus;
    targetEnvironment: string;
    pointInTime?: Date;
    includedTables: string[];
    excludedTables: string[];
    dataValidation: ValidationConfig;
    startedAt: Date;
    completedAt?: Date;
    restoredRecords: number;
    failedRecords: number;
    errors: RestoreError[];
    metadata: RestoreMetadata;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface RestoreError {
    id: string;
    restoreJobId: string;
    errorType: RestoreErrorType;
    message: string;
    tableName?: string;
    recordId?: string;
    details: Record<string, any>;
    timestamp: Date;
    isRecoverable: boolean;
}
export interface RestoreMetadata {
    originalBackupDate: Date;
    restorationMethod: string;
    dataIntegrityChecks: IntegrityCheck[];
    performanceMetrics: PerformanceMetrics;
    customSettings?: Record<string, any>;
}
export interface ValidationConfig {
    enabled: boolean;
    checksumValidation: boolean;
    referentialIntegrity: boolean;
    dataTypeValidation: boolean;
    customValidators: string[];
}
export interface IntegrityCheck {
    checkType: IntegrityCheckType;
    tableName: string;
    status: CheckStatus;
    expectedCount: number;
    actualCount: number;
    checksum?: string;
    errors: string[];
    timestamp: Date;
}
export interface PerformanceMetrics {
    totalDuration: number;
    throughputMBps: number;
    recordsPerSecond: number;
    peakMemoryUsage: number;
    cpuUtilization: number;
    ioOperations: number;
}
export interface DataArchiveJob {
    id: string;
    tenantId?: string;
    type: ArchiveType;
    status: ArchiveStatus;
    criteria: ArchiveCriteria;
    affectedTables: string[];
    totalRecords: number;
    archivedRecords: number;
    deletedRecords: number;
    archiveLocation: BackupLocation;
    retentionPolicy: RetentionPolicy;
    startedAt: Date;
    completedAt?: Date;
    metadata: ArchiveMetadata;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ArchiveCriteria {
    dateField: string;
    cutoffDate: Date;
    conditions: ArchiveCondition[];
    preserveRelationships: boolean;
    cascadeDelete: boolean;
}
export interface ArchiveCondition {
    field: string;
    operator: string;
    value: any;
    logicalOperator?: 'AND' | 'OR';
}
export interface ArchiveMetadata {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    encryptionEnabled: boolean;
    indexesPreserved: boolean;
    relationshipsPreserved: boolean;
}
export interface DataIntegrityReport {
    id: string;
    tenantId?: string;
    reportType: IntegrityReportType;
    status: ReportStatus;
    scope: IntegrityScope;
    checks: IntegrityCheck[];
    summary: IntegritySummary;
    recommendations: IntegrityRecommendation[];
    generatedAt: Date;
    generatedBy: string;
    metadata: Record<string, any>;
}
export interface IntegritySummary {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    criticalIssues: number;
    overallScore: number;
    riskLevel: RiskLevel;
}
export interface IntegrityRecommendation {
    id: string;
    priority: RecommendationPriority;
    category: RecommendationCategory;
    title: string;
    description: string;
    impact: string;
    solution: string;
    estimatedEffort: string;
    affectedTables: string[];
}
export interface DisasterRecoveryPlan {
    id: string;
    name: string;
    version: string;
    status: PlanStatus;
    rto: number;
    rpo: number;
    scenarios: DisasterScenario[];
    procedures: RecoveryProcedure[];
    contacts: EmergencyContact[];
    lastTested: Date;
    nextTestDate: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DisasterScenario {
    id: string;
    name: string;
    description: string;
    probability: RiskLevel;
    impact: ImpactLevel;
    triggers: string[];
    affectedSystems: string[];
    recoveryProcedures: string[];
}
export interface RecoveryProcedure {
    id: string;
    name: string;
    description: string;
    steps: RecoveryStep[];
    estimatedDuration: number;
    prerequisites: string[];
    dependencies: string[];
    rollbackSteps: string[];
}
export interface RecoveryStep {
    stepNumber: number;
    title: string;
    description: string;
    command?: string;
    expectedResult: string;
    troubleshooting: string[];
    estimatedDuration: number;
    isAutomated: boolean;
    responsibleRole: string;
}
export interface EmergencyContact {
    name: string;
    role: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
    availability: string;
    escalationLevel: number;
}
export interface CreateMigrationJobRequest {
    tenantId?: string;
    type: MigrationType;
    sourceVersion: string;
    targetVersion: string;
    affectedTables: string[];
    batchSize?: number;
    parallelWorkers?: number;
    createBackup?: boolean;
    dryRun?: boolean;
    customSettings?: Record<string, any>;
}
export interface CreateBackupJobRequest {
    tenantId?: string;
    type: BackupType;
    scope: BackupScope;
    format?: BackupFormat;
    compression?: CompressionType;
    encryption?: EncryptionConfig;
    location?: Partial<BackupLocation>;
    retentionPolicyId?: string;
    scheduledAt?: Date;
    customTags?: Record<string, string>;
}
export interface CreateRestoreJobRequest {
    backupId: string;
    tenantId?: string;
    type: RestoreType;
    targetEnvironment: string;
    pointInTime?: Date;
    includedTables?: string[];
    excludedTables?: string[];
    dataValidation?: ValidationConfig;
    customSettings?: Record<string, any>;
}
export interface CreateArchiveJobRequest {
    tenantId?: string;
    type: ArchiveType;
    criteria: ArchiveCriteria;
    affectedTables: string[];
    archiveLocation?: Partial<BackupLocation>;
    retentionPolicyId?: string;
}
export interface MigrationJobFilters {
    tenantId?: string;
    type?: MigrationType;
    status?: MigrationStatus;
    startDate?: Date;
    endDate?: Date;
    createdBy?: string;
    limit?: number;
    offset?: number;
}
export interface BackupJobFilters {
    tenantId?: string;
    type?: BackupType;
    status?: BackupStatus;
    startDate?: Date;
    endDate?: Date;
    createdBy?: string;
    limit?: number;
    offset?: number;
}
export declare enum MigrationType {
    SCHEMA_MIGRATION = "SCHEMA_MIGRATION",
    DATA_MIGRATION = "DATA_MIGRATION",
    TENANT_MIGRATION = "TENANT_MIGRATION",
    USER_MIGRATION = "USER_MIGRATION",
    FULL_MIGRATION = "FULL_MIGRATION",
    INCREMENTAL_MIGRATION = "INCREMENTAL_MIGRATION"
}
export declare enum MigrationStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    ROLLED_BACK = "ROLLED_BACK"
}
export declare enum MigrationErrorType {
    SCHEMA_ERROR = "SCHEMA_ERROR",
    DATA_ERROR = "DATA_ERROR",
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    PERMISSION_ERROR = "PERMISSION_ERROR",
    RESOURCE_ERROR = "RESOURCE_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR"
}
export declare enum RollbackOperation {
    INSERT = "INSERT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    CREATE_TABLE = "CREATE_TABLE",
    DROP_TABLE = "DROP_TABLE",
    ALTER_TABLE = "ALTER_TABLE",
    CREATE_INDEX = "CREATE_INDEX",
    DROP_INDEX = "DROP_INDEX"
}
export declare enum BackupType {
    FULL_BACKUP = "FULL_BACKUP",
    INCREMENTAL_BACKUP = "INCREMENTAL_BACKUP",
    DIFFERENTIAL_BACKUP = "DIFFERENTIAL_BACKUP",
    TENANT_BACKUP = "TENANT_BACKUP",
    USER_BACKUP = "USER_BACKUP",
    COMPLIANCE_BACKUP = "COMPLIANCE_BACKUP"
}
export declare enum BackupScope {
    FULL_DATABASE = "FULL_DATABASE",
    TENANT_DATA = "TENANT_DATA",
    USER_DATA = "USER_DATA",
    AUDIT_DATA = "AUDIT_DATA",
    CONFIGURATION_DATA = "CONFIGURATION_DATA",
    CUSTOM_SCOPE = "CUSTOM_SCOPE"
}
export declare enum BackupStatus {
    SCHEDULED = "SCHEDULED",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED",
    ARCHIVED = "ARCHIVED"
}
export declare enum BackupFormat {
    SQL_DUMP = "SQL_DUMP",
    BINARY = "BINARY",
    JSON = "JSON",
    CSV = "CSV",
    PARQUET = "PARQUET",
    CUSTOM = "CUSTOM"
}
export declare enum CompressionType {
    NONE = "NONE",
    GZIP = "GZIP",
    BZIP2 = "BZIP2",
    LZ4 = "LZ4",
    ZSTD = "ZSTD"
}
export declare enum StorageProvider {
    LOCAL = "LOCAL",
    AWS_S3 = "AWS_S3",
    AZURE_BLOB = "AZURE_BLOB",
    GOOGLE_CLOUD = "GOOGLE_CLOUD",
    MINIO = "MINIO",
    CUSTOM = "CUSTOM"
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED"
}
export declare enum RestoreType {
    FULL_RESTORE = "FULL_RESTORE",
    PARTIAL_RESTORE = "PARTIAL_RESTORE",
    POINT_IN_TIME_RESTORE = "POINT_IN_TIME_RESTORE",
    TABLE_RESTORE = "TABLE_RESTORE",
    TENANT_RESTORE = "TENANT_RESTORE",
    USER_RESTORE = "USER_RESTORE"
}
export declare enum RestoreStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED"
}
export declare enum RestoreErrorType {
    BACKUP_NOT_FOUND = "BACKUP_NOT_FOUND",
    CORRUPTION_ERROR = "CORRUPTION_ERROR",
    SCHEMA_MISMATCH = "SCHEMA_MISMATCH",
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
    PERMISSION_ERROR = "PERMISSION_ERROR",
    STORAGE_ERROR = "STORAGE_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR"
}
export declare enum ArchiveType {
    DATA_ARCHIVE = "DATA_ARCHIVE",
    COMPLIANCE_ARCHIVE = "COMPLIANCE_ARCHIVE",
    AUDIT_ARCHIVE = "AUDIT_ARCHIVE",
    USER_ARCHIVE = "USER_ARCHIVE",
    TENANT_ARCHIVE = "TENANT_ARCHIVE"
}
export declare enum ArchiveStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum IntegrityCheckType {
    CHECKSUM = "CHECKSUM",
    ROW_COUNT = "ROW_COUNT",
    REFERENTIAL_INTEGRITY = "REFERENTIAL_INTEGRITY",
    DATA_TYPE_VALIDATION = "DATA_TYPE_VALIDATION",
    CONSTRAINT_VALIDATION = "CONSTRAINT_VALIDATION",
    CUSTOM_VALIDATION = "CUSTOM_VALIDATION"
}
export declare enum CheckStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    PASSED = "PASSED",
    FAILED = "FAILED",
    WARNING = "WARNING",
    SKIPPED = "SKIPPED"
}
export declare enum IntegrityReportType {
    FULL_INTEGRITY_CHECK = "FULL_INTEGRITY_CHECK",
    TENANT_INTEGRITY_CHECK = "TENANT_INTEGRITY_CHECK",
    USER_INTEGRITY_CHECK = "USER_INTEGRITY_CHECK",
    POST_MIGRATION_CHECK = "POST_MIGRATION_CHECK",
    POST_RESTORE_CHECK = "POST_RESTORE_CHECK",
    SCHEDULED_CHECK = "SCHEDULED_CHECK"
}
export declare enum ReportStatus {
    GENERATING = "GENERATING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum IntegrityScope {
    FULL_DATABASE = "FULL_DATABASE",
    TENANT_DATA = "TENANT_DATA",
    USER_DATA = "USER_DATA",
    SPECIFIC_TABLES = "SPECIFIC_TABLES"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RecommendationPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RecommendationCategory {
    PERFORMANCE = "PERFORMANCE",
    SECURITY = "SECURITY",
    DATA_INTEGRITY = "DATA_INTEGRITY",
    COMPLIANCE = "COMPLIANCE",
    MAINTENANCE = "MAINTENANCE"
}
export declare enum PlanStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    TESTING = "TESTING",
    ARCHIVED = "ARCHIVED"
}
export declare enum ImpactLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
//# sourceMappingURL=data-migration-backup.d.ts.map