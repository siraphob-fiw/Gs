/**
 * Test categorization and execution utilities
 * Provides enhanced test execution with categorization, filtering, and performance monitoring
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Test categories with metadata
 */
export interface TestCategory {
  name: string;
  pattern: string;
  description: string;
  timeout: number;
  parallel: boolean;
  tags: string[];
  dependencies?: string[];
  environment?: 'node' | 'jsdom' | 'browser';
  framework?: 'jest' | 'vitest' | 'playwright';
}

/**
 * Test execution options
 */
export interface TestExecutionOptions {
  category?: string;
  tags?: string[];
  pattern?: string;
  watch?: boolean;
  coverage?: boolean;
  debug?: boolean;
  verbose?: boolean;
  bail?: boolean;
  maxWorkers?: number;
  timeout?: number;
  reporter?: 'default' | 'verbose' | 'json' | 'junit' | 'html';
  outputFile?: string;
  silent?: boolean;
  dryRun?: boolean;
}

/**
 * Test execution result
 */
export interface TestExecutionResult {
  category: string;
  success: boolean;
  duration: number;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  errors: string[];
  warnings: string[];
  output: string;
}

/**
 * Performance metrics for test execution
 */
export interface TestPerformanceMetrics {
  category: string;
  timestamp: number;
  duration: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  testsPerSecond: number;
  averageTestDuration: number;
}

/**
 * Test execution manager with categorization and performance monitoring
 */
