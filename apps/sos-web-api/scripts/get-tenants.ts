// Register path mappings before any imports
import 'tsconfig-paths/register';

import { config } from 'dotenv';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

// Load environment variables
config({ path: join(__dirname, '../.env') });

async function getTenants() {
  console.log('Getting tenant information...');
  
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

    // Query tenants
    const tenants = await databaseService.query('SELECT id, name, status FROM tenants ORDER BY created_at');
    
    console.log('\n=== TENANTS ===');
    tenants.forEach((tenant: any) => {
      console.log(`ID: ${tenant.id}`);
      console.log(`Name: ${tenant.name}`);
      console.log(`Status: ${tenant.status}`);
      console.log('---');
    });

    // Query users with their tenant info
    const users = await databaseService.query(`
      SELECT u.id, u.email, u.role, u.tenant_id, t.name as tenant_name 
      FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      ORDER BY t.name, u.role, u.email
    `);
    
    console.log('\n=== USERS ===');
    users.forEach((user: any) => {
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Tenant: ${user.tenant_name} (${user.tenant_id})`);
      console.log('---');
    });

    // Close the application
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  getTenants();
}

export { getTenants };