/**
 * Test isolation and cleanup utilities
 * Provides mechanisms to ensure tests run in isolation without shared state issues
 */

import { vi } from 'vitest';
import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MockFactory } from '../factories/mock-factory';

/**
 * Interface for cleanup functions
 */
export interface CleanupFunction {
  (): Promise<void> | void;
}

/**
 * Interface for resource managers
 */
export interface ResourceManager {
  name: string;
  cleanup(): Promise<void> | void;
  isActive(): boolean;
}

/**
 * Test isolation manager that handles cleanup and state reset
 */
export class TestIsolationManager {
  private cleanupFunctions: CleanupFunction[] = [];
  private resourceManagers: Map<string, ResourceManager> = new Map();
  private mockFactories: Map<string, MockFactory<any>> = new Map();
  private testingModules: TestingModule[] = [];
  private nestApplications: INestApplication[] = [];
  private timers: NodeJS.Timeout[] = [];
  private intervals: NodeJS.Timeout[] = [];
  private eventListeners: Array<{
    target: EventTarget | NodeJS.EventEmitter;
    event: string;
    listener: Function;
  }> = [];

  /**
   * Register a cleanup function to be called during test cleanup
   */
  addCleanup(cleanup: CleanupFunction): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Register a resource manager
   */
  addResourceManager(manager: ResourceManager): void {
    this.resourceManagers.set(manager.name, manager);
  }

  /**
   * Register a mock factory for state reset
   */
  addMockFactory(name: string, factory: MockFactory<any>): void {
    this.mockFactories.set(name, factory);
  }

  /**
   * Register a testing module for cleanup
   */
  addTestingModule(module: TestingModule): void {
    this.testingModules.push(module);
  }

  /**
   * Register a NestJS application for cleanup
   */
  addNestApplication(app: INestApplication): void {
    this.nestApplications.push(app);
  }

  /**
   * Register a timer for cleanup
   */
  addTimer(timer: NodeJS.Timeout): void {
    this.timers.push(timer);
  }

  /**
   * Register an interval for cleanup
   */
  addInterval(interval: NodeJS.Timeout): void {
    this.intervals.push(interval);
  }

  /**
   * Register an event listener for cleanup
   */
  addEventListener(
    target: EventTarget | NodeJS.EventEmitter,
    event: string,
    listener: Function
  ): void {
    this.eventListeners.push({ target, event, listener });
  }

  /**
   * Reset all mock factory states
   */
  async resetMockFactories(): Promise<void> {
    for (const [name, factory] of this.mockFactories) {
      try {
        factory.reset();
      } catch (error) {
        console.warn(`Failed to reset mock factory ${name}:`, error);
      }
    }
  }

  /**
   * Clean up all testing modules
   */
  async cleanupTestingModules(): Promise<void> {
    const modules = [...this.testingModules];
    this.testingModules.length = 0;

    for (const module of modules) {
      try {
        // Check if module has a close method (for compatibility with different versions)
        if (module && typeof module.close === 'function') {
          await module.close();
        }
      } catch (error) {
        console.warn('Failed to close testing module:', error);
      }
    }
  }

  /**
   * Clean up all NestJS applications
   */
  async cleanupNestApplications(): Promise<void> {
    const apps = [...this.nestApplications];
    this.nestApplications.length = 0;

    for (const app of apps) {
      try {
        await app.close();
      } catch (error) {
        console.warn('Failed to close NestJS application:', error);
      }
    }
  }