export class TestExecutionManager {
  private categories: Map<string, TestCategory> = new Map();
  private performanceHistory: TestPerformanceMetrics[] = [];
  private workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.initializeDefaultCategories();
  }

  /**
   * Initialize default test categories
   */
  private initializeDefaultCategories(): void {
    const defaultCategories: TestCategory[] = [
      {
        name: 'unit',
        pattern: 'src/**/*.{test,spec}.{ts,tsx,js,jsx}',
        description: 'Unit tests for individual components and functions',
        timeout: 30000,
        parallel: true,
        tags: ['fast', 'isolated'],
        environment: 'node',
        framework: 'jest',
      },
      {
        name: 'integration',
        pattern: 'src/**/*.integration.{test,spec}.{ts,tsx,js,jsx}',
        description: 'Integration tests for service interactions',
        timeout: 60000,
        parallel: false,
        tags: ['medium', 'services'],
        dependencies: ['unit'],
        environment: 'node',
        framework: 'jest',
      },
      {
        name: 'e2e',
        pattern: 'src/**/*.e2e.{test,spec}.{ts,tsx,js,jsx}',
        description: 'End-to-end tests for complete workflows',
        timeout: 120000,
        parallel: false,
        tags: ['slow', 'workflows'],
        dependencies: ['unit', 'integration'],
        environment: 'browser',
        framework: 'playwright',
      },
      {
        name: 'component',
        pattern: 'src/**/*.component.{test,spec}.{ts,tsx}',
        description: 'React component tests with rendering',
        timeout: 45000,
        parallel: true,
        tags: ['frontend', 'react'],
        environment: 'jsdom',
        framework: 'jest',
      },
      {
        name: 'api',
        pattern: 'src/**/*.api.{test,spec}.{ts,js}',
        description: 'API endpoint and controller tests',
        timeout: 60000,
        parallel: false,
        tags: ['backend', 'api'],
        environment: 'node',
        framework: 'jest',
      },
      {
        name: 'performance',
        pattern: 'src/**/*.perf.{test,spec}.{ts,tsx,js,jsx}',
        description: 'Performance and load testing scenarios',
        timeout: 300000,
        parallel: false,
        tags: ['slow', 'performance'],
        dependencies: ['unit'],
        environment: 'node',
        framework: 'jest',
      },
      {
        name: 'smoke',
        pattern: 'src/**/*.smoke.{test,spec}.{ts,tsx,js,jsx}',
        description: 'Smoke tests for critical functionality',
        timeout: 60000,
        parallel: true,
        tags: ['fast', 'critical'],
        environment: 'node',
        framework: 'jest',
      },
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.name, category);
    });
  }

  /**
   * Register a custom test category
   */
  registerCategory(category: TestCategory): void {
    this.categories.set(category.name, category);
  }

  /**
   * Get all registered categories
   */
  getCategories(): TestCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get category by name
   */
  getCategory(name: string): TestCategory | undefined {
    return this.categories.get(name);
  }

  /**
   * Filter categories by tags
   */
  getCategoriesByTags(tags: string[]): TestCategory[] {
    return this.getCategories().filter(category =>
      tags.some(tag => category.tags.includes(tag))
    );
  }

  /**
   * Get categories that match a pattern
   */
  getCategoriesByPattern(pattern: string): TestCategory[] {
    const regex = new RegExp(pattern, 'i');
    return this.getCategories().filter(category =>
      regex.test(category.name) || regex.test(category.description)
    );
  }

  /**
   * Build test command for a category
   */
  private buildTestCommand(category: TestCategory, options: TestExecutionOptions): string {
    const framework = category.framework || 'jest';
    let command: string = framework;

    // Add base options
    if (options.watch) {
      command += framework === 'jest' ? ' --watch' : ' --watch';
    } else {
      command += framework === 'jest' ? '' : ' run';
    }

    // Add pattern
    if (options.pattern) {
      command += ` --testPathPattern="${options.pattern}"`;
    } else {
      command += ` --testPathPattern="${category.pattern}"`;
    }

    // Add coverage
    if (options.coverage) {
      command += framework === 'jest' ? ' --coverage' : ' --coverage';
    }

    // Add timeout
    const timeout = options.timeout || category.timeout;
    if (framework === 'jest') {
      command += ` --testTimeout=${timeout}`;
    } else if (framework === 'vitest') {
      command += ` --testTimeout=${timeout}`;
    }

    // Add parallel execution
    if (category.parallel && options.maxWorkers) {
      if (framework === 'jest') {
        command += ` --maxWorkers=${options.maxWorkers}`;
      } else if (framework === 'vitest') {
        command += ` --threads --maxWorkers=${options.maxWorkers}`;
      }
    } else if (!category.parallel) {
      if (framework === 'jest') {
        command += ' --runInBand';
      } else if (framework === 'vitest') {
        command += ' --no-threads';
      }
    }

    // Add reporter
    if (options.reporter && options.reporter !== 'default') {
      if (framework === 'jest') {
        command += ` --reporters=${options.reporter}`;
      } else if (framework === 'vitest') {
        command += ` --reporter=${options.reporter}`;
      }
    }

    // Add verbose
    if (options.verbose) {
      command += ' --verbose';
    }

    // Add bail
    if (options.bail) {
      if (framework === 'jest') {
        command += ' --bail';
      } else if (framework === 'vitest') {
        command += ' --bail=1';
      }
    }

    // Add debug
    if (options.debug) {
      if (framework === 'jest') {
        command = `node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand ${command.replace('jest', '')}`;
      }
    }

    // Add output file
    if (options.outputFile) {
      if (framework === 'jest') {
        command += ` --outputFile=${options.outputFile}`;
      }
    }

    // Add silent mode
    if (options.silent) {
      command += ' --silent';
    }

    return command;
  }

  /**
   * Execute tests for a specific category
   */
  async executeCategory(categoryName: string, options: TestExecutionOptions = {}): Promise<TestExecutionResult> {
    const category = this.categories.get(categoryName);
    if (!category) {
      throw new Error(`Unknown test category: ${categoryName}`);
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    console.log(`\n🧪 Running ${category.name} tests: ${category.description}`);
    console.log(`📁 Pattern: ${category.pattern}`);
    console.log(`🏷️  Tags: ${category.tags.join(', ')}`);

    if (options.dryRun) {
      const command = this.buildTestCommand(category, options);
      console.log(`🚀 Would execute: ${command}`);
      return {
        category: categoryName,
        success: true,
        duration: 0,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        testsSkipped: 0,
        errors: [],
        warnings: [],
        output: `Dry run - would execute: ${command}`,
      };
    }

    try {
      const command = this.buildTestCommand(category, options);
      console.log(`🚀 Command: ${command}\n`);

      const output = execSync(command, {
        cwd: this.workspaceRoot,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      // Parse test results from output (simplified parsing)
      const result = this.parseTestOutput(output, category.framework || 'jest');

      // Record performance metrics
      const metrics: TestPerformanceMetrics = {
        category: categoryName,
        timestamp: startTime,
        duration,
        memoryUsage: endMemory,
        cpuUsage: endCpu,
        testsPerSecond: (result.testsRun || 0) / (duration / 1000),
        averageTestDuration: (result.testsRun || 0) > 0 ? duration / (result.testsRun || 1) : 0,
      };
      this.performanceHistory.push(metrics);

      console.log(`✅ ${category.name} tests completed in ${duration}ms`);
      console.log(`📊 Tests: ${result.testsRun || 0} run, ${result.testsPassed || 0} passed, ${result.testsFailed || 0} failed`);

      return {
        category: categoryName,
        success: (result.testsFailed || 0) === 0,
        duration,
        testsRun: result.testsRun || 0,
        testsPassed: result.testsPassed || 0,
        testsFailed: result.testsFailed || 0,
        testsSkipped: result.testsSkipped || 0,
        coverage: result.coverage,
        errors: result.errors || [],
        warnings: result.warnings || [],
        output: output || '',
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error(`❌ ${category.name} tests failed after ${duration}ms`);

      return {
        category: categoryName,
        success: false,
        duration,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 1,
        testsSkipped: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        output: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Parse test output to extract results
   */
  private parseTestOutput(output: string, framework: string): Partial<TestExecutionResult> {
    const result: Partial<TestExecutionResult> = {
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      testsSkipped: 0,
      errors: [],
      warnings: [],
    };

    if (framework === 'jest') {
      // Parse Jest output
      const testSuiteMatch = output.match(/Test Suites: (\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
      const testMatch = output.match(/Tests:\s+(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);

      if (testMatch) {
        result.testsPassed = parseInt(testMatch[1]) || 0;
        result.testsFailed = parseInt(testMatch[2]) || 0;
        result.testsSkipped = parseInt(testMatch[3]) || 0;
        result.testsRun = result.testsPassed + result.testsFailed + result.testsSkipped;
      }

      // Parse coverage
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        result.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4]),
        };
      }
    } else if (framework === 'vitest') {
      // Parse Vitest output
      const testMatch = output.match(/(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
      if (testMatch) {
        result.testsPassed = parseInt(testMatch[1]) || 0;
        result.testsFailed = parseInt(testMatch[2]) || 0;
        result.testsSkipped = parseInt(testMatch[3]) || 0;
        result.testsRun = result.testsPassed + result.testsFailed + result.testsSkipped;
      }
    }

    return result;
  }

  /**
   * Execute multiple categories in sequence
   */
  async executeCategories(categoryNames: string[], options: TestExecutionOptions = {}): Promise<TestExecutionResult[]> {
    const results: TestExecutionResult[] = [];

    for (const categoryName of categoryNames) {
      const result = await this.executeCategory(categoryName, options);
      results.push(result);

      if (!result.success && options.bail) {
        console.log('\n❌ Test execution stopped due to failure');
        break;
      }
    }

    return results;
  }

  /**
   * Execute tests by tags
   */
  async executeByTags(tags: string[], options: TestExecutionOptions = {}): Promise<TestExecutionResult[]> {
    const categories = this.getCategoriesByTags(tags);
    const categoryNames = categories.map(c => c.name);

    console.log(`\n🏷️  Executing tests with tags: ${tags.join(', ')}`);
    console.log(`📂 Categories: ${categoryNames.join(', ')}`);

    return this.executeCategories(categoryNames, options);
  }

  /**
   * Execute all tests with dependency resolution
   */
  async executeAll(options: TestExecutionOptions = {}): Promise<TestExecutionResult[]> {
    const categories = this.getCategories();
    const sortedCategories = this.resolveDependencies(categories);
    const categoryNames = sortedCategories.map(c => c.name);

    console.log('\n🚀 Executing all test categories');
    console.log(`📂 Execution order: ${categoryNames.join(' → ')}`);

    return this.executeCategories(categoryNames, options);
  }

  /**
   * Resolve category dependencies for execution order
   */
  private resolveDependencies(categories: TestCategory[]): TestCategory[] {
    const resolved: TestCategory[] = [];
    const resolving: Set<string> = new Set();

    const resolve = (category: TestCategory) => {
      if (resolving.has(category.name)) {
        throw new Error(`Circular dependency detected: ${category.name}`);
      }

      if (resolved.find(c => c.name === category.name)) {
        return; // Already resolved
      }

      resolving.add(category.name);

      // Resolve dependencies first
      if (category.dependencies) {
        for (const depName of category.dependencies) {
          const dep = categories.find(c => c.name === depName);
          if (dep) {
            resolve(dep);
          }
        }
      }

      resolving.delete(category.name);
      resolved.push(category);
    };

    categories.forEach(resolve);
    return resolved;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(categoryName?: string): TestPerformanceMetrics[] {
    if (categoryName) {
      return this.performanceHistory.filter(m => m.category === categoryName);
    }
    return [...this.performanceHistory];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalExecutions: number;
    averageDuration: number;
    fastestCategory: string;
    slowestCategory: string;
    totalTestsExecuted: number;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        totalExecutions: 0,
        averageDuration: 0,
        fastestCategory: '',
        slowestCategory: '',
        totalTestsExecuted: 0,
      };
    }

    const totalDuration = this.performanceHistory.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / this.performanceHistory.length;

    const fastest = this.performanceHistory.reduce((min, m) => m.duration < min.duration ? m : min);
    const slowest = this.performanceHistory.reduce((max, m) => m.duration > max.duration ? m : max);

    return {
      totalExecutions: this.performanceHistory.length,
      averageDuration,
      fastestCategory: fastest.category,
      slowestCategory: slowest.category,
      totalTestsExecuted: this.performanceHistory.length,
    };
  }

  /**
   * Generate test execution report
   */
  generateReport(results: TestExecutionResult[], format: 'json' | 'html' | 'markdown' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify({
          summary: this.generateSummary(results),
          results,
          performance: this.getPerformanceSummary(),
          timestamp: new Date().toISOString(),
        }, null, 2);

      case 'markdown':
        return this.generateMarkdownReport(results);

      case 'html':
        return this.generateHtmlReport(results);

      default:
        return JSON.stringify(results, null, 2);
    }
  }

  /**
   * Generate summary from results
   */
  private generateSummary(results: TestExecutionResult[]) {
    const totalTests = results.reduce((sum, r) => sum + r.testsRun, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.testsPassed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.testsFailed, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.testsSkipped, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const successfulCategories = results.filter(r => r.success).length;

    return {
      totalCategories: results.length,
      successfulCategories,
      failedCategories: results.length - successfulCategories,
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      totalDuration,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
    };
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(results: TestExecutionResult[]): string {
    const summary = this.generateSummary(results);
    const performance = this.getPerformanceSummary();

    let report = '# Test Execution Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    report += '## Summary\n\n';
    report += `- **Total Categories:** ${summary.totalCategories}\n`;
    report += `- **Successful:** ${summary.successfulCategories}\n`;
    report += `- **Failed:** ${summary.failedCategories}\n`;
    report += `- **Total Tests:** ${summary.totalTests}\n`;
    report += `- **Passed:** ${summary.totalPassed}\n`;
    report += `- **Failed:** ${summary.totalFailed}\n`;
    report += `- **Skipped:** ${summary.totalSkipped}\n`;
    report += `- **Success Rate:** ${summary.successRate.toFixed(2)}%\n`;
    report += `- **Total Duration:** ${summary.totalDuration}ms\n\n`;

    report += '## Performance\n\n';
    report += `- **Average Duration:** ${performance.averageDuration.toFixed(2)}ms\n`;
    report += `- **Fastest Category:** ${performance.fastestCategory}\n`;
    report += `- **Slowest Category:** ${performance.slowestCategory}\n\n`;

    report += '## Results by Category\n\n';
    report += '| Category | Status | Tests | Passed | Failed | Skipped | Duration |\n';
    report += '|----------|--------|-------|--------|--------|---------|----------|\n';

    results.forEach(result => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      report += `| ${result.category} | ${status} | ${result.testsRun} | ${result.testsPassed} | ${result.testsFailed} | ${result.testsSkipped} | ${result.duration}ms |\n`;
    });

    if (results.some(r => !r.success)) {
      report += '\n## Errors\n\n';
      results.filter(r => !r.success).forEach(result => {
        report += `### ${result.category}\n\n`;
        result.errors.forEach(error => {
          report += `- ${error}\n`;
        });
        report += '\n';
      });
    }

    return report;
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(results: TestExecutionResult[]): string {
    const summary = this.generateSummary(results);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .success { color: green; }
        .failure { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Test Execution Report</h1>
    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Categories:</strong> ${summary.totalCategories}</p>
        <p><strong>Successful:</strong> <span class="success">${summary.successfulCategories}</span></p>
        <p><strong>Failed:</strong> <span class="failure">${summary.failedCategories}</span></p>
        <p><strong>Total Tests:</strong> ${summary.totalTests}</p>
        <p><strong>Success Rate:</strong> ${summary.successRate.toFixed(2)}%</p>
        <p><strong>Total Duration:</strong> ${summary.totalDuration}ms</p>
    </div>
    
    <h2>Results by Category</h2>
    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Tests</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Skipped</th>
                <th>Duration</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(result => `
                <tr>
                    <td>${result.category}</td>
                    <td class="${result.success ? 'success' : 'failure'}">
                        ${result.success ? '✅ PASSED' : '❌ FAILED'}
                    </td>
                    <td>${result.testsRun}</td>
                    <td class="success">${result.testsPassed}</td>
                    <td class="failure">${result.testsFailed}</td>
                    <td class="warning">${result.testsSkipped}</td>
                    <td>${result.duration}ms</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${results.some(r => !r.success) ? `
        <h2>Errors</h2>
        ${results.filter(r => !r.success).map(result => `
            <h3>${result.category}</h3>
            <ul>
                ${result.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `).join('')}
    ` : ''}
</body>
</html>
    `.trim();
  }

  /**
   * Save performance metrics to file
   */
  savePerformanceMetrics(filePath: string): void {
    const data = {
      metrics: this.performanceHistory,
      summary: this.getPerformanceSummary(),
      timestamp: new Date().toISOString(),
    };

    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Load performance metrics from file
   */
  loadPerformanceMetrics(filePath: string): void {
    if (existsSync(filePath)) {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      this.performanceHistory = data.metrics || [];
    }
  }

  /**
   * Clear performance history
   */
  clearPerformanceHistory(): void {
    this.performanceHistory = [];
  }
}

/**
 * Create test execution manager with workspace detection
 */
export function createTestExecutionManager(workspaceRoot?: string): TestExecutionManager {
  const root = workspaceRoot || findWorkspaceRoot();
  return new TestExecutionManager(root);
}

/**
 * Find workspace root by looking for package.json
 */
function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let currentDir = startDir;
  
  while (currentDir !== resolve(currentDir, '..')) {
    if (existsSync(join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = resolve(currentDir, '..');
  }
  
  return startDir;
}

/**
 * Quick test execution functions
 */
export async function runTestCategory(category: string, options: TestExecutionOptions = {}): Promise<TestExecutionResult> {
  const manager = createTestExecutionManager();
  return manager.executeCategory(category, options);
}

export async function runTestsByTags(tags: string[], options: TestExecutionOptions = {}): Promise<TestExecutionResult[]> {
  const manager = createTestExecutionManager();
  return manager.executeByTags(tags, options);
}

export async function runAllTests(options: TestExecutionOptions = {}): Promise<TestExecutionResult[]> {
  const manager = createTestExecutionManager();
  return manager.executeAll(options);
}

/**
 * CLI helper for test execution
 */
export class TestExecutionCLI {
  private manager: TestExecutionManager;

  constructor(workspaceRoot?: string) {
    this.manager = createTestExecutionManager(workspaceRoot);
  }

  /**
   * Parse CLI arguments
   */
  parseArgs(args: string[]): { command: string; options: TestExecutionOptions } {
    const options: TestExecutionOptions = {};
    let command = 'help';

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case 'run':
        case 'watch':
        case 'list':
        case 'help':
          command = arg;
          break;
        case '--category':
          options.category = args[++i];
          break;
        case '--tags':
          options.tags = args[++i]?.split(',') || [];
          break;
        case '--pattern':
          options.pattern = args[++i];
          break;
        case '--watch':
          options.watch = true;
          break;
        case '--coverage':
          options.coverage = true;
          break;
        case '--debug':
          options.debug = true;
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--bail':
          options.bail = true;
          break;
        case '--silent':
          options.silent = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--max-workers':
          options.maxWorkers = parseInt(args[++i]) || 4;
          break;
        case '--timeout':
          options.timeout = parseInt(args[++i]) || 30000;
          break;
        case '--reporter':
          options.reporter = args[++i] as any;
          break;
        case '--output':
          options.outputFile = args[++i];
          break;
      }
    }

    return { command, options };
  }

  /**
   * Execute CLI command
   */
  async execute(args: string[]): Promise<void> {
    const { command, options } = this.parseArgs(args);

    switch (command) {
      case 'run':
        await this.runCommand(options);
        break;
      case 'watch':
        await this.watchCommand(options);
        break;
      case 'list':
        this.listCommand();
        break;
      case 'help':
      default:
        this.helpCommand();
        break;
    }
  }

  private async runCommand(options: TestExecutionOptions): Promise<void> {
    let results: TestExecutionResult[];

    if (options.category) {
      results = [await this.manager.executeCategory(options.category, options)];
    } else if (options.tags?.length) {
      results = await this.manager.executeByTags(options.tags, options);
    } else {
      results = await this.manager.executeAll(options);
    }

    // Generate report
    if (options.outputFile) {
      const report = this.manager.generateReport(results, 'json');
      writeFileSync(options.outputFile, report);
      console.log(`\n📄 Report saved to: ${options.outputFile}`);
    }

    // Print summary
    const summary = results.reduce((acc, r) => ({
      total: acc.total + r.testsRun,
      passed: acc.passed + r.testsPassed,
      failed: acc.failed + r.testsFailed,
      duration: acc.duration + r.duration,
    }), { total: 0, passed: 0, failed: 0, duration: 0 });

    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📈 Results: ${summary.passed}/${summary.total} tests passed`);
    console.log(`⏱️  Total time: ${summary.duration}ms`);
    console.log(`🎯 Success rate: ${summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(2) : 0}%`);

    if (summary.failed > 0) {
      console.log('💥 Some tests failed');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed!');
    }
  }

  private async watchCommand(options: TestExecutionOptions): Promise<void> {
    options.watch = true;
    await this.runCommand(options);
  }

  private listCommand(): void {
    const categories = this.manager.getCategories();

    console.log('\n📂 Available Test Categories:\n');
    categories.forEach(category => {
      console.log(`🏷️  ${category.name}`);
      console.log(`   📝 ${category.description}`);
      console.log(`   📁 Pattern: ${category.pattern}`);
      console.log(`   🏃 Parallel: ${category.parallel ? 'Yes' : 'No'}`);
      console.log(`   ⏱️  Timeout: ${category.timeout}ms`);
      console.log(`   🏷️  Tags: ${category.tags.join(', ')}`);
      if (category.dependencies?.length) {
        console.log(`   🔗 Dependencies: ${category.dependencies.join(', ')}`);
      }
      console.log('');
    });
  }

  private helpCommand(): void {
    console.log(`
🧪 Test Execution CLI

Usage:
  test-runner <command> [options]

Commands:
  run                    Run tests
  watch                  Run tests in watch mode
  list                   List available test categories
  help                   Show this help message

Options:
  --category <name>      Run specific test category
  --tags <tag1,tag2>     Run tests with specific tags
  --pattern <pattern>    Run tests matching pattern
  --watch                Run in watch mode
  --coverage             Generate coverage report
  --debug                Run in debug mode
  --verbose              Verbose output
  --bail                 Stop on first failure
  --silent               Silent mode
  --dry-run              Show what would be executed
  --max-workers <n>      Maximum number of workers
  --timeout <ms>         Test timeout in milliseconds
  --reporter <type>      Reporter type (default, verbose, json, junit, html)
  --output <file>        Output file for report

Examples:
  test-runner run --category unit
  test-runner run --tags fast,isolated
  test-runner watch --category integration
  test-runner run --coverage --reporter html --output report.html
    `);
  }
}