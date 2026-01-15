// Validation Schemas for User Management & Multi-Tenancy
// Comprehensive Zod schemas for data validation

import { z } from 'zod';
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
  ErrorType,
  ValidationErrorCode,
  SupportedLanguage,
  DateFormat,
  TimeFormat,
} from './user-management-enums';

import {
  PaymentMethodType,
  PaymentProviderType,
  PaymentStatus,
  SubscriptionStatus,
  InvoiceStatus,
  RefundStatus,
  Currency,
  Region,
} from './payment-processing';

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

export const EmailSchema = z.string().email('Invalid email format');
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const PhoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const URLSchema = z.string().url('Invalid URL format');
export const DateSchema = z.coerce.date();
export const PositiveNumberSchema = z.number().positive('Must be a positive number');
export const NonNegativeNumberSchema = z.number().min(0, 'Must be non-negative');

// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().length(2, 'Country must be a 2-letter code'),
});

export const BillingAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().length(2, 'Country must be a 2-letter code'),
});

// ============================================================================
// USER MANAGEMENT SCHEMAS
// ============================================================================

export const UserRoleSchema = z.nativeEnum(UserRole);
export const UserStatusSchema = z.nativeEnum(UserStatus);
export const GenderSchema = z.nativeEnum(Gender);
export const WeightUnitSchema = z.nativeEnum(WeightUnit);
export const ExperienceLevelSchema = z.nativeEnum(ExperienceLevel);
export const DisciplineSchema = z.nativeEnum(Discipline);
export const TrainingGoalSchema = z.nativeEnum(TrainingGoal);

export const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phoneNumber: PhoneNumberSchema,
  email: EmailSchema.optional(),
  isPrimary: z.boolean(),
});

export const ContactInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: PhoneNumberSchema,
  email: EmailSchema.optional(),
  address: AddressSchema.optional(),
});

export const InsuranceInfoSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  groupNumber: z.string().optional(),
  memberName: z.string().min(1, 'Member name is required'),
  effectiveDate: DateSchema,
  expirationDate: DateSchema.optional(),
});

export const MedicalInformationSchema = z.object({
  bloodType: z.string().optional(),
  chronicConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  surgicalHistory: z.array(z.object({
    procedure: z.string().min(1, 'Procedure is required'),
    date: DateSchema,
    complications: z.array(z.string()).optional(),
    recoveryNotes: z.string().optional(),
    affectedMovements: z.array(z.string()).optional(),
  })).optional(),
  familyMedicalHistory: z.array(z.string()).optional(),
  lastPhysicalExam: DateSchema.optional(),
  doctorContact: ContactInfoSchema.optional(),
  insuranceInfo: InsuranceInfoSchema.optional(),
});

export const AthleteProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: DateSchema,
  gender: GenderSchema,
  bodyWeight: PositiveNumberSchema,
  height: PositiveNumberSchema,
  experienceLevel: ExperienceLevelSchema,
  disciplines: z.array(DisciplineSchema).min(1, 'At least one discipline is required'),
  goals: z.array(TrainingGoalSchema).min(1, 'At least one goal is required'),
  emergencyContact: EmergencyContactSchema.optional(),
  medicalInformation: MedicalInformationSchema.optional(),
});

export const NotificationPreferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    workoutReminders: z.boolean(),
    progressUpdates: z.boolean(),
    coachMessages: z.boolean(),
    systemUpdates: z.boolean(),
    marketingEmails: z.boolean(),
    frequency: z.nativeEnum(NotificationFrequency),
  }),
  push: z.object({
    enabled: z.boolean(),
    workoutReminders: z.boolean(),
    coachMessages: z.boolean(),
    systemAlerts: z.boolean(),
    quietHours: z.object({
      enabled: z.boolean(),
      startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      timezone: z.string(),
      daysOfWeek: z.array(z.number().min(0).max(6)),
    }),
  }),
  sms: z.object({
    enabled: z.boolean(),
    emergencyOnly: z.boolean(),
    phoneNumber: PhoneNumberSchema.optional(),
    verifiedAt: DateSchema.optional(),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    showBadges: z.boolean(),
    playSound: z.boolean(),
    categories: z.array(z.object({
      type: z.nativeEnum(NotificationType),
      enabled: z.boolean(),
      priority: z.nativeEnum(PriorityLevel),
    })),
  }),
});

