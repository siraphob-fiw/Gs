import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { IPerformanceMonitor, PerformanceMetric } from '../types/monitoring-types';
import { v4 as uuidv4 } from 'uuid';

interface ActiveTimer {
  id: string;
  name: string;
  startTime: Date;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor implements IPerformanceMonitor {
  private activeTimers: Map<string, ActiveTimer> = new Map();
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number;

  constructor(
    private logger: ILogger,
    maxMetrics: number = 10000
  ) {
    this.maxMetrics = maxMetrics;
  }

  startTimer(name: string, metadata?: Record<string, any>): string {
    const timerId = uuidv4();
    const timer: ActiveTimer = {
      id: timerId,
      name,
      startTime: new Date(),
      metadata
    };

    this.activeTimers.set(timerId, timer);
    this.logger.debug({ message: 'Timer started', timerId, name, metadata });
    
    return timerId;
  }

  endTimer(timerId: string): Results<PerformanceMetric> {
    try {
      const timer = this.activeTimers.get(timerId);
      if (!timer) {
        return Results.fail<PerformanceMetric>(undefined, `Timer with ID ${timerId} not found`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - timer.startTime.getTime();

      const metric: PerformanceMetric = {
        name: timer.name,
        duration,
        startTime: timer.startTime,
        endTime,
        metadata: timer.metadata
      };

      this.activeTimers.delete(timerId);
      
      const recordResult = this.recordMetric(metric);
      if (!recordResult.isOk) {
        return Results.fail<PerformanceMetric>(undefined, recordResult.message || 'Failed to record metric');
      }

      this.logger.debug({ 
        message: 'Timer ended',
        timerId, 
        name: timer.name, 
        duration,
        metadata: timer.metadata 
      });

      return Results.ok(metric);
    } catch (error) {
      this.logger.error({ message: 'Failed to end timer', timerId, error: String(error) });
      return Results.fail<PerformanceMetric>(undefined, `Failed to end timer ${timerId}: ${error}`);
    }
  }

  recordMetric(metric: PerformanceMetric): Results<void> {
    try {
      // Ensure we don't exceed max metrics
      if (this.metrics.length >= this.maxMetrics) {
        // Remove oldest metrics (FIFO)
        const removeCount = Math.floor(this.maxMetrics * 0.1); // Remove 10%
        this.metrics.splice(0, removeCount);
      }

      this.metrics.push(metric);
      
      this.logger.debug({
        message: 'Performance metric recorded',
        name: metric.name,
        duration: metric.duration,
        metadata: metric.metadata
      });

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to record performance metric', metric, error: String(error) });
      return Results.fail(`Failed to record performance metric: ${error}`) as Results<void>;
    }
  }

  getMetrics(filter?: { 
    name?: string; 
    startTime?: Date; 
    endTime?: Date 
  }): Results<PerformanceMetric[]> {
    try {
      let filteredMetrics = [...this.metrics];

      if (filter) {
        if (filter.name) {
          filteredMetrics = filteredMetrics.filter(m => 
            m.name.toLowerCase().includes(filter.name!.toLowerCase())
          );
        }

        if (filter.startTime) {
          filteredMetrics = filteredMetrics.filter(m => 
            m.startTime >= filter.startTime!
          );
        }

        if (filter.endTime) {
          filteredMetrics = filteredMetrics.filter(m => 
            m.endTime <= filter.endTime!
          );
        }
      }

      return Results.ok(filteredMetrics);
    } catch (error) {
      this.logger.error({ message: 'Failed to get performance metrics', filter, error: String(error) });
      return Results.fail<PerformanceMetric[]>(undefined, `Failed to get performance metrics: ${error}`);
    }
  }

  clearMetrics(): Results<void> {
    try {
      this.metrics = [];
      this.activeTimers.clear();
      this.logger.info({ message: 'Performance metrics cleared' });
      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to clear performance metrics', error: String(error) });
      return Results.fail(`Failed to clear performance metrics: ${error}`) as Results<void>;
    }
  }

  getActiveTimers(): Results<ActiveTimer[]> {
    try {
      return Results.ok(Array.from(this.activeTimers.values()));
    } catch (error) {
      this.logger.error({ message: 'Failed to get active timers', error: String(error) });
      return Results.fail<ActiveTimer[]>(undefined, `Failed to get active timers: ${error}`);
    }
  }

  getStatistics(name?: string): Results<{
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
  }> {
    try {
      let metrics = this.metrics;
      
      if (name) {
        metrics = metrics.filter(m => m.name === name);
      }

      if (metrics.length === 0) {
        return Results.ok({
          count: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          totalDuration: 0
        });
      }

      const durations = metrics.map(m => m.duration);
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);

      return Results.ok({
        count: metrics.length,
        averageDuration: totalDuration / metrics.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        totalDuration
      });
    } catch (error) {
      this.logger.error({ message: 'Failed to get performance statistics', name, error: String(error) });
      return Results.fail<{ count: number; averageDuration: number; minDuration: number; maxDuration: number; totalDuration: number; }>(undefined, `Failed to get performance statistics: ${error}`);
    }
  }

  // Utility method for measuring async functions
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<Results<{ result: T; metric: PerformanceMetric }>> {
    const timerId = this.startTimer(name, metadata);
    
    try {
      const result = await fn();
      const endResult = this.endTimer(timerId);
      
      if (!endResult.isOk) {
        return Results.fail<{ result: T; metric: PerformanceMetric; }>(undefined, endResult.message || 'Failed to end timer');
      }

      return Results.ok({
        result,
        metric: endResult.returnValue!
      });
    } catch (error) {
      this.endTimer(timerId); // Clean up timer even on error
      this.logger.error({ message: 'Error during async measurement', name, error: String(error) });
      return Results.fail<{ result: T; metric: PerformanceMetric; }>(undefined, `Error during async measurement: ${error}`);
    }
  }

  // Utility method for measuring sync functions
  measureSync<T>(
    name: string, 
    fn: () => T, 
    metadata?: Record<string, any>
  ): Results<{ result: T; metric: PerformanceMetric }> {
    const timerId = this.startTimer(name, metadata);
    
    try {
      const result = fn();
      const endResult = this.endTimer(timerId);
      
      if (!endResult.isOk) {
        return Results.fail<{ result: T; metric: PerformanceMetric; }>(undefined, endResult.message || 'Failed to end timer');
      }

      return Results.ok({
        result,
        metric: endResult.returnValue!
      });
    } catch (error) {
      this.endTimer(timerId); // Clean up timer even on error
      this.logger.error({ message: 'Error during sync measurement', name, error: String(error) });
      return Results.fail<{ result: T; metric: PerformanceMetric; }>(undefined, `Error during sync measurement: ${error}`);
    }
  }
}