// Dynamic import for test framework compatibility
let mockFramework: any;
try {
  mockFramework = require('vitest').vi;
} catch {
  try {
    mockFramework = require('@jest/globals').jest;
  } catch {
    // Fallback mock implementation
    mockFramework = {
      fn: () => {
        const fn = (...args: any[]) => {};
        fn.mockImplementation = (impl: any) => fn;
        fn.mockReturnValue = (value: any) => fn;
        fn.mockResolvedValue = (value: any) => fn;
        fn.mockReturnThis = () => fn;
        return fn;
      },
      spyOn: (obj: any, method: string) => {
        const fn = mockFramework.fn();
        fn.mockImplementation = (impl: any) => fn;
        return fn;
      }
    };
  }
}

import { Results } from '@strengthos/shared-utils';
import supertest from 'supertest';

/**
 * Test database utilities
 */
export class TestDatabase {
  private static instance: TestDatabase;
  private knex: any;

  private constructor(knex: any) {
    this.knex = knex;
  }

  static getInstance(knex: any): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase(knex);
    }
    return TestDatabase.instance;
  }

  /**
   * Clean all tables in the test database
   */
  async cleanDatabase(): Promise<void> {
    const tables = await this.knex.raw(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'knex_%'
    `);

    for (const table of tables.rows) {
      await this.knex.raw(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`);
    }
  }

  /**
   * Seed database with test data
   */
  async seedDatabase(seedData: { [tableName: string]: any[] }): Promise<void> {
    for (const [tableName, data] of Object.entries(seedData)) {
      if (data.length > 0) {
        await this.knex(tableName).insert(data);
      }
    }
  }

  /**
   * Create a transaction for testing
   */
  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    return await this.knex.transaction(callback);
  }

  /**
   * Execute raw SQL
   */
  async raw(sql: string, bindings?: any[]): Promise<any> {
    return await this.knex.raw(sql, bindings);
  }

  /**
   * Get table data for assertions
   */
  async getTableData(tableName: string, where?: any): Promise<any[]> {
    let query = this.knex(tableName);
    if (where) {
      query = query.where(where);
    }
    return await query.select('*');
  }

  /**
   * Count rows in a table
   */
  async countRows(tableName: string, where?: any): Promise<number> {
    let query = this.knex(tableName);
    if (where) {
      query = query.where(where);
    }
    const result = await query.count('* as count').first();
    return parseInt(result.count);
  }
}

/**
 * Test timing utilities
 */
export class TestTimer {
  private startTime: number = 0;
  private endTime: number = 0;

  start(): void {
    this.startTime = Date.now();
  }

  stop(): number {
    this.endTime = Date.now();
    return this.endTime - this.startTime;
  }

  getDuration(): number {
    return this.endTime - this.startTime;
  }

  static async measure<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const timer = new TestTimer();
    timer.start();
    const result = await fn();
    const duration = timer.stop();
    return { result, duration };
  }

  static async expectDuration<T>(
    fn: () => Promise<T>,
    maxDuration: number,
    message?: string
  ): Promise<T> {
    const { result, duration } = await TestTimer.measure(fn);
    expect(duration).toBeLessThan(maxDuration);
    return result;
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate random string
   */
  static randomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random email
   */
  static randomEmail(domain: string = 'test.com'): string {
    return `${this.randomString(8)}@${domain}`;
  }

  /**
   * Generate random UUID
   */
  static randomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate random integer
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random date
   */
  static randomDate(start: Date = new Date(2020, 0, 1), end: Date = new Date()): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  /**
   * Generate test data array
   */
  static generateArray<T>(count: number, generator: (index: number) => T): T[] {
    return Array.from({ length: count }, (_, index) => generator(index));
  }
}

/**
 * API testing utilities
 */
export class ApiTestHelper {
  private app: any;
  private request: supertest.SuperTest<supertest.Test>;

  constructor(app: any) {
    this.app = app;
    this.request = supertest(app) as any;
  }

