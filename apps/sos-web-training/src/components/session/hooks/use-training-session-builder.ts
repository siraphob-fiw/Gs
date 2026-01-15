import { useState, useCallback } from 'react';
import { TrainingSessionBuilder } from '@/types/global';

const initialTrainingSessionBuilder: TrainingSessionBuilder = {
  session_name: '',
  athlete_id: '',
  coach_id: '',
  date: [],
  exercises: [],
};

export function useTrainingSessionBuilder() {
  const [trainingSessionBuilder, setTrainingSessionBuilder] = useState<TrainingSessionBuilder>(
    initialTrainingSessionBuilder,
  );

  const updateBuilder = useCallback(
    (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => {
      setTrainingSessionBuilder(updater);
    },
    [],
  );

  const resetBuilder = useCallback(() => {
    setTrainingSessionBuilder(initialTrainingSessionBuilder);
  }, []);

  return {
    trainingSessionBuilder,
    setTrainingSessionBuilder,
    updateBuilder,
    resetBuilder,
  };
}
