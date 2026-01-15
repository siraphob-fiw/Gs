/**
 * Test debugging and error handling utilities
 * Provides comprehensive error handling, debugging support, and troubleshooting tools
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { inspect } from 'util';

/**
 * Test error categories
 */
export enum TestErrorCategory {
  SETUP = 'setup',
  EXECUTION = 'execution',
  ASSERTION = 'assertion',
  TIMEOUT = 'timeout',
  MEMORY = 'memory',
  DEPENDENCY = 'dependency',
  CONFIGURATION = 'configuration',
  MOCK = 'mock',
  ASYNC = 'async',
  UNKNOWN = 'unknown',
}

/**
 * Test error severity levels
 */
export enum TestErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Enhanced test error with context and debugging information
 */
export interface TestError {
  id: string;
  category: TestErrorCategory;
  severity: TestErrorSeverity;
  message: string;
  originalError: Error;
  context: TestErrorContext;
  stack: string;
  timestamp: number;
  suggestions: string[];
  relatedErrors: string[];
}

/**
 * Test error context information
 */
export interface TestErrorContext {
  testName?: string;
  testFile?: string;
  testSuite?: string;
  category?: string;
  framework?: string;
  environment?: string;
  mockState?: any;
  systemInfo?: {
    nodeVersion: string;
    platform: string;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  };
  customData?: Record<string, any>;
}

/**
 * Debug session information
 */
export interface DebugSession {
  id: string;
  startTime: number;
  endTime?: number;
  testName: string;
  category: string;
  breakpoints: DebugBreakpoint[];
  variables: Record<string, any>;
  callStack: string[];
  logs: DebugLog[];
  performance: {
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

/**
 * Debug breakpoint
 */
export interface DebugBreakpoint {
  id: string;
  file: string;
  line: number;
  condition?: string;
  hitCount: number;
  enabled: boolean;
}

/**
 * Debug log entry
 */
export interface DebugLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  source: string;
}

/**
 * Mock expectation failure details
 */
export interface MockExpectationFailure {
  mockName: string;
  expectedCalls: number;
  actualCalls: number;
  expectedArgs: any[];
  actualArgs: any[];
  method: string;
  suggestions: string[];
}

/**
 * Test error handler with enhanced debugging capabilities
 */
export class TestErrorHandler {
  private errors: Map<string, TestError> = new Map();
  private debugSessions: Map<string, DebugSession> = new Map();
  private errorPatterns: Map<string, TestErrorCategory> = new Map();
  private outputDir: string;

  constructor(outputDir: string = './test-debug-output') {
    this.outputDir = outputDir;
    this.initializeErrorPatterns();
    this.ensureOutputDirectory();
  }

  /**
   * Initialize common error patterns for categorization
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns.set(/timeout/i.source, TestErrorCategory.TIMEOUT);
    this.errorPatterns.set(/memory/i.source, TestErrorCategory.MEMORY);
    this.errorPatterns.set(/mock/i.source, TestErrorCategory.MOCK);
    this.errorPatterns.set(/expect/i.source, TestErrorCategory.ASSERTION);
    this.errorPatterns.set(/setup|beforeEach|beforeAll/i.source, TestErrorCategory.SETUP);
    this.errorPatterns.set(/async|promise|await/i.source, TestErrorCategory.ASYNC);
    this.errorPatterns.set(/module|import|require/i.source, TestErrorCategory.DEPENDENCY);
    this.errorPatterns.set(/config/i.source, TestErrorCategory.CONFIGURATION);
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Handle and categorize test errors
   */
  handleError(
    error: Error,
    context: Partial<TestErrorContext> = {}
  ): TestError {
    const testError = this.createTestError(error, context);
    this.errors.set(testError.id, testError);
    
    // Log error for debugging
    this.logError(testError);
    
    // Save error details to file
    this.saveErrorToFile(testError);
    
    return testError;
  }

