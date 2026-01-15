import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  // await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Create custom types
  await knex.raw(`
    CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL');
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'COACH_ADMIN', 'COACH', 'ATHLETE', 'SELF_COACHED');
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL');
    CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');
    CREATE TYPE experience_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
    CREATE TYPE relationship_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED');
  `);

  // 1. Create tenants table (foundation for multi-tenancy)
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable().comment('Tenant business name');
    table.specificType('status', 'tenant_status').defaultTo('TRIAL');
    table.jsonb('settings').nullable().comment('Tenant-specific settings JSON');
    table.string('subscription_info').nullable().comment('Subscription details JSON');
    table.jsonb('billing_info').nullable().comment('Billing information JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('suspended_at', { useTz: false }).nullable();
    
    // Indexes
    table.index(['status']);
    table.index(['created_at']);
  });

  // 2. Create users table (unified user system - no separate athletes table)
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().comment('Reference to tenant');
    table.string('email', 100).notNullable();
    table.string('password_hash', 255).nullable().comment('Hashed password for email/password auth');
    table.string('salt', 255).nullable().comment('Password salt');
    table.specificType('role', 'user_role').notNullable();
    table.specificType('status', 'user_status').defaultTo('PENDING_VERIFICATION');
    
    // Profile information
    table.string('first_name', 100).nullable();
    table.string('last_name', 100).nullable();
    table.date('date_of_birth').nullable();
    table.specificType('gender', 'gender_type').nullable();
    table.decimal('body_weight', 5, 2).nullable().comment('Weight in kg');
    table.decimal('height', 5, 2).nullable().comment('Height in cm');
    
    // Preferences and settings
    table.jsonb('preferences').nullable().comment('User preferences JSON');
    
    // Contact information
    table.string('phone', 20).nullable();
    table.boolean('phone_verified').defaultTo(false);
    table.timestamp('phone_verified_at', { useTz: false }).nullable();
    table.string('phone_verification_token', 255).nullable();
    table.timestamp('phone_verification_expires_at', { useTz: false }).nullable();
    
    // Authentication
    table.jsonb('auth_providers').nullable();
    table.jsonb('whatsapp_data').nullable();
    table.jsonb('line_data').nullable();
    
    // Timestamps
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('last_login_at', { useTz: false }).nullable();
    table.timestamp('email_verified_at', { useTz: false }).nullable();
    table.timestamp('suspended_at', { useTz: false }).nullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes for tenant isolation and performance
    table.index(['tenant_id', 'email'], 'idx_tenant_email');
    table.index(['tenant_id', 'role'], 'idx_tenant_role');
    table.index(['tenant_id', 'status'], 'idx_tenant_status');
    table.index(['email']);
    table.index(['role']);
    table.index(['status']);
    table.index(['created_at']);
    
    // Unique constraint on email per tenant
    table.unique(['tenant_id', 'email'], 'unq_tenant_email');
  });

  // 3. Create user sessions table
  await knex.schema.createTable('user_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.text('refresh_token').notNullable().unique();
    table.text('access_token_jti').nullable().comment('JWT ID for access token');
    table.string('device_id', 100).nullable().comment('Device identifier');
    table.string('user_agent', 500).nullable();
    table.specificType('ip_address', 'inet').nullable().comment('IPv4 or IPv6 address');
    table.jsonb('metadata').nullable().comment('Additional session metadata');
    
    // Session lifecycle
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('last_used_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('expires_at', { useTz: false }).notNullable();
    table.boolean('is_revoked').defaultTo(false);
    table.timestamp('revoked_at', { useTz: false }).nullable();
    table.string('revoked_reason', 200).nullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id'], 'idx_tenant_user_sessions');
    table.index(['refresh_token']);
    table.index(['access_token_jti']);
    table.index(['expires_at']);
    table.index(['is_revoked']);
    table.index(['created_at']);
  });

  // 4. Create coach-athlete relationships table
  await knex.schema.createTable('coach_athlete_relationships', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().comment('Tenant isolation');
    table.uuid('coach_id').notNullable().comment('Coach user ID');
    table.uuid('athlete_id').notNullable().comment('Athlete user ID');
    table.specificType('status', 'relationship_status').defaultTo('PENDING');
    table.text('notes').nullable().comment('Relationship notes');
    
    // Relationship lifecycle
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('start_date', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('end_date', { useTz: false }).nullable();
    table.uuid('created_by').nullable().comment('User who created the relationship');
    table.uuid('terminated_by').nullable().comment('User who terminated the relationship');
    table.string('termination_reason', 500).nullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('coach_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('athlete_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['tenant_id', 'coach_id'], 'idx_tenant_coach');
    table.index(['tenant_id', 'athlete_id'], 'idx_tenant_athlete');
    table.index(['tenant_id', 'status'], 'idx_coach_athlete_tenant_status');
    table.index(['status']);
    table.index(['start_date']);
    table.index(['end_date']);
    
    // Unique constraint - one active relationship per coach-athlete pair
    table.unique(['tenant_id', 'coach_id', 'athlete_id', 'status'], 'unq_active_relationship');
  });

  // Create JSONB indexes for better performance
  await knex.raw('CREATE INDEX idx_tenant_default_language ON tenants ((settings->>\'defaultLanguage\'))');
  await knex.raw('CREATE INDEX idx_user_language ON users ((preferences->>\'language\'))');
  await knex.raw('CREATE INDEX idx_user_weight_unit ON users ((preferences->>\'weightUnit\'))');

  // Enable Row Level Security
  await knex.raw('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE coach_athlete_relationships ENABLE ROW LEVEL SECURITY');

  await knex.raw(`
    CREATE POLICY super_admin_policy ON users
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);

  await knex.raw(`
    CREATE POLICY super_admin_policy ON user_sessions
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);

  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON coach_athlete_relationships
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY super_admin_policy ON coach_athlete_relationships
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);

  // Add trigger functions
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_last_used_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.last_used_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Add triggers
  await knex.raw(`
    CREATE TRIGGER tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER user_sessions_last_used 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_last_used_at();
  `);

  await knex.raw(`
    CREATE TRIGGER coach_athlete_relationships_updated_at 
    BEFORE UPDATE ON coach_athlete_relationships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS coach_athlete_relationships_updated_at ON coach_athlete_relationships');
  await knex.raw('DROP TRIGGER IF EXISTS user_sessions_last_used ON user_sessions');
  await knex.raw('DROP TRIGGER IF EXISTS users_updated_at ON users');
  await knex.raw('DROP TRIGGER IF EXISTS tenants_updated_at ON tenants');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('coach_athlete_relationships');
  await knex.schema.dropTableIfExists('user_sessions');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('tenants');

  // Drop types
  await knex.raw(`
    DROP TYPE IF EXISTS relationship_status;
    DROP TYPE IF EXISTS experience_level;
    DROP TYPE IF EXISTS gender_type;
    DROP TYPE IF EXISTS user_status;
    DROP TYPE IF EXISTS user_role;
    DROP TYPE IF EXISTS tenant_status;
  `);

  // Drop functions
  await knex.raw('DROP FUNCTION IF EXISTS update_last_used_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
}
