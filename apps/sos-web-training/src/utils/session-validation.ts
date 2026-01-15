import { TrainingSessionBuilder } from '@/types/global';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateTrainingSession(builder: TrainingSessionBuilder, isAthlete: boolean = false): string[] {
  const errors: string[] = [];

  if (!builder.session_name) {
    errors.push('session_name');
  }

  if (!builder.date || builder.date.length === 0) {
    errors.push('date');
  }

  if (builder.exercises.length === 0) {
    errors.push('exercises');
  }

  if (!builder.athlete_id) {
    errors.push('athlete_id');
  }

  // Athletes don't need a coach when deploying to themselves
  if (!isAthlete && !builder.coach_id) {
    errors.push('coach_id');
  }

  return errors;
}
