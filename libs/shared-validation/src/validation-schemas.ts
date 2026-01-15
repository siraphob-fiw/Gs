import Joi from 'joi';
import { z } from 'zod';

// Common validation patterns
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Joi Schemas
export const JoiSchemas = {
  // User validation schemas
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required'
  }),

  username: Joi.string().pattern(USERNAME_REGEX).min(3).max(30).required().messages({
    'string.pattern.base': 'Username must contain only letters, numbers, underscores, and hyphens',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must not exceed 30 characters',
    'any.required': 'Username is required'
  }),

  password: Joi.string().pattern(PASSWORD_REGEX).min(8).required().messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),

  phone: Joi.string().pattern(PHONE_REGEX).optional().messages({
    'string.pattern.base': 'Phone number must be in valid international format'
  }),

  uuid: Joi.string().pattern(UUID_REGEX).required().messages({
    'string.pattern.base': 'Must be a valid UUID',
    'any.required': 'ID is required'
  }),

  // User creation schema
  createUser: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().pattern(USERNAME_REGEX).min(3).max(30).required(),
    password: Joi.string().pattern(PASSWORD_REGEX).min(8).required(),
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().min(1).max(100).required(),
    phone: Joi.string().pattern(PHONE_REGEX).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    tenantId: Joi.string().pattern(UUID_REGEX).required()
  }),

  // User update schema
  updateUser: Joi.object({
    email: Joi.string().email().optional(),
    firstName: Joi.string().min(1).max(100).optional(),
    lastName: Joi.string().min(1).max(100).optional(),
    phone: Joi.string().pattern(PHONE_REGEX).optional().allow(''),
    dateOfBirth: Joi.date().max('now').optional()
  }).min(1),

  // Login schema
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    tenantId: Joi.string().pattern(UUID_REGEX).optional()
  }),

  // Tenant schemas
  createTenant: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    domain: Joi.string().domain().optional(),
    settings: Joi.object().optional(),
    maxUsers: Joi.number().integer().min(1).optional(),
    subscriptionTier: Joi.string().valid('basic', 'premium', 'enterprise').optional()
  }),

  updateTenant: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    domain: Joi.string().domain().optional(),
    settings: Joi.object().optional(),
    maxUsers: Joi.number().integer().min(1).optional(),
    subscriptionTier: Joi.string().valid('basic', 'premium', 'enterprise').optional()
  }).min(1),

  // Session validation
  sessionId: Joi.string().min(10).required(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  // Search
  search: Joi.object({
    query: Joi.string().min(1).max(255).required(),
    filters: Joi.object().optional(),
    includeInactive: Joi.boolean().default(false)
  }),

  // Advanced User Preferences
  trainingAvailability: Joi.object({
    weeklySchedule: Joi.object({
      monday: Joi.object({
        isAvailable: Joi.boolean().required(),
        timeSlots: Joi.array().items(Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          preference: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          equipmentProfileId: Joi.string().optional()
        })).default([]),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).default([]),
        maxSessions: Joi.number().integer().min(0).max(5).required(),
        notes: Joi.string().optional()
      }).required(),
      tuesday: Joi.object({
        isAvailable: Joi.boolean().required(),
        timeSlots: Joi.array().items(Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          preference: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          equipmentProfileId: Joi.string().optional()
        })).default([]),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).default([]),
        maxSessions: Joi.number().integer().min(0).max(5).required(),
        notes: Joi.string().optional()
      }).required(),
      wednesday: Joi.object({
        isAvailable: Joi.boolean().required(),
        timeSlots: Joi.array().items(Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          preference: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          equipmentProfileId: Joi.string().optional()
        })).default([]),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).default([]),
        maxSessions: Joi.number().integer().min(0).max(5).required(),
        notes: Joi.string().optional()
      }).required(),
      thursday: Joi.object({
        isAvailable: Joi.boolean().required(),
        timeSlots: Joi.array().items(Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          preference: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          equipmentProfileId: Joi.string().optional()
        })).default([]),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).default([]),
        maxSessions: Joi.number().integer().min(0).max(5).required(),
        notes: Joi.string().optional()
      }).required(),
      friday: Joi.object({
        isAvailable: Joi.boolean().required(),
        timeSlots: Joi.array().items(Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          preference: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          equipmentProfileId: Joi.string().optional()
        })).default([]),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).default([]),
        maxSessions: Joi.number().integer().min(0).max(5).required(),
        notes: Joi.string().optional()
      }).required(),
      saturday: Joi.object({
        isAvailable: Joi.boolean().required(),
        timeSlots: Joi.array().items(Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          preference: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          equipmentProfileId: Joi.string().optional()
        })).default([]),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).default([]),
        maxSessions: Joi.number().integer().min(0).max(5).required(),
        notes: Joi.string().optional()
      }).required(),
      sunday: Joi.object({
        isAvailable: Joi.boolean().required(),
        timeSlots: Joi.array().items(Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          preference: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          equipmentProfileId: Joi.string().optional()
        })).default([]),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).default([]),
        maxSessions: Joi.number().integer().min(0).max(5).required(),
        notes: Joi.string().optional()
      }).required()
    }).required(),
    timeZone: Joi.string().required(),
    flexibilityLevel: Joi.string().valid('LOW', 'MODERATE', 'HIGH').required(),
    advanceNotice: Joi.number().integer().min(0).max(30).required(),
    blackoutDates: Joi.array().items(Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      reason: Joi.string().optional()
    })).default([]),
    seasonalAdjustments: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      startDate: Joi.string().pattern(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).required(),
      endDate: Joi.string().pattern(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).required(),
      adjustments: Joi.object({
        frequencyMultiplier: Joi.number().min(0.1).max(3.0).required(),
        intensityMultiplier: Joi.number().min(0.1).max(3.0).required(),
        preferredTimes: Joi.array().items(Joi.string().valid('EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING')).optional(),
        equipmentRestrictions: Joi.array().items(Joi.string()).optional()
      }).required()
    })).default([])
  }),

  equipmentPreferences: Joi.object({
    defaultEquipmentProfile: Joi.string().required(),
    equipmentPriorities: Joi.array().items(Joi.object({
      equipmentType: Joi.string().required(),
      priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
      reason: Joi.string().optional(),
      alternatives: Joi.array().items(Joi.string()).optional()
    })).default([]),
    maintenanceReminders: Joi.array().items(Joi.object({
      equipmentId: Joi.string().required(),
      reminderType: Joi.string().valid('INSPECTION', 'CLEANING', 'CALIBRATION', 'REPLACEMENT').required(),
      frequency: Joi.number().integer().min(1).max(365).required(),
      lastPerformed: Joi.date().optional(),
      nextDue: Joi.date().required(),
      notes: Joi.string().optional()
    })).default([]),
    safetyPreferences: Joi.object({
      requireSpotter: Joi.boolean().required(),
      maxWeightWithoutSpotter: Joi.number().min(0).required(),
      safetyEquipmentRequired: Joi.array().items(Joi.string()).default([]),
      emergencyProcedures: Joi.array().items(Joi.object({
        scenario: Joi.string().required(),
        steps: Joi.array().items(Joi.string()).required(),
        emergencyContacts: Joi.array().items(Joi.string()).required(),
        equipmentRequired: Joi.array().items(Joi.string()).optional()
      })).default([]),
      riskTolerance: Joi.string().valid('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE').required()
    }).required(),
    upgradeWishlist: Joi.array().items(Joi.object({
      equipmentType: Joi.string().required(),
      brand: Joi.string().optional(),
      model: Joi.string().optional(),
      priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
      estimatedCost: Joi.number().min(0).optional(),
      targetAcquisitionDate: Joi.date().optional(),
      reason: Joi.string().required()
    })).default([])
  }),

  physicalLimitations: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    type: Joi.string().valid('TEMPORARY', 'PERMANENT', 'CHRONIC').required(),
    category: Joi.string().valid('MOBILITY', 'STRENGTH', 'ENDURANCE', 'COORDINATION', 'BALANCE', 'SENSORY').required(),
    description: Joi.string().required(),
    affectedBodyParts: Joi.array().items(Joi.string()).required(),
    severity: Joi.string().valid('MILD', 'MODERATE', 'SEVERE', 'CRITICAL').required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().optional(),
    exerciseRestrictions: Joi.array().items(Joi.object({
      exerciseType: Joi.string().required(),
      restrictionType: Joi.string().valid('COMPLETE_RESTRICTION', 'PARTIAL_RESTRICTION', 'MODIFICATION_REQUIRED', 'SUPERVISION_REQUIRED').required(),
      specificExercises: Joi.array().items(Joi.string()).optional(),
      alternatives: Joi.array().items(Joi.string()).required(),
      modifications: Joi.array().items(Joi.object({
        exerciseId: Joi.string().required(),
        modificationType: Joi.string().valid('RANGE_OF_MOTION', 'LOAD_REDUCTION', 'SPEED_MODIFICATION', 'EQUIPMENT_SUBSTITUTION', 'POSITION_CHANGE', 'ASSISTANCE_REQUIRED').required(),
        description: Joi.string().required(),
        alternatives: Joi.array().items(Joi.string()).optional()
      })).required(),
      reason: Joi.string().required()
    })).required(),
    accommodationRequirements: Joi.array().items(Joi.object({
      type: Joi.string().valid('EQUIPMENT', 'ENVIRONMENT', 'ASSISTANCE', 'COMMUNICATION', 'TIME', 'INSTRUCTION').required(),
      description: Joi.string().required(),
      equipment: Joi.array().items(Joi.string()).optional(),
      modifications: Joi.array().items(Joi.string()).optional()
    })).required(),
    progressTracking: Joi.array().items(Joi.object({
      date: Joi.date().required(),
      severity: Joi.string().valid('MILD', 'MODERATE', 'SEVERE', 'CRITICAL').required(),
      functionalCapacity: Joi.number().min(0).max(100).required(),
      painLevel: Joi.number().min(0).max(10).optional(),
      notes: Joi.string().optional(),
      assessedBy: Joi.string().optional()
    })).default([]),
    lastUpdated: Joi.date().required()
  })).default([]),

  menstrualCycleTracking: Joi.object({
    enabled: Joi.boolean().required(),
    trackingStartDate: Joi.date().required(),
    averageCycleLength: Joi.number().integer().min(21).max(35).required(),
    averagePeriodLength: Joi.number().integer().min(3).max(8).required(),
    lastPeriodStart: Joi.date().optional(),
    symptoms: Joi.array().items(Joi.object({
      symptom: Joi.string().valid('CRAMPS', 'BLOATING', 'MOOD_CHANGES', 'FATIGUE', 'HEADACHE', 'BREAST_TENDERNESS', 'FOOD_CRAVINGS', 'ACNE', 'SLEEP_DISTURBANCE', 'JOINT_PAIN').required(),
      severity: Joi.string().valid('MILD', 'MODERATE', 'SEVERE', 'CRITICAL').required(),
      cycleDay: Joi.number().integer().min(1).max(35).required(),
      notes: Joi.string().optional(),
      impactOnTraining: Joi.string().valid('NONE', 'MILD', 'MODERATE', 'SEVERE').required()
    })).default([]),
    trainingAdjustments: Joi.array().items(Joi.object({
      cyclePhase: Joi.string().valid('MENSTRUAL', 'FOLLICULAR', 'OVULATORY', 'LUTEAL').required(),
      adjustments: Joi.object({
        intensityModifier: Joi.number().min(0.5).max(1.5).required(),
        volumeModifier: Joi.number().min(0.5).max(1.5).required(),
        frequencyModifier: Joi.number().min(0.5).max(1.5).required(),
        exerciseRestrictions: Joi.array().items(Joi.string()).default([]),
        recommendedExercises: Joi.array().items(Joi.string()).default([]),
        restPeriodModifier: Joi.number().min(0.5).max(2.0).required()
      }).required(),
      enabled: Joi.boolean().required()
    })).default([]),
    privacySettings: Joi.object({
      shareWithCoach: Joi.boolean().required(),
      shareAggregatedData: Joi.boolean().required(),
      shareSymptoms: Joi.boolean().required(),
      shareTrainingImpact: Joi.boolean().required(),
      anonymizeData: Joi.boolean().required()
    }).required(),
    notifications: Joi.object({
      periodReminders: Joi.boolean().required(),
      ovulationReminders: Joi.boolean().required(),
      trainingAdjustmentNotifications: Joi.boolean().required(),
      symptomTrackingReminders: Joi.boolean().required(),
      reminderDaysBefore: Joi.number().integer().min(0).max(7).required()
    }).required()
  }).optional()
};

