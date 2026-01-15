#!/usr/bin/env node

/**
 * Example of programmatic test application creation
 * This demonstrates how to create test applications from code/scripts
 */

import { createTestApplication, listTestApplications, testApplicationExists } from '../src/templates/create-test-application';
import { TestAppConfig } from '../src/templates/types';

/**
 * Example: Create test applications for a new microservice
 */
async function createMicroserviceTestSuite() {
  console.log('🚀 Creating test applications for new microservice...\n');

  const serviceName = 'user-management-service';
  
  // Check if test app already exists
  if (testApplicationExists(serviceName)) {
    console.log(`⚠️  Test application for ${serviceName} already exists`);
    return;
  }

  // Create NestJS test application
  const config: TestAppConfig = {
    appName: serviceName,
    appType: 'nestjs',
    testTypes: ['unit', 'integration', 'e2e'],
    description: `Comprehensive test suite for ${serviceName} microservice`,
    author: 'StrengthOS Development Team'
  };

  try {
    createTestApplication(config);
    console.log('✅ Test application created successfully!\n');
  } catch (error) {
    console.error('❌ Failed to create test application:', error.message);
    return;
  }

  // List all test applications
  console.log('📋 Current test applications:');
  const testApps = listTestApplications();
  testApps.forEach(app => {
    console.log(`  - ${app}`);
  });
}

/**
 * Example: Batch create test applications for multiple services
 */
async function batchCreateTestApplications() {
  console.log('🔄 Batch creating test applications...\n');

  const services = [
    { name: 'notification-service', type: 'nestjs' as const },
    { name: 'payment-service', type: 'nestjs' as const },
    { name: 'analytics-dashboard', type: 'nextjs' as const },
    { name: 'webhook-handler', type: 'express' as const }
  ];

  for (const service of services) {
    if (testApplicationExists(service.name)) {
      console.log(`⏭️  Skipping ${service.name} (already exists)`);
      continue;
    }

    const config: TestAppConfig = {
      appName: service.name,
      appType: service.type,
      testTypes: ['unit', 'integration', 'e2e'],
      description: `Test application for ${service.name}`,
      author: 'StrengthOS Development Team'
    };

    try {
      createTestApplication(config);
      console.log(`✅ Created test application for ${service.name}`);
    } catch (error) {
      console.error(`❌ Failed to create test app for ${service.name}:`, error.message);
    }
  }

  console.log('\n🎉 Batch creation completed!');
}

/**
 * Example: Create test application with custom configuration
 */
async function createCustomTestApplication() {
  console.log('⚙️  Creating custom test application...\n');

  const config: TestAppConfig = {
    appName: 'custom-integration-service',
    appType: 'express',
    testTypes: ['unit', 'e2e'], // Skip integration tests
    description: 'Custom integration service with minimal test setup',
    author: 'Custom Development Team',
    includePlaywright: false,
    includeTestingLibrary: false
  };

  if (testApplicationExists(config.appName)) {
    console.log('⚠️  Custom test application already exists');
    return;
  }

  try {
    createTestApplication(config);
    console.log('✅ Custom test application created successfully!');
    
    // Show next steps
    console.log('\n📝 Next steps:');
    console.log(`1. cd test-apps/${config.appName}-tests`);
    console.log('2. npm install');
    console.log('3. npm test');
    console.log('4. Start writing your tests!');
    
  } catch (error) {
    console.error('❌ Failed to create custom test application:', error.message);
  }
}

/**
 * Main function - demonstrates different usage patterns
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'microservice';

  console.log('🧪 StrengthOS Test Application Creation Examples\n');

  switch (command) {
    case 'microservice':
      await createMicroserviceTestSuite();
      break;
    case 'batch':
      await batchCreateTestApplications();
      break;
    case 'custom':
      await createCustomTestApplication();
      break;
    default:
      console.log('Available commands:');
      console.log('  microservice  - Create test app for a single microservice');
      console.log('  batch         - Create multiple test apps at once');
      console.log('  custom        - Create test app with custom configuration');
      console.log('');
      console.log('Usage: npx ts-node examples/programmatic-usage.ts [command]');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { 
  createMicroserviceTestSuite, 
  batchCreateTestApplications, 
  createCustomTestApplication 
};