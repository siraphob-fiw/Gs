/**
 * Tests for test isolation and cleanup mechanisms
 * Verifies proper cleanup and isolation between test runs
 */

import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import {
  TestIsolationManager,
  MemoryLeakDetector,
  TestStateIsolation,
  TestResourceManager,
  TestIsolationUtils,
  globalTestIsolation,
} from '../test-isolation';
import { MockFactory, BaseMockFactory } from '../../factories/mock-factory';
import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('TestIsolationManager', () => {
  let isolationManager: TestIsolationManager;

  beforeEach(() => {
    isolationManager = new TestIsolationManager();
  });

  afterEach(async () => {
    await isolationManager.cleanup();
  });

  describe('cleanup function management', () => {
    it('should register and execute cleanup functions', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const asyncCleanup = vi.fn().mockResolvedValue(undefined);

      isolationManager.addCleanup(cleanup1);
      isolationManager.addCleanup(cleanup2);
      isolationManager.addCleanup(asyncCleanup);

      await isolationManager.cleanup();

      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
      expect(asyncCleanup).toHaveBeenCalled();
    });

    it('should execute cleanup functions in reverse order', async () => {
      const executionOrder: number[] = [];
      
      isolationManager.addCleanup(() => executionOrder.push(1));
      isolationManager.addCleanup(() => executionOrder.push(2));
      isolationManager.addCleanup(() => executionOrder.push(3));

      await isolationManager.cleanup();

      expect(executionOrder).toEqual([3, 2, 1]);
    });

    it('should handle cleanup function errors gracefully', async () => {
      const workingCleanup = vi.fn();
      const failingCleanup = vi.fn().mockRejectedValue(new Error('Cleanup failed'));
      const anotherWorkingCleanup = vi.fn();

      isolationManager.addCleanup(workingCleanup);
      isolationManager.addCleanup(failingCleanup);
      isolationManager.addCleanup(anotherWorkingCleanup);

      // Should not throw despite failing cleanup
      await expect(isolationManager.cleanup()).resolves.not.toThrow();

      expect(workingCleanup).toHaveBeenCalled();
      expect(failingCleanup).toHaveBeenCalled();
      expect(anotherWorkingCleanup).toHaveBeenCalled();
    });
  });

  describe('mock factory management', () => {
    it('should reset all registered mock factories', async () => {
      class TestMockFactory extends BaseMockFactory<{ id: string }> {
        create() {
          return { id: `test-${this.nextSequence()}` };
        }
      }

      const factory1 = new TestMockFactory();
      const factory2 = new TestMockFactory();

      // Generate some data to advance sequence
      factory1.create();
      factory1.create();
      factory2.create();

      isolationManager.addMockFactory('factory1', factory1);
      isolationManager.addMockFactory('factory2', factory2);

      // Verify sequences are advanced
      expect(factory1.create().id).toBe('test-3');
      expect(factory2.create().id).toBe('test-2');

      await isolationManager.resetMockFactories();

      // Verify sequences are reset
      expect(factory1.create().id).toBe('test-1');
      expect(factory2.create().id).toBe('test-1');
    });

    it('should handle mock factory reset errors gracefully', async () => {
      const workingFactory = {
        reset: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
      };

      const failingFactory = {
        reset: vi.fn().mockImplementation(() => {
          throw new Error('Reset failed');
        }),
        create: vi.fn(),
        createMany: vi.fn(),
      };

      isolationManager.addMockFactory('working', workingFactory);
      isolationManager.addMockFactory('failing', failingFactory);

      await expect(isolationManager.resetMockFactories()).resolves.not.toThrow();

      expect(workingFactory.reset).toHaveBeenCalled();
      expect(failingFactory.reset).toHaveBeenCalled();
    });
  });

  describe('testing module management', () => {
    it('should close all registered testing modules', async () => {
      const module1 = { close: vi.fn().mockResolvedValue(undefined) } as unknown as TestingModule;
      const module2 = { close: vi.fn().mockResolvedValue(undefined) } as unknown as TestingModule;

      isolationManager.addTestingModule(module1);
      isolationManager.addTestingModule(module2);

      await isolationManager.cleanupTestingModules();

      expect(module1.close).toHaveBeenCalled();
      expect(module2.close).toHaveBeenCalled();
    });

    it('should handle module close errors gracefully', async () => {
      const workingModule = { close: vi.fn().mockResolvedValue(undefined) } as unknown as TestingModule;
      const failingModule = { close: vi.fn().mockRejectedValue(new Error('Close failed')) } as unknown as TestingModule;

      isolationManager.addTestingModule(workingModule);
      isolationManager.addTestingModule(failingModule);

      await expect(isolationManager.cleanupTestingModules()).resolves.not.toThrow();

      expect(workingModule.close).toHaveBeenCalled();
      expect(failingModule.close).toHaveBeenCalled();
    });
  });

  describe('NestJS application management', () => {
    it('should close all registered applications', async () => {
      const app1 = { close: vi.fn().mockResolvedValue(undefined) } as unknown as INestApplication;
      const app2 = { close: vi.fn().mockResolvedValue(undefined) } as unknown as INestApplication;

      isolationManager.addNestApplication(app1);
      isolationManager.addNestApplication(app2);

      await isolationManager.cleanupNestApplications();

      expect(app1.close).toHaveBeenCalled();
      expect(app2.close).toHaveBeenCalled();
    });
  });

  describe('timer management', () => {
    it('should clear all registered timers and intervals', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const timer1 = setTimeout(() => {}, 1000) as NodeJS.Timeout;
      const timer2 = setTimeout(() => {}, 2000) as NodeJS.Timeout;
      const interval1 = setInterval(() => {}, 1000) as NodeJS.Timeout;
      const interval2 = setInterval(() => {}, 2000) as NodeJS.Timeout;

      isolationManager.addTimer(timer1);
      isolationManager.addTimer(timer2);
      isolationManager.addInterval(interval1);
      isolationManager.addInterval(interval2);

      isolationManager.clearTimers();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timer1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timer2);
      expect(clearIntervalSpy).toHaveBeenCalledWith(interval1);
      expect(clearIntervalSpy).toHaveBeenCalledWith(interval2);

      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('resource manager integration', () => {
    it('should cleanup all resource managers', async () => {
      const manager1 = {
        name: 'manager1',
        cleanup: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true),
      };

      const manager2 = {
        name: 'manager2',
        cleanup: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true),
      };

      isolationManager.addResourceManager(manager1);
      isolationManager.addResourceManager(manager2);

      await isolationManager.cleanupResourceManagers();

      expect(manager1.cleanup).toHaveBeenCalled();
      expect(manager2.cleanup).toHaveBeenCalled();
    });

    it('should skip inactive resource managers', async () => {
      const activeManager = {
        name: 'active',
        cleanup: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true),
      };

      const inactiveManager = {
        name: 'inactive',
        cleanup: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(false),
      };

      isolationManager.addResourceManager(activeManager);
      isolationManager.addResourceManager(inactiveManager);

      await isolationManager.cleanupResourceManagers();

      expect(activeManager.cleanup).toHaveBeenCalled();
      expect(inactiveManager.cleanup).not.toHaveBeenCalled();
    });
  });

  describe('cleanup status reporting', () => {
    it('should report accurate cleanup status', () => {
      const mockFactory = { reset: vi.fn(), create: vi.fn(), createMany: vi.fn() };
      const module = { close: vi.fn() } as unknown as TestingModule;
      const app = { close: vi.fn() } as unknown as INestApplication;
      const manager = { name: 'test', cleanup: vi.fn(), isActive: vi.fn() };
      const timer = setTimeout(() => {}, 1000) as NodeJS.Timeout;
      const interval = setInterval(() => {}, 1000) as NodeJS.Timeout;

      isolationManager.addMockFactory('test', mockFactory);
      isolationManager.addTestingModule(module);
      isolationManager.addNestApplication(app);
      isolationManager.addResourceManager(manager);
      isolationManager.addCleanup(() => {});
      isolationManager.addTimer(timer);
      isolationManager.addInterval(interval);

      const status = isolationManager.getCleanupStatus();

      expect(status).toEqual({
        mockFactories: 1,
        testingModules: 1,
        nestApplications: 1,
        resourceManagers: 1,
        cleanupFunctions: 1,
        timers: 1,
        intervals: 1,
        eventListeners: 0,
      });

      expect(isolationManager.needsCleanup()).toBe(true);

      // Clear timers to prevent them from running
      clearTimeout(timer);
      clearInterval(interval);
    });

    it('should indicate when no cleanup is needed', () => {
      const status = isolationManager.getCleanupStatus();
      
      expect(Object.values(status).every(count => count === 0)).toBe(true);
      expect(isolationManager.needsCleanup()).toBe(false);
    });
  });
});

