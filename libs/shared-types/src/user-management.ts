// User Management & Multi-Tenancy Types
// Core user management interfaces for the StrengthOS platform

import {
  UserRole,
  UserStatus,
  TenantStatus,
  TransitionType,
  TransitionStatus,
  Gender,
  WeightUnit,
  ExperienceLevel,
  Discipline,
  TrainingGoal,
  DisabilityType,
  Joint,
  MovementPlane,
  RestrictionType,
  SeverityLevel,
  CyclePhase,
  CyclePrivacyLevel,
  SymptomType,
  EquipmentType,
  EquipmentCondition,
  PlateMaterial,
  PlateType,
  TimeOfDay,
  TimePreferenceLevel,
  FlexibilityLevel,
  ConsiderationType,
  PriorityLevel,
  RelationshipStatus,
  NotificationType,
  NotificationStatus,
  NotificationFrequency,
  ProfileVisibility,
  ConsentType,
  SecurityEventType,
  ConditionOperator,
  AccommodationType,
  ModificationType,
  AuditEventType,
  SecuritySeverity,
  SecurityCategory,
  SecurityEventStatus,
} from './user-management-enums';

import { SubscriptionStatus } from './payment-types';

// ============================================================================
// ADVANCED USER PREFERENCES
// ============================================================================

export interface TrainingPreferences {
  weeklySchedule: WeeklyAvailability;
  exerciseBlacklist: string[];
  equipmentProfile: string[];
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface DayAvailability {
  isAvailable: boolean;
  timeSlots: AvailableTimeSlot;
}

export interface AvailableTimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

// ============================================================================
// HEALTH PROFILE & ADVANCED HEALTH CONSIDERATIONS
// ============================================================================

export interface HealthProfile {
  menstrualCycleTracking?: MenstrualCycleTracking;
  metabolicProfile?: MetabolicProfile;
  cardiovascularProfile?: CardiovascularProfile;
  musculoskeletalProfile?: MusculoskeletalProfile;
  nutritionalProfile?: NutritionalProfile;
  sleepProfile?: SleepProfile;
  stressProfile?: StressProfile;
  lastUpdated: Date;
}

export interface MenstrualCycleTracking {
  enabled: boolean;
  trackingStartDate: Date;
  averageCycleLength: number; // days
  averagePeriodLength: number; // days
  lastPeriodStart?: Date;
  symptoms: MenstrualSymptomTracking[];
  trainingAdjustments: MenstrualTrainingAdjustment[];
  privacySettings: MenstrualPrivacySettings;
  notifications: MenstrualNotificationSettings;
}

export interface MenstrualSymptomTracking {
  symptom: SymptomType;
  severity: SeverityLevel;
  cycleDay: number;
  notes?: string;
  impactOnTraining: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
}

export interface MenstrualTrainingAdjustment {
  cyclePhase: CyclePhase;
  adjustments: {
    intensityModifier: number; // 0.5 to 1.5
    volumeModifier: number; // 0.5 to 1.5
    frequencyModifier: number; // 0.5 to 1.5
    exerciseRestrictions: string[];
    recommendedExercises: string[];
    restPeriodModifier: number; // 0.5 to 2.0
  };
  enabled: boolean;
}

export interface MenstrualPrivacySettings {
  shareWithCoach: boolean;
  shareAggregatedData: boolean;
  shareSymptoms: boolean;
  shareTrainingImpact: boolean;
  anonymizeData: boolean;
}

export interface MenstrualNotificationSettings {
  periodReminders: boolean;
  ovulationReminders: boolean;
  trainingAdjustmentNotifications: boolean;
  symptomTrackingReminders: boolean;
  reminderDaysBefore: number;
}

export interface MetabolicProfile {
  basalMetabolicRate?: number;
  totalDailyEnergyExpenditure?: number;
  metabolicFlexibility?: 'LOW' | 'MODERATE' | 'HIGH';
  insulinSensitivity?: 'LOW' | 'MODERATE' | 'HIGH';
  thyroidFunction?: 'HYPO' | 'NORMAL' | 'HYPER';
  lastMetabolicAssessment?: Date;
}

export interface CardiovascularProfile {
  restingHeartRate?: number;
  maxHeartRate?: number;
  heartRateVariability?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    measurementDate: Date;
  };
  cardioFitnessLevel?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  lastCardioAssessment?: Date;
}

