import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create message templates table
  await knex.schema.createTable('message_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('name', 100).notNullable();
    table.string('type', 50).notNullable(); // 'email', 'sms', 'push', 'in_app'
    table.string('subject', 200).nullable();
    table.text('content').notNullable();
    table.jsonb('variables').nullable().comment('Template variables JSON');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['type']);
    table.index(['is_active']);
  });

  // Create conversations table
  await knex.schema.createTable('conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('title', 200).nullable();
    table.string('type', 20).notNullable().defaultTo('DIRECT'); // 'DIRECT', 'GROUP', 'CHANNEL'
    table.uuid('created_by').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_message_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['created_by']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['last_message_at']);
  });

  // Create conversation participants table
  await knex.schema.createTable('conversation_participants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable();
    table.uuid('user_id').notNullable();
    table.string('role', 20).defaultTo('MEMBER'); // 'ADMIN', 'MEMBER', 'MODERATOR'
    table.timestamp('joined_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('left_at', { useTz: false }).nullable();
    table.boolean('is_active').defaultTo(true);
    
    // Foreign keys
    table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['conversation_id']);
    table.index(['user_id']);
    table.index(['is_active']);
    table.unique(['conversation_id', 'user_id'], 'unq_conversation_user');
  });

  // Create messages table
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable();
    table.uuid('sender_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.text('content').notNullable();
    table.string('message_type', 20).defaultTo('TEXT'); // 'TEXT', 'IMAGE', 'FILE', 'SYSTEM'
    table.uuid('reply_to_id').nullable();
    table.boolean('is_edited').defaultTo(false);
    table.timestamp('edited_at', { useTz: false }).nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at', { useTz: false }).nullable();
    table.jsonb('metadata').nullable().comment('Message metadata JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('reply_to_id').references('id').inTable('messages').onDelete('SET NULL');
    
    // Indexes
    table.index(['conversation_id']);
    table.index(['sender_id']);
    table.index(['tenant_id']);
    table.index(['message_type']);
    table.index(['is_deleted']);
    table.index(['created_at']);
  });

  // Create message threads table
  await knex.schema.createTable('message_threads', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable();
    table.uuid('parent_message_id').notNullable();
    table.uuid('sender_id').notNullable();
    table.text('content').notNullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
    table.foreign('parent_message_id').references('id').inTable('messages').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['conversation_id']);
    table.index(['parent_message_id']);
    table.index(['sender_id']);
    table.index(['is_deleted']);
    table.index(['created_at']);
  });

  // Create message attachments table
  await knex.schema.createTable('message_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('message_id').notNullable();
    table.string('filename', 255).notNullable();
    table.string('original_filename', 255).notNullable();
    table.string('mime_type', 100).notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('file_path', 500).notNullable();
    table.string('file_url', 500).nullable();
    table.jsonb('metadata').nullable().comment('File metadata JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('message_id').references('id').inTable('messages').onDelete('CASCADE');
    
    // Indexes
    table.index(['message_id']);
    table.index(['mime_type']);
    table.index(['created_at']);
  });

  // Create message delivery receipts table
  await knex.schema.createTable('message_delivery_receipts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('message_id').notNullable();
    table.uuid('user_id').notNullable();
    table.string('status', 20).notNullable(); // 'SENT', 'DELIVERED', 'READ', 'FAILED'
    table.timestamp('status_at', { useTz: false }).notNullable();
    table.string('failure_reason', 200).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('message_id').references('id').inTable('messages').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['message_id']);
    table.index(['user_id']);
    table.index(['status']);
    table.index(['status_at']);
  });

  // Create external messages table
  await knex.schema.createTable('external_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('external_id', 100).notNullable();
    table.string('platform', 20).notNullable(); // 'whatsapp', 'line', 'telegram', 'sms'
    table.string('direction', 10).notNullable(); // 'inbound', 'outbound'
    table.uuid('user_id').nullable();
    table.string('phone_number', 20).nullable();
    table.text('content').notNullable();
    table.string('message_type', 20).defaultTo('TEXT');
    table.jsonb('metadata').nullable().comment('External message metadata JSON');
    table.timestamp('received_at', { useTz: false }).notNullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['external_id']);
    table.index(['platform']);
    table.index(['direction']);
    table.index(['user_id']);
    table.index(['phone_number']);
    table.index(['received_at']);
  });

  // Enable Row Level Security
  await knex.raw('ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE conversations ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE messages ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE message_delivery_receipts ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE external_messages ENABLE ROW LEVEL SECURITY');

  // Create RLS policies for tenant isolation
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON message_templates
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON conversations
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON messages
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON external_messages
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);

  // Super admin policies
  await knex.raw(`
    CREATE POLICY super_admin_policy ON message_templates
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
    CREATE POLICY super_admin_policy ON conversations
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
    CREATE POLICY super_admin_policy ON messages
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
    CREATE POLICY super_admin_policy ON external_messages
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
    CREATE TRIGGER message_templates_updated_at 
    BEFORE UPDATE ON message_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS messages_updated_at ON messages');
  await knex.raw('DROP TRIGGER IF EXISTS conversations_updated_at ON conversations');
  await knex.raw('DROP TRIGGER IF EXISTS message_templates_updated_at ON message_templates');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('external_messages');
  await knex.schema.dropTableIfExists('message_delivery_receipts');
  await knex.schema.dropTableIfExists('message_attachments');
  await knex.schema.dropTableIfExists('message_threads');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('conversation_participants');
  await knex.schema.dropTableIfExists('conversations');
  await knex.schema.dropTableIfExists('message_templates');
}
