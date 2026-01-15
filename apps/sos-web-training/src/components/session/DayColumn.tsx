import React, { useMemo } from 'react';
import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { FaArrowLeft, FaArrowRight, FaArrowUp, FaArrowDown, FaEdit, FaPlus } from 'react-icons/fa';
import { FaEllipsis } from 'react-icons/fa6';
import { TrainingSessionBuilder } from '@/types/global';
import { generateModifiedExerciseName } from '@/utils/exercise-name-modifier';

interface Modifier {
  id: string;
  name: string;
  modifier_category_id: string;
}

interface ModifierCategory {
  id: string;
  name: string;
}

interface ExerciseSummary {
  exerciseId: string;
  day: number;
  order: number;
  summary: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
    csBalance?: number;
  };
}

interface DayColumnProps {
  day: number;
  exercises: TrainingSessionBuilder['exercises'];
  onAssignExercises: (day: number) => void;
  onMoveExercise: (oldDay: number, newDay: number) => void;
  onReorderExercise: (exerciseId: string, direction: 'up' | 'down', targetDay: number) => void;
  onOpenCopyModal: (day: number) => void;
  onDeleteDay: (day: number) => void;
  modifiersData?: { modifiers: Modifier[] };
  modifierCategoriesData?: { modifier_categories: ModifierCategory[] };
  exerciseSummaries?: ExerciseSummary[];
}

export function DayColumn({
  day,
  exercises,
  onAssignExercises,
  onMoveExercise,
  onReorderExercise,
  onOpenCopyModal,
  onDeleteDay,
  modifiersData,
  modifierCategoriesData,
  exerciseSummaries,
}: DayColumnProps) {
  const exercisesForDay = exercises
    .filter((exercise) => exercise.day === day)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const hasExercises = exercisesForDay.length > 0;

  // Generate modified exercise names based on modifiers
  const getModifiedExerciseName = useMemo(() => {
    return (exercise: TrainingSessionBuilder['exercises'][0]) => {
      if (!modifiersData?.modifiers || !modifierCategoriesData?.modifier_categories) {
        return exercise.exercise_name || 'Unknown Exercise';
      }
      return generateModifiedExerciseName(
        exercise.exercise_name || 'Unknown Exercise',
        exercise.modifiers || [],
        modifiersData.modifiers as any,
        modifierCategoriesData.modifier_categories as any,
      );
    };
  }, [modifiersData, modifierCategoriesData]);

  return (
    <div className="bg-backgroundSecondary border border-border rounded-md p-2 flex-shrink-0">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col items-center gap-2">
          <div className="font-semibold text-text">Day {day}</div>
          <div className="w-full flex gap-1 justify-end">
            <Button
              isIconOnly
              variant="solid"
              size="sm"
              className="bg-background text-text w-auto max-w-40"
              onPress={() => onAssignExercises(day)}
            >
              {hasExercises ? <FaEdit /> : <FaPlus />}
            </Button>
            {hasExercises && (
              <Dropdown
                classNames={{
                  content: 'bg-backgroundSecondary text-text border border-border',
                }}
              >
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="bg-background text-text w-auto max-w-40"
                  >
                    <FaEllipsis />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    variant="bordered"
                    key="copy-day"
                    onPress={() => onOpenCopyModal(day)}
                  >
                    Copy Day
                  </DropdownItem>
                  <DropdownItem
                    variant="bordered"
                    key="delete-day"
                    onPress={() => onDeleteDay(day)}
                  >
                    Delete Exercises in Day {day}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </div>
        {hasExercises && (
          <div className="flex gap-2 items-center justify-center">
            {day > 1 && (
              <Button
                isIconOnly
                variant="bordered"
                size="sm"
                color="primary"
                onPress={() => onMoveExercise(day, day - 1)}
              >
                <FaArrowLeft />
              </Button>
            )}
            {day < 7 && (
              <Button
                isIconOnly
                variant="bordered"
                size="sm"
                color="primary"
                onPress={() => onMoveExercise(day, day + 1)}
              >
                <FaArrowRight />
              </Button>
            )}
          </div>
        )}
        {hasExercises && (
          <div className="flex flex-col gap-2">
            {exercisesForDay.map((exercise, exerciseIndex) => (
              <Card
                key={`exercise-card-${exercise.exercise_id}-${exercise.day}-${exercise.order || exerciseIndex}`}
                className="w-full min-w-0 bg-background border border-border"
              >
                <CardBody className="p-3 flex flex-col gap-2">
                  <div className="font-medium text-text pb-2 text-center border-b border-border">
                    {getModifiedExerciseName(exercise)}
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-text">
                    {exercise.target.map((set, index) => (
                      <div
                        key={`${exercise.exercise_id}-${exercise.day}-${exercise.order || exerciseIndex}-set-${index}`}
                      >
                        <div className="flex justify-between gap-2">
                          <span className="text-xs"># {index + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{set.weight} Kgs</span>
                            <span className="text-xs"> x {set.reps}</span>
                            <span className="text-xs"> @ {set.rpe}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {
                    exercise.notes !== '' && (
                      <div className="text-xs text-text pt-2 border-t border-border">
                        <span className="font-medium">Notes:</span> {exercise.notes}
                      </div>
                    )
                  }
                  {(() => {
                    const summary = exerciseSummaries?.find(
                      (s) =>
                        s.exerciseId === exercise.exercise_id &&
                        s.day === exercise.day &&
                        s.order === exercise.order,
                    );
                    if (!summary) return null;
                    return (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        <div className="flex gap-1 text-xs">
                          <span>NL:</span>
                          <span className="font-medium">{summary.summary.nl?.toFixed(0) || 0}</span>
                        </div>
                        <div className="flex gap-1 text-xs">
                          <span>Total:</span>
                          <span className="font-medium">
                            {summary.summary.totalStress?.toFixed(2) || 0}
                          </span>
                        </div>
                        <div className="flex gap-1 text-xs">
                          <span>Central:</span>
                          <span className="font-medium">
                            {summary.summary.centralStress?.toFixed(2) || 0}
                          </span>
                        </div>
                        <div className="flex gap-1 text-xs">
                          <span>Peripheral:</span>
                          <span className="font-medium">
                            {summary.summary.peripheralStress?.toFixed(2) || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex gap-1 justify-center items-center">
                    <Button
                      isIconOnly
                      variant="bordered"
                      size="sm"
                      color="primary"
                      isDisabled={exerciseIndex === 0}
                      onPress={() => onReorderExercise(exercise.exercise_id, 'up', exercise.day)}
                      title="Move up"
                    >
                      <FaArrowUp />
                    </Button>
                    <Button
                      isIconOnly
                      variant="bordered"
                      size="sm"
                      color="primary"
                      isDisabled={exerciseIndex === exercisesForDay.length - 1}
                      onPress={() => onReorderExercise(exercise.exercise_id, 'down', exercise.day)}
                      title="Move down"
                    >
                      <FaArrowDown />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