export interface MusculoskeletalProfile {
  muscleImbalances: MuscleImbalance[];
  flexibilityAssessment: FlexibilityAssessment[];
  postureAssessment?: PostureAssessment;
  movementScreenResults?: MovementScreenResult[];
  lastAssessmentDate?: Date;
}

export interface MuscleImbalance {
  muscleGroup: string;
  imbalanceType: 'STRENGTH' | 'FLEXIBILITY' | 'ENDURANCE';
  severity: SeverityLevel;
  affectedMovements: string[];
  correctiveExercises: string[];
  notes?: string;
}

export interface FlexibilityAssessment {
  joint: Joint;
  movementPlane: MovementPlane;
  rangeOfMotion: number; // degrees
  normalRange: number; // degrees
  limitation?: string;
  improvementExercises: string[];
}

export interface PostureAssessment {
  overallScore: number; // 0-100
  issues: PosturalIssue[];
  correctiveStrategies: string[];
  assessmentDate: Date;
}

export interface PosturalIssue {
  area: string;
  description: string;
  severity: SeverityLevel;
  correctiveExercises: string[];
}

export interface MovementScreenResult {
  screenType: string;
  overallScore: number;
  individualScores: {
    movement: string;
    score: number;
    limitations: string[];
    recommendations: string[];
  }[];
  assessmentDate: Date;
}

export interface NutritionalProfile {
  dietaryRestrictions: string[];
  allergies: string[];
  intolerances: string[];
  nutritionalGoals: string[];
  supplementation: Supplement[];
  hydrationGoals: HydrationGoal[];
  mealTiming: MealTimingPreference[];
}

export interface Supplement {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  startDate: Date;
  endDate?: Date;
  sideEffects?: string[];
}

export interface HydrationGoal {
  dailyTarget: number; // liters
  preWorkout: number; // ml
  duringWorkout: number; // ml per hour
  postWorkout: number; // ml
  electrolyteNeeds: boolean;
}

export interface MealTimingPreference {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'PRE_WORKOUT' | 'POST_WORKOUT';
  preferredTime: string; // HH:MM format
  macroTargets?: {
    carbs: number; // grams
    protein: number; // grams
    fat: number; // grams
  };
}

export interface SleepProfile {
  averageSleepDuration: number; // hours
  preferredBedtime: string; // HH:MM format
  preferredWakeTime: string; // HH:MM format
  sleepQualityRating: number; // 1-10
  sleepDisorders: string[];
  sleepEnvironmentPreferences: SleepEnvironmentPreferences;
  sleepHygienePractices: string[];
}

export interface SleepEnvironmentPreferences {
  idealTemperature: number; // Celsius
  lightLevel: 'COMPLETE_DARKNESS' | 'DIM' | 'MODERATE';
  noiseLevel: 'SILENT' | 'WHITE_NOISE' | 'NATURE_SOUNDS';
  mattressFirmness: 'SOFT' | 'MEDIUM' | 'FIRM';
  pillowType: string;
}

export interface StressProfile {
  stressLevel: number; // 1-10
  stressTriggers: string[];
  copingMechanisms: string[];
  stressManagementTechniques: string[];
  workLifeBalance: number; // 1-10
  socialSupport: number; // 1-10
  lastStressAssessment?: Date;
}

export interface PhysicalLimitation {
  id: string;
  type: 'TEMPORARY' | 'PERMANENT' | 'CHRONIC';
  category: 'MOBILITY' | 'STRENGTH' | 'ENDURANCE' | 'COORDINATION' | 'BALANCE' | 'SENSORY';
  description: string;
  affectedBodyParts: string[];
  severity: SeverityLevel;
  startDate: Date;
  endDate?: Date;
  exerciseRestrictions: ExerciseRestriction[];
  accommodationRequirements: AccommodationRequirement[];
  progressTracking: LimitationProgressTracking[];
  lastUpdated: Date;
}

