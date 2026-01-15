import { UserRole, TrainingGoal, ExperienceLevel, Discipline } from './user-management-enums';
export interface SelfCoachedUser {
    id: string;
    userId: string;
    tenantId: string;
    registrationDate: Date;
    onboardingCompleted: boolean;
    onboardingStep: SelfCoachedOnboardingStep;
    programSelectionPreferences: ProgramSelectionPreferences;
    safetyAcknowledgments: SafetyAcknowledgment[];
    educationalProgress: EducationalProgress;
    independentAccessLevel: IndependentAccessLevel;
    transitionHistory: SelfCoachedTransitionRecord[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum SelfCoachedOnboardingStep {
    PROFILE_SETUP = "PROFILE_SETUP",
    EQUIPMENT_CONFIGURATION = "EQUIPMENT_CONFIGURATION",
    HEALTH_ASSESSMENT = "HEALTH_ASSESSMENT",
    GOAL_SETTING = "GOAL_SETTING",
    PROGRAM_SELECTION = "PROGRAM_SELECTION",
    SAFETY_EDUCATION = "SAFETY_EDUCATION",
    COMPLETED = "COMPLETED"
}
export interface ProgramSelectionPreferences {
    primaryGoals: TrainingGoal[];
    experienceLevel: ExperienceLevel;
    preferredDisciplines: Discipline[];
    timeCommitment: TimeCommitment;
    intensityPreference: IntensityPreference;
    programDuration: ProgramDuration;
    autoProgression: boolean;
    needsGuidance: boolean;
    customizationLevel: CustomizationLevel;
}
export declare enum TimeCommitment {
    MINIMAL = "MINIMAL",// 2-3 sessions per week
    MODERATE = "MODERATE",// 3-4 sessions per week
    HIGH = "HIGH",// 4-5 sessions per week
    MAXIMUM = "MAXIMUM"
}
export declare enum IntensityPreference {
    LOW = "LOW",
    MODERATE = "MODERATE",
    HIGH = "HIGH",
    VARIABLE = "VARIABLE"
}
export declare enum ProgramDuration {
    SHORT = "SHORT",// 4-6 weeks
    MEDIUM = "MEDIUM",// 8-12 weeks
    LONG = "LONG",// 16+ weeks
    ONGOING = "ONGOING"
}
export declare enum CustomizationLevel {
    MINIMAL = "MINIMAL",// Follow templates exactly
    MODERATE = "MODERATE",// Some exercise substitutions
    HIGH = "HIGH",// Significant customization
    FULL = "FULL"
}
export interface SafetyAcknowledgment {
    type: SafetyAcknowledgmentType;
    acknowledged: boolean;
    acknowledgedAt: Date;
    version: string;
    requiresRenewal: boolean;
    renewalDate?: Date;
}
export declare enum SafetyAcknowledgmentType {
    GENERAL_SAFETY = "GENERAL_SAFETY",
    EQUIPMENT_SAFETY = "EQUIPMENT_SAFETY",
    INJURY_PREVENTION = "INJURY_PREVENTION",
    EMERGENCY_PROCEDURES = "EMERGENCY_PROCEDURES",
    FORM_TECHNIQUE = "FORM_TECHNIQUE",
    PROGRESSION_GUIDELINES = "PROGRESSION_GUIDELINES",
    MEDICAL_CLEARANCE = "MEDICAL_CLEARANCE"
}
export interface EducationalProgress {
    completedModules: EducationalModule[];
    currentModule?: string;
    totalProgress: number;
    lastAccessedAt: Date;
    certificationsEarned: string[];
}
export interface EducationalModule {
    id: string;
    name: string;
    category: EducationalCategory;
    completedAt: Date;
    score?: number;
    timeSpent: number;
    retakeCount: number;
}
export declare enum EducationalCategory {
    SAFETY_FUNDAMENTALS = "SAFETY_FUNDAMENTALS",
    EXERCISE_TECHNIQUE = "EXERCISE_TECHNIQUE",
    PROGRAM_DESIGN = "PROGRAM_DESIGN",
    PROGRESSION_PRINCIPLES = "PROGRESSION_PRINCIPLES",
    INJURY_PREVENTION = "INJURY_PREVENTION",
    NUTRITION_BASICS = "NUTRITION_BASICS",
    RECOVERY_METHODS = "RECOVERY_METHODS"
}
export declare enum IndependentAccessLevel {
    RESTRICTED = "RESTRICTED",// Basic templates only
    GUIDED = "GUIDED",// Templates with guidance
    INTERMEDIATE = "INTERMEDIATE",// Some customization allowed
    ADVANCED = "ADVANCED",// Full access with safety checks
    EXPERT = "EXPERT"
}
export interface SelfCoachedProgramTemplate {
    id: string;
    name: string;
    description: string;
    category: ProgramCategory;
    difficulty: ProgramDifficulty;
    duration: number;
    sessionsPerWeek: number;
    targetGoals: TrainingGoal[];
    requiredEquipment: string[];
    prerequisites: ProgramPrerequisite[];
    safetyRating: SafetyRating;
    guidanceLevel: GuidanceLevel;
    customizationOptions: CustomizationOption[];
    educationalContent: EducationalContent[];
    progressionRules: ProgressionRule[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ProgramCategory {
    BEGINNER_FOUNDATION = "BEGINNER_FOUNDATION",
    STRENGTH_BUILDING = "STRENGTH_BUILDING",
    MUSCLE_BUILDING = "MUSCLE_BUILDING",
    POWERLIFTING = "POWERLIFTING",
    GENERAL_FITNESS = "GENERAL_FITNESS",
    REHABILITATION = "REHABILITATION",
    MAINTENANCE = "MAINTENANCE"
}
export declare enum ProgramDifficulty {
    BEGINNER = "BEGINNER",
    NOVICE = "NOVICE",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED"
}
export interface ProgramPrerequisite {
    type: PrerequisiteType;
    description: string;
    required: boolean;
    validationCriteria?: string;
}
export declare enum PrerequisiteType {
    EXPERIENCE_LEVEL = "EXPERIENCE_LEVEL",
    EQUIPMENT_ACCESS = "EQUIPMENT_ACCESS",
    HEALTH_CLEARANCE = "HEALTH_CLEARANCE",
    SAFETY_EDUCATION = "SAFETY_EDUCATION",
    PREVIOUS_PROGRAM = "PREVIOUS_PROGRAM"
}
export declare enum SafetyRating {
    VERY_LOW = "VERY_LOW",
    LOW = "LOW",
    MODERATE = "MODERATE",
    HIGH = "HIGH",
    VERY_HIGH = "VERY_HIGH"
}
export declare enum GuidanceLevel {
    MINIMAL = "MINIMAL",// Basic instructions
    STANDARD = "STANDARD",// Detailed instructions
    COMPREHENSIVE = "COMPREHENSIVE",// Step-by-step guidance
    INTERACTIVE = "INTERACTIVE"
}
export interface CustomizationOption {
    type: CustomizationType;
    name: string;
    description: string;
    allowedValues: string[];
    defaultValue: string;
    safetyImpact: SafetyImpact;
}
export declare enum CustomizationType {
    EXERCISE_SUBSTITUTION = "EXERCISE_SUBSTITUTION",
    VOLUME_ADJUSTMENT = "VOLUME_ADJUSTMENT",
    INTENSITY_MODIFICATION = "INTENSITY_MODIFICATION",
    FREQUENCY_CHANGE = "FREQUENCY_CHANGE",
    REST_PERIOD_ADJUSTMENT = "REST_PERIOD_ADJUSTMENT"
}
export declare enum SafetyImpact {
    NONE = "NONE",
    LOW = "LOW",
    MODERATE = "MODERATE",
    HIGH = "HIGH"
}
export interface EducationalContent {
    id: string;
    title: string;
    type: ContentType;
    content: string;
    mediaUrl?: string;
    duration?: number;
    isRequired: boolean;
    displayOrder: number;
}
export declare enum ContentType {
    TEXT = "TEXT",
    VIDEO = "VIDEO",
    INTERACTIVE = "INTERACTIVE",
    QUIZ = "QUIZ",
    CHECKLIST = "CHECKLIST"
}
export interface ProgressionRule {
    id: string;
    name: string;
    condition: ProgressionCondition;
    action: ProgressionAction;
    safetyChecks: SafetyCheck[];
    isAutomatic: boolean;
}
export interface ProgressionCondition {
    metric: ProgressionMetric;
    operator: ComparisonOperator;
    value: number;
    timeframe?: number;
}
export declare enum ProgressionMetric {
    SESSIONS_COMPLETED = "SESSIONS_COMPLETED",
    WEIGHT_INCREASED = "WEIGHT_INCREASED",
    REPS_COMPLETED = "REPS_COMPLETED",
    RPE_AVERAGE = "RPE_AVERAGE",
    CONSISTENCY_RATE = "CONSISTENCY_RATE"
}
export declare enum ComparisonOperator {
    GREATER_THAN = "GREATER_THAN",
    GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
    LESS_THAN = "LESS_THAN",
    LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
    EQUAL = "EQUAL"
}
export interface ProgressionAction {
    type: ProgressionActionType;
    parameters: Record<string, any>;
    description: string;
}
export declare enum ProgressionActionType {
    INCREASE_WEIGHT = "INCREASE_WEIGHT",
    INCREASE_REPS = "INCREASE_REPS",
    INCREASE_SETS = "INCREASE_SETS",
    ADVANCE_EXERCISE = "ADVANCE_EXERCISE",
    CHANGE_PROGRAM = "CHANGE_PROGRAM"
}
export interface SafetyCheck {
    type: SafetyCheckType;
    description: string;
    isBlocking: boolean;
    warningMessage?: string;
}
export declare enum SafetyCheckType {
    FORM_ASSESSMENT = "FORM_ASSESSMENT",
    INJURY_SCREENING = "INJURY_SCREENING",
    FATIGUE_CHECK = "FATIGUE_CHECK",
    EQUIPMENT_VERIFICATION = "EQUIPMENT_VERIFICATION",
    PROGRESSION_RATE = "PROGRESSION_RATE"
}
export interface SelfCoachedTransitionRecord {
    id: string;
    userId: string;
    transitionType: SelfCoachedTransitionType;
    fromStatus: UserRole;
    toStatus: UserRole;
    requestedAt: Date;
    completedAt?: Date;
    reason?: string;
    coachId?: string;
    dataPreservation: DataPreservationSettings;
    transitionSupport: TransitionSupport;
}
export declare enum SelfCoachedTransitionType {
    INITIAL_REGISTRATION = "INITIAL_REGISTRATION",
    SELF_TO_COACHED = "SELF_TO_COACHED",
    COACHED_TO_SELF = "COACHED_TO_SELF",
    COACH_CHANGE_TO_SELF = "COACH_CHANGE_TO_SELF"
}
export interface DataPreservationSettings {
    preservePrograms: boolean;
    preserveProgress: boolean;
    preservePreferences: boolean;
    preserveHealthData: boolean;
    archiveCoachNotes: boolean;
    retentionPeriod: number;
}
export interface TransitionSupport {
    guidanceProvided: boolean;
    educationalMaterials: string[];
    supportContactInfo?: string;
    followUpScheduled: boolean;
    followUpDate?: Date;
}
export interface SafetyGuardrail {
    id: string;
    name: string;
    category: SafetyCategory;
    triggerConditions: GuardrailTrigger[];
    actions: GuardrailAction[];
    severity: GuardrailSeverity;
    isActive: boolean;
    applicableRoles: UserRole[];
}
export declare enum SafetyCategory {
    EXERCISE_FORM = "EXERCISE_FORM",
    PROGRESSION_RATE = "PROGRESSION_RATE",
    VOLUME_LIMITS = "VOLUME_LIMITS",
    INJURY_PREVENTION = "INJURY_PREVENTION",
    EQUIPMENT_SAFETY = "EQUIPMENT_SAFETY",
    HEALTH_MONITORING = "HEALTH_MONITORING"
}
export interface GuardrailTrigger {
    type: TriggerType;
    condition: string;
    threshold: number;
    timeframe?: number;
}
export declare enum TriggerType {
    WEIGHT_INCREASE = "WEIGHT_INCREASE",
    VOLUME_INCREASE = "VOLUME_INCREASE",
    FREQUENCY_INCREASE = "FREQUENCY_INCREASE",
    PAIN_REPORT = "PAIN_REPORT",
    FATIGUE_LEVEL = "FATIGUE_LEVEL",
    MISSED_SESSIONS = "MISSED_SESSIONS"
}
export interface GuardrailAction {
    type: GuardrailActionType;
    message: string;
    isBlocking: boolean;
    requiresAcknowledgment: boolean;
    educationalContent?: string[];
}
export declare enum GuardrailActionType {
    WARNING = "WARNING",
    RECOMMENDATION = "RECOMMENDATION",
    BLOCK_ACTION = "BLOCK_ACTION",
    REQUIRE_ASSESSMENT = "REQUIRE_ASSESSMENT",
    SUGGEST_COACH = "SUGGEST_COACH",
    MANDATORY_REST = "MANDATORY_REST"
}
export declare enum GuardrailSeverity {
    INFO = "INFO",
    WARNING = "WARNING",
    CRITICAL = "CRITICAL",
    EMERGENCY = "EMERGENCY"
}
export interface CoachSearchCriteria {
    location?: string;
    specializations: Discipline[];
    experienceLevel: ExperienceLevel[];
    languages: string[];
    priceRange?: PriceRange;
    availability: AvailabilityPreference;
    communicationStyle: CommunicationStyle[];
    certifications: string[];
}
export interface PriceRange {
    min: number;
    max: number;
    currency: string;
    period: BillingPeriod;
}
export declare enum BillingPeriod {
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    ANNUALLY = "ANNUALLY"
}
export interface AvailabilityPreference {
    timeZone: string;
    preferredTimes: string[];
    daysOfWeek: number[];
    responseTime: ResponseTimeExpectation;
}
export declare enum ResponseTimeExpectation {
    IMMEDIATE = "IMMEDIATE",// Within hours
    SAME_DAY = "SAME_DAY",
    NEXT_DAY = "NEXT_DAY",
    FLEXIBLE = "FLEXIBLE"
}
export declare enum CommunicationStyle {
    DIRECT = "DIRECT",
    SUPPORTIVE = "SUPPORTIVE",
    ANALYTICAL = "ANALYTICAL",
    MOTIVATIONAL = "MOTIVATIONAL",
    EDUCATIONAL = "EDUCATIONAL"
}
export interface CoachProfile {
    id: string;
    userId: string;
    displayName: string;
    bio: string;
    specializations: Discipline[];
    certifications: Certification[];
    experienceYears: number;
    languages: string[];
    pricing: CoachPricing[];
    availability: CoachAvailability;
    communicationStyle: CommunicationStyle[];
    rating: number;
    reviewCount: number;
    acceptsNewClients: boolean;
    responseRate: number;
    averageResponseTime: number;
}
export interface Certification {
    name: string;
    organization: string;
    obtainedDate: Date;
    expirationDate?: Date;
    verificationStatus: VerificationStatus;
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    EXPIRED = "EXPIRED",
    INVALID = "INVALID"
}
export interface CoachPricing {
    serviceType: ServiceType;
    price: number;
    currency: string;
    period: BillingPeriod;
    description?: string;
}
export declare enum ServiceType {
    PROGRAM_DESIGN = "PROGRAM_DESIGN",
    ONGOING_COACHING = "ONGOING_COACHING",
    FORM_REVIEW = "FORM_REVIEW",
    CONSULTATION = "CONSULTATION",
    NUTRITION_GUIDANCE = "NUTRITION_GUIDANCE"
}
export interface CoachAvailability {
    timeZone: string;
    schedule: AvailabilitySlot[];
    blackoutDates: Date[];
    averageResponseTime: number;
}
export interface AvailabilitySlot {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
}
export interface CreateSelfCoachedUserRequest {
    userId: string;
    programPreferences: Partial<ProgramSelectionPreferences>;
    skipOnboarding?: boolean;
}
export interface UpdateSelfCoachedUserRequest {
    onboardingStep?: SelfCoachedOnboardingStep;
    programPreferences?: Partial<ProgramSelectionPreferences>;
    accessLevel?: IndependentAccessLevel;
    safetyAcknowledgments?: SafetyAcknowledgment[];
}
export interface SelfCoachedTransitionRequest {
    userId: string;
    transitionType: SelfCoachedTransitionType;
    targetCoachId?: string;
    reason?: string;
    dataPreservation: DataPreservationSettings;
    requestSupport?: boolean;
}
export interface ProgramRecommendationRequest {
    userId: string;
    preferences: ProgramSelectionPreferences;
    currentPrograms?: string[];
    excludePrograms?: string[];
}
export interface ProgramRecommendationResponse {
    recommendations: ProgramRecommendation[];
    reasoning: RecommendationReasoning;
    alternatives: ProgramRecommendation[];
}
export interface ProgramRecommendation {
    template: SelfCoachedProgramTemplate;
    matchScore: number;
    reasons: string[];
    warnings?: string[];
    requiredPreparation?: string[];
}
export interface RecommendationReasoning {
    primaryFactors: string[];
    secondaryFactors: string[];
    excludedPrograms: ExcludedProgram[];
}
export interface ExcludedProgram {
    templateId: string;
    templateName: string;
    reason: string;
}
export interface CoachSearchRequest {
    criteria: CoachSearchCriteria;
    limit?: number;
    offset?: number;
    sortBy?: CoachSortOption;
}
export declare enum CoachSortOption {
    RATING = "RATING",
    PRICE = "PRICE",
    EXPERIENCE = "EXPERIENCE",
    RESPONSE_TIME = "RESPONSE_TIME",
    AVAILABILITY = "AVAILABILITY"
}
export interface CoachSearchResponse {
    coaches: CoachProfile[];
    total: number;
    filters: AppliedFilter[];
    suggestions: SearchSuggestion[];
}
export interface AppliedFilter {
    field: string;
    value: any;
    resultCount: number;
}
export interface SearchSuggestion {
    type: SuggestionType;
    message: string;
    action?: string;
}
export declare enum SuggestionType {
    EXPAND_CRITERIA = "EXPAND_CRITERIA",
    ALTERNATIVE_SPECIALIZATION = "ALTERNATIVE_SPECIALIZATION",
    PRICE_ADJUSTMENT = "PRICE_ADJUSTMENT",
    LOCATION_EXPANSION = "LOCATION_EXPANSION"
}
export interface CoachingRequestSubmission {
    athleteId: string;
    coachId: string;
    serviceType: ServiceType;
    message: string;
    preferredStartDate: Date;
    budget?: PriceRange;
    goals: string[];
    experience: string;
}
export interface CoachingRequestResponse {
    requestId: string;
    status: RequestStatus;
    estimatedResponseTime: number;
    nextSteps: string[];
}
export declare enum RequestStatus {
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED"
}
//# sourceMappingURL=self-coached.d.ts.map