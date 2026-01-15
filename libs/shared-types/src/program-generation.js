"use strict";
// Intelligent Program Generation Types
// Core types for the intelligent program generation system
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptType = exports.CompetitionType = exports.AdaptationUrgency = exports.AdaptationType = exports.WearableSource = exports.FatigueLevel = exports.RestrictionType = exports.ProgramInjuryStatus = exports.ProgramInjurySeverity = exports.SessionType = exports.ProgramStatus = exports.BlockType = void 0;
// ============================================================================
// ENUMS
// ============================================================================
var BlockType;
(function (BlockType) {
    BlockType["TRAINING"] = "TRAINING";
    BlockType["PIVOT"] = "PIVOT";
    BlockType["PEAKING"] = "PEAKING";
    BlockType["TAPERING"] = "TAPERING";
})(BlockType || (exports.BlockType = BlockType = {}));
var ProgramStatus;
(function (ProgramStatus) {
    ProgramStatus["DRAFT"] = "DRAFT";
    ProgramStatus["ACTIVE"] = "ACTIVE";
    ProgramStatus["PAUSED"] = "PAUSED";
    ProgramStatus["COMPLETED"] = "COMPLETED";
    ProgramStatus["CANCELLED"] = "CANCELLED";
})(ProgramStatus || (exports.ProgramStatus = ProgramStatus = {}));
var SessionType;
(function (SessionType) {
    SessionType["MAIN"] = "MAIN";
    SessionType["ACCESSORY"] = "ACCESSORY";
    SessionType["RECOVERY"] = "RECOVERY";
    SessionType["TECHNIQUE"] = "TECHNIQUE";
    SessionType["CONDITIONING"] = "CONDITIONING";
})(SessionType || (exports.SessionType = SessionType = {}));
var ProgramInjurySeverity;
(function (ProgramInjurySeverity) {
    ProgramInjurySeverity["MINOR"] = "MINOR";
    ProgramInjurySeverity["MODERATE"] = "MODERATE";
    ProgramInjurySeverity["MAJOR"] = "MAJOR";
    ProgramInjurySeverity["SEVERE"] = "SEVERE";
})(ProgramInjurySeverity || (exports.ProgramInjurySeverity = ProgramInjurySeverity = {}));
var ProgramInjuryStatus;
(function (ProgramInjuryStatus) {
    ProgramInjuryStatus["ACTIVE"] = "ACTIVE";
    ProgramInjuryStatus["RECOVERING"] = "RECOVERING";
    ProgramInjuryStatus["RESOLVED"] = "RESOLVED";
})(ProgramInjuryStatus || (exports.ProgramInjuryStatus = ProgramInjuryStatus = {}));
var RestrictionType;
(function (RestrictionType) {
    RestrictionType["EXCLUDE"] = "EXCLUDE";
    RestrictionType["MODIFY"] = "MODIFY";
    RestrictionType["LIMIT_LOAD"] = "LIMIT_LOAD";
    RestrictionType["LIMIT_ROM"] = "LIMIT_ROM";
})(RestrictionType || (exports.RestrictionType = RestrictionType = {}));
var FatigueLevel;
(function (FatigueLevel) {
    FatigueLevel["GREEN"] = "GREEN";
    FatigueLevel["YELLOW"] = "YELLOW";
    FatigueLevel["RED"] = "RED";
})(FatigueLevel || (exports.FatigueLevel = FatigueLevel = {}));
var WearableSource;
(function (WearableSource) {
    WearableSource["WHOOP"] = "WHOOP";
    WearableSource["OURA"] = "OURA";
    WearableSource["GARMIN"] = "GARMIN";
    WearableSource["FITBIT"] = "FITBIT";
    WearableSource["APPLE_HEALTH"] = "APPLE_HEALTH";
    WearableSource["MANUAL"] = "MANUAL";
})(WearableSource || (exports.WearableSource = WearableSource = {}));
var AdaptationType;
(function (AdaptationType) {
    AdaptationType["INTENSITY"] = "INTENSITY";
    AdaptationType["VOLUME"] = "VOLUME";
    AdaptationType["DELOAD"] = "DELOAD";
    AdaptationType["RECOVERY"] = "RECOVERY";
})(AdaptationType || (exports.AdaptationType = AdaptationType = {}));
var AdaptationUrgency;
(function (AdaptationUrgency) {
    AdaptationUrgency["LOW"] = "LOW";
    AdaptationUrgency["MEDIUM"] = "MEDIUM";
    AdaptationUrgency["HIGH"] = "HIGH";
})(AdaptationUrgency || (exports.AdaptationUrgency = AdaptationUrgency = {}));
var CompetitionType;
(function (CompetitionType) {
    CompetitionType["POWERLIFTING"] = "POWERLIFTING";
    CompetitionType["WEIGHTLIFTING"] = "WEIGHTLIFTING";
    CompetitionType["STRONGMAN"] = "STRONGMAN";
    CompetitionType["LOCAL"] = "LOCAL";
    CompetitionType["REGIONAL"] = "REGIONAL";
    CompetitionType["NATIONAL"] = "NATIONAL";
    CompetitionType["INTERNATIONAL"] = "INTERNATIONAL";
})(CompetitionType || (exports.CompetitionType = CompetitionType = {}));
var AttemptType;
(function (AttemptType) {
    AttemptType["OPENER"] = "OPENER";
    AttemptType["SECOND"] = "SECOND";
    AttemptType["THIRD"] = "THIRD";
})(AttemptType || (exports.AttemptType = AttemptType = {}));
//# sourceMappingURL=program-generation.js.map