describe('MemoryLeakDetector', () => {
  let detector: MemoryLeakDetector;

  beforeEach(() => {
    detector = new MemoryLeakDetector(10); // 10MB threshold
  });

  it('should detect memory usage changes', () => {
    const initialCheck = detector.checkForLeaks();
    expect(initialCheck.hasLeak).toBe(false);
    expect(initialCheck.memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('should take memory snapshots', () => {
    const snapshot1 = detector.takeSnapshot();
    const snapshot2 = detector.takeSnapshot();

    expect(snapshot1).toHaveProperty('heapUsed');
    expect(snapshot2).toHaveProperty('heapUsed');
    expect(typeof snapshot1.heapUsed).toBe('number');
    expect(typeof snapshot2.heapUsed).toBe('number');
  });

  it('should analyze memory trends', () => {
    // Take initial snapshots
    detector.takeSnapshot();
    detector.takeSnapshot();
    detector.takeSnapshot();

    const trend = detector.getMemoryTrend();
    
    expect(trend).toHaveProperty('trend');
    expect(trend).toHaveProperty('averageIncrease');
    expect(trend).toHaveProperty('snapshots');
    expect(['increasing', 'decreasing', 'stable']).toContain(trend.trend);
    expect(trend.snapshots).toBe(3);
  });

  it('should reset properly', () => {
    detector.takeSnapshot();
    detector.takeSnapshot();
    
    detector.reset();
    
    const trend = detector.getMemoryTrend();
    expect(trend.snapshots).toBe(0);
  });
});

describe('TestStateIsolation', () => {
  describe('environment isolation', () => {
    it('should isolate and restore environment variables', () => {
      const originalValue = process.env.TEST_VAR;
      process.env.TEST_VAR = 'original';

      const restore = TestStateIsolation.isolateEnvironment();
      
      process.env.TEST_VAR = 'modified';
      expect(process.env.TEST_VAR).toBe('modified');

      restore();
      
      expect(process.env.TEST_VAR).toBe('original');
      
      // Cleanup
      if (originalValue === undefined) {
        delete process.env.TEST_VAR;
      } else {
        process.env.TEST_VAR = originalValue;
      }
    });
  });

  describe('console isolation', () => {
    it('should isolate and restore console methods', () => {
      const originalLog = console.log;
      
      const restore = TestStateIsolation.isolateConsole();
      
      console.log('test message');
      
      const calls = TestStateIsolation.getConsoleCalls();
      expect(calls.log).toHaveLength(1);
      expect(calls.log[0]).toEqual(['test message']);

      restore();
      
      expect(console.log).toBe(originalLog);
    });
  });

  describe('global isolation', () => {
    it('should isolate and restore global variables', () => {
      (global as any).testGlobal = 'original';
      
      const restore = TestStateIsolation.isolateGlobals(['testGlobal']);
      
      (global as any).testGlobal = 'modified';
      expect((global as any).testGlobal).toBe('modified');

      restore();
      
      expect((global as any).testGlobal).toBe('original');
      
      // Cleanup
      delete (global as any).testGlobal;
    });
  });

  describe('isolated context', () => {
    it('should create isolated test context', async () => {
      process.env.TEST_CONTEXT = 'original';
      
      const isolatedTest = TestStateIsolation.createIsolatedContext(
        () => {
          process.env.TEST_CONTEXT = 'modified';
          return 'test result';
        },
        { isolateEnv: true }
      );

      const result = await isolatedTest();
      
      expect(result).toBe('test result');
      expect(process.env.TEST_CONTEXT).toBe('original');
      
      // Cleanup
      delete process.env.TEST_CONTEXT;
    });

    it('should handle async test functions', async () => {
      const isolatedTest = TestStateIsolation.createIsolatedContext(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async result';
        }
      );

      const result = await isolatedTest();
      expect(result).toBe('async result');
    });
  });
});

describe('TestResourceManager', () => {
  let resourceManager: TestResourceManager;

  beforeEach(() => {
    resourceManager = new TestResourceManager('test-manager');
  });

  afterEach(async () => {
    if (resourceManager.isActive()) {
      await resourceManager.cleanup();
    }
  });

  it('should manage resources with cleanup callbacks', async () => {
    const resource = { data: 'test' };
    const cleanup = vi.fn().mockResolvedValue(undefined);

    resourceManager.addResource('test-resource', resource, cleanup);

    expect(resourceManager.getResource('test-resource')).toBe(resource);
    expect(resourceManager.getResourceCount()).toBe(1);
    expect(resourceManager.getResourceIds()).toEqual(['test-resource']);

    await resourceManager.cleanup();

    expect(cleanup).toHaveBeenCalled();
    expect(resourceManager.getResourceCount()).toBe(0);
    expect(resourceManager.isActive()).toBe(false);
  });

  it('should remove individual resources', async () => {
    const resource1 = { data: 'test1' };
    const resource2 = { data: 'test2' };
    const cleanup1 = vi.fn().mockResolvedValue(undefined);
    const cleanup2 = vi.fn().mockResolvedValue(undefined);

    resourceManager.addResource('resource1', resource1, cleanup1);
    resourceManager.addResource('resource2', resource2, cleanup2);

    expect(resourceManager.getResourceCount()).toBe(2);

    await resourceManager.removeResource('resource1');

    expect(cleanup1).toHaveBeenCalled();
    expect(cleanup2).not.toHaveBeenCalled();
    expect(resourceManager.getResourceCount()).toBe(1);
    expect(resourceManager.getResource('resource1')).toBeUndefined();
    expect(resourceManager.getResource('resource2')).toBe(resource2);
  });

  it('should handle cleanup errors gracefully', async () => {
    const resource = { data: 'test' };
    const failingCleanup = vi.fn().mockRejectedValue(new Error('Cleanup failed'));

    resourceManager.addResource('test-resource', resource, failingCleanup);

    await expect(resourceManager.cleanup()).resolves.not.toThrow();
    expect(failingCleanup).toHaveBeenCalled();
  });

  it('should prevent adding resources when inactive', async () => {
    await resourceManager.cleanup();

    expect(() => {
      resourceManager.addResource('test', {}, () => {});
    }).toThrow('Resource manager test-manager is not active');
  });
});

describe('TestIsolationUtils', () => {
  describe('withCleanup', () => {
    it('should provide isolation manager and cleanup automatically', async () => {
      let capturedIsolation: TestIsolationManager | undefined;
      const cleanup = vi.fn();

      const testFn = TestIsolationUtils.withCleanup(async (isolation) => {
        capturedIsolation = isolation;
        isolation.addCleanup(cleanup);
        return 'test result';
      });

      const result = await testFn();

      expect(result).toBe('test result');
      expect(capturedIsolation).toBeInstanceOf(TestIsolationManager);
      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe('withMemoryLeakDetection', () => {
    it('should detect memory leaks', async () => {
      const testFn = TestIsolationUtils.withMemoryLeakDetection(
        () => {
          // Simulate memory allocation (this won't actually cause a leak in this test)
          return 'test result';
        },
        50 // 50MB threshold - reasonable for normal test execution
      );

      // This should not throw in normal circumstances
      const result = await testFn();
      expect(result).toBe('test result');
    });
  });

  describe('withTimeout', () => {
    it('should complete within timeout', async () => {
      const testFn = TestIsolationUtils.withTimeout(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'completed';
        },
        100
      );

      const result = await testFn();
      expect(result).toBe('completed');
    });

    it('should timeout for slow operations', async () => {
      const testFn = TestIsolationUtils.withTimeout(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'should not complete';
        },
        10
      );

      await expect(testFn()).rejects.toThrow('Test timed out after 10ms');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const testFn = TestIsolationUtils.withRetry(
        () => 'success',
        3
      );

      const result = await testFn();
      expect(result).toBe('success');
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const testFn = TestIsolationUtils.withRetry(
        () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Not ready yet');
          }
          return 'success after retries';
        },
        3,
        1 // 1ms delay
      );

      const result = await testFn();
      expect(result).toBe('success after retries');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      const testFn = TestIsolationUtils.withRetry(
        () => {
          throw new Error('Always fails');
        },
        2,
        1
      );

      await expect(testFn()).rejects.toThrow('Test failed after 2 attempts');
    });
  });

  describe('combine', () => {
    it('should combine multiple wrappers', async () => {
      const logs: string[] = [];

      const wrapper1 = (fn: () => Promise<string>) => async () => {
        logs.push('wrapper1 start');
        const result = await fn();
        logs.push('wrapper1 end');
        return result;
      };

      const wrapper2 = (fn: () => Promise<string>) => async () => {
        logs.push('wrapper2 start');
        const result = await fn();
        logs.push('wrapper2 end');
        return result;
      };

      const combinedWrapper = TestIsolationUtils.combine(wrapper1, wrapper2);
      
      const testFn = combinedWrapper(async () => {
        logs.push('test execution');
        return 'test result';
      });

      const result = await testFn();

      expect(result).toBe('test result');
      expect(logs).toEqual([
        'wrapper2 start',
        'wrapper1 start',
        'test execution',
        'wrapper1 end',
        'wrapper2 end',
      ]);
    });
  });
});

describe('Global Test Isolation', () => {
  it('should provide a global isolation manager instance', () => {
    expect(globalTestIsolation).toBeInstanceOf(TestIsolationManager);
  });

  it('should maintain state across multiple accesses', () => {
    const cleanup = vi.fn();
    globalTestIsolation.addCleanup(cleanup);

    expect(globalTestIsolation.needsCleanup()).toBe(true);
    
    // Cleanup for next tests
    globalTestIsolation.clear();
  });
});