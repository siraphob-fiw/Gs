export declare enum DisabilityType {
    MOBILITY = "MOBILITY",
    VISUAL = "VISUAL",
    HEARING = "HEARING",
    COGNITIVE = "COGNITIVE",
    NEUROLOGICAL = "NEUROLOGICAL",
    OTHER = "OTHER"
}
export declare enum RestrictionSeverity {
    MILD = "MILD",
    MODERATE = "MODERATE",
    SEVERE = "SEVERE"
}
export declare enum InjurySeverity {
    MINOR = "MINOR",
    MODERATE = "MODERATE",
    MAJOR = "MAJOR",
    SEVERE = "SEVERE"
}
export declare enum InjuryStatus {
    ACTIVE = "ACTIVE",
    RECOVERING = "RECOVERING",
    RECOVERED = "RECOVERED",
    CHRONIC = "CHRONIC"
}
export declare enum ConditionSeverity {
    MILD = "MILD",
    MODERATE = "MODERATE",
    SEVERE = "SEVERE"
}
export declare enum AllergySeverity {
    MILD = "MILD",
    MODERATE = "MODERATE",
    SEVERE = "SEVERE",
    LIFE_THREATENING = "LIFE_THREATENING"
}
export declare enum SymptomSeverity {
    NONE = "NONE",
    MILD = "MILD",
    MODERATE = "MODERATE",
    SEVERE = "SEVERE"
}
export declare enum SymptomFrequency {
    NEVER = "NEVER",
    RARELY = "RARELY",
    SOMETIMES = "SOMETIMES",
    OFTEN = "OFTEN",
    ALWAYS = "ALWAYS"
}
export declare enum MenstrualPhase {
    MENSTRUAL = "MENSTRUAL",
    FOLLICULAR = "FOLLICULAR",
    OVULATORY = "OVULATORY",
    LUTEAL = "LUTEAL"
}
export declare enum AccommodationType {
    EQUIPMENT_MODIFICATION = "EQUIPMENT_MODIFICATION",
    EXERCISE_ALTERNATIVE = "EXERCISE_ALTERNATIVE",
    ASSISTANCE_REQUIRED = "ASSISTANCE_REQUIRED",
    ENVIRONMENTAL_MODIFICATION = "ENVIRONMENTAL_MODIFICATION"
}
export declare enum ModificationType {
    RANGE_OF_MOTION = "RANGE_OF_MOTION",
    LOAD_REDUCTION = "LOAD_REDUCTION",
    ALTERNATIVE_EXERCISE = "ALTERNATIVE_EXERCISE",
    ASSISTANCE_REQUIRED = "ASSISTANCE_REQUIRED",
    EQUIPMENT_MODIFICATION = "EQUIPMENT_MODIFICATION"
}
export declare enum AdjustmentType {
    INTENSITY = "INTENSITY",
    VOLUME = "VOLUME",
    FREQUENCY = "FREQUENCY",
    EXERCISE_SELECTION = "EXERCISE_SELECTION",
    REST_PERIOD = "REST_PERIOD"
}
export interface HealthConsiderations {
    disabilities: DisabilityAccommodation[];
    rangeOfMotionLimitations: ROMRestriction[];
    menstrualCycleTracking?: MenstrualCycleSettings;
    injuries: InjuryHistory[];
    medications: MedicationInfo[];
    allergies: string[];
    chronicConditions: ChronicCondition[];
    emergencyContact?: EmergencyContact;
}
export interface DisabilityAccommodation {
    id: string;
    type: DisabilityType;
    description: string;
    accommodations: AccommodationDetail[];
    adaptiveEquipment?: AdaptiveEquipment[];
    exerciseModifications: ExerciseModification[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ROMRestriction {
    id: string;
    joint: string;
    restriction: string;
    severity: RestrictionSeverity;
    affectedMovements: string[];
    recommendations: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface MenstrualCycleSettings {
    trackingEnabled: boolean;
    cycleLength: number;
    lastPeriodDate?: Date;
    symptoms: string[];
    programAdjustments: boolean;
}
export interface InjuryHistory {
    id: string;
    type: string;
    description: string;
    dateOccurred: Date;
    severity: InjurySeverity;
    affectedAreas: string[];
    currentStatus: InjuryStatus;
    restrictions: string[];
    recoveryNotes?: string;
}
export interface MedicationInfo {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    purpose: string;
    sideEffects?: string[];
    exerciseInteractions?: string[];
    prescribedBy?: string;
    startDate: Date;
    endDate?: Date;
}
export interface ChronicCondition {
    id: string;
    name: string;
    description: string;
    severity: ConditionSeverity;
    managementStrategy: string[];
    exerciseConsiderations: string[];
    medications: string[];
    diagnosedDate: Date;
}
export interface EmergencyContact {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
    address?: string;
}
export interface AccommodationDetail {
    type: AccommodationType;
    description: string;
    equipment?: string[];
    modifications?: string[];
}
export interface AdaptiveEquipment {
    name: string;
    type: string;
    description: string;
    specifications?: Record<string, any>;
}
export interface ExerciseModification {
    exerciseId: string;
    modificationType: ModificationType;
    description: string;
    alternativeExercises?: string[];
    equipmentRequired?: string[];
}
export interface AllergyInfo {
    id: string;
    allergen: string;
    severity: AllergySeverity;
    symptoms: string[];
    triggers: string[];
    treatment: string;
    emergencyAction?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface EmergencyMedicalInfo {
    bloodType?: string;
    allergies: string[];
    medications: string[];
    medicalConditions: string[];
    emergencyContacts: EmergencyContact[];
    physicianInfo?: PhysicianInfo;
    insuranceInfo?: InsuranceInfo;
    medicalAlerts: string[];
}
export interface MenstrualSymptom {
    id: string;
    name: string;
    severity: SymptomSeverity;
    frequency: SymptomFrequency;
    notes?: string;
}
export interface CycleTrainingAdjustment {
    phase: MenstrualPhase;
    adjustments: TrainingAdjustment[];
    recommendations: string[];
    intensityModifier: number;
}
export interface PhysicianInfo {
    name: string;
    specialty: string;
    phoneNumber: string;
    email?: string;
    address?: string;
}
export interface InsuranceInfo {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    memberName: string;
    effectiveDate: Date;
    expirationDate?: Date;
}
export interface TrainingAdjustment {
    type: AdjustmentType;
    description: string;
    value?: number;
    unit?: string;
}
//# sourceMappingURL=health-types.d.ts.map