  /**
   * Create enhanced test error with context
   */
  private createTestError(
    error: Error,
    context: Partial<TestErrorContext>
  ): TestError {
    const id = this.generateErrorId();
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(error, category);
    const suggestions = this.generateSuggestions(error, category);
    
    const fullContext: TestErrorContext = {
      ...context,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    return {
      id,
      category,
      severity,
      message: error.message,
      originalError: error,
      context: fullContext,
      stack: error.stack || '',
      timestamp: Date.now(),
      suggestions,
      relatedErrors: this.findRelatedErrors(error),
    };
  }

  /**
   * Categorize error based on message and stack trace
   */
  private categorizeError(error: Error): TestErrorCategory {
    const message = error.message.toLowerCase();
    const stack = (error.stack || '').toLowerCase();
    const combined = `${message} ${stack}`;

    for (const [pattern, category] of this.errorPatterns) {
      if (new RegExp(pattern).test(combined)) {
        return category;
      }
    }

    return TestErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, category: TestErrorCategory): TestErrorSeverity {
    // Critical errors that prevent test execution
    if (category === TestErrorCategory.SETUP || category === TestErrorCategory.CONFIGURATION) {
      return TestErrorSeverity.CRITICAL;
    }

    // High severity for timeouts and memory issues
    if (category === TestErrorCategory.TIMEOUT || category === TestErrorCategory.MEMORY) {
      return TestErrorSeverity.HIGH;
    }

    // Medium severity for assertion and mock failures
    if (category === TestErrorCategory.ASSERTION || category === TestErrorCategory.MOCK) {
      return TestErrorSeverity.MEDIUM;
    }

    // Default to low severity
    return TestErrorSeverity.LOW;
  }

  /**
   * Generate helpful suggestions based on error type
   */
  private generateSuggestions(error: Error, category: TestErrorCategory): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case TestErrorCategory.TIMEOUT:
        suggestions.push(
          'Increase test timeout using jest.setTimeout() or test configuration',
          'Check for infinite loops or blocking operations',
          'Use async/await properly for asynchronous operations',
          'Consider mocking slow external dependencies'
        );
        break;

      case TestErrorCategory.MEMORY:
        suggestions.push(
          'Check for memory leaks in test setup or teardown',
          'Ensure proper cleanup of resources (timers, listeners, etc.)',
          'Use smaller test data sets',
          'Run tests with --detectOpenHandles flag'
        );
        break;

      case TestErrorCategory.MOCK:
        suggestions.push(
          'Verify mock expectations match actual usage',
          'Check if mocks are properly reset between tests',
          'Ensure mock implementations return expected values',
          'Use jest.clearAllMocks() in beforeEach/afterEach'
        );
        break;

      case TestErrorCategory.ASSERTION:
        suggestions.push(
          'Check if expected and actual values are of the same type',
          'Use more specific matchers (toEqual vs toBe)',
          'Add debugging output to understand actual values',
          'Consider using custom matchers for complex assertions'
        );
        break;

      case TestErrorCategory.ASYNC:
        suggestions.push(
          'Ensure async functions are properly awaited',
          'Use return statement with promises in tests',
          'Check for unhandled promise rejections',
          'Consider using waitFor or similar utilities for async assertions'
        );
        break;

      case TestErrorCategory.SETUP:
        suggestions.push(
          'Check test setup and teardown functions',
          'Verify all required dependencies are available',
          'Ensure proper test environment configuration',
          'Check for conflicts between global and local setup'
        );
        break;

      case TestErrorCategory.DEPENDENCY:
        suggestions.push(
          'Verify all required modules are installed',
          'Check import/require paths are correct',
          'Ensure dependencies are compatible versions',
          'Consider using module mocking for external dependencies'
        );
        break;

      case TestErrorCategory.CONFIGURATION:
        suggestions.push(
          'Check Jest/test framework configuration files',
          'Verify environment variables are set correctly',
          'Ensure test paths and patterns are correct',
          'Check for conflicting configuration options'
        );
        break;

      default:
        suggestions.push(
          'Check the error stack trace for more details',
          'Search for similar issues in documentation or forums',
          'Try running the test in isolation to identify conflicts',
          'Enable verbose logging for more debugging information'
        );
    }

