import { TrainingSessionBuilder } from '@/types/global';
import { CreateTrainingSessionDto } from '@/hooks/api/use-training-session';
import dayjs from 'dayjs';

export function prepareSessionsForDeployment(
  builder: TrainingSessionBuilder,
  coachId: string | null,
): CreateTrainingSessionDto[] {
  const exercisesSorted = [...builder.exercises].sort((a, b) => {
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return 0;
  });

  const exercisesWithOrder = (() => {
    const grouped: Record<number, typeof exercisesSorted> = {};
    exercisesSorted.forEach((ex) => {
      if (!grouped[ex.day]) grouped[ex.day] = [];
      grouped[ex.day].push(ex);
    });

    let result: typeof exercisesSorted = [];
    Object.entries(grouped).forEach(([_day, group]) => {
      group.forEach((ex, idx) => {
        result.push({
          ...ex,
          order: idx + 1,
        });
      });
    });

    return result.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.order - b.order;
    });
  })();

  const sessions: CreateTrainingSessionDto[] = [];

  if (Array.isArray(builder.date) && builder.date.length > 0) {
    builder.date.forEach((date) => {
      const Exercises = exercisesWithOrder.map((ex) => {
        return {
          exerciseId: ex.exercise_id,
          exerciseDate: dayjs(date.start_date).add((ex.day ?? 1) - 1, 'days').format('YYYY-MM-DD'),
          order: ex.order,
          target: ex.target,
          actual: ex.actual,
          modifiers: ex.modifiers,
          metrics: ex.metrics,
          notes: ex.notes,
        };
      });

      const exerciseDates = Exercises.map((ex) => dayjs(ex.exerciseDate).unix() ?? 0).filter(
        Boolean,
      );

      const firstExerciseDate =
        exerciseDates.length > 0 ? dayjs(date.start_date).format('YYYY-MM-DD') : date.start_date;
      const lastExerciseDate = dayjs(date.end_date).format('YYYY-MM-DD');

      sessions.push({
        sessionName: builder.session_name,
        athleteId: builder.athlete_id,
        ...(coachId && { coachId }),
        startDate: firstExerciseDate,
        endDate: lastExerciseDate,
        exercises: Exercises,
      });
    });
  }

  return sessions;
}