export const PrivacySettingsSchema = z.object({
  profileVisibility: z.nativeEnum(ProfileVisibility),
  showProgress: z.boolean(),
  showWorkouts: z.boolean(),
  allowMessaging: z.boolean(),
  dataSharing: z.object({
    shareWithCoach: z.boolean(),
    shareForResearch: z.boolean(),
    shareForMarketing: z.boolean(),
    shareAggregated: z.boolean(),
    thirdPartyIntegrations: z.boolean(),
  }),
  consentGiven: z.array(z.object({
    type: z.nativeEnum(ConsentType),
    given: z.boolean(),
    timestamp: DateSchema,
    version: z.string(),
    ipAddress: z.string().ip(),
  })),
});

export const AccessibilitySettingsSchema = z.object({
  screenReader: z.boolean(),
  highContrast: z.boolean(),
  largeText: z.boolean(),
  reducedMotion: z.boolean(),
  keyboardNavigation: z.boolean(),
  voiceControl: z.boolean(),
  customizations: z.array(z.object({
    feature: z.string(),
    enabled: z.boolean(),
    configuration: z.record(z.any()).optional(),
  })),
});

export const UserPreferencesSchema = z.object({
  language: z.nativeEnum(SupportedLanguage),
  weightUnit: WeightUnitSchema,
  dateFormat: z.nativeEnum(DateFormat),
  timeFormat: z.nativeEnum(TimeFormat),
  timezone: z.string(),
  notifications: NotificationPreferencesSchema,
  privacy: PrivacySettingsSchema,
  accessibility: AccessibilitySettingsSchema,
});

// ============================================================================
// EQUIPMENT & TRAINING SCHEMAS
// ============================================================================

export const DimensionsSchema = z.object({
  length: PositiveNumberSchema,
  width: PositiveNumberSchema,
  height: PositiveNumberSchema.optional(),
  unit: z.enum(['cm', 'in', 'm', 'ft']),
});

export const EquipmentSpecsSchema = z.object({
  maxWeight: PositiveNumberSchema.optional(),
  dimensions: DimensionsSchema.optional(),
  adjustableHeight: z.boolean().optional(),
  safetyFeatures: z.array(z.string()).optional(),
  accessories: z.array(z.string()).optional(),
});

export const EquipmentSchema = z.object({
  type: z.nativeEnum(EquipmentType),
  brand: z.string().optional(),
  model: z.string().optional(),
  specifications: EquipmentSpecsSchema,
  condition: z.nativeEnum(EquipmentCondition),
  limitations: z.array(z.string()),
  lastMaintenance: DateSchema.optional(),
});

export const PlateInventorySchema = z.object({
  weight: PositiveNumberSchema,
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  material: z.nativeEnum(PlateMaterial),
  type: z.nativeEnum(PlateType),
});

export const FractionalPlateSetSchema = z.object({
  has0_25kg: z.boolean(),
  has0_5kg: z.boolean(),
  has1_25lbs: z.boolean(),
  has2_5lbs: z.boolean(),
  customFractionals: z.array(PositiveNumberSchema),
});

export const PlateConfigurationSchema = z.object({
  unit: WeightUnitSchema,
  barWeight: PositiveNumberSchema,
  availablePlates: z.array(PlateInventorySchema).min(1, 'At least one plate type is required'),
  hasCollars: z.boolean(),
  collarWeight: NonNegativeNumberSchema,
  loadingPins: z.boolean(),
  fractionalPlates: FractionalPlateSetSchema,
});

