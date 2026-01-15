import { describe, it, expect } from 'vitest';
import { MetricUtils } from '../metric-utils';
import { MetricValue } from '../../types/monitoring-types';

describe('MetricUtils', () => {
  describe('calculatePercentiles', () => {
    it('should calculate percentiles correctly for a set of values', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = MetricUtils.calculatePercentiles(values, [50, 90, 95]);
      
      expect(result).toEqual({
        p50: 5,
        p90: 9,
        p95: 10
      });
    });

    it('should handle empty arrays', () => {
      const values: number[] = [];
      const result = MetricUtils.calculatePercentiles(values, [50, 90]);
      
      expect(result).toEqual({
        p50: 0,
        p90: 0
      });
    });

    it('should handle single value arrays', () => {
      const values = [42];
      const result = MetricUtils.calculatePercentiles(values, [50, 90]);
      
      expect(result).toEqual({
        p50: 42,
        p90: 42
      });
    });

    it('should use default percentiles when none provided', () => {
      const values = [1, 2, 3, 4, 5];
      const result = MetricUtils.calculatePercentiles(values);
      
      expect(result).toHaveProperty('p50');
      expect(result).toHaveProperty('p90');
      expect(result).toHaveProperty('p95');
      expect(result).toHaveProperty('p99');
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const windowSize = 3;
      const result = MetricUtils.calculateMovingAverage(values, windowSize);
      
      expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should return original values when window size is larger than array', () => {
      const values = [1, 2, 3];
      const windowSize = 5;
      const result = MetricUtils.calculateMovingAverage(values, windowSize);
      
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle empty arrays', () => {
      const values: number[] = [];
      const windowSize = 3;
      const result = MetricUtils.calculateMovingAverage(values, windowSize);
      
      expect(result).toEqual([]);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(MetricUtils.formatDuration(1000)).toBe('1.00s');
      expect(MetricUtils.formatDuration(1500)).toBe('1.50s');
      expect(MetricUtils.formatDuration(500)).toBe('500.00ms');
    });

    it('should handle zero duration', () => {
      expect(MetricUtils.formatDuration(0)).toBe('0.00ms');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(MetricUtils.formatBytes(1024)).toBe('1.00 KB');
      expect(MetricUtils.formatBytes(1048576)).toBe('1.00 MB');
      expect(MetricUtils.formatBytes(500)).toBe('500.00 B');
    });

    it('should handle zero bytes', () => {
      expect(MetricUtils.formatBytes(0)).toBe('0.00 B');
    });
  });

  describe('calculateRate', () => {
    it('should calculate rate between two metric values', () => {
      const earlier: MetricValue = {
        value: 100,
        timestamp: new Date('2024-01-01T00:00:00Z')
      };
      
      const later: MetricValue = {
        value: 200,
        timestamp: new Date('2024-01-01T00:01:00Z') // 1 minute later
      };

      const rate = MetricUtils.calculateRate(later, earlier);
      expect(rate).toBeCloseTo(1.67, 1); // ~100 per 60 seconds ≈ 1.67 per second
    });

    it('should handle zero time difference', () => {
      const metric1: MetricValue = {
        value: 100,
        timestamp: new Date('2024-01-01T00:00:00Z')
      };
      
      const metric2: MetricValue = {
        value: 200,
        timestamp: new Date('2024-01-01T00:00:00Z')
      };

      const rate = MetricUtils.calculateRate(metric2, metric1);
      expect(rate).toBe(0);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary statistics', () => {
      const values = [1, 2, 3, 4, 5];
      const summary = MetricUtils.generateSummary(values);
      
      expect(summary.count).toBe(5);
      expect(summary.sum).toBe(15);
      expect(summary.mean).toBe(3);
      expect(summary.min).toBe(1);
      expect(summary.max).toBe(5);
    });

    it('should handle empty arrays', () => {
      const values: number[] = [];
      const summary = MetricUtils.generateSummary(values);
      
      expect(summary.count).toBe(0);
      expect(summary.sum).toBe(0);
      expect(summary.mean).toBe(0);
      expect(summary.min).toBe(0);
      expect(summary.max).toBe(0);
    });
  });

  describe('validateMetricValue', () => {
    it('should validate correct metric values', () => {
      const validMetric: MetricValue = {
        value: 42,
        timestamp: new Date()
      };

      const result = MetricUtils.validateMetricValue(validMetric);
      expect(result.isOk).toBe(true);
    });

    it('should reject invalid metric values', () => {
      const invalidMetric: MetricValue = {
        value: NaN,
        timestamp: new Date()
      };

      const result = MetricUtils.validateMetricValue(invalidMetric);
      expect(result.isOk).toBe(false);
    });
  });
});
