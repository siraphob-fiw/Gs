import { Logger } from '@strengthos/shared-logging';
import { consoleLogService } from './console-logger';

const logger = new Logger(consoleLogService);

// Simple client-side monitoring service
class ClientMonitoringService {
  private serviceName: string;
  private environment: string;

  constructor(config: { serviceName: string; environment: string }) {
    this.serviceName = config.serviceName;
    this.environment = config.environment;
  }

  recordMetric(name: string, value: number, type: string, labels?: Record<string, any>): void {
    // In a real implementation, this would send to a monitoring service
    // console.log(`[METRIC] ${name}: ${value} (${type})`, labels);
  }

  async trace<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, any>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await operation();
      return result;
    } catch (error) {
      throw error;
    }
  }
}

// Create monitoring service instance
export const monitoringService = new ClientMonitoringService({
  serviceName: 'sos-web-training',
  environment: process.env.NODE_ENV || 'development',
});

// Metric types enum
export enum MetricType {
  COUNTER = 'counter',
  HISTOGRAM = 'histogram',
  GAUGE = 'gauge',
}

// Custom metrics for the training app
export const TrainingMetrics = {
  // User interaction metrics
  WORKOUT_STARTED: 'workout_started_total',
  WORKOUT_COMPLETED: 'workout_completed_total',
  EXERCISE_PERFORMED: 'exercise_performed_total',

  // Performance metrics
  PAGE_LOAD_TIME: 'page_load_duration_seconds',
  API_REQUEST_DURATION: 'api_request_duration_seconds',
  API_REQUEST_ERRORS: 'api_request_errors_total',

  // Feature usage metrics
  PROGRAM_GENERATED: 'program_generated_total',
  TEMPLATE_CUSTOMIZED: 'template_customized_total',
  PREFERENCES_UPDATED: 'preferences_updated_total',
} as const;

// Helper functions for common monitoring patterns
export const MonitoringHelpers = {
  /**
   * Track API request performance
   */
  async trackApiRequest<T>(
    endpoint: string,
    method: string,
    requestFn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    const labels = { endpoint, method };

    try {
      const result = await requestFn();

      // Record successful request
      const duration = (Date.now() - startTime) / 1000;
      monitoringService.recordMetric(
        TrainingMetrics.API_REQUEST_DURATION,
        duration,
        MetricType.HISTOGRAM,
        { ...labels, status: 'success' },
      );

      return result;
    } catch (error) {
      // Record failed request
      const duration = (Date.now() - startTime) / 1000;
      monitoringService.recordMetric(
        TrainingMetrics.API_REQUEST_DURATION,
        duration,
        MetricType.HISTOGRAM,
        { ...labels, status: 'error' },
      );

      monitoringService.recordMetric(TrainingMetrics.API_REQUEST_ERRORS, 1, MetricType.COUNTER, {
        ...labels,
        error: error instanceof Error ? error.message : 'unknown',
      });

      throw error;
    }
  },

  /**
   * Track page load performance
   */
  trackPageLoad(pageName: string, loadTime: number): void {
    monitoringService.recordMetric(
      TrainingMetrics.PAGE_LOAD_TIME,
      loadTime / 1000,
      MetricType.HISTOGRAM,
      { page: pageName },
    );
  },

  /**
   * Track user workout actions
   */
  trackWorkoutStarted(workoutId: string, userId: string): void {
    monitoringService.recordMetric(TrainingMetrics.WORKOUT_STARTED, 1, MetricType.COUNTER, {
      workout_id: workoutId,
      user_id: userId,
    });
  },

  trackWorkoutCompleted(workoutId: string, userId: string, duration: number): void {
    monitoringService.recordMetric(TrainingMetrics.WORKOUT_COMPLETED, 1, MetricType.COUNTER, {
      workout_id: workoutId,
      user_id: userId,
    });
  },

  trackExercisePerformed(exerciseId: string, userId: string): void {
    monitoringService.recordMetric(TrainingMetrics.EXERCISE_PERFORMED, 1, MetricType.COUNTER, {
      exercise_id: exerciseId,
      user_id: userId,
    });
  },

  /**
   * Track feature usage
   */
  trackProgramGenerated(templateId: string, userId: string): void {
    monitoringService.recordMetric(TrainingMetrics.PROGRAM_GENERATED, 1, MetricType.COUNTER, {
      template_id: templateId,
      user_id: userId,
    });
  },

  trackTemplateCustomized(templateId: string, userId: string): void {
    monitoringService.recordMetric(TrainingMetrics.TEMPLATE_CUSTOMIZED, 1, MetricType.COUNTER, {
      template_id: templateId,
      user_id: userId,
    });
  },

  trackPreferencesUpdated(preferenceType: string, userId: string): void {
    monitoringService.recordMetric(TrainingMetrics.PREFERENCES_UPDATED, 1, MetricType.COUNTER, {
      preference_type: preferenceType,
      user_id: userId,
    });
  },

  /**
   * Create a custom trace for complex operations
   */
  async traceOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number>,
  ): Promise<T> {
    return monitoringService.trace(operationName, operation, attributes);
  },

  /**
   * Log an error with monitoring context
   */
  async logError(error: Error, context?: Record<string, any>): Promise<void> {
    await logger.error({
      message: error.message,
      fullMessage: JSON.stringify({
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    });

    // Also record as a metric
    monitoringService.recordMetric('application_errors_total', 1, MetricType.COUNTER, {
      error_type: error.constructor.name,
      ...context,
    });
  },
};

export default monitoringService;
