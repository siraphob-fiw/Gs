import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create global_settings table
  await knex.schema.createTable('global_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('config_key', 255).notNullable().unique();
    table.jsonb('config_value').notNullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('deleted_at', { useTz: false }).nullable();

    table.index(['config_key']);
    table.index(['created_at']);
  });

  // Add trigger for updated_at
  await knex.raw(`
    CREATE TRIGGER global_settings_updated_at
    BEFORE UPDATE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger
  await knex.raw('DROP TRIGGER IF EXISTS global_settings_updated_at ON global_settings');

  // Drop table
  await knex.schema.dropTableIfExists('global_settings');
}

