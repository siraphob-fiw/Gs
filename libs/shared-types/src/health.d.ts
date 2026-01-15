import { SeverityLevel } from './enums';
export interface InjuryRecord {
    id: string;
    userId: string;
    type: InjuryType;
    location: string;
    description: string;
    severity: SeverityLevel;
    dateOfInjury: Date;
    dateReported: Date;
    status: InjuryStatus;
    affectedMovements: string[];
    treatmentPlan?: string;
    expectedRecoveryDate?: Date;
    actualRecoveryDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MedicalClearance {
    id: string;
    userId: string;
    providerId: string;
    providerName: string;
    clearanceType: ClearanceType;
    restrictions: string[];
    validFrom: Date;
    validUntil?: Date;
    notes?: string;
    documentUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface HealthMetric {
    id: string;
    userId: string;
    type: HealthMetricType;
    value: number;
    unit: string;
    recordedAt: Date;
    notes?: string;
    source: MetricSource;
    createdAt: Date;
}
export interface WellnessCheck {
    id: string;
    userId: string;
    date: Date;
    overallFeeling: number;
    energyLevel: number;
    stressLevel: number;
    sleepQuality: number;
    sleepHours: number;
    hydrationLevel: number;
    nutritionQuality: number;
    soreness: SorenessRating[];
    notes?: string;
    createdAt: Date;
}
export interface SorenessRating {
    bodyPart: string;
    severity: number;
    type: SorenessType;
}
export interface HealthAlert {
    id: string;
    userId: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    triggeredBy: string;
    triggeredAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}
export declare enum InjuryType {
    ACUTE = "ACUTE",
    CHRONIC = "CHRONIC",
    OVERUSE = "OVERUSE",
    TRAUMATIC = "TRAUMATIC"
}
export declare enum InjuryStatus {
    ACTIVE = "ACTIVE",
    RECOVERING = "RECOVERING",
    RESOLVED = "RESOLVED",
    CHRONIC = "CHRONIC"
}
export declare enum ClearanceType {
    FULL_CLEARANCE = "FULL_CLEARANCE",
    RESTRICTED_ACTIVITY = "RESTRICTED_ACTIVITY",
    MODIFIED_ACTIVITY = "MODIFIED_ACTIVITY",
    NO_ACTIVITY = "NO_ACTIVITY"
}
export declare enum HealthMetricType {
    HEART_RATE_RESTING = "HEART_RATE_RESTING",
    HEART_RATE_MAX = "HEART_RATE_MAX",
    BLOOD_PRESSURE_SYSTOLIC = "BLOOD_PRESSURE_SYSTOLIC",
    BLOOD_PRESSURE_DIASTOLIC = "BLOOD_PRESSURE_DIASTOLIC",
    BODY_WEIGHT = "BODY_WEIGHT",
    BODY_FAT_PERCENTAGE = "BODY_FAT_PERCENTAGE",
    MUSCLE_MASS = "MUSCLE_MASS",
    BONE_DENSITY = "BONE_DENSITY",
    VO2_MAX = "VO2_MAX",
    FLEXIBILITY_SCORE = "FLEXIBILITY_SCORE"
}
export declare enum MetricSource {
    MANUAL_ENTRY = "MANUAL_ENTRY",
    WEARABLE_DEVICE = "WEARABLE_DEVICE",
    MEDICAL_TEST = "MEDICAL_TEST",
    FITNESS_ASSESSMENT = "FITNESS_ASSESSMENT"
}
export declare enum SorenessType {
    MUSCLE_FATIGUE = "MUSCLE_FATIGUE",
    JOINT_STIFFNESS = "JOINT_STIFFNESS",
    SHARP_PAIN = "SHARP_PAIN",
    DULL_ACHE = "DULL_ACHE",
    TIGHTNESS = "TIGHTNESS"
}
export declare enum AlertType {
    INJURY_RISK = "INJURY_RISK",
    OVERTRAINING = "OVERTRAINING",
    UNDERRECOVERY = "UNDERRECOVERY",
    MEDICAL_ATTENTION = "MEDICAL_ATTENTION",
    WELLNESS_DECLINE = "WELLNESS_DECLINE"
}
export declare enum AlertSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
//# sourceMappingURL=health.d.ts.map