export const TimeRestrictionSchema = z.object({
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  description: z.string().optional(),
});

export const SpaceConstraintsSchema = z.object({
  ceilingHeight: PositiveNumberSchema.optional(),
  floorSpace: DimensionsSchema.optional(),
  noiseRestrictions: z.boolean().optional(),
  timeRestrictions: z.array(TimeRestrictionSchema).optional(),
});

export const EquipmentProfileSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  availableEquipment: z.array(EquipmentSchema),
  plateConfiguration: PlateConfigurationSchema,
  spaceConstraints: SpaceConstraintsSchema.optional(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// ============================================================================
// HEALTH & ACCESSIBILITY SCHEMAS
// ============================================================================

export const AccommodationRequirementSchema = z.object({
  type: z.nativeEnum(DisabilityType),
  description: z.string().min(1, 'Description is required'),
  equipment: z.array(z.string()).optional(),
  modifications: z.array(z.string()).optional(),
});

export const AdaptiveEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  specifications: z.record(z.any()).optional(),
});

export const ExerciseModificationSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  modificationType: z.string().min(1, 'Modification type is required'),
  description: z.string().min(1, 'Description is required'),
  alternatives: z.array(z.string()).optional(),
});

export const DisabilityAccommodationSchema = z.object({
  type: z.nativeEnum(DisabilityType),
  description: z.string().min(1, 'Description is required'),
  accommodations: z.array(AccommodationRequirementSchema),
  adaptiveEquipment: z.array(AdaptiveEquipmentSchema),
  exerciseModifications: z.array(ExerciseModificationSchema),
  isTemporary: z.boolean(),
  startDate: DateSchema,
  endDate: DateSchema.optional(),
});

export const ROMRestrictionSchema = z.object({
  joint: z.nativeEnum(Joint),
  movementPlane: z.nativeEnum(MovementPlane),
  restrictionType: z.nativeEnum(RestrictionType),
  limitationDegrees: z.number().min(0).max(360).optional(),
  affectedExercises: z.array(z.string()),
  compensations: z.array(z.string()),
  isTemporary: z.boolean(),
  startDate: DateSchema,
  endDate: DateSchema.optional(),
});

export const MenstrualSymptomSchema = z.object({
  type: z.string().min(1, 'Symptom type is required'),
  severity: z.nativeEnum(SeverityLevel),
  cyclePhase: z.nativeEnum(CyclePhase),
  notes: z.string().optional(),
});

export const CycleTrainingAdjustmentSchema = z.object({
  cyclePhase: z.nativeEnum(CyclePhase),
  intensityModifier: z.number().min(0.1).max(2.0),
  volumeModifier: z.number().min(0.1).max(2.0),
  exerciseRestrictions: z.array(z.string()).optional(),
  recommendedFocus: z.array(z.string()).optional(),
});

export const MenstrualCycleSettingsSchema = z.object({
  trackingEnabled: z.boolean(),
  cycleLength: z.number().int().min(21).max(35),
  lastPeriodStart: DateSchema.optional(),
  symptoms: z.array(MenstrualSymptomSchema),
  trainingAdjustments: z.array(CycleTrainingAdjustmentSchema),
  privacyLevel: z.nativeEnum(CyclePrivacyLevel),
  shareWithCoach: z.boolean(),
});

export const ChronicConditionSchema = z.object({
  name: z.string().min(1, 'Condition name is required'),
  diagnosedDate: DateSchema.optional(),
  severity: z.nativeEnum(SeverityLevel),
  medications: z.array(z.string()).optional(),
  exerciseRestrictions: z.array(z.string()).optional(),
  monitoringRequired: z.boolean().optional(),
  notes: z.string().optional(),
});

export const MedicationInfoSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  sideEffects: z.array(z.string()).optional(),
  exerciseInteractions: z.array(z.string()).optional(),
});

