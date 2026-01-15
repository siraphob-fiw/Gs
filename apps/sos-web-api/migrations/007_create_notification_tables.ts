import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create notification templates table
  await knex.schema.createTable('notification_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('name', 100).notNullable();
    table.string('type', 50).notNullable(); // 'email', 'push', 'sms', 'in_app'
    table.string('category', 50).notNullable(); // 'system', 'marketing', 'transactional'
    table.string('subject', 200).nullable();
    table.text('content').notNullable();
    table.jsonb('variables').nullable().comment('Template variables JSON');
    table.jsonb('settings').nullable().comment('Template settings JSON');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['type']);
    table.index(['category']);
    table.index(['is_active']);
  });

  // Create notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('user_id').notNullable();
    table.uuid('template_id').nullable();
    table.string('type', 50).notNullable(); // 'email', 'push', 'sms', 'in_app'
    table.string('category', 50).notNullable();
    table.string('title', 200).notNullable();
    table.text('content').notNullable();
    table.jsonb('data').nullable().comment('Notification data JSON');
    table.string('status', 20).notNullable().defaultTo('PENDING'); // 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'
    table.timestamp('scheduled_at', { useTz: false }).nullable();
    table.timestamp('sent_at', { useTz: false }).nullable();
    table.timestamp('delivered_at', { useTz: false }).nullable();
    table.timestamp('read_at', { useTz: false }).nullable();
    table.string('failure_reason', 200).nullable();
    table.jsonb('metadata').nullable().comment('Notification metadata JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('template_id').references('id').inTable('notification_templates').onDelete('SET NULL');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['user_id']);
    table.index(['template_id']);
    table.index(['type']);
    table.index(['category']);
    table.index(['status']);
    table.index(['scheduled_at']);
    table.index(['created_at']);
  });

  // Create notification preferences table
  await knex.schema.createTable('notification_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.string('notification_type', 50).notNullable(); // 'email', 'push', 'sms', 'in_app'
    table.string('category', 50).notNullable(); // 'system', 'marketing', 'transactional'
    table.boolean('enabled').defaultTo(true);
    table.jsonb('settings').nullable().comment('User-specific notification settings JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['tenant_id']);
    table.index(['notification_type']);
    table.index(['category']);
    table.unique(['user_id', 'notification_type', 'category'], 'unq_user_notification_preference');
  });

  // Create notification delivery log table
  await knex.schema.createTable('notification_delivery_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('notification_id').notNullable();
    table.string('provider', 50).notNullable(); // 'sendgrid', 'twilio', 'firebase', etc.
    table.string('external_id', 100).nullable();
    table.string('status', 20).notNullable(); // 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'
    table.string('failure_reason', 200).nullable();
    table.jsonb('response_data').nullable().comment('Provider response data JSON');
    table.timestamp('attempted_at', { useTz: false }).notNullable();
    table.timestamp('delivered_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('notification_id').references('id').inTable('notifications').onDelete('CASCADE');
    
    // Indexes
    table.index(['notification_id']);
    table.index(['provider']);
    table.index(['external_id']);
    table.index(['status']);
    table.index(['attempted_at']);
  });

  // Enable Row Level Security
  await knex.raw('ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE notifications ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY');

  // Create RLS policies for tenant isolation
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON notification_templates
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON notifications
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON notification_preferences
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);

  // Super admin policies
  await knex.raw(`
    CREATE POLICY super_admin_policy ON notification_templates
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
    CREATE POLICY super_admin_policy ON notifications
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
    CREATE POLICY super_admin_policy ON notification_preferences
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);

  // Add triggers for updated_at
  await knex.raw(`
    CREATE TRIGGER notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences');
  await knex.raw('DROP TRIGGER IF EXISTS notifications_updated_at ON notifications');
  await knex.raw('DROP TRIGGER IF EXISTS notification_templates_updated_at ON notification_templates');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('notification_delivery_log');
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('notification_templates');
}
