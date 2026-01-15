import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { IApplicationMetrics, SystemMetrics } from '../types/monitoring-types';
import { IPrometheusService } from '../types/monitoring-types';
import * as os from 'os';
import * as fs from 'fs';

export class ApplicationMetrics implements IApplicationMetrics {
  constructor(
    private logger: ILogger,
    private prometheusService?: IPrometheusService
  ) {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    if (this.prometheusService) {
      // Register common application metrics
      this.prometheusService.registerCustomMetric(
        'http_requests_total',
        'Total number of HTTP requests',
        'counter',
        ['method', 'path', 'status_code']
      );

      this.prometheusService.registerCustomMetric(
        'http_request_duration_seconds',
        'HTTP request duration in seconds',
        'histogram',
        ['method', 'path', 'status_code']
      );

      this.prometheusService.registerCustomMetric(
        'application_errors_total',
        'Total number of application errors',
        'counter',
        ['error_type', 'context']
      );

      this.prometheusService.registerCustomMetric(
        'user_actions_total',
        'Total number of user actions',
        'counter',
        ['action', 'user_id']
      );

      this.prometheusService.registerCustomMetric(
        'database_queries_total',
        'Total number of database queries',
        'counter',
        ['query_type', 'success']
      );

      this.prometheusService.registerCustomMetric(
        'database_query_duration_seconds',
        'Database query duration in seconds',
        'histogram',
        ['query_type', 'success']
      );

      this.prometheusService.registerCustomMetric(
        'cache_operations_total',
        'Total number of cache operations',
        'counter',
        ['operation', 'result']
      );

      this.prometheusService.registerCustomMetric(
        'system_memory_usage_bytes',
        'System memory usage in bytes',
        'gauge'
      );

      this.prometheusService.registerCustomMetric(
        'system_cpu_usage_percent',
        'System CPU usage percentage',
        'gauge'
      );
    }
  }

  recordRequest(method: string, path: string, statusCode: number, duration: number): Results<void> {
    try {
      const labels = {
        method: method.toUpperCase(),
        path: this.sanitizePath(path),
        status_code: statusCode.toString()
      };

      if (this.prometheusService) {
        this.prometheusService.incrementCounter('http_requests_total', labels);
        this.prometheusService.observeHistogram('http_request_duration_seconds', duration / 1000, labels);
      }

      this.logger.debug({
        message: 'HTTP request recorded',
        method,
        path,
        statusCode,
        duration
      });

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to record HTTP request', method, path, statusCode, duration, error: String(error) });
      return Results.fail(`Failed to record HTTP request: ${error}`) as Results<void>;
    }
  }

  recordError(error: Error, context?: Record<string, any>): Results<void> {
    try {
      const errorType = error.constructor.name;
      const contextString = context ? JSON.stringify(context) : 'none';

      if (this.prometheusService) {
        this.prometheusService.incrementCounter('application_errors_total', {
          error_type: errorType,
          context: contextString
        });
      }

      this.logger.error({
        message: 'Application error recorded',
        errorType,
        errorMessage: error.message,
        stack: error.stack,
        context
      });

      return Results.ok();
    } catch (recordError) {
      this.logger.error({ message: 'Failed to record application error', error: String(error), context, recordError: String(recordError) });
      return Results.fail(`Failed to record application error: ${recordError}`) as Results<void>;
    }
  }

  recordUserAction(action: string, userId?: string, metadata?: Record<string, any>): Results<void> {
    try {
      const labels = {
        action: action.toLowerCase(),
        user_id: userId || 'anonymous'
      };

      if (this.prometheusService) {
        this.prometheusService.incrementCounter('user_actions_total', labels);
      }

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to record user action', action, userId, metadata, error: String(error) });
      return Results.fail(`Failed to record user action: ${error}`) as Results<void>;
    }
  }

