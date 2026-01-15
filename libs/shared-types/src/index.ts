// Re-export all shared types from organized modules
// Core new modules from migration (prioritized)
export * from './shared-types';
export * from './database-types';
export * from './health-types';
export * from './payment-types';
export * from './audit-types';
// Export training types except TrainingGoal and Discipline (use the comprehensive ones from user-management-enums)
export {
  ProgramCategory,
  GuidanceLevel,
  IndependentAccessLevel,
  ExperienceLevel,
  SelfCoachedOnboardingStep,
  GuardrailActionType,
  TransitionType,
  TransitionStatus,
  RelationshipStatus,
  CoachPermission,
} from './training-types';

export type {
  SelfCoachedUser,
  SelfCoachedProgramTemplate,
  SafetyGuardrail,
  SafetyViolation,
} from './training-types';
// Export comprehensive enums from user-management-enums, overriding simpler versions
export {
  UserRole,
  UserStatus,
  TenantStatus,
  TrainingGoal,
  WeightUnit,
  Gender,
  Discipline,
  ProfileVisibility,
  NotificationType,
  NotificationPriority,
} from './user-management-enums';

// Export BillingCycle and SubscriptionStatus explicitly
export { SubscriptionStatus } from './payment-types';

// Export core interfaces from shared-types (simpler, more practical)
export type { User, Tenant, TenantSettings, BillingInfo, SubscriptionInfo } from './shared-types';
// Export additional user management types (but not the complex User interface)
export type { CoachAthleteRelationship } from './user-management';
export * from './notification-types';
export type { NotificationPreferenceSettings, QuietHours } from './notification-types';
export * from './messaging-types';
export * from './security-types';
export * from './monitoring-types';

// Export SecurityEventType and related types from security-monitoring (more comprehensive)
export {
  SecurityEventType,
  SecurityEventSeverity,
  SecurityEventStatus,
  ThreatLevel,
  IncidentStatus,
  ResponseAction,
} from './security-monitoring';

export type {
  SecurityEvent,
  GeolocationInfo,
  IntrusionDetectionRule,
  DetectionCondition,
  SuspiciousActivityPattern,
  ActivityBaseline,
  SecurityIncident,
  IncidentResponseAction,
  IncidentTimelineEntry,
  SecurityMonitoringConfig,
  AlertChannel,
  EscalationRule,
  SecurityMetrics,
  SecurityReport,
  ThreatSummary,
  CreateSecurityEventRequest,
  SecurityEventQuery,
  SecurityEventResponse,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  SecurityDashboardData,
  ThreatTrendData,
  ComplianceStatusData,
  SecurityWebhookPayload,
  SiemIntegrationConfig,
} from './security-monitoring';

// Export existing types (keeping for compatibility)
// Note: Avoiding duplicates by being selective
export { PlanStatus, SessionStatus, ExerciseType, BodyPart, MovementPattern } from './enums';
export * from './common';
export * from './session';
export * from './equipment';
export * from './exercise';
export * from './plan';
export * from './competition';

// Intelligent Program Generation Types
export {
  BlockType,
  SessionType,
  RestrictionType,
  FatigueLevel,
  WearableSource,
  AdaptationType,
  AdaptationUrgency,
  CompetitionType,
  AttemptType,

  // Utility Types
  type RepRange,
  type IntensityRange,
  type RPERange,
  type TimeConstraint,

  // Core Entities
  type Athlete,
  type AthleteProfile,
  type AthletePreferences,

  // Health & Performance
  type HealthMetrics,
  type ManualHealthEntry,
  type FatigueStatus,
  type FatigueIndicator,
  type PerformanceData,
  type CompletedSet,

  // Injury Management
  type Injury,
  type ExerciseRestriction,
  type RestrictionParameters,

  // Progression Rules
  type ProgressionRules,
  type VolumeProgression,
  type IntensityProgression,
  type FrequencyProgression,
  type DeloadProtocol,
  type ExerciseProgressionRules,
  type LoadProgression,
  type SubstitutionRules,

  // Exercise Selection
  type ExerciseSelectionRules,
  type MovementRequirement,
  type VolumeDistribution,
  type EquipmentConstraint,
  type InjuryConsideration,

  // Competition Planning
  type TaperProtocol,
  type AttemptStrategy,
  type AttemptRecommendation,
  type PeakingTimeline,
  type PeakingPhase,
  type Milestone,

  // Program Adaptations
  type AdaptationChange,
  type AdaptationMetadata,
  type AdaptationRecommendation,

  // Equipment
  type EquipmentSpecifications,
  type EquipmentAvailability,
  type AvailabilitySchedule,

  // Program Constraints
  type InjuryRestriction,
  type CoachPreferences,
  type AutoAdjustmentLimits,
} from './program-generation';

export * from './program-generation-services';
