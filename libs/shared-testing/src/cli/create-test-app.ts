#!/usr/bin/env node

import { createTestApplication, listTestApplications, testApplicationExists } from '../templates/create-test-application';
import { TestAppConfig } from '../templates/types';

/**
 * CLI script for creating test applications
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'create':
      handleCreateCommand(args.slice(1));
      break;
    case 'list':
      handleListCommand();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

/**
 * Handle create command
 */
function handleCreateCommand(args: string[]) {
  if (args.length < 2) {
    console.error('Error: create command requires appName and appType');
    console.log('Usage: create-test-app create <appName> <appType> [testTypes...]');
    process.exit(1);
  }

  const [appName, appType, ...testTypeArgs] = args;
  const testTypes = testTypeArgs.length > 0 ? testTypeArgs : ['unit', 'integration', 'e2e'];

  // Validate app type
  if (!['nestjs', 'nextjs', 'express'].includes(appType)) {
    console.error(`Error: Invalid app type '${appType}'. Must be one of: nestjs, nextjs, express`);
    process.exit(1);
  }

  // Validate test types
  const validTestTypes = ['unit', 'integration', 'e2e'];
  const invalidTestTypes = testTypes.filter(type => !validTestTypes.includes(type));
  if (invalidTestTypes.length > 0) {
    console.error(`Error: Invalid test types: ${invalidTestTypes.join(', ')}`);
    console.error(`Valid test types are: ${validTestTypes.join(', ')}`);
    process.exit(1);
  }

  // Check if test app already exists
  if (testApplicationExists(appName)) {
    console.error(`Error: Test application '${appName}-tests' already exists`);
    process.exit(1);
  }

  const config: TestAppConfig = {
    appName,
    appType: appType as 'nestjs' | 'nextjs' | 'express',
    testTypes: testTypes as ('unit' | 'integration' | 'e2e')[]
  };

  try {
    createTestApplication(config);
  } catch (error) {
    console.error('Error creating test application:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Handle list command
 */
function handleListCommand() {
  const testApps = listTestApplications();
  
  if (testApps.length === 0) {
    console.log('No test applications found.');
    return;
  }

  console.log('Existing test applications:');
  testApps.forEach(app => {
    console.log(`  - ${app}`);
  });
}

/**
 * Show help information
 */
function showHelp() {
  console.log('create-test-app - Create test applications for StrengthOS');
  console.log('');
  console.log('Usage:');
  console.log('  create-test-app create <appName> <appType> [testTypes...]');
  console.log('  create-test-app list');
  console.log('  create-test-app help');
  console.log('');
  console.log('Commands:');
  console.log('  create    Create a new test application');
  console.log('  list      List existing test applications');
  console.log('  help      Show this help message');
  console.log('');
  console.log('Arguments:');
  console.log('  appName     Name of the production application (e.g., "sos-web-api")');
  console.log('  appType     Type of application: nestjs, nextjs, express');
  console.log('  testTypes   Types of tests to include: unit, integration, e2e (default: all)');
  console.log('');
  console.log('Examples:');
  console.log('  create-test-app create my-api nestjs');
  console.log('  create-test-app create my-frontend nextjs unit integration');
  console.log('  create-test-app create my-service express unit e2e');
  console.log('  create-test-app list');
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main();
}