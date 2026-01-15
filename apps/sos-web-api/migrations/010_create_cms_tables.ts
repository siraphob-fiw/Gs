import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Create ENUM types if not exist
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_status') THEN
        CREATE TYPE page_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
        CREATE TYPE post_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO');
      END IF;
    END$$;
  `);

  // 2. Create media table
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

    // Foreign keys
    table.foreign('uploaded_by').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['media_type']);
    table.index(['uploaded_by']);
    table.index(['created_at']);
    table.index(['updated_at']);
  });

  // 3. Create categories table
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('description').nullable();
    table.uuid('parent_id').nullable().comment('Reference to parent category');
    table.uuid('image_id').nullable().comment('Reference to media');
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    table.foreign('image_id').references('id').inTable('media').onDelete('SET NULL');

    // Indexes
    table.index(['slug']);
    table.index(['parent_id']);
    table.index(['created_at']);
    table.index(['updated_at']);

    // Unique constraint on slug
    table.unique(['slug'], 'unq_category_slug');
  });

  // 4. Create pages table
  await knex.schema.createTable('pages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('content').notNullable();
    table.text('excerpt').nullable();
    table.specificType('status', 'page_status').notNullable().defaultTo('DRAFT');
    table.uuid('featured_image_id').nullable().comment('Reference to media');
    table.string('meta_title', 255).nullable();
    table.text('meta_description').nullable();
    table.jsonb('meta_keywords').nullable().comment('Array of keywords');
    table.uuid('author_id').notNullable().comment('Reference to user');
    table.jsonb('options').nullable().comment('Page options (e.g. on menu, on footer, etc.)');
    table.timestamp('published_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('author_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('featured_image_id').references('id').inTable('media').onDelete('SET NULL');

    // Indexes
    table.index(['slug']);
    table.index(['status']);
    table.index(['author_id']);
    table.index(['published_at']);
    table.index(['created_at']);
    table.index(['updated_at']);

    // Unique constraint on slug
    table.unique(['slug'], 'unq_page_slug');
  });

  // 5. Create posts table
  await knex.schema.createTable('posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('details').notNullable();
    table.specificType('status', 'post_status').notNullable().defaultTo('DRAFT');
    table.uuid('author_id').notNullable().comment('Reference to user');
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('author_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['created_at']);
    table.index(['updated_at']);
    table.index(['title']);
    table.index(['status']);
    table.index(['author_id']);

    // Unique constraint on title
    table.unique(['title'], 'unq_post_title');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop posts table if exists
  await knex.schema.dropTableIfExists('posts');
  await knex.schema.dropTableIfExists('pages');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('media');

  // Drop custom types only if exists
  await knex.raw('DROP TYPE IF EXISTS post_status');
  await knex.raw('DROP TYPE IF EXISTS page_status');
  await knex.raw('DROP TYPE IF EXISTS media_type');
}

