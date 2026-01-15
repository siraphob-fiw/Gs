import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create exercise_categories table
  await knex.schema.createTable('exercise_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop table
  await knex.schema.dropTable('exercise_categories');
}
