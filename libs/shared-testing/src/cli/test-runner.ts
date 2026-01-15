#!/usr/bin/env node

/**
 * Test Runner CLI
 * Command-line interface for executing categorized tests with performance monitoring
 */

import { TestExecutionCLI } from '../test-utilities/test-execution';

async function main() {
  const cli = new TestExecutionCLI();
  const args = process.argv.slice(2);

  try {
    await cli.execute(args);
  } catch (error) {
    console.error('❌ Test execution failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { main };