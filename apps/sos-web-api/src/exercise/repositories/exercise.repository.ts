import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ExerciseModel,
  ExerciseRecord,
  getDatabase,
} from '@strengthos/shared-database';
import {
  MovementPattern,
  BodyPart,
  Discipline,
  Database,
  ExerciseListResponse,
  RequestContext,
  UserRole,
  CreateExerciseRequest,
} from '@strengthos/shared-types';
import { ExerciseEntity, ExerciseWithUser } from '../entities/exercise.entity';

export interface ExerciseFilters {
  discipline?: Discipline;
  movementPatterns?: MovementPattern[] | string[];
  bodyParts?: BodyPart[] | BodyPart;
  exerciseType?: string; // Category ID from exercise_category
  excludeInjuryTypes?: string[];
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  maxComplexity?: number;
  minEffectiveness?: number;
  status?: string;
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: 'name' | 'exerciseType' | 'created_at' | 'is_approved';
  sortOrder?: 'asc' | 'desc';
}

export interface ExerciseSelectionCriteria {
  discipline: Discipline;
  movementPattern?: MovementPattern;
  bodyPart?: BodyPart;
  exerciseType: string; // Category ID from exercise_category
  injuryRestrictions: string[];
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  sessionDuration: number; // minutes
  preferences: {
    varietyPreference: 'minimal' | 'moderate' | 'high';
    complexityPreference: 'simple' | 'moderate' | 'complex';
  };
  count: number;
}

@Injectable()
export class ExerciseRepository {
  private exerciseModel: ExerciseModel;
  private db: Database;

  constructor() {
    const db = getDatabase();
    this.exerciseModel = new ExerciseModel(db.knex);
    this.db = db;
  }

  async findById(id: string): Promise<ExerciseWithUser | null> {
    const record = await this.exerciseModel.findById(id);
    return record ? this.mapToEntityWithUser(record) : null;
  }

