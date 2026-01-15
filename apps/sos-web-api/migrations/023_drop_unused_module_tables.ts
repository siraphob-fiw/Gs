import type { Knex } from 'knex';

/**
 * Migration to drop unused module tables after removing:
 * - cron module
 * - health module
 * - notification module
 * - payment module
 * - payment_portal module
 * - payment_provider module
 * - performance module
 * - subscription module
 */
export async function up(knex: Knex): Promise<void> {
  // Drop triggers first
  await knex.raw('DROP TRIGGER IF EXISTS usage_tracking_updated_at ON usage_tracking');
  await knex.raw('DROP TRIGGER IF EXISTS payments_updated_at ON payments');
  await knex.raw('DROP TRIGGER IF EXISTS invoices_updated_at ON invoices');
  await knex.raw('DROP TRIGGER IF EXISTS payment_methods_updated_at ON payment_methods');
  await knex.raw('DROP TRIGGER IF EXISTS payment_providers_updated_at ON payment_providers');
  await knex.raw('DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences');
  await knex.raw('DROP TRIGGER IF EXISTS notifications_updated_at ON notifications');
  await knex.raw('DROP TRIGGER IF EXISTS notification_templates_updated_at ON notification_templates');
  await knex.raw('DROP TRIGGER IF EXISTS cron_jobs_updated_at ON cron_jobs');

  // Drop RLS policies (they are dropped automatically with tables, but being explicit)
  // Audit/logs tables policies
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON audit_logs');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON logs');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON audit_logs');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON logs');

  // Billing tables policies
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON payment_methods');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON payments');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON invoices');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON usage_tracking');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON payment_methods');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON payments');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON invoices');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON usage_tracking');

  // Notification tables policies
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON notification_templates');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON notifications');
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON notification_preferences');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON notification_templates');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON notifications');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON notification_preferences');

  // Drop billing/payment tables (in correct order for foreign key constraints)
  await knex.schema.dropTableIfExists('usage_tracking');
  await knex.schema.dropTableIfExists('payment_attempts');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('payment_methods');
  await knex.schema.dropTableIfExists('payment_providers');

  // Drop notification tables (in correct order for foreign key constraints)
  await knex.schema.dropTableIfExists('notification_delivery_log');
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('notification_templates');

  // Drop cron tables (in correct order for foreign key constraints)
  await knex.schema.dropTableIfExists('cron_job_executions');
  await knex.schema.dropTableIfExists('cron_jobs');

  // Drop audit/logs tables
  await knex.schema.dropTableIfExists('audit_logs');
}

export async function down(knex: Knex): Promise<void> {
}

