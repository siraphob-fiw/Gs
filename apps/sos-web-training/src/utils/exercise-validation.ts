import { CreateExerciseRequest, UpdateExerciseRequest } from '@strengthos/shared-types';

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate exercise form data
 */
export const validateExercise = (
  data: CreateExerciseRequest | UpdateExerciseRequest,
): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {};

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Exercise name is required';
  }

  if (!data.exerciseType) {
    errors.exerciseType = 'Exercise type is required';
  }

  if (!Array.isArray(data.movementPatterns) || data.movementPatterns.length === 0) {
    errors.movementPatterns = 'At least one movement pattern is required';
  }

  if (
    typeof data.centralStressFactor !== 'number' ||
    data.centralStressFactor < 0.1 ||
    data.centralStressFactor > 10.0
  ) {
    errors.centralStressFactor = 'Central stress factor must be between 0.1 and 10.0';
  }

  if (
    typeof data.peripheralStressFactor !== 'number' ||
    data.peripheralStressFactor < 0.1 ||
    data.peripheralStressFactor > 10.0
  ) {
    errors.peripheralStressFactor = 'Peripheral stress factor must be between 0.1 and 10.0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
