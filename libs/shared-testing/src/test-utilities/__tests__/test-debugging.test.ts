/**
 * Tests for test debugging and error handling utilities
 */

import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import {
  TestErrorHandler,
  TestErrorCategory,
  TestErrorSeverity,
  TestDebuggingUtils,
  EnhancedExpectation,
  globalTestErrorHandler,
  configureTestDebugging,
} from '../test-debugging';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

// Mock fs functions
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

describe('TestErrorHandler', () => {
  let errorHandler: TestErrorHandler;

  beforeEach(() => {
    errorHandler = new TestErrorHandler('./test-output');
    vi.clearAllMocks();
  });

  afterEach(() => {
    errorHandler.clear();
  });

  describe('error handling', () => {
    it('should handle and categorize errors correctly', () => {
      const error = new Error('Test timeout exceeded');
      const context = {
        testName: 'sample test',
        testFile: 'sample.test.ts',
      };

      const testError = errorHandler.handleError(error, context);

      expect(testError.category).toBe(TestErrorCategory.TIMEOUT);
      expect(testError.severity).toBe(TestErrorSeverity.HIGH);
      expect(testError.message).toBe('Test timeout exceeded');
      expect(testError.context.testName).toBe('sample test');
      expect(testError.suggestions.length).toBeGreaterThan(0);
    });

    it('should categorize setup errors as critical', () => {
      const error = new Error('beforeEach setup failed');
      const testError = errorHandler.handleError(error);

      expect(testError.category).toBe(TestErrorCategory.SETUP);
      expect(testError.severity).toBe(TestErrorSeverity.CRITICAL);
    });

    it('should categorize mock errors correctly', () => {
      const error = new Error('Mock expectation failed');
      const testError = errorHandler.handleError(error);

      expect(testError.category).toBe(TestErrorCategory.MOCK);
      expect(testError.severity).toBe(TestErrorSeverity.MEDIUM);
    });

    it('should categorize assertion errors correctly', () => {
      const error = new Error('Expected value to be true');
      const testError = errorHandler.handleError(error);

      expect(testError.category).toBe(TestErrorCategory.ASSERTION);
      expect(testError.severity).toBe(TestErrorSeverity.MEDIUM);
    });

    it('should generate appropriate suggestions for timeout errors', () => {
      const error = new Error('Test timeout exceeded');
      const testError = errorHandler.handleError(error);

      expect(testError.suggestions.some(s => s.includes('Increase test timeout'))).toBe(true);
      expect(testError.suggestions.some(s => s.includes('infinite loops'))).toBe(true);
    });

    it('should generate appropriate suggestions for memory errors', () => {
      const error = new Error('Out of memory');
      const testError = errorHandler.handleError(error);

      expect(testError.category).toBe(TestErrorCategory.MEMORY);
      expect(testError.suggestions.some(s => s.includes('memory leaks'))).toBe(true);
    });

    it('should save error reports to file', () => {
      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(writeFileSync).toHaveBeenCalled();
      const writeCall = (writeFileSync as any).mock.calls[0];
      expect(writeCall[0]).toContain('.json');
      expect(writeCall[1]).toContain('Test error');
    });
  });

  describe('mock failure handling', () => {
    it('should handle mock expectation failures', () => {
      const mockFailure = {
        mockName: 'userService',
        method: 'getUser',
        expectedCalls: 1,
        actualCalls: 0,
        expectedArgs: [123],
        actualArgs: [],
        suggestions: ['Check if the method is called in the test'],
      };

      const testError = errorHandler.handleMockFailure(mockFailure);

      expect(testError.category).toBe(TestErrorCategory.MOCK);
      expect(testError.message).toContain('userService.getUser');
      expect(testError.message).toContain('expected 1 calls, received 0');
      expect(testError.context.customData?.mockFailure).toEqual(mockFailure);
    });
  });

  describe('debug sessions', () => {
    it('should start and end debug sessions', () => {
      const sessionId = errorHandler.startDebugSession('test name', 'unit');

      expect(sessionId).toMatch(/^debug_\d+_[a-z0-9]+$/);

      errorHandler.endDebugSession(sessionId);

      expect(writeFileSync).toHaveBeenCalled();
      const writeCall = (writeFileSync as any).mock.calls[0];
      expect(writeCall[0]).toContain(`debug_${sessionId}.json`);
    });

    it('should add debug logs to sessions', () => {
      const sessionId = errorHandler.startDebugSession('test name', 'unit');

      errorHandler.addDebugLog(sessionId, 'info', 'Test message', { data: 'test' });
      errorHandler.addDebugLog(sessionId, 'error', 'Error message');

      errorHandler.endDebugSession(sessionId);

      expect(writeFileSync).toHaveBeenCalled();
      const sessionData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(sessionData.logs).toHaveLength(2);
      expect(sessionData.logs[0].message).toBe('Test message');
      expect(sessionData.logs[1].level).toBe('error');
    });

    it('should set debug variables', () => {
      const sessionId = errorHandler.startDebugSession('test name', 'unit');

      errorHandler.setDebugVariable(sessionId, 'testVar', 'testValue');
      errorHandler.setDebugVariable(sessionId, 'numberVar', 42);

      errorHandler.endDebugSession(sessionId);

      const sessionData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(sessionData.variables.testVar).toBe('testValue');
      expect(sessionData.variables.numberVar).toBe(42);
    });

    it('should track call stack', () => {
      const sessionId = errorHandler.startDebugSession('test name', 'unit');

      errorHandler.addToCallStack(sessionId, 'function1');
      errorHandler.addToCallStack(sessionId, 'function2');

      errorHandler.endDebugSession(sessionId);

      const sessionData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(sessionData.callStack).toEqual(['function1', 'function2']);
    });
  });

  describe('error statistics', () => {
    it('should generate error statistics', () => {
      // Create different types of errors
      errorHandler.handleError(new Error('timeout error'));
      errorHandler.handleError(new Error('mock failed'));
      errorHandler.handleError(new Error('expect assertion failed'));
      errorHandler.handleError(new Error('another timeout error'));

      const stats = errorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByCategory[TestErrorCategory.TIMEOUT]).toBe(2);
      expect(stats.errorsByCategory[TestErrorCategory.MOCK]).toBe(1);
      expect(stats.errorsByCategory[TestErrorCategory.ASSERTION]).toBe(1);
      expect(stats.mostCommonErrors.length).toBeGreaterThan(0);
    });

    it('should generate troubleshooting guide', () => {
      errorHandler.handleError(new Error('timeout error'));
      errorHandler.handleError(new Error('mock failed'));

      const guide = errorHandler.generateTroubleshootingGuide();

      expect(guide).toContain('# Test Troubleshooting Guide');
      expect(guide).toContain('## Error Summary');
      expect(guide).toContain('## Errors by Category');
      expect(guide).toContain('## Most Common Errors');
      expect(guide).toContain('## General Troubleshooting Steps');
      expect(guide).toContain('## Debugging Commands');
    });
  });

  describe('error filtering', () => {
    beforeEach(() => {
      errorHandler.handleError(new Error('timeout error'));
      errorHandler.handleError(new Error('mock failed'));
      errorHandler.handleError(new Error('setup failed'));
    });

    it('should filter errors by category', () => {
      const timeoutErrors = errorHandler.getErrorsByCategory(TestErrorCategory.TIMEOUT);
      const mockErrors = errorHandler.getErrorsByCategory(TestErrorCategory.MOCK);

      expect(timeoutErrors.length).toBe(1);
      expect(mockErrors.length).toBe(1);
      expect(timeoutErrors[0].message).toBe('timeout error');
      expect(mockErrors[0].message).toBe('mock failed');
    });

    it('should filter errors by severity', () => {
      const criticalErrors = errorHandler.getErrorsBySeverity(TestErrorSeverity.CRITICAL);
      const highErrors = errorHandler.getErrorsBySeverity(TestErrorSeverity.HIGH);

      expect(criticalErrors.length).toBe(1); // setup error
      expect(highErrors.length).toBe(1); // timeout error
      expect(criticalErrors[0].message).toBe('setup failed');
    });
  });
});

