import { SessionStatus } from './enums';
import { User } from './user';
import { Plan } from './plan';
import { Exercise } from './exercise';

// Session-related types
export interface SessionLog {
  id: string;
  userId: string;
  planId?: string;
  sessionDate: Date;
  sessionName: string;
  sessionRPE?: number;
  sessionDurationMins?: number;
  notes?: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  plan?: Plan;
  exerciseLogs: ExerciseLog[];
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  sets: number;
  repsPerSet: number;
  load: number;
  percentage1RM?: number;
  liftRPE?: number;
  completed: boolean;
  notes?: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  session: SessionLog;
  exercise: Exercise;
}

export interface SessionFilters {
  userId?: string;
  planId?: string;
  status?: SessionStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SessionListResponse {
  sessions: SessionLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSessionRequest {
  userId: string;
  planId?: string;
  sessionDate: Date;
  sessionName: string;
  sessionRPE?: number;
  sessionDurationMins?: number;
  notes?: string;
  exercises: CreateExerciseLogRequest[];
}

export interface CreateExerciseLogRequest {
  exerciseId: string;
  sets: number;
  repsPerSet: number;
  load: number;
  percentage1RM?: number;
  liftRPE?: number;
  completed?: boolean;
  notes?: string;
  videoUrl?: string;
}

export interface UpdateSessionRequest {
  sessionName?: string;
  sessionRPE?: number;
  sessionDurationMins?: number;
  notes?: string;
  status?: SessionStatus;
}

export interface UpdateExerciseLogRequest {
  sets?: number;
  repsPerSet?: number;
  load?: number;
  percentage1RM?: number;
  liftRPE?: number;
  completed?: boolean;
  notes?: string;
  videoUrl?: string;
}

// Session templates and presets
export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  isPublic: boolean;
  exercises: SessionTemplateExercise[];
  estimatedDuration: number; // in minutes
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  creator: User;
}

export interface SessionTemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  sets: number;
  repsPerSet: number;
  load?: number;
  percentage1RM?: number;
  rpe?: number;
  restTime?: number; // in seconds
  tempo?: string;
  notes?: string;
  order: number;
  exercise: Exercise;
}

// Session analytics and insights
export interface SessionAnalytics {
  userId: string;
  totalSessions: number;
  averageSessionDuration: number;
  averageSessionRPE: number;
  completionRate: number;
  favoriteExercises: {
    exercise: Exercise;
    frequency: number;
    totalVolume: number;
  }[];
  strengthProgress: {
    exercise: Exercise;
    currentMax: number;
    previousMax: number;
    improvement: number;
  }[];
  volumeProgress: {
    exercise: Exercise;
    currentVolume: number;
    previousVolume: number;
    change: number;
  }[];
  weeklyTrends: {
    week: string;
    sessions: number;
    totalVolume: number;
    averageRPE: number;
  }[];
}

export interface SessionInsights {
  sessionId: string;
  recommendations: {
    type: 'form' | 'load' | 'volume' | 'recovery';
    message: string;
    priority: 'low' | 'medium' | 'high';
    data?: Record<string, any>;
  }[];
  performanceMetrics: {
    totalVolume: number;
    averageIntensity: number;
    workCapacity: number;
    recoveryScore: number;
  };
  nextSessionSuggestions: {
    exercise: Exercise;
    reason: string;
    suggestedLoad?: number;
    suggestedVolume?: number;
  }[];
}

// Block review types
export interface BlockReview {
  id: string;
  userId: string;
  planId: string;
  blockName: string;
  blockStartDate: Date;
  blockEndDate: Date;
  completionRating?: number;
  stressManagementRating?: number;
  injuriesOccurred: boolean;
  notes?: string;
  strengthGainPercent?: number;
  volumeToleranceChange?: number;
  sessionComplianceRate?: number;
  sharpDeclineDetected?: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  plan: Plan;
}

export interface CreateBlockReviewRequest {
  userId: string;
  planId: string;
  blockName: string;
  blockStartDate: Date;
  blockEndDate: Date;
  completionRating?: number;
  stressManagementRating?: number;
  injuriesOccurred?: boolean;
  notes?: string;
  strengthGainPercent?: number;
  volumeToleranceChange?: number;
  sessionComplianceRate?: number;
  sharpDeclineDetected?: boolean;
}

export interface UpdateBlockReviewRequest {
  completionRating?: number;
  stressManagementRating?: number;
  injuriesOccurred?: boolean;
  notes?: string;
  strengthGainPercent?: number;
  volumeToleranceChange?: number;
  sessionComplianceRate?: number;
  sharpDeclineDetected?: boolean;
} 