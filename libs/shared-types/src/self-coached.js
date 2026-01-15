"use strict";
// Self-Coached User Support System Types
// Types and interfaces for managing self-coached users and their transitions
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestStatus = exports.SuggestionType = exports.CoachSortOption = exports.ServiceType = exports.VerificationStatus = exports.CommunicationStyle = exports.ResponseTimeExpectation = exports.BillingPeriod = exports.GuardrailSeverity = exports.GuardrailActionType = exports.TriggerType = exports.SafetyCategory = exports.SelfCoachedTransitionType = exports.SafetyCheckType = exports.ProgressionActionType = exports.ComparisonOperator = exports.ProgressionMetric = exports.ContentType = exports.SafetyImpact = exports.CustomizationType = exports.GuidanceLevel = exports.SafetyRating = exports.PrerequisiteType = exports.ProgramDifficulty = exports.ProgramCategory = exports.IndependentAccessLevel = exports.EducationalCategory = exports.SafetyAcknowledgmentType = exports.CustomizationLevel = exports.ProgramDuration = exports.IntensityPreference = exports.TimeCommitment = exports.SelfCoachedOnboardingStep = void 0;
var SelfCoachedOnboardingStep;
(function (SelfCoachedOnboardingStep) {
    SelfCoachedOnboardingStep["PROFILE_SETUP"] = "PROFILE_SETUP";
    SelfCoachedOnboardingStep["EQUIPMENT_CONFIGURATION"] = "EQUIPMENT_CONFIGURATION";
    SelfCoachedOnboardingStep["HEALTH_ASSESSMENT"] = "HEALTH_ASSESSMENT";
    SelfCoachedOnboardingStep["GOAL_SETTING"] = "GOAL_SETTING";
    SelfCoachedOnboardingStep["PROGRAM_SELECTION"] = "PROGRAM_SELECTION";
    SelfCoachedOnboardingStep["SAFETY_EDUCATION"] = "SAFETY_EDUCATION";
    SelfCoachedOnboardingStep["COMPLETED"] = "COMPLETED";
})(SelfCoachedOnboardingStep || (exports.SelfCoachedOnboardingStep = SelfCoachedOnboardingStep = {}));
var TimeCommitment;
(function (TimeCommitment) {
    TimeCommitment["MINIMAL"] = "MINIMAL";
    TimeCommitment["MODERATE"] = "MODERATE";
    TimeCommitment["HIGH"] = "HIGH";
    TimeCommitment["MAXIMUM"] = "MAXIMUM"; // 5+ sessions per week
})(TimeCommitment || (exports.TimeCommitment = TimeCommitment = {}));
var IntensityPreference;
(function (IntensityPreference) {
    IntensityPreference["LOW"] = "LOW";
    IntensityPreference["MODERATE"] = "MODERATE";
    IntensityPreference["HIGH"] = "HIGH";
    IntensityPreference["VARIABLE"] = "VARIABLE";
})(IntensityPreference || (exports.IntensityPreference = IntensityPreference = {}));
var ProgramDuration;
(function (ProgramDuration) {
    ProgramDuration["SHORT"] = "SHORT";
    ProgramDuration["MEDIUM"] = "MEDIUM";
    ProgramDuration["LONG"] = "LONG";
    ProgramDuration["ONGOING"] = "ONGOING"; // Continuous programming
})(ProgramDuration || (exports.ProgramDuration = ProgramDuration = {}));
var CustomizationLevel;
(function (CustomizationLevel) {
    CustomizationLevel["MINIMAL"] = "MINIMAL";
    CustomizationLevel["MODERATE"] = "MODERATE";
    CustomizationLevel["HIGH"] = "HIGH";
    CustomizationLevel["FULL"] = "FULL"; // Complete control
})(CustomizationLevel || (exports.CustomizationLevel = CustomizationLevel = {}));
var SafetyAcknowledgmentType;
(function (SafetyAcknowledgmentType) {
    SafetyAcknowledgmentType["GENERAL_SAFETY"] = "GENERAL_SAFETY";
    SafetyAcknowledgmentType["EQUIPMENT_SAFETY"] = "EQUIPMENT_SAFETY";
    SafetyAcknowledgmentType["INJURY_PREVENTION"] = "INJURY_PREVENTION";
    SafetyAcknowledgmentType["EMERGENCY_PROCEDURES"] = "EMERGENCY_PROCEDURES";
    SafetyAcknowledgmentType["FORM_TECHNIQUE"] = "FORM_TECHNIQUE";
    SafetyAcknowledgmentType["PROGRESSION_GUIDELINES"] = "PROGRESSION_GUIDELINES";
    SafetyAcknowledgmentType["MEDICAL_CLEARANCE"] = "MEDICAL_CLEARANCE";
})(SafetyAcknowledgmentType || (exports.SafetyAcknowledgmentType = SafetyAcknowledgmentType = {}));
var EducationalCategory;
(function (EducationalCategory) {
    EducationalCategory["SAFETY_FUNDAMENTALS"] = "SAFETY_FUNDAMENTALS";
    EducationalCategory["EXERCISE_TECHNIQUE"] = "EXERCISE_TECHNIQUE";
    EducationalCategory["PROGRAM_DESIGN"] = "PROGRAM_DESIGN";
    EducationalCategory["PROGRESSION_PRINCIPLES"] = "PROGRESSION_PRINCIPLES";
    EducationalCategory["INJURY_PREVENTION"] = "INJURY_PREVENTION";
    EducationalCategory["NUTRITION_BASICS"] = "NUTRITION_BASICS";
    EducationalCategory["RECOVERY_METHODS"] = "RECOVERY_METHODS";
})(EducationalCategory || (exports.EducationalCategory = EducationalCategory = {}));
var IndependentAccessLevel;
(function (IndependentAccessLevel) {
    IndependentAccessLevel["RESTRICTED"] = "RESTRICTED";
    IndependentAccessLevel["GUIDED"] = "GUIDED";
    IndependentAccessLevel["INTERMEDIATE"] = "INTERMEDIATE";
    IndependentAccessLevel["ADVANCED"] = "ADVANCED";
    IndependentAccessLevel["EXPERT"] = "EXPERT"; // Complete independence
})(IndependentAccessLevel || (exports.IndependentAccessLevel = IndependentAccessLevel = {}));
var ProgramCategory;
(function (ProgramCategory) {
    ProgramCategory["BEGINNER_FOUNDATION"] = "BEGINNER_FOUNDATION";
    ProgramCategory["STRENGTH_BUILDING"] = "STRENGTH_BUILDING";
    ProgramCategory["MUSCLE_BUILDING"] = "MUSCLE_BUILDING";
    ProgramCategory["POWERLIFTING"] = "POWERLIFTING";
    ProgramCategory["GENERAL_FITNESS"] = "GENERAL_FITNESS";
    ProgramCategory["REHABILITATION"] = "REHABILITATION";
    ProgramCategory["MAINTENANCE"] = "MAINTENANCE";
})(ProgramCategory || (exports.ProgramCategory = ProgramCategory = {}));
var ProgramDifficulty;
(function (ProgramDifficulty) {
    ProgramDifficulty["BEGINNER"] = "BEGINNER";
    ProgramDifficulty["NOVICE"] = "NOVICE";
    ProgramDifficulty["INTERMEDIATE"] = "INTERMEDIATE";
    ProgramDifficulty["ADVANCED"] = "ADVANCED";
})(ProgramDifficulty || (exports.ProgramDifficulty = ProgramDifficulty = {}));
var PrerequisiteType;
(function (PrerequisiteType) {
    PrerequisiteType["EXPERIENCE_LEVEL"] = "EXPERIENCE_LEVEL";
    PrerequisiteType["EQUIPMENT_ACCESS"] = "EQUIPMENT_ACCESS";
    PrerequisiteType["HEALTH_CLEARANCE"] = "HEALTH_CLEARANCE";
    PrerequisiteType["SAFETY_EDUCATION"] = "SAFETY_EDUCATION";
    PrerequisiteType["PREVIOUS_PROGRAM"] = "PREVIOUS_PROGRAM";
})(PrerequisiteType || (exports.PrerequisiteType = PrerequisiteType = {}));
var SafetyRating;
(function (SafetyRating) {
    SafetyRating["VERY_LOW"] = "VERY_LOW";
    SafetyRating["LOW"] = "LOW";
    SafetyRating["MODERATE"] = "MODERATE";
    SafetyRating["HIGH"] = "HIGH";
    SafetyRating["VERY_HIGH"] = "VERY_HIGH";
})(SafetyRating || (exports.SafetyRating = SafetyRating = {}));
var GuidanceLevel;
(function (GuidanceLevel) {
    GuidanceLevel["MINIMAL"] = "MINIMAL";
    GuidanceLevel["STANDARD"] = "STANDARD";
    GuidanceLevel["COMPREHENSIVE"] = "COMPREHENSIVE";
    GuidanceLevel["INTERACTIVE"] = "INTERACTIVE"; // Real-time feedback
})(GuidanceLevel || (exports.GuidanceLevel = GuidanceLevel = {}));
var CustomizationType;
(function (CustomizationType) {
    CustomizationType["EXERCISE_SUBSTITUTION"] = "EXERCISE_SUBSTITUTION";
    CustomizationType["VOLUME_ADJUSTMENT"] = "VOLUME_ADJUSTMENT";
    CustomizationType["INTENSITY_MODIFICATION"] = "INTENSITY_MODIFICATION";
    CustomizationType["FREQUENCY_CHANGE"] = "FREQUENCY_CHANGE";
    CustomizationType["REST_PERIOD_ADJUSTMENT"] = "REST_PERIOD_ADJUSTMENT";
})(CustomizationType || (exports.CustomizationType = CustomizationType = {}));
var SafetyImpact;
(function (SafetyImpact) {
    SafetyImpact["NONE"] = "NONE";
    SafetyImpact["LOW"] = "LOW";
    SafetyImpact["MODERATE"] = "MODERATE";
    SafetyImpact["HIGH"] = "HIGH";
})(SafetyImpact || (exports.SafetyImpact = SafetyImpact = {}));
var ContentType;
(function (ContentType) {
    ContentType["TEXT"] = "TEXT";
    ContentType["VIDEO"] = "VIDEO";
    ContentType["INTERACTIVE"] = "INTERACTIVE";
    ContentType["QUIZ"] = "QUIZ";
    ContentType["CHECKLIST"] = "CHECKLIST";
})(ContentType || (exports.ContentType = ContentType = {}));
var ProgressionMetric;
(function (ProgressionMetric) {
    ProgressionMetric["SESSIONS_COMPLETED"] = "SESSIONS_COMPLETED";
    ProgressionMetric["WEIGHT_INCREASED"] = "WEIGHT_INCREASED";
    ProgressionMetric["REPS_COMPLETED"] = "REPS_COMPLETED";
    ProgressionMetric["RPE_AVERAGE"] = "RPE_AVERAGE";
    ProgressionMetric["CONSISTENCY_RATE"] = "CONSISTENCY_RATE";
})(ProgressionMetric || (exports.ProgressionMetric = ProgressionMetric = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = "GREATER_THAN";
    ComparisonOperator["GREATER_THAN_OR_EQUAL"] = "GREATER_THAN_OR_EQUAL";
    ComparisonOperator["LESS_THAN"] = "LESS_THAN";
    ComparisonOperator["LESS_THAN_OR_EQUAL"] = "LESS_THAN_OR_EQUAL";
    ComparisonOperator["EQUAL"] = "EQUAL";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var ProgressionActionType;
(function (ProgressionActionType) {
    ProgressionActionType["INCREASE_WEIGHT"] = "INCREASE_WEIGHT";
    ProgressionActionType["INCREASE_REPS"] = "INCREASE_REPS";
    ProgressionActionType["INCREASE_SETS"] = "INCREASE_SETS";
    ProgressionActionType["ADVANCE_EXERCISE"] = "ADVANCE_EXERCISE";
    ProgressionActionType["CHANGE_PROGRAM"] = "CHANGE_PROGRAM";
})(ProgressionActionType || (exports.ProgressionActionType = ProgressionActionType = {}));
var SafetyCheckType;
(function (SafetyCheckType) {
    SafetyCheckType["FORM_ASSESSMENT"] = "FORM_ASSESSMENT";
    SafetyCheckType["INJURY_SCREENING"] = "INJURY_SCREENING";
    SafetyCheckType["FATIGUE_CHECK"] = "FATIGUE_CHECK";
    SafetyCheckType["EQUIPMENT_VERIFICATION"] = "EQUIPMENT_VERIFICATION";
    SafetyCheckType["PROGRESSION_RATE"] = "PROGRESSION_RATE";
})(SafetyCheckType || (exports.SafetyCheckType = SafetyCheckType = {}));
var SelfCoachedTransitionType;
(function (SelfCoachedTransitionType) {
    SelfCoachedTransitionType["INITIAL_REGISTRATION"] = "INITIAL_REGISTRATION";
    SelfCoachedTransitionType["SELF_TO_COACHED"] = "SELF_TO_COACHED";
    SelfCoachedTransitionType["COACHED_TO_SELF"] = "COACHED_TO_SELF";
    SelfCoachedTransitionType["COACH_CHANGE_TO_SELF"] = "COACH_CHANGE_TO_SELF";
})(SelfCoachedTransitionType || (exports.SelfCoachedTransitionType = SelfCoachedTransitionType = {}));
var SafetyCategory;
(function (SafetyCategory) {
    SafetyCategory["EXERCISE_FORM"] = "EXERCISE_FORM";
    SafetyCategory["PROGRESSION_RATE"] = "PROGRESSION_RATE";
    SafetyCategory["VOLUME_LIMITS"] = "VOLUME_LIMITS";
    SafetyCategory["INJURY_PREVENTION"] = "INJURY_PREVENTION";
    SafetyCategory["EQUIPMENT_SAFETY"] = "EQUIPMENT_SAFETY";
    SafetyCategory["HEALTH_MONITORING"] = "HEALTH_MONITORING";
})(SafetyCategory || (exports.SafetyCategory = SafetyCategory = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["WEIGHT_INCREASE"] = "WEIGHT_INCREASE";
    TriggerType["VOLUME_INCREASE"] = "VOLUME_INCREASE";
    TriggerType["FREQUENCY_INCREASE"] = "FREQUENCY_INCREASE";
    TriggerType["PAIN_REPORT"] = "PAIN_REPORT";
    TriggerType["FATIGUE_LEVEL"] = "FATIGUE_LEVEL";
    TriggerType["MISSED_SESSIONS"] = "MISSED_SESSIONS";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
var GuardrailActionType;
(function (GuardrailActionType) {
    GuardrailActionType["WARNING"] = "WARNING";
    GuardrailActionType["RECOMMENDATION"] = "RECOMMENDATION";
    GuardrailActionType["BLOCK_ACTION"] = "BLOCK_ACTION";
    GuardrailActionType["REQUIRE_ASSESSMENT"] = "REQUIRE_ASSESSMENT";
    GuardrailActionType["SUGGEST_COACH"] = "SUGGEST_COACH";
    GuardrailActionType["MANDATORY_REST"] = "MANDATORY_REST";
})(GuardrailActionType || (exports.GuardrailActionType = GuardrailActionType = {}));
var GuardrailSeverity;
(function (GuardrailSeverity) {
    GuardrailSeverity["INFO"] = "INFO";
    GuardrailSeverity["WARNING"] = "WARNING";
    GuardrailSeverity["CRITICAL"] = "CRITICAL";
    GuardrailSeverity["EMERGENCY"] = "EMERGENCY";
})(GuardrailSeverity || (exports.GuardrailSeverity = GuardrailSeverity = {}));
var BillingPeriod;
(function (BillingPeriod) {
    BillingPeriod["WEEKLY"] = "WEEKLY";
    BillingPeriod["MONTHLY"] = "MONTHLY";
    BillingPeriod["QUARTERLY"] = "QUARTERLY";
    BillingPeriod["ANNUALLY"] = "ANNUALLY";
})(BillingPeriod || (exports.BillingPeriod = BillingPeriod = {}));
var ResponseTimeExpectation;
(function (ResponseTimeExpectation) {
    ResponseTimeExpectation["IMMEDIATE"] = "IMMEDIATE";
    ResponseTimeExpectation["SAME_DAY"] = "SAME_DAY";
    ResponseTimeExpectation["NEXT_DAY"] = "NEXT_DAY";
    ResponseTimeExpectation["FLEXIBLE"] = "FLEXIBLE"; // Within a few days
})(ResponseTimeExpectation || (exports.ResponseTimeExpectation = ResponseTimeExpectation = {}));
var CommunicationStyle;
(function (CommunicationStyle) {
    CommunicationStyle["DIRECT"] = "DIRECT";
    CommunicationStyle["SUPPORTIVE"] = "SUPPORTIVE";
    CommunicationStyle["ANALYTICAL"] = "ANALYTICAL";
    CommunicationStyle["MOTIVATIONAL"] = "MOTIVATIONAL";
    CommunicationStyle["EDUCATIONAL"] = "EDUCATIONAL";
})(CommunicationStyle || (exports.CommunicationStyle = CommunicationStyle = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["EXPIRED"] = "EXPIRED";
    VerificationStatus["INVALID"] = "INVALID";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var ServiceType;
(function (ServiceType) {
    ServiceType["PROGRAM_DESIGN"] = "PROGRAM_DESIGN";
    ServiceType["ONGOING_COACHING"] = "ONGOING_COACHING";
    ServiceType["FORM_REVIEW"] = "FORM_REVIEW";
    ServiceType["CONSULTATION"] = "CONSULTATION";
    ServiceType["NUTRITION_GUIDANCE"] = "NUTRITION_GUIDANCE";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var CoachSortOption;
(function (CoachSortOption) {
    CoachSortOption["RATING"] = "RATING";
    CoachSortOption["PRICE"] = "PRICE";
    CoachSortOption["EXPERIENCE"] = "EXPERIENCE";
    CoachSortOption["RESPONSE_TIME"] = "RESPONSE_TIME";
    CoachSortOption["AVAILABILITY"] = "AVAILABILITY";
})(CoachSortOption || (exports.CoachSortOption = CoachSortOption = {}));
var SuggestionType;
(function (SuggestionType) {
    SuggestionType["EXPAND_CRITERIA"] = "EXPAND_CRITERIA";
    SuggestionType["ALTERNATIVE_SPECIALIZATION"] = "ALTERNATIVE_SPECIALIZATION";
    SuggestionType["PRICE_ADJUSTMENT"] = "PRICE_ADJUSTMENT";
    SuggestionType["LOCATION_EXPANSION"] = "LOCATION_EXPANSION";
})(SuggestionType || (exports.SuggestionType = SuggestionType = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["SUBMITTED"] = "SUBMITTED";
    RequestStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    RequestStatus["ACCEPTED"] = "ACCEPTED";
    RequestStatus["DECLINED"] = "DECLINED";
    RequestStatus["EXPIRED"] = "EXPIRED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
//# sourceMappingURL=self-coached.js.map