import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create subscription plans table
  await knex.schema.createTable('subscription_plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('description', 500).nullable();
    table.string('plan_code', 50).notNullable().unique();
    table.decimal('price', 10, 2).notNullable();
    table.string('currency', 3).notNullable().defaultTo('USD');
    table.string('billing_cycle', 20).notNullable(); // 'monthly', 'yearly', 'weekly', 'daily'
    table.integer('trial_days').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.jsonb('features').nullable().comment('Plan features JSON');
    table.jsonb('limits').nullable().comment('Usage limits JSON');
    table.integer('max_users').nullable();
    table.integer('max_athletes').nullable();
    table.integer('max_coaches').nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Indexes
    table.index(['plan_code']);
    table.index(['is_active']);
    table.index(['billing_cycle']);
    table.index(['price']);
  });

  // Create subscriptions table
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('plan_id').notNullable();
    table.string('status', 20).notNullable().defaultTo('ACTIVE'); // 'ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED', 'TRIAL'
    table.timestamp('start_date', { useTz: false }).notNullable();
    table.timestamp('end_date', { useTz: false }).nullable();
    table.timestamp('trial_end_date', { useTz: false }).nullable();
    table.timestamp('cancelled_at', { useTz: false }).nullable();
    table.string('cancellation_reason', 200).nullable();
    table.boolean('auto_renew').defaultTo(true);
    table.jsonb('metadata').nullable().comment('Subscription metadata JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('plan_id').references('id').inTable('subscription_plans').onDelete('RESTRICT');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['plan_id']);
    table.index(['status']);
    table.index(['start_date']);
    table.index(['end_date']);
    table.index(['trial_end_date']);
  });

  // Create payment providers table
  await knex.schema.createTable('payment_providers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 50).notNullable();
    table.string('provider_code', 20).notNullable().unique();
    table.string('provider_type', 20).notNullable(); // 'stripe', 'paypal', 'razorpay', etc.
    table.boolean('is_active').defaultTo(true);
    table.jsonb('configuration').nullable().comment('Provider configuration JSON');
    table.jsonb('supported_currencies').notNullable().defaultTo('{}');
    table.jsonb('supported_countries').notNullable().defaultTo('{}');
    table.decimal('processing_fee_percentage', 5, 4).defaultTo(0);
    table.decimal('fixed_fee', 10, 2).defaultTo(0);
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Indexes
    table.index(['provider_code']);
    table.index(['provider_type']);
    table.index(['is_active']);
  });

  // Create payment methods table
  await knex.schema.createTable('payment_methods', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('provider_id').notNullable();
    table.string('external_id', 100).notNullable().comment('External payment method ID from provider');
    table.string('type', 20).notNullable(); // 'card', 'bank_account', 'paypal', 'wallet'
    table.string('last_four', 4).nullable();
    table.string('brand', 20).nullable(); // 'visa', 'mastercard', 'amex', etc.
    table.string('exp_month', 2).nullable();
    table.string('exp_year', 4).nullable();
    table.boolean('is_default').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.jsonb('metadata').nullable().comment('Payment method metadata JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('provider_id').references('id').inTable('payment_providers').onDelete('RESTRICT');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['provider_id']);
    table.index(['external_id']);
    table.index(['type']);
    table.index(['is_default']);
    table.index(['is_active']);
  });

  // Create invoices table (MOVED UP)
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('subscription_id').notNullable();
    table.string('invoice_number', 50).notNullable().unique();
    table.string('status', 20).notNullable().defaultTo('DRAFT'); // 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.date('issue_date').notNullable();
    table.date('due_date').notNullable();
    table.date('paid_date').nullable();
    table.text('notes').nullable();
    table.jsonb('line_items').notNullable().comment('Invoice line items JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('subscription_id').references('id').inTable('subscriptions').onDelete('CASCADE');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['subscription_id']);
    table.index(['invoice_number']);
    table.index(['status']);
    table.index(['issue_date']);
    table.index(['due_date']);
  });

  // Create payments table
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('invoice_id').notNullable();
    table.uuid('payment_method_id').nullable();
    table.uuid('provider_id').notNullable();
    table.string('external_id', 100).notNullable().comment('External payment ID from provider');
    table.string('status', 20).notNullable(); // 'pending', 'succeeded', 'failed', 'cancelled', 'refunded'
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.string('description', 200).nullable();
    table.jsonb('metadata').nullable().comment('Payment metadata JSON');
    table.timestamp('processed_at', { useTz: false }).nullable();
    table.timestamp('failed_at', { useTz: false }).nullable();
    table.string('failure_reason', 200).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');
    table.foreign('payment_method_id').references('id').inTable('payment_methods').onDelete('SET NULL');
    table.foreign('provider_id').references('id').inTable('payment_providers').onDelete('RESTRICT');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['invoice_id']);
    table.index(['payment_method_id']);
    table.index(['provider_id']);
    table.index(['external_id']);
    table.index(['status']);
    table.index(['processed_at']);
  });

  // Create payment attempts table
  await knex.schema.createTable('payment_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('payment_id').notNullable();
    table.string('status', 20).notNullable(); // 'pending', 'succeeded', 'failed'
    table.string('failure_reason', 200).nullable();
    table.jsonb('response_data').nullable().comment('Provider response data JSON');
    table.timestamp('attempted_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('payment_id').references('id').inTable('payments').onDelete('CASCADE');
    
    // Indexes
    table.index(['payment_id']);
    table.index(['status']);
    table.index(['attempted_at']);
  });

  // Create usage tracking table
  await knex.schema.createTable('usage_tracking', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('metric_name', 50).notNullable();
    table.integer('usage_count').notNullable().defaultTo(0);
    table.date('tracking_date').notNullable();
    table.jsonb('metadata').nullable().comment('Usage metadata JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['metric_name']);
    table.index(['tracking_date']);
    table.unique(['tenant_id', 'metric_name', 'tracking_date'], 'unq_tenant_metric_date');
  });

  // Enable Row Level Security
  await knex.raw('ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE payments ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE invoices ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY');

  // Create RLS policies for tenant isolation
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON subscriptions
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON payment_methods
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON payments
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON invoices
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON usage_tracking
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);

  // Super admin policies
  await knex.raw(`
    CREATE POLICY super_admin_policy ON subscriptions
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
    CREATE POLICY super_admin_policy ON payment_methods
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
    CREATE POLICY super_admin_policy ON payments
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
    CREATE POLICY super_admin_policy ON invoices
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
    CREATE POLICY super_admin_policy ON usage_tracking
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
    CREATE TRIGGER subscription_plans_updated_at 
    BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER payment_providers_updated_at 
    BEFORE UPDATE ON payment_providers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER usage_tracking_updated_at 
    BEFORE UPDATE ON usage_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS usage_tracking_updated_at ON usage_tracking');
  await knex.raw('DROP TRIGGER IF EXISTS payments_updated_at ON payments');
  await knex.raw('DROP TRIGGER IF EXISTS invoices_updated_at ON invoices');
  await knex.raw('DROP TRIGGER IF EXISTS payment_methods_updated_at ON payment_methods');
  await knex.raw('DROP TRIGGER IF EXISTS payment_providers_updated_at ON payment_providers');
  await knex.raw('DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions');
  await knex.raw('DROP TRIGGER IF EXISTS subscription_plans_updated_at ON subscription_plans');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('usage_tracking');
  await knex.schema.dropTableIfExists('payment_attempts');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('payment_methods');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('subscription_plans');
  await knex.schema.dropTableIfExists('payment_providers');
}
