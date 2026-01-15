import { ILogger } from '@strengthos/shared-logging';
import { Results } from '@strengthos/shared-utils';
import { PrometheusService } from '../metrics/prometheus-service';
import { PerformanceMonitor } from '../metrics/performance-monitor';
import { HealthChecker } from '../metrics/health-checker';
import { ApplicationMetrics } from '../metrics/application-metrics';
import { MonitoringConfigManager } from '../utils/monitoring-config';
import { 
  IPrometheusService, 
  IPerformanceMonitor, 
  IHealthChecker, 
  IApplicationMetrics,
  MonitoringConfig 
} from '../types/monitoring-types';

export interface MonitoringServices {
  prometheusService: IPrometheusService;
  performanceMonitor: IPerformanceMonitor;
  healthChecker: IHealthChecker;
  applicationMetrics: IApplicationMetrics;
  configManager: MonitoringConfigManager;
}

export function createPrometheusService(
  logger: ILogger,
  collectDefaultMetrics: boolean = true
): IPrometheusService {
  return new PrometheusService(logger, collectDefaultMetrics);
}

export function createPerformanceMonitor(
  logger: ILogger,
  maxMetrics: number = 10000
): IPerformanceMonitor {
  return new PerformanceMonitor(logger, maxMetrics);
}

export function createHealthChecker(
  logger: ILogger,
  defaultTimeout: number = 5000
): IHealthChecker {
  return new HealthChecker(logger, defaultTimeout);
}

export function createApplicationMetrics(
  logger: ILogger,
  prometheusService?: IPrometheusService
): IApplicationMetrics {
  return new ApplicationMetrics(logger, prometheusService);
}

export function createMonitoringConfigManager(
  initialConfig?: MonitoringConfig
): MonitoringConfigManager {
  return new MonitoringConfigManager(initialConfig);
}

export function createMonitoringServices(
  logger: ILogger,
  config?: MonitoringConfig
): Results<MonitoringServices> {
  try {
    const configManager = createMonitoringConfigManager(config);
    const currentConfig = configManager.getConfig();

    // Create Prometheus service if enabled
    const prometheusService = currentConfig.prometheus.enabled
      ? createPrometheusService(logger, currentConfig.prometheus.collectDefaultMetrics)
      : createPrometheusService(logger, false); // Create disabled service

    // Create performance monitor
    const performanceMonitor = createPerformanceMonitor(logger);

    // Create health checker
    const healthChecker = createHealthChecker(
      logger,
      currentConfig.healthChecks.timeout
    );

    // Create application metrics
    const applicationMetrics = createApplicationMetrics(
      logger,
      currentConfig.prometheus.enabled ? prometheusService : undefined
    );

    const services: MonitoringServices = {
      prometheusService,
      performanceMonitor,
      healthChecker,
      applicationMetrics,
      configManager
    };

    logger.info({
      message: 'Monitoring services created successfully',
      prometheusEnabled: currentConfig.prometheus.enabled,
      healthChecksEnabled: currentConfig.healthChecks.enabled,
      performanceEnabled: currentConfig.performance.enabled,
      alertsEnabled: currentConfig.alerts.enabled
    });

    return Results.ok(services);
  } catch (error) {
    logger.error({ message: 'Failed to create monitoring services', error: String(error) });
    return Results.fail<MonitoringServices>(undefined, `Failed to create monitoring services: ${error}`);
  }
}

export function createBasicMonitoringSetup(
  logger: ILogger
): Results<{
  performanceMonitor: IPerformanceMonitor;
  healthChecker: IHealthChecker;
}> {
  try {
    const performanceMonitor = createPerformanceMonitor(logger);
    const healthChecker = createHealthChecker(logger);

    // Register basic health checks
    healthChecker.registerCheck('memory', HealthChecker.createMemoryCheck('memory'));
    
    logger.info({ message: 'Basic monitoring setup created' });

    return Results.ok({
      performanceMonitor,
      healthChecker
    });
  } catch (error) {
    logger.error({ message: 'Failed to create basic monitoring setup', error: String(error) });
    return Results.fail<{ performanceMonitor: IPerformanceMonitor; healthChecker: IHealthChecker; }>(undefined, `Failed to create basic monitoring setup: ${error}`);
  }
}

