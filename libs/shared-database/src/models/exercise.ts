import { Knex } from 'knex';
import {
  Exercise,
  MovementPattern,
  BodyPart,
  Discipline,
  ExerciseVariation,
  ExerciseProgression
} from '@strengthos/shared-types';

export interface ExerciseRecord {
  id: string;
  name: string;
  exercise_type: string;
  experience_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  movement_patterns: MovementPattern[] | string[];
  body_part_focus: BodyPart[];
  discipline_tags: Discipline[];
  central_stress_factor: number;
  peripheral_stress_factor: number;
  created_at: Date;
  updated_at: Date;
  injury_contraindications: string[];
  popularity_score: number;
  effectiveness_rating: number;
  technique_complexity: number;
  is_approved: boolean;
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  tenant_id: string; // Tenant isolation
  need_equipment: string[]; // Array of equipment IDs required for this exercise
}

export interface ExerciseVariationRecord {
  id: string;
  base_exercise_id: string;
  name: string;
  description: string;
  difficulty: 'easier' | 'same' | 'harder';
  instructions: string[];
  video_url?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ExerciseProgressionRecord {
  id: string;
  exercise_id: string;
  progression_level: number;
  name: string;
  description: string;
  instructions: string[];
  video_url?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ExerciseRestrictionRecord {
  id: string;
  exercise_id: string;
  injury_type: string;
  body_part: BodyPart;
  restriction_type: 'EXCLUDE' | 'MODIFY' | 'LIMIT_LOAD' | 'LIMIT_ROM';
  restriction_parameters?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class ExerciseModel {
  constructor(private knex: Knex) { }

  async findById(id: string, tenantId?: string): Promise<ExerciseRecord | undefined> {
    const query = this.knex<ExerciseRecord>('exercises').where({ id });

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.first();
  }

  async findByIds(ids: string[], tenantId?: string): Promise<ExerciseRecord[]> {
    const query = this.knex<ExerciseRecord>('exercises').whereIn('id', ids);

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query;
  }

  async findAll(tenantId?: string): Promise<ExerciseRecord[]> {
    const query = this.knex<ExerciseRecord>('exercises')

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.orderBy('name');
  }

  async findByDiscipline(discipline: Discipline, tenantId?: string): Promise<ExerciseRecord[]> {
    const query = this.knex<ExerciseRecord>('exercises')
      .where({ is_approved: true })
      .whereRaw('discipline_tags && ?', [[discipline]]);

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.orderBy('popularity_score', 'desc');
  }

  async findByMovementPattern(pattern: MovementPattern, tenantId?: string): Promise<ExerciseRecord[]> {
    const query = this.knex<ExerciseRecord>('exercises')
      .where({ is_approved: true })
      .whereRaw('movement_patterns && ?', [[pattern]]);

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.orderBy('effectiveness_rating', 'desc');
  }

  async findByBodyPart(bodyPart: BodyPart, tenantId?: string): Promise<ExerciseRecord[]> {
    const query = this.knex<ExerciseRecord>('exercises')
      .where({ is_approved: true })
      .whereRaw('body_part_focus && ?', [[bodyPart]]);

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.orderBy('effectiveness_rating', 'desc');
  }

  async findByEquipment(equipmentId: string, tenantId?: string): Promise<ExerciseRecord[]> {
    const query = this.knex<ExerciseRecord>('exercises')
      .where({ is_approved: true })
      .whereRaw('need_equipment && ?', [[equipmentId]]);

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.orderBy('popularity_score', 'desc');
  }

  async findByAvailableEquipment(equipmentIds: string[], tenantId?: string): Promise<ExerciseRecord[]> {
    const query = this.knex<ExerciseRecord>('exercises')
      .where({ is_approved: true })
      .whereRaw('need_equipment <@ ?::uuid[]', [equipmentIds]);

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.orderBy('popularity_score', 'desc');
  }

  async findExcludingInjuries(injuryTypes: string[], tenantId?: string): Promise<ExerciseRecord[]> {
    const restrictedExerciseIds = await this.knex<ExerciseRestrictionRecord>('exercise_restrictions')
      .whereIn('injury_type', injuryTypes)
      .where('restriction_type', 'EXCLUDE')
      .pluck('exercise_id');

    const query = this.knex<ExerciseRecord>('exercises')
      .where({ is_approved: true })
      .whereNotIn('id', restrictedExerciseIds);

    if (tenantId) {
      query.where({ tenant_id: tenantId });
    }

    return query.orderBy('effectiveness_rating', 'desc');
  }

  async create(exercise: Omit<ExerciseRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ExerciseRecord> {
    const [created] = await this.knex<ExerciseRecord>('exercises')
      .insert(exercise)
      .returning('*');
    return created;
  }

  async update(id: string, updates: Partial<ExerciseRecord>): Promise<ExerciseRecord | undefined> {
    const [updated] = await this.knex<ExerciseRecord>('exercises')
      .where({ id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.knex<ExerciseRecord>('exercises')
      .where({ id })
      .del();
    return deleted > 0;
  }

  async approve(id: string, approvedBy: string): Promise<ExerciseRecord | undefined> {
    return this.update(id, {
      is_approved: true,
      approved_by: approvedBy,
      approved_at: new Date()
    });
  }

  async updatePopularityScore(id: string, score: number): Promise<ExerciseRecord | undefined> {
    return this.update(id, { popularity_score: score });
  }

  async updateEffectivenessRating(id: string, rating: number): Promise<ExerciseRecord | undefined> {
    return this.update(id, { effectiveness_rating: rating });
  }

  // Exercise Variations
  async findVariations(exerciseId: string): Promise<ExerciseVariationRecord[]> {
    return this.knex<ExerciseVariationRecord>('exercise_variations')
      .where({ base_exercise_id: exerciseId })
      .orderBy('difficulty');
  }

  async createVariation(variation: Omit<ExerciseVariationRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ExerciseVariationRecord> {
    const [created] = await this.knex<ExerciseVariationRecord>('exercise_variations')
      .insert(variation)
      .returning('*');
    return created;
  }

  // Exercise Progressions
  async findProgressionLevels(exerciseId: string): Promise<ExerciseProgressionRecord[]> {
    return this.knex<ExerciseProgressionRecord>('exercise_progressions')
      .where({ exercise_id: exerciseId })
      .orderBy('progression_level');
  }

  async createProgression(progression: Omit<ExerciseProgressionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ExerciseProgressionRecord> {
    const [created] = await this.knex<ExerciseProgressionRecord>('exercise_progressions')
      .insert(progression)
      .returning('*');
    return created;
  }

  // Exercise Restrictions
  async findRestrictions(exerciseId: string): Promise<ExerciseRestrictionRecord[]> {
    return this.knex<ExerciseRestrictionRecord>('exercise_restrictions')
      .where({ exercise_id: exerciseId });
  }

  async createRestriction(restriction: Omit<ExerciseRestrictionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ExerciseRestrictionRecord> {
    const [created] = await this.knex<ExerciseRestrictionRecord>('exercise_restrictions')
      .insert(restriction)
      .returning('*');
    return created;
  }

  async findRestrictionsForInjury(injuryType: string, bodyPart: BodyPart): Promise<ExerciseRestrictionRecord[]> {
    return this.knex<ExerciseRestrictionRecord>('exercise_restrictions')
      .where({ injury_type: injuryType, body_part: bodyPart });
  }

  // Convert database record to domain model
  toDomain(record: ExerciseRecord): Exercise {
    return {
      id: record.id,
      name: record.name,
      exerciseType: record.exercise_type,
      experienceLevel: record.experience_level,
      movementPatterns: record.movement_patterns as MovementPattern[] | string[],
      bodyPartFocus: record.body_part_focus,
      disciplineTags: record.discipline_tags,
      centralStressFactor: record.central_stress_factor,
      peripheralStressFactor: record.peripheral_stress_factor,
      injuryContraindications: record.injury_contraindications,
      popularityScore: record.popularity_score,
      effectivenessRating: record.effectiveness_rating,
      techniqueComplexity: record.technique_complexity,
      is_approved: record.is_approved,
      createdBy: record.created_by,
      approvedBy: record.approved_by || '',
      approvedAt: record.approved_at || new Date(),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      tenantId: record.tenant_id,
      needEquipment: record.need_equipment
    };
  }

  // Convert domain model to database record
  fromDomain(exercise: Exercise): Omit<ExerciseRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: exercise.name,
      exercise_type: exercise.exerciseType,
      experience_level: exercise.experienceLevel,
      movement_patterns: exercise.movementPatterns,
      body_part_focus: exercise.bodyPartFocus,
      discipline_tags: exercise.disciplineTags,
      central_stress_factor: exercise.centralStressFactor,
      peripheral_stress_factor: exercise.peripheralStressFactor,
      injury_contraindications: exercise.injuryContraindications,
      popularity_score: exercise.popularityScore,
      effectiveness_rating: exercise.effectivenessRating,
      technique_complexity: exercise.techniqueComplexity,
      is_approved: exercise.is_approved,
      created_by: exercise.createdBy,
      approved_by: exercise.approvedBy,
      approved_at: exercise.approvedAt,
      tenant_id: exercise.tenantId,
      need_equipment: exercise.needEquipment
    };
  }
}

export class ExerciseWithUserModel {
  constructor(private knex: Knex) { }

  async findById(id: string): Promise<ExerciseWithUserModel | undefined> {
    return this.knex('exercises')
      .where('id', id)
      .first();
  }
}