  /**
   * Clear all timers and intervals
   */
  clearTimers(): void {
    // Clear timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.length = 0;

    // Clear intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.length = 0;
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners(): void {
    for (const { target, event, listener } of this.eventListeners) {
      try {
        if ('removeEventListener' in target) {
          (target as EventTarget).removeEventListener(event, listener as any);
        } else if ('removeListener' in target) {
          (target as NodeJS.EventEmitter).removeListener(event, listener as (...args: any[]) => void);
        }
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    }
    this.eventListeners.length = 0;
  }

  /**
   * Clean up all resource managers
   */
  async cleanupResourceManagers(): Promise<void> {
    const managers = Array.from(this.resourceManagers.values());
    
    for (const manager of managers) {
      try {
        if (manager.isActive()) {
          await manager.cleanup();
        }
      } catch (error) {
        console.warn(`Failed to cleanup resource manager ${manager.name}:`, error);
      }
    }
  }

  /**
   * Run all registered cleanup functions
   */
  async runCleanupFunctions(): Promise<void> {
    const functions = [...this.cleanupFunctions];
    this.cleanupFunctions.length = 0;

    for (const cleanup of functions.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    }
  }

  /**
   * Perform complete cleanup of all resources
   */
  async cleanup(): Promise<void> {
    const cleanupTasks = [
      () => this.resetMockFactories(),
      () => this.cleanupNestApplications(),
      () => this.cleanupTestingModules(),
      () => this.cleanupResourceManagers(),
      () => this.runCleanupFunctions(),
      () => this.clearTimers(),
      () => this.removeEventListeners(),
    ];

    for (const task of cleanupTasks) {
      try {
        await task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
  }

  /**
   * Get cleanup status report
   */
  getCleanupStatus(): {
    mockFactories: number;
    testingModules: number;
    nestApplications: number;
    resourceManagers: number;
    cleanupFunctions: number;
    timers: number;
    intervals: number;
    eventListeners: number;
  } {
    return {
      mockFactories: this.mockFactories.size,
      testingModules: this.testingModules.length,
      nestApplications: this.nestApplications.length,
      resourceManagers: this.resourceManagers.size,
      cleanupFunctions: this.cleanupFunctions.length,
      timers: this.timers.length,
      intervals: this.intervals.length,
      eventListeners: this.eventListeners.length,
    };
  }

  /**
   * Check if cleanup is needed
   */
  needsCleanup(): boolean {
    const status = this.getCleanupStatus();
    return Object.values(status).some(count => count > 0);
  }

  /**
   * Clear all registrations without cleanup (for testing the manager itself)
   */
  clear(): void {
    this.cleanupFunctions.length = 0;
    this.resourceManagers.clear();
    this.mockFactories.clear();
    this.testingModules.length = 0;
    this.nestApplications.length = 0;
    this.timers.length = 0;
    this.intervals.length = 0;
    this.eventListeners.length = 0;
  }
}

/**
 * Global test isolation manager instance
 */
export const globalTestIsolation = new TestIsolationManager();

/**
 * Memory leak detector for tests
 */
export class MemoryLeakDetector {
  private initialMemory: NodeJS.MemoryUsage;
  private memorySnapshots: Array<{ timestamp: number; memory: NodeJS.MemoryUsage }> = [];
  private threshold: number;

  constructor(thresholdMB: number = 50) {
    this.threshold = thresholdMB * 1024 * 1024; // Convert MB to bytes
    this.initialMemory = process.memoryUsage();
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): NodeJS.MemoryUsage {
    const memory = process.memoryUsage();
    this.memorySnapshots.push({
      timestamp: Date.now(),
      memory,
    });
    return memory;
  }

  /**
   * Check for memory leaks
   */
  checkForLeaks(): {
    hasLeak: boolean;
    currentMemory: NodeJS.MemoryUsage;
    memoryIncrease: number;
    details: string;
  } {
    const currentMemory = process.memoryUsage();
    const memoryIncrease = currentMemory.heapUsed - this.initialMemory.heapUsed;
    const hasLeak = memoryIncrease > this.threshold;

    return {
      hasLeak,
      currentMemory,
      memoryIncrease,
      details: hasLeak
        ? `Memory increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB (threshold: ${Math.round(this.threshold / 1024 / 1024)}MB)`
        : 'No significant memory increase detected',
    };
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(): {
    trend: 'increasing' | 'decreasing' | 'stable';
    averageIncrease: number;
    snapshots: number;
  } {
    if (this.memorySnapshots.length < 2) {
      return {
        trend: 'stable',
        averageIncrease: 0,
        snapshots: this.memorySnapshots.length,
      };
    }

    const increases = [];
    for (let i = 1; i < this.memorySnapshots.length; i++) {
      const current = this.memorySnapshots[i].memory.heapUsed;
      const previous = this.memorySnapshots[i - 1].memory.heapUsed;
      increases.push(current - previous);
    }

    const averageIncrease = increases.reduce((sum, inc) => sum + inc, 0) / increases.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (averageIncrease > 1024 * 1024) { // 1MB threshold
      trend = 'increasing';
    } else if (averageIncrease < -1024 * 1024) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      averageIncrease,
      snapshots: this.memorySnapshots.length,
    };
  }

  /**
   * Reset the detector
   */
  reset(): void {
    this.initialMemory = process.memoryUsage();
    this.memorySnapshots = [];
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  }
}

/**
 * Test state isolation utilities
 */
export class TestStateIsolation {
  private static originalEnv: NodeJS.ProcessEnv = {};
  private static originalConsole: Console;
  private static mockConsole: Partial<Console> = {};

  /**
   * Isolate environment variables
   */
  static isolateEnvironment(): () => void {
    this.originalEnv = { ...process.env };
    
    return () => {
      // Restore original environment
      process.env = { ...this.originalEnv };
    };
  }

  /**
   * Isolate console output
   */
  static isolateConsole(): () => void {
    this.originalConsole = { ...console };
    
    // Create mock console methods
    this.mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    // Replace console methods
    Object.assign(console, this.mockConsole);

    return () => {
      // Restore original console
      Object.assign(console, this.originalConsole);
    };
  }

  /**
   * Get console mock calls
   */
  static getConsoleCalls(): {
    log: any[];
    error: any[];
    warn: any[];
    info: any[];
    debug: any[];
  } {
    return {
      log: (this.mockConsole.log as any)?.mock.calls || [],
      error: (this.mockConsole.error as any)?.mock.calls || [],
      warn: (this.mockConsole.warn as any)?.mock.calls || [],
      info: (this.mockConsole.info as any)?.mock.calls || [],
      debug: (this.mockConsole.debug as any)?.mock.calls || [],
    };
  }

  /**
   * Isolate global variables
   */
  static isolateGlobals(globals: string[]): () => void {
    const originalValues = new Map<string, any>();
    
    globals.forEach(globalName => {
      originalValues.set(globalName, (global as any)[globalName]);
    });

    return () => {
      // Restore original global values
      originalValues.forEach((value, globalName) => {
        if (value === undefined) {
          delete (global as any)[globalName];
        } else {
          (global as any)[globalName] = value;
        }
      });
    };
  }

  /**
   * Create isolated test context
   */
  static createIsolatedContext<T>(
    testFn: () => Promise<T> | T,
    options: {
      isolateEnv?: boolean;
      isolateConsole?: boolean;
      isolateGlobals?: string[];
      detectMemoryLeaks?: boolean;
      memoryThresholdMB?: number;
    } = {}
  ): () => Promise<T> {
    return async () => {
      const restoreFunctions: Array<() => void> = [];
      let memoryDetector: MemoryLeakDetector | undefined;

      try {
        // Set up isolations
        if (options.isolateEnv) {
          restoreFunctions.push(this.isolateEnvironment());
        }

        if (options.isolateConsole) {
          restoreFunctions.push(this.isolateConsole());
        }

        if (options.isolateGlobals?.length) {
          restoreFunctions.push(this.isolateGlobals(options.isolateGlobals));
        }

        if (options.detectMemoryLeaks) {
          memoryDetector = new MemoryLeakDetector(options.memoryThresholdMB);
        }

        // Run the test
        const result = await testFn();

        // Check for memory leaks
        if (memoryDetector) {
          const leakCheck = memoryDetector.checkForLeaks();
          if (leakCheck.hasLeak) {
            console.warn(`Potential memory leak detected: ${leakCheck.details}`);
          }
        }

        return result;
      } finally {
        // Restore all isolations in reverse order
        restoreFunctions.reverse().forEach(restore => {
          try {
            restore();
          } catch (error) {
            console.warn('Failed to restore isolation:', error);
          }
        });
      }
    };
  }
}

/**
 * Test resource manager for database connections, file handles, etc.
 */
export class TestResourceManager implements ResourceManager {
  public readonly name: string;
  private resources: Map<string, any> = new Map();
  private cleanupCallbacks: Map<string, () => Promise<void> | void> = new Map();
  private active = true;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Add a resource with cleanup callback
   */
  addResource<T>(id: string, resource: T, cleanup: () => Promise<void> | void): void {
    if (!this.active) {
      throw new Error(`Resource manager ${this.name} is not active`);
    }

    this.resources.set(id, resource);
    this.cleanupCallbacks.set(id, cleanup);
  }

  /**
   * Get a resource by ID
   */
  getResource<T>(id: string): T | undefined {
    return this.resources.get(id);
  }

  /**
   * Remove a specific resource
   */
  async removeResource(id: string): Promise<void> {
    const cleanup = this.cleanupCallbacks.get(id);
    if (cleanup) {
      try {
        await cleanup();
      } catch (error) {
        console.warn(`Failed to cleanup resource ${id}:`, error);
      }
    }

    this.resources.delete(id);
    this.cleanupCallbacks.delete(id);
  }

  /**
   * Check if manager is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get resource count
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * List all resource IDs
   */
  getResourceIds(): string[] {
    return Array.from(this.resources.keys());
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    if (!this.active) {
      return;
    }

    const cleanupPromises = Array.from(this.cleanupCallbacks.entries()).map(
      async ([id, cleanup]) => {
        try {
          await cleanup();
        } catch (error) {
          console.warn(`Failed to cleanup resource ${id}:`, error);
        }
      }
    );

    await Promise.all(cleanupPromises);

    this.resources.clear();
    this.cleanupCallbacks.clear();
    this.active = false;
  }
}

/**
 * Utility functions for test isolation
 */
export class TestIsolationUtils {
  /**
   * Create a test wrapper with automatic cleanup
   */
  static withCleanup<T>(
    testFn: (isolation: TestIsolationManager) => Promise<T> | T
  ): () => Promise<T> {
    return async () => {
      const isolation = new TestIsolationManager();
      
      try {
        return await testFn(isolation);
      } finally {
        await isolation.cleanup();
      }
    };
  }

  /**
   * Create a test wrapper with memory leak detection
   */
  static withMemoryLeakDetection<T>(
    testFn: () => Promise<T> | T,
    thresholdMB: number = 50
  ): () => Promise<T> {
    return async () => {
      const detector = new MemoryLeakDetector(thresholdMB);
      
      try {
        const result = await testFn();
        
        const leakCheck = detector.checkForLeaks();
        if (leakCheck.hasLeak) {
          throw new Error(`Memory leak detected: ${leakCheck.details}`);
        }
        
        return result;
      } finally {
        // Force garbage collection if available
        detector.forceGarbageCollection();
      }
    };
  }

  /**
   * Create a test wrapper with timeout
   */
  static withTimeout<T>(
    testFn: () => Promise<T> | T,
    timeoutMs: number
  ): () => Promise<T> {
    return async () => {
      return new Promise<T>(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Test timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        try {
          const result = await testFn();
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    };
  }

  /**
   * Create a test wrapper with retry logic
   */
  static withRetry<T>(
    testFn: () => Promise<T> | T,
    maxRetries: number = 3,
    delayMs: number = 100
  ): () => Promise<T> {
    return async () => {
      let lastError: Error | undefined;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await testFn();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
          }
        }
      }
      
      throw new Error(`Test failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    };
  }

  /**
   * Combine multiple test wrappers
   */
  static combine<T>(...wrappers: Array<(fn: () => Promise<T>) => () => Promise<T>>): (fn: () => Promise<T>) => () => Promise<T> {
    return (testFn: () => Promise<T>) => {
      return wrappers.reduce((wrappedFn, wrapper) => wrapper(wrappedFn), testFn);
    };
  }
}