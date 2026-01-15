"use strict";
// Validation Schemas for User Management & Multi-Tenancy
// Comprehensive Zod schemas for data validation
Object.defineProperty(exports, "__esModule", { value: true });
exports.DayAvailabilitySchema = exports.TimeSlotSchema = exports.HealthConsiderationsSchema = exports.EmergencyMedicalInfoSchema = exports.AllergyInfoSchema = exports.MedicationInfoSchema = exports.ChronicConditionSchema = exports.MenstrualCycleSettingsSchema = exports.CycleTrainingAdjustmentSchema = exports.MenstrualSymptomSchema = exports.ROMRestrictionSchema = exports.DisabilityAccommodationSchema = exports.ExerciseModificationSchema = exports.AdaptiveEquipmentSchema = exports.AccommodationRequirementSchema = exports.EquipmentProfileSchema = exports.SpaceConstraintsSchema = exports.TimeRestrictionSchema = exports.PlateConfigurationSchema = exports.FractionalPlateSetSchema = exports.PlateInventorySchema = exports.EquipmentSchema = exports.EquipmentSpecsSchema = exports.DimensionsSchema = exports.UserPreferencesSchema = exports.AccessibilitySettingsSchema = exports.PrivacySettingsSchema = exports.NotificationPreferencesSchema = exports.AthleteProfileSchema = exports.MedicalInformationSchema = exports.InsuranceInfoSchema = exports.ContactInfoSchema = exports.EmergencyContactSchema = exports.TrainingGoalSchema = exports.DisciplineSchema = exports.ExperienceLevelSchema = exports.WeightUnitSchema = exports.GenderSchema = exports.UserStatusSchema = exports.UserRoleSchema = exports.BillingAddressSchema = exports.AddressSchema = exports.NonNegativeNumberSchema = exports.PositiveNumberSchema = exports.DateSchema = exports.URLSchema = exports.UUIDSchema = exports.PhoneNumberSchema = exports.PasswordSchema = exports.EmailSchema = void 0;
exports.ValidationSchemas = exports.ValidationErrorSchema = exports.ErrorResponseSchema = exports.AuditFiltersSchema = exports.UserFiltersSchema = exports.PaymentRequestSchema = exports.PaymentMethodSchema = exports.PaymentMethodDetailsSchema = exports.LogoutRequestSchema = exports.RefreshTokenRequestSchema = exports.ChangePasswordRequestSchema = exports.PasswordResetConfirmSchema = exports.PasswordResetRequestSchema = exports.LoginRequestSchema = exports.UpdateTenantRequestSchema = exports.CreateTenantRequestSchema = exports.UpdateUserRequestSchema = exports.CreateUserRequestSchema = exports.UserSessionSchema = exports.SecurityEventSchema = exports.PermissionSchema = exports.PermissionConditionSchema = exports.AuthCredentialsSchema = exports.TransitionRequestSchema = exports.DataTransferRecordSchema = exports.AccessUpdateSchema = exports.TransitionNotificationSchema = exports.NotificationContentSchema = exports.TransitionMetadataSchema = exports.TenantSchema = exports.BillingInfoSchema = exports.SubscriptionInfoSchema = exports.UsageMetricsSchema = exports.TenantSettingsSchema = exports.ComplianceSettingsSchema = exports.BrandingSettingsSchema = exports.FeatureFlagSchema = exports.TrainingScheduleSchema = exports.ScheduleConsiderationSchema = exports.RestDayPreferenceSchema = exports.SessionDurationSchema = exports.TimePreferenceSchema = void 0;
const zod_1 = require("zod");
const user_management_enums_1 = require("./user-management-enums");
const payment_processing_1 = require("./payment-processing");
// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================
exports.EmailSchema = zod_1.z.string().email('Invalid email format');
exports.PasswordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
exports.PhoneNumberSchema = zod_1.z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
exports.UUIDSchema = zod_1.z.string().uuid('Invalid UUID format');
exports.URLSchema = zod_1.z.string().url('Invalid URL format');
exports.DateSchema = zod_1.z.coerce.date();
exports.PositiveNumberSchema = zod_1.z.number().positive('Must be a positive number');
exports.NonNegativeNumberSchema = zod_1.z.number().min(0, 'Must be non-negative');
// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================
exports.AddressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1, 'Street is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().min(1, 'State is required'),
    postalCode: zod_1.z.string().min(1, 'Postal code is required'),
    country: zod_1.z.string().length(2, 'Country must be a 2-letter code'),
});
exports.BillingAddressSchema = zod_1.z.object({
    line1: zod_1.z.string().min(1, 'Address line 1 is required'),
    line2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().min(1, 'Postal code is required'),
    country: zod_1.z.string().length(2, 'Country must be a 2-letter code'),
});
// ============================================================================
// USER MANAGEMENT SCHEMAS
// ============================================================================
exports.UserRoleSchema = zod_1.z.nativeEnum(user_management_enums_1.UserRole);
exports.UserStatusSchema = zod_1.z.nativeEnum(user_management_enums_1.UserStatus);
exports.GenderSchema = zod_1.z.nativeEnum(user_management_enums_1.Gender);
exports.WeightUnitSchema = zod_1.z.nativeEnum(user_management_enums_1.WeightUnit);
exports.ExperienceLevelSchema = zod_1.z.nativeEnum(user_management_enums_1.ExperienceLevel);
exports.DisciplineSchema = zod_1.z.nativeEnum(user_management_enums_1.Discipline);
exports.TrainingGoalSchema = zod_1.z.nativeEnum(user_management_enums_1.TrainingGoal);
exports.EmergencyContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    relationship: zod_1.z.string().min(1, 'Relationship is required'),
    phoneNumber: exports.PhoneNumberSchema,
    email: exports.EmailSchema.optional(),
    isPrimary: zod_1.z.boolean(),
});
exports.ContactInfoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    phoneNumber: exports.PhoneNumberSchema,
    email: exports.EmailSchema.optional(),
    address: exports.AddressSchema.optional(),
});
exports.InsuranceInfoSchema = zod_1.z.object({
    provider: zod_1.z.string().min(1, 'Provider is required'),
    policyNumber: zod_1.z.string().min(1, 'Policy number is required'),
    groupNumber: zod_1.z.string().optional(),
    memberName: zod_1.z.string().min(1, 'Member name is required'),
    effectiveDate: exports.DateSchema,
    expirationDate: exports.DateSchema.optional(),
});
exports.MedicalInformationSchema = zod_1.z.object({
    bloodType: zod_1.z.string().optional(),
    chronicConditions: zod_1.z.array(zod_1.z.string()).optional(),
    medications: zod_1.z.array(zod_1.z.string()).optional(),
    allergies: zod_1.z.array(zod_1.z.string()).optional(),
    surgicalHistory: zod_1.z.array(zod_1.z.object({
        procedure: zod_1.z.string().min(1, 'Procedure is required'),
        date: exports.DateSchema,
        complications: zod_1.z.array(zod_1.z.string()).optional(),
        recoveryNotes: zod_1.z.string().optional(),
        affectedMovements: zod_1.z.array(zod_1.z.string()).optional(),
    })).optional(),
    familyMedicalHistory: zod_1.z.array(zod_1.z.string()).optional(),
    lastPhysicalExam: exports.DateSchema.optional(),
    doctorContact: exports.ContactInfoSchema.optional(),
    insuranceInfo: exports.InsuranceInfoSchema.optional(),
});
exports.AthleteProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    dateOfBirth: exports.DateSchema,
    gender: exports.GenderSchema,
    bodyWeight: exports.PositiveNumberSchema,
    height: exports.PositiveNumberSchema,
    experienceLevel: exports.ExperienceLevelSchema,
    disciplines: zod_1.z.array(exports.DisciplineSchema).min(1, 'At least one discipline is required'),
    goals: zod_1.z.array(exports.TrainingGoalSchema).min(1, 'At least one goal is required'),
    emergencyContact: exports.EmergencyContactSchema.optional(),
    medicalInformation: exports.MedicalInformationSchema.optional(),
});
exports.NotificationPreferencesSchema = zod_1.z.object({
    email: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        workoutReminders: zod_1.z.boolean(),
        progressUpdates: zod_1.z.boolean(),
        coachMessages: zod_1.z.boolean(),
        systemUpdates: zod_1.z.boolean(),
        marketingEmails: zod_1.z.boolean(),
        frequency: zod_1.z.nativeEnum(user_management_enums_1.NotificationFrequency),
    }),
    push: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        workoutReminders: zod_1.z.boolean(),
        coachMessages: zod_1.z.boolean(),
        systemAlerts: zod_1.z.boolean(),
        quietHours: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            startTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
            endTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
            timezone: zod_1.z.string(),
            daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)),
        }),
    }),
    sms: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        emergencyOnly: zod_1.z.boolean(),
        phoneNumber: exports.PhoneNumberSchema.optional(),
        verifiedAt: exports.DateSchema.optional(),
    }),
    inApp: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        showBadges: zod_1.z.boolean(),
        playSound: zod_1.z.boolean(),
        categories: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.nativeEnum(user_management_enums_1.NotificationType),
            enabled: zod_1.z.boolean(),
            priority: zod_1.z.nativeEnum(user_management_enums_1.PriorityLevel),
        })),
    }),
});
exports.PrivacySettingsSchema = zod_1.z.object({
    profileVisibility: zod_1.z.nativeEnum(user_management_enums_1.ProfileVisibility),
    showProgress: zod_1.z.boolean(),
    showWorkouts: zod_1.z.boolean(),
    allowMessaging: zod_1.z.boolean(),
    dataSharing: zod_1.z.object({
        shareWithCoach: zod_1.z.boolean(),
        shareForResearch: zod_1.z.boolean(),
        shareForMarketing: zod_1.z.boolean(),
        shareAggregated: zod_1.z.boolean(),
        thirdPartyIntegrations: zod_1.z.boolean(),
    }),
    consentGiven: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.nativeEnum(user_management_enums_1.ConsentType),
        given: zod_1.z.boolean(),
        timestamp: exports.DateSchema,
        version: zod_1.z.string(),
        ipAddress: zod_1.z.string().ip(),
    })),
});
exports.AccessibilitySettingsSchema = zod_1.z.object({
    screenReader: zod_1.z.boolean(),
    highContrast: zod_1.z.boolean(),
    largeText: zod_1.z.boolean(),
    reducedMotion: zod_1.z.boolean(),
    keyboardNavigation: zod_1.z.boolean(),
    voiceControl: zod_1.z.boolean(),
    customizations: zod_1.z.array(zod_1.z.object({
        feature: zod_1.z.string(),
        enabled: zod_1.z.boolean(),
        configuration: zod_1.z.record(zod_1.z.any()).optional(),
    })),
});
exports.UserPreferencesSchema = zod_1.z.object({
    language: zod_1.z.nativeEnum(user_management_enums_1.SupportedLanguage),
    weightUnit: exports.WeightUnitSchema,
    dateFormat: zod_1.z.nativeEnum(user_management_enums_1.DateFormat),
    timeFormat: zod_1.z.nativeEnum(user_management_enums_1.TimeFormat),
    timezone: zod_1.z.string(),
    notifications: exports.NotificationPreferencesSchema,
    privacy: exports.PrivacySettingsSchema,
    accessibility: exports.AccessibilitySettingsSchema,
});
// ============================================================================
// EQUIPMENT & TRAINING SCHEMAS
// ============================================================================
exports.DimensionsSchema = zod_1.z.object({
    length: exports.PositiveNumberSchema,
    width: exports.PositiveNumberSchema,
    height: exports.PositiveNumberSchema.optional(),
    unit: zod_1.z.enum(['cm', 'in', 'm', 'ft']),
});
exports.EquipmentSpecsSchema = zod_1.z.object({
    maxWeight: exports.PositiveNumberSchema.optional(),
    dimensions: exports.DimensionsSchema.optional(),
    adjustableHeight: zod_1.z.boolean().optional(),
    safetyFeatures: zod_1.z.array(zod_1.z.string()).optional(),
    accessories: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.EquipmentSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(user_management_enums_1.EquipmentType),
    brand: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    specifications: exports.EquipmentSpecsSchema,
    condition: zod_1.z.nativeEnum(user_management_enums_1.EquipmentCondition),
    limitations: zod_1.z.array(zod_1.z.string()),
    lastMaintenance: exports.DateSchema.optional(),
});
exports.PlateInventorySchema = zod_1.z.object({
    weight: exports.PositiveNumberSchema,
    quantity: zod_1.z.number().int().positive('Quantity must be a positive integer'),
    material: zod_1.z.nativeEnum(user_management_enums_1.PlateMaterial),
    type: zod_1.z.nativeEnum(user_management_enums_1.PlateType),
});
exports.FractionalPlateSetSchema = zod_1.z.object({
    has0_25kg: zod_1.z.boolean(),
    has0_5kg: zod_1.z.boolean(),
    has1_25lbs: zod_1.z.boolean(),
    has2_5lbs: zod_1.z.boolean(),
    customFractionals: zod_1.z.array(exports.PositiveNumberSchema),
});
exports.PlateConfigurationSchema = zod_1.z.object({
    unit: exports.WeightUnitSchema,
    barWeight: exports.PositiveNumberSchema,
    availablePlates: zod_1.z.array(exports.PlateInventorySchema).min(1, 'At least one plate type is required'),
    hasCollars: zod_1.z.boolean(),
    collarWeight: exports.NonNegativeNumberSchema,
    loadingPins: zod_1.z.boolean(),
    fractionalPlates: exports.FractionalPlateSetSchema,
});
exports.TimeRestrictionSchema = zod_1.z.object({
    startTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)),
    description: zod_1.z.string().optional(),
});
exports.SpaceConstraintsSchema = zod_1.z.object({
    ceilingHeight: exports.PositiveNumberSchema.optional(),
    floorSpace: exports.DimensionsSchema.optional(),
    noiseRestrictions: zod_1.z.boolean().optional(),
    timeRestrictions: zod_1.z.array(exports.TimeRestrictionSchema).optional(),
});
exports.EquipmentProfileSchema = zod_1.z.object({
    id: exports.UUIDSchema,
    userId: exports.UUIDSchema,
    name: zod_1.z.string().min(1, 'Name is required'),
    location: zod_1.z.string().min(1, 'Location is required'),
    description: zod_1.z.string().optional(),
    availableEquipment: zod_1.z.array(exports.EquipmentSchema),
    plateConfiguration: exports.PlateConfigurationSchema,
    spaceConstraints: exports.SpaceConstraintsSchema.optional(),
    isDefault: zod_1.z.boolean(),
    isActive: zod_1.z.boolean(),
    createdAt: exports.DateSchema,
    updatedAt: exports.DateSchema,
});
// ============================================================================
// HEALTH & ACCESSIBILITY SCHEMAS
// ============================================================================
exports.AccommodationRequirementSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(user_management_enums_1.DisabilityType),
    description: zod_1.z.string().min(1, 'Description is required'),
    equipment: zod_1.z.array(zod_1.z.string()).optional(),
    modifications: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.AdaptiveEquipmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    type: zod_1.z.string().min(1, 'Type is required'),
    description: zod_1.z.string().optional(),
    specifications: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.ExerciseModificationSchema = zod_1.z.object({
    exerciseId: zod_1.z.string().min(1, 'Exercise ID is required'),
    modificationType: zod_1.z.string().min(1, 'Modification type is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    alternatives: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.DisabilityAccommodationSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(user_management_enums_1.DisabilityType),
    description: zod_1.z.string().min(1, 'Description is required'),
    accommodations: zod_1.z.array(exports.AccommodationRequirementSchema),
    adaptiveEquipment: zod_1.z.array(exports.AdaptiveEquipmentSchema),
    exerciseModifications: zod_1.z.array(exports.ExerciseModificationSchema),
    isTemporary: zod_1.z.boolean(),
    startDate: exports.DateSchema,
    endDate: exports.DateSchema.optional(),
});
exports.ROMRestrictionSchema = zod_1.z.object({
    joint: zod_1.z.nativeEnum(user_management_enums_1.Joint),
    movementPlane: zod_1.z.nativeEnum(user_management_enums_1.MovementPlane),
    restrictionType: zod_1.z.nativeEnum(user_management_enums_1.RestrictionType),
    limitationDegrees: zod_1.z.number().min(0).max(360).optional(),
    affectedExercises: zod_1.z.array(zod_1.z.string()),
    compensations: zod_1.z.array(zod_1.z.string()),
    isTemporary: zod_1.z.boolean(),
    startDate: exports.DateSchema,
    endDate: exports.DateSchema.optional(),
});
exports.MenstrualSymptomSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, 'Symptom type is required'),
    severity: zod_1.z.nativeEnum(user_management_enums_1.SeverityLevel),
    cyclePhase: zod_1.z.nativeEnum(user_management_enums_1.CyclePhase),
    notes: zod_1.z.string().optional(),
});
exports.CycleTrainingAdjustmentSchema = zod_1.z.object({
    cyclePhase: zod_1.z.nativeEnum(user_management_enums_1.CyclePhase),
    intensityModifier: zod_1.z.number().min(0.1).max(2.0),
    volumeModifier: zod_1.z.number().min(0.1).max(2.0),
    exerciseRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
    recommendedFocus: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.MenstrualCycleSettingsSchema = zod_1.z.object({
    trackingEnabled: zod_1.z.boolean(),
    cycleLength: zod_1.z.number().int().min(21).max(35),
    lastPeriodStart: exports.DateSchema.optional(),
    symptoms: zod_1.z.array(exports.MenstrualSymptomSchema),
    trainingAdjustments: zod_1.z.array(exports.CycleTrainingAdjustmentSchema),
    privacyLevel: zod_1.z.nativeEnum(user_management_enums_1.CyclePrivacyLevel),
    shareWithCoach: zod_1.z.boolean(),
});
exports.ChronicConditionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Condition name is required'),
    diagnosedDate: exports.DateSchema.optional(),
    severity: zod_1.z.nativeEnum(user_management_enums_1.SeverityLevel),
    medications: zod_1.z.array(zod_1.z.string()).optional(),
    exerciseRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
    monitoringRequired: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional(),
});
exports.MedicationInfoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Medication name is required'),
    dosage: zod_1.z.string().optional(),
    frequency: zod_1.z.string().optional(),
    startDate: exports.DateSchema.optional(),
    endDate: exports.DateSchema.optional(),
    sideEffects: zod_1.z.array(zod_1.z.string()).optional(),
    exerciseInteractions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.AllergyInfoSchema = zod_1.z.object({
    allergen: zod_1.z.string().min(1, 'Allergen is required'),
    severity: zod_1.z.nativeEnum(user_management_enums_1.SeverityLevel),
    reactions: zod_1.z.array(zod_1.z.string()).optional(),
    avoidanceInstructions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.EmergencyMedicalInfoSchema = zod_1.z.object({
    bloodType: zod_1.z.string().optional(),
    emergencyContacts: zod_1.z.array(exports.EmergencyContactSchema).min(1, 'At least one emergency contact is required'),
    medicalConditions: zod_1.z.array(zod_1.z.string()),
    medications: zod_1.z.array(zod_1.z.string()),
    allergies: zod_1.z.array(zod_1.z.string()),
    doctorContact: exports.ContactInfoSchema.optional(),
    insuranceInfo: exports.InsuranceInfoSchema.optional(),
});
exports.HealthConsiderationsSchema = zod_1.z.object({
    disabilities: zod_1.z.array(exports.DisabilityAccommodationSchema),
    rangeOfMotionLimitations: zod_1.z.array(exports.ROMRestrictionSchema),
    menstrualCycleTracking: exports.MenstrualCycleSettingsSchema.optional(),
    chronicConditions: zod_1.z.array(exports.ChronicConditionSchema),
    medications: zod_1.z.array(exports.MedicationInfoSchema),
    allergies: zod_1.z.array(exports.AllergyInfoSchema),
    emergencyMedicalInfo: exports.EmergencyMedicalInfoSchema.optional(),
    lastUpdated: exports.DateSchema,
});
// ============================================================================
// TRAINING SCHEDULE SCHEMAS
// ============================================================================
exports.TimeSlotSchema = zod_1.z.object({
    startTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    preference: zod_1.z.nativeEnum(user_management_enums_1.TimePreferenceLevel),
});
exports.DayAvailabilitySchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6),
    isAvailable: zod_1.z.boolean(),
    timeSlots: zod_1.z.array(exports.TimeSlotSchema),
    notes: zod_1.z.string().optional(),
});
exports.TimePreferenceSchema = zod_1.z.object({
    timeOfDay: zod_1.z.nativeEnum(user_management_enums_1.TimeOfDay),
    preference: zod_1.z.nativeEnum(user_management_enums_1.TimePreferenceLevel),
    notes: zod_1.z.string().optional(),
});
exports.SessionDurationSchema = zod_1.z.object({
    preferred: zod_1.z.number().int().positive('Preferred duration must be positive'),
    minimum: zod_1.z.number().int().positive('Minimum duration must be positive'),
    maximum: zod_1.z.number().int().positive('Maximum duration must be positive'),
    flexibility: zod_1.z.nativeEnum(user_management_enums_1.FlexibilityLevel),
});
exports.RestDayPreferenceSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6),
    isPreferred: zod_1.z.boolean(),
    reason: zod_1.z.string().optional(),
});
exports.ScheduleConsiderationSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(user_management_enums_1.ConsiderationType),
    description: zod_1.z.string().min(1, 'Description is required'),
    priority: zod_1.z.nativeEnum(user_management_enums_1.PriorityLevel),
    affectedDays: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(),
    affectedTimes: zod_1.z.array(exports.TimeSlotSchema).optional(),
});
exports.TrainingScheduleSchema = zod_1.z.object({
    userId: exports.UUIDSchema,
    availableDays: zod_1.z.array(exports.DayAvailabilitySchema).length(7, 'Must specify availability for all 7 days'),
    preferredTimes: zod_1.z.array(exports.TimePreferenceSchema),
    sessionDuration: exports.SessionDurationSchema,
    restDayPreferences: zod_1.z.array(exports.RestDayPreferenceSchema),
    specialConsiderations: zod_1.z.array(exports.ScheduleConsiderationSchema),
    timezone: zod_1.z.string(),
    lastUpdated: exports.DateSchema,
});
// ============================================================================
// TENANT MANAGEMENT SCHEMAS
// ============================================================================
exports.FeatureFlagSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Feature name is required'),
    enabled: zod_1.z.boolean(),
    configuration: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.BrandingSettingsSchema = zod_1.z.object({
    logoUrl: exports.URLSchema.optional(),
    primaryColor: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    secondaryColor: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    customDomain: zod_1.z.string().optional(),
    companyName: zod_1.z.string().optional(),
});
exports.ComplianceSettingsSchema = zod_1.z.object({
    gdprEnabled: zod_1.z.boolean(),
    pdpaEnabled: zod_1.z.boolean(),
    hipaaEnabled: zod_1.z.boolean(),
    dataRetentionDays: zod_1.z.number().int().positive(),
    auditLogRetentionDays: zod_1.z.number().int().positive(),
    consentRequired: zod_1.z.boolean(),
});
exports.TenantSettingsSchema = zod_1.z.object({
    allowSelfCoached: zod_1.z.boolean(),
    requireCoachApproval: zod_1.z.boolean(),
    enableVideoAnalysis: zod_1.z.boolean(),
    enableAIFeedback: zod_1.z.boolean(),
    defaultLanguage: zod_1.z.nativeEnum(user_management_enums_1.SupportedLanguage),
    defaultWeightUnit: exports.WeightUnitSchema,
    availableLanguages: zod_1.z.array(zod_1.z.nativeEnum(user_management_enums_1.SupportedLanguage)).min(1, 'At least one language is required'),
    maxCoaches: zod_1.z.number().int().positive(),
    maxAthletes: zod_1.z.number().int().positive(),
    features: zod_1.z.array(exports.FeatureFlagSchema),
    customBranding: exports.BrandingSettingsSchema.optional(),
    complianceSettings: exports.ComplianceSettingsSchema,
});
exports.UsageMetricsSchema = zod_1.z.object({
    activeCoaches: exports.NonNegativeNumberSchema,
    activeAthletes: exports.NonNegativeNumberSchema,
    storageUsed: exports.NonNegativeNumberSchema,
    apiCalls: exports.NonNegativeNumberSchema,
    videoAnalysisMinutes: exports.NonNegativeNumberSchema,
});
exports.SubscriptionInfoSchema = zod_1.z.object({
    id: exports.UUIDSchema,
    planId: zod_1.z.string().min(1, 'Plan ID is required'),
    status: zod_1.z.nativeEnum(payment_processing_1.SubscriptionStatus),
    currentPeriodStart: exports.DateSchema,
    currentPeriodEnd: exports.DateSchema,
    cancelAtPeriodEnd: zod_1.z.boolean(),
    trialEnd: exports.DateSchema.optional(),
    usage: exports.UsageMetricsSchema,
});
exports.BillingInfoSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, 'Customer ID is required'),
    paymentMethodId: zod_1.z.string().optional(),
    billingAddress: exports.BillingAddressSchema.optional(),
    taxId: zod_1.z.string().optional(),
    currency: zod_1.z.nativeEnum(payment_processing_1.Currency),
    nextBillingDate: exports.DateSchema,
    lastPaymentDate: exports.DateSchema.optional(),
    outstandingBalance: zod_1.z.number(),
});
exports.TenantSchema = zod_1.z.object({
    id: exports.UUIDSchema,
    name: zod_1.z.string().min(1, 'Tenant name is required'),
    domain: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(user_management_enums_1.TenantStatus),
    settings: exports.TenantSettingsSchema,
    subscription: exports.SubscriptionInfoSchema,
    billing: exports.BillingInfoSchema,
    createdAt: exports.DateSchema,
    updatedAt: exports.DateSchema,
    suspendedAt: exports.DateSchema.optional(),
});
// ============================================================================
// TRANSITION MANAGEMENT SCHEMAS
// ============================================================================
exports.TransitionMetadataSchema = zod_1.z.object({
    requestedBy: exports.UUIDSchema,
    priority: zod_1.z.nativeEnum(user_management_enums_1.PriorityLevel),
    estimatedCompletionTime: exports.DateSchema.optional(),
    rollbackPlan: zod_1.z.string().optional(),
    communicationPlan: zod_1.z.string().optional(),
    stakeholders: zod_1.z.array(exports.UUIDSchema),
});
exports.NotificationContentSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1, 'Subject is required'),
    body: zod_1.z.string().min(1, 'Body is required'),
    actionUrl: exports.URLSchema.optional(),
    actionText: zod_1.z.string().optional(),
    priority: zod_1.z.nativeEnum(user_management_enums_1.PriorityLevel),
});
exports.TransitionNotificationSchema = zod_1.z.object({
    id: exports.UUIDSchema,
    recipientId: exports.UUIDSchema,
    type: zod_1.z.nativeEnum(user_management_enums_1.NotificationType),
    status: zod_1.z.nativeEnum(user_management_enums_1.NotificationStatus),
    sentAt: exports.DateSchema.optional(),
    readAt: exports.DateSchema.optional(),
    content: exports.NotificationContentSchema,
});
exports.AccessUpdateSchema = zod_1.z.object({
    userId: exports.UUIDSchema,
    resource: zod_1.z.string().min(1, 'Resource is required'),
    oldPermissions: zod_1.z.array(zod_1.z.string()),
    newPermissions: zod_1.z.array(zod_1.z.string()),
    updatedAt: exports.DateSchema,
});
exports.DataTransferRecordSchema = zod_1.z.object({
    transferredData: zod_1.z.array(zod_1.z.string()),
    retainedData: zod_1.z.array(zod_1.z.string()),
    archivedData: zod_1.z.array(zod_1.z.string()),
    accessUpdates: zod_1.z.array(exports.AccessUpdateSchema),
    completedAt: exports.DateSchema.optional(),
});
exports.TransitionRequestSchema = zod_1.z.object({
    id: exports.UUIDSchema,
    athleteId: exports.UUIDSchema,
    fromCoachId: exports.UUIDSchema.optional(),
    toCoachId: exports.UUIDSchema.optional(),
    transitionType: zod_1.z.nativeEnum(user_management_enums_1.TransitionType),
    status: zod_1.z.nativeEnum(user_management_enums_1.TransitionStatus),
    reason: zod_1.z.string().optional(),
    approvalRequired: zod_1.z.boolean(),
    approvedBy: exports.UUIDSchema.optional(),
    approvedAt: exports.DateSchema.optional(),
    executedAt: exports.DateSchema.optional(),
    completedAt: exports.DateSchema.optional(),
    rollbackAt: exports.DateSchema.optional(),
    metadata: exports.TransitionMetadataSchema,
    notifications: zod_1.z.array(exports.TransitionNotificationSchema),
    dataTransfer: exports.DataTransferRecordSchema,
});
// ============================================================================
// AUTHENTICATION & AUTHORIZATION SCHEMAS
// ============================================================================
exports.AuthCredentialsSchema = zod_1.z.object({
    email: exports.EmailSchema,
    password: exports.PasswordSchema,
    tenantId: exports.UUIDSchema.optional(),
});
exports.PermissionConditionSchema = zod_1.z.object({
    field: zod_1.z.string().min(1, 'Field is required'),
    operator: zod_1.z.nativeEnum(user_management_enums_1.ConditionOperator),
    value: zod_1.z.any(),
});
exports.PermissionSchema = zod_1.z.object({
    resource: zod_1.z.string().min(1, 'Resource is required'),
    actions: zod_1.z.array(zod_1.z.string()).min(1, 'At least one action is required'),
    conditions: zod_1.z.array(exports.PermissionConditionSchema).optional(),
});
exports.SecurityEventSchema = zod_1.z.object({
    userId: exports.UUIDSchema,
    tenantId: exports.UUIDSchema,
    eventType: zod_1.z.nativeEnum(user_management_enums_1.SecurityEventType),
    resource: zod_1.z.string().min(1, 'Resource is required'),
    action: zod_1.z.string().min(1, 'Action is required'),
    success: zod_1.z.boolean(),
    ipAddress: zod_1.z.string().ip(),
    userAgent: zod_1.z.string(),
    timestamp: exports.DateSchema,
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.UserSessionSchema = zod_1.z.object({
    id: exports.UUIDSchema,
    userId: exports.UUIDSchema,
    accessToken: zod_1.z.string().min(1, 'Access token is required'),
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    expiresAt: exports.DateSchema,
    ipAddress: zod_1.z.string().ip(),
    userAgent: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    createdAt: exports.DateSchema,
    lastUsedAt: exports.DateSchema,
});
// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================
exports.CreateUserRequestSchema = zod_1.z.object({
    email: exports.EmailSchema,
    password: exports.PasswordSchema,
    role: exports.UserRoleSchema,
    tenantId: exports.UUIDSchema,
    profile: exports.AthleteProfileSchema.partial(),
    preferences: exports.UserPreferencesSchema.partial().optional(),
    sendWelcomeEmail: zod_1.z.boolean().optional(),
});
exports.UpdateUserRequestSchema = zod_1.z.object({
    email: exports.EmailSchema.optional(),
    role: exports.UserRoleSchema.optional(),
    status: exports.UserStatusSchema.optional(),
    profile: exports.AthleteProfileSchema.partial().optional(),
    preferences: exports.UserPreferencesSchema.partial().optional(),
});
exports.CreateTenantRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Tenant name is required'),
    domain: zod_1.z.string().optional(),
    adminEmail: exports.EmailSchema,
    adminPassword: exports.PasswordSchema,
    settings: exports.TenantSettingsSchema.partial().optional(),
    billingInfo: exports.BillingInfoSchema.partial().optional(),
});
exports.UpdateTenantRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Tenant name is required').optional(),
    domain: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(user_management_enums_1.TenantStatus).optional(),
    settings: exports.TenantSettingsSchema.partial().optional(),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: exports.EmailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
    tenantId: exports.UUIDSchema.optional(),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.PasswordResetRequestSchema = zod_1.z.object({
    email: exports.EmailSchema,
    tenantId: exports.UUIDSchema.optional(),
});
exports.PasswordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    newPassword: exports.PasswordSchema,
});
exports.ChangePasswordRequestSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: exports.PasswordSchema,
});
exports.RefreshTokenRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.LogoutRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().optional(),
    allSessions: zod_1.z.boolean().optional(),
});
// ============================================================================
// PAYMENT PROCESSING SCHEMAS
// ============================================================================
exports.PaymentMethodDetailsSchema = zod_1.z.object({
    // PromptPay fields
    promptPayId: zod_1.z.string().optional(),
    promptPayType: zod_1.z.enum(['PHONE', 'ID_CARD', 'E_WALLET']).optional(),
    promptPayName: zod_1.z.string().optional(),
    // Bank Transfer fields
    bankName: zod_1.z.string().optional(),
    bankCode: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
    accountName: zod_1.z.string().optional(),
    routingNumber: zod_1.z.string().optional(),
    swiftCode: zod_1.z.string().optional(),
    iban: zod_1.z.string().optional(),
    branchCode: zod_1.z.string().optional(),
    // Credit/Debit Card fields
    last4: zod_1.z.string().length(4).optional(),
    brand: zod_1.z.string().optional(),
    expiryMonth: zod_1.z.number().int().min(1).max(12).optional(),
    expiryYear: zod_1.z.number().int().min(new Date().getFullYear()).optional(),
    fingerprint: zod_1.z.string().optional(),
    funding: zod_1.z.enum(['CREDIT', 'DEBIT', 'PREPAID', 'UNKNOWN']).optional(),
    country: zod_1.z.string().length(2).optional(),
    // Digital Wallet fields
    walletType: zod_1.z.string().optional(),
    walletId: zod_1.z.string().optional(),
    walletEmail: exports.EmailSchema.optional(),
    // Cryptocurrency fields
    cryptoType: zod_1.z.string().optional(),
    walletAddress: zod_1.z.string().optional(),
    network: zod_1.z.string().optional(),
    // Common fields
    displayName: zod_1.z.string().min(1, 'Display name is required'),
    nickname: zod_1.z.string().optional(),
    billingAddress: exports.BillingAddressSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.PaymentMethodSchema = zod_1.z.object({
    id: exports.UUIDSchema,
    tenantId: exports.UUIDSchema,
    type: zod_1.z.nativeEnum(payment_processing_1.PaymentMethodType),
    details: exports.PaymentMethodDetailsSchema,
    isDefault: zod_1.z.boolean(),
    isActive: zod_1.z.boolean(),
    isVerified: zod_1.z.boolean(),
    createdAt: exports.DateSchema,
    updatedAt: exports.DateSchema,
    expiresAt: exports.DateSchema.optional(),
});
exports.PaymentRequestSchema = zod_1.z.object({
    tenantId: exports.UUIDSchema,
    amount: exports.PositiveNumberSchema,
    currency: zod_1.z.nativeEnum(payment_processing_1.Currency),
    paymentMethodId: exports.UUIDSchema,
    description: zod_1.z.string().optional(),
    statementDescriptor: zod_1.z.string().max(22).optional(),
    receiptEmail: exports.EmailSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    idempotencyKey: zod_1.z.string().optional(),
});
// ============================================================================
// FILTER SCHEMAS
// ============================================================================
exports.UserFiltersSchema = zod_1.z.object({
    role: exports.UserRoleSchema.optional(),
    status: exports.UserStatusSchema.optional(),
    tenantId: exports.UUIDSchema.optional(),
    search: zod_1.z.string().optional(),
    createdAfter: exports.DateSchema.optional(),
    createdBefore: exports.DateSchema.optional(),
    lastLoginAfter: exports.DateSchema.optional(),
    lastLoginBefore: exports.DateSchema.optional(),
    limit: zod_1.z.number().int().positive().max(100).optional(),
    offset: zod_1.z.number().int().min(0).optional(),
});
exports.AuditFiltersSchema = zod_1.z.object({
    userId: exports.UUIDSchema.optional(),
    tenantId: exports.UUIDSchema.optional(),
    action: zod_1.z.string().optional(),
    resource: zod_1.z.string().optional(),
    startDate: exports.DateSchema.optional(),
    endDate: exports.DateSchema.optional(),
    limit: zod_1.z.number().int().positive().max(100).optional(),
    offset: zod_1.z.number().int().min(0).optional(),
});
// ============================================================================
// ERROR SCHEMAS
// ============================================================================
exports.ErrorResponseSchema = zod_1.z.object({
    error: zod_1.z.object({
        type: zod_1.z.nativeEnum(user_management_enums_1.ErrorType),
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.any()).optional(),
        timestamp: exports.DateSchema,
        requestId: zod_1.z.string(),
        userId: exports.UUIDSchema.optional(),
        tenantId: exports.UUIDSchema.optional(),
    }),
});
exports.ValidationErrorSchema = zod_1.z.object({
    field: zod_1.z.string(),
    code: zod_1.z.nativeEnum(user_management_enums_1.ValidationErrorCode),
    message: zod_1.z.string(),
    value: zod_1.z.any().optional(),
});
// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================
exports.ValidationSchemas = {
    // Common
    Email: exports.EmailSchema,
    Password: exports.PasswordSchema,
    PhoneNumber: exports.PhoneNumberSchema,
    UUID: exports.UUIDSchema,
    URL: exports.URLSchema,
    Date: exports.DateSchema,
    PositiveNumber: exports.PositiveNumberSchema,
    NonNegativeNumber: exports.NonNegativeNumberSchema,
    Address: exports.AddressSchema,
    BillingAddress: exports.BillingAddressSchema,
    // User Management
    UserRole: exports.UserRoleSchema,
    UserStatus: exports.UserStatusSchema,
    Gender: exports.GenderSchema,
    WeightUnit: exports.WeightUnitSchema,
    AthleteProfile: exports.AthleteProfileSchema,
    UserPreferences: exports.UserPreferencesSchema,
    NotificationPreferences: exports.NotificationPreferencesSchema,
    PrivacySettings: exports.PrivacySettingsSchema,
    AccessibilitySettings: exports.AccessibilitySettingsSchema,
    // Equipment & Training
    Equipment: exports.EquipmentSchema,
    EquipmentProfile: exports.EquipmentProfileSchema,
    PlateConfiguration: exports.PlateConfigurationSchema,
    TrainingSchedule: exports.TrainingScheduleSchema,
    // Health & Accessibility
    HealthConsiderations: exports.HealthConsiderationsSchema,
    DisabilityAccommodation: exports.DisabilityAccommodationSchema,
    ROMRestriction: exports.ROMRestrictionSchema,
    MenstrualCycleSettings: exports.MenstrualCycleSettingsSchema,
    // Tenant Management
    Tenant: exports.TenantSchema,
    TenantSettings: exports.TenantSettingsSchema,
    SubscriptionInfo: exports.SubscriptionInfoSchema,
    BillingInfo: exports.BillingInfoSchema,
    // Transitions
    TransitionRequest: exports.TransitionRequestSchema,
    TransitionMetadata: exports.TransitionMetadataSchema,
    // Authentication
    AuthCredentials: exports.AuthCredentialsSchema,
    Permission: exports.PermissionSchema,
    SecurityEvent: exports.SecurityEventSchema,
    UserSession: exports.UserSessionSchema,
    // Requests/Responses
    CreateUserRequest: exports.CreateUserRequestSchema,
    UpdateUserRequest: exports.UpdateUserRequestSchema,
    CreateTenantRequest: exports.CreateTenantRequestSchema,
    UpdateTenantRequest: exports.UpdateTenantRequestSchema,
    LoginRequest: exports.LoginRequestSchema,
    PasswordResetRequest: exports.PasswordResetRequestSchema,
    PasswordResetConfirm: exports.PasswordResetConfirmSchema,
    ChangePasswordRequest: exports.ChangePasswordRequestSchema,
    // Payment Processing
    PaymentMethod: exports.PaymentMethodSchema,
    PaymentRequest: exports.PaymentRequestSchema,
    // Filters
    UserFilters: exports.UserFiltersSchema,
    AuditFilters: exports.AuditFiltersSchema,
    // Errors
    ErrorResponse: exports.ErrorResponseSchema,
    ValidationError: exports.ValidationErrorSchema,
};
//# sourceMappingURL=validation-schemas.js.map