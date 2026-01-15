import { z } from 'zod';
import {
  Discipline,
  ExperienceLevel,
  Gender,
  WeightUnit,
  BlockType,
  // ProgramStatus,
  SessionType,
  // ProgramInjurySeverity,
  // ProgramInjuryStatus,
  RestrictionType,
  FatigueLevel,
  WearableSource,
  AdaptationType,
  AdaptationUrgency,
  CompetitionType,
  AttemptType,
  BodyPart,
  MovementPattern,
  ExerciseType
} from '@strengthos/shared-types';

// Common validation patterns for program generation
export const PROGRAM_NAME_REGEX = /^[a-zA-Z0-9\s\-_()]{3,100}$/;
export const RPE_MIN = 1;
export const RPE_MAX = 10;
export const INTENSITY_MIN = 0;
export const INTENSITY_MAX = 200; // Allow for overload work above 100%
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 2000; // kg or lbs
export const REPS_MIN = 1;
export const REPS_MAX = 100;
export const SETS_MIN = 1;
export const SETS_MAX = 20;
export const DURATION_MIN = 1; // minutes
export const DURATION_MAX = 480; // 8 hours max session

// Utility validation schemas
export const RepRangeSchema = z.object({
  min: z.number().int().min(REPS_MIN).max(REPS_MAX),
  max: z.number().int().min(REPS_MIN).max(REPS_MAX)
}).refine(data => data.min <= data.max, {
  message: 'Minimum reps must be less than or equal to maximum reps'
});

export const IntensityRangeSchema = z.object({
  min: z.number().min(INTENSITY_MIN).max(INTENSITY_MAX),
  max: z.number().min(INTENSITY_MIN).max(INTENSITY_MAX)
}).refine(data => data.min <= data.max, {
  message: 'Minimum intensity must be less than or equal to maximum intensity'
});

export const RPERangeSchema = z.object({
  min: z.number().min(RPE_MIN).max(RPE_MAX),
  max: z.number().min(RPE_MIN).max(RPE_MAX)
}).refine(data => data.min <= data.max, {
  message: 'Minimum RPE must be less than or equal to maximum RPE'
});

export const TimeConstraintSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  maxDuration: z.number().int().min(DURATION_MIN).max(DURATION_MAX).optional()
}).refine(data => {
  const start = new Date(`1970-01-01T${data.startTime}:00`);
  const end = new Date(`1970-01-01T${data.endTime}:00`);
  return start < end;
}, {
  message: 'Start time must be before end time'
});

// Core entity validation schemas
export const AthleteProfileSchema = z.object({
  discipline: z.nativeEnum(Discipline),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  gender: z.nativeEnum(Gender),
  birthDate: z.date().max(new Date(), 'Birth date cannot be in the future'),
  bodyWeight: z.number().min(30).max(300), // Reasonable weight range in kg
  availableEquipment: z.array(z.string().uuid()).min(1, 'At least one equipment item must be available'),
  trainingFrequency: z.number().int().min(1).max(7),
  goals: z.array(z.string()).min(1, 'At least one training goal must be specified'),
  disabilityAccommodations: z.array(z.string()).optional()
});

export const AthletePreferencesSchema = z.object({
  weightUnit: z.nativeEnum(WeightUnit),
  language: z.string().min(2).max(5).regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Language must be in ISO format (e.g., en, en-US)'),
  timezone: z.string().min(1).max(50),
  notificationPreferences: z.object({
    programChanges: z.boolean(),
    healthAlerts: z.boolean(),
    competitionReminders: z.boolean(),
    coachMessages: z.boolean()
  }),
  autoAdjustmentConsent: z.boolean(),
  dataRetentionConsent: z.boolean()
});

export const AthleteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  profile: AthleteProfileSchema,
  preferences: AthletePreferencesSchema,
  currentProgram: z.string().uuid().optional(),
  coachId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Health metrics validation
export const HealthMetricsSchema = z.object({
  date: z.date().max(new Date(), 'Health metrics date cannot be in the future'),
  hrv: z.number().min(1).max(200).optional(), // Heart Rate Variability in ms
  sleepDuration: z.number().min(0).max(24).optional(), // Hours
  sleepQuality: z.number().min(1).max(10).optional(), // Subjective scale
  restingHeartRate: z.number().min(30).max(200).optional(), // BPM
  stepCount: z.number().int().min(0).max(100000).optional(),
  stressScore: z.number().min(0).max(100).optional(), // Percentage
  manualEntries: z.array(z.object({
    metric: z.string().min(1).max(50),
    value: z.number(),
    unit: z.string().min(1).max(20),
    notes: z.string().max(500).optional()
  })).optional()
});