export const AllergyInfoSchema = z.object({
  allergen: z.string().min(1, 'Allergen is required'),
  severity: z.nativeEnum(SeverityLevel),
  reactions: z.array(z.string()).optional(),
  avoidanceInstructions: z.array(z.string()).optional(),
});

export const EmergencyMedicalInfoSchema = z.object({
  bloodType: z.string().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).min(1, 'At least one emergency contact is required'),
  medicalConditions: z.array(z.string()),
  medications: z.array(z.string()),
  allergies: z.array(z.string()),
  doctorContact: ContactInfoSchema.optional(),
  insuranceInfo: InsuranceInfoSchema.optional(),
});

export const HealthConsiderationsSchema = z.object({
  disabilities: z.array(DisabilityAccommodationSchema),
  rangeOfMotionLimitations: z.array(ROMRestrictionSchema),
  menstrualCycleTracking: MenstrualCycleSettingsSchema.optional(),
  chronicConditions: z.array(ChronicConditionSchema),
  medications: z.array(MedicationInfoSchema),
  allergies: z.array(AllergyInfoSchema),
  emergencyMedicalInfo: EmergencyMedicalInfoSchema.optional(),
  lastUpdated: DateSchema,
});

// ============================================================================
// TRAINING SCHEDULE SCHEMAS
// ============================================================================

export const TimeSlotSchema = z.object({
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  preference: z.nativeEnum(TimePreferenceLevel),
});

export const DayAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isAvailable: z.boolean(),
  timeSlots: z.array(TimeSlotSchema),
  notes: z.string().optional(),
});

export const TimePreferenceSchema = z.object({
  timeOfDay: z.nativeEnum(TimeOfDay),
  preference: z.nativeEnum(TimePreferenceLevel),
  notes: z.string().optional(),
});

export const SessionDurationSchema = z.object({
  preferred: z.number().int().positive('Preferred duration must be positive'),
  minimum: z.number().int().positive('Minimum duration must be positive'),
  maximum: z.number().int().positive('Maximum duration must be positive'),
  flexibility: z.nativeEnum(FlexibilityLevel),
});

export const RestDayPreferenceSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isPreferred: z.boolean(),
  reason: z.string().optional(),
});

export const ScheduleConsiderationSchema = z.object({
  type: z.nativeEnum(ConsiderationType),
  description: z.string().min(1, 'Description is required'),
  priority: z.nativeEnum(PriorityLevel),
  affectedDays: z.array(z.number().min(0).max(6)).optional(),
  affectedTimes: z.array(TimeSlotSchema).optional(),
});

export const TrainingScheduleSchema = z.object({
  userId: UUIDSchema,
  availableDays: z.array(DayAvailabilitySchema).length(7, 'Must specify availability for all 7 days'),
  preferredTimes: z.array(TimePreferenceSchema),
  sessionDuration: SessionDurationSchema,
  restDayPreferences: z.array(RestDayPreferenceSchema),
  specialConsiderations: z.array(ScheduleConsiderationSchema),
  timezone: z.string(),
  lastUpdated: DateSchema,
});

// ============================================================================
// TENANT MANAGEMENT SCHEMAS
// ============================================================================

export const BrandingSettingsSchema = z.object({
  logoUrl: URLSchema.optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  customDomain: z.string().optional(),
  companyName: z.string().optional(),
});

export const ComplianceSettingsSchema = z.object({
  gdprEnabled: z.boolean(),
  pdpaEnabled: z.boolean(),
  hipaaEnabled: z.boolean(),
  consentRequired: z.boolean(),
});

export const TenantSettingsSchema = z.object({
  allowSelfCoached: z.boolean(),
  requireCoachApproval: z.boolean(),
  enableVideoAnalysis: z.boolean(),
  defaultLanguage: z.nativeEnum(SupportedLanguage),
  availableLanguages: z.array(z.nativeEnum(SupportedLanguage)).min(1, 'At least one language is required'),
  maxCoaches: z.number().int().positive(),
  maxAthletes: z.number().int().positive(),
  customBranding: BrandingSettingsSchema.optional(),
  complianceSettings: ComplianceSettingsSchema,
});

