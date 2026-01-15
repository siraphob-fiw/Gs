const { DatabaseService } = require('../dist/src/database/database.service');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');

async function checkSchema() {
  console.log('🔍 Checking user_sessions table schema...');
  
  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get database service
    const databaseService = app.get(DatabaseService);

    // Test connection first
    const isConnected = await databaseService.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Check current schema
    const columns = await databaseService.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Current user_sessions table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if access_token_jti exists
    const hasAccessTokenJti = columns.some(col => col.column_name === 'access_token_jti');
    const hasAccessToken = columns.some(col => col.column_name === 'access_token');

    console.log('\n🔍 Column analysis:');
    console.log(`  - access_token_jti exists: ${hasAccessTokenJti}`);
    console.log(`  - access_token exists: ${hasAccessToken}`);

    if (hasAccessTokenJti && !hasAccessToken) {
      console.log('\n❌ ISSUE FOUND: Database still has old schema (access_token_jti) but code expects new schema (access_token)');
      console.log('💡 SOLUTION: Run migration 048 to update the schema');
    } else if (!hasAccessTokenJti && hasAccessToken) {
      console.log('\n✅ Schema is correct: Database has access_token column');
    } else if (hasAccessTokenJti && hasAccessToken) {
      console.log('\n⚠️  WARNING: Database has both columns - this might cause issues');
    } else {
      console.log('\n❌ ERROR: Neither column exists - table might be missing');
    }

    // Close the application
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkSchema();
}
