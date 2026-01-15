import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('exercises', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    
    // Basic exercise information
    table.string('name', 200).notNullable();
    table.enum('exercise_type', ['HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'KNEE_DOMINANT', 'HIP_DOMINANT', 'WEIGHTLIFTING', 'MISC']).notNullable();
    table.specificType('movement_patterns', 'text[]').notNullable().defaultTo('{}');
    table.specificType('body_part_focus', 'text[]').notNullable().defaultTo('{}');
    table.specificType('discipline_tags', 'text[]').notNullable().defaultTo('{}');
    
    table.enum('experience_level', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']).notNullable().defaultTo('BEGINNER');
    
    // Stress factors
    table.decimal('central_stress_factor', 5, 2).notNullable();
    table.decimal('peripheral_stress_factor', 5, 2).notNullable();
    
    // Exercise selection logic
    table.specificType('injury_contraindications', 'text[]').notNullable().defaultTo('{}');
    table.specificType('alternative_exercise_ids', 'uuid[]').notNullable().defaultTo('{}');
    table.specificType('progression_exercise_ids', 'uuid[]').notNullable().defaultTo('{}');
    table.specificType('regression_exercise_ids', 'uuid[]').notNullable().defaultTo('{}');
    
    // Metadata for selection algorithms
    table.decimal('popularity_score', 5, 2).notNullable().defaultTo(0);
    table.decimal('effectiveness_rating', 5, 2).notNullable().defaultTo(0);
    table.integer('technique_complexity').notNullable().defaultTo(5);
    
    // Status and approval
    table.boolean('is_approved').notNullable().defaultTo(false);
    table.uuid('created_by').notNullable();
    table.uuid('approved_by').nullable();
    table.timestamp('approved_at', { useTz: false }).nullable();
    
    // Timestamps
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['tenant_id']);
    table.index(['exercise_type']);
    table.index(['is_approved']);
    table.index(['created_by']);
    table.index(['popularity_score']);
    table.index(['effectiveness_rating']);
    
    // GIN indexes for array columns
    table.index('movement_patterns', 'idx_exercises_movement_patterns', 'gin');
    table.index('body_part_focus', 'idx_exercises_body_part_focus', 'gin');
    table.index('discipline_tags', 'idx_exercises_discipline_tags', 'gin');
    table.index('alternative_exercise_ids', 'idx_exercises_alternative_ids', 'gin');
    table.index('progression_exercise_ids', 'idx_exercises_progression_ids', 'gin');
    table.index('regression_exercise_ids', 'idx_exercises_regression_ids', 'gin');
  });

  // Create modifier categories table
  await knex.schema.createTable('modifier_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('name', 100).notNullable();
    table.string('description', 500).nullable();
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Indexes
    table.index(['id']);
    table.index(['name']);
    table.index(['tenant_id']);
    table.index(['status']);

    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
  });

  // Create modifiers table
  await knex.schema.createTable('modifiers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('modifier_category_id').notNullable();
    table.string('name', 100).notNullable();
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.decimal('central_stress_factor', 5, 2).notNullable().defaultTo(0);
    table.decimal('peripheral_stress_factor', 5, 2).notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('modifier_category_id').references('id').inTable('modifier_categories').onDelete('RESTRICT');

    // Unique constraints
    table.unique(['name']);
    
    // Indexes
    table.index(['modifier_category_id']);
    table.index(['name']);
    table.index(['status']);
  });

  // Create training blocks table (workout blocks)
  await knex.schema.createTable('training_blocks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('workout_name', 200).notNullable();
    table.string('workout_method', 50).notNullable();
    table.string('workout_type', 50).notNullable();
    table.enum('workout_status', ['ACTIVE', 'UNACTIVE']).notNullable().defaultTo('ACTIVE');
    table.boolean('is_global').notNullable().defaultTo(false);
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.jsonb('summary').nullable().comment('Workout summary JSON');
  });

  // Create training blocks exercises table (exercise sets within a workout)
  await knex.schema.createTable('training_blocks_exercises', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('training_block_id').notNullable();
    table.uuid('exercise_id').notNullable();
    table.integer('order').notNullable();
    table.integer('day').notNullable();
    table.jsonb('sets').nullable().comment('Exercise sets configuration JSON');
    table.jsonb('modifiers').nullable().comment('Applied modifiers JSON');
    table.jsonb('summary').nullable().comment('Exercise summary JSON');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('training_block_id').references('id').inTable('training_blocks').onDelete('CASCADE');
    table.foreign('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
    
    // Indexes
    table.index(['training_block_id']);
    table.index(['exercise_id']);
    table.index(['day']);
    table.index(['order']);
  });

  // Create training sessions table (individual workout sessions)
  await knex.schema.createTable('training_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('session_name', 255).notNullable();
    table.uuid('athlete_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamp('start_date', { useTz: false }).nullable();
    table.timestamp('end_date', { useTz: false }).nullable();
    table.enum('session_status', [
      'PLANNED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'SKIPPED',
      'OVERDUE',
    ]).nullable();
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('athlete_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    // Indexes
    table.index(['athlete_id']);
    table.index(['tenant_id']);
    table.index(['session_status']);
    table.index(['start_date']);
  });

  // Create training sessions exercises table (exercises within a session)
  await knex.schema.createTable('training_sessions_exercises', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('training_session_id').notNullable();
    table.uuid('exercise_id').notNullable();
    table.timestamp('exercise_date', { useTz: false }).notNullable();
    table.integer('order').notNullable();
    table.jsonb('target').notNullable().comment('Target performance data JSON');
    table.jsonb('actual').notNullable().comment('Actual performance data JSON');
    table.jsonb('warmup').nullable().comment('Warmup performance data JSON');
    table.jsonb('metrics').nullable().comment('Performance metrics JSON');
    table.string('notes', 500).nullable();
    table.jsonb('modifiers').nullable().comment('Applied modifiers JSON');
    table.enum('exercise_status', ['IN_PROGRESS', 'COMPLETED', 'OVERDUE']).notNullable().defaultTo('IN_PROGRESS');
    table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
    
    // Foreign keys
    table.foreign('training_session_id').references('id').inTable('training_sessions').onDelete('CASCADE');
    table.foreign('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
    
    // Indexes
    table.index(['training_session_id']);
    table.index(['exercise_id']);
    table.index(['exercise_date']);
    table.index(['order']);
    table.index(['target']);
    table.index(['actual']);
    table.index(['warmup']);
    table.index(['metrics']);
    table.index(['modifiers']);
    table.index(['notes']);
  });

  await knex.raw('ALTER TABLE exercises ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE training_blocks_exercises ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE training_sessions_exercises ENABLE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON exercises
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON training_blocks
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);
  await knex.raw(`
    CREATE POLICY tenant_isolation_policy ON training_sessions
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  `);

  await knex.raw(`
    CREATE POLICY super_admin_policy ON exercises
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);
  await knex.raw(`
    CREATE POLICY super_admin_policy ON training_blocks
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);
  await knex.raw(`
    CREATE POLICY super_admin_policy ON training_sessions
    USING (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND u.role = 'SUPER_ADMIN'
        AND u.status = 'ACTIVE'
      )
    )
  `);

  await knex.raw(`
    CREATE TRIGGER exercises_updated_at 
    BEFORE UPDATE ON exercises 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER modifier_categories_updated_at 
    BEFORE UPDATE ON modifier_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER modifiers_updated_at 
    BEFORE UPDATE ON modifiers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER training_blocks_updated_at 
    BEFORE UPDATE ON training_blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER training_blocks_exercises_updated_at 
    BEFORE UPDATE ON training_blocks_exercises 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER training_sessions_updated_at 
    BEFORE UPDATE ON training_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
  await knex.raw(`
    CREATE TRIGGER training_sessions_exercises_updated_at 
    BEFORE UPDATE ON training_sessions_exercises 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS training_sessions_exercises_updated_at ON training_sessions_exercises');
  await knex.raw('DROP TRIGGER IF EXISTS training_sessions_updated_at ON training_sessions');
  await knex.raw('DROP TRIGGER IF EXISTS training_blocks_exercises_updated_at ON training_blocks_exercises');
  await knex.raw('DROP TRIGGER IF EXISTS training_blocks_updated_at ON training_blocks');
  await knex.raw('DROP TRIGGER IF EXISTS modifiers_updated_at ON modifiers');
  await knex.raw('DROP TRIGGER IF EXISTS modifier_categories_updated_at ON modifier_categories');
  await knex.raw('DROP TRIGGER IF EXISTS exercises_updated_at ON exercises');
  await knex.schema.dropTableIfExists('training_sessions_exercises');
  await knex.schema.dropTableIfExists('training_sessions');
  await knex.schema.dropTableIfExists('training_blocks_exercises');
  await knex.schema.dropTableIfExists('training_blocks');
  await knex.schema.dropTableIfExists('modifiers');
  await knex.schema.dropTableIfExists('modifier_categories');
  await knex.schema.dropTableIfExists('exercises');
}
