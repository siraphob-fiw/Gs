import { Knex } from 'knex';
import { 
  Athlete, 
  AthleteProfile, 
  AthletePreferences,
  TimeConstraint,
  // ProgramDisabilityAccommodation 
} from '@strengthos/shared-types';

export interface AthleteRecord {
  id: string;
  user_id: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;

  // Profile information
  discipline: string;
  experience_level: string;
  gender: string;
  birth_date: Date;
  body_weight: number;
  training_frequency: number;
  goals: string[];
  disability_accommodations?: any[];

  // Preferences
  preferred_training_times: TimeConstraint[];
  max_session_duration: number;
  rest_day_preferences: number[];
  intensity_preference: string;
  volume_preference: string;
  exercise_variety: string;
  auto_adjustments: boolean;
  coach_approval_required: boolean;

  // Relationships
  current_program_id?: string;
  coach_id?: string;
}

export class AthleteModel {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<AthleteRecord | undefined> {
    return this.knex<AthleteRecord>('athletes')
      .where({ id })
      .first();
  }

  async findByUserId(userId: string): Promise<AthleteRecord | undefined> {
    return this.knex<AthleteRecord>('athletes')
      .where({ user_id: userId })
      .first();
  }

  async findByTenant(tenantId: string): Promise<AthleteRecord[]> {
    return this.knex<AthleteRecord>('athletes')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async findByCoach(coachId: string): Promise<AthleteRecord[]> {
    return this.knex<AthleteRecord>('athletes')
      .where({ coach_id: coachId })
      .orderBy('created_at', 'desc');
  }

  async create(athlete: Omit<AthleteRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AthleteRecord> {
    const [created] = await this.knex<AthleteRecord>('athletes')
      .insert(athlete)
      .returning('*');
    return created;
  }

  async update(id: string, updates: Partial<AthleteRecord>): Promise<AthleteRecord | undefined> {
    const [updated] = await this.knex<AthleteRecord>('athletes')
      .where({ id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.knex<AthleteRecord>('athletes')
      .where({ id })
      .del();
    return deleted > 0;
  }

  async findByDiscipline(discipline: string, tenantId: string): Promise<AthleteRecord[]> {
    return this.knex<AthleteRecord>('athletes')
      .where({ discipline, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async findByExperienceLevel(experienceLevel: string, tenantId: string): Promise<AthleteRecord[]> {
    return this.knex<AthleteRecord>('athletes')
      .where({ experience_level: experienceLevel, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  // Convert database record to domain model
  toDomain(record: AthleteRecord): Athlete {
    return {
      id: record.id,
      userId: record.user_id,
      tenantId: record.tenant_id,
      profile: {
        discipline: record.discipline,
        experienceLevel: record.experience_level,
        gender: record.gender,
        birthDate: record.birth_date,
        bodyWeight: record.body_weight,
        availableEquipment: [], // Will be populated from athlete_equipment table
        trainingFrequency: record.training_frequency,
        goals: record.goals,
        disabilityAccommodations: record.disability_accommodations || []
      } as AthleteProfile,
      preferences: {
        preferredTrainingTimes: record.preferred_training_times,
        maxSessionDuration: record.max_session_duration,
        restDayPreferences: record.rest_day_preferences,
        intensityPreference: record.intensity_preference as 'conservative' | 'moderate' | 'aggressive',
        volumePreference: record.volume_preference as 'low' | 'moderate' | 'high',
        exerciseVariety: record.exercise_variety as 'minimal' | 'moderate' | 'high',
        autoAdjustments: record.auto_adjustments,
        coachApprovalRequired: record.coach_approval_required
      } as AthletePreferences,
      currentProgram: record.current_program_id,
      coachId: record.coach_id,
      healthMetrics: [], // Will be populated from health_metrics table
      injuries: [], // Will be populated from injuries table
      competitions: [], // Will be populated from competitions table
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  // Convert domain model to database record
  fromDomain(athlete: Athlete): Omit<AthleteRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: athlete.userId,
      tenant_id: athlete.tenantId,
      discipline: athlete.profile.discipline,
      experience_level: athlete.profile.experienceLevel,
      gender: athlete.profile.gender,
      birth_date: athlete.profile.birthDate,
      body_weight: athlete.profile.bodyWeight,
      training_frequency: athlete.profile.trainingFrequency,
      goals: athlete.profile.goals,
      disability_accommodations: athlete.profile.disabilityAccommodations || [],
      preferred_training_times: athlete.preferences.preferredTrainingTimes,
      max_session_duration: athlete.preferences.maxSessionDuration,
      rest_day_preferences: athlete.preferences.restDayPreferences,
      intensity_preference: athlete.preferences.intensityPreference,
      volume_preference: athlete.preferences.volumePreference,
      exercise_variety: athlete.preferences.exerciseVariety,
      auto_adjustments: athlete.preferences.autoAdjustments,
      coach_approval_required: athlete.preferences.coachApprovalRequired,
      current_program_id: athlete.currentProgram,
      coach_id: athlete.coachId
    };
  }
}