import React, { useState, useMemo } from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Divider,
  Chip,
  Textarea,
} from '@heroui/react';
import { FaTimes, FaPlus, FaMinus, FaTrash, FaWrench } from 'react-icons/fa';
import { TrainingSessionBuilder } from '@/types/global';
import { useExercises } from '@/hooks/api/use-exercises';
import { useModifiers } from '@/hooks/api/use-modifier';
import { useDebounce } from '@/hooks/api/use-debounce';
import { useIsMobile } from '@/hooks/api/use-screen-utils';
import { ModifierSelector } from '@/components/forms/ModifierSelector';

interface ExerciseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: number;
  trainingSessionBuilder: TrainingSessionBuilder;
  onUpdateExercises: (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => void;
  onAddSetToExercise: (exerciseId: string, order: number, sets: number) => void;
  onRecalculateWeight: (
    exerciseId: string,
    reps: number,
    rpe: number,
  ) => Promise<{ e1rm: number; weight: number } | null>;
  onModifierChange: (
    day: number,
    exerciseId: string,
    order: number,
    modifierId: string,
    categoryId?: string,
  ) => void;
  onMultiModifierChange?: (
    day: number,
    exerciseId: string,
    order: number,
    modifierIds: string[],
    categoryId: string,
  ) => void;
  onModifierRemove?: (day: number, exerciseId: string, order: number, modifierId: string) => void;
}

