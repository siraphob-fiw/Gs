import { config } from 'dotenv';
import knex from 'knex';
import { getKnexConfig, validateKnexConnection } from '../knexfile';

config();

async function checkDatabase() {
  const environment = process.env.NODE_ENV || 'development';
  
  console.log(`🔍 Checking database configuration for environment: ${environment}`);
  
  // Validate configuration first
  let knexConfig;
  try {
    knexConfig = getKnexConfig(environment);
    console.log('✅ Knex configuration loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Knex configuration:', error);
    return;
  }
  
  // Test connection
  const connectionValid = await validateKnexConnection(environment);
  if (!connectionValid) {
    console.error('❌ Database connection validation failed');
    return;
  }
  
  const db = knex(knexConfig);
  
  try {
    // Check for existing enum types
    const enumTypes = await db.raw(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
      ORDER BY typname;
    `);
    
    console.log('Existing enum types:', enumTypes.rows);
    
    // Check for existing tables
    const tables = await db.raw(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log('Existing tables:', tables.rows);
    
    // Check migration status
    const migrations = await db.migrate.list();
    console.log('Migration status:', migrations);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await db.destroy();
  }
}

checkDatabase();