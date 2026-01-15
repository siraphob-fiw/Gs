import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create transition_requests table
  await knex.schema.createTable('transition_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('athlete_id').notNullable();
    table.uuid('current_coach_id').nullable();
    table.uuid('target_coach_id').nullable();
    table.uuid('tenant_id').notNullable();
    table.string('status', 20).notNullable().defaultTo('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
    table.text('reason').nullable();
    table.uuid('approved_by').nullable();
    table.timestamp('approved_at', { useTz: false }).nullable();
    table.uuid('rejected_by').nullable();
    table.timestamp('rejected_at', { useTz: false }).nullable();
    table.text('rejection_reason').nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();

    table.foreign('athlete_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('current_coach_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('target_coach_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('rejected_by').references('id').inTable('users').onDelete('SET NULL');

    table.index(['athlete_id']);
    table.index(['current_coach_id']);
    table.index(['target_coach_id']);
    table.index(['tenant_id']);
    table.index(['status']);
    table.index(['approved_at']);
    table.index(['rejected_at']);
    table.index(['created_at']);
  });

  // Create coach_discovery_profiles table
  await knex.schema.createTable('coach_discovery_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('coach_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.text('bio').nullable();
    table.jsonb('specializations').nullable().comment('Specializations JSON');
    table.jsonb('certifications').nullable().comment('Certifications JSON');
    table.decimal('hourly_rate', 10, 2).nullable();
    table.string('currency', 3).defaultTo('USD');
    table.boolean('is_available').defaultTo(true);
    table.jsonb('availability').nullable().comment('Coach availability schedule JSON');
    table.jsonb('social_links').nullable().comment('Social media links JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();

    table.foreign('coach_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');

    table.index(['coach_id']);
    table.index(['tenant_id']);
    table.index(['is_available']);
    table.index(['hourly_rate']);
    table.index('specializations', undefined, 'gin');
    table.index('certifications', undefined, 'gin');
  });

  // Create audit_logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').nullable();
    table.uuid('user_id').nullable();
    table.string('event_type', 50).notNullable();
    table.boolean('success').defaultTo(false);
    table.text('metadata').nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();

    table.index(['tenant_id']);
    table.index(['user_id']);
    table.index(['event_type']);
  });

  // Create logs table
  await knex.schema.createTable('logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').nullable();
    table.uuid('user_id').nullable();
    table.string('log_level', 20).notNullable();
    table.string('short_message', 500).notNullable();
    table.text('full_message').nullable();
    table.text('ip_address').nullable();
    table.text('user_agent').nullable();
    table.text('url').nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();

    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');

    table.index(['tenant_id']);
    table.index(['user_id']);
    table.index(['log_level']);
    table.index(['created_at']);
  });

  // Create cron_jobs table
  await knex.schema.createTable('cron_jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.string('description', 500).nullable();
    table.string('schedule', 100).notNullable();
    table.string('command', 500).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_run_at', { useTz: false }).nullable();
    table.timestamp('next_run_at', { useTz: false }).nullable();
    table.jsonb('settings').nullable().comment('Job settings JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();

    table.index(['name']);
    table.index(['is_active']);
    table.index(['next_run_at']);
  });

  // Create cron_job_executions table
  await knex.schema.createTable('cron_job_executions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('job_id').notNullable();
    table.string('status', 20).notNullable();
    table.timestamp('started_at', { useTz: false }).notNullable();
    table.timestamp('finished_at', { useTz: false }).nullable();
    table.integer('duration_ms').nullable();
    table.text('output').nullable();
    table.text('error').nullable();
    table.jsonb('metadata').nullable().comment('Execution metadata JSON');

    table.foreign('job_id').references('id').inTable('cron_jobs').onDelete('CASCADE');

    table.index(['job_id']);
    table.index(['status']);
    table.index(['started_at']);
    table.index(['finished_at']);
  });

  // Enable Row Level Security (RLS)
  await knex.raw('ALTER TABLE transition_requests ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE coach_discovery_profiles ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE logs ENABLE ROW LEVEL SECURITY');

  // RLS tenant isolation policies
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON transition_requests
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON coach_discovery_profiles
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON audit_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON logs
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);

  // Super admin policies
  await knex.raw(`
    CREATE POLICY super_admin_policy ON transition_requests
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
    CREATE POLICY super_admin_policy ON coach_discovery_profiles
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
    CREATE POLICY super_admin_policy ON audit_logs
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
    CREATE POLICY super_admin_policy ON logs
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
    CREATE TRIGGER transition_requests_updated_at
    BEFORE UPDATE ON transition_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER coach_discovery_profiles_updated_at
    BEFORE UPDATE ON coach_discovery_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER cron_jobs_updated_at
    BEFORE UPDATE ON cron_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS cron_jobs_updated_at ON cron_jobs');
  await knex.raw('DROP TRIGGER IF EXISTS coach_discovery_profiles_updated_at ON coach_discovery_profiles');
  await knex.raw('DROP TRIGGER IF EXISTS transition_requests_updated_at ON transition_requests');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('cron_job_executions');
  await knex.schema.dropTableIfExists('cron_jobs');
  await knex.schema.dropTableIfExists('logs');
  await knex.schema.dropTableIfExists('audit_logs');
  // No coach_requests table created, so skip dropping
  await knex.schema.dropTableIfExists('coach_discovery_profiles');
  await knex.schema.dropTableIfExists('transition_requests');
}
