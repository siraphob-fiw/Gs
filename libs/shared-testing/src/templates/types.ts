/**
 * Configuration for creating a new test application
 */
export interface TestAppConfig {
  /** Name of the production application (e.g., 'sos-web-api') */
  appName: string;
  /** Type of application framework */
  appType: 'nestjs' | 'nextjs' | 'express';
  /** Types of tests to include in the test application */
  testTypes: ('unit' | 'integration' | 'e2e')[];
  /** Optional description for the test application */
  description?: string;
  /** Optional author information */
  author?: string;
  /** Whether to include Playwright for E2E tests (Next.js apps) */
  includePlaywright?: boolean;
  /** Whether to include additional testing libraries */
  includeTestingLibrary?: boolean;
}

/**
 * Template file definition
 */
export interface TemplateFile {
  /** Relative path from test app root */
  path: string;
  /** File content (can include template variables) */
  content: string;
  /** Whether this file should be executable */
  executable?: boolean;
}

/**
 * Template definition for a specific app type
 */
export interface AppTemplate {
  /** Files to create for this template */
  files: TemplateFile[];
  /** Dependencies to include in package.json */
  dependencies: Record<string, string>;
  /** Dev dependencies to include in package.json */
  devDependencies: Record<string, string>;
  /** Scripts to include in package.json */
  scripts: Record<string, string>;
}

/**
 * Variables available for template substitution
 */
export interface TemplateVariables {
  appName: string;
  testAppName: string;
  appType: string;
  description: string;
  author: string;
  hasUnit: boolean;
  hasIntegration: boolean;
  hasE2E: boolean;
  includePlaywright: boolean;
  includeTestingLibrary: boolean;
}