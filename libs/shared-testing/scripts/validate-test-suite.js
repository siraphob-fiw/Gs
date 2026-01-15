#!/usr/bin/env node

/**
 * Test Suite Validation Script
 * 
 * This script validates the final test suite performance and reliability
 * by running comprehensive tests and measuring execution times.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestSuiteValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      performance: {},
      reliability: {},
      coverage: {},
      errors: [],
      warnings: [],
      summary: {}
    };
    
    this.performanceTargets = {
      unit: 30000,      // 30 seconds
      integration: 60000, // 60 seconds
      e2e: 120000       // 2 minutes
    };
  }

  async validateTestSuite() {
    console.log('🧪 Starting Test Suite Validation...\n');
    
    try {
      await this.validateTestApplications();
      await this.runPerformanceTests();
      await this.runReliabilityTests();
      await this.validateCoverage();
      await this.generateReport();
      
      console.log('✅ Test Suite Validation Complete!\n');
      return this.results;
    } catch (error) {
      console.error('❌ Test Suite Validation Failed:', error.message);
      this.results.errors.push({
        type: 'validation_failure',
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async validateTestApplications() {
    console.log('📋 Validating Test Applications...');
    
    const testAppsDir = path.join(process.cwd(), 'test-apps');
    
    if (!fs.existsSync(testAppsDir)) {
      throw new Error('test-apps directory not found');
    }

    const testApps = fs.readdirSync(testAppsDir)
      .filter(dir => fs.statSync(path.join(testAppsDir, dir)).isDirectory());

    console.log(`Found ${testApps.length} test applications:`);
    
    for (const app of testApps) {
      console.log(`  - ${app}`);
      await this.validateTestApplication(app);
    }

    this.results.testApplications = testApps;
    console.log('✅ Test Applications Validated\n');
  }

  async validateTestApplication(appName) {
    const appPath = path.join(process.cwd(), 'test-apps', appName);
    const packageJsonPath = path.join(appPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.results.warnings.push(`Missing package.json in ${appName}`);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Validate test scripts
    const requiredScripts = ['test', 'test:unit'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        this.results.warnings.push(`Missing ${script} script in ${appName}`);
      }
    }

    // Validate dependencies
    const requiredDeps = ['@strengthos/shared-testing'];
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        this.results.warnings.push(`Missing dependency ${dep} in ${appName}`);
      }
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...');
    
    const testApps = ['sos-web-api-tests', 'sos-web-training-tests'];
    
    for (const app of testApps) {
      if (fs.existsSync(path.join(process.cwd(), 'test-apps', app))) {
        await this.measureTestPerformance(app);
      }
    }

    console.log('✅ Performance Tests Complete\n');
  }

  async measureTestPerformance(appName) {
    console.log(`  📊 Measuring performance for ${appName}...`);
    
    const appPath = path.join(process.cwd(), 'test-apps', appName);
    const testTypes = ['unit', 'integration', 'e2e'];
    
    this.results.performance[appName] = {};

    for (const testType of testTypes) {
      try {
        const startTime = Date.now();
        
        // Run tests with timeout
        const result = await this.runTestWithTimeout(appPath, testType, this.performanceTargets[testType]);
        
        const duration = Date.now() - startTime;
        const passed = result.exitCode === 0;
        
        this.results.performance[appName][testType] = {
          duration,
          passed,
          target: this.performanceTargets[testType],
          withinTarget: duration <= this.performanceTargets[testType]
        };

        const status = passed ? '✅' : '❌';
        const timeStatus = duration <= this.performanceTargets[testType] ? '⚡' : '⏰';
        
        console.log(`    ${status} ${timeStatus} ${testType}: ${duration}ms (target: ${this.performanceTargets[testType]}ms)`);
        
      } catch (error) {
        this.results.performance[appName][testType] = {
          duration: null,
          passed: false,
          error: error.message,
          target: this.performanceTargets[testType],
          withinTarget: false
        };
        
        console.log(`    ❌ ${testType}: Failed - ${error.message}`);
      }
    }
  }

  async runTestWithTimeout(appPath, testType, timeout) {
    return new Promise((resolve, reject) => {
      const testCommand = testType === 'unit' ? 'npm run test:unit' : `npm run test:${testType}`;
      
      const child = spawn('npm', ['run', `test:${testType}`], {
        cwd: appPath,
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code,
          stdout,
          stderr
        });
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  async runReliabilityTests() {
    console.log('🔄 Running Reliability Tests...');
    
    const iterations = 3;
    const testApps = ['sos-web-api-tests'];
    
    for (const app of testApps) {
      if (fs.existsSync(path.join(process.cwd(), 'test-apps', app))) {
        await this.measureTestReliability(app, iterations);
      }
    }

    console.log('✅ Reliability Tests Complete\n');
  }

  async measureTestReliability(appName, iterations) {
    console.log(`  🔄 Testing reliability for ${appName} (${iterations} iterations)...`);
    
    const appPath = path.join(process.cwd(), 'test-apps', appName);
    const results = [];
    
    for (let i = 1; i <= iterations; i++) {
      console.log(`    Iteration ${i}/${iterations}...`);
      
      try {
        const startTime = Date.now();
        const result = await this.runTestWithTimeout(appPath, 'unit', 60000);
        const duration = Date.now() - startTime;
        
        results.push({
          iteration: i,
          passed: result.exitCode === 0,
          duration,
          exitCode: result.exitCode
        });
        
      } catch (error) {
        results.push({
          iteration: i,
          passed: false,
          duration: null,
          error: error.message
        });
      }
    }

    const passedCount = results.filter(r => r.passed).length;
    const reliability = (passedCount / iterations) * 100;
    const avgDuration = results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / passedCount || 0;

    this.results.reliability[appName] = {
      iterations,
      passedCount,
      reliability,
      avgDuration,
      results
    };

    console.log(`    📊 Reliability: ${reliability}% (${passedCount}/${iterations} passed)`);
    console.log(`    ⏱️  Average Duration: ${Math.round(avgDuration)}ms`);
  }

  async validateCoverage() {
    console.log('📈 Validating Test Coverage...');
    
    const testApps = ['sos-web-api-tests'];
    
    for (const app of testApps) {
      if (fs.existsSync(path.join(process.cwd(), 'test-apps', app))) {
        await this.measureCoverage(app);
      }
    }

    console.log('✅ Coverage Validation Complete\n');
  }

  async measureCoverage(appName) {
    console.log(`  📊 Measuring coverage for ${appName}...`);
    
    const appPath = path.join(process.cwd(), 'test-apps', appName);
    
    try {
      const result = await this.runTestWithTimeout(appPath, 'coverage', 120000);
      
      // Parse coverage results (simplified)
      const coverageData = {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      };

      this.results.coverage[appName] = {
        ...coverageData,
        passed: result.exitCode === 0
      };

      console.log(`    📊 Coverage collected for ${appName}`);
      
    } catch (error) {
      this.results.coverage[appName] = {
        error: error.message,
        passed: false
      };
      
      console.log(`    ⚠️  Coverage collection failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('📋 Generating Validation Report...');
    
    // Calculate summary statistics
    this.calculateSummary();
    
    // Write detailed report
    const reportPath = path.join(process.cwd(), 'test-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Write human-readable summary
    const summaryPath = path.join(process.cwd(), 'test-validation-summary.md');
    const summaryContent = this.generateSummaryMarkdown();
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log(`📄 Detailed report: ${reportPath}`);
    console.log(`📄 Summary report: ${summaryPath}`);
    
    // Display summary
    this.displaySummary();
  }

  calculateSummary() {
    const summary = {
      totalTestApps: Object.keys(this.results.performance).length,
      performanceTargetsMet: 0,
      totalPerformanceTests: 0,
      averageReliability: 0,
      totalErrors: this.results.errors.length,
      totalWarnings: this.results.warnings.length
    };

    // Calculate performance metrics
    for (const app of Object.keys(this.results.performance)) {
      for (const testType of Object.keys(this.results.performance[app])) {
        summary.totalPerformanceTests++;
        if (this.results.performance[app][testType].withinTarget) {
          summary.performanceTargetsMet++;
        }
      }
    }

    // Calculate average reliability
    const reliabilityValues = Object.values(this.results.reliability)
      .map(r => r.reliability)
      .filter(r => typeof r === 'number');
    
    if (reliabilityValues.length > 0) {
      summary.averageReliability = reliabilityValues.reduce((sum, r) => sum + r, 0) / reliabilityValues.length;
    }

    summary.performanceScore = summary.totalPerformanceTests > 0 
      ? (summary.performanceTargetsMet / summary.totalPerformanceTests) * 100 
      : 0;

    this.results.summary = summary;
  }

  generateSummaryMarkdown() {
    const { summary } = this.results;
    
    return `# Test Suite Validation Report

Generated: ${this.results.timestamp}

## Summary

- **Test Applications**: ${summary.totalTestApps}
- **Performance Score**: ${summary.performanceScore.toFixed(1)}% (${summary.performanceTargetsMet}/${summary.totalPerformanceTests} targets met)
- **Average Reliability**: ${summary.averageReliability.toFixed(1)}%
- **Errors**: ${summary.totalErrors}
- **Warnings**: ${summary.totalWarnings}

## Performance Results

${Object.entries(this.results.performance).map(([app, tests]) => `
### ${app}

${Object.entries(tests).map(([testType, result]) => `
- **${testType}**: ${result.duration ? `${result.duration}ms` : 'Failed'} ${result.withinTarget ? '✅' : '❌'} (target: ${result.target}ms)
`).join('')}
`).join('')}

## Reliability Results

${Object.entries(this.results.reliability).map(([app, result]) => `
### ${app}

- **Reliability**: ${result.reliability}% (${result.passedCount}/${result.iterations} iterations passed)
- **Average Duration**: ${Math.round(result.avgDuration)}ms
`).join('')}

## Recommendations

${this.generateRecommendations()}

---

*Generated by Test Suite Validator*
`;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.performanceScore < 80) {
      recommendations.push('- Consider optimizing slow tests or increasing timeout targets');
    }
    
    if (this.results.summary.averageReliability < 95) {
      recommendations.push('- Investigate flaky tests and improve test stability');
    }
    
    if (this.results.errors.length > 0) {
      recommendations.push('- Address critical errors in test configuration');
    }
    
    if (this.results.warnings.length > 5) {
      recommendations.push('- Review and resolve test setup warnings');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Test suite is performing well! Continue monitoring performance trends.');
    }
    
    return recommendations.join('\n');
  }

  displaySummary() {
    const { summary } = this.results;
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Test Applications: ${summary.totalTestApps}`);
    console.log(`Performance Score: ${summary.performanceScore.toFixed(1)}%`);
    console.log(`Average Reliability: ${summary.averageReliability.toFixed(1)}%`);
    console.log(`Errors: ${summary.totalErrors}`);
    console.log(`Warnings: ${summary.totalWarnings}`);
    
    if (summary.performanceScore >= 80 && summary.averageReliability >= 95 && summary.totalErrors === 0) {
      console.log('\n🎉 Test suite validation PASSED!');
    } else {
      console.log('\n⚠️  Test suite validation completed with issues.');
    }
    
    console.log('='.repeat(50));
  }
}

// CLI execution
if (require.main === module) {
  const validator = new TestSuiteValidator();
  
  validator.validateTestSuite()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = TestSuiteValidator;