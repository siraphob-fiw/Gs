import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add coach_id column to training_sessions table
  await knex.schema.alterTable('training_sessions', (table) => {
    table.uuid('coach_id').nullable();
    
    // Add foreign key reference to users table
    table.foreign('coach_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Add index for coach_id
    table.index(['coach_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('training_sessions', (table) => {
    table.dropIndex(['coach_id']);
    table.dropForeign(['coach_id']);
    table.dropColumn('coach_id');
  });
}

