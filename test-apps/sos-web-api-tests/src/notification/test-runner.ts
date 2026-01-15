#!/usr/bin/env node

/**
 * Test runner for notification and communication system
 * This script runs comprehensive tests to validate the implementation
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class NotificationTestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Notification and Communication System Tests\n');

    const testSuites = [
      {
        name: 'Notification Preferences Service',
        path: 'src/notification/__tests__/notification-preferences.service.spec.ts',
      },
      {
        name: 'Intelligent Notification Service',
        path: 'src/notification/__tests__/intelligent-notification.service.spec.ts',
      },
      {
        name: 'Wellness Notification Service',
        path: 'src/notification/__tests__/wellness-notification.service.spec.ts',
      },
      {
        name: 'Messaging Service Integration',
        path: 'src/messaging/__tests__/messaging.service.integration.spec.ts',
      },
    ];

    for (const suite of testSuites) {
      await this.runTestSuite(suite.name, suite.path);
    }

    this.printSummary();
  }

  private async runTestSuite(name: string, path: string): Promise<void> {
    console.log(`📋 Running ${name}...`);
    const startTime = Date.now();

    try {
      // Check if test file exists
      const fullPath = join(process.cwd(), path);
      if (!existsSync(fullPath)) {
        throw new Error(`Test file not found: ${path}`);
      }

      // Run the test
      execSync(`npm run test -- ${path} --verbose`, {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      const duration = Date.now() - startTime;
      this.results.push({
        suite: name,
        passed: true,
        duration,
      });

      console.log(`✅ ${name} - PASSED (${duration}ms)\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${name} - FAILED (${duration}ms)`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  private printSummary(): void {
    console.log('📊 Test Summary');
    console.log('================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.passed === false).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('');

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.suite}: ${r.error}`);
        });
      console.log('');
    }

    if (passed === this.results.length) {
      console.log('🎉 All tests passed! The notification and communication system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  }
}

// Manual test scenarios for features that require manual validation
class ManualTestScenarios {
  static printManualTestInstructions(): void {
    console.log('\n🧪 Manual Test Scenarios');
    console.log('========================');
    console.log('The following scenarios should be tested manually:');
    console.log('');

    console.log('1. 📱 Notification Preferences:');
    console.log('   - Create user preferences with different channels');
    console.log('   - Test quiet hours functionality');
    console.log('   - Verify channel enable/disable works');
    console.log('   - Test notification history and read status');
    console.log('');

    console.log('2. 🧠 Intelligent Notifications:');
    console.log('   - Test notification grouping with multiple notifications');
    console.log('   - Verify throttling rules are applied correctly');
    console.log('   - Check engagement score calculation');
    console.log('   - Test preference suggestions generation');
    console.log('');

    console.log('3. 💚 Wellness Check-ins:');
    console.log('   - Schedule different types of wellness check-ins');
    console.log('   - Submit check-ins with various mood/stress levels');
    console.log('   - Verify alerts are generated for concerning patterns');
    console.log('   - Test coach notifications for wellness alerts');
    console.log('');

    console.log('4. 💬 Messaging System:');
    console.log('   - Create direct and group conversations');
    console.log('   - Send messages with different types (text, images, files)');
    console.log('   - Test message editing and deletion');
    console.log('   - Verify external messaging integration (WhatsApp, LINE)');
    console.log('   - Test real-time features (typing indicators)');
    console.log('');

    console.log('5. 🔗 Integration Tests:');
    console.log('   - Test notification preferences affect message delivery');
    console.log('   - Verify wellness alerts trigger coach notifications');
    console.log('   - Test intelligent notification scheduling');
    console.log('   - Verify tenant isolation works correctly');
    console.log('');

    console.log('📋 API Endpoints to Test:');
    console.log('- POST /notification-preferences');
    console.log('- GET /notification-preferences');
    console.log('- PUT /notification-preferences');
    console.log('- POST /intelligent-notifications/throttle/check');
    console.log('- GET /intelligent-notifications/analytics');
    console.log('- POST /wellness-notifications/schedule');
    console.log('- POST /wellness-notifications/checkin');
    console.log('- GET /wellness-notifications/patterns');
    console.log('- POST /messaging/conversations');
    console.log('- POST /messaging/messages');
    console.log('- GET /messaging/conversations/:id/messages');
    console.log('');

    console.log('🔧 Database Validation:');
    console.log('- Verify notification_preferences table structure');
    console.log('- Check notifications table has proper indexes');
    console.log('- Validate messaging tables (conversations, messages, etc.)');
    console.log('- Test Row Level Security policies');
    console.log('- Verify foreign key constraints work');
    console.log('');

    console.log('⚡ Performance Tests:');
    console.log('- Test notification grouping with 1000+ notifications');
    console.log('- Verify throttling works under high load');
    console.log('- Test message search with large conversation history');
    console.log('- Check analytics calculation performance');
    console.log('');
  }
}

// Integration test checklist
class IntegrationTestChecklist {
  static printChecklist(): void {
    console.log('\n✅ Integration Test Checklist');
    console.log('=============================');
    console.log('Verify the following integrations work correctly:');
    console.log('');

    const checklist = [
      'Notification preferences affect message delivery',
      'Wellness check-ins trigger appropriate alerts',
      'Coach notifications are sent for wellness concerns',
      'Intelligent notification scheduling respects user preferences',
      'External messaging (WhatsApp/LINE) integration works',
      'Real-time events are emitted correctly',
      'Tenant isolation prevents cross-tenant data access',
      'Authentication guards protect all endpoints',
      'Database migrations run successfully',
      'Shared library integration works correctly',
      'Error handling provides meaningful messages',
      'Logging captures important events',
      'Caching improves performance where expected',
      'Validation prevents invalid data entry',
      'API documentation is accurate and complete',
    ];

    checklist.forEach((item, index) => {
      console.log(`${index + 1}. [ ] ${item}`);
    });

    console.log('');
    console.log('📝 Notes:');
    console.log('- Mark each item as complete after manual verification');
    console.log('- Document any issues found during testing');
    console.log('- Update tests if new edge cases are discovered');
    console.log('');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual-only')) {
    ManualTestScenarios.printManualTestInstructions();
    IntegrationTestChecklist.printChecklist();
    return;
  }

  if (args.includes('--checklist-only')) {
    IntegrationTestChecklist.printChecklist();
    return;
  }

  // Run automated tests
  const runner = new NotificationTestRunner();
  await runner.runAllTests();

  // Print manual test instructions
  ManualTestScenarios.printManualTestInstructions();
  IntegrationTestChecklist.printChecklist();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { NotificationTestRunner, ManualTestScenarios, IntegrationTestChecklist };