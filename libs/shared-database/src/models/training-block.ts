import { Knex } from 'knex';

export enum WorkoutMethod {
  JIM_WENDLER = 'JIM_WENDLER',
  WESTSIDE_CONJUGATE = 'WESTSIDE_CONJUGATE',
}

export enum WorkoutType {
  CUTTING = 'CUTTING',
  HYPERTROPHY = 'HYPERTROPHY',
}

export enum WorkoutStatus {
  ACTIVE = 'ACTIVE',
  UNACTIVE = 'UNACTIVE',
}

// Database record interfaces
export interface TrainingBlockRecord {
  id: string;
  workout_name: string;
  workout_method: WorkoutMethod;
  workout_type: WorkoutType;
  workout_status: WorkoutStatus;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
  is_global: boolean;
  is_free: boolean;
  created_by: string;
  updated_by: string;
  summary: Record<string, any>;
}

export interface TrainingBlockExerciseRecord {
  id: string;
  training_block_id: string;
  exercise_id: string;
  day: number;
  sets: {
    reps: number;
    rpe: number;
  }[];
  modifiers: string[];
  order: number;
  created_at: Date;
  updated_at: Date;
}
export class TrainingBlockModel {
  constructor(private knex: Knex) {}

  // Training Block CRUD operations
  async findById(id: string): Promise<TrainingBlockRecord | undefined> {
    return this.knex<TrainingBlockRecord>('training_blocks')
      .where({ id })
      .first();
  }

  async findByMethod(method: WorkoutMethod, tenantId: string): Promise<TrainingBlockRecord[]> {
    return this.knex<TrainingBlockRecord>('training_blocks')
      .where({ workout_method: method, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async create(block: Omit<TrainingBlockRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingBlockRecord> {
    const [created] = await this.knex<TrainingBlockRecord>('training_blocks')
      .insert(block)
      .returning('*');
    return created;
  }

  async update(id: string, tenantId: string, updates: Partial<TrainingBlockRecord>): Promise<TrainingBlockRecord | undefined> {
    const [updated] = await this.knex<TrainingBlockRecord>('training_blocks')
      .where({ id, tenant_id: tenantId })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return updated;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const deleted = await this.knex<TrainingBlockRecord>('training_blocks')
      .where({ id, tenant_id: tenantId })
      .del();
    return deleted > 0;
  }
}