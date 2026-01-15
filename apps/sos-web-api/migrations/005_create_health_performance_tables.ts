import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create competitions table, if it doesn't already exist
  const hasCompetitionsTable = await knex.schema.hasTable('competitions');
  if (!hasCompetitionsTable) {
    await knex.schema.createTable('competitions', (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('gen_random_uuid()'));
      table
        .uuid('athlete_id')
        .notNullable();
      table
        .uuid('tenant_id')
        .notNullable();
      table
        .jsonb('competition_data')
        .nullable()
        .comment('Competition data JSON');
      table
        .timestamp('created_at', { useTz: false })
        .defaultTo(knex.fn.now())
        .notNullable();
      table
        .timestamp('updated_at', { useTz: false })
        .defaultTo(knex.fn.now())
        .notNullable();

      // Foreign keys
      table
        .foreign('athlete_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .foreign('tenant_id')
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE');

      // Indexes
      table.index(['athlete_id']);
      table.index(['tenant_id']);
      // Removed `competition_range` index as there is no such column
    });
  }

  // Enable RLS
  await knex.raw('ALTER TABLE competitions ENABLE ROW LEVEL SECURITY');

  // Create RLS policy for tenant isolation if not exists
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'competitions' AND policyname = 'tenant_isolation_policy'
      ) THEN
        EXECUTE 'CREATE POLICY tenant_isolation_policy ON competitions USING (tenant_id = current_setting(''app.current_tenant_id'')::uuid)';
      END IF;
    END $$;
  `);

  // Create RLS policy for super admin if not exists
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'competitions' AND policyname = 'super_admin_policy'
      ) THEN
        EXECUTE $policy$
          CREATE POLICY super_admin_policy ON competitions
            USING (
              EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = current_setting('app.current_user_id')::uuid
                AND u.role = 'SUPER_ADMIN'
                AND u.status = 'ACTIVE'
              )
            )
        $policy$;
      END IF;
    END $$;
  `);

  // Add trigger for updated_at only if not exists
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'competitions_updated_at'
      ) THEN
        CREATE TRIGGER competitions_updated_at 
        BEFORE UPDATE ON competitions 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      END IF;
    END $$;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger for updated_at if exists
  await knex.raw('DROP TRIGGER IF EXISTS competitions_updated_at ON competitions');

  // Drop competitions table if exists
  await knex.schema.dropTableIfExists('competitions');
}