export const FatigueStatusSchema = z.object({
  level: z.nativeEnum(FatigueLevel),
  score: z.number().min(0).max(100),
  indicators: z.array(z.object({
    type: z.string().min(1).max(50),
    value: z.number(),
    threshold: z.number(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH'])
  })),
  recommendations: z.array(z.string().max(200))
});

// Exercise and program validation
export const ExerciseSetSchema = z.object({
  setNumber: z.number().int().min(1).max(SETS_MAX),
  reps: z.union([
    z.number().int().min(REPS_MIN).max(REPS_MAX),
    RepRangeSchema
  ]),
  intensity: z.union([
    z.number().min(INTENSITY_MIN).max(INTENSITY_MAX),
    IntensityRangeSchema
  ]),
  rpe: z.union([
    z.number().min(RPE_MIN).max(RPE_MAX),
    RPERangeSchema
  ]).optional(),
  weight: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX).optional(),
  isWarmup: z.boolean(),
  isBackoff: z.boolean()
});

export const ProgrammedExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sets: z.array(ExerciseSetSchema).min(1, 'At least one set must be programmed'),
  restPeriods: z.array(z.number().int().min(30).max(600)), // 30 seconds to 10 minutes
  notes: z.string().max(1000).optional(),
  alternatives: z.array(z.string().uuid()).optional(),
  progressionRules: z.object({
    loadProgression: z.object({
      type: z.enum(['LINEAR', 'PERCENTAGE', 'RPE_BASED', 'PERFORMANCE_BASED']),
      increment: z.number().min(0.25).max(50), // kg or percentage
      frequency: z.enum(['SESSION', 'WEEK', 'BLOCK']),
      conditions: z.array(z.string()).optional()
    }),
    volumeProgression: z.object({
      type: z.enum(['SETS', 'REPS', 'TOTAL_VOLUME']),
      increment: z.number().min(1).max(10),
      maxIncrease: z.number().min(1).max(50).optional()
    }).optional(),
    substitutionRules: z.object({
      triggers: z.array(z.enum(['INJURY', 'EQUIPMENT', 'FATIGUE', 'PLATEAU'])),
      alternatives: z.array(z.string().uuid()),
      conditions: z.array(z.string()).optional()
    }).optional()
  })
});

export const TrainingSessionSchema = z.object({
  id: z.string().uuid(),
  blockId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  exercises: z.array(ProgrammedExerciseSchema).min(1, 'At least one exercise must be programmed'),
  estimatedDuration: z.number().int().min(DURATION_MIN).max(DURATION_MAX),
  sessionType: z.nativeEnum(SessionType),
  stressTargets: z.object({
    central: z.number().min(0).max(100),
    peripheral: z.number().min(0).max(100),
    total: z.number().min(0).max(100),
    fatigueIndex: z.number().min(0).max(10)
  })
});

export const TrainingBlockSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(BlockType),
  duration: z.number().int().min(1).max(52), // 1-52 weeks
  sessions: z.array(TrainingSessionSchema).min(1, 'At least one session must be programmed'),
  objectives: z.array(z.string().max(200)).min(1, 'At least one objective must be specified'),
  progressionRules: z.object({
    volumeProgression: z.object({
      startingVolume: z.number().min(0).max(100),
      peakVolume: z.number().min(0).max(100),
      progressionPattern: z.enum(['LINEAR', 'UNDULATING', 'BLOCK', 'CONJUGATE'])
    }),
    intensityProgression: z.object({
      startingIntensity: z.number().min(40).max(100),
      peakIntensity: z.number().min(40).max(100),
      progressionPattern: z.enum(['LINEAR', 'UNDULATING', 'STEP', 'WAVE'])
    }),
    frequencyProgression: z.object({
      sessionsPerWeek: z.number().int().min(1).max(7),
      adjustmentTriggers: z.array(z.string()).optional()
    }),
    deloadProtocol: z.object({
      trigger: z.enum(['SCHEDULED', 'RPE_BASED', 'PERFORMANCE_BASED', 'HEALTH_BASED']),
      frequency: z.number().int().min(2).max(8), // Every 2-8 weeks
      volumeReduction: z.number().min(20).max(70), // Percentage reduction
      intensityMaintenance: z.boolean()
    })
  })
});

