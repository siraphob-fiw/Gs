"use strict";
// Training and Exercise Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachPermission = exports.RelationshipStatus = exports.TransitionStatus = exports.TransitionType = exports.GuardrailActionType = exports.SelfCoachedOnboardingStep = exports.Discipline = exports.ExperienceLevel = exports.TrainingGoal = exports.IndependentAccessLevel = exports.GuidanceLevel = exports.ProgramCategory = void 0;
// Training Enums
var ProgramCategory;
(function (ProgramCategory) {
    ProgramCategory["STRENGTH"] = "STRENGTH";
    ProgramCategory["POWERLIFTING"] = "POWERLIFTING";
    ProgramCategory["WEIGHTLIFTING"] = "WEIGHTLIFTING";
    ProgramCategory["GENERAL_FITNESS"] = "GENERAL_FITNESS";
})(ProgramCategory || (exports.ProgramCategory = ProgramCategory = {}));
var GuidanceLevel;
(function (GuidanceLevel) {
    GuidanceLevel["MINIMAL"] = "MINIMAL";
    GuidanceLevel["MODERATE"] = "MODERATE";
    GuidanceLevel["COMPREHENSIVE"] = "COMPREHENSIVE";
})(GuidanceLevel || (exports.GuidanceLevel = GuidanceLevel = {}));
var IndependentAccessLevel;
(function (IndependentAccessLevel) {
    IndependentAccessLevel["BASIC"] = "BASIC";
    IndependentAccessLevel["INTERMEDIATE"] = "INTERMEDIATE";
    IndependentAccessLevel["ADVANCED"] = "ADVANCED";
})(IndependentAccessLevel || (exports.IndependentAccessLevel = IndependentAccessLevel = {}));
var TrainingGoal;
(function (TrainingGoal) {
    TrainingGoal["STRENGTH"] = "STRENGTH";
    TrainingGoal["POWER"] = "POWER";
    TrainingGoal["HYPERTROPHY"] = "HYPERTROPHY";
    TrainingGoal["ENDURANCE"] = "ENDURANCE";
})(TrainingGoal || (exports.TrainingGoal = TrainingGoal = {}));
var ExperienceLevel;
(function (ExperienceLevel) {
    ExperienceLevel["BEGINNER"] = "BEGINNER";
    ExperienceLevel["INTERMEDIATE"] = "INTERMEDIATE";
    ExperienceLevel["ADVANCED"] = "ADVANCED";
    ExperienceLevel["EXPERT"] = "EXPERT";
})(ExperienceLevel || (exports.ExperienceLevel = ExperienceLevel = {}));
var Discipline;
(function (Discipline) {
    Discipline["POWERLIFTING"] = "POWERLIFTING";
    Discipline["WEIGHTLIFTING"] = "WEIGHTLIFTING";
    Discipline["STRONGMAN"] = "STRONGMAN";
    Discipline["GENERAL"] = "GENERAL";
})(Discipline || (exports.Discipline = Discipline = {}));
var SelfCoachedOnboardingStep;
(function (SelfCoachedOnboardingStep) {
    SelfCoachedOnboardingStep["PROFILE_SETUP"] = "PROFILE_SETUP";
    SelfCoachedOnboardingStep["EQUIPMENT_SETUP"] = "EQUIPMENT_SETUP";
    SelfCoachedOnboardingStep["GOALS_SETUP"] = "GOALS_SETUP";
    SelfCoachedOnboardingStep["SAFETY_ACKNOWLEDGMENT"] = "SAFETY_ACKNOWLEDGMENT";
    SelfCoachedOnboardingStep["COMPLETED"] = "COMPLETED";
})(SelfCoachedOnboardingStep || (exports.SelfCoachedOnboardingStep = SelfCoachedOnboardingStep = {}));
var GuardrailActionType;
(function (GuardrailActionType) {
    GuardrailActionType["BLOCK_ACTION"] = "BLOCK_ACTION";
    GuardrailActionType["WARN_USER"] = "WARN_USER";
    GuardrailActionType["LOG_INCIDENT"] = "LOG_INCIDENT";
    GuardrailActionType["REQUIRE_APPROVAL"] = "REQUIRE_APPROVAL";
})(GuardrailActionType || (exports.GuardrailActionType = GuardrailActionType = {}));
var TransitionType;
(function (TransitionType) {
    TransitionType["COACH_TO_COACH"] = "COACH_TO_COACH";
    TransitionType["SELF_TO_COACHED"] = "SELF_TO_COACHED";
    TransitionType["COACHED_TO_SELF"] = "COACHED_TO_SELF";
})(TransitionType || (exports.TransitionType = TransitionType = {}));
var TransitionStatus;
(function (TransitionStatus) {
    TransitionStatus["PENDING"] = "PENDING";
    TransitionStatus["APPROVED"] = "APPROVED";
    TransitionStatus["REJECTED"] = "REJECTED";
    TransitionStatus["COMPLETED"] = "COMPLETED";
    TransitionStatus["CANCELLED"] = "CANCELLED";
})(TransitionStatus || (exports.TransitionStatus = TransitionStatus = {}));
var RelationshipStatus;
(function (RelationshipStatus) {
    RelationshipStatus["ACTIVE"] = "ACTIVE";
    RelationshipStatus["INACTIVE"] = "INACTIVE";
    RelationshipStatus["PENDING"] = "PENDING";
    RelationshipStatus["TERMINATED"] = "TERMINATED";
    RelationshipStatus["SUSPENDED"] = "SUSPENDED";
})(RelationshipStatus || (exports.RelationshipStatus = RelationshipStatus = {}));
var CoachPermission;
(function (CoachPermission) {
    CoachPermission["VIEW_PROFILE"] = "VIEW_PROFILE";
    CoachPermission["EDIT_PROFILE"] = "EDIT_PROFILE";
    CoachPermission["VIEW_WORKOUTS"] = "VIEW_WORKOUTS";
    CoachPermission["CREATE_WORKOUTS"] = "CREATE_WORKOUTS";
    CoachPermission["VIEW_PROGRESS"] = "VIEW_PROGRESS";
    CoachPermission["MANAGE_SCHEDULE"] = "MANAGE_SCHEDULE";
    CoachPermission["COMMUNICATE"] = "COMMUNICATE";
    CoachPermission["VIEW_HEALTH_DATA"] = "VIEW_HEALTH_DATA";
})(CoachPermission || (exports.CoachPermission = CoachPermission = {}));
//# sourceMappingURL=training-types.js.map