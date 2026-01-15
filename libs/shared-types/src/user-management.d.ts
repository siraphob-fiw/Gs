import { UserRole, UserStatus, TenantStatus, TransitionType, TransitionStatus, Gender, WeightUnit, ExperienceLevel, Discipline, TrainingGoal, DisabilityType, Joint, MovementPlane, RestrictionType, SeverityLevel, CyclePhase, CyclePrivacyLevel, SymptomType, EquipmentType, EquipmentCondition, PlateMaterial, PlateType, TimeOfDay, TimePreferenceLevel, FlexibilityLevel, ConsiderationType, PriorityLevel, RelationshipStatus, NotificationType, NotificationStatus, NotificationFrequency, ProfileVisibility, ConsentType, SecurityEventType, ConditionOperator, AccommodationType, ModificationType, AuditEventType, SecuritySeverity, SecurityCategory, SecurityEventStatus } from './user-management-enums';
import { SubscriptionStatus } from './payment-processing';
export interface TrainingPreferences {
    availability: TrainingAvailability;
    scheduling: SchedulingPreferences;
    sessionPreferences: SessionPreferences;
    autoAdjustments: AutoAdjustmentSettings;
    coachingPreferences: CoachingPreferences;
}
export interface TrainingAvailability {
    weeklySchedule: WeeklyAvailability;
    timeZone: string;
    flexibilityLevel: FlexibilityLevel;
    advanceNotice: number;
    blackoutDates: DateRange[];
    seasonalAdjustments: SeasonalAdjustment[];
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
    timeSlots: AvailableTimeSlot[];
    preferredTimes: TimeOfDay[];
    maxSessions: number;
    notes?: string;
}
export interface AvailableTimeSlot {
    startTime: string;
    endTime: string;
    preference: TimePreferenceLevel;
    equipmentProfileId?: string;
}
export interface DateRange {
    startDate: Date;
    endDate: Date;
    reason?: string;
}
export interface SeasonalAdjustment {
    name: string;
    startDate: string;
    endDate: string;
    adjustments: {
        frequencyMultiplier: number;
        intensityMultiplier: number;
        preferredTimes?: TimeOfDay[];
        equipmentRestrictions?: string[];
    };
}
export interface SchedulingPreferences {
    preferredSessionDuration: number;
    minSessionDuration: number;
    maxSessionDuration: number;
    preferredRestDays: number[];
    minRestBetweenSessions: number;
    maxConsecutiveTrainingDays: number;
    preferredTrainingFrequency: number;
    allowBackToBackSessions: boolean;
    preferredTimeOfDay: TimeOfDay[];
    avoidTimeSlots: AvoidTimeSlot[];
}
export interface AvoidTimeSlot {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    reason: string;
    severity: 'PREFER_AVOID' | 'STRONGLY_AVOID' | 'NEVER';
}
export interface SessionPreferences {
    warmupDuration: number;
    cooldownDuration: number;
    restTimerPreferences: RestTimerSettings;
    musicPreferences: MusicPreferences;
    environmentPreferences: EnvironmentPreferences;
    trackingPreferences: TrackingPreferences;
}
export interface RestTimerSettings {
    enabled: boolean;
    defaultRestTime: number;
    autoStart: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    customRestTimes: {
        compound: number;
        isolation: number;
        cardio: number;
        stretching: number;
    };
}
export interface MusicPreferences {
    enabled: boolean;
    preferredGenres: string[];
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    allowExplicit: boolean;
    volumeLevel: number;
}
export interface EnvironmentPreferences {
    preferredTemperature: number;
    lightingPreference: 'BRIGHT' | 'MODERATE' | 'DIM';
    noiseLevel: 'QUIET' | 'MODERATE' | 'ENERGETIC';
    crowdPreference: 'AVOID_CROWDS' | 'MODERATE' | 'SOCIAL';
    airQualityRequirements: string[];
}
export interface TrackingPreferences {
    trackRPE: boolean;
    trackHeartRate: boolean;
    trackCalories: boolean;
    trackVolume: boolean;
    trackTempo: boolean;
    trackRestTimes: boolean;
    autoLogSets: boolean;
    requirePhotos: boolean;
    shareProgressWithCoach: boolean;
    publicProgressSharing: boolean;
}
export interface AutoAdjustmentSettings {
    enabled: boolean;
    adjustmentSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
    adjustmentTypes: {
        intensity: boolean;
        volume: boolean;
        frequency: boolean;
        exerciseSelection: boolean;
        restPeriods: boolean;
    };
    triggerConditions: {
        rpeThreshold: number;
        consecutiveHighRPE: number;
        consecutiveLowRPE: number;
        missedSessionThreshold: number;
        injuryRiskScore: number;
    };
    maxAdjustmentPercentage: number;
    requireCoachApproval: boolean;
}
export interface CoachingPreferences {
    communicationStyle: 'DIRECT' | 'ENCOURAGING' | 'ANALYTICAL' | 'FLEXIBLE';
    feedbackFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'AS_NEEDED';
    motivationStyle: 'COMPETITIVE' | 'SUPPORTIVE' | 'GOAL_ORIENTED' | 'PROCESS_FOCUSED';
    preferredContactMethods: ('EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' | 'PHONE')[];
    availableForContact: AvailableTimeSlot[];
    emergencyContactPreference: 'EMAIL' | 'SMS' | 'PHONE';
}
export interface EquipmentPreferences {
    defaultEquipmentProfile: string;
    equipmentPriorities: EquipmentPriority[];
    maintenanceReminders: MaintenanceReminder[];
    safetyPreferences: SafetyPreferences;
    upgradeWishlist: EquipmentWishlistItem[];
}
export interface EquipmentPriority {
    equipmentType: EquipmentType;
    priority: PriorityLevel;
    reason?: string;
    alternatives?: string[];
}
export interface MaintenanceReminder {
    equipmentId: string;
    reminderType: 'INSPECTION' | 'CLEANING' | 'CALIBRATION' | 'REPLACEMENT';
    frequency: number;
    lastPerformed?: Date;
    nextDue: Date;
    notes?: string;
}
export interface SafetyPreferences {
    requireSpotter: boolean;
    maxWeightWithoutSpotter: number;
    safetyEquipmentRequired: string[];
    emergencyProcedures: EmergencyProcedure[];
    riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}
