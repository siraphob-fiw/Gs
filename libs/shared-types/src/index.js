"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptType = exports.CompetitionType = exports.AdaptationUrgency = exports.AdaptationType = exports.WearableSource = exports.FatigueLevel = exports.RestrictionType = exports.ProgramInjuryStatus = exports.ProgramInjurySeverity = exports.SessionType = exports.ProgramStatus = exports.BlockType = exports.MovementPattern = exports.BodyPart = exports.ExerciseType = exports.SessionStatus = exports.PlanStatus = exports.ResponseAction = exports.IncidentStatus = exports.ThreatLevel = exports.SecurityEventStatus = exports.SecurityEventSeverity = exports.SecurityEventType = exports.ProfileVisibility = exports.Discipline = exports.Gender = exports.WeightUnit = exports.TrainingGoal = exports.TenantStatus = exports.UserStatus = exports.UserRole = exports.CoachPermission = exports.RelationshipStatus = exports.TransitionStatus = exports.TransitionType = exports.GuardrailActionType = exports.SelfCoachedOnboardingStep = exports.ExperienceLevel = exports.IndependentAccessLevel = exports.GuidanceLevel = exports.ProgramCategory = void 0;
// Re-export all shared types from organized modules
// Core new modules from migration (prioritized)
__exportStar(require("./shared-types"), exports);
__exportStar(require("./database-types"), exports);
__exportStar(require("./health-types"), exports);
__exportStar(require("./payment-types"), exports);
__exportStar(require("./audit-types"), exports);
// Export training types except TrainingGoal and Discipline (use the comprehensive ones from user-management-enums)
var training_types_1 = require("./training-types");
Object.defineProperty(exports, "ProgramCategory", { enumerable: true, get: function () { return training_types_1.ProgramCategory; } });
Object.defineProperty(exports, "GuidanceLevel", { enumerable: true, get: function () { return training_types_1.GuidanceLevel; } });
Object.defineProperty(exports, "IndependentAccessLevel", { enumerable: true, get: function () { return training_types_1.IndependentAccessLevel; } });
Object.defineProperty(exports, "ExperienceLevel", { enumerable: true, get: function () { return training_types_1.ExperienceLevel; } });
Object.defineProperty(exports, "SelfCoachedOnboardingStep", { enumerable: true, get: function () { return training_types_1.SelfCoachedOnboardingStep; } });
Object.defineProperty(exports, "GuardrailActionType", { enumerable: true, get: function () { return training_types_1.GuardrailActionType; } });
Object.defineProperty(exports, "TransitionType", { enumerable: true, get: function () { return training_types_1.TransitionType; } });
Object.defineProperty(exports, "TransitionStatus", { enumerable: true, get: function () { return training_types_1.TransitionStatus; } });
Object.defineProperty(exports, "RelationshipStatus", { enumerable: true, get: function () { return training_types_1.RelationshipStatus; } });
Object.defineProperty(exports, "CoachPermission", { enumerable: true, get: function () { return training_types_1.CoachPermission; } });
// Export comprehensive enums from user-management-enums, overriding simpler versions
var user_management_enums_1 = require("./user-management-enums");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return user_management_enums_1.UserRole; } });
Object.defineProperty(exports, "UserStatus", { enumerable: true, get: function () { return user_management_enums_1.UserStatus; } });
Object.defineProperty(exports, "TenantStatus", { enumerable: true, get: function () { return user_management_enums_1.TenantStatus; } });
Object.defineProperty(exports, "TrainingGoal", { enumerable: true, get: function () { return user_management_enums_1.TrainingGoal; } });
Object.defineProperty(exports, "WeightUnit", { enumerable: true, get: function () { return user_management_enums_1.WeightUnit; } });
Object.defineProperty(exports, "Gender", { enumerable: true, get: function () { return user_management_enums_1.Gender; } });
Object.defineProperty(exports, "Discipline", { enumerable: true, get: function () { return user_management_enums_1.Discipline; } });
Object.defineProperty(exports, "ProfileVisibility", { enumerable: true, get: function () { return user_management_enums_1.ProfileVisibility; } });
__exportStar(require("./notification-types"), exports);
__exportStar(require("./security-types"), exports);
__exportStar(require("./monitoring-types"), exports);
// Export SecurityEventType and related types from security-monitoring (more comprehensive)
var security_monitoring_1 = require("./security-monitoring");
Object.defineProperty(exports, "SecurityEventType", { enumerable: true, get: function () { return security_monitoring_1.SecurityEventType; } });
Object.defineProperty(exports, "SecurityEventSeverity", { enumerable: true, get: function () { return security_monitoring_1.SecurityEventSeverity; } });
Object.defineProperty(exports, "SecurityEventStatus", { enumerable: true, get: function () { return security_monitoring_1.SecurityEventStatus; } });
Object.defineProperty(exports, "ThreatLevel", { enumerable: true, get: function () { return security_monitoring_1.ThreatLevel; } });
Object.defineProperty(exports, "IncidentStatus", { enumerable: true, get: function () { return security_monitoring_1.IncidentStatus; } });
Object.defineProperty(exports, "ResponseAction", { enumerable: true, get: function () { return security_monitoring_1.ResponseAction; } });
// Export existing types (keeping for compatibility)
// Note: Avoiding duplicates by being selective
var enums_1 = require("./enums");
Object.defineProperty(exports, "PlanStatus", { enumerable: true, get: function () { return enums_1.PlanStatus; } });
Object.defineProperty(exports, "SessionStatus", { enumerable: true, get: function () { return enums_1.SessionStatus; } });
Object.defineProperty(exports, "ExerciseType", { enumerable: true, get: function () { return enums_1.ExerciseType; } });
Object.defineProperty(exports, "BodyPart", { enumerable: true, get: function () { return enums_1.BodyPart; } });
Object.defineProperty(exports, "MovementPattern", { enumerable: true, get: function () { return enums_1.MovementPattern; } });
__exportStar(require("./common"), exports);
__exportStar(require("./session"), exports);
__exportStar(require("./equipment"), exports);
__exportStar(require("./exercise"), exports);
__exportStar(require("./plan"), exports);
__exportStar(require("./competition"), exports);
// Intelligent Program Generation Types
var program_generation_1 = require("./program-generation");
// Enums
Object.defineProperty(exports, "BlockType", { enumerable: true, get: function () { return program_generation_1.BlockType; } });
Object.defineProperty(exports, "ProgramStatus", { enumerable: true, get: function () { return program_generation_1.ProgramStatus; } });
Object.defineProperty(exports, "SessionType", { enumerable: true, get: function () { return program_generation_1.SessionType; } });
Object.defineProperty(exports, "ProgramInjurySeverity", { enumerable: true, get: function () { return program_generation_1.ProgramInjurySeverity; } });
Object.defineProperty(exports, "ProgramInjuryStatus", { enumerable: true, get: function () { return program_generation_1.ProgramInjuryStatus; } });
Object.defineProperty(exports, "RestrictionType", { enumerable: true, get: function () { return program_generation_1.RestrictionType; } });
Object.defineProperty(exports, "FatigueLevel", { enumerable: true, get: function () { return program_generation_1.FatigueLevel; } });
Object.defineProperty(exports, "WearableSource", { enumerable: true, get: function () { return program_generation_1.WearableSource; } });
Object.defineProperty(exports, "AdaptationType", { enumerable: true, get: function () { return program_generation_1.AdaptationType; } });
Object.defineProperty(exports, "AdaptationUrgency", { enumerable: true, get: function () { return program_generation_1.AdaptationUrgency; } });
Object.defineProperty(exports, "CompetitionType", { enumerable: true, get: function () { return program_generation_1.CompetitionType; } });
Object.defineProperty(exports, "AttemptType", { enumerable: true, get: function () { return program_generation_1.AttemptType; } });
__exportStar(require("./program-generation-services"), exports);
//# sourceMappingURL=index.js.map