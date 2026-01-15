// Training and Exercise Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

// Training Enums
export enum ProgramCategory {
  STRENGTH = 'STRENGTH',
  POWERLIFTING = 'POWERLIFTING',
  WEIGHTLIFTING = 'WEIGHTLIFTING',
  GENERAL_FITNESS = 'GENERAL_FITNESS'
}

export enum GuidanceLevel {
  MINIMAL = 'MINIMAL',
  MODERATE = 'MODERATE',
  COMPREHENSIVE = 'COMPREHENSIVE'
}

export enum IndependentAccessLevel {
  BASIC = 'BASIC',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum TrainingGoal {
  STRENGTH = 'STRENGTH',
  POWER = 'POWER',
  HYPERTROPHY = 'HYPERTROPHY',
  ENDURANCE = 'ENDURANCE'
}

export enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum Discipline {
  BODYBUILDING = 'BODYBUILDING',
  SPORTS_SPECIFIC = 'SPORTS_SPECIFIC',
  POWERBUILDING = 'POWERBUILDING',
}

export enum SelfCoachedOnboardingStep {
  PROFILE_SETUP = 'PROFILE_SETUP',
  EQUIPMENT_SETUP = 'EQUIPMENT_SETUP',
  GOALS_SETUP = 'GOALS_SETUP',
  SAFETY_ACKNOWLEDGMENT = 'SAFETY_ACKNOWLEDGMENT',
  COMPLETED = 'COMPLETED'
}

export enum GuardrailActionType {
  BLOCK_ACTION = 'BLOCK_ACTION',
  WARN_USER = 'WARN_USER',
  LOG_INCIDENT = 'LOG_INCIDENT',
  REQUIRE_APPROVAL = 'REQUIRE_APPROVAL'
}

export enum TransitionType {
  COACH_TO_COACH = 'COACH_TO_COACH',
  SELF_TO_COACHED = 'SELF_TO_COACHED',
  COACHED_TO_SELF = 'COACHED_TO_SELF'
}

export enum TransitionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RelationshipStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  TERMINATED = 'TERMINATED',
  SUSPENDED = 'SUSPENDED'
}

export enum CoachPermission {
  VIEW_PROFILE = 'VIEW_PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
  VIEW_WORKOUTS = 'VIEW_WORKOUTS',
  CREATE_WORKOUTS = 'CREATE_WORKOUTS',
  VIEW_PROGRESS = 'VIEW_PROGRESS',
  MANAGE_SCHEDULE = 'MANAGE_SCHEDULE',
  COMMUNICATE = 'COMMUNICATE',
  VIEW_HEALTH_DATA = 'VIEW_HEALTH_DATA'
}

// Training Interfaces
export interface SelfCoachedUser {
  id: string;
  userId: string;
  independentAccessLevel: string;
  transitionHistory: any[];
  acknowledgedRisks: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SelfCoachedProgramTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: number;
  exercises: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetyGuardrail {
  id: string;
  name: string;
  description: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetyViolation {
  id: string;
  guardrailId: string;
  userId: string;
  description: string;
  severity: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}