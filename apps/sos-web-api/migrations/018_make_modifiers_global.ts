import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Remove tenant_id foreign key and column from modifier_categories
  await knex.schema.alterTable('modifier_categories', (table) => {
    table.dropForeign(['tenant_id']);
    table.dropIndex(['tenant_id']);
    table.dropColumn('tenant_id');
  });

  // Remove tenant_id column from modifiers (no foreign key was defined in original migration)
  await knex.schema.alterTable('modifiers', (table) => {
    table.dropColumn('tenant_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Re-add tenant_id column to modifier_categories
  await knex.schema.alterTable('modifier_categories', (table) => {
    table.uuid('tenant_id').nullable();
    table.index(['tenant_id']);
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
  });

  // Re-add tenant_id column to modifiers
  await knex.schema.alterTable('modifiers', (table) => {
    table.uuid('tenant_id').nullable();
  });
}

