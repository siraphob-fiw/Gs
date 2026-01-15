import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add session_metric column to training_sessions table
  await knex.schema.alterTable('training_sessions', (table) => {
    table
      .jsonb('session_metric')
      .nullable()
      .comment(
        'Session-level metrics grouped by exercise_date (day). Stores RTS stress metrics aggregated by day.',
      );
  });

  // Add index on session_metric for better query performance
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_training_sessions_session_metric ON training_sessions USING GIN (session_metric)',
  );
}

export async function down(knex: Knex): Promise<void> {
  // Drop index first
  await knex.raw(
    'DROP INDEX IF EXISTS idx_training_sessions_session_metric',
  );

  // Remove session_metric column
  await knex.schema.alterTable('training_sessions', (table) => {
    table.dropColumn('session_metric');
  });
}

