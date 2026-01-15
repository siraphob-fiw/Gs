// Intelligent Program Generation Types
// Core types for the intelligent program generation system

import { Competition } from "./competition";
import { Equipment } from "./equipment";
import { DisabilityAccommodation } from "./health-types";

// ============================================================================
// ENUMS
// ============================================================================

export enum BlockType {
  TRAINING = 'TRAINING',
  PIVOT = 'PIVOT',
  PEAKING = 'PEAKING',
  TAPERING = 'TAPERING',
}

// export enum ProgramStatus {
//   DRAFT = 'DRAFT',
//   ACTIVE = 'ACTIVE',
//   PAUSED = 'PAUSED',
//   COMPLETED = 'COMPLETED',
//   CANCELLED = 'CANCELLED',
// }

export enum SessionType {
  MAIN = 'MAIN',
  ACCESSORY = 'ACCESSORY',
  RECOVERY = 'RECOVERY',
  TECHNIQUE = 'TECHNIQUE',
  CONDITIONING = 'CONDITIONING',
}

// export enum ProgramInjurySeverity {
//   MINOR = 'MINOR',
//   MODERATE = 'MODERATE',
//   MAJOR = 'MAJOR',
//   SEVERE = 'SEVERE',
// }

// export enum ProgramInjuryStatus {
//   ACTIVE = 'ACTIVE',
//   RECOVERING = 'RECOVERING',
//   RESOLVED = 'RESOLVED',
// }

export enum RestrictionType {
  EXCLUDE = 'EXCLUDE',
  MODIFY = 'MODIFY',
  LIMIT_LOAD = 'LIMIT_LOAD',
  LIMIT_ROM = 'LIMIT_ROM',
}

export enum FatigueLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum WearableSource {
  WHOOP = 'WHOOP',
  OURA = 'OURA',
  GARMIN = 'GARMIN',
  FITBIT = 'FITBIT',
  APPLE_HEALTH = 'APPLE_HEALTH',
  MANUAL = 'MANUAL',
}

export enum AdaptationType {
  INTENSITY = 'INTENSITY',
  VOLUME = 'VOLUME',
  DELOAD = 'DELOAD',
  RECOVERY = 'RECOVERY',
}

export enum AdaptationUrgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CompetitionType {
  POWERLIFTING = 'POWERLIFTING',
  WEIGHTLIFTING = 'WEIGHTLIFTING',
  STRONGMAN = 'STRONGMAN',
  LOCAL = 'LOCAL',
  REGIONAL = 'REGIONAL',
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL',
}