  recordDatabaseQuery(query: string, duration: number, success: boolean): Results<void> {
    try {
      const queryType = this.extractQueryType(query);
      const labels = {
        query_type: queryType,
        success: success.toString()
      };

      if (this.prometheusService) {
        this.prometheusService.incrementCounter('database_queries_total', labels);
        this.prometheusService.observeHistogram('database_query_duration_seconds', duration / 1000, labels);
      }

      this.logger.debug({
        message: 'Database query recorded',
        queryType,
        duration,
        success
      });

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to record database query', query, duration, success, error: String(error) });
      return Results.fail(`Failed to record database query: ${error}`) as Results<void>;
    }
  }

  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): Results<void> {
    try {
      const result = operation === 'hit' ? 'hit' : operation === 'miss' ? 'miss' : 'operation';
      const labels = {
        operation,
        result
      };

      if (this.prometheusService) {
        this.prometheusService.incrementCounter('cache_operations_total', labels);
      }

      this.logger.debug({
        message: 'Cache operation recorded',
        operation,
        key: this.sanitizeKey(key),
        duration
      });

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to record cache operation', operation, key, duration, error: String(error) });
      return Results.fail(`Failed to record cache operation: ${error}`) as Results<void>;
    }
  }

  async getSystemMetrics(): Promise<Results<SystemMetrics>> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const loadAverage = os.loadavg();

      // Get system memory info
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // Calculate CPU usage percentage (simplified)
      const cpuPercent = this.calculateCpuUsage(cpuUsage);

      // Get disk usage (simplified - just for current directory)
      const diskInfo = await this.getDiskUsage();

      const systemMetrics: SystemMetrics = {
        cpu: {
          usage: cpuPercent,
          loadAverage
        },
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: (usedMemory / totalMemory) * 100
        },
        disk: diskInfo
      };

      // Update Prometheus metrics if available
      if (this.prometheusService) {
        this.prometheusService.setGauge('system_memory_usage_bytes', usedMemory);
        this.prometheusService.setGauge('system_cpu_usage_percent', cpuPercent);
      }

      return Results.ok(systemMetrics);
    } catch (error) {
      this.logger.error({ message: 'Failed to get system metrics', error: String(error) });
      return Results.fail<SystemMetrics>(undefined, `Failed to get system metrics: ${error}`);
    }
  }

  private sanitizePath(path: string): string {
    // Replace dynamic path segments with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9]{24}/g, '/:objectid');
  }

  private sanitizeKey(key: string): string {
    // Remove sensitive information from cache keys
    return key.length > 50 ? `${key.substring(0, 47)}...` : key;
  }

  private extractQueryType(query: string): string {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'select';
    if (trimmed.startsWith('insert')) return 'insert';
    if (trimmed.startsWith('update')) return 'update';
    if (trimmed.startsWith('delete')) return 'delete';
    if (trimmed.startsWith('create')) return 'create';
    if (trimmed.startsWith('drop')) return 'drop';
    if (trimmed.startsWith('alter')) return 'alter';
    return 'other';
  }

  private calculateCpuUsage(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified CPU usage calculation
    // In a real implementation, you'd want to track this over time
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(100, (totalUsage / 1000000) * 100); // Convert microseconds to percentage
  }

  private async getDiskUsage(): Promise<{ used: number; total: number; percentage: number }> {
    try {
      const stats = await fs.promises.statfs('.');
      const total = stats.bavail * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;

      return {
        used,
        total,
        percentage: total > 0 ? (used / total) * 100 : 0
      };
    } catch (error) {
      // Fallback for systems that don't support statfs
      return {
        used: 0,
        total: 0,
        percentage: 0
      };
    }
  }

  // Utility method to start periodic system metrics collection
  startPeriodicCollection(intervalMs: number = 60000): Results<NodeJS.Timeout> {
    try {
      const interval = setInterval(async () => {
        const metricsResult = await this.getSystemMetrics();
        if (!metricsResult.isOk) {
          this.logger.warn({ 
            message: 'Failed to collect periodic system metrics',
            error: metricsResult.message 
          });
        }
      }, intervalMs);

      this.logger.info({ message: 'Started periodic system metrics collection', intervalMs });
      return Results.ok(interval);
    } catch (error) {
      this.logger.error({ message: 'Failed to start periodic metrics collection', error: String(error) });
      return Results.fail<NodeJS.Timeout>(undefined, `Failed to start periodic metrics collection: ${error}`);
    }
  }

  stopPeriodicCollection(interval: NodeJS.Timeout): Results<void> {
    try {
      clearInterval(interval);
      this.logger.info({ message: 'Stopped periodic system metrics collection' });
      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to stop periodic metrics collection', error: String(error) });
      return Results.fail(`Failed to stop periodic metrics collection: ${error}`) as Results<void>;
    }
  }
}