export const UsageMetricsSchema = z.object({
  activeCoaches: NonNegativeNumberSchema,
  activeAthletes: NonNegativeNumberSchema,
  storageUsed: NonNegativeNumberSchema,
  apiCalls: NonNegativeNumberSchema,
  videoAnalysisMinutes: NonNegativeNumberSchema,
});

export const SubscriptionInfoSchema = z.object({
  id: UUIDSchema,
  planId: z.string().min(1, 'Plan ID is required'),
  status: z.nativeEnum(SubscriptionStatus),
  currentPeriodStart: DateSchema,
  currentPeriodEnd: DateSchema,
  cancelAtPeriodEnd: z.boolean(),
  trialEnd: DateSchema.optional(),
  usage: UsageMetricsSchema,
});

export const BillingInfoSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  paymentMethodId: z.string().optional(),
  billingAddress: BillingAddressSchema.optional(),
  taxId: z.string().optional(),
  currency: z.nativeEnum(Currency),
  nextBillingDate: DateSchema,
  lastPaymentDate: DateSchema.optional(),
  outstandingBalance: z.number(),
});

export const TenantSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, 'Tenant name is required'),
  domain: z.string().optional(),
  status: z.nativeEnum(TenantStatus),
  settings: TenantSettingsSchema,
  subscription: SubscriptionInfoSchema,
  billing: BillingInfoSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
  suspendedAt: DateSchema.optional(),
});

// ============================================================================
// TRANSITION MANAGEMENT SCHEMAS
// ============================================================================

export const TransitionMetadataSchema = z.object({
  requestedBy: UUIDSchema,
  priority: z.nativeEnum(PriorityLevel),
  estimatedCompletionTime: DateSchema.optional(),
  rollbackPlan: z.string().optional(),
  communicationPlan: z.string().optional(),
  stakeholders: z.array(UUIDSchema),
});

export const NotificationContentSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  actionUrl: URLSchema.optional(),
  actionText: z.string().optional(),
  priority: z.nativeEnum(PriorityLevel),
});

export const TransitionNotificationSchema = z.object({
  id: UUIDSchema,
  recipientId: UUIDSchema,
  type: z.nativeEnum(NotificationType),
  status: z.nativeEnum(NotificationStatus),
  sentAt: DateSchema.optional(),
  readAt: DateSchema.optional(),
  content: NotificationContentSchema,
});

export const AccessUpdateSchema = z.object({
  userId: UUIDSchema,
  resource: z.string().min(1, 'Resource is required'),
  oldPermissions: z.array(z.string()),
  newPermissions: z.array(z.string()),
  updatedAt: DateSchema,
});

export const DataTransferRecordSchema = z.object({
  transferredData: z.array(z.string()),
  retainedData: z.array(z.string()),
  archivedData: z.array(z.string()),
  accessUpdates: z.array(AccessUpdateSchema),
  completedAt: DateSchema.optional(),
});

export const TransitionRequestSchema = z.object({
  id: UUIDSchema,
  athleteId: UUIDSchema,
  fromCoachId: UUIDSchema.optional(),
  toCoachId: UUIDSchema.optional(),
  transitionType: z.nativeEnum(TransitionType),
  status: z.nativeEnum(TransitionStatus),
  reason: z.string().optional(),
  approvalRequired: z.boolean(),
  approvedBy: UUIDSchema.optional(),
  approvedAt: DateSchema.optional(),
  executedAt: DateSchema.optional(),
  completedAt: DateSchema.optional(),
  rollbackAt: DateSchema.optional(),
  metadata: TransitionMetadataSchema,
  notifications: z.array(TransitionNotificationSchema),
  dataTransfer: DataTransferRecordSchema,
});