export const ProgramSchema = z.object({
  id: z.string().uuid(),
  athleteId: z.string().uuid(),
  templateId: z.string().uuid(),
  name: z.string().regex(PROGRAM_NAME_REGEX, 'Program name must be 3-100 characters with letters, numbers, spaces, and basic punctuation'),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.string(),
  blocks: z.array(TrainingBlockSchema).min(1, 'At least one training block must be defined'),
  adaptations: z.array(z.object({
    id: z.string().uuid(),
    type: z.nativeEnum(AdaptationType),
    timestamp: z.date(),
    changes: z.array(z.object({
      field: z.string().min(1).max(100),
      oldValue: z.any(),
      newValue: z.any(),
      reason: z.string().max(500)
    })),
    metadata: z.object({
      triggeredBy: z.enum(['SYSTEM', 'COACH', 'ATHLETE']),
      urgency: z.nativeEnum(AdaptationUrgency),
      requiresApproval: z.boolean(),
      approvedBy: z.string().uuid().optional(),
      approvedAt: z.date().optional()
    })
  })),
  metadata: z.object({
    createdBy: z.string().uuid(),
    lastModifiedBy: z.string().uuid(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semantic versioning format (x.y.z)'),
    tags: z.array(z.string().max(50)).optional(),
    notes: z.string().max(2000).optional()
  }),
  createdAt: z.date(),
  updatedAt: z.date()
}).refine((data) => {
  // Ensure startDate and endDate are Date objects before comparison
  if (data.endDate && data.startDate instanceof Date && data.endDate instanceof Date) {
    if (data.startDate >= data.endDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'End date must be after start date'
});

// Injury management validation
export const InjurySchema = z.object({
  id: z.string().uuid(),
  athleteId: z.string().uuid(),
  name: z.string().min(1).max(100),
  bodyPart: z.nativeEnum(BodyPart),
  severity: z.string(),
  status: z.string(),
  restrictions: z.array(z.object({
    exerciseId: z.string().uuid().optional(),
    movementPattern: z.nativeEnum(MovementPattern).optional(),
    restriction: z.nativeEnum(RestrictionType),
    parameters: z.object({
      maxLoad: z.number().min(0).max(100).optional(), // Percentage of normal
      maxROM: z.number().min(0).max(100).optional(), // Percentage of full range
      excludedPositions: z.array(z.string()).optional(),
      modificationNotes: z.string().max(500).optional()
    }).optional()
  })).min(1, 'At least one restriction must be specified for active injuries'),
  declaredAt: z.date(),
  resolvedAt: z.date().optional(),
  notes: z.string().max(1000).optional()
}).refine((data: any) => {
  if (data.resolvedAt && data.declaredAt >= data.resolvedAt) {
    return false;
  }
  return true;
}, {
  message: 'Resolution date must be after declaration date'
});

// Program generation request validation
export const ProgramConstraintsSchema = z.object({
  availableEquipment: z.array(z.string().uuid()).min(1, 'At least one equipment item must be available'),
  injuryRestrictions: z.array(z.string().uuid()).optional(),
  timeConstraints: z.array(TimeConstraintSchema).min(1, 'At least one time constraint must be specified'),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  genderSpecificModifications: z.boolean(),
  disabilityAccommodations: z.array(z.string()).optional()
});

export const ProgramGenerationRequestSchema = z.object({
  athleteId: z.string().uuid(),
  templateId: z.string().uuid(),
  startDate: z.date().min(new Date(), 'Start date cannot be in the past'),
  endDate: z.date().optional(),
  competitionDate: z.date().optional(),
  customizations: z.object({
    exerciseSubstitutions: z.record(z.string().uuid(), z.string().uuid()).optional(),
    intensityModifications: z.record(z.string().uuid(), z.number().min(-50).max(50)).optional(), // Percentage adjustment
    volumeModifications: z.record(z.string().uuid(), z.number().min(-50).max(50)).optional(), // Percentage adjustment
    frequencyAdjustments: z.object({
      sessionsPerWeek: z.number().int().min(1).max(7).optional(),
      sessionDuration: z.number().int().min(30).max(240).optional() // Minutes
    }).optional(),
    specialRequests: z.string().max(1000).optional()
  }).optional(),
  constraints: ProgramConstraintsSchema
}).refine((data: any) => {
  if (data.endDate && data.startDate >= data.endDate) {
    return false;
  }
  if (data.competitionDate && data.startDate >= data.competitionDate) {
    return false;
  }
  return true;
}, {
  message: 'End date and competition date must be after start date'
});

// Performance data validation
export const CompletedSetSchema = z.object({
  setNumber: z.number().int().min(1).max(SETS_MAX),
  reps: z.number().int().min(0).max(REPS_MAX), // Allow 0 for failed attempts
  weight: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
  rpe: z.number().min(RPE_MIN).max(RPE_MAX),
  completed: z.boolean(),
  notes: z.string().max(500).optional()
});

export const PerformanceDataSchema = z.object({
  id: z.string().uuid(),
  athleteId: z.string().uuid(),
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sets: z.array(CompletedSetSchema).min(1, 'At least one set must be recorded'),
  sessionRPE: z.number().min(RPE_MIN).max(RPE_MAX),
  duration: z.number().int().min(1).max(DURATION_MAX), // Minutes
  notes: z.string().max(2000).optional(),
  videoUploads: z.array(z.string().url()).optional(),
  completedAt: z.date().max(new Date(), 'Completion date cannot be in the future')
});

// Competition planning validation
export const CompetitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.nativeEnum(CompetitionType),
  date: z.date().min(new Date(), 'Competition date cannot be in the past'),
  location: z.string().min(1).max(200),
  discipline: z.nativeEnum(Discipline),
  weightClasses: z.array(z.object({
    category: z.string().min(1).max(50),
    minWeight: z.number().min(30).max(300),
    maxWeight: z.number().min(30).max(300)
  })).optional(),
  registrationDeadline: z.date().optional(),
  notes: z.string().max(1000).optional()
}).refine((data: any) => {
  if (data.registrationDeadline && data.registrationDeadline >= data.date) {
    return false;
  }
  return true;
}, {
  message: 'Registration deadline must be before competition date'
});

export const AttemptRecommendationSchema = z.object({
  type: z.nativeEnum(AttemptType),
  weight: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
  confidence: z.number().min(0).max(100), // Percentage
  reasoning: z.string().max(500),
  basedOn: z.array(z.object({
    dataType: z.enum(['RECENT_PERFORMANCE', 'HISTORICAL_DATA', 'TRAINING_LOAD', 'FATIGUE_STATUS']),
    value: z.any(),
    weight: z.number().min(0).max(1) // Influence weight in calculation
  }))
});

// Template validation schemas
export const ProgramTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  discipline: z.nativeEnum(Discipline),
  createdBy: z.string().uuid(),
  approvedBy: z.string().uuid().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semantic versioning format'),
  blocks: z.array(z.object({
    name: z.string().min(1).max(100),
    type: z.nativeEnum(BlockType),
    duration: z.number().int().min(1).max(52),
    sessions: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      exercises: z.array(z.object({
        exerciseId: z.string().uuid(),
        sets: z.array(z.object({
          reps: z.union([z.number().int(), RepRangeSchema]),
          intensity: z.union([z.number(), IntensityRangeSchema]),
          rpe: z.union([z.number(), RPERangeSchema]).optional()
        })),
        restPeriods: z.array(z.number().int().min(30).max(600))
      }))
    }))
  })).min(1, 'At least one block must be defined'),
  exerciseSelection: z.object({
    movementRequirements: z.array(z.object({
      pattern: z.nativeEnum(MovementPattern),
      frequency: z.number().int().min(1).max(7), // Times per week
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW'])
    })),
    volumeDistribution: z.object({
      primaryMovements: z.number().min(40).max(80), // Percentage
      accessoryWork: z.number().min(20).max(60), // Percentage
      conditioning: z.number().min(0).max(30).optional() // Percentage
    }),
    equipmentConstraints: z.array(z.object({
      required: z.array(z.string().uuid()),
      preferred: z.array(z.string().uuid()).optional(),
      alternatives: z.record(z.string().uuid(), z.array(z.string().uuid())).optional()
    }))
  }),
  progressionRules: z.object({
    volumeProgression: z.object({
      startingVolume: z.number().min(0).max(100),
      peakVolume: z.number().min(0).max(100),
      progressionPattern: z.enum(['LINEAR', 'UNDULATING', 'BLOCK', 'CONJUGATE'])
    }),
    intensityProgression: z.object({
      startingIntensity: z.number().min(40).max(100),
      peakIntensity: z.number().min(40).max(100),
      progressionPattern: z.enum(['LINEAR', 'UNDULATING', 'STEP', 'WAVE'])
    }),
    deloadProtocol: z.object({
      frequency: z.number().int().min(2).max(8),
      volumeReduction: z.number().min(20).max(70),
      intensityMaintenance: z.boolean()
    })
  }),
  metadata: z.object({
    description: z.string().max(1000),
    targetExperience: z.array(z.nativeEnum(ExperienceLevel)),
    estimatedDuration: z.number().int().min(4).max(52), // Weeks
    tags: z.array(z.string().max(50)),
    isPublic: z.boolean(),
    requiresApproval: z.boolean()
  })
});

