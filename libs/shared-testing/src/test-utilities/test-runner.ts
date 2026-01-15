import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { Results } from '@strengthos/shared-utils';

export interface TestSuite {
  name: string;
  pattern: string;
  timeout?: number;
  parallel?: boolean;
  description: string;
}

export interface TestRunnerOptions {
  verbose?: boolean;
  coverage?: boolean;
  watch?: boolean;
  suite?: string;
  bail?: boolean;
  maxWorkers?: number;
  testTimeout?: number;
}

export interface TestResult {
  suite: string;
  success: boolean;
  duration: number;
  errors?: string[];
}

export interface TestSummary {
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  totalDuration: number;
  results: TestResult[];
}

export class TestRunner {
  private options: TestRunnerOptions;
  private testSuites: TestSuite[];

  constructor(options: TestRunnerOptions = {}) {
    this.options = {
      verbose: false,
      coverage: false,
      watch: false,
      bail: true,
      maxWorkers: 4,
      testTimeout: 30000,
      ...options
    };

    this.testSuites = this.getDefaultTestSuites();
  }

  private getDefaultTestSuites(): TestSuite[] {
    return [
      {
        name: 'unit',
        pattern: 'src/**/*.test.ts',
        timeout: 30000,
        parallel: true,
        description: 'Unit tests for individual components and functions',
      },
      {
        name: 'integration',
        pattern: 'src/**/*.integration.test.ts',
        timeout: 60000,
        parallel: false,
        description: 'Integration tests for service interactions',
      },
      {
        name: 'e2e',
        pattern: 'src/**/*.e2e.test.ts',
        timeout: 120000,
        parallel: false,
        description: 'End-to-end tests for complete workflows',
      },
      {
        name: 'performance',
        pattern: 'src/**/*.perf.test.ts',
        timeout: 180000,
        parallel: false,
        description: 'Performance and load testing scenarios',
      },
    ];
  }

  /**
   * Add a custom test suite
   */
  addTestSuite(suite: TestSuite): void {
    this.testSuites.push(suite);
  }

  /**
   * Remove a test suite by name
   */
  removeTestSuite(name: string): void {
    this.testSuites = this.testSuites.filter(suite => suite.name !== name);
  }

  /**
   * Get all available test suites
   */
  getTestSuites(): TestSuite[] {
    return [...this.testSuites];
  }

