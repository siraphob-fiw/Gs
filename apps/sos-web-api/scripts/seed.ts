#!/usr/bin/env ts-node

// Register path mappings before any imports
import 'tsconfig-paths/register';

import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

// Load environment variables
config();

async function runSeeds() {
  console.log('Starting seeding process...');
  
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

    // Run seeds
    await databaseService.runSeeds();

    console.log('Seeding completed successfully');
    
    // Close the application
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSeeds();
}

export { runSeeds };