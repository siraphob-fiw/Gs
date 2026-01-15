import type { Knex } from 'knex';

/**
 * Migration to make tenant_id nullable on users table
 * 
 * This allows users to register without being assigned to a tenant.
 * Users will be assigned a tenant_id when invited by a tenant admin, coach admin, or coach.
 */
export async function up(knex: Knex): Promise<void> {
  // 1. First, drop ALL RLS policies that use tenant_id column (must be done before altering column)
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON users');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON users');

  // 2. Drop the existing foreign key constraint on users
  await knex.raw(`
    ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_tenant_id_foreign
  `);

  // 3. Drop the unique constraint that depends on tenant_id
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS unq_tenant_email');

  // 4. Make tenant_id nullable on users table
  await knex.schema.alterTable('users', (table) => {
    table.uuid('tenant_id').nullable().alter();
  });

  // 5. Re-add the foreign key constraint (now allows NULL)
  await knex.schema.alterTable('users', (table) => {
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
  });

  // 6. Create new unique constraints for email per tenant (handles NULL tenant_id)
  // For users WITH tenant_id, email must be unique per tenant
  await knex.raw(`
    CREATE UNIQUE INDEX unq_tenant_email ON users (tenant_id, email) 
    WHERE tenant_id IS NOT NULL
  `);
  
  // For users WITHOUT tenant_id, email must be globally unique among unassigned users
  await knex.raw(`
    CREATE UNIQUE INDEX unq_email_no_tenant ON users (email) 
    WHERE tenant_id IS NULL
  `);

  // 7. Recreate RLS policies for users table with updated logic
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON users
    USING (
      tenant_id IS NULL 
      OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
      OR id = current_setting('app.current_user_id', true)::uuid
    )
  `);
  
  await knex.raw(`
    CREATE POLICY super_admin_policy ON users
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id', true)::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Note: This rollback will fail if there are users with NULL tenant_id
  // You would need to delete or assign tenant_id to those users first

  // 1. Drop the new policies first
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON users');
  await knex.raw('DROP POLICY IF EXISTS super_admin_policy ON users');

  // 2. Drop the new unique indexes
  await knex.raw('DROP INDEX IF EXISTS unq_email_no_tenant');
  await knex.raw('DROP INDEX IF EXISTS unq_tenant_email');


  // 4. Revert users tenant_id to NOT NULL
  await knex.schema.alterTable('users', (table) => {
    table.dropForeign(['tenant_id']);
  });
  
  await knex.schema.alterTable('users', (table) => {
    table.uuid('tenant_id').notNullable().alter();
  });
  
  await knex.schema.alterTable('users', (table) => {
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
  });

  // 5. Re-create the original unique constraint
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT unq_tenant_email UNIQUE (tenant_id, email)
  `);

  // 6. Recreate original RLS policies
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
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
}

