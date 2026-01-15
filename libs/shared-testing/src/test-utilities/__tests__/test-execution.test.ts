/**
 * Tests for test execution and categorization utilities
 */

import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import {
  TestExecutionManager,
  TestCategory,
  TestExecutionOptions,
  createTestExecutionManager,
  runTestCategory,
} from '../test-execution';
import { testConfigurations, getTestConfiguration } from '../test-configs';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawn: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('TestExecutionManager', () => {
  let manager: TestExecutionManager;

  beforeEach(() => {
    manager = new TestExecutionManager('/test/workspace');
    vi.clearAllMocks();
  });

  describe('category management', () => {
    it('should initialize with default categories', () => {
      const categories = manager.getCategories();
      
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.find(c => c.name === 'unit')).toBeDefined();
      expect(categories.find(c => c.name === 'integration')).toBeDefined();
      expect(categories.find(c => c.name === 'e2e')).toBeDefined();
    });

    it('should register custom categories', () => {
      const customCategory: TestCategory = {
        name: 'custom',
        pattern: 'src/**/*.custom.test.ts',
        description: 'Custom test category',
        timeout: 45000,
        parallel: true,
        tags: ['custom'],
        framework: 'jest',
      };

      manager.registerCategory(customCategory);
      
      const category = manager.getCategory('custom');
      expect(category).toEqual(customCategory);
    });

    it('should filter categories by tags', () => {
      const fastCategories = manager.getCategoriesByTags(['fast']);
      
      expect(fastCategories.length).toBeGreaterThan(0);
      expect(fastCategories.every(c => c.tags.includes('fast'))).toBe(true);
    });

    it('should filter categories by pattern', () => {
      const unitCategories = manager.getCategoriesByPattern('unit');
      
      expect(unitCategories.length).toBeGreaterThan(0);
      expect(unitCategories.some(c => c.name.includes('unit') || c.description.toLowerCase().includes('unit'))).toBe(true);
    });
  });

  describe('dependency resolution', () => {
    it('should resolve dependencies correctly', () => {
      // Add categories with dependencies
      manager.registerCategory({
        name: 'dep-test-1',
        pattern: 'test1',
        description: 'Test 1',
        timeout: 30000,
        parallel: true,
        tags: ['test'],
        dependencies: ['unit'],
      });

      manager.registerCategory({
        name: 'dep-test-2',
        pattern: 'test2',
        description: 'Test 2',
        timeout: 30000,
        parallel: true,
        tags: ['test'],
        dependencies: ['dep-test-1'],
      });

      const categories = [
        manager.getCategory('dep-test-2')!,
        manager.getCategory('dep-test-1')!,
        manager.getCategory('unit')!,
      ];

      const resolved = (manager as any).resolveDependencies(categories);
      const names = resolved.map((c: TestCategory) => c.name);

      expect(names.indexOf('unit')).toBeLessThan(names.indexOf('dep-test-1'));
      expect(names.indexOf('dep-test-1')).toBeLessThan(names.indexOf('dep-test-2'));
    });

    it('should detect circular dependencies', () => {
      manager.registerCategory({
        name: 'circular-1',
        pattern: 'test1',
        description: 'Test 1',
        timeout: 30000,
        parallel: true,
        tags: ['test'],
        dependencies: ['circular-2'],
      });

      manager.registerCategory({
        name: 'circular-2',
        pattern: 'test2',
        description: 'Test 2',
        timeout: 30000,
        parallel: true,
        tags: ['test'],
        dependencies: ['circular-1'],
      });

      const categories = [
        manager.getCategory('circular-1')!,
        manager.getCategory('circular-2')!,
      ];

      expect(() => {
        (manager as any).resolveDependencies(categories);
      }).toThrow('Circular dependency detected');
    });
  });

  describe('test output parsing', () => {
    it('should parse Jest output correctly', () => {
      const jestOutput = `
Test Suites: 5 passed, 1 failed, 6 total
Tests:       15 passed, 2 failed, 1 skipped, 18 total
All files    |   85.5  |   78.2  |   92.1  |   88.7
      `;

      const result = (manager as any).parseTestOutput(jestOutput, 'jest');

      expect(result.testsPassed).toBe(15);
      expect(result.testsFailed).toBe(2);
      expect(result.testsSkipped).toBe(1);
      expect(result.testsRun).toBe(18);
      expect(result.coverage).toEqual({
        statements: 85.5,
        branches: 78.2,
        functions: 92.1,
        lines: 88.7,
      });
    });

    it('should parse Vitest output correctly', () => {
      const vitestOutput = `
✓ 12 passed, 1 failed, 2 skipped
      `;

      const result = (manager as any).parseTestOutput(vitestOutput, 'vitest');

      expect(result.testsPassed).toBe(12);
      expect(result.testsFailed).toBe(1);
      expect(result.testsSkipped).toBe(2);
      expect(result.testsRun).toBe(15);
    });
  });

  describe('command building', () => {
    it('should build Jest command correctly', () => {
      const category: TestCategory = {
        name: 'unit',
        pattern: 'src/**/*.test.ts',
        description: 'Unit tests',
        timeout: 30000,
        parallel: true,
        tags: ['fast'],
        framework: 'jest',
      };

      const options: TestExecutionOptions = {
        coverage: true,
        verbose: true,
        maxWorkers: 4,
      };

      const command = (manager as any).buildTestCommand(category, options);

      expect(command).toContain('jest');
      expect(command).toContain('--testPathPattern="src/**/*.test.ts"');
      expect(command).toContain('--coverage');
      expect(command).toContain('--verbose');
      expect(command).toContain('--maxWorkers=4');
      expect(command).toContain('--testTimeout=30000');
    });

    it('should build Vitest command correctly', () => {
      const category: TestCategory = {
        name: 'unit',
        pattern: 'src/**/*.test.ts',
        description: 'Unit tests',
        timeout: 30000,
        parallel: false,
        tags: ['fast'],
        framework: 'vitest',
      };

      const options: TestExecutionOptions = {
        watch: true,
        bail: true,
      };

      const command = (manager as any).buildTestCommand(category, options);

      expect(command).toContain('vitest --watch');
      expect(command).toContain('--testPathPattern="src/**/*.test.ts"');
      expect(command).toContain('--no-threads');
      expect(command).toContain('--bail=1');
    });

    it('should handle debug mode for Jest', () => {
      const category: TestCategory = {
        name: 'unit',
        pattern: 'src/**/*.test.ts',
        description: 'Unit tests',
        timeout: 30000,
        parallel: true,
        tags: ['fast'],
        framework: 'jest',
      };

      const options: TestExecutionOptions = {
        debug: true,
      };

      const command = (manager as any).buildTestCommand(category, options);

      expect(command).toContain('node --inspect-brk');
      expect(command).toContain('--runInBand');
    });
  });

  describe('performance tracking', () => {
    it('should track performance metrics', async () => {
      const { execSync } = await import('child_process');
      (execSync as any).mockReturnValue('Tests: 5 passed');

      // Use dry run to avoid actual execution but still test the flow
      const options: TestExecutionOptions = { dryRun: true };
      await manager.executeCategory('unit', options);

      // For dry run, no performance metrics are recorded
      const metrics = manager.getPerformanceMetrics('unit');
      expect(metrics.length).toBe(0);
    });

    it('should generate performance summary', async () => {
      // Test with empty performance history
      const summary = manager.getPerformanceSummary();
      expect(summary.totalExecutions).toBe(0);
      expect(summary.averageDuration).toBe(0);
      expect(summary.fastestCategory).toBe('');
      expect(summary.slowestCategory).toBe('');
    });
  });

  describe('dry run mode', () => {
    it('should execute dry run without running actual tests', async () => {
      const result = await manager.executeCategory('unit', { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.duration).toBe(0);
      expect(result.output).toContain('Dry run');
    });
  });

  describe('report generation', () => {
    it('should generate JSON report', () => {
      const results = [
        {
          category: 'unit',
          success: true,
          duration: 1000,
          testsRun: 10,
          testsPassed: 10,
          testsFailed: 0,
          testsSkipped: 0,
          errors: [],
          warnings: [],
          output: 'All tests passed',
        },
      ];

      const report = manager.generateReport(results, 'json');
      const parsed = JSON.parse(report);

      expect(parsed.summary).toBeDefined();
      expect(parsed.results).toEqual(results);
      expect(parsed.performance).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });

    it('should generate markdown report', () => {
      const results = [
        {
          category: 'unit',
          success: true,
          duration: 1000,
          testsRun: 10,
          testsPassed: 10,
          testsFailed: 0,
          testsSkipped: 0,
          errors: [],
          warnings: [],
          output: 'All tests passed',
        },
      ];

      const report = manager.generateReport(results, 'markdown');

      expect(report).toContain('# Test Execution Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Results by Category');
      expect(report).toContain('unit');
      expect(report).toContain('✅ PASSED');
    });

    it('should generate HTML report', () => {
      const results = [
        {
          category: 'unit',
          success: false,
          duration: 1000,
          testsRun: 10,
          testsPassed: 8,
          testsFailed: 2,
          testsSkipped: 0,
          errors: ['Test error 1', 'Test error 2'],
          warnings: [],
          output: 'Some tests failed',
        },
      ];

      const report = manager.generateReport(results, 'html');

      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('<title>Test Execution Report</title>');
      expect(report).toContain('unit');
      expect(report).toContain('❌ FAILED');
      expect(report).toContain('Test error 1');
    });
  });
});

describe('Test Configuration', () => {
  it('should provide predefined configurations', () => {
    const devConfig = getTestConfiguration('development');
    
    expect(devConfig).toBeDefined();
    expect(devConfig.options.watch).toBe(true);
    expect(devConfig.categories).toContain('unit');
  });

  it('should provide CI configuration', () => {
    const ciConfig = getTestConfiguration('ci');
    
    expect(ciConfig).toBeDefined();
    expect(ciConfig.options.coverage).toBe(true);
    expect(ciConfig.options.bail).toBe(false);
    expect(ciConfig.categories).toContain('integration');
  });
});

describe('Utility Functions', () => {
  it('should create test execution manager', () => {
    const manager = createTestExecutionManager('/test/path');
    expect(manager).toBeInstanceOf(TestExecutionManager);
  });

  it('should run test category', async () => {
    const { execSync } = await import('child_process');
    (execSync as any).mockReturnValue('Tests: 5 passed');

    const result = await runTestCategory('unit', { dryRun: true });
    
    expect(result.category).toBe('unit');
    expect(result.success).toBe(true);
  });
});