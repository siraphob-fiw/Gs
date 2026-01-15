#!/usr/bin/env node

/**
 * Example script demonstrating how to create test applications
 * Run with: npx ts-node examples/create-example-test-app.ts
 */

import { createTestApplication, listTestApplications, testApplicationExists } from '../src/templates/create-test-application';
import { TestAppConfig } from '../src/templates/types';

async function main() {
  console.log('🚀 Test Application Creation Examples\n');

  // Example 1: Create a NestJS test application
  console.log('Example 1: Creating NestJS test application...');
  const nestjsConfig: TestAppConfig = {
    appName: 'example-api',
    appType: 'nestjs',
    testTypes: ['unit', 'integration', 'e2e'],
    description: 'Example NestJS test application demonstrating the separated test architecture',
    author: 'StrengthOS Team'
  };

  try {
    if (!testApplicationExists('example-api')) {
      createTestApplication(nestjsConfig);
    } else {
      console.log('⚠️  NestJS test application already exists, skipping...');
    }
  } catch (error) {
    console.error('Error creating NestJS test app:', error.message);
  }

  console.log('');

  // Example 2: Create a Next.js test application
  console.log('Example 2: Creating Next.js test application...');
  const nextjsConfig: TestAppConfig = {
    appName: 'example-frontend',
    appType: 'nextjs',
    testTypes: ['unit', 'integration', 'e2e'],
    description: 'Example Next.js test application with React Testing Library and Playwright',
    author: 'StrengthOS Team',
    includePlaywright: true,
    includeTestingLibrary: true
  };

  try {
    if (!testApplicationExists('example-frontend')) {
      createTestApplication(nextjsConfig);
    } else {
      console.log('⚠️  Next.js test application already exists, skipping...');
    }
  } catch (error) {
    console.error('Error creating Next.js test app:', error.message);
  }

  console.log('');

  // Example 3: Create an Express test application with only unit and E2E tests
  console.log('Example 3: Creating Express test application...');
  const expressConfig: TestAppConfig = {
    appName: 'example-service',
    appType: 'express',
    testTypes: ['unit', 'e2e'], // Skip integration tests
    description: 'Example Express test application for microservice testing',
    author: 'StrengthOS Team'
  };

  try {
    if (!testApplicationExists('example-service')) {
      createTestApplication(expressConfig);
    } else {
      console.log('⚠️  Express test application already exists, skipping...');
    }
  } catch (error) {
    console.error('Error creating Express test app:', error.message);
  }

  console.log('');

  // List all test applications
  console.log('📋 Current test applications:');
  const testApps = listTestApplications();
  if (testApps.length === 0) {
    console.log('  No test applications found.');
  } else {
    testApps.forEach(app => {
      console.log(`  - ${app}`);
    });
  }

  console.log('');
  console.log('✅ Examples completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Navigate to any test application: cd test-apps/<app-name>');
  console.log('2. Install dependencies: npm install');
  console.log('3. Run tests: npm test');
  console.log('4. Check the README.md for detailed usage instructions');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Example script failed:', error);
    process.exit(1);
  });
}

export { main as runExamples };