"use strict";
// StrengthOS Platform Enums
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
exports.CompetitionStatus = exports.SessionStatus = exports.PlanStatus = exports.Discipline = exports.BodyPart = exports.MovementPattern = exports.ExerciseType = exports.ViewType = exports.DeviceType = exports.NotificationType = exports.InjuryStatus = exports.WeightUnit = exports.Gender = exports.Role = void 0;
// Legacy enums - kept for backward compatibility
var Role;
(function (Role) {
    Role["ADMIN"] = "admin";
    Role["COACH_ADMIN"] = "coach_admin";
    Role["COACH"] = "coach";
    Role["USER"] = "user";
    Role["SELF_COACHED"] = "self_coached";
})(Role || (exports.Role = Role = {}));
// Gender enum moved to user-management-enums.ts for consistency
// Re-export from user-management-enums
var user_management_enums_1 = require("./user-management-enums");
Object.defineProperty(exports, "Gender", { enumerable: true, get: function () { return user_management_enums_1.Gender; } });
// WeightUnit enum moved to user-management-enums.ts for consistency
// Re-export from user-management-enums
var user_management_enums_2 = require("./user-management-enums");
Object.defineProperty(exports, "WeightUnit", { enumerable: true, get: function () { return user_management_enums_2.WeightUnit; } });
// Re-export new comprehensive enums for user management
__exportStar(require("./user-management-enums"), exports);
var InjuryStatus;
(function (InjuryStatus) {
    InjuryStatus["ACTIVE"] = "active";
    InjuryStatus["RECOVERING"] = "recovering";
    InjuryStatus["RESOLVED"] = "resolved";
})(InjuryStatus || (exports.InjuryStatus = InjuryStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["REMINDER"] = "reminder";
    NotificationType["WARNING"] = "warning";
    NotificationType["FEEDBACK"] = "feedback";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["BROWSER"] = "browser";
    DeviceType["IOS"] = "ios";
    DeviceType["ANDROID"] = "android";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var ViewType;
(function (ViewType) {
    ViewType["FRONT"] = "front";
    ViewType["SIDE"] = "side";
    ViewType["BACK"] = "back";
})(ViewType || (exports.ViewType = ViewType = {}));
var ExerciseType;
(function (ExerciseType) {
    ExerciseType["HORIZONTAL_PUSH"] = "Horizontal Push";
    ExerciseType["VERTICAL_PUSH"] = "Vertical Push";
    ExerciseType["HORIZONTAL_PULL"] = "Horizontal Pull";
    ExerciseType["VERTICAL_PULL"] = "Vertical Pull";
    ExerciseType["KNEE_DOMINANT"] = "Knee Dominant";
    ExerciseType["HIP_DOMINANT"] = "Hip Dominant";
    ExerciseType["WEIGHTLIFTING"] = "Weightlifting";
    ExerciseType["MISC"] = "Misc";
})(ExerciseType || (exports.ExerciseType = ExerciseType = {}));
var MovementPattern;
(function (MovementPattern) {
    MovementPattern["SQUAT"] = "squat";
    MovementPattern["HINGE"] = "hinge";
    MovementPattern["PUSH"] = "push";
    MovementPattern["PULL"] = "pull";
    MovementPattern["CARRY"] = "carry";
    MovementPattern["LOCOMOTION"] = "locomotion";
    MovementPattern["ROTATION"] = "rotation";
})(MovementPattern || (exports.MovementPattern = MovementPattern = {}));
var BodyPart;
(function (BodyPart) {
    BodyPart["LEGS"] = "legs";
    BodyPart["CORE"] = "core";
    BodyPart["CHEST"] = "chest";
    BodyPart["BACK"] = "back";
    BodyPart["SHOULDERS"] = "shoulders";
    BodyPart["ARMS"] = "arms";
    BodyPart["FULL_BODY"] = "full_body";
})(BodyPart || (exports.BodyPart = BodyPart = {}));
// Discipline enum moved to user-management-enums.ts for consistency
// Re-export from user-management-enums
var user_management_enums_3 = require("./user-management-enums");
Object.defineProperty(exports, "Discipline", { enumerable: true, get: function () { return user_management_enums_3.Discipline; } });
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["DRAFT"] = "draft";
    PlanStatus["ACTIVE"] = "active";
    PlanStatus["COMPLETED"] = "completed";
    PlanStatus["ARCHIVED"] = "archived";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["PLANNED"] = "planned";
    SessionStatus["IN_PROGRESS"] = "in_progress";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["SKIPPED"] = "skipped";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var CompetitionStatus;
(function (CompetitionStatus) {
    CompetitionStatus["PLANNING"] = "planning";
    CompetitionStatus["PREP"] = "prep";
    CompetitionStatus["COMPLETED"] = "completed";
    CompetitionStatus["CANCELLED"] = "cancelled";
})(CompetitionStatus || (exports.CompetitionStatus = CompetitionStatus = {}));
//# sourceMappingURL=enums.js.map