  /**
   * Make authenticated request
   */
  authenticatedRequest(token: string) {
    return {
      get: (url: string) => this.request.get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string) => this.request.post(url).set('Authorization', `Bearer ${token}`),
      put: (url: string) => this.request.put(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) => this.request.patch(url).set('Authorization', `Bearer ${token}`),
      delete: (url: string) => this.request.delete(url).set('Authorization', `Bearer ${token}`),
    };
  }

  /**
   * Test API endpoint with various scenarios
   */
  async testEndpoint(config: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    auth?: string;
    body?: any;
    expectedStatus: number;
    expectedBody?: any;
    headers?: { [key: string]: string };
  }) {
    let request = (this.request as any)[config.method.toLowerCase()](config.url);

    if (config.auth) {
      request = request.set('Authorization', `Bearer ${config.auth}`);
    }

    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        request = request.set(key, value);
      });
    }

    if (config.body) {
      request = request.send(config.body);
    }

    const response = await request.expect(config.expectedStatus);

    if (config.expectedBody) {
      expect(response.body).toMatchObject(config.expectedBody);
    }

    return response;
  }

  /**
   * Test pagination
   */
  async testPagination(url: string, auth?: string) {
    const firstPage = await this.request
      .get(`${url}?page=1&limit=5`)
      .set('Authorization', auth ? `Bearer ${auth}` : '')
      .expect(200);

    expect(firstPage.body).toHaveProperty('data');
    expect(firstPage.body).toHaveProperty('pagination');
    expect(firstPage.body.pagination).toHaveProperty('page', 1);
    expect(firstPage.body.pagination).toHaveProperty('limit', 5);

    return firstPage.body;
  }

  /**
   * Test validation errors
   */
  async testValidationError(config: {
    method: 'POST' | 'PUT' | 'PATCH';
    url: string;
    body: any;
    auth?: string;
    expectedErrors: string[];
  }) {
    let request = (this.request as any)[config.method.toLowerCase()](config.url);

    if (config.auth) {
      request = request.set('Authorization', `Bearer ${config.auth}`);
    }

    const response = await request.send(config.body).expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    
    config.expectedErrors.forEach(error => {
      expect(response.body.message).toContain(error);
    });

    return response;
  }
}

/**
 * Mock utilities
 */
export class MockHelper {
  /**
   * Create a mock function with predefined responses
   */
  static createMockWithResponses<T>(responses: T[]): any {
    let callCount = 0;
    return mockFramework.fn().mockImplementation(() => {
      const response = responses[callCount % responses.length];
      callCount++;
      return response;
    });
  }

  /**
   * Create a mock service with Results pattern
   */
  static createMockService<T>(methods: { [key: string]: T | Error }): any {
    const mock: any = {};
    
    Object.entries(methods).forEach(([methodName, response]) => {
      mock[methodName] = mockFramework.fn().mockImplementation(() => {
        if (response instanceof Error) {
          return Promise.resolve(Results.error(null, response.message));
        }
        return Promise.resolve(Results.ok(response));
      });
    });

    return mock;
  }

  /**
   * Create a spy on console methods
   */
  static spyOnConsole() {
    return {
      log: mockFramework.spyOn(console, 'log').mockImplementation(() => {}),
      error: mockFramework.spyOn(console, 'error').mockImplementation(() => {}),
      warn: mockFramework.spyOn(console, 'warn').mockImplementation(() => {}),
      info: mockFramework.spyOn(console, 'info').mockImplementation(() => {}),
    };
  }

  /**
   * Mock environment variables
   */
  static mockEnvVars(vars: { [key: string]: string }) {
    const originalEnv = { ...process.env };
    
    Object.entries(vars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    return () => {
      process.env = originalEnv;
    };
  }
}

/**
 * Assertion helpers
 */
export class AssertionHelper {
  /**
   * Assert that a Results object is successful
   */
  static expectSuccess<T>(result: Results<T>): T {
    expect(result.isOk).toBe(true);
    expect(result.returnValue).toBeDefined();
    return result.returnValue!;
  }

