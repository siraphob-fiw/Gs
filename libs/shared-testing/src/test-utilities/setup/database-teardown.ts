import { execSync } from 'child_process';

/**
 * Global database teardown for tests
 * This runs once after all tests
 */
export default async function teardown() {
  console.log('🧹 Cleaning up test database...');
  
  try {
    // Clean up test database
    execSync('npm run db:test:reset', { 
      stdio: 'pipe', // Don't show output during cleanup
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.warn('⚠️ Test database cleanup failed:', error);
    // Don't fail the test run if cleanup fails
  }
}