export interface ExerciseRestriction {
  exerciseType: string;
  restrictionType: RestrictionType;
  specificExercises?: string[];
  alternatives: string[];
  modifications: ExerciseModification[];
  reason: string;
}

export interface LimitationProgressTracking {
  date: Date;
  severity: SeverityLevel;
  functionalCapacity: number; // 0-100
  painLevel?: number; // 0-10
  notes?: string;
  assessedBy?: string;
}

export interface DisabilityAccommodationSettings {
  id: string;
  disabilityType: DisabilityType;
  accommodationLevel: 'MINIMAL' | 'MODERATE' | 'EXTENSIVE' | 'COMPREHENSIVE';
  specificAccommodations: SpecificAccommodation[];
  assistiveTechnology: AssistiveTechnology[];
  environmentalModifications: EnvironmentalModification[];
  communicationPreferences: CommunicationAccommodation[];
  emergencyProcedures: DisabilityEmergencyProcedure[];
  supportPersonnel: SupportPersonnel[];
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export interface SpecificAccommodation {
  type: AccommodationType;
  description: string;
  implementation: string[];
  equipment?: string[];
  trainingRequired?: boolean;
  cost?: number;
  effectiveness: number; // 1-10
}

export interface AssistiveTechnology {
  name: string;
  type: string;
  purpose: string;
  specifications?: Record<string, any>;
  trainingRequired: boolean;
  maintenanceSchedule?: string;
  replacementDate?: Date;
}

export interface EnvironmentalModification {
  area: string;
  modification: string;
  purpose: string;
  implementationDate?: Date;
  cost?: number;
  effectiveness: number; // 1-10
}

export interface CommunicationAccommodation {
  type: 'VISUAL' | 'AUDITORY' | 'TACTILE' | 'COGNITIVE' | 'LINGUISTIC';
  method: string;
  description: string;
  equipment?: string[];
  trainingRequired?: boolean;
}

export interface DisabilityEmergencyProcedure {
  scenario: string;
  specificSteps: string[];
  accommodationConsiderations: string[];
  emergencyContacts: EmergencyContact[];
  equipmentNeeded?: string[];
  communicationMethod: string;
}

export interface SupportPersonnel {
  name: string;
  role: string;
  qualifications: string[];
  contactInfo: ContactInfo;
  availability: AvailableTimeSlot[];
  specializations: string[];
}

// ============================================================================
// CORE USER ENTITIES
// ============================================================================

export interface User {
  id: string;
  tenantId: string | null;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
  phoneVerified: boolean;
  phoneVerifiedAt?: Date;
  profile: AthleteProfile;
  preferences: UserPreferences;
  equipmentProfiles: EquipmentProfile[];
  healthConsiderations: HealthConsiderations;
  healthProfile?: HealthProfile;
  sessions: UserSession[];
  auditLog: AuditEntry[];
  oauthProviders?: Record<string, any>;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
}

export interface AthleteProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  bodyWeight: number;
  height: number;
  experienceLevel: ExperienceLevel;
  disciplines: Discipline[];
  goals: TrainingGoal[];
  emergencyContact?: EmergencyContact;
  medicalInformation?: MedicalInformation;
}

