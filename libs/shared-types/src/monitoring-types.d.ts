export declare enum HealthStatus {
    HEALTHY = "HEALTHY",
    DEGRADED = "DEGRADED",
    UNHEALTHY = "UNHEALTHY",
    UNKNOWN = "UNKNOWN"
}
export declare enum DeploymentEnvironment {
    DEVELOPMENT = "DEVELOPMENT",
    STAGING = "STAGING",
    PRODUCTION = "PRODUCTION",
    TEST = "TEST"
}
export declare enum ReportPeriod {
    HOURLY = "HOURLY",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY"
}
export interface ServiceHealth {
    serviceName: string;
    status: HealthStatus;
    lastChecked: Date;
    responseTime?: number;
    errorRate?: number;
    details?: Record<string, any>;
}
//# sourceMappingURL=monitoring-types.d.ts.map