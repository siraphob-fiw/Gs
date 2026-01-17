import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
    ALTER TYPE gender_type RENAME TO gender_type_old;
    CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE');
    ALTER TABLE users ALTER COLUMN gender TYPE gender_type USING (
      CASE
        WHEN gender::text IN ('PREFER_NOT_TO_SAY', 'NON_BINARY') THEN NULL
        ELSE gender::text::gender_type
      END
    );
    DROP TYPE gender_type_old;
  `);

    // Add need_equipment column to exercises table
    await knex.schema.alterTable('exercises', (table) => {
        table.specificType('need_equipment', 'uuid[]').notNullable().defaultTo('{}');
    });

    // Add index for equipment lookups
    await knex.raw(`
    CREATE INDEX idx_exercises_need_equipment ON exercises USING GIN (need_equipment);
  `);

    // Add available_equipment column to tenants table
    await knex.schema.alterTable('tenants', (table) => {
        table.specificType('available_equipment', 'uuid[]').notNullable().defaultTo('{}');
    });

    // Add index for equipment lookups on tenants
    await knex.raw(`
    CREATE INDEX idx_tenants_available_equipment ON tenants USING GIN (available_equipment);
  `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
    ALTER TYPE gender_type RENAME TO gender_type_new;
    CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');
    ALTER TABLE users ALTER COLUMN gender TYPE gender_type USING gender::text::gender_type;
    DROP TYPE gender_type_new;
  `);

    // Remove index from exercises
    await knex.raw('DROP INDEX IF EXISTS idx_exercises_need_equipment');

    // Remove need_equipment column from exercises
    await knex.schema.alterTable('exercises', (table) => {
        table.dropColumn('need_equipment');
    });

    // Remove index from tenants
    await knex.raw('DROP INDEX IF EXISTS idx_tenants_available_equipment');

    // Remove available_equipment column from tenants
    await knex.schema.alterTable('tenants', (table) => {
        table.dropColumn('available_equipment');
    });
}