export interface EmergencyProcedure {
    scenario: string;
    steps: string[];
    emergencyContacts: string[];
    equipmentRequired?: string[];
}
export interface EquipmentWishlistItem {
    equipmentType: EquipmentType;
    brand?: string;
    model?: string;
    priority: PriorityLevel;
    estimatedCost?: number;
    targetAcquisitionDate?: Date;
    reason: string;
}
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
    averageCycleLength: number;
    averagePeriodLength: number;
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
        intensityModifier: number;
        volumeModifier: number;
        frequencyModifier: number;
        exerciseRestrictions: string[];
        recommendedExercises: string[];
        restPeriodModifier: number;
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
    rangeOfMotion: number;
    normalRange: number;
    limitation?: string;
    improvementExercises: string[];
}
export interface PostureAssessment {
    overallScore: number;
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
    dailyTarget: number;
    preWorkout: number;
    duringWorkout: number;
    postWorkout: number;
    electrolyteNeeds: boolean;
}
export interface MealTimingPreference {
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'PRE_WORKOUT' | 'POST_WORKOUT';
    preferredTime: string;
    macroTargets?: {
        carbs: number;
        protein: number;
        fat: number;
    };
}
export interface SleepProfile {
    averageSleepDuration: number;
    preferredBedtime: string;
    preferredWakeTime: string;
    sleepQualityRating: number;
    sleepDisorders: string[];
    sleepEnvironmentPreferences: SleepEnvironmentPreferences;
    sleepHygienePractices: string[];
}
export interface SleepEnvironmentPreferences {
    idealTemperature: number;
    lightLevel: 'COMPLETE_DARKNESS' | 'DIM' | 'MODERATE';
    noiseLevel: 'SILENT' | 'WHITE_NOISE' | 'NATURE_SOUNDS';
    mattressFirmness: 'SOFT' | 'MEDIUM' | 'FIRM';
    pillowType: string;
}
export interface StressProfile {
    stressLevel: number;
    stressTriggers: string[];
    copingMechanisms: string[];
    stressManagementTechniques: string[];
    workLifeBalance: number;
    socialSupport: number;
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
    functionalCapacity: number;
    painLevel?: number;
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
    effectiveness: number;
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
    effectiveness: number;
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
export interface User {
    id: string;
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
    weightUnit: WeightUnit;
    dateFormat: string;
    timeFormat: string;
    timezone: string;
    notifications: NotificationPreferences;
    privacy: PrivacySettings;
    accessibility: AccessibilitySettings;
    training: TrainingPreferences;
    equipment: EquipmentPreferences;
}
export interface AuthCredentials {
    identifier: string;
    password?: string;
    authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
    verificationToken?: string;
    oauthData?: Record<string, any>;
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
    timestamp?: Date;
    resource?: string;
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
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt: Date;
}
export interface Tenant {
    id: string;
    name: string;
    status: TenantStatus;
    settings: TenantSettings;
    subscription: SubscriptionInfo;
    billing: BillingInfo;
    users: User[];
    createdAt: Date;
    updatedAt: Date;
    suspendedAt?: Date;
}
export interface TenantSettings {
    allowSelfCoached: boolean;
    requireCoachApproval: boolean;
    enableVideoAnalysis: boolean;
    enableAIFeedback: boolean;
    defaultLanguage: string;
    availableLanguages: string[];
    maxCoaches: number;
    maxAthletes: number;
    features: FeatureFlag[];
    customBranding?: BrandingSettings;
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
    usage: UsageMetrics;
}
export interface BillingInfo {
    customerId: string;
    paymentMethodId?: string;
    billingAddress?: Address;
    taxId?: string;
    currency: string;
    nextBillingDate: Date;
    lastPaymentDate?: Date;
    outstandingBalance: number;
}
export interface UsageMetrics {
    activeCoaches: number;
    activeAthletes: number;
    storageUsed: number;
    apiCalls: number;
    videoAnalysisMinutes: number;
}
export interface FeatureFlag {
    name: string;
    enabled: boolean;
    configuration?: Record<string, any>;
}
export interface BrandingSettings {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    companyName?: string;
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
    intensityModifier: number;
    volumeModifier: number;
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
    dayOfWeek: number;
    isAvailable: boolean;
    timeSlots: TimeSlot[];
    notes?: string;
}
export interface TimeSlot {
    startTime: string;
    endTime: string;
    preference: TimePreferenceLevel;
}
export interface TimePreference {
    timeOfDay: TimeOfDay;
    preference: TimePreferenceLevel;
    notes?: string;
}
export interface SessionDuration {
    preferred: number;
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
export interface CoachAthleteRelationship {
    id: string;
    coachId: string;
    athleteId: string;
    tenantId: string;
    status: RelationshipStatus;
    permissions: CoachPermission[];
    startDate: Date;
    endDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CoachPermission {
    resource: string;
    actions: string[];
    conditions?: PermissionCondition[];
    grantedAt: Date;
    grantedBy: string;
}
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
    duration?: number;
    notes?: string;
}
export interface NotificationPreferences {
    email: EmailNotificationSettings;
    push: PushNotificationSettings;
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
export interface PushNotificationSettings {
    enabled: boolean;
    workoutReminders: boolean;
    coachMessages: boolean;
    systemAlerts: boolean;
    quietHours: QuietHours;
}
export interface SMSNotificationSettings {
    enabled: boolean;
    emergencyOnly: boolean;
    phoneNumber?: string;
    verifiedAt?: Date;
}
export interface InAppNotificationSettings {
    enabled: boolean;
    showBadges: boolean;
    playSound: boolean;
    categories: NotificationCategory[];
}
export interface QuietHours {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeek: number[];
}
export interface NotificationCategory {
    type: NotificationType;
    enabled: boolean;
    priority: PriorityLevel;
}
export interface PrivacySettings {
    profileVisibility: ProfileVisibility;
    showProgress: boolean;
    showWorkouts: boolean;
    allowMessaging: boolean;
    dataSharing: DataSharingSettings;
    consentGiven: ConsentRecord[];
}
export interface DataSharingSettings {
    shareWithCoach: boolean;
    shareForResearch: boolean;
    shareForMarketing: boolean;
    shareAggregated: boolean;
    thirdPartyIntegrations: boolean;
}
export interface ConsentRecord {
    type: ConsentType;
    given: boolean;
    timestamp: Date;
    version: string;
    ipAddress: string;
}
export interface AccessibilitySettings {
    screenReader: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
    voiceControl: boolean;
    customizations: AccessibilityCustomization[];
}
export interface AccessibilityCustomization {
    feature: string;
    enabled: boolean;
    configuration?: Record<string, any>;
}
export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export interface AuditFilters {
    userId?: string;
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
export interface CreateUserRequest {
    email?: string;
    phoneNumber?: string;
    password?: string;
    authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
    role: UserRole;
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
    domain?: string;
    adminEmail: string;
    adminPassword: string;
    settings?: Partial<TenantSettings>;
    billingInfo?: Partial<BillingInfo>;
}
export interface UpdateTenantRequest {
    name?: string;
    domain?: string;
    status?: TenantStatus;
    settings?: Partial<TenantSettings>;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface LoginRequest {
    identifier: string;
    password?: string;
    authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
    rememberMe?: boolean;
    verificationToken?: string;
    oauthData?: Record<string, any>;
}
export interface PhoneVerificationRequest {
    phoneNumber: string;
    method: 'SMS' | 'WHATSAPP';
}
export interface PhoneVerificationConfirm {
    phoneNumber: string;
    token: string;
}
export interface RegisterWithPhoneRequest {
    phoneNumber: string;
    authMethod: 'WHATSAPP' | 'LINE';
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