// Validation utility functions
export const ProgramGenerationValidators = {
  validateRPERange: (rpe: number | { min: number; max: number }) => {
    if (typeof rpe === 'number') {
      return rpe >= RPE_MIN && rpe <= RPE_MAX;
    }
    return rpe.min >= RPE_MIN && rpe.max <= RPE_MAX && rpe.min <= rpe.max;
  },

  validateIntensityRange: (intensity: number | { min: number; max: number }) => {
    if (typeof intensity === 'number') {
      return intensity >= INTENSITY_MIN && intensity <= INTENSITY_MAX;
    }
    return intensity.min >= INTENSITY_MIN && intensity.max <= INTENSITY_MAX && intensity.min <= intensity.max;
  },

  validateSessionDuration: (exercises: any[], restPeriods: number[][]) => {
    // Estimate session duration based on exercises and rest periods
    const estimatedDuration = exercises.reduce((total, exercise, index) => {
      const exerciseTime = exercise.sets.length * 2; // 2 minutes per set average
      const restTime = restPeriods[index]?.reduce((sum, rest) => sum + rest, 0) / 60 || 0; // Convert to minutes
      return total + exerciseTime + restTime;
    }, 0);
    
    return estimatedDuration >= DURATION_MIN && estimatedDuration <= DURATION_MAX;
  },

  validateEquipmentAvailability: (requiredEquipment: string[], availableEquipment: string[]) => {
    return requiredEquipment.every(equipment => availableEquipment.includes(equipment));
  },

  validateInjuryRestrictions: (exerciseId: string, injuryRestrictions: any[]) => {
    return !injuryRestrictions.some(restriction => 
      restriction.exerciseId === exerciseId && 
      restriction.restriction === 'EXCLUDE'
    );
  },

  validateProgressionLogic: (startValue: number, endValue: number, duration: number, pattern: string) => {
    if (pattern === 'LINEAR') {
      const increment = (endValue - startValue) / duration;
      return increment > 0 && increment <= (endValue - startValue) * 0.2; // Max 20% increase per week
    }
    return true; // Other patterns have more complex validation
  }
};