  /**
   * Assert that a Results object is an error
   */
  static expectError<T>(result: Results<T>, expectedMessage?: string): void {
    expect(result.isOk).toBe(false);
    if (expectedMessage) {
      expect(result.message).toContain(expectedMessage);
    }
  }

  /**
   * Assert array contains items matching predicate
   */
  static expectArrayContains<T>(array: T[], predicate: (item: T) => boolean, count?: number): void {
    const matches = array.filter(predicate);
    expect(matches.length).toBeGreaterThan(0);
    if (count !== undefined) {
      expect(matches.length).toBe(count);
    }
  }

  /**
   * Assert object has required properties
   */
  static expectObjectShape(obj: any, shape: { [key: string]: string }): void {
    Object.entries(shape).forEach(([key, type]) => {
      expect(obj).toHaveProperty(key);
      expect(typeof obj[key]).toBe(type);
    });
  }

  /**
   * Assert date is within range
   */
  static expectDateInRange(date: Date, start: Date, end: Date): void {
    expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
  }

  /**
   * Assert async function throws
   */
  static async expectAsyncThrow(fn: () => Promise<any>, expectedError?: string): Promise<void> {
    try {
      await fn();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedError) {
        expect(error instanceof Error ? error.message : String(error)).toContain(expectedError);
      }
    }
  }
}

/**
 * Test setup and teardown utilities
 */
export class TestSetup {
  private cleanupFunctions: (() => Promise<void> | void)[] = [];

  /**
   * Add cleanup function
   */
  addCleanup(fn: () => Promise<void> | void): void {
    this.cleanupFunctions.push(fn);
  }

  /**
   * Run all cleanup functions
   */
  async cleanup(): Promise<void> {
    for (const fn of this.cleanupFunctions.reverse()) {
      try {
        await fn();
      } catch (error) {
        console.error('Cleanup function failed:', error);
      }
    }
    this.cleanupFunctions = [];
  }

  /**
   * Create a test context with automatic cleanup
   */
  static async withCleanup<T>(fn: (setup: TestSetup) => Promise<T>): Promise<T> {
    const setup = new TestSetup();
    try {
      return await fn(setup);
    } finally {
      await setup.cleanup();
    }
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceHelper {
  /**
   * Test function performance
   */
  static async testPerformance<T>(
    fn: () => Promise<T>,
    options: {
      iterations?: number;
      maxAverageTime?: number;
      maxSingleTime?: number;
      warmupIterations?: number;
    } = {}
  ): Promise<{
    results: T[];
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  }> {
    const {
      iterations = 10,
      maxAverageTime,
      maxSingleTime,
      warmupIterations = 2
    } = options;

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    const results: T[] = [];
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { result, duration } = await TestTimer.measure(fn);
      results.push(result);
      times.push(duration);

      if (maxSingleTime && duration > maxSingleTime) {
        throw new Error(`Single execution took ${duration}ms, expected less than ${maxSingleTime}ms`);
      }
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    if (maxAverageTime && averageTime > maxAverageTime) {
      throw new Error(`Average execution time was ${averageTime}ms, expected less than ${maxAverageTime}ms`);
    }

    return {
      results,
      averageTime,
      minTime,
      maxTime,
      totalTime,
    };
  }

  /**
   * Test concurrent execution
   */
  static async testConcurrency<T>(
    fn: () => Promise<T>,
    concurrency: number,
    iterations: number = 10
  ): Promise<{
    results: T[];
    totalTime: number;
    averageTime: number;
    errors: Error[];
  }> {
    const startTime = Date.now();
    const promises: Promise<T>[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < iterations; i++) {
      const batch = Array.from({ length: concurrency }, () => 
        fn().catch(error => {
          errors.push(error);
          throw error;
        })
      );
      promises.push(...batch);
    }

    const results = await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<Awaited<T>> => result.status === 'fulfilled')
      .map(result => result.value);

    return {
      results: successfulResults,
      totalTime,
      averageTime: totalTime / promises.length,
      errors,
    };
  }
}

// All utilities are already exported above as they are defined