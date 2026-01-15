import { Discipline, PlanStatus } from './enums';
import { User } from './user';

// Plan-related types
export interface Plan {
  id: string;
  userId?: string;
  createdById: string;
  name: string;
  description: string;
  discipline: Discipline;
  planStructure: Record<string, any>;
  isMasterPlan: boolean;
  price?: number;
  blockReviewRequired: boolean;
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  creator: User;
}

export interface PlanWithDetails extends Plan {
  sessionLogs: any[]; // TODO: Define SessionLog type
  blockReviews: any[]; // TODO: Define BlockReview type
  totalSessions: number;
  completedSessions: number;
  progress: number;
}

export interface PlanFilters {
  discipline?: Discipline;
  status?: PlanStatus;
  isMasterPlan?: boolean;
  createdById?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PlanListResponse {
  plans: PlanWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePlanRequest {
  name: string;
  description: string;
  discipline: Discipline;
  planStructure: Record<string, any>;
  isMasterPlan?: boolean;
  price?: number;
  blockReviewRequired?: boolean;
  userId?: string;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  discipline?: Discipline;
  planStructure?: Record<string, any>;
  isMasterPlan?: boolean;
  price?: number;
  blockReviewRequired?: boolean;
  status?: PlanStatus;
}

// Plan structure types
export interface PlanBlock {
  id: string;
  name: string;
  duration: number; // in weeks
  description?: string;
  goals: string[];
  sessions: PlanSession[];
  order: number;
}

export interface PlanSession {
  id: string;
  name: string;
  description?: string;
  exercises: PlanExercise[];
  estimatedDuration: number; // in minutes
  order: number;
  frequency: number; // times per week
}

export interface PlanExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps?: number;
  weight?: number;
  percentage1RM?: number;
  rpe?: number;
  restTime?: number; // in seconds
  tempo?: string; // e.g., "3-0-1-0"
  notes?: string;
  order: number;
}

// Plan assignment and sharing
export interface AssignPlanRequest {
  planId: string;
  userId: string;
  startDate: Date;
  customizations?: Record<string, any>;
}

export interface PlanAssignment {
  id: string;
  planId: string;
  userId: string;
  assignedById: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  customizations?: Record<string, any>;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  plan: Plan;
  user: User;
  assignedBy: User;
}

// Plan templates and master plans
export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  discipline: Discipline;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in weeks
  targetAudience: string[];
  prerequisites: string[];
  goals: string[];
  planStructure: Record<string, any>;
  price: number;
  isPublic: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  creator: User;
}

export interface PlanTemplateFilters {
  discipline?: Discipline;
  difficulty?: string;
  duration?: number;
  targetAudience?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  search?: string;
  page?: number;
  limit?: number;
}

// Plan analytics and progress
export interface PlanProgress {
  planId: string;
  userId: string;
  totalSessions: number;
  completedSessions: number;
  skippedSessions: number;
  completionRate: number;
  averageSessionDuration: number;
  strengthGains: Record<string, number>;
  volumeProgress: Record<string, number>;
  lastSessionDate?: Date;
  nextSessionDate?: Date;
}

export interface PlanAnalytics {
  planId: string;
  totalAssignments: number;
  activeAssignments: number;
  averageCompletionRate: number;
  averageDuration: number;
  userSatisfaction: number;
  commonFeedback: string[];
  strengthGains: Record<string, number>;
} 