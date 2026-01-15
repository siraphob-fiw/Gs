import type { Knex } from 'knex';

/**
 * Migration to add cluster-based stress modifier fields for Myo-Reps and similar training methods.
 * 
 * Myo-reps formula:
 *   CS_Myo = Base_CS × (cs_base_multiplier + cs_cluster_increment × clusters)
 *   PS_Myo = Base_PS × (ps_base_multiplier + ps_cluster_increment × clusters)
 * 
 * Default values for Myo-reps:
 *   - cs_base_multiplier: 1.10
 *   - cs_cluster_increment: 0.02
 *   - ps_base_multiplier: 1.25
 *   - ps_cluster_increment: 0.05
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('modifiers', (table) => {
    // Base multiplier for Central Stress (applied before cluster calculation)
    // For Myo-reps: 1.10 (10% base increase)
    table.decimal('cs_base_multiplier', 5, 3).nullable().defaultTo(null);
    
    // Per-cluster increment for Central Stress
    // For Myo-reps: 0.02 (2% per cluster)
    table.decimal('cs_cluster_increment', 5, 4).nullable().defaultTo(null);
    
    // Base multiplier for Peripheral Stress (applied before cluster calculation)
    // For Myo-reps: 1.25 (25% base increase)
    table.decimal('ps_base_multiplier', 5, 3).nullable().defaultTo(null);
    
    // Per-cluster increment for Peripheral Stress
    // For Myo-reps: 0.05 (5% per cluster)
    table.decimal('ps_cluster_increment', 5, 4).nullable().defaultTo(null);
    
    // Flag to indicate if this modifier uses cluster-based calculation
    table.boolean('uses_cluster_calculation').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('modifiers', (table) => {
    table.dropColumn('cs_base_multiplier');
    table.dropColumn('cs_cluster_increment');
    table.dropColumn('ps_base_multiplier');
    table.dropColumn('ps_cluster_increment');
    table.dropColumn('uses_cluster_calculation');
  });
}

