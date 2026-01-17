import { ExerciseType, MovementPattern, BodyPart, Discipline } from './enums';

// Exercise-related types
export interface Exercise {
  id: string;
  name: string;
  exerciseType: string;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  movementPatterns: MovementPattern[] | string[];
  bodyPartFocus: BodyPart[];
  disciplineTags: Discipline[];
  centralStressFactor: number;
  peripheralStressFactor: number;
  injuryContraindications: string[];
  popularityScore: number;
  effectivenessRating: number;
  techniqueComplexity: number;
  approvedBy: string;
  approvedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  is_approved: boolean;
  tenantId: string; // Tenant isolation
  needEquipment: string[];
}

export interface ExerciseWithUser {
  id: string;
  name: string;
  exerciseType: string;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  movementPatterns: MovementPattern[] | string[];
  bodyPartFocus: BodyPart[];
  disciplineTags: Discipline[];
  centralStressFactor: number;
  peripheralStressFactor: number;
  injuryContraindications: string[];
  popularityScore: number;
  effectivenessRating: number;
  techniqueComplexity: number;
  approvedBy: string;
  approvedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  is_approved: boolean;
}

export interface ExerciseFilters {
  exerciseType?: string; // Category ID from exercise_category
  movementPatterns?: MovementPattern[] | string[];
  bodyParts?: BodyPart[] | BodyPart;
  discipline?: Discipline[];
  excludeInjuryTypes?: string[];
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  maxComplexity?: number;
  minEffectiveness?: number;
  status?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'exerciseType' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  tenantId?: string;
}

export interface ExerciseListResponse {
  exercises: ExerciseWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateExerciseRequest {
  name: string;
  exerciseType: string; // Category ID from exercise_category
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  movementPatterns: MovementPattern[] | string[];
  bodyPartFocus: BodyPart[];
  disciplineTags: Discipline[];
  centralStressFactor: number;
  peripheralStressFactor: number;
  injuryContraindications?: string[];
  popularityScore?: number;
  effectivenessRating?: number;
  techniqueComplexity?: number;
  needEquipment?: string[];
}

export interface UpdateExerciseRequest {
  id: string;
  name?: string;
  exerciseType?: string; // Category ID from exercise_category
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  movementPatterns?: MovementPattern[] | string[];
  bodyPartFocus?: BodyPart[];
  disciplineTags?: Discipline[];
  centralStressFactor?: number;
  peripheralStressFactor?: number;
  injuryContraindications?: string[];
  popularityScore?: number;
  effectivenessRating?: number;
  techniqueComplexity?: number;
  is_approved?: boolean;
}

// Exercise variations and progressions
export interface ExerciseVariation {
  id: string;
  baseExerciseId: string;
  name: string;
  description: string;
  difficulty: 'easier' | 'same' | 'harder';
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseProgression {
  id: string;
  exerciseId: string;
  progressionLevel: number;
  name: string;
  description: string;
  equipmentRequired?: string[];
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Exercise categories and lift categories
export interface LiftCategory {
  id: string;
  discipline: string;
  methodName: string;
  coreLifts: string[];
  accessoryLifts: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

// Exercise search and recommendations
export interface ExerciseSearchRequest {
  query: string;
  filters?: ExerciseFilters;
  limit?: number;
}

export interface ExerciseRecommendation {
  exercise: Exercise;
  reason: string;
  confidence: number;
  alternatives: Exercise[];
}

export interface ExerciseRecommendationRequest {
  userId: string;
  goals: string[];
  experienceLevel: string;
  availableEquipment: string[];
  preferences: {
    exerciseTypes: string[]; // Category IDs from exercise_category
    movementPatterns: MovementPattern[];
    bodyParts: BodyPart[];
  };
  limit?: number;
} 