describe('TestDebuggingUtils', () => {
  beforeEach(() => {
    globalTestErrorHandler.clear();
    vi.clearAllMocks();
  });

  describe('debug wrapper', () => {
    it('should wrap test functions with debugging', async () => {
      const testFn = vi.fn().mockResolvedValue('test result');
      const wrappedFn = TestDebuggingUtils.withDebug('test name', 'unit', testFn);

      const result = await wrappedFn();

      expect(result).toBe('test result');
      expect(testFn).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalled(); // Debug session saved
    });

    it('should handle errors in wrapped functions', async () => {
      const error = new Error('Test error');
      const testFn = vi.fn().mockRejectedValue(error);
      const wrappedFn = TestDebuggingUtils.withDebug('test name', 'unit', testFn);

      await expect(wrappedFn()).rejects.toThrow('Test error');
      expect(writeFileSync).toHaveBeenCalled(); // Error and debug session saved
    });

    it('should provide debug context to test functions', async () => {
      let capturedContext: any;
      const testFn = vi.fn().mockImplementation((debug) => {
        capturedContext = debug;
        debug.log('info', 'Test log');
        debug.setVariable('testVar', 'value');
        debug.addToCallStack('testFunction');
        return 'result';
      });

      const wrappedFn = TestDebuggingUtils.withDebug('test name', 'unit', testFn);
      await wrappedFn();

      expect(capturedContext).toBeDefined();
      expect(typeof capturedContext.log).toBe('function');
      expect(typeof capturedContext.setVariable).toBe('function');
      expect(typeof capturedContext.addToCallStack).toBe('function');
    });
  });

  describe('enhanced expectations', () => {
    it('should create enhanced expectations with context', () => {
      const context = { testName: 'sample test' };
      const expectation = TestDebuggingUtils.expectWithContext('actual', context);

      expect(expectation).toBeInstanceOf(EnhancedExpectation);
    });

    it('should handle successful assertions', () => {
      const expectation = new EnhancedExpectation('test', {});
      
      expect(() => expectation.toBe('test')).not.toThrow();
      expect(() => expectation.toEqual('test')).not.toThrow();
      expect(() => expectation.toBeTruthy()).not.toThrow();
    });

    it('should handle failed assertions with context', () => {
      const context = { testName: 'failing test' };
      const expectation = new EnhancedExpectation('actual', context);

      expect(() => expectation.toBe('expected')).toThrow();
      
      // Check that error was handled
      const errors = globalTestErrorHandler.getAllErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].context.testName).toBe('failing test');
      expect(errors[0].context.customData?.assertion).toBeDefined();
    });
  });

  describe('performance monitoring', () => {
    it('should monitor test performance', async () => {
      const testFn = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });

      const monitoredFn = TestDebuggingUtils.withPerformanceMonitoring(testFn, {
        maxDuration: 1000,
        maxMemoryIncrease: 1024 * 1024,
      });

      const result = await monitoredFn();
      expect(result).toBe('result');
    });

    it('should warn about performance threshold violations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      let callCount = 0;
      vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        // First call (start time): 0, second call (end time): 20
        return callCount === 1 ? 0 : 20;
      });

      const testFn = vi.fn().mockResolvedValue('result');

      const monitoredFn = TestDebuggingUtils.withPerformanceMonitoring(testFn, {
        maxDuration: 10, // Very low threshold
      });

      await monitoredFn();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Test exceeded duration threshold');
      
      consoleSpy.mockRestore();
      vi.mocked(Date.now).mockRestore();
    });

    it('should handle errors in performance monitored functions', async () => {
      const error = new Error('Performance test error');
      const testFn = vi.fn().mockRejectedValue(error);

      const monitoredFn = TestDebuggingUtils.withPerformanceMonitoring(testFn);

      await expect(monitoredFn()).rejects.toThrow('Performance test error');
      
      // Check that error was handled with performance context
      const errors = globalTestErrorHandler.getAllErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].context.customData?.performance).toBeDefined();
    });
  });

  describe('mock debugging', () => {
    it('should create debug wrapper for mocks', () => {
      const mockFn = vi.fn();
      const debugMock = TestDebuggingUtils.debugMock(mockFn, 'testMock');

      expect(debugMock).toBeDefined();
      // The debug mock should still be callable
      debugMock();
      expect(mockFn).toHaveBeenCalled();
    });
  });
});

