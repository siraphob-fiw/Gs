import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Make tenant_id nullable
  await knex.schema.alterTable('tenants', (table) => {
    table.text('description').nullable();
    table.boolean('is_free').notNullable().defaultTo(false);
    table.jsonb('contact').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tenants', (table) => {
    table.dropColumn('is_free');
    table.dropColumn('description');
    table.dropColumn('contact');
  });

}