    return suggestions;
  }

  /**
   * Find related errors based on similarity
   */
  private findRelatedErrors(error: Error): string[] {
    const related: string[] = [];
    const errorMessage = error.message.toLowerCase();

    for (const [id, testError] of this.errors) {
      if (testError.message.toLowerCase().includes(errorMessage.split(' ')[0])) {
        related.push(id);
      }
    }

    return related.slice(0, 5); // Limit to 5 related errors
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error with enhanced formatting
   */
  private logError(testError: TestError): void {
    const { category, severity, message, context, suggestions } = testError;
    
    console.error(`\n🚨 Test Error [${category.toUpperCase()}] - ${severity.toUpperCase()}`);
    console.error(`📝 Message: ${message}`);
    
    if (context.testName) {
      console.error(`🧪 Test: ${context.testName}`);
    }
    
    if (context.testFile) {
      console.error(`📁 File: ${context.testFile}`);
    }

    console.error(`\n💡 Suggestions:`);
    suggestions.forEach((suggestion, index) => {
      console.error(`   ${index + 1}. ${suggestion}`);
    });

    console.error(`\n🔍 Error ID: ${testError.id}`);
    console.error(`📊 Debug report saved to: ${this.getErrorFilePath(testError.id)}`);
  }

  /**
   * Save error details to file for debugging
   */
  private saveErrorToFile(testError: TestError): void {
    const filePath = this.getErrorFilePath(testError.id);
    const errorReport = this.generateErrorReport(testError);
    
    writeFileSync(filePath, errorReport, 'utf8');
  }

  /**
   * Get error file path
   */
  private getErrorFilePath(errorId: string): string {
    return join(this.outputDir, `${errorId}.json`);
  }

  /**
   * Generate comprehensive error report
   */
  private generateErrorReport(testError: TestError): string {
    return JSON.stringify({
      ...testError,
      originalError: {
        name: testError.originalError.name,
        message: testError.originalError.message,
        stack: testError.originalError.stack,
      },
      generatedAt: new Date().toISOString(),
      debugInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        cwd: process.cwd(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          CI: process.env.CI,
          TEST_TIMEOUT: process.env.TEST_TIMEOUT,
        },
      },
    }, null, 2);
  }

  /**
   * Handle mock expectation failures
   */
  handleMockFailure(failure: MockExpectationFailure, context: Partial<TestErrorContext> = {}): TestError {
    const error = new Error(
      `Mock expectation failed for ${failure.mockName}.${failure.method}: ` +
      `expected ${failure.expectedCalls} calls, received ${failure.actualCalls}`
    );

    const enhancedContext = {
      ...context,
      customData: {
        mockFailure: failure,
      },
    };

    return this.handleError(error, enhancedContext);
  }

