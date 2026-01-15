import { useCallback } from 'react';
import { TrainingSessionBuilder } from '@/types/global';
import { useCalculateWeight } from '@/hooks/api/use-training-session';

interface UseAthleteSelectionProps {
  trainingSessionBuilder: TrainingSessionBuilder;
  updateBuilder: (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => void;
  availableAthletes?: {
    relationships: Array<{
      athlete_id: string;
      coach_id: string;
    }>;
  };
}

export function useAthleteSelection({
  trainingSessionBuilder,
  updateBuilder,
  availableAthletes,
}: UseAthleteSelectionProps) {
  const calculateWeightMutation = useCalculateWeight();

  const handleSelectAthlete = useCallback(
    async (athleteId: string) => {
      const newAthleteId = athleteId || '';
      updateBuilder((prev) => {
        let newCoachId = prev.coach_id;
        if (!prev.coach_id) {
          const foundRelationship = availableAthletes?.relationships.find(
            (athlete) => athlete.athlete_id === newAthleteId,
          );
          newCoachId = foundRelationship?.coach_id || '';
        }
        return {
          ...prev,
          athlete_id: newAthleteId,
          coach_id: newCoachId,
        };
      });

      if (newAthleteId && trainingSessionBuilder.exercises.length > 0) {
        const updatedExercises = await Promise.all(
          trainingSessionBuilder.exercises.map(async (exercise) => {
            if (!exercise.exercise_id || !exercise.target || exercise.target.length === 0) {
              return exercise;
            }
            const newTarget = await Promise.all(
              exercise.target.map(async (targetSet) => {
                if (
                  typeof targetSet.reps === 'number' &&
                  targetSet.reps > 0 &&
                  typeof targetSet.rpe === 'number' &&
                  targetSet.rpe > 0
                ) {
                  try {
                    const result = await calculateWeightMutation.mutateAsync({
                      exerciseId: exercise.exercise_id,
                      reps: targetSet.reps,
                      rpe: targetSet.rpe,
                      athleteId: newAthleteId,
                    });
                    return { ...targetSet, weight: Number(result.weight.toFixed(2)) };
                  } catch (e) {
                    return targetSet;
                  }
                }
                return targetSet;
              }),
            );
            return { ...exercise, target: newTarget };
          }),
        );
        updateBuilder((prev) => ({
          ...prev,
          exercises: updatedExercises,
        }));
      }
    },
    [trainingSessionBuilder.exercises, availableAthletes, updateBuilder, calculateWeightMutation],
  );

  return { handleSelectAthlete };
}
