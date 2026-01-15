import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { IPrometheusService } from '../types/monitoring-types';
import * as promClient from 'prom-client';

export class PrometheusService implements IPrometheusService {
  private registry: promClient.Registry;
  private metrics: Map<string, promClient.Metric<string>> = new Map();

  constructor(
    private logger: ILogger,
    private collectDefaultMetrics: boolean = true
  ) {
    this.registry = new promClient.Registry();
    
    if (this.collectDefaultMetrics) {
      promClient.collectDefaultMetrics({ register: this.registry });
    }
  }

  incrementCounter(name: string, labels?: Record<string, string>): Results<void> {
    try {
      let counter = this.metrics.get(name) as promClient.Counter<string>;
      
      if (!counter) {
        counter = new promClient.Counter({
          name,
          help: `Counter metric for ${name}`,
          labelNames: labels ? Object.keys(labels) : [],
          registers: [this.registry]
        });
        this.metrics.set(name, counter);
      }

      if (labels) {
        counter.inc(labels);
      } else {
        counter.inc();
      }

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to increment counter', name, labels, error: String(error) });
      return Results.fail(`Failed to increment counter ${name}: ${error}`) as Results<void>;
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): Results<void> {
    try {
      let gauge = this.metrics.get(name) as promClient.Gauge<string>;
      
      if (!gauge) {
        gauge = new promClient.Gauge({
          name,
          help: `Gauge metric for ${name}`,
          labelNames: labels ? Object.keys(labels) : [],
          registers: [this.registry]
        });
        this.metrics.set(name, gauge);
      }

      if (labels) {
        gauge.set(labels, value);
      } else {
        gauge.set(value);
      }

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to set gauge', name, value, labels, error: String(error) });
      return Results.fail(`Failed to set gauge ${name}: ${error}`) as Results<void>;
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): Results<void> {
    try {
      let histogram = this.metrics.get(name) as promClient.Histogram<string>;
      
      if (!histogram) {
        histogram = new promClient.Histogram({
          name,
          help: `Histogram metric for ${name}`,
          labelNames: labels ? Object.keys(labels) : [],
          registers: [this.registry]
        });
        this.metrics.set(name, histogram);
      }

      if (labels) {
        histogram.observe(labels, value);
      } else {
        histogram.observe(value);
      }

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to observe histogram', name, value, labels, error: String(error) });
      return Results.fail(`Failed to observe histogram ${name}: ${error}`) as Results<void>;
    }
  }

  recordSummary(name: string, value: number, labels?: Record<string, string>): Results<void> {
    try {
      let summary = this.metrics.get(name) as promClient.Summary<string>;
      
      if (!summary) {
        summary = new promClient.Summary({
          name,
          help: `Summary metric for ${name}`,
          labelNames: labels ? Object.keys(labels) : [],
          registers: [this.registry]
        });
        this.metrics.set(name, summary);
      }

      if (labels) {
        summary.observe(labels, value);
      } else {
        summary.observe(value);
      }

      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to record summary', name, value, labels, error: String(error) });
      return Results.fail(`Failed to record summary ${name}: ${error}`) as Results<void>;
    }
  }

  async getMetrics(): Promise<Results<string>> {
    try {
      const metrics = await this.registry.metrics();
      return Results.ok(metrics);
    } catch (error) {
      this.logger.error({ message: 'Failed to get metrics', error: String(error) });
      return Results.fail(`Failed to get metrics: ${error}`);
    }
  }

  registerCustomMetric(
    name: string, 
    help: string, 
    type: 'counter' | 'gauge' | 'histogram' | 'summary',
    labelNames?: string[]
  ): Results<void> {
    try {
      if (this.metrics.has(name)) {
        return Results.fail(`Metric ${name} already exists`) as Results<void>;
      }

      let metric: promClient.Metric<string>;

      switch (type) {
        case 'counter':
          metric = new promClient.Counter({
            name,
            help,
            labelNames: labelNames || [],
            registers: [this.registry]
          });
          break;
        case 'gauge':
          metric = new promClient.Gauge({
            name,
            help,
            labelNames: labelNames || [],
            registers: [this.registry]
          });
          break;
        case 'histogram':
          metric = new promClient.Histogram({
            name,
            help,
            labelNames: labelNames || [],
            registers: [this.registry]
          });
          break;
        case 'summary':
          metric = new promClient.Summary({
            name,
            help,
            labelNames: labelNames || [],
            registers: [this.registry]
          });
          break;
        default:
          return Results.fail(`Unsupported metric type: ${type}`) as Results<void>;
      }

      this.metrics.set(name, metric);
      this.logger.info({ message: 'Custom metric registered', name, type, help });
      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to register custom metric', name, type, error: String(error) });
      return Results.fail(`Failed to register custom metric ${name}: ${error}`) as Results<void>;
    }
  }

  getRegistry(): promClient.Registry {
    return this.registry;
  }

  clearMetrics(): Results<void> {
    try {
      this.registry.clear();
      this.metrics.clear();
      this.logger.info({ message: 'All metrics cleared' });
      return Results.ok();
    } catch (error) {
      this.logger.error({ message: 'Failed to clear metrics', error: String(error) });
      return Results.fail(`Failed to clear metrics: ${error}`) as Results<void>;
    }
  }
}