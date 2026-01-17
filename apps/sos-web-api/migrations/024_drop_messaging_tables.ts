import type { Knex } from 'knex';

/**
 * Migration to drop messaging module tables:
 * - conversations
 * - conversation_participants
 * - external_messages
 * - message_attachments
 * - message_delivery_receipts
 * - message_templates
 * - message_threads
 * - messages
 */
export async function up(knex: Knex): Promise<void> {
  // Drop triggers first
  await knex.raw('DROP TRIGGER IF EXISTS messages_updated_at ON messages');
  await knex.raw('DROP TRIGGER IF EXISTS conversations_updated_at ON conversations');
  await knex.raw('DROP TRIGGER IF EXISTS message_templates_updated_at ON message_templates');

  // Drop RLS policies
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON message_templates');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON conversations');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON messages');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON external_messages');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON message_templates');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON conversations');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON messages');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON external_messages');

  // Drop tables in correct order (respecting foreign key constraints)
  await knex.schema.dropTableIfExists('external_messages');
  await knex.schema.dropTableIfExists('message_delivery_receipts');
  await knex.schema.dropTableIfExists('message_attachments');
  await knex.schema.dropTableIfExists('message_threads');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('conversation_participants');
  await knex.schema.dropTableIfExists('conversations');
  await knex.schema.dropTableIfExists('message_templates');
}

export async function down(knex: Knex): Promise<void> {
  // This migration is destructive - restoring would require re-running the original migration
  // If you need to restore these tables, run migration 006_create_messaging_tables
  console.warn('This migration drops tables permanently. To restore, you would need to re-run the original creation migration (006_create_messaging_tables).');
}



