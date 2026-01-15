import { Results } from '@strengthos/shared-utils';
import { MetricValue, PerformanceMetric } from '../types/monitoring-types';

export class MetricUtils {
  /**
   * Calculate percentiles from a set of values
   */
  static calculatePercentiles(values: number[], percentiles: number[] = [50, 90, 95, 99]): Record<string, number> {
    if (values.length === 0) {
      return percentiles.reduce((acc, p) => ({ ...acc, [`p${p}`]: 0 }), {});
    }

    const sorted = [...values].sort((a, b) => a - b);
    const result: Record<string, number> = {};

    for (const percentile of percentiles) {
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      result[`p${percentile}`] = sorted[Math.max(0, index)];
    }

    return result;
  }

  /**
   * Calculate moving average
   */
  static calculateMovingAverage(values: number[], windowSize: number): number[] {
    if (values.length < windowSize) {
      return values;
    }

    const result: number[] = [];
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      result.push(average);
    }

    return result;
  }

  /**
   * Calculate rate of change between two metric values
   */
  static calculateRate(current: MetricValue, previous: MetricValue): number {
    const timeDiff = current.timestamp.getTime() - previous.timestamp.getTime();
    if (timeDiff === 0) return 0;

    const valueDiff = current.value - previous.value;
    return (valueDiff / timeDiff) * 1000; // Rate per second
  }

  /**
   * Aggregate metrics by time buckets
   */
  static aggregateByTimeBuckets(
    metrics: PerformanceMetric[],
    bucketSizeMs: number,
    aggregationType: 'avg' | 'sum' | 'count' | 'min' | 'max' = 'avg'
  ): Array<{ timestamp: Date; value: number; count: number }> {
    if (metrics.length === 0) return [];

    // Group metrics by time buckets
    const buckets = new Map<number, PerformanceMetric[]>();
    
    for (const metric of metrics) {
      const bucketKey = Math.floor(metric.startTime.getTime() / bucketSizeMs) * bucketSizeMs;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(metric);
    }

    // Calculate aggregated values
    const result: Array<{ timestamp: Date; value: number; count: number }> = [];
    
    for (const [bucketKey, bucketMetrics] of buckets) {
      const durations = bucketMetrics.map(m => m.duration);
      let value: number;

      switch (aggregationType) {
        case 'avg':
          value = durations.reduce((sum, d) => sum + d, 0) / durations.length;
          break;
        case 'sum':
          value = durations.reduce((sum, d) => sum + d, 0);
          break;
        case 'count':
          value = durations.length;
          break;
        case 'min':
          value = Math.min(...durations);
          break;
        case 'max':
          value = Math.max(...durations);
          break;
      }

      result.push({
        timestamp: new Date(bucketKey),
        value,
        count: bucketMetrics.length
      });
    }

    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Detect anomalies in metric values using simple statistical methods
   */
  static detectAnomalies(
    values: number[],
    threshold: number = 2 // Standard deviations
  ): { anomalies: number[]; indices: number[] } {
    if (values.length < 3) {
      return { anomalies: [], indices: [] };
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: number[] = [];
    const indices: number[] = [];

    values.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push(value);
        indices.push(index);
      }
    });

    return { anomalies, indices };
  }

  /**
   * Format duration in human-readable format
   */
  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(2)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else if (milliseconds < 3600000) {
      return `${(milliseconds / 60000).toFixed(2)}m`;
    } else {
      return `${(milliseconds / 3600000).toFixed(2)}h`;
    }
  }

  /**
   * Format bytes in human-readable format
   */
  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Calculate throughput (operations per second)
   */
  static calculateThroughput(
    operationCount: number,
    timeWindowMs: number
  ): number {
    if (timeWindowMs === 0) return 0;
    return (operationCount / timeWindowMs) * 1000;
  }

  /**
   * Generate metric summary statistics
   */
  static generateSummary(values: number[]): {
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    percentiles: Record<string, number>;
  } {
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        percentiles: {}
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      count: values.length,
      sum,
      mean,
      median,
      min: Math.min(...values),
      max: Math.max(...values),
      stdDev,
      percentiles: this.calculatePercentiles(values)
    };
  }

  /**
   * Validate metric value
   */
  static validateMetricValue(value: MetricValue): Results<void> {
    try {
      if (typeof value.value !== 'number' || isNaN(value.value)) {
        return Results.fail('Metric value must be a valid number') as Results<void>;
      }

      if (!(value.timestamp instanceof Date) || isNaN(value.timestamp.getTime())) {
        return Results.fail('Metric timestamp must be a valid Date') as Results<void>;
      }

      if (value.labels) {
        for (const [key, val] of Object.entries(value.labels)) {
          if (typeof key !== 'string' || typeof val !== 'string') {
            return Results.fail('Metric labels must be string key-value pairs') as Results<void>;
          }
        }
      }

      return Results.ok();
    } catch (error) {
      return Results.fail(`Invalid metric value: ${error}`) as Results<void>;
    }
  }

  /**
   * Create time series data points
   */
  static createTimeSeries(
    startTime: Date,
    endTime: Date,
    intervalMs: number,
    valueGenerator: (timestamp: Date) => number
  ): MetricValue[] {
    const timeSeries: MetricValue[] = [];
    let currentTime = new Date(startTime);

    while (currentTime <= endTime) {
      timeSeries.push({
        value: valueGenerator(currentTime),
        timestamp: new Date(currentTime)
      });
      currentTime = new Date(currentTime.getTime() + intervalMs);
    }

    return timeSeries;
  }

  /**
   * Merge multiple metric arrays by timestamp
   */
  static mergeMetricsByTimestamp(
    ...metricArrays: MetricValue[][]
  ): MetricValue[] {
    const allMetrics = metricArrays.flat();
    return allMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Filter metrics by time range
   */
  static filterByTimeRange(
    metrics: MetricValue[],
    startTime: Date,
    endTime: Date
  ): MetricValue[] {
    return metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Downsample metrics to reduce data points
   */
  static downsample(
    metrics: MetricValue[],
    targetPoints: number,
    method: 'avg' | 'max' | 'min' | 'first' | 'last' = 'avg'
  ): MetricValue[] {
    if (metrics.length <= targetPoints) {
      return metrics;
    }

    const bucketSize = Math.ceil(metrics.length / targetPoints);
    const downsampled: MetricValue[] = [];

    for (let i = 0; i < metrics.length; i += bucketSize) {
      const bucket = metrics.slice(i, i + bucketSize);
      let value: number;
      let timestamp: Date;

      switch (method) {
        case 'avg':
          value = bucket.reduce((sum, m) => sum + m.value, 0) / bucket.length;
          timestamp = bucket[Math.floor(bucket.length / 2)].timestamp;
          break;
        case 'max':
          const maxMetric = bucket.reduce((max, m) => m.value > max.value ? m : max);
          value = maxMetric.value;
          timestamp = maxMetric.timestamp;
          break;
        case 'min':
          const minMetric = bucket.reduce((min, m) => m.value < min.value ? m : min);
          value = minMetric.value;
          timestamp = minMetric.timestamp;
          break;
        case 'first':
          value = bucket[0].value;
          timestamp = bucket[0].timestamp;
          break;
        case 'last':
          value = bucket[bucket.length - 1].value;
          timestamp = bucket[bucket.length - 1].timestamp;
          break;
      }

      downsampled.push({ value, timestamp });
    }

    return downsampled;
  }
}