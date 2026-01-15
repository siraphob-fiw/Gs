import { z } from 'zod';
import { UserRole, UserStatus, TenantStatus, TransitionType, TransitionStatus, Gender, WeightUnit, ExperienceLevel, Discipline, TrainingGoal, DisabilityType, Joint, MovementPlane, RestrictionType, SeverityLevel, CyclePhase, CyclePrivacyLevel, EquipmentType, EquipmentCondition, PlateMaterial, PlateType, TimeOfDay, TimePreferenceLevel, FlexibilityLevel, ConsiderationType, PriorityLevel, NotificationType, NotificationStatus, NotificationFrequency, ProfileVisibility, ConsentType, SecurityEventType, ConditionOperator, ErrorType, ValidationErrorCode, SupportedLanguage, DateFormat, TimeFormat } from './user-management-enums';
import { PaymentMethodType, SubscriptionStatus, Currency } from './payment-processing';
export declare const EmailSchema: z.ZodString;
export declare const PasswordSchema: z.ZodString;
export declare const PhoneNumberSchema: z.ZodString;
export declare const UUIDSchema: z.ZodString;
export declare const URLSchema: z.ZodString;
export declare const DateSchema: z.ZodDate;
export declare const PositiveNumberSchema: z.ZodNumber;
export declare const NonNegativeNumberSchema: z.ZodNumber;
export declare const AddressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}, {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}>;
export declare const BillingAddressSchema: z.ZodObject<{
    line1: z.ZodString;
    line2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    city: string;
    postalCode: string;
    country: string;
    line1: string;
    state?: string | undefined;
    line2?: string | undefined;
}, {
    city: string;
    postalCode: string;
    country: string;
    line1: string;
    state?: string | undefined;
    line2?: string | undefined;
}>;
export declare const UserRoleSchema: z.ZodNativeEnum<typeof UserRole>;
export declare const UserStatusSchema: z.ZodNativeEnum<typeof UserStatus>;
export declare const GenderSchema: z.ZodNativeEnum<typeof Gender>;
export declare const WeightUnitSchema: z.ZodNativeEnum<typeof WeightUnit>;
export declare const ExperienceLevelSchema: z.ZodNativeEnum<typeof ExperienceLevel>;
export declare const DisciplineSchema: z.ZodNativeEnum<typeof Discipline>;
export declare const TrainingGoalSchema: z.ZodNativeEnum<typeof TrainingGoal>;
export declare const EmergencyContactSchema: z.ZodObject<{
    name: z.ZodString;
    relationship: z.ZodString;
    phoneNumber: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary: boolean;
    email?: string | undefined;
}, {
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary: boolean;
    email?: string | undefined;
}>;
export declare const ContactInfoSchema: z.ZodObject<{
    name: z.ZodString;
    phoneNumber: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phoneNumber: string;
    email?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    } | undefined;
}, {
    name: string;
    phoneNumber: string;
    email?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    } | undefined;
}>;
export declare const InsuranceInfoSchema: z.ZodObject<{
    provider: z.ZodString;
    policyNumber: z.ZodString;
    groupNumber: z.ZodOptional<z.ZodString>;
    memberName: z.ZodString;
    effectiveDate: z.ZodDate;
    expirationDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    policyNumber: string;
    memberName: string;
    effectiveDate: Date;
    groupNumber?: string | undefined;
    expirationDate?: Date | undefined;
}, {
    provider: string;
    policyNumber: string;
    memberName: string;
    effectiveDate: Date;
    groupNumber?: string | undefined;
    expirationDate?: Date | undefined;
}>;
export declare const MedicalInformationSchema: z.ZodObject<{
    bloodType: z.ZodOptional<z.ZodString>;
    chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    surgicalHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        procedure: z.ZodString;
        date: z.ZodDate;
        complications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        recoveryNotes: z.ZodOptional<z.ZodString>;
        affectedMovements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        date: Date;
        procedure: string;
        complications?: string[] | undefined;
        recoveryNotes?: string | undefined;
        affectedMovements?: string[] | undefined;
    }, {
        date: Date;
        procedure: string;
        complications?: string[] | undefined;
        recoveryNotes?: string | undefined;
        affectedMovements?: string[] | undefined;
    }>, "many">>;
    familyMedicalHistory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    lastPhysicalExam: z.ZodOptional<z.ZodDate>;
    doctorContact: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phoneNumber: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        }, {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    }, {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    }>>;
    insuranceInfo: z.ZodOptional<z.ZodObject<{
        provider: z.ZodString;
        policyNumber: z.ZodString;
        groupNumber: z.ZodOptional<z.ZodString>;
        memberName: z.ZodString;
        effectiveDate: z.ZodDate;
        expirationDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    }, {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    bloodType?: string | undefined;
    chronicConditions?: string[] | undefined;
    medications?: string[] | undefined;
    allergies?: string[] | undefined;
    surgicalHistory?: {
        date: Date;
        procedure: string;
        complications?: string[] | undefined;
        recoveryNotes?: string | undefined;
        affectedMovements?: string[] | undefined;
    }[] | undefined;
    familyMedicalHistory?: string[] | undefined;
    lastPhysicalExam?: Date | undefined;
    doctorContact?: {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    } | undefined;
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    } | undefined;
}, {
    bloodType?: string | undefined;
    chronicConditions?: string[] | undefined;
    medications?: string[] | undefined;
    allergies?: string[] | undefined;
    surgicalHistory?: {
        date: Date;
        procedure: string;
        complications?: string[] | undefined;
        recoveryNotes?: string | undefined;
        affectedMovements?: string[] | undefined;
    }[] | undefined;
    familyMedicalHistory?: string[] | undefined;
    lastPhysicalExam?: Date | undefined;
    doctorContact?: {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    } | undefined;
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    } | undefined;
}>;
export declare const AthleteProfileSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    dateOfBirth: z.ZodDate;
    gender: z.ZodNativeEnum<typeof Gender>;
    bodyWeight: z.ZodNumber;
    height: z.ZodNumber;
    experienceLevel: z.ZodNativeEnum<typeof ExperienceLevel>;
    disciplines: z.ZodArray<z.ZodNativeEnum<typeof Discipline>, "many">;
    goals: z.ZodArray<z.ZodNativeEnum<typeof TrainingGoal>, "many">;
    emergencyContact: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        relationship: z.ZodString;
        phoneNumber: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    }, {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    }>>;
    medicalInformation: z.ZodOptional<z.ZodObject<{
        bloodType: z.ZodOptional<z.ZodString>;
        chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        surgicalHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
            procedure: z.ZodString;
            date: z.ZodDate;
            complications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            recoveryNotes: z.ZodOptional<z.ZodString>;
            affectedMovements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            date: Date;
            procedure: string;
            complications?: string[] | undefined;
            recoveryNotes?: string | undefined;
            affectedMovements?: string[] | undefined;
        }, {
            date: Date;
            procedure: string;
            complications?: string[] | undefined;
            recoveryNotes?: string | undefined;
            affectedMovements?: string[] | undefined;
        }>, "many">>;
        familyMedicalHistory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        lastPhysicalExam: z.ZodOptional<z.ZodDate>;
        doctorContact: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            phoneNumber: z.ZodString;
            email: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodObject<{
                street: z.ZodString;
                city: z.ZodString;
                state: z.ZodString;
                postalCode: z.ZodString;
                country: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            }, {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        }, {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        }>>;
        insuranceInfo: z.ZodOptional<z.ZodObject<{
            provider: z.ZodString;
            policyNumber: z.ZodString;
            groupNumber: z.ZodOptional<z.ZodString>;
            memberName: z.ZodString;
            effectiveDate: z.ZodDate;
            expirationDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        }, {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        bloodType?: string | undefined;
        chronicConditions?: string[] | undefined;
        medications?: string[] | undefined;
        allergies?: string[] | undefined;
        surgicalHistory?: {
            date: Date;
            procedure: string;
            complications?: string[] | undefined;
            recoveryNotes?: string | undefined;
            affectedMovements?: string[] | undefined;
        }[] | undefined;
        familyMedicalHistory?: string[] | undefined;
        lastPhysicalExam?: Date | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    }, {
        bloodType?: string | undefined;
        chronicConditions?: string[] | undefined;
        medications?: string[] | undefined;
        allergies?: string[] | undefined;
        surgicalHistory?: {
            date: Date;
            procedure: string;
            complications?: string[] | undefined;
            recoveryNotes?: string | undefined;
            affectedMovements?: string[] | undefined;
        }[] | undefined;
        familyMedicalHistory?: string[] | undefined;
        lastPhysicalExam?: Date | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    gender: Gender;
    height: number;
    goals: TrainingGoal[];
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    bodyWeight: number;
    experienceLevel: ExperienceLevel;
    disciplines: Discipline[];
    emergencyContact?: {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    } | undefined;
    medicalInformation?: {
        bloodType?: string | undefined;
        chronicConditions?: string[] | undefined;
        medications?: string[] | undefined;
        allergies?: string[] | undefined;
        surgicalHistory?: {
            date: Date;
            procedure: string;
            complications?: string[] | undefined;
            recoveryNotes?: string | undefined;
            affectedMovements?: string[] | undefined;
        }[] | undefined;
        familyMedicalHistory?: string[] | undefined;
        lastPhysicalExam?: Date | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    } | undefined;
}, {
    gender: Gender;
    height: number;
    goals: TrainingGoal[];
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    bodyWeight: number;
    experienceLevel: ExperienceLevel;
    disciplines: Discipline[];
    emergencyContact?: {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    } | undefined;
    medicalInformation?: {
        bloodType?: string | undefined;
        chronicConditions?: string[] | undefined;
        medications?: string[] | undefined;
        allergies?: string[] | undefined;
        surgicalHistory?: {
            date: Date;
            procedure: string;
            complications?: string[] | undefined;
            recoveryNotes?: string | undefined;
            affectedMovements?: string[] | undefined;
        }[] | undefined;
        familyMedicalHistory?: string[] | undefined;
        lastPhysicalExam?: Date | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const NotificationPreferencesSchema: z.ZodObject<{
    email: z.ZodObject<{
        enabled: z.ZodBoolean;
        workoutReminders: z.ZodBoolean;
        progressUpdates: z.ZodBoolean;
        coachMessages: z.ZodBoolean;
        systemUpdates: z.ZodBoolean;
        marketingEmails: z.ZodBoolean;
        frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        workoutReminders: boolean;
        progressUpdates: boolean;
        coachMessages: boolean;
        systemUpdates: boolean;
        marketingEmails: boolean;
        frequency: NotificationFrequency;
    }, {
        enabled: boolean;
        workoutReminders: boolean;
        progressUpdates: boolean;
        coachMessages: boolean;
        systemUpdates: boolean;
        marketingEmails: boolean;
        frequency: NotificationFrequency;
    }>;
    push: z.ZodObject<{
        enabled: z.ZodBoolean;
        workoutReminders: z.ZodBoolean;
        coachMessages: z.ZodBoolean;
        systemAlerts: z.ZodBoolean;
        quietHours: z.ZodObject<{
            enabled: z.ZodBoolean;
            startTime: z.ZodString;
            endTime: z.ZodString;
            timezone: z.ZodString;
            daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            startTime: string;
            endTime: string;
            timezone: string;
            daysOfWeek: number[];
        }, {
            enabled: boolean;
            startTime: string;
            endTime: string;
            timezone: string;
            daysOfWeek: number[];
        }>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        workoutReminders: boolean;
        coachMessages: boolean;
        systemAlerts: boolean;
        quietHours: {
            enabled: boolean;
            startTime: string;
            endTime: string;
            timezone: string;
            daysOfWeek: number[];
        };
    }, {
        enabled: boolean;
        workoutReminders: boolean;
        coachMessages: boolean;
        systemAlerts: boolean;
        quietHours: {
            enabled: boolean;
            startTime: string;
            endTime: string;
            timezone: string;
            daysOfWeek: number[];
        };
    }>;
    sms: z.ZodObject<{
        enabled: z.ZodBoolean;
        emergencyOnly: z.ZodBoolean;
        phoneNumber: z.ZodOptional<z.ZodString>;
        verifiedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        emergencyOnly: boolean;
        phoneNumber?: string | undefined;
        verifiedAt?: Date | undefined;
    }, {
        enabled: boolean;
        emergencyOnly: boolean;
        phoneNumber?: string | undefined;
        verifiedAt?: Date | undefined;
    }>;
    inApp: z.ZodObject<{
        enabled: z.ZodBoolean;
        showBadges: z.ZodBoolean;
        playSound: z.ZodBoolean;
        categories: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof NotificationType>;
            enabled: z.ZodBoolean;
            priority: z.ZodNativeEnum<typeof PriorityLevel>;
        }, "strip", z.ZodTypeAny, {
            type: NotificationType;
            enabled: boolean;
            priority: PriorityLevel;
        }, {
            type: NotificationType;
            enabled: boolean;
            priority: PriorityLevel;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        showBadges: boolean;
        playSound: boolean;
        categories: {
            type: NotificationType;
            enabled: boolean;
            priority: PriorityLevel;
        }[];
    }, {
        enabled: boolean;
        showBadges: boolean;
        playSound: boolean;
        categories: {
            type: NotificationType;
            enabled: boolean;
            priority: PriorityLevel;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    email: {
        enabled: boolean;
        workoutReminders: boolean;
        progressUpdates: boolean;
        coachMessages: boolean;
        systemUpdates: boolean;
        marketingEmails: boolean;
        frequency: NotificationFrequency;
    };
    push: {
        enabled: boolean;
        workoutReminders: boolean;
        coachMessages: boolean;
        systemAlerts: boolean;
        quietHours: {
            enabled: boolean;
            startTime: string;
            endTime: string;
            timezone: string;
            daysOfWeek: number[];
        };
    };
    sms: {
        enabled: boolean;
        emergencyOnly: boolean;
        phoneNumber?: string | undefined;
        verifiedAt?: Date | undefined;
    };
    inApp: {
        enabled: boolean;
        showBadges: boolean;
        playSound: boolean;
        categories: {
            type: NotificationType;
            enabled: boolean;
            priority: PriorityLevel;
        }[];
    };
}, {
    email: {
        enabled: boolean;
        workoutReminders: boolean;
        progressUpdates: boolean;
        coachMessages: boolean;
        systemUpdates: boolean;
        marketingEmails: boolean;
        frequency: NotificationFrequency;
    };
    push: {
        enabled: boolean;
        workoutReminders: boolean;
        coachMessages: boolean;
        systemAlerts: boolean;
        quietHours: {
            enabled: boolean;
            startTime: string;
            endTime: string;
            timezone: string;
            daysOfWeek: number[];
        };
    };
    sms: {
        enabled: boolean;
        emergencyOnly: boolean;
        phoneNumber?: string | undefined;
        verifiedAt?: Date | undefined;
    };
    inApp: {
        enabled: boolean;
        showBadges: boolean;
        playSound: boolean;
        categories: {
            type: NotificationType;
            enabled: boolean;
            priority: PriorityLevel;
        }[];
    };
}>;
export declare const PrivacySettingsSchema: z.ZodObject<{
    profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
    showProgress: z.ZodBoolean;
    showWorkouts: z.ZodBoolean;
    allowMessaging: z.ZodBoolean;
    dataSharing: z.ZodObject<{
        shareWithCoach: z.ZodBoolean;
        shareForResearch: z.ZodBoolean;
        shareForMarketing: z.ZodBoolean;
        shareAggregated: z.ZodBoolean;
        thirdPartyIntegrations: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        shareWithCoach: boolean;
        shareForResearch: boolean;
        shareForMarketing: boolean;
        shareAggregated: boolean;
        thirdPartyIntegrations: boolean;
    }, {
        shareWithCoach: boolean;
        shareForResearch: boolean;
        shareForMarketing: boolean;
        shareAggregated: boolean;
        thirdPartyIntegrations: boolean;
    }>;
    consentGiven: z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof ConsentType>;
        given: z.ZodBoolean;
        timestamp: z.ZodDate;
        version: z.ZodString;
        ipAddress: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        version: string;
        timestamp: Date;
        type: ConsentType;
        given: boolean;
        ipAddress: string;
    }, {
        version: string;
        timestamp: Date;
        type: ConsentType;
        given: boolean;
        ipAddress: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    profileVisibility: ProfileVisibility;
    showProgress: boolean;
    showWorkouts: boolean;
    allowMessaging: boolean;
    dataSharing: {
        shareWithCoach: boolean;
        shareForResearch: boolean;
        shareForMarketing: boolean;
        shareAggregated: boolean;
        thirdPartyIntegrations: boolean;
    };
    consentGiven: {
        version: string;
        timestamp: Date;
        type: ConsentType;
        given: boolean;
        ipAddress: string;
    }[];
}, {
    profileVisibility: ProfileVisibility;
    showProgress: boolean;
    showWorkouts: boolean;
    allowMessaging: boolean;
    dataSharing: {
        shareWithCoach: boolean;
        shareForResearch: boolean;
        shareForMarketing: boolean;
        shareAggregated: boolean;
        thirdPartyIntegrations: boolean;
    };
    consentGiven: {
        version: string;
        timestamp: Date;
        type: ConsentType;
        given: boolean;
        ipAddress: string;
    }[];
}>;
export declare const AccessibilitySettingsSchema: z.ZodObject<{
    screenReader: z.ZodBoolean;
    highContrast: z.ZodBoolean;
    largeText: z.ZodBoolean;
    reducedMotion: z.ZodBoolean;
    keyboardNavigation: z.ZodBoolean;
    voiceControl: z.ZodBoolean;
    customizations: z.ZodArray<z.ZodObject<{
        feature: z.ZodString;
        enabled: z.ZodBoolean;
        configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        feature: string;
        configuration?: Record<string, any> | undefined;
    }, {
        enabled: boolean;
        feature: string;
        configuration?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    screenReader: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
    voiceControl: boolean;
    customizations: {
        enabled: boolean;
        feature: string;
        configuration?: Record<string, any> | undefined;
    }[];
}, {
    screenReader: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
    voiceControl: boolean;
    customizations: {
        enabled: boolean;
        feature: string;
        configuration?: Record<string, any> | undefined;
    }[];
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    language: z.ZodNativeEnum<typeof SupportedLanguage>;
    weightUnit: z.ZodNativeEnum<typeof WeightUnit>;
    dateFormat: z.ZodNativeEnum<typeof DateFormat>;
    timeFormat: z.ZodNativeEnum<typeof TimeFormat>;
    timezone: z.ZodString;
    notifications: z.ZodObject<{
        email: z.ZodObject<{
            enabled: z.ZodBoolean;
            workoutReminders: z.ZodBoolean;
            progressUpdates: z.ZodBoolean;
            coachMessages: z.ZodBoolean;
            systemUpdates: z.ZodBoolean;
            marketingEmails: z.ZodBoolean;
            frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        }, {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        }>;
        push: z.ZodObject<{
            enabled: z.ZodBoolean;
            workoutReminders: z.ZodBoolean;
            coachMessages: z.ZodBoolean;
            systemAlerts: z.ZodBoolean;
            quietHours: z.ZodObject<{
                enabled: z.ZodBoolean;
                startTime: z.ZodString;
                endTime: z.ZodString;
                timezone: z.ZodString;
                daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            }, {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            }>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        }, {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        }>;
        sms: z.ZodObject<{
            enabled: z.ZodBoolean;
            emergencyOnly: z.ZodBoolean;
            phoneNumber: z.ZodOptional<z.ZodString>;
            verifiedAt: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        }, {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        }>;
        inApp: z.ZodObject<{
            enabled: z.ZodBoolean;
            showBadges: z.ZodBoolean;
            playSound: z.ZodBoolean;
            categories: z.ZodArray<z.ZodObject<{
                type: z.ZodNativeEnum<typeof NotificationType>;
                enabled: z.ZodBoolean;
                priority: z.ZodNativeEnum<typeof PriorityLevel>;
            }, "strip", z.ZodTypeAny, {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }, {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        }, {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        }>;
    }, "strip", z.ZodTypeAny, {
        email: {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        };
        push: {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        };
        sms: {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        };
        inApp: {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        };
    }, {
        email: {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        };
        push: {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        };
        sms: {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        };
        inApp: {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        };
    }>;
    privacy: z.ZodObject<{
        profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
        showProgress: z.ZodBoolean;
        showWorkouts: z.ZodBoolean;
        allowMessaging: z.ZodBoolean;
        dataSharing: z.ZodObject<{
            shareWithCoach: z.ZodBoolean;
            shareForResearch: z.ZodBoolean;
            shareForMarketing: z.ZodBoolean;
            shareAggregated: z.ZodBoolean;
            thirdPartyIntegrations: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        }, {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        }>;
        consentGiven: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof ConsentType>;
            given: z.ZodBoolean;
            timestamp: z.ZodDate;
            version: z.ZodString;
            ipAddress: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }, {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        profileVisibility: ProfileVisibility;
        showProgress: boolean;
        showWorkouts: boolean;
        allowMessaging: boolean;
        dataSharing: {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        };
        consentGiven: {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }[];
    }, {
        profileVisibility: ProfileVisibility;
        showProgress: boolean;
        showWorkouts: boolean;
        allowMessaging: boolean;
        dataSharing: {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        };
        consentGiven: {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }[];
    }>;
    accessibility: z.ZodObject<{
        screenReader: z.ZodBoolean;
        highContrast: z.ZodBoolean;
        largeText: z.ZodBoolean;
        reducedMotion: z.ZodBoolean;
        keyboardNavigation: z.ZodBoolean;
        voiceControl: z.ZodBoolean;
        customizations: z.ZodArray<z.ZodObject<{
            feature: z.ZodString;
            enabled: z.ZodBoolean;
            configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }, {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        screenReader: boolean;
        highContrast: boolean;
        largeText: boolean;
        reducedMotion: boolean;
        keyboardNavigation: boolean;
        voiceControl: boolean;
        customizations: {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }[];
    }, {
        screenReader: boolean;
        highContrast: boolean;
        largeText: boolean;
        reducedMotion: boolean;
        keyboardNavigation: boolean;
        voiceControl: boolean;
        customizations: {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    timezone: string;
    language: SupportedLanguage;
    weightUnit: WeightUnit;
    dateFormat: DateFormat;
    timeFormat: TimeFormat;
    notifications: {
        email: {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        };
        push: {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        };
        sms: {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        };
        inApp: {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        };
    };
    privacy: {
        profileVisibility: ProfileVisibility;
        showProgress: boolean;
        showWorkouts: boolean;
        allowMessaging: boolean;
        dataSharing: {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        };
        consentGiven: {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }[];
    };
    accessibility: {
        screenReader: boolean;
        highContrast: boolean;
        largeText: boolean;
        reducedMotion: boolean;
        keyboardNavigation: boolean;
        voiceControl: boolean;
        customizations: {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }[];
    };
}, {
    timezone: string;
    language: SupportedLanguage;
    weightUnit: WeightUnit;
    dateFormat: DateFormat;
    timeFormat: TimeFormat;
    notifications: {
        email: {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        };
        push: {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        };
        sms: {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        };
        inApp: {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        };
    };
    privacy: {
        profileVisibility: ProfileVisibility;
        showProgress: boolean;
        showWorkouts: boolean;
        allowMessaging: boolean;
        dataSharing: {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        };
        consentGiven: {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }[];
    };
    accessibility: {
        screenReader: boolean;
        highContrast: boolean;
        largeText: boolean;
        reducedMotion: boolean;
        keyboardNavigation: boolean;
        voiceControl: boolean;
        customizations: {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }[];
    };
}>;
export declare const DimensionsSchema: z.ZodObject<{
    length: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
}, "strip", z.ZodTypeAny, {
    length: number;
    width: number;
    unit: "cm" | "in" | "m" | "ft";
    height?: number | undefined;
}, {
    length: number;
    width: number;
    unit: "cm" | "in" | "m" | "ft";
    height?: number | undefined;
}>;
export declare const EquipmentSpecsSchema: z.ZodObject<{
    maxWeight: z.ZodOptional<z.ZodNumber>;
    dimensions: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
    }, "strip", z.ZodTypeAny, {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    }, {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    }>>;
    adjustableHeight: z.ZodOptional<z.ZodBoolean>;
    safetyFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    accessories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    maxWeight?: number | undefined;
    dimensions?: {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    } | undefined;
    adjustableHeight?: boolean | undefined;
    safetyFeatures?: string[] | undefined;
    accessories?: string[] | undefined;
}, {
    maxWeight?: number | undefined;
    dimensions?: {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    } | undefined;
    adjustableHeight?: boolean | undefined;
    safetyFeatures?: string[] | undefined;
    accessories?: string[] | undefined;
}>;
export declare const EquipmentSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof EquipmentType>;
    brand: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    specifications: z.ZodObject<{
        maxWeight: z.ZodOptional<z.ZodNumber>;
        dimensions: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
        }, "strip", z.ZodTypeAny, {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        }, {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        }>>;
        adjustableHeight: z.ZodOptional<z.ZodBoolean>;
        safetyFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        accessories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        maxWeight?: number | undefined;
        dimensions?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        adjustableHeight?: boolean | undefined;
        safetyFeatures?: string[] | undefined;
        accessories?: string[] | undefined;
    }, {
        maxWeight?: number | undefined;
        dimensions?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        adjustableHeight?: boolean | undefined;
        safetyFeatures?: string[] | undefined;
        accessories?: string[] | undefined;
    }>;
    condition: z.ZodNativeEnum<typeof EquipmentCondition>;
    limitations: z.ZodArray<z.ZodString, "many">;
    lastMaintenance: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type: EquipmentType;
    specifications: {
        maxWeight?: number | undefined;
        dimensions?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        adjustableHeight?: boolean | undefined;
        safetyFeatures?: string[] | undefined;
        accessories?: string[] | undefined;
    };
    condition: EquipmentCondition;
    limitations: string[];
    brand?: string | undefined;
    model?: string | undefined;
    lastMaintenance?: Date | undefined;
}, {
    type: EquipmentType;
    specifications: {
        maxWeight?: number | undefined;
        dimensions?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        adjustableHeight?: boolean | undefined;
        safetyFeatures?: string[] | undefined;
        accessories?: string[] | undefined;
    };
    condition: EquipmentCondition;
    limitations: string[];
    brand?: string | undefined;
    model?: string | undefined;
    lastMaintenance?: Date | undefined;
}>;
export declare const PlateInventorySchema: z.ZodObject<{
    weight: z.ZodNumber;
    quantity: z.ZodNumber;
    material: z.ZodNativeEnum<typeof PlateMaterial>;
    type: z.ZodNativeEnum<typeof PlateType>;
}, "strip", z.ZodTypeAny, {
    type: PlateType;
    weight: number;
    quantity: number;
    material: PlateMaterial;
}, {
    type: PlateType;
    weight: number;
    quantity: number;
    material: PlateMaterial;
}>;
export declare const FractionalPlateSetSchema: z.ZodObject<{
    has0_25kg: z.ZodBoolean;
    has0_5kg: z.ZodBoolean;
    has1_25lbs: z.ZodBoolean;
    has2_5lbs: z.ZodBoolean;
    customFractionals: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    has0_25kg: boolean;
    has0_5kg: boolean;
    has1_25lbs: boolean;
    has2_5lbs: boolean;
    customFractionals: number[];
}, {
    has0_25kg: boolean;
    has0_5kg: boolean;
    has1_25lbs: boolean;
    has2_5lbs: boolean;
    customFractionals: number[];
}>;
export declare const PlateConfigurationSchema: z.ZodObject<{
    unit: z.ZodNativeEnum<typeof WeightUnit>;
    barWeight: z.ZodNumber;
    availablePlates: z.ZodArray<z.ZodObject<{
        weight: z.ZodNumber;
        quantity: z.ZodNumber;
        material: z.ZodNativeEnum<typeof PlateMaterial>;
        type: z.ZodNativeEnum<typeof PlateType>;
    }, "strip", z.ZodTypeAny, {
        type: PlateType;
        weight: number;
        quantity: number;
        material: PlateMaterial;
    }, {
        type: PlateType;
        weight: number;
        quantity: number;
        material: PlateMaterial;
    }>, "many">;
    hasCollars: z.ZodBoolean;
    collarWeight: z.ZodNumber;
    loadingPins: z.ZodBoolean;
    fractionalPlates: z.ZodObject<{
        has0_25kg: z.ZodBoolean;
        has0_5kg: z.ZodBoolean;
        has1_25lbs: z.ZodBoolean;
        has2_5lbs: z.ZodBoolean;
        customFractionals: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        has0_25kg: boolean;
        has0_5kg: boolean;
        has1_25lbs: boolean;
        has2_5lbs: boolean;
        customFractionals: number[];
    }, {
        has0_25kg: boolean;
        has0_5kg: boolean;
        has1_25lbs: boolean;
        has2_5lbs: boolean;
        customFractionals: number[];
    }>;
}, "strip", z.ZodTypeAny, {
    unit: WeightUnit;
    barWeight: number;
    availablePlates: {
        type: PlateType;
        weight: number;
        quantity: number;
        material: PlateMaterial;
    }[];
    hasCollars: boolean;
    collarWeight: number;
    loadingPins: boolean;
    fractionalPlates: {
        has0_25kg: boolean;
        has0_5kg: boolean;
        has1_25lbs: boolean;
        has2_5lbs: boolean;
        customFractionals: number[];
    };
}, {
    unit: WeightUnit;
    barWeight: number;
    availablePlates: {
        type: PlateType;
        weight: number;
        quantity: number;
        material: PlateMaterial;
    }[];
    hasCollars: boolean;
    collarWeight: number;
    loadingPins: boolean;
    fractionalPlates: {
        has0_25kg: boolean;
        has0_5kg: boolean;
        has1_25lbs: boolean;
        has2_5lbs: boolean;
        customFractionals: number[];
    };
}>;
export declare const TimeRestrictionSchema: z.ZodObject<{
    startTime: z.ZodString;
    endTime: z.ZodString;
    daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    description?: string | undefined;
}, {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    description?: string | undefined;
}>;
export declare const SpaceConstraintsSchema: z.ZodObject<{
    ceilingHeight: z.ZodOptional<z.ZodNumber>;
    floorSpace: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
    }, "strip", z.ZodTypeAny, {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    }, {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    }>>;
    noiseRestrictions: z.ZodOptional<z.ZodBoolean>;
    timeRestrictions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        startTime: z.ZodString;
        endTime: z.ZodString;
        daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startTime: string;
        endTime: string;
        daysOfWeek: number[];
        description?: string | undefined;
    }, {
        startTime: string;
        endTime: string;
        daysOfWeek: number[];
        description?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    ceilingHeight?: number | undefined;
    floorSpace?: {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    } | undefined;
    noiseRestrictions?: boolean | undefined;
    timeRestrictions?: {
        startTime: string;
        endTime: string;
        daysOfWeek: number[];
        description?: string | undefined;
    }[] | undefined;
}, {
    ceilingHeight?: number | undefined;
    floorSpace?: {
        length: number;
        width: number;
        unit: "cm" | "in" | "m" | "ft";
        height?: number | undefined;
    } | undefined;
    noiseRestrictions?: boolean | undefined;
    timeRestrictions?: {
        startTime: string;
        endTime: string;
        daysOfWeek: number[];
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const EquipmentProfileSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    location: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    availableEquipment: z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof EquipmentType>;
        brand: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        specifications: z.ZodObject<{
            maxWeight: z.ZodOptional<z.ZodNumber>;
            dimensions: z.ZodOptional<z.ZodObject<{
                length: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodOptional<z.ZodNumber>;
                unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
            }, "strip", z.ZodTypeAny, {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            }, {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            }>>;
            adjustableHeight: z.ZodOptional<z.ZodBoolean>;
            safetyFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            accessories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        }, {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        }>;
        condition: z.ZodNativeEnum<typeof EquipmentCondition>;
        limitations: z.ZodArray<z.ZodString, "many">;
        lastMaintenance: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: EquipmentType;
        specifications: {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        };
        condition: EquipmentCondition;
        limitations: string[];
        brand?: string | undefined;
        model?: string | undefined;
        lastMaintenance?: Date | undefined;
    }, {
        type: EquipmentType;
        specifications: {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        };
        condition: EquipmentCondition;
        limitations: string[];
        brand?: string | undefined;
        model?: string | undefined;
        lastMaintenance?: Date | undefined;
    }>, "many">;
    plateConfiguration: z.ZodObject<{
        unit: z.ZodNativeEnum<typeof WeightUnit>;
        barWeight: z.ZodNumber;
        availablePlates: z.ZodArray<z.ZodObject<{
            weight: z.ZodNumber;
            quantity: z.ZodNumber;
            material: z.ZodNativeEnum<typeof PlateMaterial>;
            type: z.ZodNativeEnum<typeof PlateType>;
        }, "strip", z.ZodTypeAny, {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }, {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }>, "many">;
        hasCollars: z.ZodBoolean;
        collarWeight: z.ZodNumber;
        loadingPins: z.ZodBoolean;
        fractionalPlates: z.ZodObject<{
            has0_25kg: z.ZodBoolean;
            has0_5kg: z.ZodBoolean;
            has1_25lbs: z.ZodBoolean;
            has2_5lbs: z.ZodBoolean;
            customFractionals: z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        }, {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        }>;
    }, "strip", z.ZodTypeAny, {
        unit: WeightUnit;
        barWeight: number;
        availablePlates: {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }[];
        hasCollars: boolean;
        collarWeight: number;
        loadingPins: boolean;
        fractionalPlates: {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        };
    }, {
        unit: WeightUnit;
        barWeight: number;
        availablePlates: {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }[];
        hasCollars: boolean;
        collarWeight: number;
        loadingPins: boolean;
        fractionalPlates: {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        };
    }>;
    spaceConstraints: z.ZodOptional<z.ZodObject<{
        ceilingHeight: z.ZodOptional<z.ZodNumber>;
        floorSpace: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
        }, "strip", z.ZodTypeAny, {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        }, {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        }>>;
        noiseRestrictions: z.ZodOptional<z.ZodBoolean>;
        timeRestrictions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            startTime: z.ZodString;
            endTime: z.ZodString;
            daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            startTime: string;
            endTime: string;
            daysOfWeek: number[];
            description?: string | undefined;
        }, {
            startTime: string;
            endTime: string;
            daysOfWeek: number[];
            description?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        ceilingHeight?: number | undefined;
        floorSpace?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        noiseRestrictions?: boolean | undefined;
        timeRestrictions?: {
            startTime: string;
            endTime: string;
            daysOfWeek: number[];
            description?: string | undefined;
        }[] | undefined;
    }, {
        ceilingHeight?: number | undefined;
        floorSpace?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        noiseRestrictions?: boolean | undefined;
        timeRestrictions?: {
            startTime: string;
            endTime: string;
            daysOfWeek: number[];
            description?: string | undefined;
        }[] | undefined;
    }>>;
    isDefault: z.ZodBoolean;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    location: string;
    userId: string;
    availableEquipment: {
        type: EquipmentType;
        specifications: {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        };
        condition: EquipmentCondition;
        limitations: string[];
        brand?: string | undefined;
        model?: string | undefined;
        lastMaintenance?: Date | undefined;
    }[];
    plateConfiguration: {
        unit: WeightUnit;
        barWeight: number;
        availablePlates: {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }[];
        hasCollars: boolean;
        collarWeight: number;
        loadingPins: boolean;
        fractionalPlates: {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        };
    };
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    spaceConstraints?: {
        ceilingHeight?: number | undefined;
        floorSpace?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        noiseRestrictions?: boolean | undefined;
        timeRestrictions?: {
            startTime: string;
            endTime: string;
            daysOfWeek: number[];
            description?: string | undefined;
        }[] | undefined;
    } | undefined;
}, {
    id: string;
    name: string;
    location: string;
    userId: string;
    availableEquipment: {
        type: EquipmentType;
        specifications: {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        };
        condition: EquipmentCondition;
        limitations: string[];
        brand?: string | undefined;
        model?: string | undefined;
        lastMaintenance?: Date | undefined;
    }[];
    plateConfiguration: {
        unit: WeightUnit;
        barWeight: number;
        availablePlates: {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }[];
        hasCollars: boolean;
        collarWeight: number;
        loadingPins: boolean;
        fractionalPlates: {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        };
    };
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    spaceConstraints?: {
        ceilingHeight?: number | undefined;
        floorSpace?: {
            length: number;
            width: number;
            unit: "cm" | "in" | "m" | "ft";
            height?: number | undefined;
        } | undefined;
        noiseRestrictions?: boolean | undefined;
        timeRestrictions?: {
            startTime: string;
            endTime: string;
            daysOfWeek: number[];
            description?: string | undefined;
        }[] | undefined;
    } | undefined;
}>;
export declare const AccommodationRequirementSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof DisabilityType>;
    description: z.ZodString;
    equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    modifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    type: DisabilityType;
    equipment?: string[] | undefined;
    modifications?: string[] | undefined;
}, {
    description: string;
    type: DisabilityType;
    equipment?: string[] | undefined;
    modifications?: string[] | undefined;
}>;
export declare const AdaptiveEquipmentSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: string;
    description?: string | undefined;
    specifications?: Record<string, any> | undefined;
}, {
    name: string;
    type: string;
    description?: string | undefined;
    specifications?: Record<string, any> | undefined;
}>;
export declare const ExerciseModificationSchema: z.ZodObject<{
    exerciseId: z.ZodString;
    modificationType: z.ZodString;
    description: z.ZodString;
    alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    exerciseId: string;
    modificationType: string;
    alternatives?: string[] | undefined;
}, {
    description: string;
    exerciseId: string;
    modificationType: string;
    alternatives?: string[] | undefined;
}>;
export declare const DisabilityAccommodationSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof DisabilityType>;
    description: z.ZodString;
    accommodations: z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof DisabilityType>;
        description: z.ZodString;
        equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        modifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: DisabilityType;
        equipment?: string[] | undefined;
        modifications?: string[] | undefined;
    }, {
        description: string;
        type: DisabilityType;
        equipment?: string[] | undefined;
        modifications?: string[] | undefined;
    }>, "many">;
    adaptiveEquipment: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        description?: string | undefined;
        specifications?: Record<string, any> | undefined;
    }, {
        name: string;
        type: string;
        description?: string | undefined;
        specifications?: Record<string, any> | undefined;
    }>, "many">;
    exerciseModifications: z.ZodArray<z.ZodObject<{
        exerciseId: z.ZodString;
        modificationType: z.ZodString;
        description: z.ZodString;
        alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        exerciseId: string;
        modificationType: string;
        alternatives?: string[] | undefined;
    }, {
        description: string;
        exerciseId: string;
        modificationType: string;
        alternatives?: string[] | undefined;
    }>, "many">;
    isTemporary: z.ZodBoolean;
    startDate: z.ZodDate;
    endDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    description: string;
    type: DisabilityType;
    accommodations: {
        description: string;
        type: DisabilityType;
        equipment?: string[] | undefined;
        modifications?: string[] | undefined;
    }[];
    adaptiveEquipment: {
        name: string;
        type: string;
        description?: string | undefined;
        specifications?: Record<string, any> | undefined;
    }[];
    exerciseModifications: {
        description: string;
        exerciseId: string;
        modificationType: string;
        alternatives?: string[] | undefined;
    }[];
    isTemporary: boolean;
    startDate: Date;
    endDate?: Date | undefined;
}, {
    description: string;
    type: DisabilityType;
    accommodations: {
        description: string;
        type: DisabilityType;
        equipment?: string[] | undefined;
        modifications?: string[] | undefined;
    }[];
    adaptiveEquipment: {
        name: string;
        type: string;
        description?: string | undefined;
        specifications?: Record<string, any> | undefined;
    }[];
    exerciseModifications: {
        description: string;
        exerciseId: string;
        modificationType: string;
        alternatives?: string[] | undefined;
    }[];
    isTemporary: boolean;
    startDate: Date;
    endDate?: Date | undefined;
}>;
export declare const ROMRestrictionSchema: z.ZodObject<{
    joint: z.ZodNativeEnum<typeof Joint>;
    movementPlane: z.ZodNativeEnum<typeof MovementPlane>;
    restrictionType: z.ZodNativeEnum<typeof RestrictionType>;
    limitationDegrees: z.ZodOptional<z.ZodNumber>;
    affectedExercises: z.ZodArray<z.ZodString, "many">;
    compensations: z.ZodArray<z.ZodString, "many">;
    isTemporary: z.ZodBoolean;
    startDate: z.ZodDate;
    endDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    isTemporary: boolean;
    startDate: Date;
    joint: Joint;
    movementPlane: MovementPlane;
    restrictionType: RestrictionType;
    affectedExercises: string[];
    compensations: string[];
    endDate?: Date | undefined;
    limitationDegrees?: number | undefined;
}, {
    isTemporary: boolean;
    startDate: Date;
    joint: Joint;
    movementPlane: MovementPlane;
    restrictionType: RestrictionType;
    affectedExercises: string[];
    compensations: string[];
    endDate?: Date | undefined;
    limitationDegrees?: number | undefined;
}>;
export declare const MenstrualSymptomSchema: z.ZodObject<{
    type: z.ZodString;
    severity: z.ZodNativeEnum<typeof SeverityLevel>;
    cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    severity: SeverityLevel;
    cyclePhase: CyclePhase;
    notes?: string | undefined;
}, {
    type: string;
    severity: SeverityLevel;
    cyclePhase: CyclePhase;
    notes?: string | undefined;
}>;
export declare const CycleTrainingAdjustmentSchema: z.ZodObject<{
    cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
    intensityModifier: z.ZodNumber;
    volumeModifier: z.ZodNumber;
    exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    recommendedFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    cyclePhase: CyclePhase;
    intensityModifier: number;
    volumeModifier: number;
    exerciseRestrictions?: string[] | undefined;
    recommendedFocus?: string[] | undefined;
}, {
    cyclePhase: CyclePhase;
    intensityModifier: number;
    volumeModifier: number;
    exerciseRestrictions?: string[] | undefined;
    recommendedFocus?: string[] | undefined;
}>;
export declare const MenstrualCycleSettingsSchema: z.ZodObject<{
    trackingEnabled: z.ZodBoolean;
    cycleLength: z.ZodNumber;
    lastPeriodStart: z.ZodOptional<z.ZodDate>;
    symptoms: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        severity: z.ZodNativeEnum<typeof SeverityLevel>;
        cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        severity: SeverityLevel;
        cyclePhase: CyclePhase;
        notes?: string | undefined;
    }, {
        type: string;
        severity: SeverityLevel;
        cyclePhase: CyclePhase;
        notes?: string | undefined;
    }>, "many">;
    trainingAdjustments: z.ZodArray<z.ZodObject<{
        cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
        intensityModifier: z.ZodNumber;
        volumeModifier: z.ZodNumber;
        exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        recommendedFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        cyclePhase: CyclePhase;
        intensityModifier: number;
        volumeModifier: number;
        exerciseRestrictions?: string[] | undefined;
        recommendedFocus?: string[] | undefined;
    }, {
        cyclePhase: CyclePhase;
        intensityModifier: number;
        volumeModifier: number;
        exerciseRestrictions?: string[] | undefined;
        recommendedFocus?: string[] | undefined;
    }>, "many">;
    privacyLevel: z.ZodNativeEnum<typeof CyclePrivacyLevel>;
    shareWithCoach: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    shareWithCoach: boolean;
    trackingEnabled: boolean;
    cycleLength: number;
    symptoms: {
        type: string;
        severity: SeverityLevel;
        cyclePhase: CyclePhase;
        notes?: string | undefined;
    }[];
    trainingAdjustments: {
        cyclePhase: CyclePhase;
        intensityModifier: number;
        volumeModifier: number;
        exerciseRestrictions?: string[] | undefined;
        recommendedFocus?: string[] | undefined;
    }[];
    privacyLevel: CyclePrivacyLevel;
    lastPeriodStart?: Date | undefined;
}, {
    shareWithCoach: boolean;
    trackingEnabled: boolean;
    cycleLength: number;
    symptoms: {
        type: string;
        severity: SeverityLevel;
        cyclePhase: CyclePhase;
        notes?: string | undefined;
    }[];
    trainingAdjustments: {
        cyclePhase: CyclePhase;
        intensityModifier: number;
        volumeModifier: number;
        exerciseRestrictions?: string[] | undefined;
        recommendedFocus?: string[] | undefined;
    }[];
    privacyLevel: CyclePrivacyLevel;
    lastPeriodStart?: Date | undefined;
}>;
export declare const ChronicConditionSchema: z.ZodObject<{
    name: z.ZodString;
    diagnosedDate: z.ZodOptional<z.ZodDate>;
    severity: z.ZodNativeEnum<typeof SeverityLevel>;
    medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    monitoringRequired: z.ZodOptional<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    severity: SeverityLevel;
    notes?: string | undefined;
    medications?: string[] | undefined;
    exerciseRestrictions?: string[] | undefined;
    diagnosedDate?: Date | undefined;
    monitoringRequired?: boolean | undefined;
}, {
    name: string;
    severity: SeverityLevel;
    notes?: string | undefined;
    medications?: string[] | undefined;
    exerciseRestrictions?: string[] | undefined;
    diagnosedDate?: Date | undefined;
    monitoringRequired?: boolean | undefined;
}>;
export declare const MedicationInfoSchema: z.ZodObject<{
    name: z.ZodString;
    dosage: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    sideEffects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    exerciseInteractions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    frequency?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    dosage?: string | undefined;
    sideEffects?: string[] | undefined;
    exerciseInteractions?: string[] | undefined;
}, {
    name: string;
    frequency?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    dosage?: string | undefined;
    sideEffects?: string[] | undefined;
    exerciseInteractions?: string[] | undefined;
}>;
export declare const AllergyInfoSchema: z.ZodObject<{
    allergen: z.ZodString;
    severity: z.ZodNativeEnum<typeof SeverityLevel>;
    reactions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avoidanceInstructions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    severity: SeverityLevel;
    allergen: string;
    reactions?: string[] | undefined;
    avoidanceInstructions?: string[] | undefined;
}, {
    severity: SeverityLevel;
    allergen: string;
    reactions?: string[] | undefined;
    avoidanceInstructions?: string[] | undefined;
}>;
export declare const EmergencyMedicalInfoSchema: z.ZodObject<{
    bloodType: z.ZodOptional<z.ZodString>;
    emergencyContacts: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        relationship: z.ZodString;
        phoneNumber: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    }, {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    }>, "many">;
    medicalConditions: z.ZodArray<z.ZodString, "many">;
    medications: z.ZodArray<z.ZodString, "many">;
    allergies: z.ZodArray<z.ZodString, "many">;
    doctorContact: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phoneNumber: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        }, {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    }, {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    }>>;
    insuranceInfo: z.ZodOptional<z.ZodObject<{
        provider: z.ZodString;
        policyNumber: z.ZodString;
        groupNumber: z.ZodOptional<z.ZodString>;
        memberName: z.ZodString;
        effectiveDate: z.ZodDate;
        expirationDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    }, {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    medications: string[];
    allergies: string[];
    emergencyContacts: {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    }[];
    medicalConditions: string[];
    bloodType?: string | undefined;
    doctorContact?: {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    } | undefined;
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    } | undefined;
}, {
    medications: string[];
    allergies: string[];
    emergencyContacts: {
        name: string;
        relationship: string;
        phoneNumber: string;
        isPrimary: boolean;
        email?: string | undefined;
    }[];
    medicalConditions: string[];
    bloodType?: string | undefined;
    doctorContact?: {
        name: string;
        phoneNumber: string;
        email?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
    } | undefined;
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        memberName: string;
        effectiveDate: Date;
        groupNumber?: string | undefined;
        expirationDate?: Date | undefined;
    } | undefined;
}>;
export declare const HealthConsiderationsSchema: z.ZodObject<{
    disabilities: z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof DisabilityType>;
        description: z.ZodString;
        accommodations: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof DisabilityType>;
            description: z.ZodString;
            equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            modifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }, {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }>, "many">;
        adaptiveEquipment: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }, {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }>, "many">;
        exerciseModifications: z.ZodArray<z.ZodObject<{
            exerciseId: z.ZodString;
            modificationType: z.ZodString;
            description: z.ZodString;
            alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }, {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }>, "many">;
        isTemporary: z.ZodBoolean;
        startDate: z.ZodDate;
        endDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: DisabilityType;
        accommodations: {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }[];
        adaptiveEquipment: {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }[];
        exerciseModifications: {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }[];
        isTemporary: boolean;
        startDate: Date;
        endDate?: Date | undefined;
    }, {
        description: string;
        type: DisabilityType;
        accommodations: {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }[];
        adaptiveEquipment: {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }[];
        exerciseModifications: {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }[];
        isTemporary: boolean;
        startDate: Date;
        endDate?: Date | undefined;
    }>, "many">;
    rangeOfMotionLimitations: z.ZodArray<z.ZodObject<{
        joint: z.ZodNativeEnum<typeof Joint>;
        movementPlane: z.ZodNativeEnum<typeof MovementPlane>;
        restrictionType: z.ZodNativeEnum<typeof RestrictionType>;
        limitationDegrees: z.ZodOptional<z.ZodNumber>;
        affectedExercises: z.ZodArray<z.ZodString, "many">;
        compensations: z.ZodArray<z.ZodString, "many">;
        isTemporary: z.ZodBoolean;
        startDate: z.ZodDate;
        endDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        isTemporary: boolean;
        startDate: Date;
        joint: Joint;
        movementPlane: MovementPlane;
        restrictionType: RestrictionType;
        affectedExercises: string[];
        compensations: string[];
        endDate?: Date | undefined;
        limitationDegrees?: number | undefined;
    }, {
        isTemporary: boolean;
        startDate: Date;
        joint: Joint;
        movementPlane: MovementPlane;
        restrictionType: RestrictionType;
        affectedExercises: string[];
        compensations: string[];
        endDate?: Date | undefined;
        limitationDegrees?: number | undefined;
    }>, "many">;
    menstrualCycleTracking: z.ZodOptional<z.ZodObject<{
        trackingEnabled: z.ZodBoolean;
        cycleLength: z.ZodNumber;
        lastPeriodStart: z.ZodOptional<z.ZodDate>;
        symptoms: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            severity: z.ZodNativeEnum<typeof SeverityLevel>;
            cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }, {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }>, "many">;
        trainingAdjustments: z.ZodArray<z.ZodObject<{
            cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
            intensityModifier: z.ZodNumber;
            volumeModifier: z.ZodNumber;
            exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            recommendedFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }, {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }>, "many">;
        privacyLevel: z.ZodNativeEnum<typeof CyclePrivacyLevel>;
        shareWithCoach: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        shareWithCoach: boolean;
        trackingEnabled: boolean;
        cycleLength: number;
        symptoms: {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }[];
        trainingAdjustments: {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }[];
        privacyLevel: CyclePrivacyLevel;
        lastPeriodStart?: Date | undefined;
    }, {
        shareWithCoach: boolean;
        trackingEnabled: boolean;
        cycleLength: number;
        symptoms: {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }[];
        trainingAdjustments: {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }[];
        privacyLevel: CyclePrivacyLevel;
        lastPeriodStart?: Date | undefined;
    }>>;
    chronicConditions: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        diagnosedDate: z.ZodOptional<z.ZodDate>;
        severity: z.ZodNativeEnum<typeof SeverityLevel>;
        medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        monitoringRequired: z.ZodOptional<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        severity: SeverityLevel;
        notes?: string | undefined;
        medications?: string[] | undefined;
        exerciseRestrictions?: string[] | undefined;
        diagnosedDate?: Date | undefined;
        monitoringRequired?: boolean | undefined;
    }, {
        name: string;
        severity: SeverityLevel;
        notes?: string | undefined;
        medications?: string[] | undefined;
        exerciseRestrictions?: string[] | undefined;
        diagnosedDate?: Date | undefined;
        monitoringRequired?: boolean | undefined;
    }>, "many">;
    medications: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        dosage: z.ZodOptional<z.ZodString>;
        frequency: z.ZodOptional<z.ZodString>;
        startDate: z.ZodOptional<z.ZodDate>;
        endDate: z.ZodOptional<z.ZodDate>;
        sideEffects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exerciseInteractions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        frequency?: string | undefined;
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        dosage?: string | undefined;
        sideEffects?: string[] | undefined;
        exerciseInteractions?: string[] | undefined;
    }, {
        name: string;
        frequency?: string | undefined;
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        dosage?: string | undefined;
        sideEffects?: string[] | undefined;
        exerciseInteractions?: string[] | undefined;
    }>, "many">;
    allergies: z.ZodArray<z.ZodObject<{
        allergen: z.ZodString;
        severity: z.ZodNativeEnum<typeof SeverityLevel>;
        reactions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        avoidanceInstructions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        severity: SeverityLevel;
        allergen: string;
        reactions?: string[] | undefined;
        avoidanceInstructions?: string[] | undefined;
    }, {
        severity: SeverityLevel;
        allergen: string;
        reactions?: string[] | undefined;
        avoidanceInstructions?: string[] | undefined;
    }>, "many">;
    emergencyMedicalInfo: z.ZodOptional<z.ZodObject<{
        bloodType: z.ZodOptional<z.ZodString>;
        emergencyContacts: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            relationship: z.ZodString;
            phoneNumber: z.ZodString;
            email: z.ZodOptional<z.ZodString>;
            isPrimary: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }>, "many">;
        medicalConditions: z.ZodArray<z.ZodString, "many">;
        medications: z.ZodArray<z.ZodString, "many">;
        allergies: z.ZodArray<z.ZodString, "many">;
        doctorContact: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            phoneNumber: z.ZodString;
            email: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodObject<{
                street: z.ZodString;
                city: z.ZodString;
                state: z.ZodString;
                postalCode: z.ZodString;
                country: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            }, {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        }, {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        }>>;
        insuranceInfo: z.ZodOptional<z.ZodObject<{
            provider: z.ZodString;
            policyNumber: z.ZodString;
            groupNumber: z.ZodOptional<z.ZodString>;
            memberName: z.ZodString;
            effectiveDate: z.ZodDate;
            expirationDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        }, {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        medications: string[];
        allergies: string[];
        emergencyContacts: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }[];
        medicalConditions: string[];
        bloodType?: string | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    }, {
        medications: string[];
        allergies: string[];
        emergencyContacts: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }[];
        medicalConditions: string[];
        bloodType?: string | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    }>>;
    lastUpdated: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    chronicConditions: {
        name: string;
        severity: SeverityLevel;
        notes?: string | undefined;
        medications?: string[] | undefined;
        exerciseRestrictions?: string[] | undefined;
        diagnosedDate?: Date | undefined;
        monitoringRequired?: boolean | undefined;
    }[];
    medications: {
        name: string;
        frequency?: string | undefined;
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        dosage?: string | undefined;
        sideEffects?: string[] | undefined;
        exerciseInteractions?: string[] | undefined;
    }[];
    allergies: {
        severity: SeverityLevel;
        allergen: string;
        reactions?: string[] | undefined;
        avoidanceInstructions?: string[] | undefined;
    }[];
    disabilities: {
        description: string;
        type: DisabilityType;
        accommodations: {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }[];
        adaptiveEquipment: {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }[];
        exerciseModifications: {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }[];
        isTemporary: boolean;
        startDate: Date;
        endDate?: Date | undefined;
    }[];
    rangeOfMotionLimitations: {
        isTemporary: boolean;
        startDate: Date;
        joint: Joint;
        movementPlane: MovementPlane;
        restrictionType: RestrictionType;
        affectedExercises: string[];
        compensations: string[];
        endDate?: Date | undefined;
        limitationDegrees?: number | undefined;
    }[];
    lastUpdated: Date;
    menstrualCycleTracking?: {
        shareWithCoach: boolean;
        trackingEnabled: boolean;
        cycleLength: number;
        symptoms: {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }[];
        trainingAdjustments: {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }[];
        privacyLevel: CyclePrivacyLevel;
        lastPeriodStart?: Date | undefined;
    } | undefined;
    emergencyMedicalInfo?: {
        medications: string[];
        allergies: string[];
        emergencyContacts: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }[];
        medicalConditions: string[];
        bloodType?: string | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    } | undefined;
}, {
    chronicConditions: {
        name: string;
        severity: SeverityLevel;
        notes?: string | undefined;
        medications?: string[] | undefined;
        exerciseRestrictions?: string[] | undefined;
        diagnosedDate?: Date | undefined;
        monitoringRequired?: boolean | undefined;
    }[];
    medications: {
        name: string;
        frequency?: string | undefined;
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        dosage?: string | undefined;
        sideEffects?: string[] | undefined;
        exerciseInteractions?: string[] | undefined;
    }[];
    allergies: {
        severity: SeverityLevel;
        allergen: string;
        reactions?: string[] | undefined;
        avoidanceInstructions?: string[] | undefined;
    }[];
    disabilities: {
        description: string;
        type: DisabilityType;
        accommodations: {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }[];
        adaptiveEquipment: {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }[];
        exerciseModifications: {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }[];
        isTemporary: boolean;
        startDate: Date;
        endDate?: Date | undefined;
    }[];
    rangeOfMotionLimitations: {
        isTemporary: boolean;
        startDate: Date;
        joint: Joint;
        movementPlane: MovementPlane;
        restrictionType: RestrictionType;
        affectedExercises: string[];
        compensations: string[];
        endDate?: Date | undefined;
        limitationDegrees?: number | undefined;
    }[];
    lastUpdated: Date;
    menstrualCycleTracking?: {
        shareWithCoach: boolean;
        trackingEnabled: boolean;
        cycleLength: number;
        symptoms: {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }[];
        trainingAdjustments: {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }[];
        privacyLevel: CyclePrivacyLevel;
        lastPeriodStart?: Date | undefined;
    } | undefined;
    emergencyMedicalInfo?: {
        medications: string[];
        allergies: string[];
        emergencyContacts: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }[];
        medicalConditions: string[];
        bloodType?: string | undefined;
        doctorContact?: {
            name: string;
            phoneNumber: string;
            email?: string | undefined;
            address?: {
                street: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | undefined;
        } | undefined;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            memberName: string;
            effectiveDate: Date;
            groupNumber?: string | undefined;
            expirationDate?: Date | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const TimeSlotSchema: z.ZodObject<{
    startTime: z.ZodString;
    endTime: z.ZodString;
    preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
}, "strip", z.ZodTypeAny, {
    startTime: string;
    endTime: string;
    preference: TimePreferenceLevel;
}, {
    startTime: string;
    endTime: string;
    preference: TimePreferenceLevel;
}>;
export declare const DayAvailabilitySchema: z.ZodObject<{
    dayOfWeek: z.ZodNumber;
    isAvailable: z.ZodBoolean;
    timeSlots: z.ZodArray<z.ZodObject<{
        startTime: z.ZodString;
        endTime: z.ZodString;
        preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
    }, "strip", z.ZodTypeAny, {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }, {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dayOfWeek: number;
    isAvailable: boolean;
    timeSlots: {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }[];
    notes?: string | undefined;
}, {
    dayOfWeek: number;
    isAvailable: boolean;
    timeSlots: {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }[];
    notes?: string | undefined;
}>;
export declare const TimePreferenceSchema: z.ZodObject<{
    timeOfDay: z.ZodNativeEnum<typeof TimeOfDay>;
    preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    preference: TimePreferenceLevel;
    timeOfDay: TimeOfDay;
    notes?: string | undefined;
}, {
    preference: TimePreferenceLevel;
    timeOfDay: TimeOfDay;
    notes?: string | undefined;
}>;
export declare const SessionDurationSchema: z.ZodObject<{
    preferred: z.ZodNumber;
    minimum: z.ZodNumber;
    maximum: z.ZodNumber;
    flexibility: z.ZodNativeEnum<typeof FlexibilityLevel>;
}, "strip", z.ZodTypeAny, {
    preferred: number;
    minimum: number;
    maximum: number;
    flexibility: FlexibilityLevel;
}, {
    preferred: number;
    minimum: number;
    maximum: number;
    flexibility: FlexibilityLevel;
}>;
export declare const RestDayPreferenceSchema: z.ZodObject<{
    dayOfWeek: z.ZodNumber;
    isPreferred: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dayOfWeek: number;
    isPreferred: boolean;
    reason?: string | undefined;
}, {
    dayOfWeek: number;
    isPreferred: boolean;
    reason?: string | undefined;
}>;
export declare const ScheduleConsiderationSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof ConsiderationType>;
    description: z.ZodString;
    priority: z.ZodNativeEnum<typeof PriorityLevel>;
    affectedDays: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    affectedTimes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        startTime: z.ZodString;
        endTime: z.ZodString;
        preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
    }, "strip", z.ZodTypeAny, {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }, {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    type: ConsiderationType;
    priority: PriorityLevel;
    affectedDays?: number[] | undefined;
    affectedTimes?: {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }[] | undefined;
}, {
    description: string;
    type: ConsiderationType;
    priority: PriorityLevel;
    affectedDays?: number[] | undefined;
    affectedTimes?: {
        startTime: string;
        endTime: string;
        preference: TimePreferenceLevel;
    }[] | undefined;
}>;
export declare const TrainingScheduleSchema: z.ZodObject<{
    userId: z.ZodString;
    availableDays: z.ZodArray<z.ZodObject<{
        dayOfWeek: z.ZodNumber;
        isAvailable: z.ZodBoolean;
        timeSlots: z.ZodArray<z.ZodObject<{
            startTime: z.ZodString;
            endTime: z.ZodString;
            preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
        }, "strip", z.ZodTypeAny, {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }, {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }>, "many">;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dayOfWeek: number;
        isAvailable: boolean;
        timeSlots: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[];
        notes?: string | undefined;
    }, {
        dayOfWeek: number;
        isAvailable: boolean;
        timeSlots: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[];
        notes?: string | undefined;
    }>, "many">;
    preferredTimes: z.ZodArray<z.ZodObject<{
        timeOfDay: z.ZodNativeEnum<typeof TimeOfDay>;
        preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        preference: TimePreferenceLevel;
        timeOfDay: TimeOfDay;
        notes?: string | undefined;
    }, {
        preference: TimePreferenceLevel;
        timeOfDay: TimeOfDay;
        notes?: string | undefined;
    }>, "many">;
    sessionDuration: z.ZodObject<{
        preferred: z.ZodNumber;
        minimum: z.ZodNumber;
        maximum: z.ZodNumber;
        flexibility: z.ZodNativeEnum<typeof FlexibilityLevel>;
    }, "strip", z.ZodTypeAny, {
        preferred: number;
        minimum: number;
        maximum: number;
        flexibility: FlexibilityLevel;
    }, {
        preferred: number;
        minimum: number;
        maximum: number;
        flexibility: FlexibilityLevel;
    }>;
    restDayPreferences: z.ZodArray<z.ZodObject<{
        dayOfWeek: z.ZodNumber;
        isPreferred: z.ZodBoolean;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dayOfWeek: number;
        isPreferred: boolean;
        reason?: string | undefined;
    }, {
        dayOfWeek: number;
        isPreferred: boolean;
        reason?: string | undefined;
    }>, "many">;
    specialConsiderations: z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<typeof ConsiderationType>;
        description: z.ZodString;
        priority: z.ZodNativeEnum<typeof PriorityLevel>;
        affectedDays: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        affectedTimes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            startTime: z.ZodString;
            endTime: z.ZodString;
            preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
        }, "strip", z.ZodTypeAny, {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }, {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: ConsiderationType;
        priority: PriorityLevel;
        affectedDays?: number[] | undefined;
        affectedTimes?: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[] | undefined;
    }, {
        description: string;
        type: ConsiderationType;
        priority: PriorityLevel;
        affectedDays?: number[] | undefined;
        affectedTimes?: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[] | undefined;
    }>, "many">;
    timezone: z.ZodString;
    lastUpdated: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timezone: string;
    lastUpdated: Date;
    availableDays: {
        dayOfWeek: number;
        isAvailable: boolean;
        timeSlots: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[];
        notes?: string | undefined;
    }[];
    preferredTimes: {
        preference: TimePreferenceLevel;
        timeOfDay: TimeOfDay;
        notes?: string | undefined;
    }[];
    sessionDuration: {
        preferred: number;
        minimum: number;
        maximum: number;
        flexibility: FlexibilityLevel;
    };
    restDayPreferences: {
        dayOfWeek: number;
        isPreferred: boolean;
        reason?: string | undefined;
    }[];
    specialConsiderations: {
        description: string;
        type: ConsiderationType;
        priority: PriorityLevel;
        affectedDays?: number[] | undefined;
        affectedTimes?: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[] | undefined;
    }[];
}, {
    userId: string;
    timezone: string;
    lastUpdated: Date;
    availableDays: {
        dayOfWeek: number;
        isAvailable: boolean;
        timeSlots: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[];
        notes?: string | undefined;
    }[];
    preferredTimes: {
        preference: TimePreferenceLevel;
        timeOfDay: TimeOfDay;
        notes?: string | undefined;
    }[];
    sessionDuration: {
        preferred: number;
        minimum: number;
        maximum: number;
        flexibility: FlexibilityLevel;
    };
    restDayPreferences: {
        dayOfWeek: number;
        isPreferred: boolean;
        reason?: string | undefined;
    }[];
    specialConsiderations: {
        description: string;
        type: ConsiderationType;
        priority: PriorityLevel;
        affectedDays?: number[] | undefined;
        affectedTimes?: {
            startTime: string;
            endTime: string;
            preference: TimePreferenceLevel;
        }[] | undefined;
    }[];
}>;
export declare const FeatureFlagSchema: z.ZodObject<{
    name: z.ZodString;
    enabled: z.ZodBoolean;
    configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    enabled: boolean;
    configuration?: Record<string, any> | undefined;
}, {
    name: string;
    enabled: boolean;
    configuration?: Record<string, any> | undefined;
}>;
export declare const BrandingSettingsSchema: z.ZodObject<{
    logoUrl: z.ZodOptional<z.ZodString>;
    primaryColor: z.ZodOptional<z.ZodString>;
    secondaryColor: z.ZodOptional<z.ZodString>;
    customDomain: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    logoUrl?: string | undefined;
    primaryColor?: string | undefined;
    secondaryColor?: string | undefined;
    customDomain?: string | undefined;
    companyName?: string | undefined;
}, {
    logoUrl?: string | undefined;
    primaryColor?: string | undefined;
    secondaryColor?: string | undefined;
    customDomain?: string | undefined;
    companyName?: string | undefined;
}>;
export declare const ComplianceSettingsSchema: z.ZodObject<{
    gdprEnabled: z.ZodBoolean;
    pdpaEnabled: z.ZodBoolean;
    hipaaEnabled: z.ZodBoolean;
    dataRetentionDays: z.ZodNumber;
    auditLogRetentionDays: z.ZodNumber;
    consentRequired: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    gdprEnabled: boolean;
    pdpaEnabled: boolean;
    hipaaEnabled: boolean;
    dataRetentionDays: number;
    auditLogRetentionDays: number;
    consentRequired: boolean;
}, {
    gdprEnabled: boolean;
    pdpaEnabled: boolean;
    hipaaEnabled: boolean;
    dataRetentionDays: number;
    auditLogRetentionDays: number;
    consentRequired: boolean;
}>;
export declare const TenantSettingsSchema: z.ZodObject<{
    allowSelfCoached: z.ZodBoolean;
    requireCoachApproval: z.ZodBoolean;
    enableVideoAnalysis: z.ZodBoolean;
    enableAIFeedback: z.ZodBoolean;
    defaultLanguage: z.ZodNativeEnum<typeof SupportedLanguage>;
    defaultWeightUnit: z.ZodNativeEnum<typeof WeightUnit>;
    availableLanguages: z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">;
    maxCoaches: z.ZodNumber;
    maxAthletes: z.ZodNumber;
    features: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        enabled: z.ZodBoolean;
        configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        enabled: boolean;
        configuration?: Record<string, any> | undefined;
    }, {
        name: string;
        enabled: boolean;
        configuration?: Record<string, any> | undefined;
    }>, "many">;
    customBranding: z.ZodOptional<z.ZodObject<{
        logoUrl: z.ZodOptional<z.ZodString>;
        primaryColor: z.ZodOptional<z.ZodString>;
        secondaryColor: z.ZodOptional<z.ZodString>;
        customDomain: z.ZodOptional<z.ZodString>;
        companyName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
        customDomain?: string | undefined;
        companyName?: string | undefined;
    }, {
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
        customDomain?: string | undefined;
        companyName?: string | undefined;
    }>>;
    complianceSettings: z.ZodObject<{
        gdprEnabled: z.ZodBoolean;
        pdpaEnabled: z.ZodBoolean;
        hipaaEnabled: z.ZodBoolean;
        dataRetentionDays: z.ZodNumber;
        auditLogRetentionDays: z.ZodNumber;
        consentRequired: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        gdprEnabled: boolean;
        pdpaEnabled: boolean;
        hipaaEnabled: boolean;
        dataRetentionDays: number;
        auditLogRetentionDays: number;
        consentRequired: boolean;
    }, {
        gdprEnabled: boolean;
        pdpaEnabled: boolean;
        hipaaEnabled: boolean;
        dataRetentionDays: number;
        auditLogRetentionDays: number;
        consentRequired: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    allowSelfCoached: boolean;
    requireCoachApproval: boolean;
    enableVideoAnalysis: boolean;
    enableAIFeedback: boolean;
    defaultLanguage: SupportedLanguage;
    defaultWeightUnit: WeightUnit;
    availableLanguages: SupportedLanguage[];
    maxCoaches: number;
    maxAthletes: number;
    features: {
        name: string;
        enabled: boolean;
        configuration?: Record<string, any> | undefined;
    }[];
    complianceSettings: {
        gdprEnabled: boolean;
        pdpaEnabled: boolean;
        hipaaEnabled: boolean;
        dataRetentionDays: number;
        auditLogRetentionDays: number;
        consentRequired: boolean;
    };
    customBranding?: {
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
        customDomain?: string | undefined;
        companyName?: string | undefined;
    } | undefined;
}, {
    allowSelfCoached: boolean;
    requireCoachApproval: boolean;
    enableVideoAnalysis: boolean;
    enableAIFeedback: boolean;
    defaultLanguage: SupportedLanguage;
    defaultWeightUnit: WeightUnit;
    availableLanguages: SupportedLanguage[];
    maxCoaches: number;
    maxAthletes: number;
    features: {
        name: string;
        enabled: boolean;
        configuration?: Record<string, any> | undefined;
    }[];
    complianceSettings: {
        gdprEnabled: boolean;
        pdpaEnabled: boolean;
        hipaaEnabled: boolean;
        dataRetentionDays: number;
        auditLogRetentionDays: number;
        consentRequired: boolean;
    };
    customBranding?: {
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
        customDomain?: string | undefined;
        companyName?: string | undefined;
    } | undefined;
}>;
export declare const UsageMetricsSchema: z.ZodObject<{
    activeCoaches: z.ZodNumber;
    activeAthletes: z.ZodNumber;
    storageUsed: z.ZodNumber;
    apiCalls: z.ZodNumber;
    videoAnalysisMinutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    activeCoaches: number;
    activeAthletes: number;
    storageUsed: number;
    apiCalls: number;
    videoAnalysisMinutes: number;
}, {
    activeCoaches: number;
    activeAthletes: number;
    storageUsed: number;
    apiCalls: number;
    videoAnalysisMinutes: number;
}>;
export declare const SubscriptionInfoSchema: z.ZodObject<{
    id: z.ZodString;
    planId: z.ZodString;
    status: z.ZodNativeEnum<typeof SubscriptionStatus>;
    currentPeriodStart: z.ZodDate;
    currentPeriodEnd: z.ZodDate;
    cancelAtPeriodEnd: z.ZodBoolean;
    trialEnd: z.ZodOptional<z.ZodDate>;
    usage: z.ZodObject<{
        activeCoaches: z.ZodNumber;
        activeAthletes: z.ZodNumber;
        storageUsed: z.ZodNumber;
        apiCalls: z.ZodNumber;
        videoAnalysisMinutes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activeCoaches: number;
        activeAthletes: number;
        storageUsed: number;
        apiCalls: number;
        videoAnalysisMinutes: number;
    }, {
        activeCoaches: number;
        activeAthletes: number;
        storageUsed: number;
        apiCalls: number;
        videoAnalysisMinutes: number;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: SubscriptionStatus;
    planId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    usage: {
        activeCoaches: number;
        activeAthletes: number;
        storageUsed: number;
        apiCalls: number;
        videoAnalysisMinutes: number;
    };
    trialEnd?: Date | undefined;
}, {
    id: string;
    status: SubscriptionStatus;
    planId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    usage: {
        activeCoaches: number;
        activeAthletes: number;
        storageUsed: number;
        apiCalls: number;
        videoAnalysisMinutes: number;
    };
    trialEnd?: Date | undefined;
}>;
export declare const BillingInfoSchema: z.ZodObject<{
    customerId: z.ZodString;
    paymentMethodId: z.ZodOptional<z.ZodString>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    }, {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    }>>;
    taxId: z.ZodOptional<z.ZodString>;
    currency: z.ZodNativeEnum<typeof Currency>;
    nextBillingDate: z.ZodDate;
    lastPaymentDate: z.ZodOptional<z.ZodDate>;
    outstandingBalance: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    currency: Currency;
    nextBillingDate: Date;
    outstandingBalance: number;
    paymentMethodId?: string | undefined;
    billingAddress?: {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    } | undefined;
    taxId?: string | undefined;
    lastPaymentDate?: Date | undefined;
}, {
    customerId: string;
    currency: Currency;
    nextBillingDate: Date;
    outstandingBalance: number;
    paymentMethodId?: string | undefined;
    billingAddress?: {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    } | undefined;
    taxId?: string | undefined;
    lastPaymentDate?: Date | undefined;
}>;
export declare const TenantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<typeof TenantStatus>;
    settings: z.ZodObject<{
        allowSelfCoached: z.ZodBoolean;
        requireCoachApproval: z.ZodBoolean;
        enableVideoAnalysis: z.ZodBoolean;
        enableAIFeedback: z.ZodBoolean;
        defaultLanguage: z.ZodNativeEnum<typeof SupportedLanguage>;
        defaultWeightUnit: z.ZodNativeEnum<typeof WeightUnit>;
        availableLanguages: z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">;
        maxCoaches: z.ZodNumber;
        maxAthletes: z.ZodNumber;
        features: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            enabled: z.ZodBoolean;
            configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }>, "many">;
        customBranding: z.ZodOptional<z.ZodObject<{
            logoUrl: z.ZodOptional<z.ZodString>;
            primaryColor: z.ZodOptional<z.ZodString>;
            secondaryColor: z.ZodOptional<z.ZodString>;
            customDomain: z.ZodOptional<z.ZodString>;
            companyName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }>>;
        complianceSettings: z.ZodObject<{
            gdprEnabled: z.ZodBoolean;
            pdpaEnabled: z.ZodBoolean;
            hipaaEnabled: z.ZodBoolean;
            dataRetentionDays: z.ZodNumber;
            auditLogRetentionDays: z.ZodNumber;
            consentRequired: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        allowSelfCoached: boolean;
        requireCoachApproval: boolean;
        enableVideoAnalysis: boolean;
        enableAIFeedback: boolean;
        defaultLanguage: SupportedLanguage;
        defaultWeightUnit: WeightUnit;
        availableLanguages: SupportedLanguage[];
        maxCoaches: number;
        maxAthletes: number;
        features: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[];
        complianceSettings: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        };
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
    }, {
        allowSelfCoached: boolean;
        requireCoachApproval: boolean;
        enableVideoAnalysis: boolean;
        enableAIFeedback: boolean;
        defaultLanguage: SupportedLanguage;
        defaultWeightUnit: WeightUnit;
        availableLanguages: SupportedLanguage[];
        maxCoaches: number;
        maxAthletes: number;
        features: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[];
        complianceSettings: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        };
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
    }>;
    subscription: z.ZodObject<{
        id: z.ZodString;
        planId: z.ZodString;
        status: z.ZodNativeEnum<typeof SubscriptionStatus>;
        currentPeriodStart: z.ZodDate;
        currentPeriodEnd: z.ZodDate;
        cancelAtPeriodEnd: z.ZodBoolean;
        trialEnd: z.ZodOptional<z.ZodDate>;
        usage: z.ZodObject<{
            activeCoaches: z.ZodNumber;
            activeAthletes: z.ZodNumber;
            storageUsed: z.ZodNumber;
            apiCalls: z.ZodNumber;
            videoAnalysisMinutes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        }, {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: SubscriptionStatus;
        planId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        usage: {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        };
        trialEnd?: Date | undefined;
    }, {
        id: string;
        status: SubscriptionStatus;
        planId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        usage: {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        };
        trialEnd?: Date | undefined;
    }>;
    billing: z.ZodObject<{
        customerId: z.ZodString;
        paymentMethodId: z.ZodOptional<z.ZodString>;
        billingAddress: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }>>;
        taxId: z.ZodOptional<z.ZodString>;
        currency: z.ZodNativeEnum<typeof Currency>;
        nextBillingDate: z.ZodDate;
        lastPaymentDate: z.ZodOptional<z.ZodDate>;
        outstandingBalance: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        customerId: string;
        currency: Currency;
        nextBillingDate: Date;
        outstandingBalance: number;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        lastPaymentDate?: Date | undefined;
    }, {
        customerId: string;
        currency: Currency;
        nextBillingDate: Date;
        outstandingBalance: number;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        lastPaymentDate?: Date | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    suspendedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: TenantStatus;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    settings: {
        allowSelfCoached: boolean;
        requireCoachApproval: boolean;
        enableVideoAnalysis: boolean;
        enableAIFeedback: boolean;
        defaultLanguage: SupportedLanguage;
        defaultWeightUnit: WeightUnit;
        availableLanguages: SupportedLanguage[];
        maxCoaches: number;
        maxAthletes: number;
        features: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[];
        complianceSettings: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        };
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
    };
    subscription: {
        id: string;
        status: SubscriptionStatus;
        planId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        usage: {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        };
        trialEnd?: Date | undefined;
    };
    billing: {
        customerId: string;
        currency: Currency;
        nextBillingDate: Date;
        outstandingBalance: number;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        lastPaymentDate?: Date | undefined;
    };
    domain?: string | undefined;
    suspendedAt?: Date | undefined;
}, {
    id: string;
    status: TenantStatus;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    settings: {
        allowSelfCoached: boolean;
        requireCoachApproval: boolean;
        enableVideoAnalysis: boolean;
        enableAIFeedback: boolean;
        defaultLanguage: SupportedLanguage;
        defaultWeightUnit: WeightUnit;
        availableLanguages: SupportedLanguage[];
        maxCoaches: number;
        maxAthletes: number;
        features: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[];
        complianceSettings: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        };
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
    };
    subscription: {
        id: string;
        status: SubscriptionStatus;
        planId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        usage: {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        };
        trialEnd?: Date | undefined;
    };
    billing: {
        customerId: string;
        currency: Currency;
        nextBillingDate: Date;
        outstandingBalance: number;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        lastPaymentDate?: Date | undefined;
    };
    domain?: string | undefined;
    suspendedAt?: Date | undefined;
}>;
export declare const TransitionMetadataSchema: z.ZodObject<{
    requestedBy: z.ZodString;
    priority: z.ZodNativeEnum<typeof PriorityLevel>;
    estimatedCompletionTime: z.ZodOptional<z.ZodDate>;
    rollbackPlan: z.ZodOptional<z.ZodString>;
    communicationPlan: z.ZodOptional<z.ZodString>;
    stakeholders: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    priority: PriorityLevel;
    requestedBy: string;
    stakeholders: string[];
    estimatedCompletionTime?: Date | undefined;
    rollbackPlan?: string | undefined;
    communicationPlan?: string | undefined;
}, {
    priority: PriorityLevel;
    requestedBy: string;
    stakeholders: string[];
    estimatedCompletionTime?: Date | undefined;
    rollbackPlan?: string | undefined;
    communicationPlan?: string | undefined;
}>;
export declare const NotificationContentSchema: z.ZodObject<{
    subject: z.ZodString;
    body: z.ZodString;
    actionUrl: z.ZodOptional<z.ZodString>;
    actionText: z.ZodOptional<z.ZodString>;
    priority: z.ZodNativeEnum<typeof PriorityLevel>;
}, "strip", z.ZodTypeAny, {
    priority: PriorityLevel;
    subject: string;
    body: string;
    actionUrl?: string | undefined;
    actionText?: string | undefined;
}, {
    priority: PriorityLevel;
    subject: string;
    body: string;
    actionUrl?: string | undefined;
    actionText?: string | undefined;
}>;
export declare const TransitionNotificationSchema: z.ZodObject<{
    id: z.ZodString;
    recipientId: z.ZodString;
    type: z.ZodNativeEnum<typeof NotificationType>;
    status: z.ZodNativeEnum<typeof NotificationStatus>;
    sentAt: z.ZodOptional<z.ZodDate>;
    readAt: z.ZodOptional<z.ZodDate>;
    content: z.ZodObject<{
        subject: z.ZodString;
        body: z.ZodString;
        actionUrl: z.ZodOptional<z.ZodString>;
        actionText: z.ZodOptional<z.ZodString>;
        priority: z.ZodNativeEnum<typeof PriorityLevel>;
    }, "strip", z.ZodTypeAny, {
        priority: PriorityLevel;
        subject: string;
        body: string;
        actionUrl?: string | undefined;
        actionText?: string | undefined;
    }, {
        priority: PriorityLevel;
        subject: string;
        body: string;
        actionUrl?: string | undefined;
        actionText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: NotificationStatus;
    type: NotificationType;
    recipientId: string;
    content: {
        priority: PriorityLevel;
        subject: string;
        body: string;
        actionUrl?: string | undefined;
        actionText?: string | undefined;
    };
    sentAt?: Date | undefined;
    readAt?: Date | undefined;
}, {
    id: string;
    status: NotificationStatus;
    type: NotificationType;
    recipientId: string;
    content: {
        priority: PriorityLevel;
        subject: string;
        body: string;
        actionUrl?: string | undefined;
        actionText?: string | undefined;
    };
    sentAt?: Date | undefined;
    readAt?: Date | undefined;
}>;
export declare const AccessUpdateSchema: z.ZodObject<{
    userId: z.ZodString;
    resource: z.ZodString;
    oldPermissions: z.ZodArray<z.ZodString, "many">;
    newPermissions: z.ZodArray<z.ZodString, "many">;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    userId: string;
    updatedAt: Date;
    resource: string;
    oldPermissions: string[];
    newPermissions: string[];
}, {
    userId: string;
    updatedAt: Date;
    resource: string;
    oldPermissions: string[];
    newPermissions: string[];
}>;
export declare const DataTransferRecordSchema: z.ZodObject<{
    transferredData: z.ZodArray<z.ZodString, "many">;
    retainedData: z.ZodArray<z.ZodString, "many">;
    archivedData: z.ZodArray<z.ZodString, "many">;
    accessUpdates: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        resource: z.ZodString;
        oldPermissions: z.ZodArray<z.ZodString, "many">;
        newPermissions: z.ZodArray<z.ZodString, "many">;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        updatedAt: Date;
        resource: string;
        oldPermissions: string[];
        newPermissions: string[];
    }, {
        userId: string;
        updatedAt: Date;
        resource: string;
        oldPermissions: string[];
        newPermissions: string[];
    }>, "many">;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    transferredData: string[];
    retainedData: string[];
    archivedData: string[];
    accessUpdates: {
        userId: string;
        updatedAt: Date;
        resource: string;
        oldPermissions: string[];
        newPermissions: string[];
    }[];
    completedAt?: Date | undefined;
}, {
    transferredData: string[];
    retainedData: string[];
    archivedData: string[];
    accessUpdates: {
        userId: string;
        updatedAt: Date;
        resource: string;
        oldPermissions: string[];
        newPermissions: string[];
    }[];
    completedAt?: Date | undefined;
}>;
export declare const TransitionRequestSchema: z.ZodObject<{
    id: z.ZodString;
    athleteId: z.ZodString;
    fromCoachId: z.ZodOptional<z.ZodString>;
    toCoachId: z.ZodOptional<z.ZodString>;
    transitionType: z.ZodNativeEnum<typeof TransitionType>;
    status: z.ZodNativeEnum<typeof TransitionStatus>;
    reason: z.ZodOptional<z.ZodString>;
    approvalRequired: z.ZodBoolean;
    approvedBy: z.ZodOptional<z.ZodString>;
    approvedAt: z.ZodOptional<z.ZodDate>;
    executedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    rollbackAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodObject<{
        requestedBy: z.ZodString;
        priority: z.ZodNativeEnum<typeof PriorityLevel>;
        estimatedCompletionTime: z.ZodOptional<z.ZodDate>;
        rollbackPlan: z.ZodOptional<z.ZodString>;
        communicationPlan: z.ZodOptional<z.ZodString>;
        stakeholders: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        priority: PriorityLevel;
        requestedBy: string;
        stakeholders: string[];
        estimatedCompletionTime?: Date | undefined;
        rollbackPlan?: string | undefined;
        communicationPlan?: string | undefined;
    }, {
        priority: PriorityLevel;
        requestedBy: string;
        stakeholders: string[];
        estimatedCompletionTime?: Date | undefined;
        rollbackPlan?: string | undefined;
        communicationPlan?: string | undefined;
    }>;
    notifications: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        recipientId: z.ZodString;
        type: z.ZodNativeEnum<typeof NotificationType>;
        status: z.ZodNativeEnum<typeof NotificationStatus>;
        sentAt: z.ZodOptional<z.ZodDate>;
        readAt: z.ZodOptional<z.ZodDate>;
        content: z.ZodObject<{
            subject: z.ZodString;
            body: z.ZodString;
            actionUrl: z.ZodOptional<z.ZodString>;
            actionText: z.ZodOptional<z.ZodString>;
            priority: z.ZodNativeEnum<typeof PriorityLevel>;
        }, "strip", z.ZodTypeAny, {
            priority: PriorityLevel;
            subject: string;
            body: string;
            actionUrl?: string | undefined;
            actionText?: string | undefined;
        }, {
            priority: PriorityLevel;
            subject: string;
            body: string;
            actionUrl?: string | undefined;
            actionText?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: NotificationStatus;
        type: NotificationType;
        recipientId: string;
        content: {
            priority: PriorityLevel;
            subject: string;
            body: string;
            actionUrl?: string | undefined;
            actionText?: string | undefined;
        };
        sentAt?: Date | undefined;
        readAt?: Date | undefined;
    }, {
        id: string;
        status: NotificationStatus;
        type: NotificationType;
        recipientId: string;
        content: {
            priority: PriorityLevel;
            subject: string;
            body: string;
            actionUrl?: string | undefined;
            actionText?: string | undefined;
        };
        sentAt?: Date | undefined;
        readAt?: Date | undefined;
    }>, "many">;
    dataTransfer: z.ZodObject<{
        transferredData: z.ZodArray<z.ZodString, "many">;
        retainedData: z.ZodArray<z.ZodString, "many">;
        archivedData: z.ZodArray<z.ZodString, "many">;
        accessUpdates: z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            resource: z.ZodString;
            oldPermissions: z.ZodArray<z.ZodString, "many">;
            newPermissions: z.ZodArray<z.ZodString, "many">;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            updatedAt: Date;
            resource: string;
            oldPermissions: string[];
            newPermissions: string[];
        }, {
            userId: string;
            updatedAt: Date;
            resource: string;
            oldPermissions: string[];
            newPermissions: string[];
        }>, "many">;
        completedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        transferredData: string[];
        retainedData: string[];
        archivedData: string[];
        accessUpdates: {
            userId: string;
            updatedAt: Date;
            resource: string;
            oldPermissions: string[];
            newPermissions: string[];
        }[];
        completedAt?: Date | undefined;
    }, {
        transferredData: string[];
        retainedData: string[];
        archivedData: string[];
        accessUpdates: {
            userId: string;
            updatedAt: Date;
            resource: string;
            oldPermissions: string[];
            newPermissions: string[];
        }[];
        completedAt?: Date | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: TransitionStatus;
    metadata: {
        priority: PriorityLevel;
        requestedBy: string;
        stakeholders: string[];
        estimatedCompletionTime?: Date | undefined;
        rollbackPlan?: string | undefined;
        communicationPlan?: string | undefined;
    };
    notifications: {
        id: string;
        status: NotificationStatus;
        type: NotificationType;
        recipientId: string;
        content: {
            priority: PriorityLevel;
            subject: string;
            body: string;
            actionUrl?: string | undefined;
            actionText?: string | undefined;
        };
        sentAt?: Date | undefined;
        readAt?: Date | undefined;
    }[];
    athleteId: string;
    transitionType: TransitionType;
    approvalRequired: boolean;
    dataTransfer: {
        transferredData: string[];
        retainedData: string[];
        archivedData: string[];
        accessUpdates: {
            userId: string;
            updatedAt: Date;
            resource: string;
            oldPermissions: string[];
            newPermissions: string[];
        }[];
        completedAt?: Date | undefined;
    };
    reason?: string | undefined;
    completedAt?: Date | undefined;
    fromCoachId?: string | undefined;
    toCoachId?: string | undefined;
    approvedBy?: string | undefined;
    approvedAt?: Date | undefined;
    executedAt?: Date | undefined;
    rollbackAt?: Date | undefined;
}, {
    id: string;
    status: TransitionStatus;
    metadata: {
        priority: PriorityLevel;
        requestedBy: string;
        stakeholders: string[];
        estimatedCompletionTime?: Date | undefined;
        rollbackPlan?: string | undefined;
        communicationPlan?: string | undefined;
    };
    notifications: {
        id: string;
        status: NotificationStatus;
        type: NotificationType;
        recipientId: string;
        content: {
            priority: PriorityLevel;
            subject: string;
            body: string;
            actionUrl?: string | undefined;
            actionText?: string | undefined;
        };
        sentAt?: Date | undefined;
        readAt?: Date | undefined;
    }[];
    athleteId: string;
    transitionType: TransitionType;
    approvalRequired: boolean;
    dataTransfer: {
        transferredData: string[];
        retainedData: string[];
        archivedData: string[];
        accessUpdates: {
            userId: string;
            updatedAt: Date;
            resource: string;
            oldPermissions: string[];
            newPermissions: string[];
        }[];
        completedAt?: Date | undefined;
    };
    reason?: string | undefined;
    completedAt?: Date | undefined;
    fromCoachId?: string | undefined;
    toCoachId?: string | undefined;
    approvedBy?: string | undefined;
    approvedAt?: Date | undefined;
    executedAt?: Date | undefined;
    rollbackAt?: Date | undefined;
}>;
export declare const AuthCredentialsSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    tenantId?: string | undefined;
}, {
    password: string;
    email: string;
    tenantId?: string | undefined;
}>;
export declare const PermissionConditionSchema: z.ZodObject<{
    field: z.ZodString;
    operator: z.ZodNativeEnum<typeof ConditionOperator>;
    value: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    field: string;
    operator: ConditionOperator;
    value?: any;
}, {
    field: string;
    operator: ConditionOperator;
    value?: any;
}>;
export declare const PermissionSchema: z.ZodObject<{
    resource: z.ZodString;
    actions: z.ZodArray<z.ZodString, "many">;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodNativeEnum<typeof ConditionOperator>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: ConditionOperator;
        value?: any;
    }, {
        field: string;
        operator: ConditionOperator;
        value?: any;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    resource: string;
    actions: string[];
    conditions?: {
        field: string;
        operator: ConditionOperator;
        value?: any;
    }[] | undefined;
}, {
    resource: string;
    actions: string[];
    conditions?: {
        field: string;
        operator: ConditionOperator;
        value?: any;
    }[] | undefined;
}>;
export declare const SecurityEventSchema: z.ZodObject<{
    userId: z.ZodString;
    tenantId: z.ZodString;
    eventType: z.ZodNativeEnum<typeof SecurityEventType>;
    resource: z.ZodString;
    action: z.ZodString;
    success: z.ZodBoolean;
    ipAddress: z.ZodString;
    userAgent: z.ZodString;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    success: boolean;
    eventType: SecurityEventType;
    userId: string;
    tenantId: string;
    ipAddress: string;
    resource: string;
    action: string;
    userAgent: string;
    metadata?: Record<string, any> | undefined;
}, {
    timestamp: Date;
    success: boolean;
    eventType: SecurityEventType;
    userId: string;
    tenantId: string;
    ipAddress: string;
    resource: string;
    action: string;
    userAgent: string;
    metadata?: Record<string, any> | undefined;
}>;
export declare const UserSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresAt: z.ZodDate;
    ipAddress: z.ZodString;
    userAgent: z.ZodString;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    lastUsedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    ipAddress: string;
    isActive: boolean;
    createdAt: Date;
    userAgent: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    lastUsedAt: Date;
}, {
    id: string;
    userId: string;
    ipAddress: string;
    isActive: boolean;
    createdAt: Date;
    userAgent: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    lastUsedAt: Date;
}>;
export declare const CreateUserRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    tenantId: z.ZodString;
    profile: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodOptional<z.ZodDate>;
        gender: z.ZodOptional<z.ZodNativeEnum<typeof Gender>>;
        bodyWeight: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        experienceLevel: z.ZodOptional<z.ZodNativeEnum<typeof ExperienceLevel>>;
        disciplines: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof Discipline>, "many">>;
        goals: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof TrainingGoal>, "many">>;
        emergencyContact: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            relationship: z.ZodString;
            phoneNumber: z.ZodString;
            email: z.ZodOptional<z.ZodString>;
            isPrimary: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }>>>;
        medicalInformation: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            bloodType: z.ZodOptional<z.ZodString>;
            chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            surgicalHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
                procedure: z.ZodString;
                date: z.ZodDate;
                complications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                recoveryNotes: z.ZodOptional<z.ZodString>;
                affectedMovements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }, {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }>, "many">>;
            familyMedicalHistory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            lastPhysicalExam: z.ZodOptional<z.ZodDate>;
            doctorContact: z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                phoneNumber: z.ZodString;
                email: z.ZodOptional<z.ZodString>;
                address: z.ZodOptional<z.ZodObject<{
                    street: z.ZodString;
                    city: z.ZodString;
                    state: z.ZodString;
                    postalCode: z.ZodString;
                    country: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }>>;
            insuranceInfo: z.ZodOptional<z.ZodObject<{
                provider: z.ZodString;
                policyNumber: z.ZodString;
                groupNumber: z.ZodOptional<z.ZodString>;
                memberName: z.ZodString;
                effectiveDate: z.ZodDate;
                expirationDate: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }, {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }, {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
        weightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
        dateFormat: z.ZodOptional<z.ZodNativeEnum<typeof DateFormat>>;
        timeFormat: z.ZodOptional<z.ZodNativeEnum<typeof TimeFormat>>;
        timezone: z.ZodOptional<z.ZodString>;
        notifications: z.ZodOptional<z.ZodObject<{
            email: z.ZodObject<{
                enabled: z.ZodBoolean;
                workoutReminders: z.ZodBoolean;
                progressUpdates: z.ZodBoolean;
                coachMessages: z.ZodBoolean;
                systemUpdates: z.ZodBoolean;
                marketingEmails: z.ZodBoolean;
                frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            }, {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            }>;
            push: z.ZodObject<{
                enabled: z.ZodBoolean;
                workoutReminders: z.ZodBoolean;
                coachMessages: z.ZodBoolean;
                systemAlerts: z.ZodBoolean;
                quietHours: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    startTime: z.ZodString;
                    endTime: z.ZodString;
                    timezone: z.ZodString;
                    daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                }, {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                }>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            }, {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            }>;
            sms: z.ZodObject<{
                enabled: z.ZodBoolean;
                emergencyOnly: z.ZodBoolean;
                phoneNumber: z.ZodOptional<z.ZodString>;
                verifiedAt: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            }, {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            }>;
            inApp: z.ZodObject<{
                enabled: z.ZodBoolean;
                showBadges: z.ZodBoolean;
                playSound: z.ZodBoolean;
                categories: z.ZodArray<z.ZodObject<{
                    type: z.ZodNativeEnum<typeof NotificationType>;
                    enabled: z.ZodBoolean;
                    priority: z.ZodNativeEnum<typeof PriorityLevel>;
                }, "strip", z.ZodTypeAny, {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }, {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            }, {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            }>;
        }, "strip", z.ZodTypeAny, {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        }, {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        }>>;
        privacy: z.ZodOptional<z.ZodObject<{
            profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
            showProgress: z.ZodBoolean;
            showWorkouts: z.ZodBoolean;
            allowMessaging: z.ZodBoolean;
            dataSharing: z.ZodObject<{
                shareWithCoach: z.ZodBoolean;
                shareForResearch: z.ZodBoolean;
                shareForMarketing: z.ZodBoolean;
                shareAggregated: z.ZodBoolean;
                thirdPartyIntegrations: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            }, {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            }>;
            consentGiven: z.ZodArray<z.ZodObject<{
                type: z.ZodNativeEnum<typeof ConsentType>;
                given: z.ZodBoolean;
                timestamp: z.ZodDate;
                version: z.ZodString;
                ipAddress: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }, {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        }, {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        }>>;
        accessibility: z.ZodOptional<z.ZodObject<{
            screenReader: z.ZodBoolean;
            highContrast: z.ZodBoolean;
            largeText: z.ZodBoolean;
            reducedMotion: z.ZodBoolean;
            keyboardNavigation: z.ZodBoolean;
            voiceControl: z.ZodBoolean;
            customizations: z.ZodArray<z.ZodObject<{
                feature: z.ZodString;
                enabled: z.ZodBoolean;
                configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }, {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        }, {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        }>>;
    }, "strip", z.ZodTypeAny, {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    }, {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    }>>;
    sendWelcomeEmail: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    role: UserRole;
    profile: {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    };
    tenantId: string;
    preferences?: {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    } | undefined;
    sendWelcomeEmail?: boolean | undefined;
}, {
    password: string;
    email: string;
    role: UserRole;
    profile: {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    };
    tenantId: string;
    preferences?: {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    } | undefined;
    sendWelcomeEmail?: boolean | undefined;
}>;
export declare const UpdateUserRequestSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof UserStatus>>;
    profile: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodOptional<z.ZodDate>;
        gender: z.ZodOptional<z.ZodNativeEnum<typeof Gender>>;
        bodyWeight: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        experienceLevel: z.ZodOptional<z.ZodNativeEnum<typeof ExperienceLevel>>;
        disciplines: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof Discipline>, "many">>;
        goals: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof TrainingGoal>, "many">>;
        emergencyContact: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            relationship: z.ZodString;
            phoneNumber: z.ZodString;
            email: z.ZodOptional<z.ZodString>;
            isPrimary: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }>>>;
        medicalInformation: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            bloodType: z.ZodOptional<z.ZodString>;
            chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            surgicalHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
                procedure: z.ZodString;
                date: z.ZodDate;
                complications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                recoveryNotes: z.ZodOptional<z.ZodString>;
                affectedMovements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }, {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }>, "many">>;
            familyMedicalHistory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            lastPhysicalExam: z.ZodOptional<z.ZodDate>;
            doctorContact: z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                phoneNumber: z.ZodString;
                email: z.ZodOptional<z.ZodString>;
                address: z.ZodOptional<z.ZodObject<{
                    street: z.ZodString;
                    city: z.ZodString;
                    state: z.ZodString;
                    postalCode: z.ZodString;
                    country: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }>>;
            insuranceInfo: z.ZodOptional<z.ZodObject<{
                provider: z.ZodString;
                policyNumber: z.ZodString;
                groupNumber: z.ZodOptional<z.ZodString>;
                memberName: z.ZodString;
                effectiveDate: z.ZodDate;
                expirationDate: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }, {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }, {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
        weightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
        dateFormat: z.ZodOptional<z.ZodNativeEnum<typeof DateFormat>>;
        timeFormat: z.ZodOptional<z.ZodNativeEnum<typeof TimeFormat>>;
        timezone: z.ZodOptional<z.ZodString>;
        notifications: z.ZodOptional<z.ZodObject<{
            email: z.ZodObject<{
                enabled: z.ZodBoolean;
                workoutReminders: z.ZodBoolean;
                progressUpdates: z.ZodBoolean;
                coachMessages: z.ZodBoolean;
                systemUpdates: z.ZodBoolean;
                marketingEmails: z.ZodBoolean;
                frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            }, {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            }>;
            push: z.ZodObject<{
                enabled: z.ZodBoolean;
                workoutReminders: z.ZodBoolean;
                coachMessages: z.ZodBoolean;
                systemAlerts: z.ZodBoolean;
                quietHours: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    startTime: z.ZodString;
                    endTime: z.ZodString;
                    timezone: z.ZodString;
                    daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                }, {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                }>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            }, {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            }>;
            sms: z.ZodObject<{
                enabled: z.ZodBoolean;
                emergencyOnly: z.ZodBoolean;
                phoneNumber: z.ZodOptional<z.ZodString>;
                verifiedAt: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            }, {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            }>;
            inApp: z.ZodObject<{
                enabled: z.ZodBoolean;
                showBadges: z.ZodBoolean;
                playSound: z.ZodBoolean;
                categories: z.ZodArray<z.ZodObject<{
                    type: z.ZodNativeEnum<typeof NotificationType>;
                    enabled: z.ZodBoolean;
                    priority: z.ZodNativeEnum<typeof PriorityLevel>;
                }, "strip", z.ZodTypeAny, {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }, {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            }, {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            }>;
        }, "strip", z.ZodTypeAny, {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        }, {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        }>>;
        privacy: z.ZodOptional<z.ZodObject<{
            profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
            showProgress: z.ZodBoolean;
            showWorkouts: z.ZodBoolean;
            allowMessaging: z.ZodBoolean;
            dataSharing: z.ZodObject<{
                shareWithCoach: z.ZodBoolean;
                shareForResearch: z.ZodBoolean;
                shareForMarketing: z.ZodBoolean;
                shareAggregated: z.ZodBoolean;
                thirdPartyIntegrations: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            }, {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            }>;
            consentGiven: z.ZodArray<z.ZodObject<{
                type: z.ZodNativeEnum<typeof ConsentType>;
                given: z.ZodBoolean;
                timestamp: z.ZodDate;
                version: z.ZodString;
                ipAddress: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }, {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        }, {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        }>>;
        accessibility: z.ZodOptional<z.ZodObject<{
            screenReader: z.ZodBoolean;
            highContrast: z.ZodBoolean;
            largeText: z.ZodBoolean;
            reducedMotion: z.ZodBoolean;
            keyboardNavigation: z.ZodBoolean;
            voiceControl: z.ZodBoolean;
            customizations: z.ZodArray<z.ZodObject<{
                feature: z.ZodString;
                enabled: z.ZodBoolean;
                configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }, {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        }, {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        }>>;
    }, "strip", z.ZodTypeAny, {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    }, {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    role?: UserRole | undefined;
    status?: UserStatus | undefined;
    preferences?: {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    } | undefined;
    profile?: {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    email?: string | undefined;
    role?: UserRole | undefined;
    status?: UserStatus | undefined;
    preferences?: {
        timezone?: string | undefined;
        language?: SupportedLanguage | undefined;
        weightUnit?: WeightUnit | undefined;
        dateFormat?: DateFormat | undefined;
        timeFormat?: TimeFormat | undefined;
        notifications?: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        } | undefined;
        privacy?: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        } | undefined;
        accessibility?: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        } | undefined;
    } | undefined;
    profile?: {
        gender?: Gender | undefined;
        height?: number | undefined;
        goals?: TrainingGoal[] | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: Date | undefined;
        bodyWeight?: number | undefined;
        experienceLevel?: ExperienceLevel | undefined;
        disciplines?: Discipline[] | undefined;
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const CreateTenantRequestSchema: z.ZodObject<{
    name: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    adminEmail: z.ZodString;
    adminPassword: z.ZodString;
    settings: z.ZodOptional<z.ZodObject<{
        allowSelfCoached: z.ZodOptional<z.ZodBoolean>;
        requireCoachApproval: z.ZodOptional<z.ZodBoolean>;
        enableVideoAnalysis: z.ZodOptional<z.ZodBoolean>;
        enableAIFeedback: z.ZodOptional<z.ZodBoolean>;
        defaultLanguage: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
        defaultWeightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
        availableLanguages: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">>;
        maxCoaches: z.ZodOptional<z.ZodNumber>;
        maxAthletes: z.ZodOptional<z.ZodNumber>;
        features: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            enabled: z.ZodBoolean;
            configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }>, "many">>;
        customBranding: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            logoUrl: z.ZodOptional<z.ZodString>;
            primaryColor: z.ZodOptional<z.ZodString>;
            secondaryColor: z.ZodOptional<z.ZodString>;
            customDomain: z.ZodOptional<z.ZodString>;
            companyName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }>>>;
        complianceSettings: z.ZodOptional<z.ZodObject<{
            gdprEnabled: z.ZodBoolean;
            pdpaEnabled: z.ZodBoolean;
            hipaaEnabled: z.ZodBoolean;
            dataRetentionDays: z.ZodNumber;
            auditLogRetentionDays: z.ZodNumber;
            consentRequired: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    }, {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    }>>;
    billingInfo: z.ZodOptional<z.ZodObject<{
        customerId: z.ZodOptional<z.ZodString>;
        paymentMethodId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        billingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }>>>;
        taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        currency: z.ZodOptional<z.ZodNativeEnum<typeof Currency>>;
        nextBillingDate: z.ZodOptional<z.ZodDate>;
        lastPaymentDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
        outstandingBalance: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        customerId?: string | undefined;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        currency?: Currency | undefined;
        nextBillingDate?: Date | undefined;
        lastPaymentDate?: Date | undefined;
        outstandingBalance?: number | undefined;
    }, {
        customerId?: string | undefined;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        currency?: Currency | undefined;
        nextBillingDate?: Date | undefined;
        lastPaymentDate?: Date | undefined;
        outstandingBalance?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    adminEmail: string;
    adminPassword: string;
    domain?: string | undefined;
    settings?: {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    } | undefined;
    billingInfo?: {
        customerId?: string | undefined;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        currency?: Currency | undefined;
        nextBillingDate?: Date | undefined;
        lastPaymentDate?: Date | undefined;
        outstandingBalance?: number | undefined;
    } | undefined;
}, {
    name: string;
    adminEmail: string;
    adminPassword: string;
    domain?: string | undefined;
    settings?: {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    } | undefined;
    billingInfo?: {
        customerId?: string | undefined;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        currency?: Currency | undefined;
        nextBillingDate?: Date | undefined;
        lastPaymentDate?: Date | undefined;
        outstandingBalance?: number | undefined;
    } | undefined;
}>;
export declare const UpdateTenantRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof TenantStatus>>;
    settings: z.ZodOptional<z.ZodObject<{
        allowSelfCoached: z.ZodOptional<z.ZodBoolean>;
        requireCoachApproval: z.ZodOptional<z.ZodBoolean>;
        enableVideoAnalysis: z.ZodOptional<z.ZodBoolean>;
        enableAIFeedback: z.ZodOptional<z.ZodBoolean>;
        defaultLanguage: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
        defaultWeightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
        availableLanguages: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">>;
        maxCoaches: z.ZodOptional<z.ZodNumber>;
        maxAthletes: z.ZodOptional<z.ZodNumber>;
        features: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            enabled: z.ZodBoolean;
            configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }>, "many">>;
        customBranding: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            logoUrl: z.ZodOptional<z.ZodString>;
            primaryColor: z.ZodOptional<z.ZodString>;
            secondaryColor: z.ZodOptional<z.ZodString>;
            customDomain: z.ZodOptional<z.ZodString>;
            companyName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }>>>;
        complianceSettings: z.ZodOptional<z.ZodObject<{
            gdprEnabled: z.ZodBoolean;
            pdpaEnabled: z.ZodBoolean;
            hipaaEnabled: z.ZodBoolean;
            dataRetentionDays: z.ZodNumber;
            auditLogRetentionDays: z.ZodNumber;
            consentRequired: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    }, {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: TenantStatus | undefined;
    name?: string | undefined;
    domain?: string | undefined;
    settings?: {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    } | undefined;
}, {
    status?: TenantStatus | undefined;
    name?: string | undefined;
    domain?: string | undefined;
    settings?: {
        allowSelfCoached?: boolean | undefined;
        requireCoachApproval?: boolean | undefined;
        enableVideoAnalysis?: boolean | undefined;
        enableAIFeedback?: boolean | undefined;
        defaultLanguage?: SupportedLanguage | undefined;
        defaultWeightUnit?: WeightUnit | undefined;
        availableLanguages?: SupportedLanguage[] | undefined;
        maxCoaches?: number | undefined;
        maxAthletes?: number | undefined;
        features?: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[] | undefined;
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
        complianceSettings?: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        } | undefined;
    } | undefined;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    tenantId?: string | undefined;
    rememberMe?: boolean | undefined;
}, {
    password: string;
    email: string;
    tenantId?: string | undefined;
    rememberMe?: boolean | undefined;
}>;
export declare const PasswordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    tenantId?: string | undefined;
}, {
    email: string;
    tenantId?: string | undefined;
}>;
export declare const PasswordResetConfirmSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export declare const ChangePasswordRequestSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    currentPassword: string;
}, {
    newPassword: string;
    currentPassword: string;
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const LogoutRequestSchema: z.ZodObject<{
    refreshToken: z.ZodOptional<z.ZodString>;
    allSessions: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string | undefined;
    allSessions?: boolean | undefined;
}, {
    refreshToken?: string | undefined;
    allSessions?: boolean | undefined;
}>;
export declare const PaymentMethodDetailsSchema: z.ZodObject<{
    promptPayId: z.ZodOptional<z.ZodString>;
    promptPayType: z.ZodOptional<z.ZodEnum<["PHONE", "ID_CARD", "E_WALLET"]>>;
    promptPayName: z.ZodOptional<z.ZodString>;
    bankName: z.ZodOptional<z.ZodString>;
    bankCode: z.ZodOptional<z.ZodString>;
    accountNumber: z.ZodOptional<z.ZodString>;
    accountName: z.ZodOptional<z.ZodString>;
    routingNumber: z.ZodOptional<z.ZodString>;
    swiftCode: z.ZodOptional<z.ZodString>;
    iban: z.ZodOptional<z.ZodString>;
    branchCode: z.ZodOptional<z.ZodString>;
    last4: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    expiryMonth: z.ZodOptional<z.ZodNumber>;
    expiryYear: z.ZodOptional<z.ZodNumber>;
    fingerprint: z.ZodOptional<z.ZodString>;
    funding: z.ZodOptional<z.ZodEnum<["CREDIT", "DEBIT", "PREPAID", "UNKNOWN"]>>;
    country: z.ZodOptional<z.ZodString>;
    walletType: z.ZodOptional<z.ZodString>;
    walletId: z.ZodOptional<z.ZodString>;
    walletEmail: z.ZodOptional<z.ZodString>;
    cryptoType: z.ZodOptional<z.ZodString>;
    walletAddress: z.ZodOptional<z.ZodString>;
    network: z.ZodOptional<z.ZodString>;
    displayName: z.ZodString;
    nickname: z.ZodOptional<z.ZodString>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    }, {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    metadata?: Record<string, any> | undefined;
    country?: string | undefined;
    brand?: string | undefined;
    billingAddress?: {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    } | undefined;
    promptPayId?: string | undefined;
    promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
    promptPayName?: string | undefined;
    bankName?: string | undefined;
    bankCode?: string | undefined;
    accountNumber?: string | undefined;
    accountName?: string | undefined;
    routingNumber?: string | undefined;
    swiftCode?: string | undefined;
    iban?: string | undefined;
    branchCode?: string | undefined;
    last4?: string | undefined;
    expiryMonth?: number | undefined;
    expiryYear?: number | undefined;
    fingerprint?: string | undefined;
    funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
    walletType?: string | undefined;
    walletId?: string | undefined;
    walletEmail?: string | undefined;
    cryptoType?: string | undefined;
    walletAddress?: string | undefined;
    network?: string | undefined;
    nickname?: string | undefined;
}, {
    displayName: string;
    metadata?: Record<string, any> | undefined;
    country?: string | undefined;
    brand?: string | undefined;
    billingAddress?: {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    } | undefined;
    promptPayId?: string | undefined;
    promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
    promptPayName?: string | undefined;
    bankName?: string | undefined;
    bankCode?: string | undefined;
    accountNumber?: string | undefined;
    accountName?: string | undefined;
    routingNumber?: string | undefined;
    swiftCode?: string | undefined;
    iban?: string | undefined;
    branchCode?: string | undefined;
    last4?: string | undefined;
    expiryMonth?: number | undefined;
    expiryYear?: number | undefined;
    fingerprint?: string | undefined;
    funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
    walletType?: string | undefined;
    walletId?: string | undefined;
    walletEmail?: string | undefined;
    cryptoType?: string | undefined;
    walletAddress?: string | undefined;
    network?: string | undefined;
    nickname?: string | undefined;
}>;
export declare const PaymentMethodSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    type: z.ZodNativeEnum<typeof PaymentMethodType>;
    details: z.ZodObject<{
        promptPayId: z.ZodOptional<z.ZodString>;
        promptPayType: z.ZodOptional<z.ZodEnum<["PHONE", "ID_CARD", "E_WALLET"]>>;
        promptPayName: z.ZodOptional<z.ZodString>;
        bankName: z.ZodOptional<z.ZodString>;
        bankCode: z.ZodOptional<z.ZodString>;
        accountNumber: z.ZodOptional<z.ZodString>;
        accountName: z.ZodOptional<z.ZodString>;
        routingNumber: z.ZodOptional<z.ZodString>;
        swiftCode: z.ZodOptional<z.ZodString>;
        iban: z.ZodOptional<z.ZodString>;
        branchCode: z.ZodOptional<z.ZodString>;
        last4: z.ZodOptional<z.ZodString>;
        brand: z.ZodOptional<z.ZodString>;
        expiryMonth: z.ZodOptional<z.ZodNumber>;
        expiryYear: z.ZodOptional<z.ZodNumber>;
        fingerprint: z.ZodOptional<z.ZodString>;
        funding: z.ZodOptional<z.ZodEnum<["CREDIT", "DEBIT", "PREPAID", "UNKNOWN"]>>;
        country: z.ZodOptional<z.ZodString>;
        walletType: z.ZodOptional<z.ZodString>;
        walletId: z.ZodOptional<z.ZodString>;
        walletEmail: z.ZodOptional<z.ZodString>;
        cryptoType: z.ZodOptional<z.ZodString>;
        walletAddress: z.ZodOptional<z.ZodString>;
        network: z.ZodOptional<z.ZodString>;
        displayName: z.ZodString;
        nickname: z.ZodOptional<z.ZodString>;
        billingAddress: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        displayName: string;
        metadata?: Record<string, any> | undefined;
        country?: string | undefined;
        brand?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        promptPayId?: string | undefined;
        promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
        promptPayName?: string | undefined;
        bankName?: string | undefined;
        bankCode?: string | undefined;
        accountNumber?: string | undefined;
        accountName?: string | undefined;
        routingNumber?: string | undefined;
        swiftCode?: string | undefined;
        iban?: string | undefined;
        branchCode?: string | undefined;
        last4?: string | undefined;
        expiryMonth?: number | undefined;
        expiryYear?: number | undefined;
        fingerprint?: string | undefined;
        funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
        walletType?: string | undefined;
        walletId?: string | undefined;
        walletEmail?: string | undefined;
        cryptoType?: string | undefined;
        walletAddress?: string | undefined;
        network?: string | undefined;
        nickname?: string | undefined;
    }, {
        displayName: string;
        metadata?: Record<string, any> | undefined;
        country?: string | undefined;
        brand?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        promptPayId?: string | undefined;
        promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
        promptPayName?: string | undefined;
        bankName?: string | undefined;
        bankCode?: string | undefined;
        accountNumber?: string | undefined;
        accountName?: string | undefined;
        routingNumber?: string | undefined;
        swiftCode?: string | undefined;
        iban?: string | undefined;
        branchCode?: string | undefined;
        last4?: string | undefined;
        expiryMonth?: number | undefined;
        expiryYear?: number | undefined;
        fingerprint?: string | undefined;
        funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
        walletType?: string | undefined;
        walletId?: string | undefined;
        walletEmail?: string | undefined;
        cryptoType?: string | undefined;
        walletAddress?: string | undefined;
        network?: string | undefined;
        nickname?: string | undefined;
    }>;
    isDefault: z.ZodBoolean;
    isActive: z.ZodBoolean;
    isVerified: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: PaymentMethodType;
    tenantId: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    details: {
        displayName: string;
        metadata?: Record<string, any> | undefined;
        country?: string | undefined;
        brand?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        promptPayId?: string | undefined;
        promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
        promptPayName?: string | undefined;
        bankName?: string | undefined;
        bankCode?: string | undefined;
        accountNumber?: string | undefined;
        accountName?: string | undefined;
        routingNumber?: string | undefined;
        swiftCode?: string | undefined;
        iban?: string | undefined;
        branchCode?: string | undefined;
        last4?: string | undefined;
        expiryMonth?: number | undefined;
        expiryYear?: number | undefined;
        fingerprint?: string | undefined;
        funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
        walletType?: string | undefined;
        walletId?: string | undefined;
        walletEmail?: string | undefined;
        cryptoType?: string | undefined;
        walletAddress?: string | undefined;
        network?: string | undefined;
        nickname?: string | undefined;
    };
    isVerified: boolean;
    expiresAt?: Date | undefined;
}, {
    id: string;
    type: PaymentMethodType;
    tenantId: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    details: {
        displayName: string;
        metadata?: Record<string, any> | undefined;
        country?: string | undefined;
        brand?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        promptPayId?: string | undefined;
        promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
        promptPayName?: string | undefined;
        bankName?: string | undefined;
        bankCode?: string | undefined;
        accountNumber?: string | undefined;
        accountName?: string | undefined;
        routingNumber?: string | undefined;
        swiftCode?: string | undefined;
        iban?: string | undefined;
        branchCode?: string | undefined;
        last4?: string | undefined;
        expiryMonth?: number | undefined;
        expiryYear?: number | undefined;
        fingerprint?: string | undefined;
        funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
        walletType?: string | undefined;
        walletId?: string | undefined;
        walletEmail?: string | undefined;
        cryptoType?: string | undefined;
        walletAddress?: string | undefined;
        network?: string | undefined;
        nickname?: string | undefined;
    };
    isVerified: boolean;
    expiresAt?: Date | undefined;
}>;
export declare const PaymentRequestSchema: z.ZodObject<{
    tenantId: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodNativeEnum<typeof Currency>;
    paymentMethodId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    statementDescriptor: z.ZodOptional<z.ZodString>;
    receiptEmail: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    paymentMethodId: string;
    currency: Currency;
    amount: number;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    statementDescriptor?: string | undefined;
    receiptEmail?: string | undefined;
    idempotencyKey?: string | undefined;
}, {
    tenantId: string;
    paymentMethodId: string;
    currency: Currency;
    amount: number;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    statementDescriptor?: string | undefined;
    receiptEmail?: string | undefined;
    idempotencyKey?: string | undefined;
}>;
export declare const UserFiltersSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof UserStatus>>;
    tenantId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    createdAfter: z.ZodOptional<z.ZodDate>;
    createdBefore: z.ZodOptional<z.ZodDate>;
    lastLoginAfter: z.ZodOptional<z.ZodDate>;
    lastLoginBefore: z.ZodOptional<z.ZodDate>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    role?: UserRole | undefined;
    status?: UserStatus | undefined;
    tenantId?: string | undefined;
    createdAfter?: Date | undefined;
    createdBefore?: Date | undefined;
    lastLoginAfter?: Date | undefined;
    lastLoginBefore?: Date | undefined;
}, {
    search?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    role?: UserRole | undefined;
    status?: UserStatus | undefined;
    tenantId?: string | undefined;
    createdAfter?: Date | undefined;
    createdBefore?: Date | undefined;
    lastLoginAfter?: Date | undefined;
    lastLoginBefore?: Date | undefined;
}>;
export declare const AuditFiltersSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    resource: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    offset?: number | undefined;
    userId?: string | undefined;
    tenantId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    resource?: string | undefined;
    action?: string | undefined;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
    userId?: string | undefined;
    tenantId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    resource?: string | undefined;
    action?: string | undefined;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        type: z.ZodNativeEnum<typeof ErrorType>;
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        timestamp: z.ZodDate;
        requestId: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        tenantId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        timestamp: Date;
        type: ErrorType;
        code: string;
        requestId: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
        details?: Record<string, any> | undefined;
    }, {
        message: string;
        timestamp: Date;
        type: ErrorType;
        code: string;
        requestId: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
        details?: Record<string, any> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        timestamp: Date;
        type: ErrorType;
        code: string;
        requestId: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
        details?: Record<string, any> | undefined;
    };
}, {
    error: {
        message: string;
        timestamp: Date;
        type: ErrorType;
        code: string;
        requestId: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
        details?: Record<string, any> | undefined;
    };
}>;
export declare const ValidationErrorSchema: z.ZodObject<{
    field: z.ZodString;
    code: z.ZodNativeEnum<typeof ValidationErrorCode>;
    message: z.ZodString;
    value: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    message: string;
    code: ValidationErrorCode;
    field: string;
    value?: any;
}, {
    message: string;
    code: ValidationErrorCode;
    field: string;
    value?: any;
}>;
export declare const ValidationSchemas: {
    readonly Email: z.ZodString;
    readonly Password: z.ZodString;
    readonly PhoneNumber: z.ZodString;
    readonly UUID: z.ZodString;
    readonly URL: z.ZodString;
    readonly Date: z.ZodDate;
    readonly PositiveNumber: z.ZodNumber;
    readonly NonNegativeNumber: z.ZodNumber;
    readonly Address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>;
    readonly BillingAddress: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    }, {
        city: string;
        postalCode: string;
        country: string;
        line1: string;
        state?: string | undefined;
        line2?: string | undefined;
    }>;
    readonly UserRole: z.ZodNativeEnum<typeof UserRole>;
    readonly UserStatus: z.ZodNativeEnum<typeof UserStatus>;
    readonly Gender: z.ZodNativeEnum<typeof Gender>;
    readonly WeightUnit: z.ZodNativeEnum<typeof WeightUnit>;
    readonly AthleteProfile: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        dateOfBirth: z.ZodDate;
        gender: z.ZodNativeEnum<typeof Gender>;
        bodyWeight: z.ZodNumber;
        height: z.ZodNumber;
        experienceLevel: z.ZodNativeEnum<typeof ExperienceLevel>;
        disciplines: z.ZodArray<z.ZodNativeEnum<typeof Discipline>, "many">;
        goals: z.ZodArray<z.ZodNativeEnum<typeof TrainingGoal>, "many">;
        emergencyContact: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            relationship: z.ZodString;
            phoneNumber: z.ZodString;
            email: z.ZodOptional<z.ZodString>;
            isPrimary: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }, {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        }>>;
        medicalInformation: z.ZodOptional<z.ZodObject<{
            bloodType: z.ZodOptional<z.ZodString>;
            chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            surgicalHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
                procedure: z.ZodString;
                date: z.ZodDate;
                complications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                recoveryNotes: z.ZodOptional<z.ZodString>;
                affectedMovements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }, {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }>, "many">>;
            familyMedicalHistory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            lastPhysicalExam: z.ZodOptional<z.ZodDate>;
            doctorContact: z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                phoneNumber: z.ZodString;
                email: z.ZodOptional<z.ZodString>;
                address: z.ZodOptional<z.ZodObject<{
                    street: z.ZodString;
                    city: z.ZodString;
                    state: z.ZodString;
                    postalCode: z.ZodString;
                    country: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }>>;
            insuranceInfo: z.ZodOptional<z.ZodObject<{
                provider: z.ZodString;
                policyNumber: z.ZodString;
                groupNumber: z.ZodOptional<z.ZodString>;
                memberName: z.ZodString;
                effectiveDate: z.ZodDate;
                expirationDate: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }, {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        gender: Gender;
        height: number;
        goals: TrainingGoal[];
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        bodyWeight: number;
        experienceLevel: ExperienceLevel;
        disciplines: Discipline[];
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }, {
        gender: Gender;
        height: number;
        goals: TrainingGoal[];
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        bodyWeight: number;
        experienceLevel: ExperienceLevel;
        disciplines: Discipline[];
        emergencyContact?: {
            name: string;
            relationship: string;
            phoneNumber: string;
            isPrimary: boolean;
            email?: string | undefined;
        } | undefined;
        medicalInformation?: {
            bloodType?: string | undefined;
            chronicConditions?: string[] | undefined;
            medications?: string[] | undefined;
            allergies?: string[] | undefined;
            surgicalHistory?: {
                date: Date;
                procedure: string;
                complications?: string[] | undefined;
                recoveryNotes?: string | undefined;
                affectedMovements?: string[] | undefined;
            }[] | undefined;
            familyMedicalHistory?: string[] | undefined;
            lastPhysicalExam?: Date | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }>;
    readonly UserPreferences: z.ZodObject<{
        language: z.ZodNativeEnum<typeof SupportedLanguage>;
        weightUnit: z.ZodNativeEnum<typeof WeightUnit>;
        dateFormat: z.ZodNativeEnum<typeof DateFormat>;
        timeFormat: z.ZodNativeEnum<typeof TimeFormat>;
        timezone: z.ZodString;
        notifications: z.ZodObject<{
            email: z.ZodObject<{
                enabled: z.ZodBoolean;
                workoutReminders: z.ZodBoolean;
                progressUpdates: z.ZodBoolean;
                coachMessages: z.ZodBoolean;
                systemUpdates: z.ZodBoolean;
                marketingEmails: z.ZodBoolean;
                frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            }, {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            }>;
            push: z.ZodObject<{
                enabled: z.ZodBoolean;
                workoutReminders: z.ZodBoolean;
                coachMessages: z.ZodBoolean;
                systemAlerts: z.ZodBoolean;
                quietHours: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    startTime: z.ZodString;
                    endTime: z.ZodString;
                    timezone: z.ZodString;
                    daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                }, {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                }>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            }, {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            }>;
            sms: z.ZodObject<{
                enabled: z.ZodBoolean;
                emergencyOnly: z.ZodBoolean;
                phoneNumber: z.ZodOptional<z.ZodString>;
                verifiedAt: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            }, {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            }>;
            inApp: z.ZodObject<{
                enabled: z.ZodBoolean;
                showBadges: z.ZodBoolean;
                playSound: z.ZodBoolean;
                categories: z.ZodArray<z.ZodObject<{
                    type: z.ZodNativeEnum<typeof NotificationType>;
                    enabled: z.ZodBoolean;
                    priority: z.ZodNativeEnum<typeof PriorityLevel>;
                }, "strip", z.ZodTypeAny, {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }, {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            }, {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            }>;
        }, "strip", z.ZodTypeAny, {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        }, {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        }>;
        privacy: z.ZodObject<{
            profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
            showProgress: z.ZodBoolean;
            showWorkouts: z.ZodBoolean;
            allowMessaging: z.ZodBoolean;
            dataSharing: z.ZodObject<{
                shareWithCoach: z.ZodBoolean;
                shareForResearch: z.ZodBoolean;
                shareForMarketing: z.ZodBoolean;
                shareAggregated: z.ZodBoolean;
                thirdPartyIntegrations: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            }, {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            }>;
            consentGiven: z.ZodArray<z.ZodObject<{
                type: z.ZodNativeEnum<typeof ConsentType>;
                given: z.ZodBoolean;
                timestamp: z.ZodDate;
                version: z.ZodString;
                ipAddress: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }, {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        }, {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        }>;
        accessibility: z.ZodObject<{
            screenReader: z.ZodBoolean;
            highContrast: z.ZodBoolean;
            largeText: z.ZodBoolean;
            reducedMotion: z.ZodBoolean;
            keyboardNavigation: z.ZodBoolean;
            voiceControl: z.ZodBoolean;
            customizations: z.ZodArray<z.ZodObject<{
                feature: z.ZodString;
                enabled: z.ZodBoolean;
                configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }, {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        }, {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        }>;
    }, "strip", z.ZodTypeAny, {
        timezone: string;
        language: SupportedLanguage;
        weightUnit: WeightUnit;
        dateFormat: DateFormat;
        timeFormat: TimeFormat;
        notifications: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        };
        privacy: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        };
        accessibility: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        };
    }, {
        timezone: string;
        language: SupportedLanguage;
        weightUnit: WeightUnit;
        dateFormat: DateFormat;
        timeFormat: TimeFormat;
        notifications: {
            email: {
                enabled: boolean;
                workoutReminders: boolean;
                progressUpdates: boolean;
                coachMessages: boolean;
                systemUpdates: boolean;
                marketingEmails: boolean;
                frequency: NotificationFrequency;
            };
            push: {
                enabled: boolean;
                workoutReminders: boolean;
                coachMessages: boolean;
                systemAlerts: boolean;
                quietHours: {
                    enabled: boolean;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    daysOfWeek: number[];
                };
            };
            sms: {
                enabled: boolean;
                emergencyOnly: boolean;
                phoneNumber?: string | undefined;
                verifiedAt?: Date | undefined;
            };
            inApp: {
                enabled: boolean;
                showBadges: boolean;
                playSound: boolean;
                categories: {
                    type: NotificationType;
                    enabled: boolean;
                    priority: PriorityLevel;
                }[];
            };
        };
        privacy: {
            profileVisibility: ProfileVisibility;
            showProgress: boolean;
            showWorkouts: boolean;
            allowMessaging: boolean;
            dataSharing: {
                shareWithCoach: boolean;
                shareForResearch: boolean;
                shareForMarketing: boolean;
                shareAggregated: boolean;
                thirdPartyIntegrations: boolean;
            };
            consentGiven: {
                version: string;
                timestamp: Date;
                type: ConsentType;
                given: boolean;
                ipAddress: string;
            }[];
        };
        accessibility: {
            screenReader: boolean;
            highContrast: boolean;
            largeText: boolean;
            reducedMotion: boolean;
            keyboardNavigation: boolean;
            voiceControl: boolean;
            customizations: {
                enabled: boolean;
                feature: string;
                configuration?: Record<string, any> | undefined;
            }[];
        };
    }>;
    readonly NotificationPreferences: z.ZodObject<{
        email: z.ZodObject<{
            enabled: z.ZodBoolean;
            workoutReminders: z.ZodBoolean;
            progressUpdates: z.ZodBoolean;
            coachMessages: z.ZodBoolean;
            systemUpdates: z.ZodBoolean;
            marketingEmails: z.ZodBoolean;
            frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        }, {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        }>;
        push: z.ZodObject<{
            enabled: z.ZodBoolean;
            workoutReminders: z.ZodBoolean;
            coachMessages: z.ZodBoolean;
            systemAlerts: z.ZodBoolean;
            quietHours: z.ZodObject<{
                enabled: z.ZodBoolean;
                startTime: z.ZodString;
                endTime: z.ZodString;
                timezone: z.ZodString;
                daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            }, {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            }>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        }, {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        }>;
        sms: z.ZodObject<{
            enabled: z.ZodBoolean;
            emergencyOnly: z.ZodBoolean;
            phoneNumber: z.ZodOptional<z.ZodString>;
            verifiedAt: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        }, {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        }>;
        inApp: z.ZodObject<{
            enabled: z.ZodBoolean;
            showBadges: z.ZodBoolean;
            playSound: z.ZodBoolean;
            categories: z.ZodArray<z.ZodObject<{
                type: z.ZodNativeEnum<typeof NotificationType>;
                enabled: z.ZodBoolean;
                priority: z.ZodNativeEnum<typeof PriorityLevel>;
            }, "strip", z.ZodTypeAny, {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }, {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        }, {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        }>;
    }, "strip", z.ZodTypeAny, {
        email: {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        };
        push: {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        };
        sms: {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        };
        inApp: {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        };
    }, {
        email: {
            enabled: boolean;
            workoutReminders: boolean;
            progressUpdates: boolean;
            coachMessages: boolean;
            systemUpdates: boolean;
            marketingEmails: boolean;
            frequency: NotificationFrequency;
        };
        push: {
            enabled: boolean;
            workoutReminders: boolean;
            coachMessages: boolean;
            systemAlerts: boolean;
            quietHours: {
                enabled: boolean;
                startTime: string;
                endTime: string;
                timezone: string;
                daysOfWeek: number[];
            };
        };
        sms: {
            enabled: boolean;
            emergencyOnly: boolean;
            phoneNumber?: string | undefined;
            verifiedAt?: Date | undefined;
        };
        inApp: {
            enabled: boolean;
            showBadges: boolean;
            playSound: boolean;
            categories: {
                type: NotificationType;
                enabled: boolean;
                priority: PriorityLevel;
            }[];
        };
    }>;
    readonly PrivacySettings: z.ZodObject<{
        profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
        showProgress: z.ZodBoolean;
        showWorkouts: z.ZodBoolean;
        allowMessaging: z.ZodBoolean;
        dataSharing: z.ZodObject<{
            shareWithCoach: z.ZodBoolean;
            shareForResearch: z.ZodBoolean;
            shareForMarketing: z.ZodBoolean;
            shareAggregated: z.ZodBoolean;
            thirdPartyIntegrations: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        }, {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        }>;
        consentGiven: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof ConsentType>;
            given: z.ZodBoolean;
            timestamp: z.ZodDate;
            version: z.ZodString;
            ipAddress: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }, {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        profileVisibility: ProfileVisibility;
        showProgress: boolean;
        showWorkouts: boolean;
        allowMessaging: boolean;
        dataSharing: {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        };
        consentGiven: {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }[];
    }, {
        profileVisibility: ProfileVisibility;
        showProgress: boolean;
        showWorkouts: boolean;
        allowMessaging: boolean;
        dataSharing: {
            shareWithCoach: boolean;
            shareForResearch: boolean;
            shareForMarketing: boolean;
            shareAggregated: boolean;
            thirdPartyIntegrations: boolean;
        };
        consentGiven: {
            version: string;
            timestamp: Date;
            type: ConsentType;
            given: boolean;
            ipAddress: string;
        }[];
    }>;
    readonly AccessibilitySettings: z.ZodObject<{
        screenReader: z.ZodBoolean;
        highContrast: z.ZodBoolean;
        largeText: z.ZodBoolean;
        reducedMotion: z.ZodBoolean;
        keyboardNavigation: z.ZodBoolean;
        voiceControl: z.ZodBoolean;
        customizations: z.ZodArray<z.ZodObject<{
            feature: z.ZodString;
            enabled: z.ZodBoolean;
            configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }, {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        screenReader: boolean;
        highContrast: boolean;
        largeText: boolean;
        reducedMotion: boolean;
        keyboardNavigation: boolean;
        voiceControl: boolean;
        customizations: {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }[];
    }, {
        screenReader: boolean;
        highContrast: boolean;
        largeText: boolean;
        reducedMotion: boolean;
        keyboardNavigation: boolean;
        voiceControl: boolean;
        customizations: {
            enabled: boolean;
            feature: string;
            configuration?: Record<string, any> | undefined;
        }[];
    }>;
    readonly Equipment: z.ZodObject<{
        type: z.ZodNativeEnum<typeof EquipmentType>;
        brand: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        specifications: z.ZodObject<{
            maxWeight: z.ZodOptional<z.ZodNumber>;
            dimensions: z.ZodOptional<z.ZodObject<{
                length: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodOptional<z.ZodNumber>;
                unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
            }, "strip", z.ZodTypeAny, {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            }, {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            }>>;
            adjustableHeight: z.ZodOptional<z.ZodBoolean>;
            safetyFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            accessories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        }, {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        }>;
        condition: z.ZodNativeEnum<typeof EquipmentCondition>;
        limitations: z.ZodArray<z.ZodString, "many">;
        lastMaintenance: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: EquipmentType;
        specifications: {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        };
        condition: EquipmentCondition;
        limitations: string[];
        brand?: string | undefined;
        model?: string | undefined;
        lastMaintenance?: Date | undefined;
    }, {
        type: EquipmentType;
        specifications: {
            maxWeight?: number | undefined;
            dimensions?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            adjustableHeight?: boolean | undefined;
            safetyFeatures?: string[] | undefined;
            accessories?: string[] | undefined;
        };
        condition: EquipmentCondition;
        limitations: string[];
        brand?: string | undefined;
        model?: string | undefined;
        lastMaintenance?: Date | undefined;
    }>;
    readonly EquipmentProfile: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        name: z.ZodString;
        location: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        availableEquipment: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof EquipmentType>;
            brand: z.ZodOptional<z.ZodString>;
            model: z.ZodOptional<z.ZodString>;
            specifications: z.ZodObject<{
                maxWeight: z.ZodOptional<z.ZodNumber>;
                dimensions: z.ZodOptional<z.ZodObject<{
                    length: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodOptional<z.ZodNumber>;
                    unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
                }, "strip", z.ZodTypeAny, {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                }, {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                }>>;
                adjustableHeight: z.ZodOptional<z.ZodBoolean>;
                safetyFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                accessories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                maxWeight?: number | undefined;
                dimensions?: {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                } | undefined;
                adjustableHeight?: boolean | undefined;
                safetyFeatures?: string[] | undefined;
                accessories?: string[] | undefined;
            }, {
                maxWeight?: number | undefined;
                dimensions?: {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                } | undefined;
                adjustableHeight?: boolean | undefined;
                safetyFeatures?: string[] | undefined;
                accessories?: string[] | undefined;
            }>;
            condition: z.ZodNativeEnum<typeof EquipmentCondition>;
            limitations: z.ZodArray<z.ZodString, "many">;
            lastMaintenance: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            type: EquipmentType;
            specifications: {
                maxWeight?: number | undefined;
                dimensions?: {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                } | undefined;
                adjustableHeight?: boolean | undefined;
                safetyFeatures?: string[] | undefined;
                accessories?: string[] | undefined;
            };
            condition: EquipmentCondition;
            limitations: string[];
            brand?: string | undefined;
            model?: string | undefined;
            lastMaintenance?: Date | undefined;
        }, {
            type: EquipmentType;
            specifications: {
                maxWeight?: number | undefined;
                dimensions?: {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                } | undefined;
                adjustableHeight?: boolean | undefined;
                safetyFeatures?: string[] | undefined;
                accessories?: string[] | undefined;
            };
            condition: EquipmentCondition;
            limitations: string[];
            brand?: string | undefined;
            model?: string | undefined;
            lastMaintenance?: Date | undefined;
        }>, "many">;
        plateConfiguration: z.ZodObject<{
            unit: z.ZodNativeEnum<typeof WeightUnit>;
            barWeight: z.ZodNumber;
            availablePlates: z.ZodArray<z.ZodObject<{
                weight: z.ZodNumber;
                quantity: z.ZodNumber;
                material: z.ZodNativeEnum<typeof PlateMaterial>;
                type: z.ZodNativeEnum<typeof PlateType>;
            }, "strip", z.ZodTypeAny, {
                type: PlateType;
                weight: number;
                quantity: number;
                material: PlateMaterial;
            }, {
                type: PlateType;
                weight: number;
                quantity: number;
                material: PlateMaterial;
            }>, "many">;
            hasCollars: z.ZodBoolean;
            collarWeight: z.ZodNumber;
            loadingPins: z.ZodBoolean;
            fractionalPlates: z.ZodObject<{
                has0_25kg: z.ZodBoolean;
                has0_5kg: z.ZodBoolean;
                has1_25lbs: z.ZodBoolean;
                has2_5lbs: z.ZodBoolean;
                customFractionals: z.ZodArray<z.ZodNumber, "many">;
            }, "strip", z.ZodTypeAny, {
                has0_25kg: boolean;
                has0_5kg: boolean;
                has1_25lbs: boolean;
                has2_5lbs: boolean;
                customFractionals: number[];
            }, {
                has0_25kg: boolean;
                has0_5kg: boolean;
                has1_25lbs: boolean;
                has2_5lbs: boolean;
                customFractionals: number[];
            }>;
        }, "strip", z.ZodTypeAny, {
            unit: WeightUnit;
            barWeight: number;
            availablePlates: {
                type: PlateType;
                weight: number;
                quantity: number;
                material: PlateMaterial;
            }[];
            hasCollars: boolean;
            collarWeight: number;
            loadingPins: boolean;
            fractionalPlates: {
                has0_25kg: boolean;
                has0_5kg: boolean;
                has1_25lbs: boolean;
                has2_5lbs: boolean;
                customFractionals: number[];
            };
        }, {
            unit: WeightUnit;
            barWeight: number;
            availablePlates: {
                type: PlateType;
                weight: number;
                quantity: number;
                material: PlateMaterial;
            }[];
            hasCollars: boolean;
            collarWeight: number;
            loadingPins: boolean;
            fractionalPlates: {
                has0_25kg: boolean;
                has0_5kg: boolean;
                has1_25lbs: boolean;
                has2_5lbs: boolean;
                customFractionals: number[];
            };
        }>;
        spaceConstraints: z.ZodOptional<z.ZodObject<{
            ceilingHeight: z.ZodOptional<z.ZodNumber>;
            floorSpace: z.ZodOptional<z.ZodObject<{
                length: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodOptional<z.ZodNumber>;
                unit: z.ZodEnum<["cm", "in", "m", "ft"]>;
            }, "strip", z.ZodTypeAny, {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            }, {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            }>>;
            noiseRestrictions: z.ZodOptional<z.ZodBoolean>;
            timeRestrictions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                startTime: z.ZodString;
                endTime: z.ZodString;
                daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                startTime: string;
                endTime: string;
                daysOfWeek: number[];
                description?: string | undefined;
            }, {
                startTime: string;
                endTime: string;
                daysOfWeek: number[];
                description?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            ceilingHeight?: number | undefined;
            floorSpace?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            noiseRestrictions?: boolean | undefined;
            timeRestrictions?: {
                startTime: string;
                endTime: string;
                daysOfWeek: number[];
                description?: string | undefined;
            }[] | undefined;
        }, {
            ceilingHeight?: number | undefined;
            floorSpace?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            noiseRestrictions?: boolean | undefined;
            timeRestrictions?: {
                startTime: string;
                endTime: string;
                daysOfWeek: number[];
                description?: string | undefined;
            }[] | undefined;
        }>>;
        isDefault: z.ZodBoolean;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        location: string;
        userId: string;
        availableEquipment: {
            type: EquipmentType;
            specifications: {
                maxWeight?: number | undefined;
                dimensions?: {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                } | undefined;
                adjustableHeight?: boolean | undefined;
                safetyFeatures?: string[] | undefined;
                accessories?: string[] | undefined;
            };
            condition: EquipmentCondition;
            limitations: string[];
            brand?: string | undefined;
            model?: string | undefined;
            lastMaintenance?: Date | undefined;
        }[];
        plateConfiguration: {
            unit: WeightUnit;
            barWeight: number;
            availablePlates: {
                type: PlateType;
                weight: number;
                quantity: number;
                material: PlateMaterial;
            }[];
            hasCollars: boolean;
            collarWeight: number;
            loadingPins: boolean;
            fractionalPlates: {
                has0_25kg: boolean;
                has0_5kg: boolean;
                has1_25lbs: boolean;
                has2_5lbs: boolean;
                customFractionals: number[];
            };
        };
        isDefault: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description?: string | undefined;
        spaceConstraints?: {
            ceilingHeight?: number | undefined;
            floorSpace?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            noiseRestrictions?: boolean | undefined;
            timeRestrictions?: {
                startTime: string;
                endTime: string;
                daysOfWeek: number[];
                description?: string | undefined;
            }[] | undefined;
        } | undefined;
    }, {
        id: string;
        name: string;
        location: string;
        userId: string;
        availableEquipment: {
            type: EquipmentType;
            specifications: {
                maxWeight?: number | undefined;
                dimensions?: {
                    length: number;
                    width: number;
                    unit: "cm" | "in" | "m" | "ft";
                    height?: number | undefined;
                } | undefined;
                adjustableHeight?: boolean | undefined;
                safetyFeatures?: string[] | undefined;
                accessories?: string[] | undefined;
            };
            condition: EquipmentCondition;
            limitations: string[];
            brand?: string | undefined;
            model?: string | undefined;
            lastMaintenance?: Date | undefined;
        }[];
        plateConfiguration: {
            unit: WeightUnit;
            barWeight: number;
            availablePlates: {
                type: PlateType;
                weight: number;
                quantity: number;
                material: PlateMaterial;
            }[];
            hasCollars: boolean;
            collarWeight: number;
            loadingPins: boolean;
            fractionalPlates: {
                has0_25kg: boolean;
                has0_5kg: boolean;
                has1_25lbs: boolean;
                has2_5lbs: boolean;
                customFractionals: number[];
            };
        };
        isDefault: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description?: string | undefined;
        spaceConstraints?: {
            ceilingHeight?: number | undefined;
            floorSpace?: {
                length: number;
                width: number;
                unit: "cm" | "in" | "m" | "ft";
                height?: number | undefined;
            } | undefined;
            noiseRestrictions?: boolean | undefined;
            timeRestrictions?: {
                startTime: string;
                endTime: string;
                daysOfWeek: number[];
                description?: string | undefined;
            }[] | undefined;
        } | undefined;
    }>;
    readonly PlateConfiguration: z.ZodObject<{
        unit: z.ZodNativeEnum<typeof WeightUnit>;
        barWeight: z.ZodNumber;
        availablePlates: z.ZodArray<z.ZodObject<{
            weight: z.ZodNumber;
            quantity: z.ZodNumber;
            material: z.ZodNativeEnum<typeof PlateMaterial>;
            type: z.ZodNativeEnum<typeof PlateType>;
        }, "strip", z.ZodTypeAny, {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }, {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }>, "many">;
        hasCollars: z.ZodBoolean;
        collarWeight: z.ZodNumber;
        loadingPins: z.ZodBoolean;
        fractionalPlates: z.ZodObject<{
            has0_25kg: z.ZodBoolean;
            has0_5kg: z.ZodBoolean;
            has1_25lbs: z.ZodBoolean;
            has2_5lbs: z.ZodBoolean;
            customFractionals: z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        }, {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        }>;
    }, "strip", z.ZodTypeAny, {
        unit: WeightUnit;
        barWeight: number;
        availablePlates: {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }[];
        hasCollars: boolean;
        collarWeight: number;
        loadingPins: boolean;
        fractionalPlates: {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        };
    }, {
        unit: WeightUnit;
        barWeight: number;
        availablePlates: {
            type: PlateType;
            weight: number;
            quantity: number;
            material: PlateMaterial;
        }[];
        hasCollars: boolean;
        collarWeight: number;
        loadingPins: boolean;
        fractionalPlates: {
            has0_25kg: boolean;
            has0_5kg: boolean;
            has1_25lbs: boolean;
            has2_5lbs: boolean;
            customFractionals: number[];
        };
    }>;
    readonly TrainingSchedule: z.ZodObject<{
        userId: z.ZodString;
        availableDays: z.ZodArray<z.ZodObject<{
            dayOfWeek: z.ZodNumber;
            isAvailable: z.ZodBoolean;
            timeSlots: z.ZodArray<z.ZodObject<{
                startTime: z.ZodString;
                endTime: z.ZodString;
                preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
            }, "strip", z.ZodTypeAny, {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }, {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }>, "many">;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            dayOfWeek: number;
            isAvailable: boolean;
            timeSlots: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[];
            notes?: string | undefined;
        }, {
            dayOfWeek: number;
            isAvailable: boolean;
            timeSlots: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[];
            notes?: string | undefined;
        }>, "many">;
        preferredTimes: z.ZodArray<z.ZodObject<{
            timeOfDay: z.ZodNativeEnum<typeof TimeOfDay>;
            preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            preference: TimePreferenceLevel;
            timeOfDay: TimeOfDay;
            notes?: string | undefined;
        }, {
            preference: TimePreferenceLevel;
            timeOfDay: TimeOfDay;
            notes?: string | undefined;
        }>, "many">;
        sessionDuration: z.ZodObject<{
            preferred: z.ZodNumber;
            minimum: z.ZodNumber;
            maximum: z.ZodNumber;
            flexibility: z.ZodNativeEnum<typeof FlexibilityLevel>;
        }, "strip", z.ZodTypeAny, {
            preferred: number;
            minimum: number;
            maximum: number;
            flexibility: FlexibilityLevel;
        }, {
            preferred: number;
            minimum: number;
            maximum: number;
            flexibility: FlexibilityLevel;
        }>;
        restDayPreferences: z.ZodArray<z.ZodObject<{
            dayOfWeek: z.ZodNumber;
            isPreferred: z.ZodBoolean;
            reason: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            dayOfWeek: number;
            isPreferred: boolean;
            reason?: string | undefined;
        }, {
            dayOfWeek: number;
            isPreferred: boolean;
            reason?: string | undefined;
        }>, "many">;
        specialConsiderations: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof ConsiderationType>;
            description: z.ZodString;
            priority: z.ZodNativeEnum<typeof PriorityLevel>;
            affectedDays: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            affectedTimes: z.ZodOptional<z.ZodArray<z.ZodObject<{
                startTime: z.ZodString;
                endTime: z.ZodString;
                preference: z.ZodNativeEnum<typeof TimePreferenceLevel>;
            }, "strip", z.ZodTypeAny, {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }, {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            type: ConsiderationType;
            priority: PriorityLevel;
            affectedDays?: number[] | undefined;
            affectedTimes?: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[] | undefined;
        }, {
            description: string;
            type: ConsiderationType;
            priority: PriorityLevel;
            affectedDays?: number[] | undefined;
            affectedTimes?: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[] | undefined;
        }>, "many">;
        timezone: z.ZodString;
        lastUpdated: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        timezone: string;
        lastUpdated: Date;
        availableDays: {
            dayOfWeek: number;
            isAvailable: boolean;
            timeSlots: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[];
            notes?: string | undefined;
        }[];
        preferredTimes: {
            preference: TimePreferenceLevel;
            timeOfDay: TimeOfDay;
            notes?: string | undefined;
        }[];
        sessionDuration: {
            preferred: number;
            minimum: number;
            maximum: number;
            flexibility: FlexibilityLevel;
        };
        restDayPreferences: {
            dayOfWeek: number;
            isPreferred: boolean;
            reason?: string | undefined;
        }[];
        specialConsiderations: {
            description: string;
            type: ConsiderationType;
            priority: PriorityLevel;
            affectedDays?: number[] | undefined;
            affectedTimes?: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[] | undefined;
        }[];
    }, {
        userId: string;
        timezone: string;
        lastUpdated: Date;
        availableDays: {
            dayOfWeek: number;
            isAvailable: boolean;
            timeSlots: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[];
            notes?: string | undefined;
        }[];
        preferredTimes: {
            preference: TimePreferenceLevel;
            timeOfDay: TimeOfDay;
            notes?: string | undefined;
        }[];
        sessionDuration: {
            preferred: number;
            minimum: number;
            maximum: number;
            flexibility: FlexibilityLevel;
        };
        restDayPreferences: {
            dayOfWeek: number;
            isPreferred: boolean;
            reason?: string | undefined;
        }[];
        specialConsiderations: {
            description: string;
            type: ConsiderationType;
            priority: PriorityLevel;
            affectedDays?: number[] | undefined;
            affectedTimes?: {
                startTime: string;
                endTime: string;
                preference: TimePreferenceLevel;
            }[] | undefined;
        }[];
    }>;
    readonly HealthConsiderations: z.ZodObject<{
        disabilities: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof DisabilityType>;
            description: z.ZodString;
            accommodations: z.ZodArray<z.ZodObject<{
                type: z.ZodNativeEnum<typeof DisabilityType>;
                description: z.ZodString;
                equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                modifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                description: string;
                type: DisabilityType;
                equipment?: string[] | undefined;
                modifications?: string[] | undefined;
            }, {
                description: string;
                type: DisabilityType;
                equipment?: string[] | undefined;
                modifications?: string[] | undefined;
            }>, "many">;
            adaptiveEquipment: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                type: string;
                description?: string | undefined;
                specifications?: Record<string, any> | undefined;
            }, {
                name: string;
                type: string;
                description?: string | undefined;
                specifications?: Record<string, any> | undefined;
            }>, "many">;
            exerciseModifications: z.ZodArray<z.ZodObject<{
                exerciseId: z.ZodString;
                modificationType: z.ZodString;
                description: z.ZodString;
                alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                description: string;
                exerciseId: string;
                modificationType: string;
                alternatives?: string[] | undefined;
            }, {
                description: string;
                exerciseId: string;
                modificationType: string;
                alternatives?: string[] | undefined;
            }>, "many">;
            isTemporary: z.ZodBoolean;
            startDate: z.ZodDate;
            endDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            type: DisabilityType;
            accommodations: {
                description: string;
                type: DisabilityType;
                equipment?: string[] | undefined;
                modifications?: string[] | undefined;
            }[];
            adaptiveEquipment: {
                name: string;
                type: string;
                description?: string | undefined;
                specifications?: Record<string, any> | undefined;
            }[];
            exerciseModifications: {
                description: string;
                exerciseId: string;
                modificationType: string;
                alternatives?: string[] | undefined;
            }[];
            isTemporary: boolean;
            startDate: Date;
            endDate?: Date | undefined;
        }, {
            description: string;
            type: DisabilityType;
            accommodations: {
                description: string;
                type: DisabilityType;
                equipment?: string[] | undefined;
                modifications?: string[] | undefined;
            }[];
            adaptiveEquipment: {
                name: string;
                type: string;
                description?: string | undefined;
                specifications?: Record<string, any> | undefined;
            }[];
            exerciseModifications: {
                description: string;
                exerciseId: string;
                modificationType: string;
                alternatives?: string[] | undefined;
            }[];
            isTemporary: boolean;
            startDate: Date;
            endDate?: Date | undefined;
        }>, "many">;
        rangeOfMotionLimitations: z.ZodArray<z.ZodObject<{
            joint: z.ZodNativeEnum<typeof Joint>;
            movementPlane: z.ZodNativeEnum<typeof MovementPlane>;
            restrictionType: z.ZodNativeEnum<typeof RestrictionType>;
            limitationDegrees: z.ZodOptional<z.ZodNumber>;
            affectedExercises: z.ZodArray<z.ZodString, "many">;
            compensations: z.ZodArray<z.ZodString, "many">;
            isTemporary: z.ZodBoolean;
            startDate: z.ZodDate;
            endDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            isTemporary: boolean;
            startDate: Date;
            joint: Joint;
            movementPlane: MovementPlane;
            restrictionType: RestrictionType;
            affectedExercises: string[];
            compensations: string[];
            endDate?: Date | undefined;
            limitationDegrees?: number | undefined;
        }, {
            isTemporary: boolean;
            startDate: Date;
            joint: Joint;
            movementPlane: MovementPlane;
            restrictionType: RestrictionType;
            affectedExercises: string[];
            compensations: string[];
            endDate?: Date | undefined;
            limitationDegrees?: number | undefined;
        }>, "many">;
        menstrualCycleTracking: z.ZodOptional<z.ZodObject<{
            trackingEnabled: z.ZodBoolean;
            cycleLength: z.ZodNumber;
            lastPeriodStart: z.ZodOptional<z.ZodDate>;
            symptoms: z.ZodArray<z.ZodObject<{
                type: z.ZodString;
                severity: z.ZodNativeEnum<typeof SeverityLevel>;
                cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
                notes: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type: string;
                severity: SeverityLevel;
                cyclePhase: CyclePhase;
                notes?: string | undefined;
            }, {
                type: string;
                severity: SeverityLevel;
                cyclePhase: CyclePhase;
                notes?: string | undefined;
            }>, "many">;
            trainingAdjustments: z.ZodArray<z.ZodObject<{
                cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
                intensityModifier: z.ZodNumber;
                volumeModifier: z.ZodNumber;
                exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                recommendedFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                cyclePhase: CyclePhase;
                intensityModifier: number;
                volumeModifier: number;
                exerciseRestrictions?: string[] | undefined;
                recommendedFocus?: string[] | undefined;
            }, {
                cyclePhase: CyclePhase;
                intensityModifier: number;
                volumeModifier: number;
                exerciseRestrictions?: string[] | undefined;
                recommendedFocus?: string[] | undefined;
            }>, "many">;
            privacyLevel: z.ZodNativeEnum<typeof CyclePrivacyLevel>;
            shareWithCoach: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            shareWithCoach: boolean;
            trackingEnabled: boolean;
            cycleLength: number;
            symptoms: {
                type: string;
                severity: SeverityLevel;
                cyclePhase: CyclePhase;
                notes?: string | undefined;
            }[];
            trainingAdjustments: {
                cyclePhase: CyclePhase;
                intensityModifier: number;
                volumeModifier: number;
                exerciseRestrictions?: string[] | undefined;
                recommendedFocus?: string[] | undefined;
            }[];
            privacyLevel: CyclePrivacyLevel;
            lastPeriodStart?: Date | undefined;
        }, {
            shareWithCoach: boolean;
            trackingEnabled: boolean;
            cycleLength: number;
            symptoms: {
                type: string;
                severity: SeverityLevel;
                cyclePhase: CyclePhase;
                notes?: string | undefined;
            }[];
            trainingAdjustments: {
                cyclePhase: CyclePhase;
                intensityModifier: number;
                volumeModifier: number;
                exerciseRestrictions?: string[] | undefined;
                recommendedFocus?: string[] | undefined;
            }[];
            privacyLevel: CyclePrivacyLevel;
            lastPeriodStart?: Date | undefined;
        }>>;
        chronicConditions: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            diagnosedDate: z.ZodOptional<z.ZodDate>;
            severity: z.ZodNativeEnum<typeof SeverityLevel>;
            medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            monitoringRequired: z.ZodOptional<z.ZodBoolean>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            severity: SeverityLevel;
            notes?: string | undefined;
            medications?: string[] | undefined;
            exerciseRestrictions?: string[] | undefined;
            diagnosedDate?: Date | undefined;
            monitoringRequired?: boolean | undefined;
        }, {
            name: string;
            severity: SeverityLevel;
            notes?: string | undefined;
            medications?: string[] | undefined;
            exerciseRestrictions?: string[] | undefined;
            diagnosedDate?: Date | undefined;
            monitoringRequired?: boolean | undefined;
        }>, "many">;
        medications: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            dosage: z.ZodOptional<z.ZodString>;
            frequency: z.ZodOptional<z.ZodString>;
            startDate: z.ZodOptional<z.ZodDate>;
            endDate: z.ZodOptional<z.ZodDate>;
            sideEffects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            exerciseInteractions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            frequency?: string | undefined;
            startDate?: Date | undefined;
            endDate?: Date | undefined;
            dosage?: string | undefined;
            sideEffects?: string[] | undefined;
            exerciseInteractions?: string[] | undefined;
        }, {
            name: string;
            frequency?: string | undefined;
            startDate?: Date | undefined;
            endDate?: Date | undefined;
            dosage?: string | undefined;
            sideEffects?: string[] | undefined;
            exerciseInteractions?: string[] | undefined;
        }>, "many">;
        allergies: z.ZodArray<z.ZodObject<{
            allergen: z.ZodString;
            severity: z.ZodNativeEnum<typeof SeverityLevel>;
            reactions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            avoidanceInstructions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            severity: SeverityLevel;
            allergen: string;
            reactions?: string[] | undefined;
            avoidanceInstructions?: string[] | undefined;
        }, {
            severity: SeverityLevel;
            allergen: string;
            reactions?: string[] | undefined;
            avoidanceInstructions?: string[] | undefined;
        }>, "many">;
        emergencyMedicalInfo: z.ZodOptional<z.ZodObject<{
            bloodType: z.ZodOptional<z.ZodString>;
            emergencyContacts: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                relationship: z.ZodString;
                phoneNumber: z.ZodString;
                email: z.ZodOptional<z.ZodString>;
                isPrimary: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }, {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }>, "many">;
            medicalConditions: z.ZodArray<z.ZodString, "many">;
            medications: z.ZodArray<z.ZodString, "many">;
            allergies: z.ZodArray<z.ZodString, "many">;
            doctorContact: z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                phoneNumber: z.ZodString;
                email: z.ZodOptional<z.ZodString>;
                address: z.ZodOptional<z.ZodObject<{
                    street: z.ZodString;
                    city: z.ZodString;
                    state: z.ZodString;
                    postalCode: z.ZodString;
                    country: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }, {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }, {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            }>>;
            insuranceInfo: z.ZodOptional<z.ZodObject<{
                provider: z.ZodString;
                policyNumber: z.ZodString;
                groupNumber: z.ZodOptional<z.ZodString>;
                memberName: z.ZodString;
                effectiveDate: z.ZodDate;
                expirationDate: z.ZodOptional<z.ZodDate>;
            }, "strip", z.ZodTypeAny, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }, {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            medications: string[];
            allergies: string[];
            emergencyContacts: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }[];
            medicalConditions: string[];
            bloodType?: string | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }, {
            medications: string[];
            allergies: string[];
            emergencyContacts: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }[];
            medicalConditions: string[];
            bloodType?: string | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        }>>;
        lastUpdated: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        chronicConditions: {
            name: string;
            severity: SeverityLevel;
            notes?: string | undefined;
            medications?: string[] | undefined;
            exerciseRestrictions?: string[] | undefined;
            diagnosedDate?: Date | undefined;
            monitoringRequired?: boolean | undefined;
        }[];
        medications: {
            name: string;
            frequency?: string | undefined;
            startDate?: Date | undefined;
            endDate?: Date | undefined;
            dosage?: string | undefined;
            sideEffects?: string[] | undefined;
            exerciseInteractions?: string[] | undefined;
        }[];
        allergies: {
            severity: SeverityLevel;
            allergen: string;
            reactions?: string[] | undefined;
            avoidanceInstructions?: string[] | undefined;
        }[];
        disabilities: {
            description: string;
            type: DisabilityType;
            accommodations: {
                description: string;
                type: DisabilityType;
                equipment?: string[] | undefined;
                modifications?: string[] | undefined;
            }[];
            adaptiveEquipment: {
                name: string;
                type: string;
                description?: string | undefined;
                specifications?: Record<string, any> | undefined;
            }[];
            exerciseModifications: {
                description: string;
                exerciseId: string;
                modificationType: string;
                alternatives?: string[] | undefined;
            }[];
            isTemporary: boolean;
            startDate: Date;
            endDate?: Date | undefined;
        }[];
        rangeOfMotionLimitations: {
            isTemporary: boolean;
            startDate: Date;
            joint: Joint;
            movementPlane: MovementPlane;
            restrictionType: RestrictionType;
            affectedExercises: string[];
            compensations: string[];
            endDate?: Date | undefined;
            limitationDegrees?: number | undefined;
        }[];
        lastUpdated: Date;
        menstrualCycleTracking?: {
            shareWithCoach: boolean;
            trackingEnabled: boolean;
            cycleLength: number;
            symptoms: {
                type: string;
                severity: SeverityLevel;
                cyclePhase: CyclePhase;
                notes?: string | undefined;
            }[];
            trainingAdjustments: {
                cyclePhase: CyclePhase;
                intensityModifier: number;
                volumeModifier: number;
                exerciseRestrictions?: string[] | undefined;
                recommendedFocus?: string[] | undefined;
            }[];
            privacyLevel: CyclePrivacyLevel;
            lastPeriodStart?: Date | undefined;
        } | undefined;
        emergencyMedicalInfo?: {
            medications: string[];
            allergies: string[];
            emergencyContacts: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }[];
            medicalConditions: string[];
            bloodType?: string | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }, {
        chronicConditions: {
            name: string;
            severity: SeverityLevel;
            notes?: string | undefined;
            medications?: string[] | undefined;
            exerciseRestrictions?: string[] | undefined;
            diagnosedDate?: Date | undefined;
            monitoringRequired?: boolean | undefined;
        }[];
        medications: {
            name: string;
            frequency?: string | undefined;
            startDate?: Date | undefined;
            endDate?: Date | undefined;
            dosage?: string | undefined;
            sideEffects?: string[] | undefined;
            exerciseInteractions?: string[] | undefined;
        }[];
        allergies: {
            severity: SeverityLevel;
            allergen: string;
            reactions?: string[] | undefined;
            avoidanceInstructions?: string[] | undefined;
        }[];
        disabilities: {
            description: string;
            type: DisabilityType;
            accommodations: {
                description: string;
                type: DisabilityType;
                equipment?: string[] | undefined;
                modifications?: string[] | undefined;
            }[];
            adaptiveEquipment: {
                name: string;
                type: string;
                description?: string | undefined;
                specifications?: Record<string, any> | undefined;
            }[];
            exerciseModifications: {
                description: string;
                exerciseId: string;
                modificationType: string;
                alternatives?: string[] | undefined;
            }[];
            isTemporary: boolean;
            startDate: Date;
            endDate?: Date | undefined;
        }[];
        rangeOfMotionLimitations: {
            isTemporary: boolean;
            startDate: Date;
            joint: Joint;
            movementPlane: MovementPlane;
            restrictionType: RestrictionType;
            affectedExercises: string[];
            compensations: string[];
            endDate?: Date | undefined;
            limitationDegrees?: number | undefined;
        }[];
        lastUpdated: Date;
        menstrualCycleTracking?: {
            shareWithCoach: boolean;
            trackingEnabled: boolean;
            cycleLength: number;
            symptoms: {
                type: string;
                severity: SeverityLevel;
                cyclePhase: CyclePhase;
                notes?: string | undefined;
            }[];
            trainingAdjustments: {
                cyclePhase: CyclePhase;
                intensityModifier: number;
                volumeModifier: number;
                exerciseRestrictions?: string[] | undefined;
                recommendedFocus?: string[] | undefined;
            }[];
            privacyLevel: CyclePrivacyLevel;
            lastPeriodStart?: Date | undefined;
        } | undefined;
        emergencyMedicalInfo?: {
            medications: string[];
            allergies: string[];
            emergencyContacts: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }[];
            medicalConditions: string[];
            bloodType?: string | undefined;
            doctorContact?: {
                name: string;
                phoneNumber: string;
                email?: string | undefined;
                address?: {
                    street: string;
                    city: string;
                    state: string;
                    postalCode: string;
                    country: string;
                } | undefined;
            } | undefined;
            insuranceInfo?: {
                provider: string;
                policyNumber: string;
                memberName: string;
                effectiveDate: Date;
                groupNumber?: string | undefined;
                expirationDate?: Date | undefined;
            } | undefined;
        } | undefined;
    }>;
    readonly DisabilityAccommodation: z.ZodObject<{
        type: z.ZodNativeEnum<typeof DisabilityType>;
        description: z.ZodString;
        accommodations: z.ZodArray<z.ZodObject<{
            type: z.ZodNativeEnum<typeof DisabilityType>;
            description: z.ZodString;
            equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            modifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }, {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }>, "many">;
        adaptiveEquipment: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }, {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }>, "many">;
        exerciseModifications: z.ZodArray<z.ZodObject<{
            exerciseId: z.ZodString;
            modificationType: z.ZodString;
            description: z.ZodString;
            alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }, {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }>, "many">;
        isTemporary: z.ZodBoolean;
        startDate: z.ZodDate;
        endDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: DisabilityType;
        accommodations: {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }[];
        adaptiveEquipment: {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }[];
        exerciseModifications: {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }[];
        isTemporary: boolean;
        startDate: Date;
        endDate?: Date | undefined;
    }, {
        description: string;
        type: DisabilityType;
        accommodations: {
            description: string;
            type: DisabilityType;
            equipment?: string[] | undefined;
            modifications?: string[] | undefined;
        }[];
        adaptiveEquipment: {
            name: string;
            type: string;
            description?: string | undefined;
            specifications?: Record<string, any> | undefined;
        }[];
        exerciseModifications: {
            description: string;
            exerciseId: string;
            modificationType: string;
            alternatives?: string[] | undefined;
        }[];
        isTemporary: boolean;
        startDate: Date;
        endDate?: Date | undefined;
    }>;
    readonly ROMRestriction: z.ZodObject<{
        joint: z.ZodNativeEnum<typeof Joint>;
        movementPlane: z.ZodNativeEnum<typeof MovementPlane>;
        restrictionType: z.ZodNativeEnum<typeof RestrictionType>;
        limitationDegrees: z.ZodOptional<z.ZodNumber>;
        affectedExercises: z.ZodArray<z.ZodString, "many">;
        compensations: z.ZodArray<z.ZodString, "many">;
        isTemporary: z.ZodBoolean;
        startDate: z.ZodDate;
        endDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        isTemporary: boolean;
        startDate: Date;
        joint: Joint;
        movementPlane: MovementPlane;
        restrictionType: RestrictionType;
        affectedExercises: string[];
        compensations: string[];
        endDate?: Date | undefined;
        limitationDegrees?: number | undefined;
    }, {
        isTemporary: boolean;
        startDate: Date;
        joint: Joint;
        movementPlane: MovementPlane;
        restrictionType: RestrictionType;
        affectedExercises: string[];
        compensations: string[];
        endDate?: Date | undefined;
        limitationDegrees?: number | undefined;
    }>;
    readonly MenstrualCycleSettings: z.ZodObject<{
        trackingEnabled: z.ZodBoolean;
        cycleLength: z.ZodNumber;
        lastPeriodStart: z.ZodOptional<z.ZodDate>;
        symptoms: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            severity: z.ZodNativeEnum<typeof SeverityLevel>;
            cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }, {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }>, "many">;
        trainingAdjustments: z.ZodArray<z.ZodObject<{
            cyclePhase: z.ZodNativeEnum<typeof CyclePhase>;
            intensityModifier: z.ZodNumber;
            volumeModifier: z.ZodNumber;
            exerciseRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            recommendedFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }, {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }>, "many">;
        privacyLevel: z.ZodNativeEnum<typeof CyclePrivacyLevel>;
        shareWithCoach: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        shareWithCoach: boolean;
        trackingEnabled: boolean;
        cycleLength: number;
        symptoms: {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }[];
        trainingAdjustments: {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }[];
        privacyLevel: CyclePrivacyLevel;
        lastPeriodStart?: Date | undefined;
    }, {
        shareWithCoach: boolean;
        trackingEnabled: boolean;
        cycleLength: number;
        symptoms: {
            type: string;
            severity: SeverityLevel;
            cyclePhase: CyclePhase;
            notes?: string | undefined;
        }[];
        trainingAdjustments: {
            cyclePhase: CyclePhase;
            intensityModifier: number;
            volumeModifier: number;
            exerciseRestrictions?: string[] | undefined;
            recommendedFocus?: string[] | undefined;
        }[];
        privacyLevel: CyclePrivacyLevel;
        lastPeriodStart?: Date | undefined;
    }>;
    readonly Tenant: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        domain: z.ZodOptional<z.ZodString>;
        status: z.ZodNativeEnum<typeof TenantStatus>;
        settings: z.ZodObject<{
            allowSelfCoached: z.ZodBoolean;
            requireCoachApproval: z.ZodBoolean;
            enableVideoAnalysis: z.ZodBoolean;
            enableAIFeedback: z.ZodBoolean;
            defaultLanguage: z.ZodNativeEnum<typeof SupportedLanguage>;
            defaultWeightUnit: z.ZodNativeEnum<typeof WeightUnit>;
            availableLanguages: z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">;
            maxCoaches: z.ZodNumber;
            maxAthletes: z.ZodNumber;
            features: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                enabled: z.ZodBoolean;
                configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }, {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }>, "many">;
            customBranding: z.ZodOptional<z.ZodObject<{
                logoUrl: z.ZodOptional<z.ZodString>;
                primaryColor: z.ZodOptional<z.ZodString>;
                secondaryColor: z.ZodOptional<z.ZodString>;
                customDomain: z.ZodOptional<z.ZodString>;
                companyName: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            }, {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            }>>;
            complianceSettings: z.ZodObject<{
                gdprEnabled: z.ZodBoolean;
                pdpaEnabled: z.ZodBoolean;
                hipaaEnabled: z.ZodBoolean;
                dataRetentionDays: z.ZodNumber;
                auditLogRetentionDays: z.ZodNumber;
                consentRequired: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            }, {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            allowSelfCoached: boolean;
            requireCoachApproval: boolean;
            enableVideoAnalysis: boolean;
            enableAIFeedback: boolean;
            defaultLanguage: SupportedLanguage;
            defaultWeightUnit: WeightUnit;
            availableLanguages: SupportedLanguage[];
            maxCoaches: number;
            maxAthletes: number;
            features: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[];
            complianceSettings: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            };
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
        }, {
            allowSelfCoached: boolean;
            requireCoachApproval: boolean;
            enableVideoAnalysis: boolean;
            enableAIFeedback: boolean;
            defaultLanguage: SupportedLanguage;
            defaultWeightUnit: WeightUnit;
            availableLanguages: SupportedLanguage[];
            maxCoaches: number;
            maxAthletes: number;
            features: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[];
            complianceSettings: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            };
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
        }>;
        subscription: z.ZodObject<{
            id: z.ZodString;
            planId: z.ZodString;
            status: z.ZodNativeEnum<typeof SubscriptionStatus>;
            currentPeriodStart: z.ZodDate;
            currentPeriodEnd: z.ZodDate;
            cancelAtPeriodEnd: z.ZodBoolean;
            trialEnd: z.ZodOptional<z.ZodDate>;
            usage: z.ZodObject<{
                activeCoaches: z.ZodNumber;
                activeAthletes: z.ZodNumber;
                storageUsed: z.ZodNumber;
                apiCalls: z.ZodNumber;
                videoAnalysisMinutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                activeCoaches: number;
                activeAthletes: number;
                storageUsed: number;
                apiCalls: number;
                videoAnalysisMinutes: number;
            }, {
                activeCoaches: number;
                activeAthletes: number;
                storageUsed: number;
                apiCalls: number;
                videoAnalysisMinutes: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            status: SubscriptionStatus;
            planId: string;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            usage: {
                activeCoaches: number;
                activeAthletes: number;
                storageUsed: number;
                apiCalls: number;
                videoAnalysisMinutes: number;
            };
            trialEnd?: Date | undefined;
        }, {
            id: string;
            status: SubscriptionStatus;
            planId: string;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            usage: {
                activeCoaches: number;
                activeAthletes: number;
                storageUsed: number;
                apiCalls: number;
                videoAnalysisMinutes: number;
            };
            trialEnd?: Date | undefined;
        }>;
        billing: z.ZodObject<{
            customerId: z.ZodString;
            paymentMethodId: z.ZodOptional<z.ZodString>;
            billingAddress: z.ZodOptional<z.ZodObject<{
                line1: z.ZodString;
                line2: z.ZodOptional<z.ZodString>;
                city: z.ZodString;
                state: z.ZodOptional<z.ZodString>;
                postalCode: z.ZodString;
                country: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            }, {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            }>>;
            taxId: z.ZodOptional<z.ZodString>;
            currency: z.ZodNativeEnum<typeof Currency>;
            nextBillingDate: z.ZodDate;
            lastPaymentDate: z.ZodOptional<z.ZodDate>;
            outstandingBalance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            customerId: string;
            currency: Currency;
            nextBillingDate: Date;
            outstandingBalance: number;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            lastPaymentDate?: Date | undefined;
        }, {
            customerId: string;
            currency: Currency;
            nextBillingDate: Date;
            outstandingBalance: number;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            lastPaymentDate?: Date | undefined;
        }>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        suspendedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: TenantStatus;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        settings: {
            allowSelfCoached: boolean;
            requireCoachApproval: boolean;
            enableVideoAnalysis: boolean;
            enableAIFeedback: boolean;
            defaultLanguage: SupportedLanguage;
            defaultWeightUnit: WeightUnit;
            availableLanguages: SupportedLanguage[];
            maxCoaches: number;
            maxAthletes: number;
            features: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[];
            complianceSettings: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            };
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
        };
        subscription: {
            id: string;
            status: SubscriptionStatus;
            planId: string;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            usage: {
                activeCoaches: number;
                activeAthletes: number;
                storageUsed: number;
                apiCalls: number;
                videoAnalysisMinutes: number;
            };
            trialEnd?: Date | undefined;
        };
        billing: {
            customerId: string;
            currency: Currency;
            nextBillingDate: Date;
            outstandingBalance: number;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            lastPaymentDate?: Date | undefined;
        };
        domain?: string | undefined;
        suspendedAt?: Date | undefined;
    }, {
        id: string;
        status: TenantStatus;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        settings: {
            allowSelfCoached: boolean;
            requireCoachApproval: boolean;
            enableVideoAnalysis: boolean;
            enableAIFeedback: boolean;
            defaultLanguage: SupportedLanguage;
            defaultWeightUnit: WeightUnit;
            availableLanguages: SupportedLanguage[];
            maxCoaches: number;
            maxAthletes: number;
            features: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[];
            complianceSettings: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            };
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
        };
        subscription: {
            id: string;
            status: SubscriptionStatus;
            planId: string;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            usage: {
                activeCoaches: number;
                activeAthletes: number;
                storageUsed: number;
                apiCalls: number;
                videoAnalysisMinutes: number;
            };
            trialEnd?: Date | undefined;
        };
        billing: {
            customerId: string;
            currency: Currency;
            nextBillingDate: Date;
            outstandingBalance: number;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            lastPaymentDate?: Date | undefined;
        };
        domain?: string | undefined;
        suspendedAt?: Date | undefined;
    }>;
    readonly TenantSettings: z.ZodObject<{
        allowSelfCoached: z.ZodBoolean;
        requireCoachApproval: z.ZodBoolean;
        enableVideoAnalysis: z.ZodBoolean;
        enableAIFeedback: z.ZodBoolean;
        defaultLanguage: z.ZodNativeEnum<typeof SupportedLanguage>;
        defaultWeightUnit: z.ZodNativeEnum<typeof WeightUnit>;
        availableLanguages: z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">;
        maxCoaches: z.ZodNumber;
        maxAthletes: z.ZodNumber;
        features: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            enabled: z.ZodBoolean;
            configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }, {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }>, "many">;
        customBranding: z.ZodOptional<z.ZodObject<{
            logoUrl: z.ZodOptional<z.ZodString>;
            primaryColor: z.ZodOptional<z.ZodString>;
            secondaryColor: z.ZodOptional<z.ZodString>;
            customDomain: z.ZodOptional<z.ZodString>;
            companyName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }, {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        }>>;
        complianceSettings: z.ZodObject<{
            gdprEnabled: z.ZodBoolean;
            pdpaEnabled: z.ZodBoolean;
            hipaaEnabled: z.ZodBoolean;
            dataRetentionDays: z.ZodNumber;
            auditLogRetentionDays: z.ZodNumber;
            consentRequired: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }, {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        allowSelfCoached: boolean;
        requireCoachApproval: boolean;
        enableVideoAnalysis: boolean;
        enableAIFeedback: boolean;
        defaultLanguage: SupportedLanguage;
        defaultWeightUnit: WeightUnit;
        availableLanguages: SupportedLanguage[];
        maxCoaches: number;
        maxAthletes: number;
        features: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[];
        complianceSettings: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        };
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
    }, {
        allowSelfCoached: boolean;
        requireCoachApproval: boolean;
        enableVideoAnalysis: boolean;
        enableAIFeedback: boolean;
        defaultLanguage: SupportedLanguage;
        defaultWeightUnit: WeightUnit;
        availableLanguages: SupportedLanguage[];
        maxCoaches: number;
        maxAthletes: number;
        features: {
            name: string;
            enabled: boolean;
            configuration?: Record<string, any> | undefined;
        }[];
        complianceSettings: {
            gdprEnabled: boolean;
            pdpaEnabled: boolean;
            hipaaEnabled: boolean;
            dataRetentionDays: number;
            auditLogRetentionDays: number;
            consentRequired: boolean;
        };
        customBranding?: {
            logoUrl?: string | undefined;
            primaryColor?: string | undefined;
            secondaryColor?: string | undefined;
            customDomain?: string | undefined;
            companyName?: string | undefined;
        } | undefined;
    }>;
    readonly SubscriptionInfo: z.ZodObject<{
        id: z.ZodString;
        planId: z.ZodString;
        status: z.ZodNativeEnum<typeof SubscriptionStatus>;
        currentPeriodStart: z.ZodDate;
        currentPeriodEnd: z.ZodDate;
        cancelAtPeriodEnd: z.ZodBoolean;
        trialEnd: z.ZodOptional<z.ZodDate>;
        usage: z.ZodObject<{
            activeCoaches: z.ZodNumber;
            activeAthletes: z.ZodNumber;
            storageUsed: z.ZodNumber;
            apiCalls: z.ZodNumber;
            videoAnalysisMinutes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        }, {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: SubscriptionStatus;
        planId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        usage: {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        };
        trialEnd?: Date | undefined;
    }, {
        id: string;
        status: SubscriptionStatus;
        planId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        usage: {
            activeCoaches: number;
            activeAthletes: number;
            storageUsed: number;
            apiCalls: number;
            videoAnalysisMinutes: number;
        };
        trialEnd?: Date | undefined;
    }>;
    readonly BillingInfo: z.ZodObject<{
        customerId: z.ZodString;
        paymentMethodId: z.ZodOptional<z.ZodString>;
        billingAddress: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }, {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        }>>;
        taxId: z.ZodOptional<z.ZodString>;
        currency: z.ZodNativeEnum<typeof Currency>;
        nextBillingDate: z.ZodDate;
        lastPaymentDate: z.ZodOptional<z.ZodDate>;
        outstandingBalance: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        customerId: string;
        currency: Currency;
        nextBillingDate: Date;
        outstandingBalance: number;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        lastPaymentDate?: Date | undefined;
    }, {
        customerId: string;
        currency: Currency;
        nextBillingDate: Date;
        outstandingBalance: number;
        paymentMethodId?: string | undefined;
        billingAddress?: {
            city: string;
            postalCode: string;
            country: string;
            line1: string;
            state?: string | undefined;
            line2?: string | undefined;
        } | undefined;
        taxId?: string | undefined;
        lastPaymentDate?: Date | undefined;
    }>;
    readonly TransitionRequest: z.ZodObject<{
        id: z.ZodString;
        athleteId: z.ZodString;
        fromCoachId: z.ZodOptional<z.ZodString>;
        toCoachId: z.ZodOptional<z.ZodString>;
        transitionType: z.ZodNativeEnum<typeof TransitionType>;
        status: z.ZodNativeEnum<typeof TransitionStatus>;
        reason: z.ZodOptional<z.ZodString>;
        approvalRequired: z.ZodBoolean;
        approvedBy: z.ZodOptional<z.ZodString>;
        approvedAt: z.ZodOptional<z.ZodDate>;
        executedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        rollbackAt: z.ZodOptional<z.ZodDate>;
        metadata: z.ZodObject<{
            requestedBy: z.ZodString;
            priority: z.ZodNativeEnum<typeof PriorityLevel>;
            estimatedCompletionTime: z.ZodOptional<z.ZodDate>;
            rollbackPlan: z.ZodOptional<z.ZodString>;
            communicationPlan: z.ZodOptional<z.ZodString>;
            stakeholders: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            priority: PriorityLevel;
            requestedBy: string;
            stakeholders: string[];
            estimatedCompletionTime?: Date | undefined;
            rollbackPlan?: string | undefined;
            communicationPlan?: string | undefined;
        }, {
            priority: PriorityLevel;
            requestedBy: string;
            stakeholders: string[];
            estimatedCompletionTime?: Date | undefined;
            rollbackPlan?: string | undefined;
            communicationPlan?: string | undefined;
        }>;
        notifications: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            recipientId: z.ZodString;
            type: z.ZodNativeEnum<typeof NotificationType>;
            status: z.ZodNativeEnum<typeof NotificationStatus>;
            sentAt: z.ZodOptional<z.ZodDate>;
            readAt: z.ZodOptional<z.ZodDate>;
            content: z.ZodObject<{
                subject: z.ZodString;
                body: z.ZodString;
                actionUrl: z.ZodOptional<z.ZodString>;
                actionText: z.ZodOptional<z.ZodString>;
                priority: z.ZodNativeEnum<typeof PriorityLevel>;
            }, "strip", z.ZodTypeAny, {
                priority: PriorityLevel;
                subject: string;
                body: string;
                actionUrl?: string | undefined;
                actionText?: string | undefined;
            }, {
                priority: PriorityLevel;
                subject: string;
                body: string;
                actionUrl?: string | undefined;
                actionText?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            status: NotificationStatus;
            type: NotificationType;
            recipientId: string;
            content: {
                priority: PriorityLevel;
                subject: string;
                body: string;
                actionUrl?: string | undefined;
                actionText?: string | undefined;
            };
            sentAt?: Date | undefined;
            readAt?: Date | undefined;
        }, {
            id: string;
            status: NotificationStatus;
            type: NotificationType;
            recipientId: string;
            content: {
                priority: PriorityLevel;
                subject: string;
                body: string;
                actionUrl?: string | undefined;
                actionText?: string | undefined;
            };
            sentAt?: Date | undefined;
            readAt?: Date | undefined;
        }>, "many">;
        dataTransfer: z.ZodObject<{
            transferredData: z.ZodArray<z.ZodString, "many">;
            retainedData: z.ZodArray<z.ZodString, "many">;
            archivedData: z.ZodArray<z.ZodString, "many">;
            accessUpdates: z.ZodArray<z.ZodObject<{
                userId: z.ZodString;
                resource: z.ZodString;
                oldPermissions: z.ZodArray<z.ZodString, "many">;
                newPermissions: z.ZodArray<z.ZodString, "many">;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                userId: string;
                updatedAt: Date;
                resource: string;
                oldPermissions: string[];
                newPermissions: string[];
            }, {
                userId: string;
                updatedAt: Date;
                resource: string;
                oldPermissions: string[];
                newPermissions: string[];
            }>, "many">;
            completedAt: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            transferredData: string[];
            retainedData: string[];
            archivedData: string[];
            accessUpdates: {
                userId: string;
                updatedAt: Date;
                resource: string;
                oldPermissions: string[];
                newPermissions: string[];
            }[];
            completedAt?: Date | undefined;
        }, {
            transferredData: string[];
            retainedData: string[];
            archivedData: string[];
            accessUpdates: {
                userId: string;
                updatedAt: Date;
                resource: string;
                oldPermissions: string[];
                newPermissions: string[];
            }[];
            completedAt?: Date | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: TransitionStatus;
        metadata: {
            priority: PriorityLevel;
            requestedBy: string;
            stakeholders: string[];
            estimatedCompletionTime?: Date | undefined;
            rollbackPlan?: string | undefined;
            communicationPlan?: string | undefined;
        };
        notifications: {
            id: string;
            status: NotificationStatus;
            type: NotificationType;
            recipientId: string;
            content: {
                priority: PriorityLevel;
                subject: string;
                body: string;
                actionUrl?: string | undefined;
                actionText?: string | undefined;
            };
            sentAt?: Date | undefined;
            readAt?: Date | undefined;
        }[];
        athleteId: string;
        transitionType: TransitionType;
        approvalRequired: boolean;
        dataTransfer: {
            transferredData: string[];
            retainedData: string[];
            archivedData: string[];
            accessUpdates: {
                userId: string;
                updatedAt: Date;
                resource: string;
                oldPermissions: string[];
                newPermissions: string[];
            }[];
            completedAt?: Date | undefined;
        };
        reason?: string | undefined;
        completedAt?: Date | undefined;
        fromCoachId?: string | undefined;
        toCoachId?: string | undefined;
        approvedBy?: string | undefined;
        approvedAt?: Date | undefined;
        executedAt?: Date | undefined;
        rollbackAt?: Date | undefined;
    }, {
        id: string;
        status: TransitionStatus;
        metadata: {
            priority: PriorityLevel;
            requestedBy: string;
            stakeholders: string[];
            estimatedCompletionTime?: Date | undefined;
            rollbackPlan?: string | undefined;
            communicationPlan?: string | undefined;
        };
        notifications: {
            id: string;
            status: NotificationStatus;
            type: NotificationType;
            recipientId: string;
            content: {
                priority: PriorityLevel;
                subject: string;
                body: string;
                actionUrl?: string | undefined;
                actionText?: string | undefined;
            };
            sentAt?: Date | undefined;
            readAt?: Date | undefined;
        }[];
        athleteId: string;
        transitionType: TransitionType;
        approvalRequired: boolean;
        dataTransfer: {
            transferredData: string[];
            retainedData: string[];
            archivedData: string[];
            accessUpdates: {
                userId: string;
                updatedAt: Date;
                resource: string;
                oldPermissions: string[];
                newPermissions: string[];
            }[];
            completedAt?: Date | undefined;
        };
        reason?: string | undefined;
        completedAt?: Date | undefined;
        fromCoachId?: string | undefined;
        toCoachId?: string | undefined;
        approvedBy?: string | undefined;
        approvedAt?: Date | undefined;
        executedAt?: Date | undefined;
        rollbackAt?: Date | undefined;
    }>;
    readonly TransitionMetadata: z.ZodObject<{
        requestedBy: z.ZodString;
        priority: z.ZodNativeEnum<typeof PriorityLevel>;
        estimatedCompletionTime: z.ZodOptional<z.ZodDate>;
        rollbackPlan: z.ZodOptional<z.ZodString>;
        communicationPlan: z.ZodOptional<z.ZodString>;
        stakeholders: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        priority: PriorityLevel;
        requestedBy: string;
        stakeholders: string[];
        estimatedCompletionTime?: Date | undefined;
        rollbackPlan?: string | undefined;
        communicationPlan?: string | undefined;
    }, {
        priority: PriorityLevel;
        requestedBy: string;
        stakeholders: string[];
        estimatedCompletionTime?: Date | undefined;
        rollbackPlan?: string | undefined;
        communicationPlan?: string | undefined;
    }>;
    readonly AuthCredentials: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        tenantId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        tenantId?: string | undefined;
    }, {
        password: string;
        email: string;
        tenantId?: string | undefined;
    }>;
    readonly Permission: z.ZodObject<{
        resource: z.ZodString;
        actions: z.ZodArray<z.ZodString, "many">;
        conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodNativeEnum<typeof ConditionOperator>;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            field: string;
            operator: ConditionOperator;
            value?: any;
        }, {
            field: string;
            operator: ConditionOperator;
            value?: any;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        resource: string;
        actions: string[];
        conditions?: {
            field: string;
            operator: ConditionOperator;
            value?: any;
        }[] | undefined;
    }, {
        resource: string;
        actions: string[];
        conditions?: {
            field: string;
            operator: ConditionOperator;
            value?: any;
        }[] | undefined;
    }>;
    readonly SecurityEvent: z.ZodObject<{
        userId: z.ZodString;
        tenantId: z.ZodString;
        eventType: z.ZodNativeEnum<typeof SecurityEventType>;
        resource: z.ZodString;
        action: z.ZodString;
        success: z.ZodBoolean;
        ipAddress: z.ZodString;
        userAgent: z.ZodString;
        timestamp: z.ZodDate;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        timestamp: Date;
        success: boolean;
        eventType: SecurityEventType;
        userId: string;
        tenantId: string;
        ipAddress: string;
        resource: string;
        action: string;
        userAgent: string;
        metadata?: Record<string, any> | undefined;
    }, {
        timestamp: Date;
        success: boolean;
        eventType: SecurityEventType;
        userId: string;
        tenantId: string;
        ipAddress: string;
        resource: string;
        action: string;
        userAgent: string;
        metadata?: Record<string, any> | undefined;
    }>;
    readonly UserSession: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresAt: z.ZodDate;
        ipAddress: z.ZodString;
        userAgent: z.ZodString;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        lastUsedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        userId: string;
        ipAddress: string;
        isActive: boolean;
        createdAt: Date;
        userAgent: string;
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
        lastUsedAt: Date;
    }, {
        id: string;
        userId: string;
        ipAddress: string;
        isActive: boolean;
        createdAt: Date;
        userAgent: string;
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
        lastUsedAt: Date;
    }>;
    readonly CreateUserRequest: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodNativeEnum<typeof UserRole>;
        tenantId: z.ZodString;
        profile: z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            dateOfBirth: z.ZodOptional<z.ZodDate>;
            gender: z.ZodOptional<z.ZodNativeEnum<typeof Gender>>;
            bodyWeight: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            experienceLevel: z.ZodOptional<z.ZodNativeEnum<typeof ExperienceLevel>>;
            disciplines: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof Discipline>, "many">>;
            goals: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof TrainingGoal>, "many">>;
            emergencyContact: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                relationship: z.ZodString;
                phoneNumber: z.ZodString;
                email: z.ZodOptional<z.ZodString>;
                isPrimary: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }, {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }>>>;
            medicalInformation: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                bloodType: z.ZodOptional<z.ZodString>;
                chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                surgicalHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    procedure: z.ZodString;
                    date: z.ZodDate;
                    complications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    recoveryNotes: z.ZodOptional<z.ZodString>;
                    affectedMovements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }, {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }>, "many">>;
                familyMedicalHistory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                lastPhysicalExam: z.ZodOptional<z.ZodDate>;
                doctorContact: z.ZodOptional<z.ZodObject<{
                    name: z.ZodString;
                    phoneNumber: z.ZodString;
                    email: z.ZodOptional<z.ZodString>;
                    address: z.ZodOptional<z.ZodObject<{
                        street: z.ZodString;
                        city: z.ZodString;
                        state: z.ZodString;
                        postalCode: z.ZodString;
                        country: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    }, {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                }, {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                }>>;
                insuranceInfo: z.ZodOptional<z.ZodObject<{
                    provider: z.ZodString;
                    policyNumber: z.ZodString;
                    groupNumber: z.ZodOptional<z.ZodString>;
                    memberName: z.ZodString;
                    effectiveDate: z.ZodDate;
                    expirationDate: z.ZodOptional<z.ZodDate>;
                }, "strip", z.ZodTypeAny, {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                }, {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            }, {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        }, {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        }>;
        preferences: z.ZodOptional<z.ZodObject<{
            language: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
            weightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
            dateFormat: z.ZodOptional<z.ZodNativeEnum<typeof DateFormat>>;
            timeFormat: z.ZodOptional<z.ZodNativeEnum<typeof TimeFormat>>;
            timezone: z.ZodOptional<z.ZodString>;
            notifications: z.ZodOptional<z.ZodObject<{
                email: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    workoutReminders: z.ZodBoolean;
                    progressUpdates: z.ZodBoolean;
                    coachMessages: z.ZodBoolean;
                    systemUpdates: z.ZodBoolean;
                    marketingEmails: z.ZodBoolean;
                    frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                }, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                }>;
                push: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    workoutReminders: z.ZodBoolean;
                    coachMessages: z.ZodBoolean;
                    systemAlerts: z.ZodBoolean;
                    quietHours: z.ZodObject<{
                        enabled: z.ZodBoolean;
                        startTime: z.ZodString;
                        endTime: z.ZodString;
                        timezone: z.ZodString;
                        daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
                    }, "strip", z.ZodTypeAny, {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    }, {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    }>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                }, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                }>;
                sms: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    emergencyOnly: z.ZodBoolean;
                    phoneNumber: z.ZodOptional<z.ZodString>;
                    verifiedAt: z.ZodOptional<z.ZodDate>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                }, {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                }>;
                inApp: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    showBadges: z.ZodBoolean;
                    playSound: z.ZodBoolean;
                    categories: z.ZodArray<z.ZodObject<{
                        type: z.ZodNativeEnum<typeof NotificationType>;
                        enabled: z.ZodBoolean;
                        priority: z.ZodNativeEnum<typeof PriorityLevel>;
                    }, "strip", z.ZodTypeAny, {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }, {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }>, "many">;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                }, {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                }>;
            }, "strip", z.ZodTypeAny, {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            }, {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            }>>;
            privacy: z.ZodOptional<z.ZodObject<{
                profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
                showProgress: z.ZodBoolean;
                showWorkouts: z.ZodBoolean;
                allowMessaging: z.ZodBoolean;
                dataSharing: z.ZodObject<{
                    shareWithCoach: z.ZodBoolean;
                    shareForResearch: z.ZodBoolean;
                    shareForMarketing: z.ZodBoolean;
                    shareAggregated: z.ZodBoolean;
                    thirdPartyIntegrations: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                }, {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                }>;
                consentGiven: z.ZodArray<z.ZodObject<{
                    type: z.ZodNativeEnum<typeof ConsentType>;
                    given: z.ZodBoolean;
                    timestamp: z.ZodDate;
                    version: z.ZodString;
                    ipAddress: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }, {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            }, {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            }>>;
            accessibility: z.ZodOptional<z.ZodObject<{
                screenReader: z.ZodBoolean;
                highContrast: z.ZodBoolean;
                largeText: z.ZodBoolean;
                reducedMotion: z.ZodBoolean;
                keyboardNavigation: z.ZodBoolean;
                voiceControl: z.ZodBoolean;
                customizations: z.ZodArray<z.ZodObject<{
                    feature: z.ZodString;
                    enabled: z.ZodBoolean;
                    configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }, {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            }, {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            }>>;
        }, "strip", z.ZodTypeAny, {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        }, {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        }>>;
        sendWelcomeEmail: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        role: UserRole;
        profile: {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        };
        tenantId: string;
        preferences?: {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        } | undefined;
        sendWelcomeEmail?: boolean | undefined;
    }, {
        password: string;
        email: string;
        role: UserRole;
        profile: {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        };
        tenantId: string;
        preferences?: {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        } | undefined;
        sendWelcomeEmail?: boolean | undefined;
    }>;
    readonly UpdateUserRequest: z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
        status: z.ZodOptional<z.ZodNativeEnum<typeof UserStatus>>;
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            dateOfBirth: z.ZodOptional<z.ZodDate>;
            gender: z.ZodOptional<z.ZodNativeEnum<typeof Gender>>;
            bodyWeight: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            experienceLevel: z.ZodOptional<z.ZodNativeEnum<typeof ExperienceLevel>>;
            disciplines: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof Discipline>, "many">>;
            goals: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof TrainingGoal>, "many">>;
            emergencyContact: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                relationship: z.ZodString;
                phoneNumber: z.ZodString;
                email: z.ZodOptional<z.ZodString>;
                isPrimary: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }, {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            }>>>;
            medicalInformation: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                bloodType: z.ZodOptional<z.ZodString>;
                chronicConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                allergies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                surgicalHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    procedure: z.ZodString;
                    date: z.ZodDate;
                    complications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    recoveryNotes: z.ZodOptional<z.ZodString>;
                    affectedMovements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }, {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }>, "many">>;
                familyMedicalHistory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                lastPhysicalExam: z.ZodOptional<z.ZodDate>;
                doctorContact: z.ZodOptional<z.ZodObject<{
                    name: z.ZodString;
                    phoneNumber: z.ZodString;
                    email: z.ZodOptional<z.ZodString>;
                    address: z.ZodOptional<z.ZodObject<{
                        street: z.ZodString;
                        city: z.ZodString;
                        state: z.ZodString;
                        postalCode: z.ZodString;
                        country: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    }, {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                }, {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                }>>;
                insuranceInfo: z.ZodOptional<z.ZodObject<{
                    provider: z.ZodString;
                    policyNumber: z.ZodString;
                    groupNumber: z.ZodOptional<z.ZodString>;
                    memberName: z.ZodString;
                    effectiveDate: z.ZodDate;
                    expirationDate: z.ZodOptional<z.ZodDate>;
                }, "strip", z.ZodTypeAny, {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                }, {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            }, {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        }, {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        }>>;
        preferences: z.ZodOptional<z.ZodObject<{
            language: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
            weightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
            dateFormat: z.ZodOptional<z.ZodNativeEnum<typeof DateFormat>>;
            timeFormat: z.ZodOptional<z.ZodNativeEnum<typeof TimeFormat>>;
            timezone: z.ZodOptional<z.ZodString>;
            notifications: z.ZodOptional<z.ZodObject<{
                email: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    workoutReminders: z.ZodBoolean;
                    progressUpdates: z.ZodBoolean;
                    coachMessages: z.ZodBoolean;
                    systemUpdates: z.ZodBoolean;
                    marketingEmails: z.ZodBoolean;
                    frequency: z.ZodNativeEnum<typeof NotificationFrequency>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                }, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                }>;
                push: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    workoutReminders: z.ZodBoolean;
                    coachMessages: z.ZodBoolean;
                    systemAlerts: z.ZodBoolean;
                    quietHours: z.ZodObject<{
                        enabled: z.ZodBoolean;
                        startTime: z.ZodString;
                        endTime: z.ZodString;
                        timezone: z.ZodString;
                        daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
                    }, "strip", z.ZodTypeAny, {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    }, {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    }>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                }, {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                }>;
                sms: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    emergencyOnly: z.ZodBoolean;
                    phoneNumber: z.ZodOptional<z.ZodString>;
                    verifiedAt: z.ZodOptional<z.ZodDate>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                }, {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                }>;
                inApp: z.ZodObject<{
                    enabled: z.ZodBoolean;
                    showBadges: z.ZodBoolean;
                    playSound: z.ZodBoolean;
                    categories: z.ZodArray<z.ZodObject<{
                        type: z.ZodNativeEnum<typeof NotificationType>;
                        enabled: z.ZodBoolean;
                        priority: z.ZodNativeEnum<typeof PriorityLevel>;
                    }, "strip", z.ZodTypeAny, {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }, {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }>, "many">;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                }, {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                }>;
            }, "strip", z.ZodTypeAny, {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            }, {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            }>>;
            privacy: z.ZodOptional<z.ZodObject<{
                profileVisibility: z.ZodNativeEnum<typeof ProfileVisibility>;
                showProgress: z.ZodBoolean;
                showWorkouts: z.ZodBoolean;
                allowMessaging: z.ZodBoolean;
                dataSharing: z.ZodObject<{
                    shareWithCoach: z.ZodBoolean;
                    shareForResearch: z.ZodBoolean;
                    shareForMarketing: z.ZodBoolean;
                    shareAggregated: z.ZodBoolean;
                    thirdPartyIntegrations: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                }, {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                }>;
                consentGiven: z.ZodArray<z.ZodObject<{
                    type: z.ZodNativeEnum<typeof ConsentType>;
                    given: z.ZodBoolean;
                    timestamp: z.ZodDate;
                    version: z.ZodString;
                    ipAddress: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }, {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            }, {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            }>>;
            accessibility: z.ZodOptional<z.ZodObject<{
                screenReader: z.ZodBoolean;
                highContrast: z.ZodBoolean;
                largeText: z.ZodBoolean;
                reducedMotion: z.ZodBoolean;
                keyboardNavigation: z.ZodBoolean;
                voiceControl: z.ZodBoolean;
                customizations: z.ZodArray<z.ZodObject<{
                    feature: z.ZodString;
                    enabled: z.ZodBoolean;
                    configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }, {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            }, {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            }>>;
        }, "strip", z.ZodTypeAny, {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        }, {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        role?: UserRole | undefined;
        status?: UserStatus | undefined;
        preferences?: {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        } | undefined;
        profile?: {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    }, {
        email?: string | undefined;
        role?: UserRole | undefined;
        status?: UserStatus | undefined;
        preferences?: {
            timezone?: string | undefined;
            language?: SupportedLanguage | undefined;
            weightUnit?: WeightUnit | undefined;
            dateFormat?: DateFormat | undefined;
            timeFormat?: TimeFormat | undefined;
            notifications?: {
                email: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    progressUpdates: boolean;
                    coachMessages: boolean;
                    systemUpdates: boolean;
                    marketingEmails: boolean;
                    frequency: NotificationFrequency;
                };
                push: {
                    enabled: boolean;
                    workoutReminders: boolean;
                    coachMessages: boolean;
                    systemAlerts: boolean;
                    quietHours: {
                        enabled: boolean;
                        startTime: string;
                        endTime: string;
                        timezone: string;
                        daysOfWeek: number[];
                    };
                };
                sms: {
                    enabled: boolean;
                    emergencyOnly: boolean;
                    phoneNumber?: string | undefined;
                    verifiedAt?: Date | undefined;
                };
                inApp: {
                    enabled: boolean;
                    showBadges: boolean;
                    playSound: boolean;
                    categories: {
                        type: NotificationType;
                        enabled: boolean;
                        priority: PriorityLevel;
                    }[];
                };
            } | undefined;
            privacy?: {
                profileVisibility: ProfileVisibility;
                showProgress: boolean;
                showWorkouts: boolean;
                allowMessaging: boolean;
                dataSharing: {
                    shareWithCoach: boolean;
                    shareForResearch: boolean;
                    shareForMarketing: boolean;
                    shareAggregated: boolean;
                    thirdPartyIntegrations: boolean;
                };
                consentGiven: {
                    version: string;
                    timestamp: Date;
                    type: ConsentType;
                    given: boolean;
                    ipAddress: string;
                }[];
            } | undefined;
            accessibility?: {
                screenReader: boolean;
                highContrast: boolean;
                largeText: boolean;
                reducedMotion: boolean;
                keyboardNavigation: boolean;
                voiceControl: boolean;
                customizations: {
                    enabled: boolean;
                    feature: string;
                    configuration?: Record<string, any> | undefined;
                }[];
            } | undefined;
        } | undefined;
        profile?: {
            gender?: Gender | undefined;
            height?: number | undefined;
            goals?: TrainingGoal[] | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            dateOfBirth?: Date | undefined;
            bodyWeight?: number | undefined;
            experienceLevel?: ExperienceLevel | undefined;
            disciplines?: Discipline[] | undefined;
            emergencyContact?: {
                name: string;
                relationship: string;
                phoneNumber: string;
                isPrimary: boolean;
                email?: string | undefined;
            } | undefined;
            medicalInformation?: {
                bloodType?: string | undefined;
                chronicConditions?: string[] | undefined;
                medications?: string[] | undefined;
                allergies?: string[] | undefined;
                surgicalHistory?: {
                    date: Date;
                    procedure: string;
                    complications?: string[] | undefined;
                    recoveryNotes?: string | undefined;
                    affectedMovements?: string[] | undefined;
                }[] | undefined;
                familyMedicalHistory?: string[] | undefined;
                lastPhysicalExam?: Date | undefined;
                doctorContact?: {
                    name: string;
                    phoneNumber: string;
                    email?: string | undefined;
                    address?: {
                        street: string;
                        city: string;
                        state: string;
                        postalCode: string;
                        country: string;
                    } | undefined;
                } | undefined;
                insuranceInfo?: {
                    provider: string;
                    policyNumber: string;
                    memberName: string;
                    effectiveDate: Date;
                    groupNumber?: string | undefined;
                    expirationDate?: Date | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    }>;
    readonly CreateTenantRequest: z.ZodObject<{
        name: z.ZodString;
        domain: z.ZodOptional<z.ZodString>;
        adminEmail: z.ZodString;
        adminPassword: z.ZodString;
        settings: z.ZodOptional<z.ZodObject<{
            allowSelfCoached: z.ZodOptional<z.ZodBoolean>;
            requireCoachApproval: z.ZodOptional<z.ZodBoolean>;
            enableVideoAnalysis: z.ZodOptional<z.ZodBoolean>;
            enableAIFeedback: z.ZodOptional<z.ZodBoolean>;
            defaultLanguage: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
            defaultWeightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
            availableLanguages: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">>;
            maxCoaches: z.ZodOptional<z.ZodNumber>;
            maxAthletes: z.ZodOptional<z.ZodNumber>;
            features: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                enabled: z.ZodBoolean;
                configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }, {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }>, "many">>;
            customBranding: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                logoUrl: z.ZodOptional<z.ZodString>;
                primaryColor: z.ZodOptional<z.ZodString>;
                secondaryColor: z.ZodOptional<z.ZodString>;
                customDomain: z.ZodOptional<z.ZodString>;
                companyName: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            }, {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            }>>>;
            complianceSettings: z.ZodOptional<z.ZodObject<{
                gdprEnabled: z.ZodBoolean;
                pdpaEnabled: z.ZodBoolean;
                hipaaEnabled: z.ZodBoolean;
                dataRetentionDays: z.ZodNumber;
                auditLogRetentionDays: z.ZodNumber;
                consentRequired: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            }, {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            }>>;
        }, "strip", z.ZodTypeAny, {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        }, {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        }>>;
        billingInfo: z.ZodOptional<z.ZodObject<{
            customerId: z.ZodOptional<z.ZodString>;
            paymentMethodId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            billingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                line1: z.ZodString;
                line2: z.ZodOptional<z.ZodString>;
                city: z.ZodString;
                state: z.ZodOptional<z.ZodString>;
                postalCode: z.ZodString;
                country: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            }, {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            }>>>;
            taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            currency: z.ZodOptional<z.ZodNativeEnum<typeof Currency>>;
            nextBillingDate: z.ZodOptional<z.ZodDate>;
            lastPaymentDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
            outstandingBalance: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            customerId?: string | undefined;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            currency?: Currency | undefined;
            nextBillingDate?: Date | undefined;
            lastPaymentDate?: Date | undefined;
            outstandingBalance?: number | undefined;
        }, {
            customerId?: string | undefined;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            currency?: Currency | undefined;
            nextBillingDate?: Date | undefined;
            lastPaymentDate?: Date | undefined;
            outstandingBalance?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        adminEmail: string;
        adminPassword: string;
        domain?: string | undefined;
        settings?: {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        } | undefined;
        billingInfo?: {
            customerId?: string | undefined;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            currency?: Currency | undefined;
            nextBillingDate?: Date | undefined;
            lastPaymentDate?: Date | undefined;
            outstandingBalance?: number | undefined;
        } | undefined;
    }, {
        name: string;
        adminEmail: string;
        adminPassword: string;
        domain?: string | undefined;
        settings?: {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        } | undefined;
        billingInfo?: {
            customerId?: string | undefined;
            paymentMethodId?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            taxId?: string | undefined;
            currency?: Currency | undefined;
            nextBillingDate?: Date | undefined;
            lastPaymentDate?: Date | undefined;
            outstandingBalance?: number | undefined;
        } | undefined;
    }>;
    readonly UpdateTenantRequest: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        domain: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodNativeEnum<typeof TenantStatus>>;
        settings: z.ZodOptional<z.ZodObject<{
            allowSelfCoached: z.ZodOptional<z.ZodBoolean>;
            requireCoachApproval: z.ZodOptional<z.ZodBoolean>;
            enableVideoAnalysis: z.ZodOptional<z.ZodBoolean>;
            enableAIFeedback: z.ZodOptional<z.ZodBoolean>;
            defaultLanguage: z.ZodOptional<z.ZodNativeEnum<typeof SupportedLanguage>>;
            defaultWeightUnit: z.ZodOptional<z.ZodNativeEnum<typeof WeightUnit>>;
            availableLanguages: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SupportedLanguage>, "many">>;
            maxCoaches: z.ZodOptional<z.ZodNumber>;
            maxAthletes: z.ZodOptional<z.ZodNumber>;
            features: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                enabled: z.ZodBoolean;
                configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }, {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }>, "many">>;
            customBranding: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                logoUrl: z.ZodOptional<z.ZodString>;
                primaryColor: z.ZodOptional<z.ZodString>;
                secondaryColor: z.ZodOptional<z.ZodString>;
                customDomain: z.ZodOptional<z.ZodString>;
                companyName: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            }, {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            }>>>;
            complianceSettings: z.ZodOptional<z.ZodObject<{
                gdprEnabled: z.ZodBoolean;
                pdpaEnabled: z.ZodBoolean;
                hipaaEnabled: z.ZodBoolean;
                dataRetentionDays: z.ZodNumber;
                auditLogRetentionDays: z.ZodNumber;
                consentRequired: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            }, {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            }>>;
        }, "strip", z.ZodTypeAny, {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        }, {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        status?: TenantStatus | undefined;
        name?: string | undefined;
        domain?: string | undefined;
        settings?: {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        } | undefined;
    }, {
        status?: TenantStatus | undefined;
        name?: string | undefined;
        domain?: string | undefined;
        settings?: {
            allowSelfCoached?: boolean | undefined;
            requireCoachApproval?: boolean | undefined;
            enableVideoAnalysis?: boolean | undefined;
            enableAIFeedback?: boolean | undefined;
            defaultLanguage?: SupportedLanguage | undefined;
            defaultWeightUnit?: WeightUnit | undefined;
            availableLanguages?: SupportedLanguage[] | undefined;
            maxCoaches?: number | undefined;
            maxAthletes?: number | undefined;
            features?: {
                name: string;
                enabled: boolean;
                configuration?: Record<string, any> | undefined;
            }[] | undefined;
            customBranding?: {
                logoUrl?: string | undefined;
                primaryColor?: string | undefined;
                secondaryColor?: string | undefined;
                customDomain?: string | undefined;
                companyName?: string | undefined;
            } | undefined;
            complianceSettings?: {
                gdprEnabled: boolean;
                pdpaEnabled: boolean;
                hipaaEnabled: boolean;
                dataRetentionDays: number;
                auditLogRetentionDays: number;
                consentRequired: boolean;
            } | undefined;
        } | undefined;
    }>;
    readonly LoginRequest: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        tenantId: z.ZodOptional<z.ZodString>;
        rememberMe: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        tenantId?: string | undefined;
        rememberMe?: boolean | undefined;
    }, {
        password: string;
        email: string;
        tenantId?: string | undefined;
        rememberMe?: boolean | undefined;
    }>;
    readonly PasswordResetRequest: z.ZodObject<{
        email: z.ZodString;
        tenantId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        tenantId?: string | undefined;
    }, {
        email: string;
        tenantId?: string | undefined;
    }>;
    readonly PasswordResetConfirm: z.ZodObject<{
        token: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
        newPassword: string;
    }, {
        token: string;
        newPassword: string;
    }>;
    readonly ChangePasswordRequest: z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        newPassword: string;
        currentPassword: string;
    }, {
        newPassword: string;
        currentPassword: string;
    }>;
    readonly PaymentMethod: z.ZodObject<{
        id: z.ZodString;
        tenantId: z.ZodString;
        type: z.ZodNativeEnum<typeof PaymentMethodType>;
        details: z.ZodObject<{
            promptPayId: z.ZodOptional<z.ZodString>;
            promptPayType: z.ZodOptional<z.ZodEnum<["PHONE", "ID_CARD", "E_WALLET"]>>;
            promptPayName: z.ZodOptional<z.ZodString>;
            bankName: z.ZodOptional<z.ZodString>;
            bankCode: z.ZodOptional<z.ZodString>;
            accountNumber: z.ZodOptional<z.ZodString>;
            accountName: z.ZodOptional<z.ZodString>;
            routingNumber: z.ZodOptional<z.ZodString>;
            swiftCode: z.ZodOptional<z.ZodString>;
            iban: z.ZodOptional<z.ZodString>;
            branchCode: z.ZodOptional<z.ZodString>;
            last4: z.ZodOptional<z.ZodString>;
            brand: z.ZodOptional<z.ZodString>;
            expiryMonth: z.ZodOptional<z.ZodNumber>;
            expiryYear: z.ZodOptional<z.ZodNumber>;
            fingerprint: z.ZodOptional<z.ZodString>;
            funding: z.ZodOptional<z.ZodEnum<["CREDIT", "DEBIT", "PREPAID", "UNKNOWN"]>>;
            country: z.ZodOptional<z.ZodString>;
            walletType: z.ZodOptional<z.ZodString>;
            walletId: z.ZodOptional<z.ZodString>;
            walletEmail: z.ZodOptional<z.ZodString>;
            cryptoType: z.ZodOptional<z.ZodString>;
            walletAddress: z.ZodOptional<z.ZodString>;
            network: z.ZodOptional<z.ZodString>;
            displayName: z.ZodString;
            nickname: z.ZodOptional<z.ZodString>;
            billingAddress: z.ZodOptional<z.ZodObject<{
                line1: z.ZodString;
                line2: z.ZodOptional<z.ZodString>;
                city: z.ZodString;
                state: z.ZodOptional<z.ZodString>;
                postalCode: z.ZodString;
                country: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            }, {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            }>>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            displayName: string;
            metadata?: Record<string, any> | undefined;
            country?: string | undefined;
            brand?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            promptPayId?: string | undefined;
            promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
            promptPayName?: string | undefined;
            bankName?: string | undefined;
            bankCode?: string | undefined;
            accountNumber?: string | undefined;
            accountName?: string | undefined;
            routingNumber?: string | undefined;
            swiftCode?: string | undefined;
            iban?: string | undefined;
            branchCode?: string | undefined;
            last4?: string | undefined;
            expiryMonth?: number | undefined;
            expiryYear?: number | undefined;
            fingerprint?: string | undefined;
            funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
            walletType?: string | undefined;
            walletId?: string | undefined;
            walletEmail?: string | undefined;
            cryptoType?: string | undefined;
            walletAddress?: string | undefined;
            network?: string | undefined;
            nickname?: string | undefined;
        }, {
            displayName: string;
            metadata?: Record<string, any> | undefined;
            country?: string | undefined;
            brand?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            promptPayId?: string | undefined;
            promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
            promptPayName?: string | undefined;
            bankName?: string | undefined;
            bankCode?: string | undefined;
            accountNumber?: string | undefined;
            accountName?: string | undefined;
            routingNumber?: string | undefined;
            swiftCode?: string | undefined;
            iban?: string | undefined;
            branchCode?: string | undefined;
            last4?: string | undefined;
            expiryMonth?: number | undefined;
            expiryYear?: number | undefined;
            fingerprint?: string | undefined;
            funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
            walletType?: string | undefined;
            walletId?: string | undefined;
            walletEmail?: string | undefined;
            cryptoType?: string | undefined;
            walletAddress?: string | undefined;
            network?: string | undefined;
            nickname?: string | undefined;
        }>;
        isDefault: z.ZodBoolean;
        isActive: z.ZodBoolean;
        isVerified: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        expiresAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: PaymentMethodType;
        tenantId: string;
        isDefault: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        details: {
            displayName: string;
            metadata?: Record<string, any> | undefined;
            country?: string | undefined;
            brand?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            promptPayId?: string | undefined;
            promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
            promptPayName?: string | undefined;
            bankName?: string | undefined;
            bankCode?: string | undefined;
            accountNumber?: string | undefined;
            accountName?: string | undefined;
            routingNumber?: string | undefined;
            swiftCode?: string | undefined;
            iban?: string | undefined;
            branchCode?: string | undefined;
            last4?: string | undefined;
            expiryMonth?: number | undefined;
            expiryYear?: number | undefined;
            fingerprint?: string | undefined;
            funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
            walletType?: string | undefined;
            walletId?: string | undefined;
            walletEmail?: string | undefined;
            cryptoType?: string | undefined;
            walletAddress?: string | undefined;
            network?: string | undefined;
            nickname?: string | undefined;
        };
        isVerified: boolean;
        expiresAt?: Date | undefined;
    }, {
        id: string;
        type: PaymentMethodType;
        tenantId: string;
        isDefault: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        details: {
            displayName: string;
            metadata?: Record<string, any> | undefined;
            country?: string | undefined;
            brand?: string | undefined;
            billingAddress?: {
                city: string;
                postalCode: string;
                country: string;
                line1: string;
                state?: string | undefined;
                line2?: string | undefined;
            } | undefined;
            promptPayId?: string | undefined;
            promptPayType?: "PHONE" | "ID_CARD" | "E_WALLET" | undefined;
            promptPayName?: string | undefined;
            bankName?: string | undefined;
            bankCode?: string | undefined;
            accountNumber?: string | undefined;
            accountName?: string | undefined;
            routingNumber?: string | undefined;
            swiftCode?: string | undefined;
            iban?: string | undefined;
            branchCode?: string | undefined;
            last4?: string | undefined;
            expiryMonth?: number | undefined;
            expiryYear?: number | undefined;
            fingerprint?: string | undefined;
            funding?: "UNKNOWN" | "CREDIT" | "DEBIT" | "PREPAID" | undefined;
            walletType?: string | undefined;
            walletId?: string | undefined;
            walletEmail?: string | undefined;
            cryptoType?: string | undefined;
            walletAddress?: string | undefined;
            network?: string | undefined;
            nickname?: string | undefined;
        };
        isVerified: boolean;
        expiresAt?: Date | undefined;
    }>;
    readonly PaymentRequest: z.ZodObject<{
        tenantId: z.ZodString;
        amount: z.ZodNumber;
        currency: z.ZodNativeEnum<typeof Currency>;
        paymentMethodId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        statementDescriptor: z.ZodOptional<z.ZodString>;
        receiptEmail: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        idempotencyKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tenantId: string;
        paymentMethodId: string;
        currency: Currency;
        amount: number;
        description?: string | undefined;
        metadata?: Record<string, any> | undefined;
        statementDescriptor?: string | undefined;
        receiptEmail?: string | undefined;
        idempotencyKey?: string | undefined;
    }, {
        tenantId: string;
        paymentMethodId: string;
        currency: Currency;
        amount: number;
        description?: string | undefined;
        metadata?: Record<string, any> | undefined;
        statementDescriptor?: string | undefined;
        receiptEmail?: string | undefined;
        idempotencyKey?: string | undefined;
    }>;
    readonly UserFilters: z.ZodObject<{
        role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
        status: z.ZodOptional<z.ZodNativeEnum<typeof UserStatus>>;
        tenantId: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        createdAfter: z.ZodOptional<z.ZodDate>;
        createdBefore: z.ZodOptional<z.ZodDate>;
        lastLoginAfter: z.ZodOptional<z.ZodDate>;
        lastLoginBefore: z.ZodOptional<z.ZodDate>;
        limit: z.ZodOptional<z.ZodNumber>;
        offset: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        search?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
        role?: UserRole | undefined;
        status?: UserStatus | undefined;
        tenantId?: string | undefined;
        createdAfter?: Date | undefined;
        createdBefore?: Date | undefined;
        lastLoginAfter?: Date | undefined;
        lastLoginBefore?: Date | undefined;
    }, {
        search?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
        role?: UserRole | undefined;
        status?: UserStatus | undefined;
        tenantId?: string | undefined;
        createdAfter?: Date | undefined;
        createdBefore?: Date | undefined;
        lastLoginAfter?: Date | undefined;
        lastLoginBefore?: Date | undefined;
    }>;
    readonly AuditFilters: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        tenantId: z.ZodOptional<z.ZodString>;
        action: z.ZodOptional<z.ZodString>;
        resource: z.ZodOptional<z.ZodString>;
        startDate: z.ZodOptional<z.ZodDate>;
        endDate: z.ZodOptional<z.ZodDate>;
        limit: z.ZodOptional<z.ZodNumber>;
        offset: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit?: number | undefined;
        offset?: number | undefined;
        userId?: string | undefined;
        tenantId?: string | undefined;
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        resource?: string | undefined;
        action?: string | undefined;
    }, {
        limit?: number | undefined;
        offset?: number | undefined;
        userId?: string | undefined;
        tenantId?: string | undefined;
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        resource?: string | undefined;
        action?: string | undefined;
    }>;
    readonly ErrorResponse: z.ZodObject<{
        error: z.ZodObject<{
            type: z.ZodNativeEnum<typeof ErrorType>;
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            timestamp: z.ZodDate;
            requestId: z.ZodString;
            userId: z.ZodOptional<z.ZodString>;
            tenantId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            timestamp: Date;
            type: ErrorType;
            code: string;
            requestId: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
            details?: Record<string, any> | undefined;
        }, {
            message: string;
            timestamp: Date;
            type: ErrorType;
            code: string;
            requestId: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
            details?: Record<string, any> | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        error: {
            message: string;
            timestamp: Date;
            type: ErrorType;
            code: string;
            requestId: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
            details?: Record<string, any> | undefined;
        };
    }, {
        error: {
            message: string;
            timestamp: Date;
            type: ErrorType;
            code: string;
            requestId: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
            details?: Record<string, any> | undefined;
        };
    }>;
    readonly ValidationError: z.ZodObject<{
        field: z.ZodString;
        code: z.ZodNativeEnum<typeof ValidationErrorCode>;
        message: z.ZodString;
        value: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: ValidationErrorCode;
        field: string;
        value?: any;
    }, {
        message: string;
        code: ValidationErrorCode;
        field: string;
        value?: any;
    }>;
};
//# sourceMappingURL=validation-schemas.d.ts.map