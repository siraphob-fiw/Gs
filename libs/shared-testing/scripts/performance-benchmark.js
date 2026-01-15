#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * 
 * This script creates performance benchmarks for the test suite
 * and monitors performance trends over time.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
  constructor() {
    this.benchmarkFile = path.join(process.cwd(), 'test-performance-history.json');
    this.currentResults = {
      timestamp: new Date().toISOString(),
      benchmarks: {},
      environment: this.getEnvironmentInfo(),
      summary: {}
    };
  }

  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      totalMemory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) + 'GB',
      ci: !!process.env.CI
    };
  }

  async runBenchmarks() {
    console.log('🏃 Running Performance Benchmarks...\n');
    
    try {
      await this.benchmarkTestExecution();
      await this.benchmarkMemoryUsage();
      await this.benchmarkParallelExecution();
      await this.saveResults();
      await this.generateTrendReport();
      
      console.log('✅ Performance Benchmarks Complete!\n');
      return this.currentResults;
    } catch (error) {
      console.error('❌ Benchmark Failed:', error.message);
      throw error;
    }
  }

  async benchmarkTestExecution() {
    console.log('⚡ Benchmarking Test Execution Speed...');
    
    const testApps = this.getTestApplications();
    
    for (const app of testApps) {
      console.log(`  📊 Benchmarking ${app}...`);
      
      const appPath = path.join(process.cwd(), 'test-apps', app);
      const benchmarks = {};
      
      // Benchmark different test types
      const testTypes = ['unit', 'integration'];
      
      for (const testType of testTypes) {
        try {
          const metrics = await this.measureTestTypePerformance(appPath, testType);
          benchmarks[testType] = metrics;
          
          console.log(`    ${testType}: ${metrics.duration}ms (${metrics.testsRun} tests)`);
        } catch (error) {
          console.log(`    ${testType}: Failed - ${error.message}`);
          benchmarks[testType] = { error: error.message };
        }
      }
      
      this.currentResults.benchmarks[app] = benchmarks;
    }
    
    console.log('✅ Test Execution Benchmarks Complete\n');
  }

  async measureTestTypePerformance(appPath, testType) {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    
    try {
      // Run tests and capture output
      const command = `npm run test:${testType} -- --passWithNoTests --silent`;
      const output = execSync(command, { 
        cwd: appPath, 
        encoding: 'utf8',
        timeout: 120000 // 2 minutes max
      });
      
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      
      // Parse test results (simplified)
      const testsRun = this.parseTestCount(output);
      
      return {
        duration: Math.round(duration),
        testsRun,
        memoryDelta,
        avgTimePerTest: testsRun > 0 ? Math.round(duration / testsRun) : 0
      };
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  parseTestCount(output) {
    // Simple regex to extract test count from Jest output
    const match = output.match(/(\d+) passed/);
    return match ? parseInt(match[1]) : 0;
  }

  async benchmarkMemoryUsage() {
    console.log('💾 Benchmarking Memory Usage...');
    
    const testApps = this.getTestApplications();
    
    for (const app of testApps) {
      console.log(`  📊 Memory benchmark for ${app}...`);
      
      try {
        const memoryMetrics = await this.measureMemoryUsage(app);
        
        if (!this.currentResults.benchmarks[app]) {
          this.currentResults.benchmarks[app] = {};
        }
        
        this.currentResults.benchmarks[app].memory = memoryMetrics;
        
        console.log(`    Peak Memory: ${Math.round(memoryMetrics.peakMemory / 1024 / 1024)}MB`);
        console.log(`    Memory Efficiency: ${memoryMetrics.memoryEfficiency.toFixed(2)} tests/MB`);
      } catch (error) {
        console.log(`    Memory benchmark failed: ${error.message}`);
      }
    }
    
    console.log('✅ Memory Benchmarks Complete\n');
  }

  async measureMemoryUsage(appName) {
    const appPath = path.join(process.cwd(), 'test-apps', appName);
    
    // Monitor memory usage during test execution
    let peakMemory = 0;
    let testsRun = 0;
    
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      // Run a memory-intensive test scenario
      const output = execSync('npm run test:unit -- --passWithNoTests --detectOpenHandles', {
        cwd: appPath,
        encoding: 'utf8',
        timeout: 60000
      });
      
      const endMemory = process.memoryUsage().heapUsed;
      peakMemory = Math.max(startMemory, endMemory);
      testsRun = this.parseTestCount(output);
      
    } catch (error) {
      // Even if tests fail, we can still measure memory
      peakMemory = process.memoryUsage().heapUsed;
    }
    
    return {
      peakMemory,
      testsRun,
      memoryEfficiency: testsRun > 0 ? testsRun / (peakMemory / 1024 / 1024) : 0
    };
  }

  async benchmarkParallelExecution() {
    console.log('🔄 Benchmarking Parallel Execution...');
    
    const testApps = this.getTestApplications();
    
    for (const app of testApps) {
      console.log(`  📊 Parallel benchmark for ${app}...`);
      
      try {
        const parallelMetrics = await this.measureParallelPerformance(app);
        
        if (!this.currentResults.benchmarks[app]) {
          this.currentResults.benchmarks[app] = {};
        }
        
        this.currentResults.benchmarks[app].parallel = parallelMetrics;
        
        console.log(`    Sequential: ${parallelMetrics.sequential}ms`);
        console.log(`    Parallel: ${parallelMetrics.parallel}ms`);
        console.log(`    Speedup: ${parallelMetrics.speedup.toFixed(2)}x`);
      } catch (error) {
        console.log(`    Parallel benchmark failed: ${error.message}`);
      }
    }
    
    console.log('✅ Parallel Execution Benchmarks Complete\n');
  }

  async measureParallelPerformance(appName) {
    const appPath = path.join(process.cwd(), 'test-apps', appName);
    
    // Measure sequential execution
    const sequentialStart = process.hrtime.bigint();
    try {
      execSync('npm run test:unit -- --passWithNoTests --runInBand', {
        cwd: appPath,
        encoding: 'utf8',
        timeout: 120000
      });
    } catch (error) {
      // Continue even if tests fail
    }
    const sequentialEnd = process.hrtime.bigint();
    const sequentialTime = Number(sequentialEnd - sequentialStart) / 1000000;
    
    // Measure parallel execution
    const parallelStart = process.hrtime.bigint();
    try {
      execSync('npm run test:unit -- --passWithNoTests --maxWorkers=50%', {
        cwd: appPath,
        encoding: 'utf8',
        timeout: 120000
      });
    } catch (error) {
      // Continue even if tests fail
    }
    const parallelEnd = process.hrtime.bigint();
    const parallelTime = Number(parallelEnd - parallelStart) / 1000000;
    
    return {
      sequential: Math.round(sequentialTime),
      parallel: Math.round(parallelTime),
      speedup: sequentialTime / parallelTime
    };
  }

  getTestApplications() {
    const testAppsDir = path.join(process.cwd(), 'test-apps');
    
    if (!fs.existsSync(testAppsDir)) {
      return [];
    }
    
    return fs.readdirSync(testAppsDir)
      .filter(dir => {
        const dirPath = path.join(testAppsDir, dir);
        return fs.statSync(dirPath).isDirectory() && 
               fs.existsSync(path.join(dirPath, 'package.json'));
      });
  }

  async saveResults() {
    console.log('💾 Saving Benchmark Results...');
    
    // Calculate summary
    this.calculateSummary();
    
    // Load existing history
    let history = [];
    if (fs.existsSync(this.benchmarkFile)) {
      try {
        history = JSON.parse(fs.readFileSync(this.benchmarkFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load existing benchmark history');
      }
    }
    
    // Add current results
    history.push(this.currentResults);
    
    // Keep only last 50 benchmark runs
    if (history.length > 50) {
      history = history.slice(-50);
    }
    
    // Save updated history
    fs.writeFileSync(this.benchmarkFile, JSON.stringify(history, null, 2));
    
    console.log(`📄 Benchmark history saved: ${this.benchmarkFile}`);
  }

  calculateSummary() {
    const summary = {
      totalApps: Object.keys(this.currentResults.benchmarks).length,
      avgUnitTestTime: 0,
      avgIntegrationTestTime: 0,
      avgMemoryUsage: 0,
      avgParallelSpeedup: 0
    };
    
    const apps = Object.values(this.currentResults.benchmarks);
    
    if (apps.length > 0) {
      // Calculate averages
      const unitTimes = apps.map(app => app.unit?.duration).filter(Boolean);
      const integrationTimes = apps.map(app => app.integration?.duration).filter(Boolean);
      const memoryUsages = apps.map(app => app.memory?.peakMemory).filter(Boolean);
      const speedups = apps.map(app => app.parallel?.speedup).filter(Boolean);
      
      summary.avgUnitTestTime = unitTimes.length > 0 
        ? Math.round(unitTimes.reduce((sum, time) => sum + time, 0) / unitTimes.length)
        : 0;
        
      summary.avgIntegrationTestTime = integrationTimes.length > 0
        ? Math.round(integrationTimes.reduce((sum, time) => sum + time, 0) / integrationTimes.length)
        : 0;
        
      summary.avgMemoryUsage = memoryUsages.length > 0
        ? Math.round(memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length / 1024 / 1024)
        : 0;
        
      summary.avgParallelSpeedup = speedups.length > 0
        ? speedups.reduce((sum, speedup) => sum + speedup, 0) / speedups.length
        : 0;
    }
    
    this.currentResults.summary = summary;
  }

  async generateTrendReport() {
    console.log('📈 Generating Trend Report...');
    
    if (!fs.existsSync(this.benchmarkFile)) {
      console.log('No historical data available for trend analysis');
      return;
    }
    
    const history = JSON.parse(fs.readFileSync(this.benchmarkFile, 'utf8'));
    
    if (history.length < 2) {
      console.log('Insufficient historical data for trend analysis');
      return;
    }
    
    const trendReport = this.analyzeTrends(history);
    
    const reportPath = path.join(process.cwd(), 'performance-trend-report.md');
    fs.writeFileSync(reportPath, this.generateTrendMarkdown(trendReport));
    
    console.log(`📄 Trend report generated: ${reportPath}`);
    
    this.displayTrendSummary(trendReport);
  }

  analyzeTrends(history) {
    const recent = history.slice(-10); // Last 10 runs
    const older = history.slice(-20, -10); // Previous 10 runs
    
    if (older.length === 0) {
      return { message: 'Insufficient data for trend analysis' };
    }
    
    const recentAvg = this.calculateHistoryAverage(recent);
    const olderAvg = this.calculateHistoryAverage(older);
    
    return {
      unitTestTrend: this.calculateTrend(olderAvg.unitTime, recentAvg.unitTime),
      integrationTestTrend: this.calculateTrend(olderAvg.integrationTime, recentAvg.integrationTime),
      memoryTrend: this.calculateTrend(olderAvg.memory, recentAvg.memory),
      parallelSpeedupTrend: this.calculateTrend(olderAvg.speedup, recentAvg.speedup, true),
      recentAvg,
      olderAvg
    };
  }

  calculateHistoryAverage(history) {
    const summaries = history.map(h => h.summary).filter(Boolean);
    
    if (summaries.length === 0) {
      return { unitTime: 0, integrationTime: 0, memory: 0, speedup: 0 };
    }
    
    return {
      unitTime: summaries.reduce((sum, s) => sum + (s.avgUnitTestTime || 0), 0) / summaries.length,
      integrationTime: summaries.reduce((sum, s) => sum + (s.avgIntegrationTestTime || 0), 0) / summaries.length,
      memory: summaries.reduce((sum, s) => sum + (s.avgMemoryUsage || 0), 0) / summaries.length,
      speedup: summaries.reduce((sum, s) => sum + (s.avgParallelSpeedup || 0), 0) / summaries.length
    };
  }

  calculateTrend(oldValue, newValue, higherIsBetter = false) {
    if (oldValue === 0) return { change: 0, direction: 'stable', percentage: 0 };
    
    const change = newValue - oldValue;
    const percentage = (change / oldValue) * 100;
    
    let direction;
    if (Math.abs(percentage) < 5) {
      direction = 'stable';
    } else if (higherIsBetter) {
      direction = change > 0 ? 'improving' : 'degrading';
    } else {
      direction = change < 0 ? 'improving' : 'degrading';
    }
    
    return { change, direction, percentage };
  }

  generateTrendMarkdown(trends) {
    if (trends.message) {
      return `# Performance Trend Report\n\n${trends.message}\n`;
    }
    
    return `# Performance Trend Report

Generated: ${new Date().toISOString()}

## Trend Summary

| Metric | Current | Previous | Trend | Change |
|--------|---------|----------|-------|--------|
| Unit Tests | ${Math.round(trends.recentAvg.unitTime)}ms | ${Math.round(trends.olderAvg.unitTime)}ms | ${this.getTrendEmoji(trends.unitTestTrend)} | ${trends.unitTestTrend.percentage.toFixed(1)}% |
| Integration Tests | ${Math.round(trends.recentAvg.integrationTime)}ms | ${Math.round(trends.olderAvg.integrationTime)}ms | ${this.getTrendEmoji(trends.integrationTestTrend)} | ${trends.integrationTestTrend.percentage.toFixed(1)}% |
| Memory Usage | ${Math.round(trends.recentAvg.memory)}MB | ${Math.round(trends.olderAvg.memory)}MB | ${this.getTrendEmoji(trends.memoryTrend)} | ${trends.memoryTrend.percentage.toFixed(1)}% |
| Parallel Speedup | ${trends.recentAvg.speedup.toFixed(2)}x | ${trends.olderAvg.speedup.toFixed(2)}x | ${this.getTrendEmoji(trends.parallelSpeedupTrend)} | ${trends.parallelSpeedupTrend.percentage.toFixed(1)}% |

## Recommendations

${this.generateTrendRecommendations(trends)}

---

*Generated by Performance Benchmark Tool*
`;
  }

  getTrendEmoji(trend) {
    switch (trend.direction) {
      case 'improving': return '📈 Improving';
      case 'degrading': return '📉 Degrading';
      case 'stable': return '➡️ Stable';
      default: return '❓ Unknown';
    }
  }

  generateTrendRecommendations(trends) {
    const recommendations = [];
    
    if (trends.unitTestTrend.direction === 'degrading') {
      recommendations.push('- Unit test performance is degrading. Consider optimizing slow tests.');
    }
    
    if (trends.integrationTestTrend.direction === 'degrading') {
      recommendations.push('- Integration test performance is degrading. Review test setup and mocking strategies.');
    }
    
    if (trends.memoryTrend.direction === 'degrading') {
      recommendations.push('- Memory usage is increasing. Check for memory leaks in tests.');
    }
    
    if (trends.parallelSpeedupTrend.direction === 'degrading') {
      recommendations.push('- Parallel execution efficiency is decreasing. Review test isolation and shared resources.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Performance trends look good! Continue monitoring.');
    }
    
    return recommendations.join('\n');
  }

  displayTrendSummary(trends) {
    if (trends.message) {
      console.log(`📈 ${trends.message}`);
      return;
    }
    
    console.log('\n📈 PERFORMANCE TRENDS');
    console.log('='.repeat(50));
    console.log(`Unit Tests: ${this.getTrendEmoji(trends.unitTestTrend)} (${trends.unitTestTrend.percentage.toFixed(1)}%)`);
    console.log(`Integration Tests: ${this.getTrendEmoji(trends.integrationTestTrend)} (${trends.integrationTestTrend.percentage.toFixed(1)}%)`);
    console.log(`Memory Usage: ${this.getTrendEmoji(trends.memoryTrend)} (${trends.memoryTrend.percentage.toFixed(1)}%)`);
    console.log(`Parallel Speedup: ${this.getTrendEmoji(trends.parallelSpeedupTrend)} (${trends.parallelSpeedupTrend.percentage.toFixed(1)}%)`);
    console.log('='.repeat(50));
  }
}

// CLI execution
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  
  benchmark.runBenchmarks()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceBenchmark;