import type { Knex } from 'knex';

/**
 * Migration to create equipment table
 * Equipment is global (not tenant-specific) similar to exercises
 */
export async function up(knex: Knex): Promise<void> {
    // Create equipment availability enum type
    await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE equipment_availability AS ENUM ('common_gym', 'home', 'specialty_gym');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

    // Create equipment table
    await knex.schema.createTable('equipment', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 200).notNullable();
        table.string('type', 100).notNullable();
        table.specificType('availability', 'equipment_availability').notNullable().defaultTo('common_gym');
        table.uuid('category_id').nullable();
        table.jsonb('specifications').nullable();
        table.text('description').nullable();
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
        table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();

        // Indexes
        table.index(['name']);
        table.index(['type']);
        table.index(['availability']);
        table.index(['is_active']);
        table.index(['category_id']);
    });

    // Create equipment_categories table
    await knex.schema.createTable('equipment_categories', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 100).notNullable();
        table.text('description').nullable();
        table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
        table.timestamp('updated_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();

        // Indexes
        table.index(['name']);
    });

    // Add foreign key for category_id after creating equipment_categories
    await knex.schema.alterTable('equipment', (table) => {
        table.foreign('category_id').references('id').inTable('equipment_categories').onDelete('SET NULL');
    });

    // Create triggers for updated_at
    await knex.raw(`
    CREATE TRIGGER equipment_updated_at 
    BEFORE UPDATE ON equipment 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);

    await knex.raw(`
    CREATE TRIGGER equipment_categories_updated_at 
    BEFORE UPDATE ON equipment_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);

    // Insert default equipment data
    await knex('equipment_categories').insert([
        { name: 'Free Weights', description: 'Barbells, dumbbells, and kettlebells' },
        { name: 'Machines', description: 'Cable machines, smith machines, and other resistance machines' },
        { name: 'Cardio', description: 'Treadmills, bikes, rowers, and other cardio equipment' },
        { name: 'Bodyweight', description: 'Pull-up bars, dip stations, and gymnastics equipment' },
        { name: 'Specialty', description: 'Olympic lifting platforms, specialty bars, and competition equipment' },
    ]);

    // Get category IDs for equipment insertion
    const categories = await knex('equipment_categories').select('id', 'name');
    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
    }, {} as Record<string, string>);

    // Insert common equipment
    await knex('equipment').insert([
        // Free Weights
        { name: 'Barbell', type: 'Olympic Bar', availability: 'common_gym', category_id: categoryMap['Free Weights'], description: 'Standard 20kg Olympic barbell' },
        { name: 'Dumbbells', type: 'Adjustable', availability: 'common_gym', category_id: categoryMap['Free Weights'], description: 'Pair of adjustable dumbbells' },
        { name: 'Kettlebells', type: 'Cast Iron', availability: 'common_gym', category_id: categoryMap['Free Weights'], description: 'Various weight kettlebells' },
        { name: 'Weight Plates', type: 'Olympic', availability: 'common_gym', category_id: categoryMap['Free Weights'], description: 'Olympic weight plates' },
        { name: 'EZ Curl Bar', type: 'Specialty Bar', availability: 'common_gym', category_id: categoryMap['Free Weights'], description: 'Curved barbell for arm exercises' },

        // Machines
        { name: 'Cable Machine', type: 'Dual Pulley', availability: 'common_gym', category_id: categoryMap['Machines'], description: 'Dual cable pulley system' },
        { name: 'Leg Press', type: 'Plate Loaded', availability: 'common_gym', category_id: categoryMap['Machines'], description: '45-degree leg press machine' },
        { name: 'Smith Machine', type: 'Guided Barbell', availability: 'common_gym', category_id: categoryMap['Machines'], description: 'Guided barbell machine' },
        { name: 'Lat Pulldown', type: 'Cable', availability: 'common_gym', category_id: categoryMap['Machines'], description: 'Lat pulldown machine' },
        { name: 'Chest Press Machine', type: 'Plate Loaded', availability: 'common_gym', category_id: categoryMap['Machines'], description: 'Seated chest press machine' },

        // Bodyweight
        { name: 'Pull-up Bar', type: 'Fixed', availability: 'common_gym', category_id: categoryMap['Bodyweight'], description: 'Fixed pull-up bar' },
        { name: 'Dip Station', type: 'Parallel Bars', availability: 'common_gym', category_id: categoryMap['Bodyweight'], description: 'Parallel dip bars' },
        { name: 'Gymnastic Rings', type: 'Adjustable', availability: 'specialty_gym', category_id: categoryMap['Bodyweight'], description: 'Wooden gymnastic rings' },

        // Cardio
        { name: 'Treadmill', type: 'Motorized', availability: 'common_gym', category_id: categoryMap['Cardio'], description: 'Commercial treadmill' },
        { name: 'Rowing Machine', type: 'Air Resistance', availability: 'common_gym', category_id: categoryMap['Cardio'], description: 'Concept2 style rower' },
        { name: 'Assault Bike', type: 'Air Resistance', availability: 'common_gym', category_id: categoryMap['Cardio'], description: 'Air resistance bike' },

        // Home equipment
        { name: 'Resistance Bands', type: 'Loop Bands', availability: 'home', category_id: categoryMap['Bodyweight'], description: 'Set of resistance bands' },
        { name: 'Yoga Mat', type: 'Exercise Mat', availability: 'home', category_id: categoryMap['Bodyweight'], description: 'Exercise mat for floor work' },
        { name: 'Jump Rope', type: 'Speed Rope', availability: 'home', category_id: categoryMap['Cardio'], description: 'Speed jump rope' },

        // Specialty
        { name: 'Olympic Platform', type: 'Lifting Platform', availability: 'specialty_gym', category_id: categoryMap['Specialty'], description: 'Olympic lifting platform' },
        { name: 'Competition Barbell', type: 'IWF Spec', availability: 'specialty_gym', category_id: categoryMap['Specialty'], description: 'IWF specification barbell' },
        { name: 'Calibrated Plates', type: 'Competition', availability: 'specialty_gym', category_id: categoryMap['Specialty'], description: 'Calibrated competition plates' },
    ]);
}

export async function down(knex: Knex): Promise<void> {
    // Drop triggers
    await knex.raw('DROP TRIGGER IF EXISTS equipment_updated_at ON equipment');
    await knex.raw('DROP TRIGGER IF EXISTS equipment_categories_updated_at ON equipment_categories');

    // Drop tables
    await knex.schema.dropTableIfExists('equipment');
    await knex.schema.dropTableIfExists('equipment_categories');

    // Drop enum type
    await knex.raw('DROP TYPE IF EXISTS equipment_availability');
}

