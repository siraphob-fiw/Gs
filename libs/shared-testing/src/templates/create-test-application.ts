import * as fs from 'fs';
import * as path from 'path';
import { TestAppConfig, TemplateVariables } from './types';
import { getTemplate, substituteTemplate } from './templates';

/**
 * Create a new test application based on the provided configuration
 */
export function createTestApplication(config: TestAppConfig): void {
  const {
    appName,
    appType,
    testTypes,
    description = `Test application for ${appName} - Isolated testing environment`,
    author = 'Human Digital Solutions Co Ltd',
    includePlaywright = appType === 'nextjs',
    includeTestingLibrary = appType === 'nextjs'
  } = config;

  // Validate configuration
  validateConfig(config);

  const testAppName = `${appName}-tests`;
  const testAppPath = path.join(process.cwd(), 'test-apps', testAppName);

  // Check if test app already exists
  if (fs.existsSync(testAppPath)) {
    throw new Error(`Test application already exists at: ${testAppPath}`);
  }

  // Create template variables
  const variables: TemplateVariables = {
    appName,
    testAppName,
    appType,
    description,
    author,
    hasUnit: testTypes.includes('unit'),
    hasIntegration: testTypes.includes('integration'),
    hasE2E: testTypes.includes('e2e'),
    includePlaywright,
    includeTestingLibrary
  };

  // Get template for app type
  const template = getTemplate(appType);

  // Create test application directory
  fs.mkdirSync(testAppPath, { recursive: true });

  // Create files from template
  template.files.forEach(file => {
    const filePath = path.join(testAppPath, file.path);
    const fileDir = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Substitute template variables and write file
    const content = substituteTemplate(file.content, variables);
    fs.writeFileSync(filePath, content, 'utf8');

    // Make file executable if specified
    if (file.executable) {
      fs.chmodSync(filePath, '755');
    }
  });

  // Create test type directories if they don't exist
  testTypes.forEach(testType => {
    const testDir = path.join(testAppPath, 'src', testType);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  console.log(`✅ Test application created successfully at: ${testAppPath}`);
  console.log(`📁 Application type: ${appType}`);
  console.log(`🧪 Test types: ${testTypes.join(', ')}`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. cd test-apps/${testAppName}`);
  console.log('2. npm install');
  console.log('3. npm test');
  console.log('');
  console.log('📖 See README.md for detailed usage instructions');
}

/**
 * Validate test application configuration
 */
function validateConfig(config: TestAppConfig): void {
  const { appName, appType, testTypes } = config;

  if (!appName || typeof appName !== 'string') {
    throw new Error('appName is required and must be a string');
  }

  if (!['nestjs', 'nextjs', 'express'].includes(appType)) {
    throw new Error('appType must be one of: nestjs, nextjs, express');
  }

  if (!Array.isArray(testTypes) || testTypes.length === 0) {
    throw new Error('testTypes must be a non-empty array');
  }

  const validTestTypes = ['unit', 'integration', 'e2e'];
  const invalidTestTypes = testTypes.filter(type => !validTestTypes.includes(type));
  if (invalidTestTypes.length > 0) {
    throw new Error(`Invalid test types: ${invalidTestTypes.join(', ')}. Valid types are: ${validTestTypes.join(', ')}`);
  }

  // Check if production app exists
  const productionAppPath = path.join(process.cwd(), 'apps', appName);
  if (!fs.existsSync(productionAppPath)) {
    console.warn(`⚠️  Warning: Production application not found at: ${productionAppPath}`);
    console.warn('   Make sure the production application exists before running tests');
  }
}

/**
 * Create test application with interactive prompts (for CLI usage)
 */
export async function createTestApplicationInteractive(): Promise<void> {
  // This would be implemented for CLI usage with prompts
  // For now, we'll provide a simple example
  console.log('Interactive test application creation is not yet implemented.');
  console.log('Use createTestApplication() function directly with a TestAppConfig object.');
  console.log('');
  console.log('Example:');
  console.log('```typescript');
  console.log('import { createTestApplication } from "@strengthos/shared-testing";');
  console.log('');
  console.log('createTestApplication({');
  console.log('  appName: "my-app",');
  console.log('  appType: "nestjs",');
  console.log('  testTypes: ["unit", "integration", "e2e"]');
  console.log('});');
  console.log('```');
}

/**
 * List existing test applications
 */
export function listTestApplications(): string[] {
  const testAppsPath = path.join(process.cwd(), 'test-apps');
  
  if (!fs.existsSync(testAppsPath)) {
    return [];
  }

  return fs.readdirSync(testAppsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

/**
 * Check if a test application exists
 */
export function testApplicationExists(appName: string): boolean {
  const testAppPath = path.join(process.cwd(), 'test-apps', `${appName}-tests`);
  return fs.existsSync(testAppPath);
}

/**
 * Get test application info
 */
export function getTestApplicationInfo(appName: string): any {
  const testAppName = `${appName}-tests`;
  const testAppPath = path.join(process.cwd(), 'test-apps', testAppName);
  const packageJsonPath = path.join(testAppPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Test application not found: ${testAppName}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    path: testAppPath,
    scripts: packageJson.scripts,
    dependencies: packageJson.dependencies,
    devDependencies: packageJson.devDependencies
  };
}