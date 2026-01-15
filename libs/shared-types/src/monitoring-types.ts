// Monitoring and System Health Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

// Monitoring Enums
export enum HealthStatus {
    HEALTHY = 'HEALTHY',
    DEGRADED = 'DEGRADED',
    UNHEALTHY = 'UNHEALTHY',
    UNKNOWN = 'UNKNOWN'
}

export enum DeploymentEnvironment {
    DEVELOPMENT = 'DEVELOPMENT',
    STAGING = 'STAGING',
    PRODUCTION = 'PRODUCTION',
    TEST = 'TEST'
}

export enum ReportPeriod {
    HOURLY = 'HOURLY',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY'
}

// Monitoring Interfaces
export interface ServiceHealth {
    serviceName: string;
    status: HealthStatus;
    lastChecked: Date;
    responseTime?: number;
    errorRate?: number;
    details?: Record<string, any>;
}