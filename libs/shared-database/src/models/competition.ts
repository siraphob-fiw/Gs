import { Knex } from 'knex';
import { 
  // ProgramCompetition,
  // CompetitionPlan,
  AttemptRecommendation,
  CompetitionType,
  AttemptType,
  Competition
} from '@strengthos/shared-types';

// Database record interfaces
export interface CompetitionRecord {
  id: string;
  athlete_id: string;
  tenant_id: string;
  name: string;
  date: Date;
  type: CompetitionType;
  location: string;
  entry_fee?: number;
  registration_deadline?: Date;
  is_target: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompetitionPlanRecord {
  id: string;
  competition_id: string;
  peaking_strategy: {
    weeks: number;
    intensityProgression: number[];
    volumeReduction: number[];
    deloadWeeks: number[];
  };
  attempt_selection: {
    opener: number;
    second: number;
    third: number;
    strategy: 'conservative' | 'moderate' | 'aggressive';
  };
  competition_day_protocol: {
    warmupProtocol: {
      sets: Array<{
        weight: number;
        reps: number;
        restTime: number;
      }>;
    };
    timingStrategy: {
      arrivalTime: string;
      warmupStart: string;
      attemptTiming: number;
    };
    mentalPreparation: {
      visualizationCues: string[];
      focusPoints: string[];
      contingencyPlans: string[];
    };
  };
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface AttemptRecommendationRecord {
  id: string;
  competition_plan_id: string;
  lift: AttemptType;
  current_max: number;
  opener_percentage: number;
  attempt_number: number;
  rationale: string;
  strategy: 'conservative' | 'moderate' | 'aggressive';
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompetitionResultRecord {
  id: string;
  competition_id: string;
  athlete_id: string;
  lift: AttemptType;
  attempt_weight: number;
  successful: boolean;
  actual_weight?: number;
  notes?: string;
  attempt_number?: number;
  total_score?: number;
  wilks_score?: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export class CompetitionModel {
  constructor(private knex: Knex) {}

  // Competition CRUD operations
  async findById(id: string): Promise<CompetitionRecord | undefined> {
    return this.knex<CompetitionRecord>('competitions')
      .where({ id })
      .first();
  }

  async findByAthlete(athleteId: string, tenantId: string): Promise<CompetitionRecord[]> {
    return this.knex<CompetitionRecord>('competitions')
      .where({ athlete_id: athleteId, tenant_id: tenantId })
      .orderBy('date', 'asc');
  }

  async findUpcoming(athleteId: string, tenantId: string, daysAhead: number = 365): Promise<CompetitionRecord[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.knex<CompetitionRecord>('competitions')
      .where({ athlete_id: athleteId, tenant_id: tenantId })
      .whereBetween('date', [new Date(), futureDate])
      .orderBy('date', 'asc');
  }

  async findByDateRange(athleteId: string, tenantId: string, startDate: Date, endDate: Date): Promise<CompetitionRecord[]> {
    return this.knex<CompetitionRecord>('competitions')
      .where({ athlete_id: athleteId, tenant_id: tenantId })
      .whereBetween('date', [startDate, endDate])
      .orderBy('date', 'asc');
  }

  async findByType(athleteId: string, tenantId: string, type: CompetitionType): Promise<CompetitionRecord[]> {
    return this.knex<CompetitionRecord>('competitions')
      .where({ athlete_id: athleteId, tenant_id: tenantId, type })
      .orderBy('date', 'asc');
  }

  async findTargetCompetition(athleteId: string, tenantId: string): Promise<CompetitionRecord | undefined> {
    return this.knex<CompetitionRecord>('competitions')
      .where({ athlete_id: athleteId, tenant_id: tenantId, is_target: true })
      .first();
  }

  async create(competition: Omit<CompetitionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<CompetitionRecord> {
    const [created] = await this.knex<CompetitionRecord>('competitions')
      .insert(competition)
      .returning('*');
    return created;
  }

  async update(id: string, tenantId: string, updates: Partial<CompetitionRecord>): Promise<CompetitionRecord | undefined> {
    const [updated] = await this.knex<CompetitionRecord>('competitions')
      .where({ id, tenant_id: tenantId })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return updated;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const deleted = await this.knex<CompetitionRecord>('competitions')
      .where({ id, tenant_id: tenantId })
      .del();
    return deleted > 0;
  }

  async unsetOtherTargetCompetitions(athleteId: string, tenantId: string, excludeId?: string): Promise<void> {
    const query = this.knex<CompetitionRecord>('competitions')
      .where({ athlete_id: athleteId, tenant_id: tenantId, is_target: true })
      .update({ is_target: false, updated_at: new Date() });

    if (excludeId) {
      query.whereNot({ id: excludeId });
    }

    await query;
  }

  // Competition Plan operations
  async createPlan(plan: Omit<CompetitionPlanRecord, 'id' | 'created_at' | 'updated_at'>): Promise<CompetitionPlanRecord> {
    const [created] = await this.knex<CompetitionPlanRecord>('competition_plans')
      .insert(plan)
      .returning('*');
    return created;
  }

  async findPlansByCompetition(competitionId: string): Promise<CompetitionPlanRecord[]> {
    return this.knex<CompetitionPlanRecord>('competition_plans')
      .where({ competition_id: competitionId })
      .orderBy('created_at', 'desc');
  }

  // Attempt Recommendation operations
  async createAttemptRecommendation(recommendation: Omit<AttemptRecommendationRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AttemptRecommendationRecord> {
    const [created] = await this.knex<AttemptRecommendationRecord>('attempt_recommendations')
      .insert(recommendation)
      .returning('*');
    return created;
  }

  async findRecommendationsByPlan(planId: string): Promise<AttemptRecommendationRecord[]> {
    return this.knex<AttemptRecommendationRecord>('attempt_recommendations')
      .where({ competition_plan_id: planId })
      .orderBy(['lift', 'attempt_number']);
  }

  // Competition Result operations
  async recordResult(result: Omit<CompetitionResultRecord, 'id' | 'created_at' | 'updated_at'>): Promise<CompetitionResultRecord> {
    const [created] = await this.knex<CompetitionResultRecord>('competition_results')
      .insert(result)
      .returning('*');
    return created;
  }

  async findResultsByCompetition(competitionId: string): Promise<CompetitionResultRecord[]> {
    return this.knex<CompetitionResultRecord>('competition_results')
      .where({ competition_id: competitionId })
      .orderBy(['lift', 'attempt_number']);
  }

  planToDomain(record: CompetitionPlanRecord): any {
    return {
      competitionId: record.competition_id,
      athleteId: '', // TODO: Get from competition record
      peakingBlocks: [], // TODO: Populate from training blocks
      taperProtocol: {
        duration: 2,
        volumeReduction: 20,
        intensityMaintenance: 85,
        frequencyReduction: 15,
        recoveryEmphasis: ['sleep', 'nutrition']
      }, // TODO: Map from peaking_strategy
      attemptStrategy: {
        openers: [],
        seconds: [],
        thirds: [],
        strategy: 'moderate' as const
      }, // TODO: Map from attempt_selection
      timeline: {
        totalWeeks: 0,
        phases: [],
        milestones: [],
        criticalDates: []
      } // TODO: Create timeline from competition_day_protocol
    };
  }

  planFromDomain(plan: any, createdBy: string): Omit<CompetitionPlanRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      competition_id: plan.competitionId,
      peaking_strategy: {
        weeks: plan.taperProtocol.duration,
        intensityProgression: [85, 90, 95],
        volumeReduction: [plan.taperProtocol.volumeReduction],
        deloadWeeks: []
      },
      attempt_selection: {
        opener: 85,
        second: 100,
        third: 105,
        strategy: 'moderate'
      },
      competition_day_protocol: {
        warmupProtocol: {
          sets: []
        },
        timingStrategy: {
          arrivalTime: '2 hours before',
          warmupStart: '1 hour before',
          attemptTiming: 15
        },
        mentalPreparation: {
          visualizationCues: [],
          focusPoints: [],
          contingencyPlans: []
        }
      },
      created_by: createdBy
    };
  }

  recommendationToDomain(record: AttemptRecommendationRecord): any {
    return {
      exercise: record.lift, // Map lift to exercise
      weight: record.current_max * (record.opener_percentage / 100),
      percentage: record.opener_percentage,
      confidence: 85, // TODO: Add confidence field to database
      reasoning: record.rationale
    };
  }

  recommendationFromDomain(recommendation: AttemptRecommendation, competitionPlanId: string, attemptNumber: number, createdBy: string): Omit<AttemptRecommendationRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      competition_plan_id: competitionPlanId,
      lift: recommendation.exercise as AttemptType,
      current_max: recommendation.weight / (recommendation.percentage / 100),
      opener_percentage: recommendation.percentage,
      attempt_number: attemptNumber,
      rationale: recommendation.reasoning,
      strategy: 'moderate', // TODO: Derive from recommendation
      created_by: createdBy
    };
  }
}