  /**
   * Start debug session
   */
  startDebugSession(testName: string, category: string): string {
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: DebugSession = {
      id: sessionId,
      startTime: Date.now(),
      testName,
      category,
      breakpoints: [],
      variables: {},
      callStack: [],
      logs: [],
      performance: {
        duration: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    this.debugSessions.set(sessionId, session);
    
    console.log(`🐛 Debug session started: ${sessionId}`);
    console.log(`🧪 Test: ${testName} (${category})`);
    
    return sessionId;
  }

  /**
   * End debug session
   */
  endDebugSession(sessionId: string): void {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.performance.duration = session.endTime - session.startTime;

    console.log(`🐛 Debug session ended: ${sessionId}`);
    console.log(`⏱️  Duration: ${session.performance.duration}ms`);

    // Save debug session to file
    this.saveDebugSession(session);
  }

  /**
   * Add debug log entry
   */
  addDebugLog(
    sessionId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    source: string = 'test'
  ): void {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    const logEntry: DebugLog = {
      timestamp: Date.now(),
      level,
      message,
      data,
      source,
    };

    session.logs.push(logEntry);

    // Also log to console if verbose debugging is enabled
    if (process.env.DEBUG_VERBOSE === 'true') {
      const timestamp = new Date(logEntry.timestamp).toISOString();
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data ? inspect(data, { depth: 2 }) : '');
    }
  }

  /**
   * Set debug variable
   */
  setDebugVariable(sessionId: string, name: string, value: any): void {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    session.variables[name] = value;
  }

  /**
   * Add to call stack
   */
  addToCallStack(sessionId: string, functionName: string): void {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    session.callStack.push(functionName);
  }

  /**
   * Save debug session to file
   */
  private saveDebugSession(session: DebugSession): void {
    const filePath = join(this.outputDir, `debug_${session.id}.json`);
    const sessionReport = JSON.stringify(session, null, 2);
    
    writeFileSync(filePath, sessionReport, 'utf8');
    console.log(`📊 Debug session saved to: ${filePath}`);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<TestErrorCategory, number>;
    errorsBySeverity: Record<TestErrorSeverity, number>;
    mostCommonErrors: Array<{ message: string; count: number }>;
  } {
    const stats = {
      totalErrors: this.errors.size,
      errorsByCategory: {} as Record<TestErrorCategory, number>,
      errorsBySeverity: {} as Record<TestErrorSeverity, number>,
      mostCommonErrors: [] as Array<{ message: string; count: number }>,
    };

    // Initialize counters
    Object.values(TestErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });
    Object.values(TestErrorSeverity).forEach(severity => {
      stats.errorsBySeverity[severity] = 0;
    });

    // Count errors
    const messageCount = new Map<string, number>();
    
    for (const error of this.errors.values()) {
      stats.errorsByCategory[error.category]++;
      stats.errorsBySeverity[error.severity]++;
      
      const count = messageCount.get(error.message) || 0;
      messageCount.set(error.message, count + 1);
    }

    // Get most common errors
    stats.mostCommonErrors = Array.from(messageCount.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Generate troubleshooting guide
   */
  generateTroubleshootingGuide(): string {
    const stats = this.getErrorStatistics();
    
    let guide = '# Test Troubleshooting Guide\n\n';
    guide += `Generated: ${new Date().toISOString()}\n\n`;
    
    guide += '## Error Summary\n\n';
    guide += `- **Total Errors:** ${stats.totalErrors}\n`;
    guide += `- **Most Common Category:** ${this.getMostCommonCategory(stats.errorsByCategory)}\n`;
    guide += `- **Most Common Severity:** ${this.getMostCommonSeverity(stats.errorsBySeverity)}\n\n`;
    
    guide += '## Errors by Category\n\n';
    Object.entries(stats.errorsByCategory).forEach(([category, count]) => {
      if (count > 0) {
        guide += `- **${category.toUpperCase()}:** ${count} errors\n`;
      }
    });
    
    guide += '\n## Most Common Errors\n\n';
    stats.mostCommonErrors.forEach((error, index) => {
      guide += `${index + 1}. **${error.message}** (${error.count} occurrences)\n`;
    });
    
    guide += '\n## General Troubleshooting Steps\n\n';
    guide += '1. **Check Error Categories:** Focus on the most common error categories first\n';
    guide += '2. **Review Test Setup:** Ensure proper test environment configuration\n';
    guide += '3. **Verify Dependencies:** Check that all required dependencies are installed and compatible\n';
    guide += '4. **Check Async Operations:** Ensure proper handling of promises and async/await\n';
    guide += '5. **Review Mock Usage:** Verify mock expectations and implementations\n';
    guide += '6. **Memory Management:** Check for memory leaks and proper resource cleanup\n';
    guide += '7. **Timeout Issues:** Increase timeouts for slow operations or optimize test performance\n\n';
    
    guide += '## Debugging Commands\n\n';
    guide += '```bash\n';
    guide += '# Run tests with debugging enabled\n';
    guide += 'DEBUG_VERBOSE=true npm test\n\n';
    guide += '# Run specific test with debug output\n';
    guide += 'npm test -- --testNamePattern="specific test" --verbose\n\n';
    guide += '# Run tests with memory debugging\n';
    guide += 'node --inspect-brk node_modules/.bin/jest --runInBand\n';
    guide += '```\n\n';
    
    return guide;
  }

  /**
   * Get most common category
   */
  private getMostCommonCategory(categoryStats: Record<TestErrorCategory, number>): string {
    return Object.entries(categoryStats)
      .reduce((max, [category, count]) => count > max.count ? { category, count } : max, { category: '', count: 0 })
      .category;
  }

  /**
   * Get most common severity
   */
  private getMostCommonSeverity(severityStats: Record<TestErrorSeverity, number>): string {
    return Object.entries(severityStats)
      .reduce((max, [severity, count]) => count > max.count ? { severity, count } : max, { severity: '', count: 0 })
      .severity;
  }

  /**
   * Clear all errors and debug sessions
   */
  clear(): void {
    this.errors.clear();
    this.debugSessions.clear();
  }

  /**
   * Get all errors
   */
  getAllErrors(): TestError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: TestErrorCategory): TestError[] {
    return this.getAllErrors().filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: TestErrorSeverity): TestError[] {
    return this.getAllErrors().filter(error => error.severity === severity);
  }
}

/**
 * Global test error handler instance
 */
export const globalTestErrorHandler = new TestErrorHandler();

/**
 * Utility functions for test debugging
 */
export class TestDebuggingUtils {
  /**
   * Create debug wrapper for test functions
   */
  static withDebug<T>(
    testName: string,
    category: string,
    testFn: (debug: DebugContext) => Promise<T> | T
  ): () => Promise<T> {
    return async () => {
      const sessionId = globalTestErrorHandler.startDebugSession(testName, category);
      
      const debugContext: DebugContext = {
        log: (level, message, data) => globalTestErrorHandler.addDebugLog(sessionId, level, message, data),
        setVariable: (name, value) => globalTestErrorHandler.setDebugVariable(sessionId, name, value),
        addToCallStack: (functionName) => globalTestErrorHandler.addToCallStack(sessionId, functionName),
      };

      try {
        const result = await testFn(debugContext);
        globalTestErrorHandler.endDebugSession(sessionId);
        return result;
      } catch (error) {
        globalTestErrorHandler.handleError(error as Error, {
          testName,
          category,
        });
        globalTestErrorHandler.endDebugSession(sessionId);
        throw error;
      }
    };
  }

