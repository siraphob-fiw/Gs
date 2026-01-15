import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { IHealthChecker, HealthCheckResult } from '../types/monitoring-types';

type HealthCheckFunction = () => Promise<HealthCheckResult>;

export class HealthChecker implements IHealthChecker {
  private checks: Map<string, HealthCheckFunction> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();

  constructor(
    private logger: ILogger,
    private defaultTimeout: number = 5000
  ) {}

  registerCheck(name: string, checkFunction: HealthCheckFunction): Results<void> {
    try {
      if (this.checks.has(name)) {
        return Results.fail(`Health check '${name}' already exists`) as Results<void>;
      }

      this.checks.set(name, checkFunction);
      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to register health check', name, error: String(error) });
      return Results.fail(`Failed to register health check '${name}': ${error}`) as Results<void>;
    }
  }

  async runCheck(name: string): Promise<Results<HealthCheckResult>> {
    try {
      const checkFunction = this.checks.get(name);
      if (!checkFunction) {
        const errorResult: HealthCheckResult = {
          service: name,
          status: 'unhealthy',
          message: `Health check '${name}' not found`,
          timestamp: new Date()
        };
        return Results.ok(errorResult);
      }

      const startTime = Date.now();
      
      // Run check with timeout
      const result = await Promise.race([
        checkFunction(),
        this.createTimeoutPromise(name)
      ]);

      const responseTime = Date.now() - startTime;
      const resultWithTiming = {
        ...result,
        responseTime
      };

      this.lastResults.set(name, resultWithTiming);


      return Results.ok(resultWithTiming);
    } catch (error) {
      const errorResult: HealthCheckResult = {
        service: name,
        status: 'unhealthy',
        message: `Health check failed: ${error}`,
        timestamp: new Date()
      };

      this.lastResults.set(name, errorResult);
      this.logger.error({ message: 'Health check failed', name, error: String(error) });
      return Results.ok(errorResult); // Return the error result, not fail the Results
    }
  }

  async runAllChecks(): Promise<Results<HealthCheckResult[]>> {
    try {
      const checkNames = Array.from(this.checks.keys());
      const results: HealthCheckResult[] = [];

      // Run all checks in parallel
      const checkPromises = checkNames.map(async (name) => {
        const result = await this.runCheck(name);
        return result.isOk ? result.returnValue! : {
          service: name,
          status: 'unhealthy' as const,
          message: result.message || 'Health check failed',
          timestamp: new Date()
        };
      });

      const checkResults = await Promise.all(checkPromises);
      results.push(...checkResults);

      return Results.ok(results);
    } catch (error) {
      this.logger.error({ message: 'Failed to run all health checks', error: String(error) });
      return Results.fail<HealthCheckResult[]>(undefined, `Failed to run all health checks: ${error}`);
    }
  }

  async getHealthStatus(): Promise<Results<{ 
    status: 'healthy' | 'unhealthy' | 'degraded'; 
    checks: HealthCheckResult[] 
  }>> {
    try {
      const allChecksResult = await this.runAllChecks();
      if (!allChecksResult.isOk) {
        return Results.fail<{ status: "healthy" | "unhealthy" | "degraded"; checks: HealthCheckResult[]; }>(undefined, allChecksResult.message || 'Failed to run health checks');
      }

      const checks = allChecksResult.returnValue!;
      
      // Determine overall status
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      
      const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
      const hasDegraded = checks.some(check => check.status === 'degraded');

      if (hasUnhealthy) {
        overallStatus = 'unhealthy';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      }

      return Results.ok({
        status: overallStatus,
        checks
      });
    } catch (error) {
      this.logger.error({ message: 'Failed to get health status', error: String(error) });
      return Results.fail<{ status: "healthy" | "unhealthy" | "degraded"; checks: HealthCheckResult[]; }>(undefined, `Failed to get health status: ${error}`);
    }
  }

  removeCheck(name: string): Results<void> {
    try {
      if (!this.checks.has(name)) {
        return Results.ok(); // Silently succeed if check doesn't exist
      }

      this.checks.delete(name);
      this.lastResults.delete(name);
      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to remove health check', name, error: String(error) });
      return Results.fail(`Failed to remove health check '${name}': ${error}`) as Results<void>;
    }
  }

  getLastResults(): Results<Map<string, HealthCheckResult>> {
    try {
      return Results.ok(new Map(this.lastResults));
    } catch (error) {
      this.logger.error({ message: 'Failed to get last results', error: String(error) });
      return Results.fail<Map<string, HealthCheckResult>>(undefined, `Failed to get last results: ${error}`);
    }
  }

  getRegisteredChecks(): Results<string[]> {
    try {
      return Results.ok(Array.from(this.checks.keys()));
    } catch (error) {
      this.logger.error({ message: 'Failed to get registered checks', error: String(error) });
      return Results.fail<string[]>(undefined, `Failed to get registered checks: ${error}`);
    }
  }

  private async createTimeoutPromise(checkName: string): Promise<HealthCheckResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check '${checkName}' timed out after ${this.defaultTimeout}ms`));
      }, this.defaultTimeout);
    });
  }

  // Utility method to create common health checks
  static createDatabaseCheck(
    name: string,
    testQuery: () => Promise<any>
  ): HealthCheckFunction {
    return async (): Promise<HealthCheckResult> => {
      try {
        await testQuery();
        return {
          service: name,
          status: 'healthy',
          message: 'Database connection successful',
          timestamp: new Date()
        };
      } catch (error) {
        return {
          service: name,
          status: 'unhealthy',
          message: `Database connection failed: ${error}`,
          timestamp: new Date()
        };
      }
    };
  }

  static createHttpCheck(
    name: string,
    url: string,
    expectedStatus: number = 200
  ): HealthCheckFunction {
    return async (): Promise<HealthCheckResult> => {
      try {
        const response = await fetch(url, { method: 'GET' });
        
        if (response.status === expectedStatus) {
          return {
            service: name,
            status: 'healthy',
            message: `HTTP check successful (${response.status})`,
            timestamp: new Date()
          };
        } else {
          return {
            service: name,
            status: 'degraded',
            message: `HTTP check returned unexpected status: ${response.status}`,
            timestamp: new Date()
          };
        }
      } catch (error) {
        return {
          service: name,
          status: 'unhealthy',
          message: `HTTP check failed: ${error}`,
          timestamp: new Date()
        };
      }
    };
  }

  static createMemoryCheck(
    name: string,
    maxMemoryUsagePercent: number = 90
  ): HealthCheckFunction {
    return async (): Promise<HealthCheckResult> => {
      try {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        const usagePercent = (usedMemory / totalMemory) * 100;

        if (usagePercent > maxMemoryUsagePercent) {
          return {
            service: name,
            status: 'degraded',
            message: `Memory usage high: ${usagePercent.toFixed(2)}%`,
            timestamp: new Date(),
            metadata: { usagePercent, usedMemory, totalMemory }
          };
        }

        return {
          service: name,
          status: 'healthy',
          message: `Memory usage normal: ${usagePercent.toFixed(2)}%`,
          timestamp: new Date(),
          metadata: { usagePercent, usedMemory, totalMemory }
        };
      } catch (error) {
        return {
          service: name,
          status: 'unhealthy',
          message: `Memory check failed: ${error}`,
          timestamp: new Date()
        };
      }
    };
  }
}