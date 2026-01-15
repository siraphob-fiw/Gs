import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Drop policy to allow column alteration
  await knex.raw('DROP POLICY IF EXISTS tenant_isolation_policy ON training_blocks');

  // Make tenant_id nullable
  await knex.schema.alterTable('training_blocks', (table) => {
    table.uuid('tenant_id').nullable().alter();
  });

  // Re-create policy
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON training_blocks
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);

  // Re-add the foreign key constraint (now allows NULL)
  await knex.schema.alterTable('training_blocks', (table) => {
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
  });

  // Add is_free column to training_blocks table
  await knex.schema.alterTable('training_blocks', (table) => {
    table.boolean('is_free').notNullable().defaultTo(false);
  });

  // Add index for is_free column for efficient querying
  await knex.schema.alterTable('training_blocks', (table) => {
    table.index(['is_free'], 'idx_training_blocks_is_free');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('training_blocks', (table) => {
    table.dropIndex(['is_free'], 'idx_training_blocks_is_free');
  });

  await knex.schema.alterTable('training_blocks', (table) => {
    table.dropColumn('is_free');
  });

  // Revert tenant_id to not nullable
  // First, drop the foreign key constraint if it exists
  await knex.raw(`
    ALTER TABLE training_blocks 
    DROP CONSTRAINT IF EXISTS training_blocks_tenant_id_foreign
  `);

  // Revert tenant_id to not nullable
  await knex.schema.alterTable('training_blocks', (table) => {
    table.uuid('tenant_id').notNullable().alter();
  });

  // Re-add the foreign key constraint with CASCADE
  await knex.schema.alterTable('training_blocks', (table) => {
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
  });
}