  /**
   * Enhanced error assertion with debugging context
   */
  static expectWithContext<T>(
    actual: T,
    context: Partial<TestErrorContext> = {}
  ): EnhancedExpectation<T> {
    return new EnhancedExpectation(actual, context);
  }

  /**
   * Debug mock expectations
   */
  static debugMock(mockFn: any, name: string): any {
    const originalMock = mockFn;
    
    return new Proxy(originalMock, {
      get(target, prop) {
        if (prop === 'mockImplementation' || prop === 'mockReturnValue' || prop === 'mockResolvedValue') {
          return (...args: any[]) => {
            globalTestErrorHandler.addDebugLog(
              'current',
              'debug',
              `Mock ${name}.${String(prop)} called`,
              args,
              'mock-debug'
            );
            return target[prop](...args);
          };
        }
        return target[prop];
      },
    });
  }

  /**
   * Performance monitoring wrapper
   */
  static withPerformanceMonitoring<T>(
    testFn: () => Promise<T> | T,
    thresholds: {
      maxDuration?: number;
      maxMemoryIncrease?: number;
    } = {}
  ): () => Promise<T> {
    return async () => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      try {
        const result = await testFn();
        
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();
        const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

        // Check thresholds
        if (thresholds.maxDuration && duration > thresholds.maxDuration) {
          console.warn(`⚠️  Test exceeded duration threshold: ${duration}ms > ${thresholds.maxDuration}ms`);
        }

        if (thresholds.maxMemoryIncrease && memoryIncrease > thresholds.maxMemoryIncrease) {
          console.warn(`⚠️  Test exceeded memory threshold: ${memoryIncrease} bytes > ${thresholds.maxMemoryIncrease} bytes`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        globalTestErrorHandler.handleError(error as Error, {
          customData: {
            performance: {
              duration,
              memoryUsage: process.memoryUsage(),
            },
          },
        });
        throw error;
      }
    };
  }
}

/**
 * Debug context for test functions
 */
export interface DebugContext {
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => void;
  setVariable: (name: string, value: any) => void;
  addToCallStack: (functionName: string) => void;
}

/**
 * Enhanced expectation with debugging context
 */
export class EnhancedExpectation<T> {
  constructor(
    private actual: T,
    private context: Partial<TestErrorContext>
  ) {}

