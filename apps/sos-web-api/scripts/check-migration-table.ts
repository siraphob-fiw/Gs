import { config } from 'dotenv';
import knex from 'knex';
import { getKnexConfig } from '../knexfile';

// Load environment variables
config();

async function checkMigrationTable() {
  console.log('🔍 Checking migration table...');
  
  let db: any = null;
  
  try {
    // Get the knex configuration
    const knexConfig = getKnexConfig(process.env.NODE_ENV || 'development');
    console.log('✅ Knex configuration loaded successfully');
    
    // Create knex instance
    db = knex(knexConfig);
    console.log('✅ Knex instance created');
    
    // Check if migration table exists
    const tableExists = await db.schema.hasTable('knex_migrations');
    console.log('📋 Migration table exists:', tableExists);
    
    if (tableExists) {
      // Get all migration records
      const migrations = await db('knex_migrations').select('*').orderBy('id');
      console.log('📋 Migration records:', migrations);
      
      // Get migration records with specific names
      const equipmentMigrations = await db('knex_migrations')
        .where('name', 'like', '%equipment%')
        .orWhere('name', 'like', '%athlete_equipment%');
      console.log('🏋️ Equipment-related migrations:', equipmentMigrations);
    }
    
    console.log('✅ Migration table check completed');
    
  } catch (error) {
    console.error('❌ Failed to check migration table:', error);
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

// Run the check
checkMigrationTable()
  .then(() => {
    console.log('🎉 Migration table check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration table check failed:', error);
    process.exit(1);
  });
