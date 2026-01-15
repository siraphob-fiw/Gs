#!/usr/bin/env ts-node

// Register path mappings before any imports
import 'tsconfig-paths/register';

import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

// Load environment variables
config();

async function checkDatabaseStatus() {
  console.log('Checking database status...');
  
  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get database service
    const databaseService = app.get(DatabaseService);

    // Test connection
    console.log('\n=== Connection Test ===');
    const isConnected = await databaseService.testConnection();
    console.log(`Database connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);

    if (isConnected) {
      // Get migration status
      console.log('\n=== Migration Status ===');
      const migrationStatus = await databaseService.getMigrationStatus();
      
      if (migrationStatus && migrationStatus.length > 0) {
        const [completed, pending] = migrationStatus;
        
        console.log(`Completed migrations: ${completed.length}`);
        if (completed.length > 0) {
          completed.forEach((migration: string) => {
            console.log(`  ✓ ${migration}`);
          });
        }
        
        console.log(`Pending migrations: ${pending.length}`);
        if (pending.length > 0) {
          pending.forEach((migration: string) => {
            console.log(`  ○ ${migration}`);
          });
        }
      } else {
        console.log('No migration information available');
      }

      // Check if tables exist
      console.log('\n=== Table Check ===');
      const tables = await databaseService.knex.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      console.log(`Found ${tables.rows.length} tables:`);
      tables.rows.forEach((row: any) => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    // Close the application
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Database status check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabaseStatus();
}

export { checkDatabaseStatus };