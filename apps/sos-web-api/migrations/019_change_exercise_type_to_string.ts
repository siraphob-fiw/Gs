import type { Knex } from 'knex';

/**
 * Migration to change exercise_type column from enum to string.
 * This allows exercise_type to reference exercise_category IDs (UUIDs) instead of fixed enum values.
 */
export async function up(knex: Knex): Promise<void> {
  // Drop the index on exercise_type first
  await knex.schema.alterTable('exercises', (table) => {
    table.dropIndex(['exercise_type']);
  });

  // Drop the CHECK constraint created by Knex enum
  await knex.raw(`
    ALTER TABLE exercises 
    DROP CONSTRAINT IF EXISTS exercises_exercise_type_check
  `);

  // Change the exercise_type column from enum to string (VARCHAR 255)
  // Using raw SQL to alter the column type and convert existing enum values to strings
  await knex.raw(`
    ALTER TABLE exercises 
    ALTER COLUMN exercise_type TYPE VARCHAR(255) 
    USING exercise_type::text
  `);

  // Re-create the index on exercise_type
  await knex.schema.alterTable('exercises', (table) => {
    table.index(['exercise_type']);
  });

  // Drop the enum type if it exists (it was auto-created by Knex)
  await knex.raw(`
    DO $$
    BEGIN
      DROP TYPE IF EXISTS exercises_exercise_type_enum CASCADE;
    EXCEPTION
      WHEN undefined_object THEN NULL;
    END$$;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop the index first
  await knex.schema.alterTable('exercises', (table) => {
    table.dropIndex(['exercise_type']);
  });

  // Recreate the enum type
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercises_exercise_type_enum') THEN
        CREATE TYPE exercises_exercise_type_enum AS ENUM (
          'HORIZONTAL_PUSH', 
          'VERTICAL_PUSH', 
          'HORIZONTAL_PULL', 
          'VERTICAL_PULL', 
          'KNEE_DOMINANT', 
          'HIP_DOMINANT', 
          'WEIGHTLIFTING', 
          'MISC'
        );
      END IF;
    END$$;
  `);

  // Convert back to enum (this may fail if there are values not in the enum)
  // Set any non-enum values to 'MISC' before converting
  await knex.raw(`
    UPDATE exercises 
    SET exercise_type = 'MISC' 
    WHERE exercise_type NOT IN (
      'HORIZONTAL_PUSH', 
      'VERTICAL_PUSH', 
      'HORIZONTAL_PULL', 
      'VERTICAL_PULL', 
      'KNEE_DOMINANT', 
      'HIP_DOMINANT', 
      'WEIGHTLIFTING', 
      'MISC'
    )
  `);

  await knex.raw(`
    ALTER TABLE exercises 
    ALTER COLUMN exercise_type TYPE exercises_exercise_type_enum 
    USING exercise_type::exercises_exercise_type_enum
  `);

  // Re-create the CHECK constraint
  await knex.raw(`
    ALTER TABLE exercises 
    ADD CONSTRAINT exercises_exercise_type_check 
    CHECK (exercise_type IN (
      'HORIZONTAL_PUSH', 
      'VERTICAL_PUSH', 
      'HORIZONTAL_PULL', 
      'VERTICAL_PULL', 
      'KNEE_DOMINANT', 
      'HIP_DOMINANT', 
      'WEIGHTLIFTING', 
      'MISC'
    ))
  `);

  // Re-create the index
  await knex.schema.alterTable('exercises', (table) => {
    table.index(['exercise_type']);
  });
}

