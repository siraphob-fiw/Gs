import { Client } from 'pg';
import { config } from 'dotenv';
import { ConnectionConfigFactory } from '@strengthos/shared-validation';

// Load environment variables
config();

async function createDatabase() {
  console.log('🔧 Creating database using standardized configuration...');
  
  // Get standardized database configuration
  const configResult = ConnectionConfigFactory.createDatabaseConfig();
  
  if (!configResult.isValid) {
    console.error('❌ Failed to create database configuration:');
    configResult.errors?.forEach(error => {
      console.error(`  - ${error.field}: ${error.message}`);
    });
    process.exit(1);
  }

  const dbConfig = configResult.data!;
  const targetDatabase = dbConfig.database;
  
  // Connect to postgres database first to create the target database
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: 'postgres', // Connect to default postgres database
    ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
  });

  console.log(`📡 Connecting to PostgreSQL server at ${dbConfig.host}:${dbConfig.port}...`);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );

    if (result.rows.length === 0) {
      // Create the database
      await client.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✅ Database "${targetDatabase}" created successfully`);
    } else {
      console.log(`ℹ️  Database "${targetDatabase}" already exists`);
    }
    
    // Test connection to the newly created/existing database
    const testClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: targetDatabase,
      ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
    });
    
    try {
      await testClient.connect();
      await testClient.query('SELECT 1');
      console.log(`✅ Successfully connected to database "${targetDatabase}"`);
      await testClient.end();
    } catch (testError) {
      console.error(`❌ Failed to connect to database "${targetDatabase}":`, testError);
      throw testError;
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();