  async findByIds(ids: string[]): Promise<ExerciseWithUser[]> {
    const records = await this.exerciseModel.findByIds(ids);
    return Promise.all(
      records.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async findAll(): Promise<ExerciseWithUser[]> {
    const records = await this.exerciseModel.findAll();
    return Promise.all(
      records.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async findByDiscipline(discipline: Discipline): Promise<ExerciseWithUser[]> {
    const records = await this.exerciseModel.findByDiscipline(discipline);
    return Promise.all(
      records.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async findByMovementPattern(
    pattern: MovementPattern,
  ): Promise<ExerciseWithUser[]> {
    const records = await this.exerciseModel.findByMovementPattern(pattern);
    return Promise.all(
      records.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async findByBodyPart(bodyPart: BodyPart): Promise<ExerciseWithUser[]> {
    const records = await this.exerciseModel.findByBodyPart(bodyPart);
    return Promise.all(
      records.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async findByAvailableEquipment(
    equipmentIds: string[],
  ): Promise<ExerciseWithUser[]> {
    const records =
      await this.exerciseModel.findByAvailableEquipment(equipmentIds);
    return Promise.all(
      records.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async findExcludingInjuries(
    injuryTypes: string[],
  ): Promise<ExerciseWithUser[]> {
    const records = await this.exerciseModel.findExcludingInjuries(injuryTypes);
    return Promise.all(
      records.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async findAllWithFilters(
    filters: ExerciseFilters,
    userId?: string,
  ): Promise<ExerciseListResponse> {
    const {
      discipline,
      movementPatterns,
      bodyParts,
      exerciseType,
      excludeInjuryTypes,
      experienceLevel,
      maxComplexity,
      minEffectiveness,
      status,
      limit: inputLimit,
      page: inputPage,
      search,
      sortBy,
      sortOrder,
    } = filters;
    const limit = Number(inputLimit) > 0 ? Number(inputLimit) : 10;
    const page = Number(inputPage) > 0 ? Number(inputPage) : 1;
    const offset = (page - 1) * limit;

    // Only check if user is ACTIVE if userId is provided
    if (userId) {
      const userActive = await this.db
        .knex('users')
        .where({ id: userId, status: 'ACTIVE' })
        .first('id');
      if (!userActive) {
        return {
          exercises: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };
      }
    }

    let query = this.db.knex('exercises');

    if (exerciseType) query.where('exercise_type', exerciseType);
    if (movementPatterns)
      query.whereRaw('movement_patterns && ?', [movementPatterns]);
    if (bodyParts) query.whereRaw('body_part_focus && ?', [bodyParts]);
    if (discipline) query.whereRaw('discipline_tags && ?', [discipline]);
    if (excludeInjuryTypes)
      query.whereRaw('NOT (injury_contraindications && ?)', [
        excludeInjuryTypes,
      ]);
    if (experienceLevel) query.where('experience_level', experienceLevel);
    if (maxComplexity) query.where('technique_complexity', '<=', maxComplexity);
    if (minEffectiveness)
      query.where('effectiveness_rating', '>=', minEffectiveness);
    if (status !== undefined)
      query.where('is_approved', status === 'true' ? true : false);
    if (search) query.where('name', 'ilike', `%${search}%`);

    // Get total count efficiently (also supports 0 results)
    const totalResult = await query
      .clone()
      .clearSelect()
      .count('* as count')
      .first();
    const total =
      totalResult && typeof totalResult.count === 'string'
        ? parseInt(totalResult.count, 10)
        : 0;

    const sortColumn = sortBy || 'name';
    const sortDirection = sortOrder || 'desc';
    const sortMap: Record<string, string> = {
      exerciseType: 'exercise_type',
      is_approved: 'is_approved',
      name: 'name',
    };
    const dbSortColumn = sortMap[sortColumn] || sortColumn;

    const exercises = await query
      .clone()
      .select('*')
      .orderBy(dbSortColumn, sortDirection)
      .limit(limit)
      .offset(offset);

    const exercisesWithUser = await Promise.all(
      exercises.map((record) => this.mapToEntityWithUser(record)),
    );

    return {
      exercises: exercisesWithUser,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWithFilters(
    filters: ExerciseFilters,
    userId?: string,
  ): Promise<ExerciseWithUser[]> {
    const {
      discipline,
      movementPatterns,
      bodyParts,
      exerciseType,
      excludeInjuryTypes,
      experienceLevel,
      maxComplexity,
      minEffectiveness,
      status,
      limit = 10,
      page = 1,
      search,
    } = filters;
    const offset = (page - 1) * limit;

    // Quickly check user active status if userId is provided
    if (userId) {
      const userActive = await this.db
        .knex('users')
        .where({ id: userId, status: 'ACTIVE' })
        .first('id');
      if (!userActive) return [];
    }

    // Start with a base Knex query builder (no tenant filter - exercises are global)
    let query = this.db.knex('exercises');

    // Filter conditions mapping
    if (exerciseType) query.where('exercise_type', exerciseType);
    if (movementPatterns)
      query.whereRaw('movement_patterns && ?', [movementPatterns]);
    if (bodyParts) query.whereRaw('body_part_focus && ?', [bodyParts]);
    if (discipline) query.whereRaw('discipline_tags && ?', [discipline]);
    if (excludeInjuryTypes)
      query.whereRaw('NOT (injury_contraindications && ?)', [
        excludeInjuryTypes,
      ]);
    if (experienceLevel) query.where('experience_level', experienceLevel);
    if (maxComplexity) query.where('technique_complexity', '<=', maxComplexity);
    if (minEffectiveness)
      query.where('effectiveness_rating', '>=', minEffectiveness);
    if (status !== undefined && status !== null)
      query.where('is_approved', status === 'true' ? true : false);
    if (search) query.where('name', 'ilike', `%${search}%`);

    // Query pagination and sort
    const exercises = await query
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc')
      .select('*');

    return Promise.all(
      exercises.map((record) => this.mapToEntityWithUser(record)),
    );
  }

  async approvedExerciseById(
    id: string,
    user: RequestContext,
  ): Promise<{ success: boolean; message: string }> {
    const exerciseRecord = await this.exerciseModel.findById(id);

    if (!exerciseRecord) {
      throw new HttpException('Exercise not found', HttpStatus.BAD_REQUEST);
    }

    if (exerciseRecord.is_approved) {
      throw new HttpException(
        'Exercise is already approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dbUser = await this.db.knex('users').where('id', user.userId).first();

    if (!dbUser) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    const isAdmin =
      dbUser.role === UserRole.SUPER_ADMIN ||
      dbUser.role === UserRole.TENANT_ADMIN;
    const isCoach =
      dbUser.role === UserRole.COACH || dbUser.role === UserRole.COACH_ADMIN;

    if (isAdmin || isCoach) {
      await this.exerciseModel.update(id, {
        is_approved: true,
        approved_by: user.userId,
        approved_at: new Date(),
      });
      return { success: true, message: 'Exercise approved successfully' };
    }

    throw new HttpException(
      'User does not have permission to approve exercises',
      HttpStatus.BAD_REQUEST,
    );
  }

  async selectExercises(
    criteria: ExerciseSelectionCriteria,
  ): Promise<ExerciseWithUser[]> {
    const filters: ExerciseFilters = {
      discipline: criteria.discipline,
      exerciseType: criteria.exerciseType,
      excludeInjuryTypes: criteria.injuryRestrictions,
      experienceLevel: criteria.experienceLevel,
    };

    // Add optional filters
    if (criteria.movementPattern) {
      filters.movementPatterns = [criteria.movementPattern];
    }
    if (criteria.bodyPart) {
      filters.bodyParts = [criteria.bodyPart];
    }

    let candidates = await this.findWithFilters(filters);

    // Calculate selection scores for each candidate
    const scoredExercises = candidates.map((exercise) => ({
      exercise,
      score: exercise.calculateSelectionScore(
        criteria.discipline,
        criteria.experienceLevel,
        criteria.sessionDuration,
        criteria.preferences,
      ),
    }));

    // Sort by score (highest first)
    scoredExercises.sort((a, b) => b.score - a.score);

    // Apply variety preference logic
    let selectedExercises: ExerciseWithUser[] = [];

    if (criteria.preferences.varietyPreference === 'high') {
      // For high variety, use weighted random selection from top candidates
      selectedExercises = this.selectWithVariety(
        scoredExercises,
        criteria.count,
      );
    } else {
      // For minimal/moderate variety, take top scoring exercises
      selectedExercises = scoredExercises
        .slice(0, criteria.count)
        .map((item) => item.exercise);
    }

    return selectedExercises;
  }

  private selectWithVariety(
    scoredExercises: { exercise: ExerciseWithUser; score: number }[],
    count: number,
  ): ExerciseWithUser[] {
    const selected: ExerciseWithUser[] = [];
    const candidates = [...scoredExercises];

    // Take top 20% as high-priority candidates
    const highPriorityCount = Math.max(1, Math.floor(candidates.length * 0.2));
    const highPriority = candidates.slice(0, highPriorityCount);
    const remaining = candidates.slice(highPriorityCount);

    for (let i = 0; i < count && candidates.length > 0; i++) {
      let selectedCandidate;

      if (i < count * 0.6 && highPriority.length > 0) {
        // First 60% from high-priority candidates
        const randomIndex = Math.floor(Math.random() * highPriority.length);
        selectedCandidate = highPriority.splice(randomIndex, 1)[0];
      } else if (remaining.length > 0) {
        // Remaining from all candidates with weighted selection
        selectedCandidate = this.weightedRandomSelection(remaining);
        const index = remaining.indexOf(selectedCandidate);
        remaining.splice(index, 1);
      } else if (highPriority.length > 0) {
        // Fallback to high-priority if remaining is empty
        selectedCandidate = highPriority.splice(0, 1)[0];
      } else {
        break; // No more candidates
      }

      selected.push(selectedCandidate.exercise);
    }

    return selected;
  }

  private weightedRandomSelection(
    candidates: { exercise: ExerciseWithUser; score: number }[],
  ): { exercise: ExerciseWithUser; score: number } {
    const totalScore = candidates.reduce(
      (sum, candidate) => sum + candidate.score,
      0,
    );
    let random = Math.random() * totalScore;

    for (const candidate of candidates) {
      random -= candidate.score;
      if (random <= 0) {
        return candidate;
      }
    }

    // Fallback to last candidate
    return candidates[candidates.length - 1];
  }

  async create(exerciseData: Partial<ExerciseEntity>): Promise<ExerciseEntity> {
    // Check the role of the creator to default-approve appropriate roles
    const checkRole = await this.db
      .knex('users')
      .where('id', exerciseData.createdBy!)
      .first();

    let isApproved = false;

    if (
      checkRole?.role === UserRole.SUPER_ADMIN ||
      checkRole?.role === UserRole.TENANT_ADMIN
    ) {
      isApproved = true;
    } else if (typeof exerciseData.is_approved === 'boolean') {
      isApproved = exerciseData.is_approved;
    }

    // Insert directly using knex since exercises are now global (no tenant_id required)
    const [record] = await this.db
      .knex('exercises')
      .insert({
        name: exerciseData.name!,
        exercise_type: exerciseData.exerciseType!,
        experience_level: exerciseData.experienceLevel as
          | 'BEGINNER'
          | 'INTERMEDIATE'
          | 'ADVANCED'
          | 'ELITE'
          | undefined,
        movement_patterns: exerciseData.movementPatterns ?? [],
        body_part_focus: exerciseData.bodyPartFocus ?? [],
        discipline_tags: exerciseData.disciplineTags ?? [],
        central_stress_factor: exerciseData.centralStressFactor ?? 0,
        peripheral_stress_factor: exerciseData.peripheralStressFactor ?? 0,
        injury_contraindications: exerciseData.injuryContraindications ?? [],
        popularity_score: exerciseData.popularityScore ?? 5,
        effectiveness_rating: exerciseData.effectivenessRating ?? 5,
        technique_complexity: exerciseData.techniqueComplexity ?? 5,
        is_approved: isApproved,
        created_by: exerciseData.createdBy!,
      })
      .returning('*');

    return this.mapToEntity(record);
  }

  async bulkCreate(
    exercises: CreateExerciseRequest[],
    userId: string,
  ): Promise<ExerciseEntity[]> {
    const existingRecords = await this.db.knex('exercises').select('name');
    const exNamesSet = new Set(
      existingRecords.map((ex) => ex.name.toLowerCase()),
    );

    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    exercises.forEach((exercise) => {
      const nameLower = exercise.name.toLowerCase();
      const base = {
        name: exercise.name,
        exercise_type: exercise.exerciseType || '',
        experience_level: exercise.experienceLevel
          ? (exercise.experienceLevel as
              | 'BEGINNER'
              | 'INTERMEDIATE'
              | 'ADVANCED'
              | 'ELITE')
          : 'BEGINNER',
        movement_patterns: exercise.movementPatterns
          ? exercise.movementPatterns.map((pattern) => pattern.toLowerCase())
          : [],
        body_part_focus: exercise.bodyPartFocus ?? [],
        discipline_tags: exercise.disciplineTags ?? [],
        central_stress_factor: exercise.centralStressFactor ?? 0,
        peripheral_stress_factor: exercise.peripheralStressFactor ?? 0,
        injury_contraindications: exercise.injuryContraindications ?? [],
        popularity_score: exercise.popularityScore ?? 0,
        effectiveness_rating: exercise.effectivenessRating ?? 0,
        technique_complexity: exercise.techniqueComplexity ?? 0,
      };

      if (!exNamesSet.has(nameLower)) {
        toInsert.push({
          ...base,
          is_approved: true,
          created_by: userId,
        });
      } else {
        toUpdate.push(base);
      }
    });

    // Perform inserts if needed
    let insertedRecords: ExerciseRecord[] = [];
    if (toInsert.length > 0) {
      insertedRecords = await this.db
        .knex('exercises')
        .insert(toInsert)
        .returning('*');
    }

    // Perform mass updates individually for precise name match
    let updatedRecords: ExerciseRecord[] = [];
    if (toUpdate.length > 0) {
      for (const update of toUpdate) {
        const updated = await this.db
          .knex('exercises')
          .update(update)
          .whereRaw('lower(name) = ?', [update.name.toLowerCase()])
          .returning('*');
        if (updated && updated.length > 0) updatedRecords.push(updated[0]);
      }
    }

    const allRecords = [...insertedRecords, ...updatedRecords];

    // Map and return entities
    return allRecords.map((record) => this.mapToEntity(record));
  }

  async update(
    id: string,
    updates: Partial<ExerciseEntity>,
  ): Promise<ExerciseEntity | null> {
    const updateData: Partial<ExerciseRecord> = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.exerciseType) updateData.exercise_type = updates.exerciseType;
    if (updates.experienceLevel !== undefined)
      updateData.experience_level = updates.experienceLevel as
        | 'BEGINNER'
        | 'INTERMEDIATE'
        | 'ADVANCED'
        | 'ELITE'
        | undefined;
    if (updates.movementPatterns)
      updateData.movement_patterns = (updates.movementPatterns || []) as any;
    if (updates.bodyPartFocus)
      updateData.body_part_focus = updates.bodyPartFocus;
    if (updates.disciplineTags)
      updateData.discipline_tags = updates.disciplineTags;
    if (updates.centralStressFactor !== undefined)
      updateData.central_stress_factor = updates.centralStressFactor;
    if (updates.peripheralStressFactor !== undefined)
      updateData.peripheral_stress_factor = updates.peripheralStressFactor;
    if (updates.injuryContraindications)
      updateData.injury_contraindications = updates.injuryContraindications;
    if (updates.popularityScore !== undefined)
      updateData.popularity_score = updates.popularityScore;
    if (updates.effectivenessRating !== undefined)
      updateData.effectiveness_rating = updates.effectivenessRating;
    if (updates.techniqueComplexity !== undefined)
      updateData.technique_complexity = updates.techniqueComplexity;
    if (updates.is_approved !== undefined)
      updateData.is_approved = updates.is_approved;

    updateData.updated_at = new Date();

    const record = await this.exerciseModel.update(id, updateData);
    return record ? this.mapToEntity(record) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db.knex('exercises').where('id', id).del();

    return deleted > 0;
  }

  private mapToEntity(record: ExerciseRecord): ExerciseEntity {
    return new ExerciseEntity({
      id: record.id,
      name: record.name,
      exerciseType: record.exercise_type,
      experienceLevel: record.experience_level,
      movementPatterns: record.movement_patterns,
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
      approvedAt: record.approved_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  private async mapToEntityWithUser(
    record: ExerciseRecord,
  ): Promise<ExerciseWithUser> {
    // Fetch user info for createdBy and approvedBy
    let createdByName = '';
    let approvedByName = '';

    if (record.created_by) {
      const createdByUser = await this.db
        .knex('users')
        .where('id', record.created_by)
        .first();
      if (createdByUser) {
        createdByName =
          `${createdByUser.first_name || ''} ${createdByUser.last_name || ''}`.trim();
      }
    }

    if (record.approved_by) {
      const approvedByUser = await this.db
        .knex('users')
        .where('id', record.approved_by)
        .first();
      if (approvedByUser) {
        approvedByName =
          `${approvedByUser.first_name || ''} ${approvedByUser.last_name || ''}`.trim();
      }
    }

    return new ExerciseWithUser({
      id: record.id,
      name: record.name,
      exerciseType: record.exercise_type,
      experienceLevel: record.experience_level,
      movementPatterns: record.movement_patterns as string[],
      bodyPartFocus: record.body_part_focus,
      disciplineTags: record.discipline_tags,
      centralStressFactor: record.central_stress_factor,
      peripheralStressFactor: record.peripheral_stress_factor,
      injuryContraindications: record.injury_contraindications,
      popularityScore: record.popularity_score,
      effectivenessRating: record.effectiveness_rating,
      techniqueComplexity: record.technique_complexity,
      is_approved: record.is_approved,
      approvedBy: approvedByName,
      createdBy: createdByName,
      approvedAt: record.approved_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }
}
