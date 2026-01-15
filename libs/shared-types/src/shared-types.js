"use strict";
// Core shared types, enums, and interfaces
// Moved from human-lift-training-api/src/Types/SharedTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.NotificationType = exports.Gender = exports.WeightUnit = exports.TenantStatus = exports.UserStatus = exports.UserRole = exports.Results = void 0;
exports.getErrorMessage = getErrorMessage;
// Results class with proper typing
class Results {
    constructor(success, data = null, message = null, error = null) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.error = error;
    }
    // Compatibility properties
    get isError() {
        return !this.success;
    }
    get isSuccess() {
        return this.success;
    }
    static ok(data, message) {
        return new Results(true, data, message || null);
    }
    static fail(data = null, message) {
        return new Results(false, data, null, message || null);
    }
}
exports.Results = Results;
// Core User and Security Enums
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["TENANT_ADMIN"] = "TENANT_ADMIN";
    UserRole["COACH"] = "COACH";
    UserRole["COACH_ADMIN"] = "COACH_ADMIN";
    UserRole["ATHLETE"] = "ATHLETE";
    UserRole["SELF_COACHED"] = "SELF_COACHED";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
// SecurityEventType moved to security-monitoring.ts for comprehensive coverage
// Tenant and Subscription Enums
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "ACTIVE";
    TenantStatus["INACTIVE"] = "INACTIVE";
    TenantStatus["SUSPENDED"] = "SUSPENDED";
    TenantStatus["PENDING"] = "PENDING";
    TenantStatus["TRIAL"] = "TRIAL";
    TenantStatus["CANCELLED"] = "CANCELLED";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
// SubscriptionStatus moved to payment-types.ts
// Basic Enums
var WeightUnit;
(function (WeightUnit) {
    WeightUnit["KG"] = "KG";
    WeightUnit["LBS"] = "LBS";
})(WeightUnit || (exports.WeightUnit = WeightUnit = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
    Gender["PREFER_NOT_TO_SAY"] = "PREFER_NOT_TO_SAY";
})(Gender || (exports.Gender = Gender = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["PUSH"] = "PUSH";
    NotificationType["IN_APP"] = "IN_APP";
    NotificationType["WORKOUT_REMINDER"] = "WORKOUT_REMINDER";
    NotificationType["COACH_MESSAGE"] = "COACH_MESSAGE";
    NotificationType["TRANSITION_REQUEST"] = "TRANSITION_REQUEST";
    NotificationType["TRANSITION_APPROVED"] = "TRANSITION_APPROVED";
    NotificationType["TRANSITION_REJECTED"] = "TRANSITION_REJECTED";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    NotificationType["WELCOME"] = "WELCOME";
    NotificationType["SECURITY_ALERT"] = "SECURITY_ALERT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// Subscription interface moved to payment-types.ts
// Error handling
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
// Database types are now in database-types.ts
//# sourceMappingURL=shared-types.js.map