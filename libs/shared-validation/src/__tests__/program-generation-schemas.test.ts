import { describe, it, expect } from 'vitest';
import {
  ProgramGenerationSchemas,
  ProgramGenerationValidators,
  PROGRAM_NAME_REGEX,
  RPE_MIN,
  RPE_MAX,
  INTENSITY_MIN,
  INTENSITY_MAX,
  WEIGHT_MIN,
  WEIGHT_MAX,
  REPS_MIN,
  REPS_MAX,
  SETS_MIN,
  SETS_MAX,
  DURATION_MIN,
  DURATION_MAX
} from '../program-generation-schemas';

// Import enums directly from source files to avoid module resolution issues
import {
  Discipline,
  ExperienceLevel,
  Gender,
  WeightUnit
} from '../../../shared-types/src/user-management-enums';
import {
  BlockType,
  ProgramStatus,
  SessionType,
  ProgramInjurySeverity,
  ProgramInjuryStatus,
  RestrictionType,
  FatigueLevel,
  AdaptationType,
  AdaptationUrgency,
  CompetitionType,
  AttemptType
} from '../../../shared-types/src/program-generation';
import {
  BodyPart,
  MovementPattern,
  ExerciseType
} from '../../../shared-types/src/enums';

describe('Program Generation Validation Schemas', () => {
  describe('Constants and Regex', () => {
    it('should validate program name regex', () => {
      expect(PROGRAM_NAME_REGEX.test('My Training Program')).toBe(true);
      expect(PROGRAM_NAME_REGEX.test('Program-2024_v1')).toBe(true);
      expect(PROGRAM_NAME_REGEX.test('Test (Advanced)')).toBe(true);
      expect(PROGRAM_NAME_REGEX.test('AB')).toBe(false); // Too short
      expect(PROGRAM_NAME_REGEX.test('A'.repeat(101))).toBe(false); // Too long
      expect(PROGRAM_NAME_REGEX.test('Program@#$')).toBe(false); // Invalid characters
    });

    it('should have valid range constants', () => {
      expect(RPE_MIN).toBe(1);
      expect(RPE_MAX).toBe(10);
      expect(INTENSITY_MIN).toBe(0);
      expect(INTENSITY_MAX).toBe(200);
      expect(WEIGHT_MIN).toBe(0);
      expect(WEIGHT_MAX).toBe(2000);
      expect(REPS_MIN).toBe(1);
      expect(REPS_MAX).toBe(100);
      expect(SETS_MIN).toBe(1);
      expect(SETS_MAX).toBe(20);
      expect(DURATION_MIN).toBe(1);
      expect(DURATION_MAX).toBe(480);
    });
  });

  describe('RepRangeSchema', () => {
    it('should validate valid rep ranges', () => {
      const validRange = { min: 5, max: 8 };
      expect(() => ProgramGenerationSchemas.RepRange.parse(validRange)).not.toThrow();
    });

    it('should reject invalid rep ranges', () => {
      const invalidRange = { min: 10, max: 5 }; // min > max
      expect(() => ProgramGenerationSchemas.RepRange.parse(invalidRange)).toThrow();
    });

    it('should reject out-of-bounds rep ranges', () => {
      const outOfBounds = { min: 0, max: 5 }; // min below REPS_MIN
      expect(() => ProgramGenerationSchemas.RepRange.parse(outOfBounds)).toThrow();
    });
  });

  describe('IntensityRangeSchema', () => {
    it('should validate valid intensity ranges', () => {
      const validRange = { min: 70, max: 85 };
      expect(() => ProgramGenerationSchemas.IntensityRange.parse(validRange)).not.toThrow();
    });

    it('should allow overload intensities above 100%', () => {
      const overloadRange = { min: 100, max: 110 };
      expect(() => ProgramGenerationSchemas.IntensityRange.parse(overloadRange)).not.toThrow();
    });

    it('should reject invalid intensity ranges', () => {
      const invalidRange = { min: 90, max: 70 }; // min > max
      expect(() => ProgramGenerationSchemas.IntensityRange.parse(invalidRange)).toThrow();
    });
  });

  describe('RPERangeSchema', () => {
    it('should validate valid RPE ranges', () => {
      const validRange = { min: 7, max: 9 };
      expect(() => ProgramGenerationSchemas.RPERange.parse(validRange)).not.toThrow();
    });

    it('should reject RPE values outside 1-10 range', () => {
      const invalidRange = { min: 0, max: 5 }; // min below RPE_MIN
      expect(() => ProgramGenerationSchemas.RPERange.parse(invalidRange)).toThrow();
    });
  });

  describe('TimeConstraintSchema', () => {
    it('should validate valid time constraints', () => {
      const validConstraint = {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '11:00',
        maxDuration: 120
      };
      expect(() => ProgramGenerationSchemas.TimeConstraint.parse(validConstraint)).not.toThrow();
    });

    it('should reject invalid time format', () => {
      const invalidTime = {
        dayOfWeek: 1,
        startTime: '9:00', // Missing leading zero
        endTime: '11:00'
      };
      expect(() => ProgramGenerationSchemas.TimeConstraint.parse(invalidTime)).toThrow();
    });

    it('should reject start time after end time', () => {
      const invalidOrder = {
        dayOfWeek: 1,
        startTime: '11:00',
        endTime: '09:00'
      };
      expect(() => ProgramGenerationSchemas.TimeConstraint.parse(invalidOrder)).toThrow();
    });
  });

  describe('AthleteProfileSchema', () => {
    const validProfile = {
      discipline: Discipline.POWERLIFTING,
      experienceLevel: ExperienceLevel.INTERMEDIATE,
      gender: Gender.MALE,
      birthDate: new Date('1990-01-01'),
      bodyWeight: 80,
      availableEquipment: ['550e8400-e29b-41d4-a716-446655440000'],
      trainingFrequency: 4,
      goals: ['Increase strength', 'Compete in powerlifting'],
      disabilityAccommodations: []
    };

    it('should validate valid athlete profile', () => {
      expect(() => ProgramGenerationSchemas.AthleteProfile.parse(validProfile)).not.toThrow();
    });

    it('should reject future birth date', () => {
      const futureDate = {
        ...validProfile,
        birthDate: new Date('2030-01-01')
      };
      expect(() => ProgramGenerationSchemas.AthleteProfile.parse(futureDate)).toThrow();
    });

    it('should reject unrealistic body weight', () => {
      const invalidWeight = {
        ...validProfile,
        bodyWeight: 500 // Too heavy
      };
      expect(() => ProgramGenerationSchemas.AthleteProfile.parse(invalidWeight)).toThrow();
    });

    it('should require at least one equipment item', () => {
      const noEquipment = {
        ...validProfile,
        availableEquipment: []
      };
      expect(() => ProgramGenerationSchemas.AthleteProfile.parse(noEquipment)).toThrow();
    });
  });

  describe('HealthMetricsSchema', () => {
    const validMetrics = {
      date: new Date('2024-01-01'),
      hrv: 45,
      sleepDuration: 8,
      sleepQuality: 7,
      restingHeartRate: 60,
      stepCount: 10000,
      stressScore: 25,
      manualEntries: [
        {
          metric: 'Mood',
          value: 8,
          unit: 'scale',
          notes: 'Feeling good today'
        }
      ]
    };

    it('should validate valid health metrics', () => {
      expect(() => ProgramGenerationSchemas.HealthMetrics.parse(validMetrics)).not.toThrow();
    });

    it('should reject future dates', () => {
      const futureDate = {
        ...validMetrics,
        date: new Date('2030-01-01')
      };
      expect(() => ProgramGenerationSchemas.HealthMetrics.parse(futureDate)).toThrow();
    });

    it('should reject invalid HRV values', () => {
      const invalidHRV = {
        ...validMetrics,
        hrv: 300 // Too high
      };
      expect(() => ProgramGenerationSchemas.HealthMetrics.parse(invalidHRV)).toThrow();
    });

    it('should reject invalid sleep duration', () => {
      const invalidSleep = {
        ...validMetrics,
        sleepDuration: 25 // More than 24 hours
      };
      expect(() => ProgramGenerationSchemas.HealthMetrics.parse(invalidSleep)).toThrow();
    });
  });

  describe('ExerciseSetSchema', () => {
    const validSet = {
      setNumber: 1,
      reps: 5,
      intensity: 80,
      rpe: 8,
      weight: 100,
      isWarmup: false,
      isBackoff: false
    };

    it('should validate valid exercise set', () => {
      expect(() => ProgramGenerationSchemas.ExerciseSet.parse(validSet)).not.toThrow();
    });

    it('should accept rep ranges', () => {
      const repRangeSet = {
        ...validSet,
        reps: { min: 5, max: 8 }
      };
      expect(() => ProgramGenerationSchemas.ExerciseSet.parse(repRangeSet)).not.toThrow();
    });

    it('should accept intensity ranges', () => {
      const intensityRangeSet = {
        ...validSet,
        intensity: { min: 75, max: 85 }
      };
      expect(() => ProgramGenerationSchemas.ExerciseSet.parse(intensityRangeSet)).not.toThrow();
    });

    it('should reject invalid set numbers', () => {
      const invalidSetNumber = {
        ...validSet,
        setNumber: 0 // Below minimum
      };
      expect(() => ProgramGenerationSchemas.ExerciseSet.parse(invalidSetNumber)).toThrow();
    });
  });

  describe('ProgramGenerationValidators', () => {
    describe('validateRPERange', () => {
      it('should validate single RPE values', () => {
        expect(ProgramGenerationValidators.validateRPERange(8)).toBe(true);
        expect(ProgramGenerationValidators.validateRPERange(0)).toBe(false);
        expect(ProgramGenerationValidators.validateRPERange(11)).toBe(false);
      });

      it('should validate RPE ranges', () => {
        expect(ProgramGenerationValidators.validateRPERange({ min: 7, max: 9 })).toBe(true);
        expect(ProgramGenerationValidators.validateRPERange({ min: 9, max: 7 })).toBe(false);
        expect(ProgramGenerationValidators.validateRPERange({ min: 0, max: 5 })).toBe(false);
      });
    });

    describe('validateIntensityRange', () => {
      it('should validate single intensity values', () => {
        expect(ProgramGenerationValidators.validateIntensityRange(80)).toBe(true);
        expect(ProgramGenerationValidators.validateIntensityRange(110)).toBe(true); // Allow overload
        expect(ProgramGenerationValidators.validateIntensityRange(-5)).toBe(false);
        expect(ProgramGenerationValidators.validateIntensityRange(250)).toBe(false);
      });

      it('should validate intensity ranges', () => {
        expect(ProgramGenerationValidators.validateIntensityRange({ min: 70, max: 85 })).toBe(true);
        expect(ProgramGenerationValidators.validateIntensityRange({ min: 85, max: 70 })).toBe(false);
      });
    });

    describe('validateSessionDuration', () => {
      it('should estimate reasonable session duration', () => {
        const exercises = [
          { sets: [1, 2, 3] }, // 3 sets
          { sets: [1, 2, 3, 4] } // 4 sets
        ];
        const restPeriods = [
          [180, 180, 180], // 3 minutes rest
          [120, 120, 120, 120] // 2 minutes rest
        ];
        
        expect(ProgramGenerationValidators.validateSessionDuration(exercises, restPeriods)).toBe(true);
      });
    });

    describe('validateEquipmentAvailability', () => {
      it('should check equipment availability', () => {
        const required = ['barbell', 'plates'];
        const available = ['barbell', 'plates', 'dumbbells'];
        
        expect(ProgramGenerationValidators.validateEquipmentAvailability(required, available)).toBe(true);
        
        const unavailable = ['barbell'];
        expect(ProgramGenerationValidators.validateEquipmentAvailability(required, unavailable)).toBe(false);
      });
    });

    describe('validateInjuryRestrictions', () => {
      it('should check injury restrictions', () => {
        const restrictions = [
          { exerciseId: 'deadlift', restriction: 'EXCLUDE' },
          { exerciseId: 'squat', restriction: 'MODIFY' }
        ];
        
        expect(ProgramGenerationValidators.validateInjuryRestrictions('deadlift', restrictions)).toBe(false);
        expect(ProgramGenerationValidators.validateInjuryRestrictions('squat', restrictions)).toBe(true);
        expect(ProgramGenerationValidators.validateInjuryRestrictions('bench', restrictions)).toBe(true);
      });
    });

    describe('validateProgressionLogic', () => {
      it('should validate linear progression', () => {
        expect(ProgramGenerationValidators.validateProgressionLogic(100, 120, 8, 'LINEAR')).toBe(true);
        expect(ProgramGenerationValidators.validateProgressionLogic(100, 200, 4, 'LINEAR')).toBe(false); // Too aggressive
      });

      it('should allow other progression patterns', () => {
        expect(ProgramGenerationValidators.validateProgressionLogic(100, 120, 8, 'UNDULATING')).toBe(true);
        expect(ProgramGenerationValidators.validateProgressionLogic(100, 120, 8, 'BLOCK')).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalHealthMetrics = {
        date: new Date('2024-01-01')
      };
      expect(() => ProgramGenerationSchemas.HealthMetrics.parse(minimalHealthMetrics)).not.toThrow();
    });

    it('should provide meaningful error messages', () => {
      try {
        ProgramGenerationSchemas.RepRange.parse({ min: 10, max: 5 });
      } catch (error: any) {
        expect(error.issues[0].message).toContain('Minimum reps must be less than or equal to maximum reps');
      }
    });
  });
});