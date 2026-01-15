export declare enum ProgramCategory {
    STRENGTH = "STRENGTH",
    POWERLIFTING = "POWERLIFTING",
    WEIGHTLIFTING = "WEIGHTLIFTING",
    GENERAL_FITNESS = "GENERAL_FITNESS"
}
export declare enum GuidanceLevel {
    MINIMAL = "MINIMAL",
    MODERATE = "MODERATE",
    COMPREHENSIVE = "COMPREHENSIVE"
}
export declare enum IndependentAccessLevel {
    BASIC = "BASIC",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED"
}
export declare enum TrainingGoal {
    STRENGTH = "STRENGTH",
    POWER = "POWER",
    HYPERTROPHY = "HYPERTROPHY",
    ENDURANCE = "ENDURANCE"
}
export declare enum ExperienceLevel {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED",
    EXPERT = "EXPERT"
}
export declare enum Discipline {
    BODYBUILDING = "BODYBUILDING",
    SPORTS_SPECIFIC = "SPORTS_SPECIFIC",
    POWERBUILDING = "POWERBUILDING",
}
export declare enum SelfCoachedOnboardingStep {
    PROFILE_SETUP = "PROFILE_SETUP",
    EQUIPMENT_SETUP = "EQUIPMENT_SETUP",
    GOALS_SETUP = "GOALS_SETUP",
    SAFETY_ACKNOWLEDGMENT = "SAFETY_ACKNOWLEDGMENT",
    COMPLETED = "COMPLETED"
}
export declare enum GuardrailActionType {
    BLOCK_ACTION = "BLOCK_ACTION",
    WARN_USER = "WARN_USER",
    LOG_INCIDENT = "LOG_INCIDENT",
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
}
export declare enum TransitionType {
    COACH_TO_COACH = "COACH_TO_COACH",
    SELF_TO_COACHED = "SELF_TO_COACHED",
    COACHED_TO_SELF = "COACHED_TO_SELF"
}
export declare enum TransitionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum RelationshipStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    TERMINATED = "TERMINATED",
    SUSPENDED = "SUSPENDED"
}
export declare enum CoachPermission {
    VIEW_PROFILE = "VIEW_PROFILE",
    EDIT_PROFILE = "EDIT_PROFILE",
    VIEW_WORKOUTS = "VIEW_WORKOUTS",
    CREATE_WORKOUTS = "CREATE_WORKOUTS",
    VIEW_PROGRESS = "VIEW_PROGRESS",
    MANAGE_SCHEDULE = "MANAGE_SCHEDULE",
    COMMUNICATE = "COMMUNICATE",
    VIEW_HEALTH_DATA = "VIEW_HEALTH_DATA"
}
export interface SelfCoachedUser {
    id: string;
    userId: string;
    independentAccessLevel: string;
    transitionHistory: any[];
    acknowledgedRisks: any[];
    createdAt: Date;
    updatedAt: Date;
}
export interface SelfCoachedProgramTemplate {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    duration: number;
    exercises: any[];
    createdAt: Date;
    updatedAt: Date;
}
export interface SafetyGuardrail {
    id: string;
    name: string;
    description: string;
    conditions: any[];
    actions: any[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface SafetyViolation {
    id: string;
    guardrailId: string;
    userId: string;
    description: string;
    severity: string;
    resolved: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=training-types.d.ts.map