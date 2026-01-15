import { DisabilityAccommodation } from "../dist/health-types";

export declare enum BlockType {
    TRAINING = "TRAINING",
    PIVOT = "PIVOT",
    PEAKING = "PEAKING",
    TAPERING = "TAPERING"
}
export declare enum ProgramStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum SessionType {
    MAIN = "MAIN",
    ACCESSORY = "ACCESSORY",
    RECOVERY = "RECOVERY",
    TECHNIQUE = "TECHNIQUE",
    CONDITIONING = "CONDITIONING"
}
export declare enum ProgramInjurySeverity {
    MINOR = "MINOR",
    MODERATE = "MODERATE",
    MAJOR = "MAJOR",
    SEVERE = "SEVERE"
}
export declare enum ProgramInjuryStatus {
    ACTIVE = "ACTIVE",
    RECOVERING = "RECOVERING",
    RESOLVED = "RESOLVED"
}
export declare enum RestrictionType {
    EXCLUDE = "EXCLUDE",
    MODIFY = "MODIFY",
    LIMIT_LOAD = "LIMIT_LOAD",
    LIMIT_ROM = "LIMIT_ROM"
}
export declare enum FatigueLevel {
    GREEN = "GREEN",
    YELLOW = "YELLOW",
    RED = "RED"
}
export declare enum WearableSource {
    WHOOP = "WHOOP",
    OURA = "OURA",
    GARMIN = "GARMIN",
    FITBIT = "FITBIT",
    APPLE_HEALTH = "APPLE_HEALTH",
    MANUAL = "MANUAL"
}
export declare enum AdaptationType {
    INTENSITY = "INTENSITY",
    VOLUME = "VOLUME",
    DELOAD = "DELOAD",
    RECOVERY = "RECOVERY"
}
export declare enum AdaptationUrgency {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare enum CompetitionType {
    POWERLIFTING = "POWERLIFTING",
    WEIGHTLIFTING = "WEIGHTLIFTING",
    STRONGMAN = "STRONGMAN",
    LOCAL = "LOCAL",
    REGIONAL = "REGIONAL",
    NATIONAL = "NATIONAL",
    INTERNATIONAL = "INTERNATIONAL"
}
export declare enum AttemptType {
    OPENER = "OPENER",
    SECOND = "SECOND",
    THIRD = "THIRD"
}
export interface RepRange {
    min: number;
    max: number;
}
export interface IntensityRange {
    min: number;
    max: number;
}
export interface RPERange {
    min: number;
    max: number;
}
export interface TimeConstraint {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    maxDuration: number;
}
export interface ProgramDisabilityAccommodation {
    type: string;
    description: string;
    exerciseRestrictions: string[];
    requiredModifications: string[];
}
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
    competitions: ProgramCompetition[];
    createdAt: Date;
    updatedAt: Date;
}

interface Equipment {
    id: string;
    tenant_id: string;
    name: string;
    type: string;
    availability: 'common_gym' | 'home' | 'specialty_gym';
    category_id?: string;
    specifications?: JSON;
    description?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface AthleteProfile {
    discipline: string;
    experienceLevel: string;
    gender: string;
    birthDate: Date;
    bodyWeight: number;
    availableEquipment: Equipment[];
    trainingFrequency: number;
    goals: string[];
    disabilityAccommodations?: DisabilityAccommodation[];
}
export interface AthletePreferences {
    preferredTrainingTimes: TimeConstraint[];
    maxSessionDuration: number;
    restDayPreferences: number[];
    intensityPreference: 'conservative' | 'moderate' | 'aggressive';
    volumePreference: 'low' | 'moderate' | 'high';
    exerciseVariety: 'minimal' | 'moderate' | 'high';
    autoAdjustments: boolean;
    coachApprovalRequired: boolean;
}
export interface Program {
    id: string;
    athleteId: string;
    templateId: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    status: string;
    blocks: TrainingBlock[];
    adaptations: ProgramAdaptation[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProgramMetadata {
    generatedBy: 'system' | 'coach' | 'template';
    templateVersion?: string;
    generationParameters: Record<string, any>;
    lastAdaptation?: Date;
    totalAdaptations: number;
    averageRPE?: number;
    completionRate?: number;
}
export interface TrainingBlock {
    id: string;
    name: string;
    type: BlockType;
    duration: number;
    sessions: TrainingSession[];
    objectives: string[];
    progressionRules: ProgressionRules;
    volumeTarget: number;
    intensityTarget: IntensityRange;
}
export interface TrainingSession {
    id: string;
    blockId: string;
    dayOfWeek: number;
    exercises: ProgrammedExercise[];
    estimatedDuration: number;
    sessionType: SessionType;
    stressTargets: SessionStress;
    warmupProtocol?: WarmupProtocol;
}
export interface ProgrammedExercise {
    id: string;
    exerciseId: string;
    sets: ExerciseSet[];
    restPeriods: number[];
    notes?: string;
    alternatives?: string[];
    progressionRules: ExerciseProgressionRules;
    stressFactor: number;
}
export interface ExerciseSet {
    setNumber: number;
    reps: number | RepRange;
    intensity: number | IntensityRange;
    rpe?: number | RPERange;
    weight?: number;
    isWarmup: boolean;
    isBackoff: boolean;
    tempo?: string;
}
export interface SessionStress {
    central: number;
    peripheral: number;
    total: number;
    fatigueIndex: number;
}
export interface WarmupProtocol {
    generalWarmup: WarmupExercise[];
    specificWarmup: WarmupExercise[];
    mobilityWork: WarmupExercise[];
    activationWork: WarmupExercise[];
}
export interface WarmupExercise {
    exerciseId: string;
    duration?: number;
    reps?: number;
    sets?: number;
    intensity?: number;
    notes?: string;
}
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
export interface Injury {
    id: string;
    athleteId: string;
    name: string;
    bodyPart: string;
    severity: ProgramInjurySeverity;
    status: ProgramInjuryStatus;
    restrictions: ExerciseRestriction[];
    declaredAt: Date;
    resolvedAt?: Date;
    notes?: string;
}
export interface ExerciseRestriction {
    exerciseId?: string;
    movementPattern?: string;
    restriction: RestrictionType;
    parameters?: RestrictionParameters;
}
export interface RestrictionParameters {
    maxLoad?: number;
    maxROM?: number;
    maxReps?: number;
    requiredModifications?: string[];
    alternativeExercises?: string[];
}
export interface ProgramTemplate {
    id: string;
    name: string;
    discipline: string;
    createdBy: string;
    approvedBy?: string;
    version: string;
    blocks: TemplateBlock[];
    exerciseSelection: ExerciseSelectionRules;
    progressionRules: ProgressionRules;
    metadata: TemplateMetadata;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface TemplateBlock {
    name: string;
    type: BlockType;
    duration: number;
    objectives: string[];
    sessionTemplates: ProgramSessionTemplate[];
    volumeProgression: VolumeProgression;
    intensityProgression: IntensityProgression;
}
export interface ProgramSessionTemplate {
    dayOfWeek: number;
    sessionType: SessionType;
    exercises: TemplateExercise[];
    estimatedDuration: number;
    stressTargets: SessionStress;
}
export interface TemplateExercise {
    exerciseId?: string;
    exerciseCategory?: string;
    movementPattern?: string;
    sets: TemplateSet[];
    restPeriods: number[];
    progressionRules: ExerciseProgressionRules;
    alternatives?: string[];
}
export interface TemplateSet {
    setNumber: number;
    reps: number | RepRange;
    intensity: number | IntensityRange;
    rpe?: number | RPERange;
    isWarmup: boolean;
    isBackoff: boolean;
}
export interface TemplateMetadata {
    targetExperienceLevel: string[];
    estimatedDuration: number;
    requiredEquipment: string[];
    trainingFrequency: number;
    description: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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
    deloadFrequency: number;
}
export interface IntensityProgression {
    type: 'linear' | 'wave' | 'block' | 'autoregulated';
    startingIntensity: number;
    weeklyIncrease: number;
    maxIntensity: number;
    testingFrequency: number;
}
export interface FrequencyProgression {
    startingFrequency: number;
    maxFrequency: number;
    progressionTrigger: 'time' | 'performance' | 'adaptation';
}
export interface DeloadProtocol {
    trigger: 'scheduled' | 'performance' | 'fatigue' | 'rpe';
    volumeReduction: number;
    intensityReduction: number;
    duration: number;
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
export interface ExerciseSelectionRules {
    primaryMovements: MovementRequirement[];
    accessoryMovements: MovementRequirement[];
    volumeDistribution: VolumeDistribution;
    equipmentConstraints: EquipmentConstraint[];
    injuryConsiderations: InjuryConsideration[];
}
export interface MovementRequirement {
    movementPattern: string;
    minFrequency: number;
    maxFrequency: number;
    intensityRange: IntensityRange;
    volumeRange: RepRange;
    priority: 'required' | 'preferred' | 'optional';
}
export interface VolumeDistribution {
    primaryMovements: number;
    accessoryMovements: number;
    conditioningWork: number;
    mobilityWork: number;
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
    loadLimitations: number;
}
export interface Injury {
    id: string;
    athleteId: string;
    name: string;
    bodyPart: string;
    severity: ProgramInjurySeverity;
    status: ProgramInjuryStatus;
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
    maxLoad?: number;
    maxReps?: number;
    maxSets?: number;
    rangeOfMotionLimit?: number;
    modificationInstructions?: string;
    duration?: number;
}
export interface ProgramCompetition {
    id: string;
    name: string;
    date: Date;
    type: CompetitionType;
    location: string;
    discipline: string;
    weightClass?: number;
    registrationDeadline?: Date;
    isTarget: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CompetitionPlan {
    competitionId: string;
    athleteId: string;
    peakingBlocks: TrainingBlock[];
    taperProtocol: TaperProtocol;
    attemptStrategy: AttemptStrategy;
    timeline: PeakingTimeline;
}
export interface TaperProtocol {
    duration: number;
    volumeReduction: number;
    intensityMaintenance: number;
    frequencyReduction: number;
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
    percentage: number;
    confidence: number;
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
export interface ProgramAdaptation {
    id: string;
    programId: string;
    athleteId: string;
    type: AdaptationType;
    reason: string;
    changes: AdaptationChange[];
    appliedAt: Date;
    approvedBy?: string;
    urgency: AdaptationUrgency;
    requiresApproval: boolean;
    metadata: AdaptationMetadata;
}
export interface AdaptationChange {
    target: 'session' | 'exercise' | 'block' | 'program';
    targetId: string;
    property: string;
    oldValue: any;
    newValue: any;
    reasoning: string;
}
export interface AdaptationMetadata {
    triggerData: Record<string, any>;
    confidence: number;
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
export interface ProgramEquipment {
    id: string;
    name: string;
    type: string;
    specifications: EquipmentSpecifications;
    availability: EquipmentAvailability;
    condition: string;
    lastMaintenance?: Date;
    notes?: string;
}
export interface EquipmentSpecifications {
    weightRange?: {
        min: number;
        max: number;
    };
    increments?: number[];
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    capacity?: number;
    features?: string[];
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
export interface ProgramConstraints {
    availableEquipment: ProgramEquipment[];
    injuryRestrictions: InjuryRestriction[];
    timeConstraints: TimeConstraint[];
    experienceLevel: string;
    genderSpecificModifications: boolean;
    disabilityAccommodations?: ProgramDisabilityAccommodation[];
    coachPreferences?: CoachPreferences;
}
export interface InjuryRestriction {
    injuryId: string;
    restrictedExercises: string[];
    restrictedMovements: string[];
    loadLimitations: number;
    alternatives: string[];
}
export interface CoachPreferences {
    exercisePreferences: string[];
    methodologyPreferences: string[];
    progressionStyle: 'conservative' | 'moderate' | 'aggressive';
    autoAdjustmentLimits: AutoAdjustmentLimits;
}
export interface AutoAdjustmentLimits {
    maxVolumeIncrease: number;
    maxIntensityIncrease: number;
    maxFrequencyChange: number;
    requireApprovalThreshold: number;
}
//# sourceMappingURL=program-generation.d.ts.map