// Zod Schemas (alternative validation library)
export const ZodSchemas = {
  email: z.string().email('Email must be a valid email address'),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must not exceed 30 characters')
    .regex(USERNAME_REGEX, 'Username must contain only letters, numbers, underscores, and hyphens'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(PASSWORD_REGEX, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  phone: z.string().regex(PHONE_REGEX, 'Phone number must be in valid international format').optional(),

  uuid: z.string().uuid('Must be a valid UUID'),

  createUser: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30).regex(USERNAME_REGEX),
    password: z.string().min(8).regex(PASSWORD_REGEX),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().regex(PHONE_REGEX).optional(),
    dateOfBirth: z.date().max(new Date()).optional(),
    tenantId: z.string().uuid()
  }),

  updateUser: z.object({
    email: z.string().email().optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().regex(PHONE_REGEX).optional(),
    dateOfBirth: z.date().max(new Date()).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  }),

  login: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    tenantId: z.string().uuid().optional()
  }),

  createTenant: z.object({
    name: z.string().min(1).max(200),
    domain: z.string().optional(),
    settings: z.record(z.any()).optional(),
    maxUsers: z.number().int().min(1).optional(),
    subscriptionTier: z.enum(['basic', 'premium', 'enterprise']).optional()
  }),

  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  }),

  // Advanced User Preferences Zod Schemas
  trainingAvailability: z.object({
    weeklySchedule: z.object({
      monday: z.object({
        isAvailable: z.boolean(),
        timeSlots: z.array(z.object({
          startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          preference: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          equipmentProfileId: z.string().optional()
        })).default([]),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).default([]),
        maxSessions: z.number().int().min(0).max(5),
        notes: z.string().optional()
      }),
      tuesday: z.object({
        isAvailable: z.boolean(),
        timeSlots: z.array(z.object({
          startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          preference: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          equipmentProfileId: z.string().optional()
        })).default([]),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).default([]),
        maxSessions: z.number().int().min(0).max(5),
        notes: z.string().optional()
      }),
      wednesday: z.object({
        isAvailable: z.boolean(),
        timeSlots: z.array(z.object({
          startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          preference: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          equipmentProfileId: z.string().optional()
        })).default([]),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).default([]),
        maxSessions: z.number().int().min(0).max(5),
        notes: z.string().optional()
      }),
      thursday: z.object({
        isAvailable: z.boolean(),
        timeSlots: z.array(z.object({
          startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          preference: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          equipmentProfileId: z.string().optional()
        })).default([]),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).default([]),
        maxSessions: z.number().int().min(0).max(5),
        notes: z.string().optional()
      }),
      friday: z.object({
        isAvailable: z.boolean(),
        timeSlots: z.array(z.object({
          startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          preference: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          equipmentProfileId: z.string().optional()
        })).default([]),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).default([]),
        maxSessions: z.number().int().min(0).max(5),
        notes: z.string().optional()
      }),
      saturday: z.object({
        isAvailable: z.boolean(),
        timeSlots: z.array(z.object({
          startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          preference: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          equipmentProfileId: z.string().optional()
        })).default([]),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).default([]),
        maxSessions: z.number().int().min(0).max(5),
        notes: z.string().optional()
      }),
      sunday: z.object({
        isAvailable: z.boolean(),
        timeSlots: z.array(z.object({
          startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          preference: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          equipmentProfileId: z.string().optional()
        })).default([]),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).default([]),
        maxSessions: z.number().int().min(0).max(5),
        notes: z.string().optional()
      })
    }),
    timeZone: z.string(),
    flexibilityLevel: z.enum(['LOW', 'MODERATE', 'HIGH']),
    advanceNotice: z.number().int().min(0).max(30),
    blackoutDates: z.array(z.object({
      startDate: z.date(),
      endDate: z.date(),
      reason: z.string().optional()
    })).default([]),
    seasonalAdjustments: z.array(z.object({
      name: z.string(),
      startDate: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/),
      endDate: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/),
      adjustments: z.object({
        frequencyMultiplier: z.number().min(0.1).max(3.0),
        intensityMultiplier: z.number().min(0.1).max(3.0),
        preferredTimes: z.array(z.enum(['EARLY_MORNING', 'MORNING', 'LATE_MORNING', 'EARLY_AFTERNOON', 'AFTERNOON', 'LATE_AFTERNOON', 'EARLY_EVENING', 'EVENING', 'LATE_EVENING'])).optional(),
        equipmentRestrictions: z.array(z.string()).optional()
      })
    })).default([])
  }),

  equipmentPreferences: z.object({
    defaultEquipmentProfile: z.string(),
    equipmentPriorities: z.array(z.object({
      equipmentType: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      reason: z.string().optional(),
      alternatives: z.array(z.string()).optional()
    })).default([]),
    maintenanceReminders: z.array(z.object({
      equipmentId: z.string(),
      reminderType: z.enum(['INSPECTION', 'CLEANING', 'CALIBRATION', 'REPLACEMENT']),
      frequency: z.number().int().min(1).max(365),
      lastPerformed: z.date().optional(),
      nextDue: z.date(),
      notes: z.string().optional()
    })).default([]),
    safetyPreferences: z.object({
      requireSpotter: z.boolean(),
      maxWeightWithoutSpotter: z.number().min(0),
      safetyEquipmentRequired: z.array(z.string()).default([]),
      emergencyProcedures: z.array(z.object({
        scenario: z.string(),
        steps: z.array(z.string()),
        emergencyContacts: z.array(z.string()),
        equipmentRequired: z.array(z.string()).optional()
      })).default([]),
      riskTolerance: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'])
    }),
    upgradeWishlist: z.array(z.object({
      equipmentType: z.string(),
      brand: z.string().optional(),
      model: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      estimatedCost: z.number().min(0).optional(),
      targetAcquisitionDate: z.date().optional(),
      reason: z.string()
    })).default([])
  }),

  menstrualCycleTracking: z.object({
    enabled: z.boolean(),
    trackingStartDate: z.date(),
    averageCycleLength: z.number().int().min(21).max(35),
    averagePeriodLength: z.number().int().min(3).max(8),
    lastPeriodStart: z.date().optional(),
    symptoms: z.array(z.object({
      symptom: z.enum(['CRAMPS', 'BLOATING', 'MOOD_CHANGES', 'FATIGUE', 'HEADACHE', 'BREAST_TENDERNESS', 'FOOD_CRAVINGS', 'ACNE', 'SLEEP_DISTURBANCE', 'JOINT_PAIN']),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']),
      cycleDay: z.number().int().min(1).max(35),
      notes: z.string().optional(),
      impactOnTraining: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE'])
    })).default([]),
    trainingAdjustments: z.array(z.object({
      cyclePhase: z.enum(['MENSTRUAL', 'FOLLICULAR', 'OVULATORY', 'LUTEAL']),
      adjustments: z.object({
        intensityModifier: z.number().min(0.5).max(1.5),
        volumeModifier: z.number().min(0.5).max(1.5),
        frequencyModifier: z.number().min(0.5).max(1.5),
        exerciseRestrictions: z.array(z.string()).default([]),
        recommendedExercises: z.array(z.string()).default([]),
        restPeriodModifier: z.number().min(0.5).max(2.0)
      }),
      enabled: z.boolean()
    })).default([]),
    privacySettings: z.object({
      shareWithCoach: z.boolean(),
      shareAggregatedData: z.boolean(),
      shareSymptoms: z.boolean(),
      shareTrainingImpact: z.boolean(),
      anonymizeData: z.boolean()
    }),
    notifications: z.object({
      periodReminders: z.boolean(),
      ovulationReminders: z.boolean(),
      trainingAdjustmentNotifications: z.boolean(),
      symptomTrackingReminders: z.boolean(),
      reminderDaysBefore: z.number().int().min(0).max(7)
    })
  }).optional()
};

// Schema validation result types
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Custom validation functions for complex business rules
export const CustomValidators = {
  // Validate that email is unique within tenant (requires database check)
  isEmailUniqueInTenant: (email: string, tenantId: string, excludeUserId?: string) => {
    // This would be implemented by the consuming service with database access
    return { requiresAsyncValidation: true, email, tenantId, excludeUserId };
  },

  // Validate that username is unique globally
  isUsernameUnique: (username: string, excludeUserId?: string) => {
    return { requiresAsyncValidation: true, username, excludeUserId };
  },

  // Validate tenant domain is unique
  isTenantDomainUnique: (domain: string, excludeTenantId?: string) => {
    return { requiresAsyncValidation: true, domain, excludeTenantId };
  },

  // Validate user has permission for action
  hasPermission: (userId: string, permission: string, resourceId?: string) => {
    return { requiresAsyncValidation: true, userId, permission, resourceId };
  },

  // Validate tenant is active and user belongs to it
  validateTenantAccess: (userId: string, tenantId: string) => {
    return { requiresAsyncValidation: true, userId, tenantId };
  }
};