export function createDatabaseMonitoringSetup(
  logger: ILogger,
  testQuery: () => Promise<any>,
  databaseName: string = 'database'
): Results<{
  performanceMonitor: IPerformanceMonitor;
  healthChecker: IHealthChecker;
  applicationMetrics: IApplicationMetrics;
}> {
  try {
    const performanceMonitor = createPerformanceMonitor(logger);
    const healthChecker = createHealthChecker(logger);
    const applicationMetrics = createApplicationMetrics(logger);

    // Register database health check
    healthChecker.registerCheck(
      databaseName,
      HealthChecker.createDatabaseCheck(databaseName, testQuery)
    );

    logger.info({ message: 'Database monitoring setup created', databaseName });

    return Results.ok({
      performanceMonitor,
      healthChecker,
      applicationMetrics
    });
  } catch (error) {
    logger.error({ message: 'Failed to create database monitoring setup', error: String(error) });
    return Results.fail<{ performanceMonitor: IPerformanceMonitor; healthChecker: IHealthChecker; applicationMetrics: IApplicationMetrics; }>(undefined, `Failed to create database monitoring setup: ${error}`);
  }
}

export function createWebServerMonitoringSetup(
  logger: ILogger,
  prometheusPort: number = 9090
): Results<{
  prometheusService: IPrometheusService;
  performanceMonitor: IPerformanceMonitor;
  healthChecker: IHealthChecker;
  applicationMetrics: IApplicationMetrics;
}> {
  try {
    const prometheusService = createPrometheusService(logger, true);
    const performanceMonitor = createPerformanceMonitor(logger);
    const healthChecker = createHealthChecker(logger);
    const applicationMetrics = createApplicationMetrics(logger, prometheusService);

    // Register basic health checks
    healthChecker.registerCheck('memory', HealthChecker.createMemoryCheck('memory'));

    logger.info({ message: 'Web server monitoring setup created', prometheusPort });

    return Results.ok({
      prometheusService,
      performanceMonitor,
      healthChecker,
      applicationMetrics
    });
  } catch (error) {
    logger.error({ message: 'Failed to create web server monitoring setup', error: String(error) });
    return Results.fail<{ prometheusService: IPrometheusService; performanceMonitor: IPerformanceMonitor; healthChecker: IHealthChecker; applicationMetrics: IApplicationMetrics; }>(undefined, `Failed to create web server monitoring setup: ${error}`);
  }
}

export function createMicroserviceMonitoringSetup(
  logger: ILogger,
  serviceName: string,
  dependencies: Array<{ name: string; healthCheckUrl: string }> = []
): Results<MonitoringServices> {
  try {
    const services = createMonitoringServices(logger);
    if (!services.isOk) {
      return services;
    }

    const { healthChecker } = services.returnValue!;

    // Register service-specific health checks
    healthChecker.registerCheck('memory', HealthChecker.createMemoryCheck(`${serviceName}-memory`));

    // Register dependency health checks
    for (const dependency of dependencies) {
      healthChecker.registerCheck(
        dependency.name,
        HealthChecker.createHttpCheck(dependency.name, dependency.healthCheckUrl)
      );
    }

    logger.info({
      message: 'Microservice monitoring setup created',
      serviceName,
      dependencies: dependencies.map(d => d.name)
    });

    return services;
  } catch (error) {
    logger.error({ message: 'Failed to create microservice monitoring setup', error: String(error) });
    return Results.fail<MonitoringServices>(undefined, `Failed to create microservice monitoring setup: ${error}`);
  }
}

// Utility function to setup monitoring middleware for Express
export function createExpressMonitoringMiddleware(
  applicationMetrics: IApplicationMetrics,
  performanceMonitor: IPerformanceMonitor
) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const timerId = performanceMonitor.startTimer(`${req.method} ${req.path}`);

    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      // Record request metrics
      applicationMetrics.recordRequest(
        req.method,
        req.path,
        res.statusCode,
        duration
      );

      // End performance timer
      performanceMonitor.endTimer(timerId);

      // Call original end method
      originalEnd.apply(res, args);
    };

    next();
  };
}

// Utility function to setup error monitoring middleware for Express
export function createExpressErrorMonitoringMiddleware(
  applicationMetrics: IApplicationMetrics
) {
  return (error: Error, req: any, res: any, next: any) => {
    // Record error metrics
    applicationMetrics.recordError(error, {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    next(error);
  };
}