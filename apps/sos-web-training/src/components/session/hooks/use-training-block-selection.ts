import { useCallback } from 'react';
import { TrainingSessionBuilder } from '@/types/global';
import { useCalculateWeight } from '@/hooks/api/use-training-session';

interface UseTrainingBlockSelectionProps {
  trainingSessionBuilder: TrainingSessionBuilder;
  updateBuilder: (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => void;
  trainingBlocks: Array<{
    id: string;
    workoutName: string;
    exercises: Array<{
      exerciseId: string;
      exerciseName?: string;
      order: number;
      day: number;
      sets: Array<{ reps: number; rpe: number }>;
      modifiers: string[];
    }>;
  }>;
}

export function useTrainingBlockSelection({
  trainingSessionBuilder,
  updateBuilder,
  trainingBlocks,
}: UseTrainingBlockSelectionProps) {
  const calculateWeightMutation = useCalculateWeight();

  const handleSelectTrainingBlock = useCallback(
    async (trainingBlockId: string) => {
      if (!trainingBlockId) return;

      const trainingBlock = trainingBlocks.find((block) => block.id === trainingBlockId);
      if (!trainingBlock) return;

      let newExercises: TrainingSessionBuilder['exercises'] = [];

      if (Array.isArray(trainingBlock.exercises)) {
        newExercises = await Promise.all(
          trainingBlock.exercises.map(async (exercise) => ({
            exercise_id: exercise.exerciseId,
            exercise_name: exercise.exerciseName,
            order: exercise.order,
            day: exercise.day,
            target: Array.isArray(exercise.sets)
              ? await Promise.all(
                  exercise.sets.map(async (set, index) => {
                    let weight = 0;
                    if (
                      trainingSessionBuilder.athlete_id &&
                      set.reps > 0 &&
                      set.rpe > 0 &&
                      set.rpe <= 10
                    ) {
                      try {
                        const result = await calculateWeightMutation.mutateAsync({
                          exerciseId: exercise.exerciseId,
                          reps: set.reps,
                          rpe: set.rpe,
                          athleteId: trainingSessionBuilder.athlete_id,
                        });
                        weight = Number(result.weight.toFixed(2)) ?? 0;
                      } catch {
                        weight = 0;
                      }
                    }
                    return {
                      sets: index + 1,
                      weight: weight,
                      reps: set.reps,
                      rpe: set.rpe,
                    };
                  }),
                )
              : [],
            actual: Array.isArray(exercise.sets)
              ? exercise.sets.map((set, index) => ({
                  sets: index + 1,
                  weight: 0,
                  reps: 0,
                  rpe: 0,
                  central_stress: 0,
                  peripheral_stress: 0,
                  total_stress: 0,
                }))
              : [],
            modifiers: Array.isArray(exercise.modifiers) ? exercise.modifiers : [],
            metrics: {
              e1rm: 0,
              nl: 0,
              tonnage: 0,
              total_stress: 0,
              peripheral_stress: 0,
              central_stress: 0,
            },
            notes: '',
          })),
        );
      }

      updateBuilder((prev) => ({
        ...prev,
        session_name:
          prev.session_name !== ''
            ? !prev.session_name.includes('-')
              ? trainingBlock.workoutName + ' - ' + prev.session_name
              : trainingBlock.workoutName + ' - ' + prev.session_name.split(' - ')[1]
            : trainingBlock.workoutName,
        exercises: newExercises,
      }));
    },
    [trainingSessionBuilder.athlete_id, trainingBlocks, updateBuilder, calculateWeightMutation],
  );

  return { handleSelectTrainingBlock };
}
