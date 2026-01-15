import { config } from 'dotenv';
import knex from 'knex';
import { getKnexConfig } from '../knexfile';

// Load environment variables
config();

async function runMigrationsStepByStep() {
  console.log('🔄 Running migrations step by step...');
  
  let db: any = null;
  
  try {
    // Get the knex configuration
    const knexConfig = getKnexConfig(process.env.NODE_ENV || 'development');
    console.log('✅ Knex configuration loaded successfully');
    
    // Create knex instance
    db = knex(knexConfig);
    console.log('✅ Knex instance created');
    
    // Check current migration status
    console.log('🔍 Checking current migration status...');
    const migrations = await db.migrate.list();
    console.log('📋 Current migrations:', migrations);
    
    // Get pending migrations
    const pendingMigrations = migrations[1]; // [1] contains pending migrations
    console.log('⏳ Pending migrations:', pendingMigrations);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }
    
    // Run migrations one by one
    for (const migration of pendingMigrations) {
      console.log(`🔄 Running migration: ${migration}`);
      
      try {
        await db.migrate.up({ name: migration });
        console.log(`✅ Migration ${migration} completed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${migration} failed:`, error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint
        });
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  } finally {
    // Clean up
    if (db) {
      await db.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migrations
runMigrationsStepByStep()
  .then(() => {
    console.log('🎉 Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });
