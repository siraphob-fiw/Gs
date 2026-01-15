import { Program, ProgramTemplate, Athlete, AthleteProfile, HealthMetrics, FatigueStatus, ProgramCompetition, CompetitionPlan, ProgramAdaptation, AdaptationRecommendation, PerformanceData, SessionStress, Injury, InjuryRestriction, ProgramConstraints, AttemptRecommendation, PeakingTimeline, WearableSource } from './program-generation';
export interface ProgramGenerationRequest {
    athleteId: string;
    templateId: string;
    startDate: Date;
    endDate?: Date;
    competitionDate?: Date;
    customizations?: TemplateCustomizations;
    constraints: ProgramConstraints;
}
export interface TemplateCustomizations {
    exerciseSubstitutions?: ExerciseSubstitution[];
    volumeAdjustments?: VolumeAdjustment[];
    intensityAdjustments?: IntensityAdjustment[];
    frequencyAdjustments?: FrequencyAdjustment[];
    blockModifications?: BlockModification[];
}
export interface ExerciseSubstitution {
    originalExerciseId: string;
    replacementExerciseId: string;
    reason: string;
}
export interface VolumeAdjustment {
    target: 'program' | 'block' | 'exercise';
    targetId: string;
    adjustment: number;
    reason: string;
}
export interface IntensityAdjustment {
    target: 'program' | 'block' | 'exercise';
    targetId: string;
    adjustment: number;
    reason: string;
}
export interface FrequencyAdjustment {
    exerciseId: string;
    newFrequency: number;
    reason: string;
}
export interface BlockModification {
    blockId: string;
    modifications: {
        duration?: number;
        objectives?: string[];
        volumeTarget?: number;
        intensityTarget?: {
            min: number;
            max: number;
        };
    };
    reason: string;
}
export interface GeneratedProgram {
    program: Program;
    metadata: GenerationMetadata;
    warnings: GenerationWarning[];
    recommendations: string[];
}
export interface GenerationMetadata {
    templateUsed: string;
    generationTime: Date;
    algorithmsUsed: string[];
    dataSourcesUsed: string[];
    confidence: number;
    estimatedEffectiveness: number;
}
export interface GenerationWarning {
    type: 'constraint' | 'data' | 'safety' | 'effectiveness';
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedComponents: string[];
    recommendations: string[];
}
export interface ValidationResult {
    isValid: boolean;
    errors: ProgramValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
}
export interface ProgramValidationError {
    code: string;
    message: string;
    field: string;
    severity: 'error' | 'warning';
}
export interface ValidationWarning {
    code: string;
    message: string;
    field: string;
    impact: string;
}
export interface ValidationSuggestion {
    type: 'improvement' | 'alternative' | 'optimization';
    message: string;
    expectedBenefit: string;
}
export interface CustomizedProgram {
    program: Program;
    appliedCustomizations: TemplateCustomizations;
    rejectedCustomizations: RejectedCustomization[];
    metadata: GenerationMetadata;
}
export interface RejectedCustomization {
    customization: any;
    reason: string;
    alternatives?: any[];
}
export interface TemplateSearchCriteria {
    discipline?: string;
    experienceLevel?: string;
    duration?: {
        min: number;
        max: number;
    };
    trainingFrequency?: number;
    requiredEquipment?: string[];
    tags?: string[];
    createdBy?: string;
    isPublic?: boolean;
    approved?: boolean;
}
export interface TemplateCreationRequest {
    name: string;
    discipline: string;
    blocks: TemplateBlockRequest[];
    exerciseSelection: ExerciseSelectionRulesRequest;
    progressionRules: ProgressionRulesRequest;
    metadata: TemplateMetadataRequest;
    isPublic: boolean;
}
export interface TemplateBlockRequest {
    name: string;
    type: string;
    duration: number;
    objectives: string[];
    sessionTemplates: SessionTemplateRequest[];
    volumeProgression: VolumeProgressionRequest;
    intensityProgression: IntensityProgressionRequest;
}
export interface SessionTemplateRequest {
    dayOfWeek: number;
    sessionType: string;
    exercises: TemplateExerciseRequest[];
    estimatedDuration: number;
    stressTargets: SessionStressRequest;
}
export interface TemplateExerciseRequest {
    exerciseId?: string;
    exerciseCategory?: string;
    movementPattern?: string;
    sets: TemplateSetRequest[];
    restPeriods: number[];
    progressionRules: ExerciseProgressionRulesRequest;
    alternatives?: string[];
}
export interface TemplateSetRequest {
    setNumber: number;
    reps: number | {
        min: number;
        max: number;
    };
    intensity: number | {
        min: number;
        max: number;
    };
    rpe?: number | {
        min: number;
        max: number;
    };
    isWarmup: boolean;
    isBackoff: boolean;
}
export interface SessionStressRequest {
    central: number;
    peripheral: number;
    total: number;
    fatigueIndex: number;
}
export interface ExerciseSelectionRulesRequest {
    primaryMovements: MovementRequirementRequest[];
    accessoryMovements: MovementRequirementRequest[];
    volumeDistribution: VolumeDistributionRequest;
    equipmentConstraints: EquipmentConstraintRequest[];
    injuryConsiderations: InjuryConsiderationRequest[];
}
export interface MovementRequirementRequest {
    movementPattern: string;
    minFrequency: number;
    maxFrequency: number;
    intensityRange: {
        min: number;
        max: number;
    };
    volumeRange: {
        min: number;
        max: number;
    };
    priority: 'required' | 'preferred' | 'optional';
}
export interface VolumeDistributionRequest {
    primaryMovements: number;
    accessoryMovements: number;
    conditioningWork: number;
    mobilityWork: number;
}
export interface EquipmentConstraintRequest {
    equipmentId: string;
    required: boolean;
    alternatives?: string[];
}
export interface InjuryConsiderationRequest {
    injuryType: string;
    restrictedMovements: string[];
    recommendedAlternatives: string[];
    loadLimitations: number;
}
export interface ProgressionRulesRequest {
    volumeProgression: VolumeProgressionRequest;
    intensityProgression: IntensityProgressionRequest;
    frequencyProgression: FrequencyProgressionRequest;
    deloadProtocol: DeloadProtocolRequest;
}
export interface VolumeProgressionRequest {
    type: 'linear' | 'wave' | 'block' | 'autoregulated';
    startingVolume: number;
    weeklyIncrease: number;
    maxVolume: number;
    deloadFrequency: number;
}
export interface IntensityProgressionRequest {
    type: 'linear' | 'wave' | 'block' | 'autoregulated';
    startingIntensity: number;
    weeklyIncrease: number;
    maxIntensity: number;
    testingFrequency: number;
}
export interface FrequencyProgressionRequest {
    startingFrequency: number;
    maxFrequency: number;
    progressionTrigger: 'time' | 'performance' | 'adaptation';
}
export interface DeloadProtocolRequest {
    trigger: 'scheduled' | 'performance' | 'fatigue' | 'rpe';
    volumeReduction: number;
    intensityReduction: number;
    duration: number;
}
export interface ExerciseProgressionRulesRequest {
    loadProgression: LoadProgressionRequest;
    volumeProgression: VolumeProgressionRequest;
    substitutionRules: SubstitutionRulesRequest;
}
export interface LoadProgressionRequest {
    type: 'percentage' | 'absolute' | 'rpe_based';
    increment: number;
    maxAttempts: number;
    failureProtocol: 'deload' | 'substitute' | 'maintain';
}
export interface SubstitutionRulesRequest {
    triggers: string[];
    alternatives: string[];
    selectionCriteria: string[];
}
export interface TemplateMetadataRequest {
    targetExperienceLevel: string[];
    estimatedDuration: number;
    requiredEquipment: string[];
    trainingFrequency: number;
    description: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
export interface HealthDataImportRequest {
    athleteId: string;
    source: WearableSource;
    startDate: Date;
    endDate: Date;
    dataTypes: string[];
}
export interface HealthDataImportResponse {
    success: boolean;
    recordsImported: number;
    errors: ImportError[];
    warnings: ImportWarning[];
    summary: HealthDataSummary;
}
export interface ImportError {
    timestamp: Date;
    dataType: string;
    error: string;
    rawData?: any;
}
export interface ImportWarning {
    timestamp: Date;
    dataType: string;
    warning: string;
    impact: string;
}
export interface HealthDataSummary {
    totalRecords: number;
    dateRange: {
        start: Date;
        end: Date;
    };
    dataTypes: string[];
    averageValues: Record<string, number>;
    trends: HealthTrend[];
}
export interface HealthTrend {
    metric: string;
    direction: 'improving' | 'declining' | 'stable';
    magnitude: number;
    confidence: number;
}
export interface FatigueCalculationRequest {
    athleteId: string;
    date?: Date;
    includeProjection?: boolean;
    projectionDays?: number;
}
export interface FatigueCalculationResponse {
    current: FatigueStatus;
    historical: HistoricalFatigue[];
    projection?: FatigueProjection[];
    recommendations: FatigueRecommendation[];
}
export interface HistoricalFatigue {
    date: Date;
    fatigueStatus: FatigueStatus;
    contributingFactors: string[];
}
export interface FatigueProjection {
    date: Date;
    predictedFatigue: FatigueStatus;
    confidence: number;
    assumptions: string[];
}
export interface FatigueRecommendation {
    type: 'training' | 'recovery' | 'lifestyle';
    priority: 'low' | 'medium' | 'high';
    recommendation: string;
    expectedBenefit: string;
    timeframe: string;
}
export interface PerformanceFeedbackRequest {
    sessionData: SessionPerformanceData;
    athleteId: string;
    programId: string;
}
export interface SessionPerformanceData {
    sessionId: string;
    completedExercises: CompletedExerciseData[];
    sessionRPE: number;
    sessionDuration: number;
    notes?: string;
    missedExercises?: MissedExerciseData[];
}
export interface CompletedExerciseData {
    exerciseId: string;
    plannedSets: PlannedSetData[];
    completedSets: CompletedSetData[];
    overallRPE: number;
    notes?: string;
}
export interface PlannedSetData {
    setNumber: number;
    plannedReps: number;
    plannedWeight: number;
    plannedRPE?: number;
}
export interface CompletedSetData {
    setNumber: number;
    actualReps: number;
    actualWeight: number;
    actualRPE: number;
    completed: boolean;
    notes?: string;
}
export interface MissedExerciseData {
    exerciseId: string;
    reason: string;
    plannedSets: PlannedSetData[];
}
export interface ProgramAdjustmentRequest {
    athleteId: string;
    programId: string;
    adjustments: ProgramAdjustmentData[];
    reason: string;
    requiresApproval?: boolean;
}
export interface ProgramAdjustmentData {
    target: 'session' | 'exercise' | 'block' | 'program';
    targetId: string;
    adjustmentType: string;
    adjustmentValue: any;
    reasoning: string;
}
export interface PerformanceAlert {
    id: string;
    athleteId: string;
    type: 'performance_decline' | 'overreaching' | 'injury_risk' | 'plateau';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    data: Record<string, any>;
    recommendations: string[];
    requiresAction: boolean;
    createdAt: Date;
}
export interface CompetitionPlanRequest {
    competitionId: string;
    athleteId: string;
    currentProgramId?: string;
    preferences: CompetitionPreferences;
}
export interface CompetitionPreferences {
    peakingStrategy: 'conservative' | 'moderate' | 'aggressive';
    attemptStrategy: 'safe' | 'balanced' | 'ambitious';
    priorityLifts?: string[];
    riskTolerance: 'low' | 'medium' | 'high';
}
export interface PeakingTimelineRequest {
    competitionDate: Date;
    currentDate: Date;
    athleteProfile: AthleteProfile;
    currentPerformance: CurrentPerformanceData;
}
export interface CurrentPerformanceData {
    recentMaxes: ExerciseMax[];
    recentPerformance: PerformanceData[];
    currentFatigue: FatigueStatus;
    injuryStatus: Injury[];
}
export interface ExerciseMax {
    exerciseId: string;
    weight: number;
    date: Date;
    rpe?: number;
    confidence: number;
}
export interface AttemptRecommendationRequest {
    athleteId: string;
    competitionId: string;
    exerciseId: string;
    recentPerformance: PerformanceData[];
    targetDate: Date;
}
export interface CompetitionAnalysisRequest {
    competitionId: string;
    athleteId: string;
    results: CompetitionResultData;
}
export interface CompetitionResultData {
    attempts: AttemptResult[];
    placement?: number;
    totalScore?: number;
    bodyWeight?: number;
    weightClass?: string;
    notes?: string;
}
export interface AttemptResult {
    exerciseId: string;
    attemptNumber: number;
    weight: number;
    successful: boolean;
    rpe?: number;
    notes?: string;
}
export interface PerformanceAnalysis {
    competitionId: string;
    athleteId: string;
    overallPerformance: OverallPerformanceMetrics;
    liftAnalysis: LiftAnalysis[];
    comparisonToPredictions: PredictionComparison[];
    recommendations: PostCompetitionRecommendation[];
    nextSteps: string[];
}
export interface OverallPerformanceMetrics {
    totalScore: number;
    wilksScore?: number;
    placement?: number;
    personalRecords: number;
    successRate: number;
    averageRPE: number;
}
export interface LiftAnalysis {
    exerciseId: string;
    attempts: AttemptAnalysis[];
    bestLift: number;
    improvement: number;
    technicalNotes: string[];
    recommendations: string[];
}
export interface AttemptAnalysis {
    attemptNumber: number;
    weight: number;
    successful: boolean;
    predictedSuccess: number;
    actualVsPredicted: number;
    technicalExecution: string;
}
export interface PredictionComparison {
    exerciseId: string;
    predictedMax: number;
    actualMax: number;
    accuracy: number;
    factors: string[];
}
export interface PostCompetitionRecommendation {
    category: 'training' | 'technique' | 'strategy' | 'recovery';
    priority: 'low' | 'medium' | 'high';
    recommendation: string;
    timeframe: string;
    expectedBenefit: string;
}
export interface ProgramGenerationService {
    generateProgram(request: ProgramGenerationRequest): Promise<GeneratedProgram>;
    customizeTemplate(templateId: string, customizations: TemplateCustomizations): Promise<CustomizedProgram>;
    validateProgramConstraints(program: Program, athlete: Athlete): Promise<ValidationResult>;
    regenerateProgram(programId: string, reason: string): Promise<GeneratedProgram>;
    previewProgramChanges(programId: string, changes: TemplateCustomizations): Promise<GeneratedProgram>;
}
export interface TemplateManagementService {
    createTemplate(template: TemplateCreationRequest): Promise<string>;
    updateTemplate(templateId: string, updates: Partial<ProgramTemplate>): Promise<void>;
    getTemplatesByDiscipline(discipline: string): Promise<ProgramTemplate[]>;
    searchTemplates(criteria: TemplateSearchCriteria): Promise<ProgramTemplate[]>;
    approveTemplate(templateId: string, approverId: string): Promise<void>;
    rejectTemplate(templateId: string, approverId: string, reason: string): Promise<void>;
    duplicateTemplate(templateId: string, modifications?: Partial<ProgramTemplate>): Promise<string>;
    archiveTemplate(templateId: string, reason: string): Promise<void>;
    getTemplateVersions(templateId: string): Promise<ProgramTemplate[]>;
}
export interface HealthIntegrationService {
    processHealthMetrics(athleteId: string, metrics: HealthMetrics): Promise<FatigueStatus>;
    importWearableData(request: HealthDataImportRequest): Promise<HealthDataImportResponse>;
    calculateFatigueStatus(request: FatigueCalculationRequest): Promise<FatigueCalculationResponse>;
    getInjuryRestrictions(athleteId: string): Promise<InjuryRestriction[]>;
    updateInjuryStatus(injuryId: string, status: string, notes?: string): Promise<void>;
    addManualHealthEntry(athleteId: string, entry: any): Promise<void>;
    getHealthTrends(athleteId: string, startDate: Date, endDate: Date): Promise<HealthTrend[]>;
}
export interface AdaptationService {
    processPerformanceFeedback(request: PerformanceFeedbackRequest): Promise<AdaptationRecommendation>;
    applyAutomaticAdjustments(request: ProgramAdjustmentRequest): Promise<void>;
    calculateSessionStress(session: any): Promise<SessionStress>;
    flagConcerningPatterns(athleteId: string): Promise<PerformanceAlert[]>;
    reviewAdaptationHistory(athleteId: string, programId: string): Promise<ProgramAdaptation[]>;
    revertAdaptation(adaptationId: string, reason: string): Promise<void>;
    approveAdaptation(adaptationId: string, approverId: string): Promise<void>;
    rejectAdaptation(adaptationId: string, approverId: string, reason: string): Promise<void>;
}
export interface CompetitionPlanningService {
    createCompetitionPlan(request: CompetitionPlanRequest): Promise<CompetitionPlan>;
    calculatePeakingTimeline(request: PeakingTimelineRequest): Promise<PeakingTimeline>;
    generateAttemptRecommendations(request: AttemptRecommendationRequest): Promise<AttemptRecommendation[]>;
    analyzeCompetitionPerformance(request: CompetitionAnalysisRequest): Promise<PerformanceAnalysis>;
    updateCompetitionPlan(planId: string, updates: Partial<CompetitionPlan>): Promise<void>;
    getCompetitionHistory(athleteId: string): Promise<ProgramCompetition[]>;
    predictCompetitionOutcome(planId: string): Promise<CompetitionPrediction>;
}
export interface CompetitionPrediction {
    competitionId: string;
    athleteId: string;
    predictedAttempts: AttemptRecommendation[];
    predictedTotal: number;
    predictedPlacement: {
        min: number;
        max: number;
        most_likely: number;
    };
    confidence: number;
    factors: PredictionFactor[];
}
export interface PredictionFactor {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: number;
    description: string;
}
//# sourceMappingURL=program-generation-services.d.ts.map