  /**
   * Check if prerequisites are met
   */
  async checkPrerequisites(): Promise<Results<boolean>> {
    try {
      console.log('🔍 Checking prerequisites...');

      // Check if test environment is configured
      const requiredEnvVars = [
        'NODE_ENV',
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PWD',
        'DB_DB',
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        return Results.error(false, `Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Check if test database is available
      try {
        execSync('npm run db:test:check', { encoding: 'utf8', stdio: 'pipe' });
        console.log('✅ Test database is available');
      } catch (error) {
        return Results.error(false, 'Test database is not available');
      }

      // Check if test directories exist
      const testDirs = ['src/__tests__', 'src/**/*.test.ts'];
      for (const pattern of testDirs) {
        if (pattern.includes('*')) continue; // Skip glob patterns
        if (!existsSync(pattern)) {
          return Results.error(false, `Test directory not found: ${pattern}`);
        }
      }

      console.log('✅ Prerequisites check passed');
      return Results.ok(true);
    } catch (error) {
      return Results.error(false, `Prerequisites check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the vitest command for a specific suite
   */
  private buildVitestCommand(suite?: TestSuite): string {
    let command = 'vitest';
    
    if (this.options.watch) {
      command += ' watch';
    } else {
      command += ' run';
    }

    if (suite) {
      command += ` "${suite.pattern}"`;
    }

    if (this.options.coverage) {
      command += ' --coverage';
    }

    if (suite?.timeout || this.options.testTimeout) {
      command += ` --testTimeout=${suite?.timeout || this.options.testTimeout}`;
    }

    if (suite?.parallel === false) {
      command += ' --no-threads';
    } else if (this.options.maxWorkers) {
      command += ` --threads --maxWorkers=${this.options.maxWorkers}`;
    }

    if (this.options.verbose) {
      command += ' --reporter=verbose';
    }

    if (this.options.bail) {
      command += ' --bail=1';
    }

    return command;
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suite: TestSuite): Promise<TestResult> {
    console.log(`\n🧪 Running ${suite.name} tests: ${suite.description}`);
    console.log(`📁 Pattern: ${suite.pattern}`);
    
    const startTime = Date.now();
    
    try {
      const command = this.buildVitestCommand(suite);
      console.log(`🚀 Command: ${command}\n`);
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'test' },
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${suite.name} tests completed in ${duration}ms`);
      
      return {
        suite: suite.name,
        success: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${suite.name} tests failed after ${duration}ms`);
      
      return {
        suite: suite.name,
        success: false,
        duration,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestSummary> {
    console.log('🚀 Starting comprehensive test suite\n');
    
    const results: TestResult[] = [];
    let totalDuration = 0;
    
    for (const suite of this.testSuites) {
      const result = await this.runTestSuite(suite);
      results.push(result);
      totalDuration += result.duration;
      
      if (!result.success && this.options.bail) {
        console.log('\n❌ Test suite failed, stopping execution');
        break;
      }
    }
    
    const summary: TestSummary = {
      totalSuites: results.length,
      passedSuites: results.filter(r => r.success).length,
      failedSuites: results.filter(r => !r.success).length,
      totalDuration,
      results,
    };

    this.printSummary(summary);
    return summary;
  }

  /**
   * Run a specific test suite by name
   */
  async runSpecificSuite(suiteName: string): Promise<TestResult> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    
    if (!suite) {
      throw new Error(`Unknown test suite: ${suiteName}. Available suites: ${this.testSuites.map(s => s.name).join(', ')}`);
    }
    
    console.log(`🚀 Running ${suite.name} test suite\n`);
    return await this.runTestSuite(suite);
  }

  /**
   * Print test summary
   */
  private printSummary(summary: TestSummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    summary.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.suite.padEnd(12)} - ${duration.padStart(8)}`);
      
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   ❗ ${error}`);
        });
      }
    });
    
    console.log('='.repeat(60));
    console.log(`📈 Results: ${summary.passedSuites}/${summary.totalSuites} test suites passed`);
    console.log(`⏱️  Total time: ${summary.totalDuration}ms`);
    
    if (summary.passedSuites === summary.totalSuites) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('💥 Some tests failed');
    }
  }

  /**
   * Setup test environment
   */
  async setup(): Promise<Results<boolean>> {
    try {
      console.log('🔧 Setting up test environment...');
      
      // Set test environment
      process.env.NODE_ENV = 'test';
      
      // Check prerequisites
      const prereqResult = await this.checkPrerequisites();
      if (!prereqResult.isOk) {
        return prereqResult;
      }

      // Initialize test database
      try {
        execSync('npm run db:test:migrate', { stdio: 'inherit' });
        console.log('✅ Test database initialized');
      } catch (error) {
        return Results.error(false, 'Failed to initialize test database');
      }

      console.log('✅ Test environment setup complete');
      return Results.ok(true);
    } catch (error) {
      return Results.error(false, `Test setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanup(): Promise<Results<boolean>> {
    try {
      console.log('🧹 Cleaning up test environment...');
      
      // Clean test database
      try {
        execSync('npm run db:test:reset', { stdio: 'inherit' });
        console.log('✅ Test database cleaned');
      } catch (error) {
        console.warn('⚠️  Failed to clean test database');
      }

      console.log('✅ Test environment cleanup complete');
      return Results.ok(true);
    } catch (error) {
      return Results.error(false, `Test cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset test database
   */
  async resetDatabase(): Promise<Results<boolean>> {
    try {
      execSync('npm run db:test:reset', { stdio: 'pipe' });
      return Results.ok(true);
    } catch (error) {
      return Results.error(false, `Database reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate test report
   */
  generateReport(summary: TestSummary, format: 'json' | 'html' | 'markdown' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(summary, null, 2);
      
      case 'markdown':
        return this.generateMarkdownReport(summary);
      
      case 'html':
        return this.generateHtmlReport(summary);
      
      default:
        return JSON.stringify(summary, null, 2);
    }
  }

  private generateMarkdownReport(summary: TestSummary): string {
    const { totalSuites, passedSuites, failedSuites, totalDuration, results } = summary;
    
    let report = '# Test Report\n\n';
    report += `**Total Suites:** ${totalSuites}\n`;
    report += `**Passed:** ${passedSuites}\n`;
    report += `**Failed:** ${failedSuites}\n`;
    report += `**Total Duration:** ${totalDuration}ms\n\n`;
    
    report += '## Results\n\n';
    report += '| Suite | Status | Duration |\n';
    report += '|-------|--------|----------|\n';
    
    results.forEach(result => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      report += `| ${result.suite} | ${status} | ${result.duration}ms |\n`;
    });
    
    if (failedSuites > 0) {
      report += '\n## Errors\n\n';
      results.filter(r => !r.success).forEach(result => {
        report += `### ${result.suite}\n\n`;
        if (result.errors) {
          result.errors.forEach(error => {
            report += `- ${error}\n`;
          });
        }
        report += '\n';
      });
    }
    
    return report;
  }

  private generateHtmlReport(summary: TestSummary): string {
    const { totalSuites, passedSuites, failedSuites, totalDuration, results } = summary;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .passed { color: green; }
        .failed { color: red; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Suites:</strong> ${totalSuites}</p>
        <p><strong>Passed:</strong> <span class="passed">${passedSuites}</span></p>
        <p><strong>Failed:</strong> <span class="failed">${failedSuites}</span></p>
        <p><strong>Total Duration:</strong> ${totalDuration}ms</p>
    </div>
    
    <h2>Results</h2>
    <table>
        <thead>
            <tr>
                <th>Suite</th>
                <th>Status</th>
                <th>Duration</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(result => `
                <tr>
                    <td>${result.suite}</td>
                    <td class="${result.success ? 'passed' : 'failed'}">
                        ${result.success ? '✅ PASSED' : '❌ FAILED'}
                    </td>
                    <td>${result.duration}ms</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${failedSuites > 0 ? `
        <h2>Errors</h2>
        ${results.filter(r => !r.success).map(result => `
            <h3>${result.suite}</h3>
            <ul>
                ${result.errors?.map(error => `<li>${error}</li>`).join('') || ''}
            </ul>
        `).join('')}
    ` : ''}
</body>
</html>
    `.trim();
  }
}

/**
 * Create a test runner with default configuration
 */
export function createTestRunner(options: TestRunnerOptions = {}): TestRunner {
  return new TestRunner(options);
}

/**
 * Quick test runner for simple scenarios
 */
export async function runTests(pattern?: string, options: TestRunnerOptions = {}): Promise<TestSummary> {
  const runner = createTestRunner(options);
  
  if (pattern) {
    runner.addTestSuite({
      name: 'custom',
      pattern,
      description: 'Custom test pattern',
      timeout: options.testTimeout || 30000,
      parallel: true,
    });
    
    const result = await runner.runSpecificSuite('custom');
    return {
      totalSuites: 1,
      passedSuites: result.success ? 1 : 0,
      failedSuites: result.success ? 0 : 1,
      totalDuration: result.duration,
      results: [result],
    };
  }
  
  return await runner.runAllTests();
}