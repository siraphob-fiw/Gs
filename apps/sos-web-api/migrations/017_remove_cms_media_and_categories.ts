import type { Knex } from 'knex';

/**
 * Migration to remove media and categories from CMS.
 * Also removes the featured_image_id foreign key from pages table.
 */
export async function up(knex: Knex): Promise<void> {
  // 1. Remove featured_image_id foreign key and column from pages
  await knex.schema.alterTable('pages', (table) => {
    table.dropForeign(['featured_image_id']);
    table.dropColumn('featured_image_id');
  });

  // 2. Drop categories table (must be done before media due to foreign key)
  await knex.schema.dropTableIfExists('categories');

  // 3. Drop media table
  await knex.schema.dropTableIfExists('media');

  // 4. Drop media_type enum
  await knex.raw('DROP TYPE IF EXISTS media_type');
}

export async function down(knex: Knex): Promise<void> {
  // 1. Recreate media_type enum
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO');
      END IF;
    END$$;
  `);

  // 2. Recreate media table
  await knex.schema.createTable('media', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('filename', 255).notNullable();
    table.string('original_filename', 255).notNullable();
    table.string('mime_type', 100).notNullable();
    table.bigInteger('file_size').notNullable().comment('File size in bytes');
    table.text('file_path').notNullable();
    table.text('file_url').notNullable();
    table.specificType('media_type', 'media_type').notNullable();
    table.string('alt_text', 255).nullable();
    table.text('caption').nullable();
    table.uuid('uploaded_by').notNullable().comment('Reference to user who uploaded');
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());

    table.foreign('uploaded_by').references('id').inTable('users').onDelete('CASCADE');
    table.index(['media_type']);
    table.index(['uploaded_by']);
    table.index(['created_at']);
    table.index(['updated_at']);
  });

  // 3. Recreate categories table
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('description').nullable();
    table.uuid('parent_id').nullable().comment('Reference to parent category');
    table.uuid('image_id').nullable().comment('Reference to media');
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());

    table.foreign('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    table.foreign('image_id').references('id').inTable('media').onDelete('SET NULL');
    table.index(['slug']);
    table.index(['parent_id']);
    table.index(['created_at']);
    table.index(['updated_at']);
    table.unique(['slug'], 'unq_category_slug');
  });

  // 4. Re-add featured_image_id to pages
  await knex.schema.alterTable('pages', (table) => {
    table.uuid('featured_image_id').nullable().comment('Reference to media');
    table.foreign('featured_image_id').references('id').inTable('media').onDelete('SET NULL');
  });
}