export enum AttemptType {
  OPENER = 'OPENER',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface RepRange {
  min: number;
  max: number;
}

export interface IntensityRange {
  min: number; // %1RM
  max: number; // %1RM
}

export interface RPERange {
  min: number;
  max: number;
}

export interface TimeConstraint {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  maxDuration: number; // minutes
}

// export interface ProgramDisabilityAccommodation {
//   type: string;
//   description: string;
//   exerciseRestrictions: string[];
//   requiredModifications: string[];
// }

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Athlete {
  id: string;
  userId: string;
  tenantId: string;
  profile: AthleteProfile;
  preferences: AthletePreferences;
  currentProgram?: string;
  coachId?: string;
  healthMetrics: HealthMetrics[];
  injuries: Injury[];
  competitions: Competition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AthleteProfile {
  discipline: string; // Using string to match existing Discipline enum
  experienceLevel: string; // Using string to match existing ExperienceLevel enum
  gender: string; // Using string to match existing Gender enum
  birthDate: Date;
  bodyWeight: number;
  availableEquipment: Equipment[];
  trainingFrequency: number;
  goals: string[]; // Using string array to match existing TrainingGoal enum
  disabilityAccommodations?: DisabilityAccommodation[];
}

export interface AthletePreferences {
  preferredTrainingTimes: TimeConstraint[];
  maxSessionDuration: number; // minutes
  restDayPreferences: number[]; // days of week
  intensityPreference: 'conservative' | 'moderate' | 'aggressive';
  volumePreference: 'low' | 'moderate' | 'high';
  exerciseVariety: 'minimal' | 'moderate' | 'high';
  autoAdjustments: boolean;
  coachApprovalRequired: boolean;
}

// ============================================================================
// HEALTH & PERFORMANCE TRACKING
// ============================================================================

export interface HealthMetrics {
  id: string;
  athleteId: string;
  date: Date;
  source: WearableSource;
  hrv?: number;
  sleepDuration?: number;
  sleepQuality?: number;
  restingHeartRate?: number;
  stepCount?: number;
  stressScore?: number;
  manualEntries?: ManualHealthEntry[];
  fatigueStatus: FatigueStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManualHealthEntry {
  metric: string;
  value: number;
  unit: string;
  notes?: string;
  timestamp: Date;
}

export interface FatigueStatus {
  level: FatigueLevel;
  score: number;
  indicators: FatigueIndicator[];
  recommendations: string[];
}

export interface FatigueIndicator {
  type: 'hrv' | 'sleep' | 'stress' | 'rpe' | 'subjective';
  value: number;
  threshold: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface PerformanceData {
  id: string;
  athleteId: string;
  sessionId: string;
  exerciseId: string;
  sets: CompletedSet[];
  sessionRPE: number;
  duration: number;
  notes?: string;
  videoUploads?: string[];
  completedAt: Date;
}

export interface CompletedSet {
  setNumber: number;
  reps: number;
  weight: number;
  rpe: number;
  completed: boolean;
  notes?: string;
}

// ============================================================================
// INJURY MANAGEMENT
// ============================================================================

export interface Injury {
  id: string;
  athleteId: string;
  name: string;
  bodyPart: string; // Using string to match existing BodyPart enum
  severity: string;
  status: string;
  restrictions: ExerciseRestriction[];
  declaredAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

export interface ExerciseRestriction {
  exerciseId?: string;
  movementPattern?: string; // Using string to match existing MovementPattern enum
  restriction: RestrictionType;
  parameters?: RestrictionParameters;
}

export interface RestrictionParameters {
  maxLoad?: number; // %1RM
  maxROM?: number; // degrees
  maxReps?: number;
  requiredModifications?: string[];
  alternativeExercises?: string[];
}
export interface ProgressionRules {
  volumeProgression: VolumeProgression;
  intensityProgression: IntensityProgression;
  frequencyProgression: FrequencyProgression;
  deloadProtocol: DeloadProtocol;
}

export interface VolumeProgression {
  type: 'linear' | 'wave' | 'block' | 'autoregulated';
  startingVolume: number;
  weeklyIncrease: number;
  maxVolume: number;
  deloadFrequency: number; // weeks
}

export interface IntensityProgression {
  type: 'linear' | 'wave' | 'block' | 'autoregulated';
  startingIntensity: number; // %1RM
  weeklyIncrease: number;
  maxIntensity: number;
  testingFrequency: number; // weeks
}

export interface FrequencyProgression {
  startingFrequency: number;
  maxFrequency: number;
  progressionTrigger: 'time' | 'performance' | 'adaptation';
}

export interface DeloadProtocol {
  trigger: 'scheduled' | 'performance' | 'fatigue' | 'rpe';
  volumeReduction: number; // percentage
  intensityReduction: number; // percentage
  duration: number; // weeks
}

export interface ExerciseProgressionRules {
  loadProgression: LoadProgression;
  volumeProgression: VolumeProgression;
  substitutionRules: SubstitutionRules;
}

export interface LoadProgression {
  type: 'percentage' | 'absolute' | 'rpe_based';
  increment: number;
  maxAttempts: number;
  failureProtocol: 'deload' | 'substitute' | 'maintain';
}

export interface SubstitutionRules {
  triggers: string[];
  alternatives: string[];
  selectionCriteria: string[];
}

// ============================================================================
// EXERCISE SELECTION
// ============================================================================

export interface ExerciseSelectionRules {
  primaryMovements: MovementRequirement[];
  accessoryMovements: MovementRequirement[];
  volumeDistribution: VolumeDistribution;
  equipmentConstraints: EquipmentConstraint[];
  injuryConsiderations: InjuryConsideration[];
}

export interface MovementRequirement {
  movementPattern: string;
  minFrequency: number; // per week
  maxFrequency: number; // per week
  intensityRange: IntensityRange;
  volumeRange: RepRange;
  priority: 'required' | 'preferred' | 'optional';
}

export interface VolumeDistribution {
  primaryMovements: number; // percentage
  accessoryMovements: number; // percentage
  conditioningWork: number; // percentage
  mobilityWork: number; // percentage
}

export interface EquipmentConstraint {
  equipmentId: string;
  required: boolean;
  alternatives?: string[];
}

export interface InjuryConsideration {
  injuryType: string;
  restrictedMovements: string[];
  recommendedAlternatives: string[];
  loadLimitations: number; // %1RM
}

// ============================================================================
// INJURY MANAGEMENT
// ============================================================================

export interface Injury {
  id: string;
  athleteId: string;
  name: string;
  bodyPart: string; // Using string to match existing BodyPart enum
  severity: string;
  status: string;
  restrictions: ExerciseRestriction[];
  declaredAt: Date;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseRestriction {
  exerciseId?: string;
  movementPattern?: string;
  restriction: RestrictionType;
  parameters?: RestrictionParameters;
  alternatives?: string[];
  reasoning?: string;
}

export interface RestrictionParameters {
  maxLoad?: number; // %1RM or absolute weight
  maxReps?: number;
  maxSets?: number;
  rangeOfMotionLimit?: number; // percentage
  modificationInstructions?: string;
  duration?: number; // days
}

// ============================================================================
// COMPETITION PLANNING
// ============================================================================

// export interface ProgramCompetition {
//   id: string;
//   name: string;
//   date: Date;
//   type: CompetitionType;
//   location: string;
//   discipline: string;
//   weightClass?: number;
//   registrationDeadline?: Date;
//   isTarget: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface CompetitionPlan {
//   competitionId: string;
//   athleteId: string;
//   peakingBlocks: TrainingBlock[];
//   taperProtocol: TaperProtocol;
//   attemptStrategy: AttemptStrategy;
//   timeline: PeakingTimeline;
// }

export interface TaperProtocol {
  duration: number; // weeks
  volumeReduction: number; // percentage per week
  intensityMaintenance: number; // %1RM
  frequencyReduction: number; // percentage
  recoveryEmphasis: string[];
}

export interface AttemptStrategy {
  openers: AttemptRecommendation[];
  seconds: AttemptRecommendation[];
  thirds: AttemptRecommendation[];
  strategy: 'conservative' | 'moderate' | 'aggressive';
}

export interface AttemptRecommendation {
  exercise: string;
  weight: number;
  percentage: number; // %1RM
  confidence: number; // 0-100
  reasoning: string;
}

export interface PeakingTimeline {
  totalWeeks: number;
  phases: PeakingPhase[];
  milestones: Milestone[];
  criticalDates: Date[];
}

export interface PeakingPhase {
  name: string;
  startWeek: number;
  endWeek: number;
  objectives: string[];
  volumeTarget: number;
  intensityTarget: IntensityRange;
}

export interface Milestone {
  week: number;
  description: string;
  metrics: string[];
  successCriteria: string[];
}

// ============================================================================
// PROGRAM ADAPTATIONS
// ============================================================================

// export interface ProgramAdaptation {
//   id: string;
//   programId: string;
//   athleteId: string;
//   type: AdaptationType;
//   reason: string;
//   changes: AdaptationChange[];
//   appliedAt: Date;
//   approvedBy?: string;
//   urgency: AdaptationUrgency;
//   requiresApproval: boolean;
//   metadata: AdaptationMetadata;
// }

export interface AdaptationChange {
  target: 'session' | 'exercise' | 'block';
  targetId: string;
  property: string;
  oldValue: any;
  newValue: any;
  reasoning: string;
}

export interface AdaptationMetadata {
  triggerData: Record<string, any>;
  confidence: number; // 0-100
  expectedOutcome: string;
  reversible: boolean;
  monitoringRequired: boolean;
}

export interface AdaptationRecommendation {
  adjustmentType: AdaptationType;
  magnitude: number;
  reasoning: string;
  urgency: AdaptationUrgency;
  requiresApproval: boolean;
  expectedBenefit: string;
  risks: string[];
}

// ============================================================================
// EQUIPMENT
// ============================================================================

// export interface ProgramEquipment {
//   id: string;
//   name: string;
//   type: string; // Using string to match existing EquipmentType enum
//   specifications: EquipmentSpecifications;
//   availability: EquipmentAvailability;
//   condition: string; // Using string to match existing EquipmentCondition enum
//   lastMaintenance?: Date;
//   notes?: string;
// }

export interface EquipmentSpecifications {
  weight?: number;
  length?: number;
  width?: number;
  weightRange?: {
    min: number; 
    max: number
  };
  increments?: number[];
  capacity?: number;
  features?: string[];
  dimensions?: {
    width: number;
    height: number;
    length: number;
  }
}

export interface EquipmentAvailability {
  available: boolean;
  schedule?: AvailabilitySchedule[];
  restrictions?: string[];
  alternativeOptions?: string[];
}

export interface AvailabilitySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity?: number;
}

// ============================================================================
// PROGRAM CONSTRAINTS
// ============================================================================

// export interface ProgramConstraints {
//   availableEquipment: ProgramEquipment[];
//   injuryRestrictions: InjuryRestriction[];
//   timeConstraints: TimeConstraint[];
//   experienceLevel: string;
//   genderSpecificModifications: boolean;
//   disabilityAccommodations?: ProgramDisabilityAccommodation[];
//   coachPreferences?: CoachPreferences;
// }

export interface InjuryRestriction {
  injuryId: string;
  restrictedExercises: string[];
  restrictedMovements: string[];
  loadLimitations: number; // %1RM
  alternatives: string[];
}

export interface CoachPreferences {
  exercisePreferences: string[];
  methodologyPreferences: string[];
  progressionStyle: 'conservative' | 'moderate' | 'aggressive';
  autoAdjustmentLimits: AutoAdjustmentLimits;
}

export interface AutoAdjustmentLimits {
  maxVolumeIncrease: number; // percentage
  maxIntensityIncrease: number; // percentage
  maxFrequencyChange: number;
  requireApprovalThreshold: number; // percentage change
}