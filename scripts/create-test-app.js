#!/usr/bin/env node

/**
 * Convenience script for creating test applications
 * This script can be used in CI/CD pipelines or development workflows
 */

const { execSync } = require('child_process');
const path = require('path');

function createTestApp(appName, appType, testTypes = ['unit', 'integration', 'e2e']) {
  const cliPath = path.join(__dirname, '..', 'libs', 'shared-testing', 'dist', 'cli', 'create-test-app.js');
  const command = `node ${cliPath} create ${appName} ${appType} ${testTypes.join(' ')}`;
  
  try {
    console.log(`🚀 Creating test application for ${appName}...`);
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log(`✅ Test application created successfully!`);
    console.log(`📁 Location: test-apps/${appName}-tests`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. cd test-apps/${appName}-tests`);
    console.log('2. npm install');
    console.log('3. npm test');
  } catch (error) {
    console.error(`❌ Failed to create test application: ${error.message}`);
    process.exit(1);
  }
}

function listTestApps() {
  const cliPath = path.join(__dirname, '..', 'libs', 'shared-testing', 'dist', 'cli', 'create-test-app.js');
  const command = `node ${cliPath} list`;
  
  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.error(`❌ Failed to list test applications: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log('StrengthOS Test Application Creator');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/create-test-app.js create <appName> <appType> [testTypes...]');
  console.log('  node scripts/create-test-app.js list');
  console.log('  node scripts/create-test-app.js help');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/create-test-app.js create my-api nestjs');
  console.log('  node scripts/create-test-app.js create my-frontend nextjs unit integration');
  console.log('  node scripts/create-test-app.js create my-service express unit e2e');
  console.log('  node scripts/create-test-app.js list');
  console.log('');
  console.log('App Types: nestjs, nextjs, express');
  console.log('Test Types: unit, integration, e2e');
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    if (args.length < 3) {
      console.error('Error: create command requires appName and appType');
      showHelp();
      process.exit(1);
    }
    const [, appName, appType, ...testTypes] = args;
    createTestApp(appName, appType, testTypes.length > 0 ? testTypes : undefined);
    break;
  
  case 'list':
    listTestApps();
    break;
  
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  
  default:
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    showHelp();
    process.exit(1);
}