// ============================================================================
// AUTHENTICATION & AUTHORIZATION SCHEMAS
// ============================================================================

export const AuthCredentialsSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  tenantId: UUIDSchema.optional(),
});

export const PermissionConditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.nativeEnum(ConditionOperator),
  value: z.any(),
});

export const PermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  actions: z.array(z.string()).min(1, 'At least one action is required'),
  conditions: z.array(PermissionConditionSchema).optional(),
});

export const SecurityEventSchema = z.object({
  userId: UUIDSchema,
  tenantId: UUIDSchema,
  eventType: z.nativeEnum(SecurityEventType),
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  success: z.boolean(),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  timestamp: DateSchema,
  metadata: z.record(z.any()).optional(),
});

export const UserSessionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  expiresAt: DateSchema,
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  isActive: z.boolean(),
  createdAt: DateSchema,
  lastUsedAt: DateSchema,
});

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreateUserRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  role: UserRoleSchema,
  tenantId: UUIDSchema,
  profile: AthleteProfileSchema.partial(),
  preferences: UserPreferencesSchema.partial().optional(),
  sendWelcomeEmail: z.boolean().optional(),
});

export const UpdateUserRequestSchema = z.object({
  email: EmailSchema.optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  profile: AthleteProfileSchema.partial().optional(),
  preferences: UserPreferencesSchema.partial().optional(),
});

export const CreateTenantRequestSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  domain: z.string().optional(),
  adminEmail: EmailSchema,
  adminPassword: PasswordSchema,
  settings: TenantSettingsSchema.partial().optional(),
  billingInfo: BillingInfoSchema.partial().optional(),
});

export const UpdateTenantRequestSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').optional(),
  domain: z.string().optional(),
  status: z.nativeEnum(TenantStatus).optional(),
  settings: TenantSettingsSchema.partial().optional(),
});

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
  tenantId: UUIDSchema.optional(),
  rememberMe: z.boolean().optional(),
});

export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
  tenantId: UUIDSchema.optional(),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: PasswordSchema,
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: PasswordSchema,
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const LogoutRequestSchema = z.object({
  refreshToken: z.string().optional(),
  allSessions: z.boolean().optional(),
});

// ============================================================================
// PAYMENT PROCESSING SCHEMAS
// ============================================================================