export interface UserPreferences {
  language: string;
  notifications: NotificationPreferences;
  training: TrainingPreferences;
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export interface AuthCredentials {
  identifier: string; // Can be email or phone number
  password?: string; // Optional for phone-based auth
  authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
  tenantId?: string;
  verificationToken?: string; // For phone verification
  oauthData?: Record<string, any>; // For OAuth providers
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface SecurityEvent {
  userId: string;
  tenantId: string;
  eventType: SecurityEventType;
  resource: string;
  action: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AuditEntry {
  id: string;
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  eventType?: AuditEventType;
  resourceType?: string;
  resourceId?: string;
  action: string;
  success?: boolean;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  errorMessage?: string;
  stackTrace?: string;
  containsPii?: boolean;
  containsPhi?: boolean;
  retentionUntil?: Date;
  createdAt?: Date;
  timestamp?: Date; // For backward compatibility
  resource?: string; // For backward compatibility
}

export interface SecurityEventData {
  id: string;
  tenantId?: string;
  userId?: string;
  auditLogId?: string;
  severity: SecuritySeverity;
  category: SecurityCategory;
  title: string;
  description: string;
  evidence?: Record<string, any>;
  status: SecurityEventStatus;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionCheckRequest {
  userId: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedPermissions?: Permission[];
  appliedConditions?: PermissionCondition[];
}

export interface AccessControlContext {
  userId: string;
  tenantId: string;
  roles: UserRole[];
  permissions: Permission[];
}

export interface RolePermission {
  role: UserRole;
  permissions: Permission[];
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  tenantId: string;
  role: UserRole;
  assignedBy: string;
  assignedAt: Date;
  revokedBy?: string;
  revokedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface RoleHierarchy {
  role: UserRole;
  inheritsFrom: UserRole[];
  canAssignRoles: UserRole[];
  canManageUsers: boolean;
  canManageTenant: boolean;
  canAccessAllTenants: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expires_at: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  created_at: Date;
  last_used_at: Date;
}

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  description: string;
  status: TenantStatus;
  settings: TenantSettings;
  subscription_info: string; //SubscriptionInfo;
  subscription_info_details?: SubscriptionInfo | null;
  billing_info: BillingInfo;
  contact: { [key: string]: string };
  availableEquipment: string[];
  created_at: Date;
  updated_at: Date;
  suspended_at?: Date;
}

export interface TenantSettings {
  allowSelfCoached: boolean
  requireCoachApproval: boolean;
  enableVideoAnalysis: boolean;
  defaultLanguage: string;
  availableLanguages: string[];
  maxCoaches: number;
  maxAthletes: number;
  logo?: string;
  complianceSettings: ComplianceSettings;
}

export interface SubscriptionInfo {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

export interface BillingInfo {
  amount: number;
  currency: string;
  billingCycle: string | 'MONTHLY' | 'YEARLY' | 'QUARTERLY';
}

export interface UsageMetrics {
  activeCoaches: number;
  activeAthletes: number;
  storageUsed: number;
  apiCalls: number;
  videoAnalysisMinutes: number;
}

export interface ComplianceSettings {
  gdprEnabled: boolean;
  pdpaEnabled: boolean;
  hipaaEnabled: boolean;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: UserRole;
  permissions: Permission[];
  settings: TenantSettings;
}

// ============================================================================
// EQUIPMENT & TRAINING SETUP
// ============================================================================

export interface EquipmentProfile {
  id: string;
  userId: string;
  name: string;
  location: string;
  description?: string;
  availableEquipment: UserEquipment[];
  plateConfiguration: PlateConfiguration;
  spaceConstraints?: SpaceConstraints;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserEquipment {
  type: EquipmentType;
  brand?: string;
  model?: string;
  specifications: EquipmentSpecs;
  condition: EquipmentCondition;
  limitations: string[];
  lastMaintenance?: Date;
}

export interface EquipmentSpecs {
  maxWeight?: number;
  dimensions?: Dimensions;
  adjustableHeight?: boolean;
  safetyFeatures?: string[];
  accessories?: string[];
}

export interface PlateConfiguration {
  unit: WeightUnit;
  barWeight: number;
  availablePlates: PlateInventory[];
  hasCollars: boolean;
  collarWeight: number;
  loadingPins: boolean;
  fractionalPlates: FractionalPlateSet;
}

export interface PlateInventory {
  weight: number;
  quantity: number;
  material: PlateMaterial;
  type: PlateType;
}

export interface FractionalPlateSet {
  has0_25kg: boolean;
  has0_5kg: boolean;
  has1_25lbs: boolean;
  has2_5lbs: boolean;
  customFractionals: number[];
}

export interface SpaceConstraints {
  ceilingHeight?: number;
  floorSpace?: Dimensions;
  noiseRestrictions?: boolean;
  timeRestrictions?: TimeRestriction[];
}

export interface Dimensions {
  length: number;
  width: number;
  height?: number;
  unit: 'cm' | 'in' | 'm' | 'ft';
}

export interface TimeRestriction {
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  description?: string;
}

// ============================================================================
// HEALTH & ACCESSIBILITY
// ============================================================================

export interface HealthConsiderations {
  disabilities: DisabilityAccommodation[];
  rangeOfMotionLimitations: ROMRestriction[];
  menstrualCycleTracking?: MenstrualCycleSettings;
  chronicConditions: ChronicCondition[];
  medications: MedicationInfo[];
  allergies: AllergyInfo[];
  emergencyMedicalInfo?: EmergencyMedicalInfo;
  physicalLimitations: PhysicalLimitation[];
  disabilityAccommodations: DisabilityAccommodationSettings[];
  lastUpdated: Date;
}

export interface DisabilityAccommodation {
  id: string;
  type: DisabilityType;
  description: string;
  accommodations: AccommodationRequirement[];
  adaptiveEquipment: AdaptiveEquipment[];
  exerciseModifications: ExerciseModification[];
  isTemporary: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface AccommodationRequirement {
  type: AccommodationType;
  description: string;
  equipment?: string[];
  modifications?: string[];
}

export interface AdaptiveEquipment {
  name: string;
  type: string;
  description?: string;
  specifications?: Record<string, any>;
}

export interface ExerciseModification {
  exerciseId: string;
  modificationType: ModificationType;
  description: string;
  alternatives?: string[];
}

export interface ROMRestriction {
  id: string;
  joint: Joint;
  movementPlane: MovementPlane;
  restrictionType: RestrictionType;
  limitationDegrees?: number;
  affectedExercises: string[];
  compensations: string[];
  isTemporary: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface MenstrualCycleSettings {
  trackingEnabled: boolean;
  cycleLength: number;
  lastPeriodStart?: Date;
  symptoms: MenstrualSymptom[];
  trainingAdjustments: CycleTrainingAdjustment[];
  privacyLevel: CyclePrivacyLevel;
  shareWithCoach: boolean;
}

export interface MenstrualSymptom {
  type: SymptomType;
  severity: SeverityLevel;
  cyclePhase: CyclePhase;
  notes?: string;
}

export interface CycleTrainingAdjustment {
  cyclePhase: CyclePhase;
  intensityModifier: number; // 0.5 to 1.5
  volumeModifier: number; // 0.5 to 1.5
  exerciseRestrictions?: string[];
  recommendedFocus?: string[];
}

export interface ChronicCondition {
  name: string;
  diagnosedDate?: Date;
  severity: SeverityLevel;
  medications?: string[];
  exerciseRestrictions?: string[];
  monitoringRequired?: boolean;
  notes?: string;
}

export interface MedicationInfo {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: Date;
  endDate?: Date;
  sideEffects?: string[];
  exerciseInteractions?: string[];
}

export interface AllergyInfo {
  allergen: string;
  severity: SeverityLevel;
  reactions?: string[];
  avoidanceInstructions?: string[];
}

export interface EmergencyMedicalInfo {
  bloodType?: string;
  emergencyContacts: EmergencyContact[];
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  doctorContact?: ContactInfo;
  insuranceInfo?: InsuranceInfo;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
}

export interface ContactInfo {
  name: string;
  phoneNumber: string;
  email?: string;
  address?: Address;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  memberName: string;
  effectiveDate: Date;
  expirationDate?: Date;
}

export interface MedicalInformation {
  bloodType?: string;
  chronicConditions?: string[];
  medications?: string[];
  allergies?: string[];
  surgicalHistory?: SurgicalHistory[];
  familyMedicalHistory?: string[];
  lastPhysicalExam?: Date;
  doctorContact?: ContactInfo;
  insuranceInfo?: InsuranceInfo;
}

export interface SurgicalHistory {
  procedure: string;
  date: Date;
  complications?: string[];
  recoveryNotes?: string;
  affectedMovements?: string[];
}

// ============================================================================
// TRAINING SCHEDULE
// ============================================================================

export interface TrainingSchedule {
  userId: string;
  availableDays: ScheduleDayAvailability[];
  preferredTimes: TimePreference[];
  sessionDuration: SessionDuration;
  restDayPreferences: RestDayPreference[];
  specialConsiderations: ScheduleConsideration[];
  timezone: string;
  lastUpdated: Date;
}

export interface ScheduleDayAvailability {
  dayOfWeek: number; // 0-6, Sunday = 0
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  notes?: string;
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  preference: TimePreferenceLevel;
}

export interface TimePreference {
  timeOfDay: TimeOfDay;
  preference: TimePreferenceLevel;
  notes?: string;
}

export interface SessionDuration {
  preferred: number; // minutes
  minimum: number;
  maximum: number;
  flexibility: FlexibilityLevel;
}

export interface RestDayPreference {
  dayOfWeek: number;
  isPreferred: boolean;
  reason?: string;
}

export interface ScheduleConsideration {
  type: ConsiderationType;
  description: string;
  priority: PriorityLevel;
  affectedDays?: number[];
  affectedTimes?: TimeSlot[];
}

// ============================================================================
// COACH-ATHLETE RELATIONSHIPS
// ============================================================================

export interface RelationshipTransition {
  id: string;
  fromStatus: RelationshipStatus;
  toStatus: RelationshipStatus;
  reason?: string;
  triggeredBy: string;
  triggeredAt: Date;
  metadata?: Record<string, any>;
}
export interface CoachAthleteRelationship {
  id: string;
  coach_id: string;
  athlete_id: string;
  tenant_id: string;
  status: RelationshipStatus;
  permissions: CoachPermission[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
  start_date: Date;
  end_date?: Date;
  created_by?: string;
  terminated_by?: string;
  termination_reason?: string;
  coach_email?: string;
  coach_phone_number?: string;
  athlete_email?: string;
  athlete_phone_number?: string;
  previous_coach_id?: string;
  transition_history: RelationshipTransition[];
  requested_at?: Date;
  requested_by?: string;
  approved_at?: Date;
  approved_by?: string;
  rejected_at?: Date;
  rejected_by?: string;
  rejection_reason?: string;
}

export interface CoachAthleteRelationshipWithAthlete extends CoachAthleteRelationship {
  athlete_firstName: string;
  athlete_lastName: string;
  athlete_role: string;
}

export interface CoachAthleteRelationshipList {
  relationships: CoachAthleteRelationship[];
  total: number;
  page: number;
  limit: number;
}

export interface CoachAthleteRelationshipListWithAthlete {
  relationships: CoachAthleteRelationshipWithAthlete[];
  total: number;
  page: number;
  limit: number;
}

export interface CoachPermission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
  grantedAt: Date;
  grantedBy: string;
}

// ============================================================================
// TRANSITION MANAGEMENT
// ============================================================================

export interface TransitionRequest {
  id: string;
  athleteId: string;
  fromCoachId?: string;
  toCoachId?: string;
  transitionType: TransitionType;
  status: TransitionStatus;
  reason?: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  executedAt?: Date;
  completedAt?: Date;
  rollbackAt?: Date;
  metadata: TransitionMetadata;
  notifications: TransitionNotification[];
  dataTransfer: DataTransferRecord;
}

export interface TransitionMetadata {
  requestedBy: string;
  priority: PriorityLevel;
  estimatedCompletionTime?: Date;
  rollbackPlan?: string;
  communicationPlan?: string;
  stakeholders: string[];
}

export interface TransitionNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  status: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  content: NotificationContent;
}

export interface NotificationContent {
  subject: string;
  body: string;
  actionUrl?: string;
  actionText?: string;
  priority: PriorityLevel;
}

export interface DataTransferRecord {
  transferredData: string[];
  retainedData: string[];
  archivedData: string[];
  accessUpdates: AccessUpdate[];
  completedAt?: Date;
}

export interface AccessUpdate {
  userId: string;
  resource: string;
  oldPermissions: string[];
  newPermissions: string[];
  updatedAt: Date;
}

export interface TransitionResult {
  success: boolean;
  dataTransferred: DataTransferSummary;
  accessUpdated: AccessUpdateSummary;
  notificationsSent: NotificationSummary;
  errors?: TransitionError[];
}

export interface DataTransferSummary {
  totalRecords: number;
  transferredRecords: number;
  failedRecords: number;
  dataTypes: string[];
}

export interface AccessUpdateSummary {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  affectedUsers: string[];
}

export interface NotificationSummary {
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  recipients: string[];
}

export interface TransitionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
}

export interface TransitionHistory {
  id: string;
  athleteId: string;
  transitionType: TransitionType;
  fromCoachId?: string;
  toCoachId?: string;
  status: TransitionStatus;
  completedAt?: Date;
  duration?: number; // milliseconds
  notes?: string;
}

// ============================================================================
// NOTIFICATION & COMMUNICATION
// ============================================================================

export interface NotificationPreferences {
  email: EmailNotificationSettings;
  sms: SMSNotificationSettings;
  inApp: InAppNotificationSettings;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  workoutReminders: boolean;
  progressUpdates: boolean;
  coachMessages: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  frequency: NotificationFrequency;
}

export interface SMSNotificationSettings {
  enabled: boolean;
  emergencyOnly: boolean;
}

export interface InAppNotificationSettings {
  enabled: boolean;
  showBadges: boolean;
  categories: string[];
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AuditFilters {
  userId?: string;
  tenantId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  tenantId?: string;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  totalCoaches: number;
  totalAthletes: number;
  storageUsed: number;
  lastActivity: Date;
  subscriptionStatus: SubscriptionStatus;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateUserRequest {
  email?: string;
  phoneNumber?: string;
  password?: string;
  authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
  role: UserRole;
  tenantId?: string;
  profile: Partial<AthleteProfile>;
  preferences?: Partial<UserPreferences>;
  sendWelcomeEmail?: boolean;
  oauthProviders?: Record<string, any>;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
}

export interface UpdateUserRequest {
  email?: string;
  phoneNumber?: string;
  authMethod?: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
  role?: UserRole;
  status?: UserStatus;
  profile?: Partial<AthleteProfile>;
  preferences?: Partial<UserPreferences>;
  oauthProviders?: Record<string, any>;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
}

export interface CreateTenantRequest {
  name: string;
  plan: string;
  adminEmail: string;
  adminPassword: string;
  settings?: Partial<TenantSettings>;
  billingInfo?: Partial<BillingInfo>;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  status?: TenantStatus;
  contact?: { [key: string]: string };
}

export interface PasswordResetRequest {
  email: string;
  tenantId?: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string; // Optional for OAuth users setting initial password
  newPassword: string;
}

export interface LoginRequest {
  identifier: string; // Can be email or phone number
  password?: string; // Optional for phone-based auth
  authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
  tenantId?: string;
  rememberMe?: boolean;
  verificationToken?: string; // For phone verification
  oauthData?: Record<string, any>; // For OAuth providers
}

export interface PhoneVerificationRequest {
  phoneNumber: string;
  tenantId?: string;
  method: 'SMS' | 'WHATSAPP';
}

export interface PhoneVerificationConfirm {
  phoneNumber: string;
  tenantId?: string;
  token: string;
}

export interface RegisterWithPhoneRequest {
  phoneNumber: string;
  authMethod: 'WHATSAPP' | 'LINE';
  tenantId?: string;
  profile: Partial<AthleteProfile>;
  preferences?: Partial<UserPreferences>;
  verificationToken: string;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
  allSessions?: boolean;
}