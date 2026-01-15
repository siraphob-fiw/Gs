import type { Knex } from 'knex';

/**
 * Migration to make exercises global (remove tenant_id completely).
 * Exercises will now be available across all tenants.
 */
export async function up(knex: Knex): Promise<void> {
  // Drop the RLS policies for exercises (tenant isolation no longer needed)
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON exercises');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON exercises');

  // Disable RLS on exercises table since it's now global
  await knex.raw('ALTER TABLE exercises DISABLE ROW LEVEL SECURITY');

  // Drop the foreign key constraint first
  await knex.schema.alterTable('exercises', (table) => {
    table.dropForeign(['tenant_id']);
  });

  // Drop the tenant_id index
  await knex.schema.alterTable('exercises', (table) => {
    table.dropIndex(['tenant_id']);
  });

  // Drop the tenant_id column completely
  await knex.schema.alterTable('exercises', (table) => {
    table.dropColumn('tenant_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Re-add the tenant_id column (will need to be populated manually)
  await knex.schema.alterTable('exercises', (table) => {
    table.uuid('tenant_id').nullable();
  });

  // Re-add the index
  await knex.schema.alterTable('exercises', (table) => {
    table.index(['tenant_id']);
  });

  // Re-add the foreign key constraint
  await knex.schema.alterTable('exercises', (table) => {
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
  });

  // Re-enable RLS
  await knex.raw('ALTER TABLE exercises ENABLE ROW LEVEL SECURITY');

  // Re-create the RLS policies
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON exercises
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY super_admin_policy ON exercises
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

