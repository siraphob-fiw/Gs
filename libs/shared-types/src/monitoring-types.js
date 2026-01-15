"use strict";
// Monitoring and System Health Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportPeriod = exports.DeploymentEnvironment = exports.HealthStatus = void 0;
// Monitoring Enums
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "HEALTHY";
    HealthStatus["DEGRADED"] = "DEGRADED";
    HealthStatus["UNHEALTHY"] = "UNHEALTHY";
    HealthStatus["UNKNOWN"] = "UNKNOWN";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
var DeploymentEnvironment;
(function (DeploymentEnvironment) {
    DeploymentEnvironment["DEVELOPMENT"] = "DEVELOPMENT";
    DeploymentEnvironment["STAGING"] = "STAGING";
    DeploymentEnvironment["PRODUCTION"] = "PRODUCTION";
    DeploymentEnvironment["TEST"] = "TEST";
})(DeploymentEnvironment || (exports.DeploymentEnvironment = DeploymentEnvironment = {}));
var ReportPeriod;
(function (ReportPeriod) {
    ReportPeriod["HOURLY"] = "HOURLY";
    ReportPeriod["DAILY"] = "DAILY";
    ReportPeriod["WEEKLY"] = "WEEKLY";
    ReportPeriod["MONTHLY"] = "MONTHLY";
})(ReportPeriod || (exports.ReportPeriod = ReportPeriod = {}));
//# sourceMappingURL=monitoring-types.js.map