// Export all schemas for easy access
export const ProgramGenerationSchemas = {
  // Utility schemas
  RepRange: RepRangeSchema,
  IntensityRange: IntensityRangeSchema,
  RPERange: RPERangeSchema,
  TimeConstraint: TimeConstraintSchema,
  
  // Core entity schemas
  AthleteProfile: AthleteProfileSchema,
  AthletePreferences: AthletePreferencesSchema,
  Athlete: AthleteSchema,
  
  // Health and performance schemas
  HealthMetrics: HealthMetricsSchema,
  FatigueStatus: FatigueStatusSchema,
  PerformanceData: PerformanceDataSchema,
  CompletedSet: CompletedSetSchema,
  
  // Program structure schemas
  ExerciseSet: ExerciseSetSchema,
  ProgrammedExercise: ProgrammedExerciseSchema,
  TrainingSession: TrainingSessionSchema,
  TrainingBlock: TrainingBlockSchema,
  Program: ProgramSchema,
  
  // Injury management schemas
  Injury: InjurySchema,
  
  // Program generation schemas
  ProgramConstraints: ProgramConstraintsSchema,
  ProgramGenerationRequest: ProgramGenerationRequestSchema,
  
  // Competition schemas
  Competition: CompetitionSchema,
  AttemptRecommendation: AttemptRecommendationSchema,
  
  // Template schemas
  ProgramTemplate: ProgramTemplateSchema
};