"use strict";
// Health and Medical Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentType = exports.ModificationType = exports.AccommodationType = exports.MenstrualPhase = exports.SymptomFrequency = exports.SymptomSeverity = exports.AllergySeverity = exports.ConditionSeverity = exports.InjuryStatus = exports.InjurySeverity = exports.RestrictionSeverity = exports.DisabilityType = void 0;
// Health Enums
var DisabilityType;
(function (DisabilityType) {
    DisabilityType["MOBILITY"] = "MOBILITY";
    DisabilityType["VISUAL"] = "VISUAL";
    DisabilityType["HEARING"] = "HEARING";
    DisabilityType["COGNITIVE"] = "COGNITIVE";
    DisabilityType["NEUROLOGICAL"] = "NEUROLOGICAL";
    DisabilityType["OTHER"] = "OTHER";
})(DisabilityType || (exports.DisabilityType = DisabilityType = {}));
var RestrictionSeverity;
(function (RestrictionSeverity) {
    RestrictionSeverity["MILD"] = "MILD";
    RestrictionSeverity["MODERATE"] = "MODERATE";
    RestrictionSeverity["SEVERE"] = "SEVERE";
})(RestrictionSeverity || (exports.RestrictionSeverity = RestrictionSeverity = {}));
var InjurySeverity;
(function (InjurySeverity) {
    InjurySeverity["MINOR"] = "MINOR";
    InjurySeverity["MODERATE"] = "MODERATE";
    InjurySeverity["MAJOR"] = "MAJOR";
    InjurySeverity["SEVERE"] = "SEVERE";
})(InjurySeverity || (exports.InjurySeverity = InjurySeverity = {}));
var InjuryStatus;
(function (InjuryStatus) {
    InjuryStatus["ACTIVE"] = "ACTIVE";
    InjuryStatus["RECOVERING"] = "RECOVERING";
    InjuryStatus["RECOVERED"] = "RECOVERED";
    InjuryStatus["CHRONIC"] = "CHRONIC";
})(InjuryStatus || (exports.InjuryStatus = InjuryStatus = {}));
var ConditionSeverity;
(function (ConditionSeverity) {
    ConditionSeverity["MILD"] = "MILD";
    ConditionSeverity["MODERATE"] = "MODERATE";
    ConditionSeverity["SEVERE"] = "SEVERE";
})(ConditionSeverity || (exports.ConditionSeverity = ConditionSeverity = {}));
var AllergySeverity;
(function (AllergySeverity) {
    AllergySeverity["MILD"] = "MILD";
    AllergySeverity["MODERATE"] = "MODERATE";
    AllergySeverity["SEVERE"] = "SEVERE";
    AllergySeverity["LIFE_THREATENING"] = "LIFE_THREATENING";
})(AllergySeverity || (exports.AllergySeverity = AllergySeverity = {}));
var SymptomSeverity;
(function (SymptomSeverity) {
    SymptomSeverity["NONE"] = "NONE";
    SymptomSeverity["MILD"] = "MILD";
    SymptomSeverity["MODERATE"] = "MODERATE";
    SymptomSeverity["SEVERE"] = "SEVERE";
})(SymptomSeverity || (exports.SymptomSeverity = SymptomSeverity = {}));
var SymptomFrequency;
(function (SymptomFrequency) {
    SymptomFrequency["NEVER"] = "NEVER";
    SymptomFrequency["RARELY"] = "RARELY";
    SymptomFrequency["SOMETIMES"] = "SOMETIMES";
    SymptomFrequency["OFTEN"] = "OFTEN";
    SymptomFrequency["ALWAYS"] = "ALWAYS";
})(SymptomFrequency || (exports.SymptomFrequency = SymptomFrequency = {}));
var MenstrualPhase;
(function (MenstrualPhase) {
    MenstrualPhase["MENSTRUAL"] = "MENSTRUAL";
    MenstrualPhase["FOLLICULAR"] = "FOLLICULAR";
    MenstrualPhase["OVULATORY"] = "OVULATORY";
    MenstrualPhase["LUTEAL"] = "LUTEAL";
})(MenstrualPhase || (exports.MenstrualPhase = MenstrualPhase = {}));
var AccommodationType;
(function (AccommodationType) {
    AccommodationType["EQUIPMENT_MODIFICATION"] = "EQUIPMENT_MODIFICATION";
    AccommodationType["EXERCISE_ALTERNATIVE"] = "EXERCISE_ALTERNATIVE";
    AccommodationType["ASSISTANCE_REQUIRED"] = "ASSISTANCE_REQUIRED";
    AccommodationType["ENVIRONMENTAL_MODIFICATION"] = "ENVIRONMENTAL_MODIFICATION";
})(AccommodationType || (exports.AccommodationType = AccommodationType = {}));
var ModificationType;
(function (ModificationType) {
    ModificationType["RANGE_OF_MOTION"] = "RANGE_OF_MOTION";
    ModificationType["LOAD_REDUCTION"] = "LOAD_REDUCTION";
    ModificationType["ALTERNATIVE_EXERCISE"] = "ALTERNATIVE_EXERCISE";
    ModificationType["ASSISTANCE_REQUIRED"] = "ASSISTANCE_REQUIRED";
    ModificationType["EQUIPMENT_MODIFICATION"] = "EQUIPMENT_MODIFICATION";
})(ModificationType || (exports.ModificationType = ModificationType = {}));
var AdjustmentType;
(function (AdjustmentType) {
    AdjustmentType["INTENSITY"] = "INTENSITY";
    AdjustmentType["VOLUME"] = "VOLUME";
    AdjustmentType["FREQUENCY"] = "FREQUENCY";
    AdjustmentType["EXERCISE_SELECTION"] = "EXERCISE_SELECTION";
    AdjustmentType["REST_PERIOD"] = "REST_PERIOD";
})(AdjustmentType || (exports.AdjustmentType = AdjustmentType = {}));
//# sourceMappingURL=health-types.js.map