describe('Configuration', () => {
  it('should configure test debugging', () => {
    const config = {
      enabled: true,
      verboseLogging: true,
      performanceMonitoring: true,
      mockDebugging: true,
    };

    configureTestDebugging(config);

    expect(process.env.DEBUG_VERBOSE).toBe('true');
    expect(process.env.PERFORMANCE_MONITORING).toBe('true');
    expect(process.env.MOCK_DEBUGGING).toBe('true');
  });

  it('should use default configuration values', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    configureTestDebugging({});
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '🐛 Test debugging configured:',
      expect.objectContaining({
        enabled: true,
        outputDir: './test-debug-output',
        verboseLogging: false,
        saveErrorReports: true,
        saveDebugSessions: true,
        performanceMonitoring: false,
        mockDebugging: false,
      })
    );
    
    consoleSpy.mockRestore();
  });
});

describe('Global Error Handler', () => {
  it('should provide global error handler instance', () => {
    expect(globalTestErrorHandler).toBeInstanceOf(TestErrorHandler);
  });

  it('should maintain state across multiple uses', () => {
    globalTestErrorHandler.handleError(new Error('Global test error'));
    
    const errors = globalTestErrorHandler.getAllErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Global test error');
    
    // Cleanup
    globalTestErrorHandler.clear();
  });
});