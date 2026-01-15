"use strict";
// Health and medical types for StrengthOS platform
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSeverity = exports.AlertType = exports.SorenessType = exports.MetricSource = exports.HealthMetricType = exports.ClearanceType = exports.InjuryStatus = exports.InjuryType = void 0;
// Enums
var InjuryType;
(function (InjuryType) {
    InjuryType["ACUTE"] = "ACUTE";
    InjuryType["CHRONIC"] = "CHRONIC";
    InjuryType["OVERUSE"] = "OVERUSE";
    InjuryType["TRAUMATIC"] = "TRAUMATIC";
})(InjuryType || (exports.InjuryType = InjuryType = {}));
var InjuryStatus;
(function (InjuryStatus) {
    InjuryStatus["ACTIVE"] = "ACTIVE";
    InjuryStatus["RECOVERING"] = "RECOVERING";
    InjuryStatus["RESOLVED"] = "RESOLVED";
    InjuryStatus["CHRONIC"] = "CHRONIC";
})(InjuryStatus || (exports.InjuryStatus = InjuryStatus = {}));
var ClearanceType;
(function (ClearanceType) {
    ClearanceType["FULL_CLEARANCE"] = "FULL_CLEARANCE";
    ClearanceType["RESTRICTED_ACTIVITY"] = "RESTRICTED_ACTIVITY";
    ClearanceType["MODIFIED_ACTIVITY"] = "MODIFIED_ACTIVITY";
    ClearanceType["NO_ACTIVITY"] = "NO_ACTIVITY";
})(ClearanceType || (exports.ClearanceType = ClearanceType = {}));
var HealthMetricType;
(function (HealthMetricType) {
    HealthMetricType["HEART_RATE_RESTING"] = "HEART_RATE_RESTING";
    HealthMetricType["HEART_RATE_MAX"] = "HEART_RATE_MAX";
    HealthMetricType["BLOOD_PRESSURE_SYSTOLIC"] = "BLOOD_PRESSURE_SYSTOLIC";
    HealthMetricType["BLOOD_PRESSURE_DIASTOLIC"] = "BLOOD_PRESSURE_DIASTOLIC";
    HealthMetricType["BODY_WEIGHT"] = "BODY_WEIGHT";
    HealthMetricType["BODY_FAT_PERCENTAGE"] = "BODY_FAT_PERCENTAGE";
    HealthMetricType["MUSCLE_MASS"] = "MUSCLE_MASS";
    HealthMetricType["BONE_DENSITY"] = "BONE_DENSITY";
    HealthMetricType["VO2_MAX"] = "VO2_MAX";
    HealthMetricType["FLEXIBILITY_SCORE"] = "FLEXIBILITY_SCORE";
})(HealthMetricType || (exports.HealthMetricType = HealthMetricType = {}));
var MetricSource;
(function (MetricSource) {
    MetricSource["MANUAL_ENTRY"] = "MANUAL_ENTRY";
    MetricSource["WEARABLE_DEVICE"] = "WEARABLE_DEVICE";
    MetricSource["MEDICAL_TEST"] = "MEDICAL_TEST";
    MetricSource["FITNESS_ASSESSMENT"] = "FITNESS_ASSESSMENT";
})(MetricSource || (exports.MetricSource = MetricSource = {}));
var SorenessType;
(function (SorenessType) {
    SorenessType["MUSCLE_FATIGUE"] = "MUSCLE_FATIGUE";
    SorenessType["JOINT_STIFFNESS"] = "JOINT_STIFFNESS";
    SorenessType["SHARP_PAIN"] = "SHARP_PAIN";
    SorenessType["DULL_ACHE"] = "DULL_ACHE";
    SorenessType["TIGHTNESS"] = "TIGHTNESS";
})(SorenessType || (exports.SorenessType = SorenessType = {}));
var AlertType;
(function (AlertType) {
    AlertType["INJURY_RISK"] = "INJURY_RISK";
    AlertType["OVERTRAINING"] = "OVERTRAINING";
    AlertType["UNDERRECOVERY"] = "UNDERRECOVERY";
    AlertType["MEDICAL_ATTENTION"] = "MEDICAL_ATTENTION";
    AlertType["WELLNESS_DECLINE"] = "WELLNESS_DECLINE";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "LOW";
    AlertSeverity["MEDIUM"] = "MEDIUM";
    AlertSeverity["HIGH"] = "HIGH";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
//# sourceMappingURL=health.js.map