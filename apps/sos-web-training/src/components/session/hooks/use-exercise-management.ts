import { useCallback } from 'react';
import { TrainingSessionBuilder } from '@/types/global';
import { useCalculateWeight } from '@/hooks/api/use-training-session';

interface UseExerciseManagementProps {
  trainingSessionBuilder: TrainingSessionBuilder;
  updateBuilder: (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => void;
  selectedDay: number;
}

export function useExerciseManagement({
  trainingSessionBuilder,
  updateBuilder,
  selectedDay,
}: UseExerciseManagementProps) {
  const calculateWeightMutation = useCalculateWeight();

  const handleAddSetToExercise = useCallback(
    (exerciseId: string, order: number, sets: number) => {
      updateBuilder((prev) => {
        return {
          ...prev,
          exercises: prev.exercises.map((exercise) => {
            if (
              exercise.exercise_id === exerciseId &&
              exercise.day === selectedDay &&
              exercise.order === order
            ) {
              const newSetsArr = Array.from({ length: sets }, (_, i) => {
                if (exercise.target[i]) {
                  return {
                    ...exercise.target[i],
                  };
                }
                return {
                  sets: i + 1,
                  weight: 0,
                  reps: 0,
                  rpe: 0,
                };
              });
              const newActualArr = Array.from({ length: sets }, (_, i) => {
                if (exercise.actual[i]) {
                  return {
                    ...exercise.actual[i],
                  };
                }
                return {
                  sets: i + 1,
                  weight: 0,
                  reps: 0,
                  rpe: 0,
                  central_stress: 0,
                  peripheral_stress: 0,
                  total_stress: 0,
                };
              });
              return {
                ...exercise,
                target: newSetsArr,
                actual: newActualArr,
              };
            }
            return exercise;
          }),
        };
      });
    },
    [selectedDay, updateBuilder],
  );

  const handleRecalculateWeightForSet = useCallback(
    async (exerciseId: string, reps: number, rpe: number) => {
      if (
        !trainingSessionBuilder.athlete_id ||
        !exerciseId ||
        !(reps > 0) ||
        !(rpe > 0 && rpe <= 10)
      ) {
        return null;
      }

      try {
        const result = await calculateWeightMutation.mutateAsync({
          exerciseId,
          reps,
          rpe,
          athleteId: trainingSessionBuilder.athlete_id ?? '',
        });
        return result;
      } catch (e) {
        console.error('Failed to recalculate weight:', e);
        return null;
      }
    },
    [calculateWeightMutation, trainingSessionBuilder.athlete_id],
  );

  const handleReorderExercise = useCallback(
    (exerciseId: string, direction: 'up' | 'down', targetDay: number) => {
      const exToSwap = trainingSessionBuilder.exercises.find(
        (exercise) => exercise.exercise_id === exerciseId && exercise.day === targetDay,
      );
      if (!exToSwap) return;
      const targetSwapOrder = direction === 'up' ? exToSwap.order - 1 : exToSwap.order + 1;
      updateBuilder((prev) => ({
        ...prev,
        exercises: prev.exercises.map((exercise) => {
          if (exercise.order === targetSwapOrder && exercise.day === targetDay) {
            return { ...exercise, order: exToSwap.order };
          }
          if (exercise.order === exToSwap.order && exercise.day === targetDay) {
            return { ...exercise, order: targetSwapOrder };
          }
          return exercise;
        }),
      }));
    },
    [trainingSessionBuilder.exercises, updateBuilder],
  );

  const handleMoveExercise = useCallback(
    (oldDay: number, newDay: number) => {
      updateBuilder((prev) => {
        const newDayExercises = prev.exercises.filter((exercise) => exercise.day === newDay);

        if (newDayExercises.length > 0) {
          return {
            ...prev,
            exercises: prev.exercises.map((exercise) => {
              if (exercise.day === oldDay) {
                return { ...exercise, day: newDay };
              } else if (exercise.day === newDay) {
                return { ...exercise, day: oldDay };
              }
              return exercise;
            }),
          };
        } else {
          return {
            ...prev,
            exercises: prev.exercises.map((exercise) =>
              exercise.day === oldDay ? { ...exercise, day: newDay } : exercise,
            ),
          };
        }
      });
    },
    [updateBuilder],
  );

  const handleDeleteDay = useCallback(
    (day: number) => {
      updateBuilder((prev) => ({
        ...prev,
        exercises: prev.exercises.filter((exercise) => exercise.day !== day),
      }));
    },
    [updateBuilder],
  );

  const handleCopyDay = useCallback(
    (fromDay: number, toDay: number) => {
      const exercisesToCopy = trainingSessionBuilder.exercises.filter(
        (exercise) => exercise.day === fromDay,
      );

      updateBuilder((prev) => ({
        ...prev,
        exercises: prev.exercises
          .filter((exercise) => exercise.day !== toDay)
          .concat(
            exercisesToCopy.map((exercise) => ({
              ...exercise,
              day: toDay,
            })),
          ),
      }));
    },
    [trainingSessionBuilder.exercises, updateBuilder],
  );

  return {
    handleAddSetToExercise,
    handleRecalculateWeightForSet,
    handleReorderExercise,
    handleMoveExercise,
    handleDeleteDay,
    handleCopyDay,
  };
}
