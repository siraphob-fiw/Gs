import { RelationshipStatus } from '@strengthos/shared-types';

export enum WorkoutMethod {
  JIM_WENDLER = 'JIM_WENDLER',
  WESTSIDE_CONJUGATE = 'WESTSIDE_CONJUGATE',
}

export enum WorkoutType {
  CUTTING = 'CUTTING',
  HYPERTROPHY = 'HYPERTROPHY',
}

export enum SessionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
  SKIPPED = 'SKIPPED',
}

export interface TrainingBlock {
  id: string;
  workout_name: string;
  workout_method: WorkoutMethod;
  workout_type: WorkoutType;
  workout_week_number: number;
  workout_status: WorkoutStatus;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface TrainingBlockExercise {
  id: string;
  training_block_id: string;
  exercise_id: string;
  order: number;
  target: {
    sets: number;
    weight: number;
    reps: number;
    rpe: number;
  }[];
  actual: {
    sets: number;
    weight: number;
    reps: number;
    rpe: number;
    central_stress: number;
    peripheral_stress: number;
    total_stress: number;
  }[];
  metrics?: {
    e1rm: number;
    nl: number;
    tonnage: number;
    total_stress: number;
    peripheral_stress: number;
    central_stress: number;
  };
  notes?: string;
  created_at: Date;
  updated_at: Date;
  exercise_date: Date;
}

export interface TrainingBlockWithExercises extends TrainingBlock {
  exercises: TrainingBlockExercise[];
}

export enum WorkoutStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export interface TrainingSessionBuilder {
  session_name: string;
  athlete_id: string;
  coach_id: string;
  date: {
    start_date: string;
    end_date: string;
  }[];
  exercises: {
    exercise_id: string;
    exercise_name?: string;
    order: number;
    day: number;
    target: {
      sets: number;
      weight: number;
      reps: number;
      rpe: number;
    }[];
    actual: {
      sets: number;
      weight: number;
      reps: number;
      rpe: number;
      central_stress: number;
      peripheral_stress: number;
      total_stress: number;
    }[];
    modifiers: string[];
    metrics: {
      e1rm: number;
      nl: number;
      tonnage: number;
      total_stress: number;
      peripheral_stress: number;
      central_stress: number;
    };
    notes: string;
  }[];
}

export interface TrainingBlockBuilder {
  isGlobal?: boolean;
  is_free?: boolean;
  workout_name: string;
  workout_method: WorkoutMethod | '';
  workout_type: WorkoutType | '';
  exercises: {
    exerciseId: string;
    exerciseName?: string;
    order: number;
    day: number;
    sets: {
      reps: number;
      rpe: number;
    }[];
    modifiers: string[];
    summary: {
      nl: number;
      totalStress: number;
      centralStress: number;
      peripheralStress: number;
    };
  }[];
  summary: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
    csBalance: number;
    patterns: PatternSummary[];
  };
}

export interface PatternSummary {
  type: string;
  nl: number;
  totalStress: number;
  centralStress: number;
  peripheralStress: number;
  csBalance: number;
}

export interface CoachTeamStats {
  totalCoaches: number;
  activeCoaches: number;
  totalAthletes: number;
  activeAthletes: number;
  coachingRelationships: number;
  averageAthletesPerCoach: number;
}

export interface CoachPerformanceMetrics {
  coachId: string;
  coachName: string;
  athleteCount: number;
  activeAthletes: number;
  completedSessions: number;
  averageRPE: number;
  retentionRate: number;
  lastActivity: string | Date;
}

export interface TeamOverview {
  stats: CoachTeamStats;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string | Date;
    userId: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
}

export interface CreateTrainingBlockDto {
  workoutName: string;
  workoutMethod: WorkoutMethod;
  workoutType: WorkoutType;
  isGlobal?: boolean;
  is_free?: boolean;
  summary?: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
    csBalance: number;
  };
  exercises: CreateTrainingBlockExerciseDto[];
}

export interface CreateTrainingBlockExerciseDto {
  exerciseId: string;
  order: number;
  day: number;
  sets: {
    reps: number;
    rpe: number;
  }[];
  modifiers: string[];
  summary?: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
  };
}

export interface TrainingBlockResponse {
  id: string;
  isGlobal: boolean;
  is_free?: boolean;
  workoutName: string;
  workoutMethod: WorkoutMethod;
  workoutType: WorkoutType;
  workoutStatus: WorkoutStatus;
  tenantId: string;
  tenantName?: string;
  createdAt: Date;
  updatedAt: Date;
  exercises: TrainingBlockExerciseResponse[];
  createdBy: string;
  createdByName?: string;
  summary?: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
    csBalance: number;
    patterns: PatternSummary[];
  };
}

export interface TrainingBlockExerciseResponse {
  id: string;
  trainingBlockId: string;
  exerciseId: string;
  exerciseName?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  day: number;
  sets: {
    reps: number;
    rpe: number;
  }[];
  modifiers: string[];
  summary: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
  };
}

export interface Progression {
  id: string;
  name: string;
  location?: string;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgressionDto {
  squat: string;
  bench: string;
  deadlift: string;
}

export interface UpdateProgressionDto {
  name?: string;
  location?: string;
  date?: string;
  description?: string;
}

export interface CoachAthleteRelationship {
  training_session_count: number;
  last_activity: Date | null;
  id: string;
  tenant_id: string;
  coach_id: string;
  athlete_id: string;
  status: RelationshipStatus;
  created_at: Date;
  updated_at: Date;
  athlete_firstName: string;
  athlete_lastName: string;
  athlete_role: string;
  athlete_email: string;
  coach_email: string;
  coach_firstName: string;
  coach_lastName: string;
}