  toBe(expected: T): void {
    try {
      expect(this.actual).toBe(expected);
    } catch (error) {
      globalTestErrorHandler.handleError(error as Error, {
        ...this.context,
        customData: {
          assertion: {
            type: 'toBe',
            expected,
            actual: this.actual,
          },
        },
      });
      throw error;
    }
  }

  toEqual(expected: T): void {
    try {
      expect(this.actual).toEqual(expected);
    } catch (error) {
      globalTestErrorHandler.handleError(error as Error, {
        ...this.context,
        customData: {
          assertion: {
            type: 'toEqual',
            expected,
            actual: this.actual,
          },
        },
      });
      throw error;
    }
  }

  toContain(expected: any): void {
    try {
      expect(this.actual).toContain(expected);
    } catch (error) {
      globalTestErrorHandler.handleError(error as Error, {
        ...this.context,
        customData: {
          assertion: {
            type: 'toContain',
            expected,
            actual: this.actual,
          },
        },
      });
      throw error;
    }
  }

  toBeTruthy(): void {
    try {
      expect(this.actual).toBeTruthy();
    } catch (error) {
      globalTestErrorHandler.handleError(error as Error, {
        ...this.context,
        customData: {
          assertion: {
            type: 'toBeTruthy',
            actual: this.actual,
          },
        },
      });
      throw error;
    }
  }

  toBeFalsy(): void {
    try {
      expect(this.actual).toBeFalsy();
    } catch (error) {
      globalTestErrorHandler.handleError(error as Error, {
        ...this.context,
        customData: {
          assertion: {
            type: 'toBeFalsy',
            actual: this.actual,
          },
        },
      });
      throw error;
    }
  }
}

/**
 * Test debugging configuration
 */
export interface TestDebuggingConfig {
  enabled: boolean;
  outputDir: string;
  verboseLogging: boolean;
  saveErrorReports: boolean;
  saveDebugSessions: boolean;
  performanceMonitoring: boolean;
  mockDebugging: boolean;
}

/**
 * Configure test debugging
 */
export function configureTestDebugging(config: Partial<TestDebuggingConfig>): void {
  const fullConfig: TestDebuggingConfig = {
    enabled: true,
    outputDir: './test-debug-output',
    verboseLogging: false,
    saveErrorReports: true,
    saveDebugSessions: true,
    performanceMonitoring: false,
    mockDebugging: false,
    ...config,
  };

  // Set environment variables for debugging
  if (fullConfig.verboseLogging) {
    process.env.DEBUG_VERBOSE = 'true';
  }

  if (fullConfig.performanceMonitoring) {
    process.env.PERFORMANCE_MONITORING = 'true';
  }

  if (fullConfig.mockDebugging) {
    process.env.MOCK_DEBUGGING = 'true';
  }

  console.log('🐛 Test debugging configured:', fullConfig);
}