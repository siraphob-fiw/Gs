import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create password reset tokens table
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.string('token', 255).notNullable().unique();
    table.timestamp('expires_at', { useTz: false }).notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('used_at', { useTz: false }).nullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['tenant_id']);
    table.index(['token']);
    table.index(['expires_at']);
    table.index(['used']);
  });

  // Create email verification tokens table
  await knex.schema.createTable('email_verification_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.string('token', 255).notNullable().unique();
    table.timestamp('expires_at', { useTz: false }).notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('used_at', { useTz: false }).nullable();
    table.string('email', 100).notNullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['tenant_id']);
    table.index(['token']);
    table.index(['email']);
    table.index(['expires_at']);
    table.index(['used']);
  });

  // Create phone verification tokens table
  await knex.schema.createTable('phone_verification_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('token', 10).notNullable();
    table.string('phone_number', 20).notNullable();
    table.timestamp('expires_at', { useTz: false }).notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('used_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['token']);
    table.index(['phone_number']);
    table.index(['expires_at']);
    table.index(['used']);
  });

  // Create login attempts table
  await knex.schema.createTable('login_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 100).notNullable();
    table.uuid('tenant_id').nullable();
    table.string('ip_address', 45).notNullable();
    table.string('user_agent', 500).nullable();
    table.boolean('success').notNullable();
    table.string('failure_reason', 200).nullable();
    table.timestamp('attempted_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
    
    // Indexes
    table.index(['email']);
    table.index(['tenant_id']);
    table.index(['ip_address']);
    table.index(['attempted_at']);
    table.index(['success']);
  });

  // Create security events table
  await knex.schema.createTable('security_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable();
    table.uuid('tenant_id').nullable();
    table.string('event_type', 50).notNullable();
    table.string('severity', 20).notNullable().defaultTo('INFO');
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.jsonb('metadata').nullable();
    table.timestamp('occurred_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
    
    // Indexes
    table.index(['user_id']);
    table.index(['tenant_id']);
    table.index(['event_type']);
    table.index(['severity']);
    table.index(['occurred_at']);
  });

  // Enable Row Level Security
  await knex.raw('ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE phone_verification_tokens ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE security_events ENABLE ROW LEVEL SECURITY');

  // Create RLS policies for tenant isolation
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON password_reset_tokens
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON email_verification_tokens
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON login_attempts
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON security_events
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);

  // Super admin policies
  await knex.raw(`
    CREATE POLICY super_admin_policy ON password_reset_tokens
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
    CREATE POLICY super_admin_policy ON email_verification_tokens
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
    CREATE POLICY super_admin_policy ON phone_verification_tokens
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
    CREATE POLICY super_admin_policy ON login_attempts
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
    CREATE POLICY super_admin_policy ON security_events
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('security_events');
  await knex.schema.dropTableIfExists('login_attempts');
  await knex.schema.dropTableIfExists('phone_verification_tokens');
  await knex.schema.dropTableIfExists('email_verification_tokens');
  await knex.schema.dropTableIfExists('password_reset_tokens');
}