export const PaymentMethodDetailsSchema = z.object({
  // PromptPay fields
  promptPayId: z.string().optional(),
  promptPayType: z.enum(['PHONE', 'ID_CARD', 'E_WALLET']).optional(),
  promptPayName: z.string().optional(),

  // Bank Transfer fields
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  branchCode: z.string().optional(),

  // Credit/Debit Card fields
  last4: z.string().length(4).optional(),
  brand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(new Date().getFullYear()).optional(),
  fingerprint: z.string().optional(),
  funding: z.enum(['CREDIT', 'DEBIT', 'PREPAID', 'UNKNOWN']).optional(),
  country: z.string().length(2).optional(),

  // Digital Wallet fields
  walletType: z.string().optional(),
  walletId: z.string().optional(),
  walletEmail: EmailSchema.optional(),

  // Cryptocurrency fields
  cryptoType: z.string().optional(),
  walletAddress: z.string().optional(),
  network: z.string().optional(),

  // Common fields
  displayName: z.string().min(1, 'Display name is required'),
  nickname: z.string().optional(),
  billingAddress: BillingAddressSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export const PaymentMethodSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  type: z.nativeEnum(PaymentMethodType),
  details: PaymentMethodDetailsSchema,
  isDefault: z.boolean(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  expiresAt: DateSchema.optional(),
});

export const PaymentRequestSchema = z.object({
  tenantId: UUIDSchema,
  amount: PositiveNumberSchema,
  currency: z.nativeEnum(Currency),
  paymentMethodId: UUIDSchema,
  description: z.string().optional(),
  statementDescriptor: z.string().max(22).optional(),
  receiptEmail: EmailSchema.optional(),
  metadata: z.record(z.any()).optional(),
  idempotencyKey: z.string().optional(),
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const UserFiltersSchema = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  tenantId: UUIDSchema.optional(),
  search: z.string().optional(),
  createdAfter: DateSchema.optional(),
  createdBefore: DateSchema.optional(),
  lastLoginAfter: DateSchema.optional(),
  lastLoginBefore: DateSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const AuditFiltersSchema = z.object({
  userId: UUIDSchema.optional(),
  tenantId: UUIDSchema.optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.object({
    type: z.nativeEnum(ErrorType),
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    timestamp: DateSchema,
    requestId: z.string(),
    userId: UUIDSchema.optional(),
    tenantId: UUIDSchema.optional(),
  }),
});

export const ValidationErrorSchema = z.object({
  field: z.string(),
  code: z.nativeEnum(ValidationErrorCode),
  message: z.string(),
  value: z.any().optional(),
});

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const ValidationSchemas = {
  // Common
  Email: EmailSchema,
  Password: PasswordSchema,
  PhoneNumber: PhoneNumberSchema,
  UUID: UUIDSchema,
  URL: URLSchema,
  Date: DateSchema,
  PositiveNumber: PositiveNumberSchema,
  NonNegativeNumber: NonNegativeNumberSchema,
  Address: AddressSchema,
  BillingAddress: BillingAddressSchema,

  // User Management
  UserRole: UserRoleSchema,
  UserStatus: UserStatusSchema,
  Gender: GenderSchema,
  WeightUnit: WeightUnitSchema,
  AthleteProfile: AthleteProfileSchema,
  UserPreferences: UserPreferencesSchema,
  NotificationPreferences: NotificationPreferencesSchema,
  PrivacySettings: PrivacySettingsSchema,
  AccessibilitySettings: AccessibilitySettingsSchema,

  // Equipment & Training
  Equipment: EquipmentSchema,
  EquipmentProfile: EquipmentProfileSchema,
  PlateConfiguration: PlateConfigurationSchema,
  TrainingSchedule: TrainingScheduleSchema,

  // Health & Accessibility
  HealthConsiderations: HealthConsiderationsSchema,
  DisabilityAccommodation: DisabilityAccommodationSchema,
  ROMRestriction: ROMRestrictionSchema,
  MenstrualCycleSettings: MenstrualCycleSettingsSchema,

  // Tenant Management
  Tenant: TenantSchema,
  TenantSettings: TenantSettingsSchema,
  SubscriptionInfo: SubscriptionInfoSchema,
  BillingInfo: BillingInfoSchema,

  // Transitions
  TransitionRequest: TransitionRequestSchema,
  TransitionMetadata: TransitionMetadataSchema,

  // Authentication
  AuthCredentials: AuthCredentialsSchema,
  Permission: PermissionSchema,
  SecurityEvent: SecurityEventSchema,
  UserSession: UserSessionSchema,

  // Requests/Responses
  CreateUserRequest: CreateUserRequestSchema,
  UpdateUserRequest: UpdateUserRequestSchema,
  CreateTenantRequest: CreateTenantRequestSchema,
  UpdateTenantRequest: UpdateTenantRequestSchema,
  LoginRequest: LoginRequestSchema,
  PasswordResetRequest: PasswordResetRequestSchema,
  PasswordResetConfirm: PasswordResetConfirmSchema,
  ChangePasswordRequest: ChangePasswordRequestSchema,

  // Payment Processing
  PaymentMethod: PaymentMethodSchema,
  PaymentRequest: PaymentRequestSchema,

  // Filters
  UserFilters: UserFiltersSchema,
  AuditFilters: AuditFiltersSchema,

  // Errors
  ErrorResponse: ErrorResponseSchema,
  ValidationError: ValidationErrorSchema,
} as const;