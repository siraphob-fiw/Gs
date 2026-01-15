import { execSync } from 'child_process';

/**
 * Global database setup for tests
 * This runs once before all tests
 */
export default async function setup() {
  console.log('🔧 Setting up test database...');
  
  try {
    // Ensure test database exists and is clean
    execSync('npm run db:test:reset', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Run migrations
    execSync('npm run db:test:migrate', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    process.exit(1);
  }
}