export function ExerciseDrawer({
  isOpen,
  onClose,
  selectedDay,
  trainingSessionBuilder,
  onUpdateExercises,
  onAddSetToExercise,
  onRecalculateWeight,
  onModifierChange,
  onMultiModifierChange,
}: ExerciseDrawerProps) {
  const [onTarget, setOnTarget] = useState(false);
  const [searchExercisesTerm, setSearchExercisesTerm] = useState('');
  const [modalModifier, setModalModifier] = useState<{
    day: number;
    exerciseId: string;
    order: number;
  } | null>(null);

  const debouncedSearchTerm = useDebounce(searchExercisesTerm, 300);
  const isMobile = useIsMobile();
  const { data: exercisesData } = useExercises({ status: true, limit: 1000 });
  const { data: modifiersData } = useModifiers({ limit: 1000 });

  const groupedExercises = useMemo(() => {
    const allExercises = exercisesData?.exercises || [];
    const filtered = debouncedSearchTerm
      ? allExercises.filter((exercise) =>
          exercise.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        )
      : allExercises;

    return filtered.reduce((acc: Record<string, typeof filtered>, exercise) => {
      const type = exercise.exerciseType || 'Other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(exercise);
      return acc;
    }, {});
  }, [exercisesData?.exercises, debouncedSearchTerm]);

  const exercisesForDay = trainingSessionBuilder.exercises
    .filter((exercise) => exercise.day === selectedDay)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleClose = () => {
    setOnTarget(false);
    setSearchExercisesTerm('');
    onClose();
  };

  const handleAddExercise = (exercise: { id: string; name: string }) => {
    onUpdateExercises((prev) => {
      const exercisesForDay = prev.exercises.filter((ex) => ex.day === selectedDay);
      const nextOrder =
        exercisesForDay.length > 0
          ? Math.max(...exercisesForDay.map((ex) => ex.order || 0)) + 1
          : 1;
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            modifiers: [],
            order: nextOrder,
            day: selectedDay,
            target: [
              {
                sets: 1,
                weight: 0,
                reps: 0,
                rpe: 0,
              },
            ],
            actual: [
              {
                sets: 1,
                weight: 0,
                reps: 0,
                rpe: 0,
                central_stress: 0,
                peripheral_stress: 0,
                total_stress: 0,
              },
            ],
            metrics: {
              e1rm: 0,
              nl: 0,
              tonnage: 0,
              total_stress: 0,
              peripheral_stress: 0,
              central_stress: 0,
            },
            notes: '',
          },
        ],
      };
    });
  };

  const handleRemoveExercise = (exerciseId: string, order: number) => {
    onUpdateExercises((prev) => ({
      ...prev,
      exercises: prev.exercises.filter(
        (ex) => !(ex.exercise_id === exerciseId && ex.day === selectedDay && ex.order === order),
      ),
    }));
  };

  const handleClearAllExercises = () => {
    onUpdateExercises((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((exercise) => exercise.day !== selectedDay),
    }));
    setSearchExercisesTerm('');
  };

  return (
    <>
      <Drawer
        size="2xl"
        isDismissable={true}
        isKeyboardDismissDisabled={false}
        hideCloseButton={true}
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        className="bg-backgroundSecondary"
        backdrop="blur"
        placement="right"
      >
        <DrawerContent>
          <DrawerHeader className="flex justify-between gap-4 pb-2">
            <h1 className="text-lg sm:text-2xl font-semibold text-text">
              Assign Exercises (Day {selectedDay})
            </h1>
            <Button isIconOnly variant="bordered" color="danger" onPress={handleClose}>
              <FaTimes />
            </Button>
          </DrawerHeader>
          <DrawerBody className="px-4 py-4 overflow-y-auto">
            {!onTarget ? (
              <div className="flex flex-col gap-4 border border-border rounded-md p-4">
                <div className="flex justify-between items-center gap-2">
                  <div className="text-base font-medium text-text">Exercises</div>
                  <div className="flex gap-2 items-center">
                    {exercisesForDay.length > 0 && (
                      <Button
                        isIconOnly
                        variant="bordered"
                        size="sm"
                        color="danger"
                        onPress={handleClearAllExercises}
                        title="Clear all exercises for this day"
                      >
                        <FaTrash />
                      </Button>
                    )}
                    <span className="text-sm text-text bg-background px-2 py-1 rounded border border-border">
                      {exercisesForDay.length} selected
                    </span>
                  </div>
                </div>
                <Input
                  size="md"
                  type="text"
                  variant="bordered"
                  placeholder="Search exercises by name..."
                  value={searchExercisesTerm}
                  onValueChange={setSearchExercisesTerm}
                  classNames={{
                    inputWrapper: 'bg-background border-border',
                    input: 'text-text',
                  }}
                />
                <Divider className="border-solid border-border" />
                {Object.entries(groupedExercises).map(([type, exercises]) => (
                  <div key={type} className="mb-6 w-full">
                    <div className="font-semibold text-sm text-text mb-3 uppercase tracking-wide pb-2 border-b border-border">
                      {type.replaceAll('_', ' ')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exercises.map((exercise) => {
                        const isExerciseAdded = exercisesForDay.some(
                          (ex) => ex.exercise_id === exercise.id,
                        );
                        return (
                          <Button
                            key={exercise.id}
                            variant="bordered"
                            color="primary"
                            onPress={() => handleAddExercise(exercise)}
                            className="text-text"
                          >
                            <span className="flex items-center gap-2">
                              {exercise.name}
                              {isExerciseAdded && (
                                <Chip
                                  size="sm"
                                  color="success"
                                  variant="solid"
                                  classNames={{
                                    base: 'min-w-6 h-6 px-1.5',
                                    content: 'text-white text-xs font-semibold',
                                  }}
                                >
                                  {
                                    exercisesForDay.filter((ex) => ex.exercise_id === exercise.id)
                                      .length
                                  }
                                </Chip>
                              )}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {exercisesForDay.map((exercise, index) => (
                  <ExerciseTargetEditor
                    key={`target-${exercise.exercise_id}-${exercise.day}-${exercise.order || index}`}
                    exercise={exercise}
                    selectedDay={selectedDay}
                    onUpdateExercises={onUpdateExercises}
                    onAddSetToExercise={onAddSetToExercise}
                    onRecalculateWeight={onRecalculateWeight}
                    onRemoveExercise={handleRemoveExercise}
                    onOpenModifierSelector={() =>
                      setModalModifier({
                        day: exercise.day,
                        exerciseId: exercise.exercise_id,
                        order: exercise.order,
                      })
                    }
                    modifiersData={modifiersData}
                  />
                ))}
              </div>
            )}
          </DrawerBody>
          <DrawerFooter className="gap-2 pt-4 border-t border-border">
            {!onTarget ? (
              <Button
                className="w-full sm:w-auto sm:ml-auto text-white"
                variant="solid"
                color="success"
                onPress={() => setOnTarget(true)}
              >
                Next: Configure Sets
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
                <Button
                  className="w-full sm:w-auto"
                  variant="bordered"
                  color="warning"
                  onPress={() => setOnTarget(false)}
                >
                  Back
                </Button>
                <Button
                  className="w-full sm:w-auto text-white"
                  variant="solid"
                  color="success"
                  onPress={handleClose}
                >
                  Done
                </Button>
              </div>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ModifierSelector
        isOpen={
          modalModifier !== null && modalModifier.day !== 0 && modalModifier.exerciseId !== ''
        }
        onClose={() => setModalModifier(null)}
        day={modalModifier?.day ?? 0}
        exerciseId={modalModifier?.exerciseId ?? ''}
        order={modalModifier?.order ?? 0}
        selectedModifiers={trainingSessionBuilder.exercises
          .filter(
            (ex) =>
              ex.day === modalModifier?.day &&
              ex.exercise_id === modalModifier?.exerciseId &&
              ex.order === modalModifier?.order,
          )
          .flatMap((ex) => ex.modifiers ?? [])}
        onModifierChange={onModifierChange}
        onMultiModifierChange={onMultiModifierChange}
      />
    </>
  );
}

interface ExerciseTargetEditorProps {
  exercise: TrainingSessionBuilder['exercises'][0];
  selectedDay: number;
  onUpdateExercises: (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => void;
  onAddSetToExercise: (exerciseId: string, order: number, sets: number) => void;
  onRecalculateWeight: (
    exerciseId: string,
    reps: number,
    rpe: number,
  ) => Promise<{ e1rm: number; weight: number } | null>;
  onRemoveExercise: (exerciseId: string, order: number) => void;
  onOpenModifierSelector: () => void;
  modifiersData: any;
}

function ExerciseTargetEditor({
  exercise,
  selectedDay,
  onUpdateExercises,
  onAddSetToExercise,
  onRecalculateWeight,
  onRemoveExercise,
  onOpenModifierSelector,
  modifiersData,
}: ExerciseTargetEditorProps) {
  return (
    <div className="mb-4 border border-border rounded-lg bg-backgroundSecondary">
      <div className="flex gap-2 items-center px-4 py-2 border-b border-border">
        <div className="flex gap-2 flex-1">
          <div className="text-lg font-semibold text-text">{exercise.exercise_name}</div>
          <Input
            size="sm"
            type="number"
            variant="bordered"
            readOnly
            value={exercise.target && exercise.target.length.toString()}
            endContent={<span className="text-text text-xs">sets</span>}
            classNames={{
              base: 'w-20 bg-background text-text',
              inputWrapper: 'bg-transparent group-data-[focus=true]:border-border',
              input: 'text-text',
            }}
          />
          <div className="flex gap-2 items-center">
            <Button
              isIconOnly
              variant="solid"
              size="sm"
              color="success"
              onPress={() =>
                onAddSetToExercise(exercise.exercise_id, exercise.order, exercise.target.length + 1)
              }
            >
              <FaPlus className="text-white" />
            </Button>
            <Button
              isIconOnly
              variant="solid"
              size="sm"
              color="danger"
              onPress={() =>
                onAddSetToExercise(exercise.exercise_id, exercise.order, exercise.target.length - 1)
              }
            >
              <FaMinus />
            </Button>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          <Button
            isIconOnly
            variant="solid"
            color="danger"
            size="sm"
            onPress={() => onRemoveExercise(exercise.exercise_id, exercise.order)}
          >
            <FaTrash />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1">
        <div className="flex flex-col gap-2 px-4 py-2">
          {exercise.target &&
            exercise.target.map((target, setIdx) => (
              <SetEditor
                key={`target-${exercise.exercise_id}-${exercise.day}-${exercise.order || 0}-${setIdx}`}
                exercise={exercise}
                setIdx={setIdx}
                target={target}
                selectedDay={selectedDay}
                onUpdateExercises={onUpdateExercises}
                onRecalculateWeight={onRecalculateWeight}
              />
            ))}
        </div>
        <div className="border border-border rounded-lg p-2 flex flex-col gap-2 mx-4 my-2">
          <div className="flex justify-between gap-2">
            <div className="text-text font-medium">Modifiers</div>
            <Button
              isIconOnly
              variant="solid"
              color="primary"
              size="sm"
              onPress={onOpenModifierSelector}
            >
              <FaWrench className="text-white" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {exercise.modifiers && exercise.modifiers.length > 0 ? (
              <div className="text-text text-sm">
                {exercise.modifiers
                  .map(
                    (modifier) =>
                      modifiersData?.modifiers?.find((m: any) => m.id === modifier)?.name,
                  )
                  .join(', ')}
              </div>
            ) : (
              <div className="text-text text-center text-sm">No modifiers</div>
            )}
          </div>
        </div>
        <Textarea
          label="Notes"
          value={exercise.notes}
          onValueChange={(value) => {
            onUpdateExercises((prev) => ({
              ...prev,
              exercises: prev.exercises.map((ex) => {
                if (
                  ex.exercise_id === exercise.exercise_id &&
                  ex.day === selectedDay &&
                  ex.order === exercise.order
                ) {
                  return {
                    ...ex,
                    notes: value,
                  };
                }
                return ex;
              }),
            })
          )}}
          placeholder='Exercise Note' 
          classNames={{
            base: 'w-full px-4 py-2',
            inputWrapper: 'border border-border rounded-lg'
          }}
        />
      </div>
    </div>
  );
}

interface SetEditorProps {
  exercise: TrainingSessionBuilder['exercises'][0];
  setIdx: number;
  target: TrainingSessionBuilder['exercises'][0]['target'][0];
  selectedDay: number;
  onUpdateExercises: (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => void;
  onRecalculateWeight: (
    exerciseId: string,
    reps: number,
    rpe: number,
  ) => Promise<{ e1rm: number; weight: number } | null>; //setIdx: number,
}

function SetEditor({
  exercise,
  setIdx,
  target,
  selectedDay,
  onUpdateExercises,
  onRecalculateWeight,
}: SetEditorProps) {
  const handleRepsChange = async (value: string) => {
    const num = Number(value);
    const newReps = isNaN(num) ? 0 : num;
    const currentSet = exercise.target[setIdx];
    const currentRpe = currentSet?.rpe ?? 0;

    let newWeight = currentSet?.weight ?? 0;
    if (newReps > 0 && currentRpe > 0 && currentRpe <= 10) {
      const calculatedWeight = await onRecalculateWeight(exercise.exercise_id, newReps, currentRpe);
      if (calculatedWeight !== null) {
        newWeight = calculatedWeight.weight;
      }
    }

    onUpdateExercises((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (
          ex.exercise_id === exercise.exercise_id &&
          ex.day === selectedDay &&
          ex.order === exercise.order
        ) {
          return {
            ...ex,
            target: ex.target.map((t, j) =>
              j === setIdx
                ? {
                    ...t,
                    reps: newReps,
                    weight: newWeight,
                  }
                : t,
            ),
          };
        }
        return ex;
      }),
    }));
  };

  const handleRpeChange = async (value: string) => {
    const num = Number(value);
    const newRpe = isNaN(num) ? 0 : num;
    const currentSet = exercise.target[setIdx];
    const currentReps = currentSet?.reps ?? 0;

    let newWeight = currentSet?.weight ?? 0;
    if (currentReps > 0 && newRpe > 0 && newRpe <= 10) {
      const calculatedWeight = await onRecalculateWeight(exercise.exercise_id, currentReps, newRpe);
      if (calculatedWeight !== null) {
        newWeight = calculatedWeight.weight;
      }
    }

    onUpdateExercises((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (
          ex.exercise_id === exercise.exercise_id &&
          ex.day === selectedDay &&
          ex.order === exercise.order
        ) {
          return {
            ...ex,
            target: ex.target.map((t, j) =>
              j === setIdx
                ? {
                    ...t,
                    rpe: newRpe,
                    weight: newWeight,
                  }
                : t,
            ),
          };
        }
        return ex;
      }),
    }));
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="hover:bg-background transition-colors duration-150 w-full">
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-backgroundSecondary rounded-lg border border-border w-full">
              <div className="text-sm font-medium text-text">Set {setIdx + 1}</div>
              <div className="flex items-center gap-1 sm:gap-2 flex-1">
                <Input
                  size="sm"
                  label="Reps"
                  type="number"
                  min={1}
                  max={30}
                  value={Number.isFinite(target.reps) ? target.reps.toString() : ''}
                  classNames={{
                    inputWrapper:
                      'px-2 border-border group-data-[focus=true]:border-border bg-white',
                    label: 'text-text text-sm',
                    input: 'text-text',
                  }}
                  onValueChange={handleRepsChange}
                />
                <span className="text-text font-medium">@</span>
                <Input
                  size="sm"
                  label="RPE"
                  type="number"
                  min={1.0}
                  step="any"
                  inputMode="decimal"
                  max={10.0}
                  value={Number.isFinite(target.rpe) ? target.rpe.toString() : ''}
                  classNames={{
                    inputWrapper:
                      'px-2 border-border group-data-[focus=true]:border-border bg-white',
                    label: 'text-text text-sm',
                    input: 'text-text',
                  }}
                  onValueChange={handleRpeChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
