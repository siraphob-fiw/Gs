'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import {
  addToast,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  SelectItem,
} from '@heroui/react';
import { useExercises } from '@/hooks/api/use-exercises';
import { useCreateTrainingBlock } from '@/hooks/api/use-training-blocks';
import { useAuth } from '@/hooks/api/use-auth-hooks';
import { UserRole } from '@strengthos/shared-types';
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaWrench,
  FaEdit,
  FaMinus,
  FaPlus,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { FaEllipsis } from 'react-icons/fa6';
import { useModifierCategories, useModifiers } from '@/hooks/api/use-modifier';
import { ModifierSelector } from '@/components/forms/ModifierSelector';
import { useDebounce } from '@/hooks/api/use-debounce';
import { TrainingBlockBuilder, WorkoutMethod, WorkoutType } from '@/types/global';
import { useCalculateWorkoutSummary } from '@/hooks/api/use-training-blocks';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { generateModifiedExerciseName } from '@/utils/exercise-name-modifier';

const initialTrainingBlockBuilder: TrainingBlockBuilder = {
  is_free: false,
  workout_name: '',
  workout_method: '',
  workout_type: '',
  exercises: [],
  summary: {
    nl: 0,
    totalStress: 0,
    centralStress: 0,
    peripheralStress: 0,
    csBalance: 0,
    patterns: [],
  },
};

export const CreateTrainingBlock = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantIdParam = searchParams?.get('tenantId') ?? '';

  // Auth and tenant handling
  const { state } = useAuth();
  const user = state.user;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const effectiveTenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user?.tenantId;

  const { data: exercisesData } = useExercises({ limit: 1000, tenantId: effectiveTenantId });
  const createTrainingBlockMutation = useCreateTrainingBlock();
  const calculateSummaryMutation = useCalculateWorkoutSummary();
  const [assignExdrawer, setAssignExdrawer] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const { isAdmin } = useRoleAccess();
  const [deployModal, setDeployModal] = useState<{ mode: 'move' | 'copy' | '', isOpen: boolean; day: number }>({
    mode: '',
    isOpen: false,
    day: 0,
  });
  const [onTarget, setOnTarget] = useState(false);
  const [trainingBlockBuilder, setTrainingBlockBuilder] = useState<TrainingBlockBuilder>(
    initialTrainingBlockBuilder,
  );
  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Program Builder', href: '/workout/manage-workouts' },
    { label: 'Add Training Block' },
  ];

  const [modalModifier, setModalModifier] = useState<{
    day: number;
    exerciseId: string;
    order: number;
  } | null>(null);
  const { data: modifiersData } = useModifiers({ limit: 1000, tenantId: effectiveTenantId });
  const { data: modifierCategoriesData } = useModifierCategories({ limit: 1000, tenantId: effectiveTenantId });
  const [searchExercisesTerm, setSearchExercisesTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchExercisesTerm, 300);

  const selectedDayExercises = useMemo(() => {
    return trainingBlockBuilder.exercises
      .filter((exercise) => exercise.day === selectedDay)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [trainingBlockBuilder.exercises, selectedDay]);

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

  const handleCancelBuilder = () => {
    router.push('/workout/manage-workouts');
    setTrainingBlockBuilder(initialTrainingBlockBuilder);
    setSelectedDay(1);
  };

  const getModifiedExerciseName = useMemo(() => {
    return (exercise: TrainingBlockBuilder['exercises'][0]) => {
      if (!modifiersData?.modifiers || !modifierCategoriesData?.modifier_categories) {
        return exercise.exerciseName || 'Unknown Exercise';
      }
      return generateModifiedExerciseName(
        exercise.exerciseName || 'Unknown Exercise',
        exercise.modifiers || [],
        modifiersData.modifiers as any,
        modifierCategoriesData.modifier_categories as any,
      );
    };
  }, [modifiersData, modifierCategoriesData]);

  const handleSaveTrainingBlock = async () => {
    // Validation
    if (!trainingBlockBuilder.workout_name) {
      addToast({
        title: 'Please enter a training block name',
        color: 'danger',
      });
      return;
    }

    if (!trainingBlockBuilder.workout_method) {
      addToast({
        title: 'Please select a training method',
        color: 'danger',
      });
      return;
    }

    if (!trainingBlockBuilder.workout_type) {
      addToast({
        title: 'Please select a training type',
        color: 'danger',
      });
      return;
    }

    if (trainingBlockBuilder.exercises.length === 0) {
      addToast({
        title: 'Please add exercises',
        color: 'danger',
      });
      return;
    }

    // Ensure all sets have reasonable reps/rpe data
    const hasInvalidSet = trainingBlockBuilder.exercises.some((ex) =>
      Array.isArray(ex.sets)
        ? ex.sets.some(
            (set) =>
              typeof set.reps !== 'number' ||
              set.reps > 30 ||
              typeof set.rpe !== 'number' ||
              set.rpe < 0 ||
              set.rpe > 10,
          )
        : false,
    );
    if (hasInvalidSet) {
      addToast({
        title: 'Each exercise set must have reps less then 30 and RPE 0 - 10',
        color: 'danger',
      });
      return;
    }

    try {
      // Sort by day, then by order
      const exercisesSorted = [...trainingBlockBuilder.exercises].sort((a, b) => {
        if (a.day !== b.day) {
          return a.day - b.day;
        }
        if (typeof a.order === 'number' && typeof b.order === 'number') {
          return a.order - b.order;
        }
        return 0;
      });

      // Re-number the order field for each day
      const grouped: Record<number, typeof exercisesSorted> = {};
      exercisesSorted.forEach((ex) => {
        if (!grouped[ex.day]) grouped[ex.day] = [];
        grouped[ex.day].push(ex);
      });

      let finalExercises: typeof exercisesSorted = [];
      Object.values(grouped).forEach((group) => {
        group.forEach((ex, idx) => {
          finalExercises.push({
            ...ex,
            order: idx + 1,
          });
        });
      });
      finalExercises.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.order - b.order;
      });

      const createData = {
        isGlobal: user?.role === 'SUPER_ADMIN' ? true : false,
        is_free: trainingBlockBuilder.is_free || false,
        workoutName: trainingBlockBuilder.workout_name,
        workoutMethod: trainingBlockBuilder.workout_method as WorkoutMethod,
        workoutType: trainingBlockBuilder.workout_type as WorkoutType,
        exercises: finalExercises,
        summary: trainingBlockBuilder.summary,
        tenantId: effectiveTenantId,
      };

      await createTrainingBlockMutation.mutateAsync(createData, {
        onSuccess: () => {
          addToast({
            title: 'Template created successfully',
            color: 'success',
          });
          setTrainingBlockBuilder(initialTrainingBlockBuilder);
          setSelectedDay(1);
          router.push('/workout/manage-workouts');
        },
        onError: () => {
          addToast({
            title: 'Failed to create Template',
            color: 'danger',
          });
        },
      });
    } catch (error) {
      console.error('Failed to create Template:', error);
      addToast({
        title: 'Unexpected error during creation',
        color: 'danger',
      });
    }
  };

  const handleAddSetToExercise = useCallback(
    (exerciseId: string, order: number, sets: number) => {
      setTrainingBlockBuilder((prev) => {
        return {
          ...prev,
          exercises: prev.exercises.map((exercise) => {
            if (
              exercise.exerciseId === exerciseId &&
              exercise.day === selectedDay &&
              exercise.order === order
            ) {
              const newSetsArr = Array.from({ length: sets }, (_, i) => {
                if (exercise.sets[i]) {
                  return {
                    ...exercise.sets[i],
                  };
                }
                return {
                  reps: 0,
                  rpe: 0,
                };
              });
              return {
                ...exercise,
                sets: newSetsArr,
              };
            }
            return exercise;
          }),
        };
      });
    },
    [selectedDay],
  );

  const handleCopyDay = useCallback(
    (fromDay: number, toDay: number) => {
      const exercisesToCopy = trainingBlockBuilder.exercises.filter(
        (exercise) => exercise.day === fromDay,
      );

      setTrainingBlockBuilder((prev) => ({
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
      setDeployModal({ mode: '', isOpen: false, day: 0 });
    },
    [trainingBlockBuilder.exercises],
  );

  const handleDeleteDay = useCallback((day: number) => {
    setTrainingBlockBuilder((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((exercise) => exercise.day !== day),
    }));
  }, []);

  const handleAssignExercises = useCallback((day: number) => {
    setSelectedDay(day);
    setAssignExdrawer(true);
  }, []);

  const handleMoveExercise = useCallback((oldDay: number, newDay: number) => {
    setTrainingBlockBuilder((prev) => {
      const oldDayExercises = prev.exercises.filter((exercise) => exercise.day === oldDay);
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
    setDeployModal({ mode: '', isOpen: false, day: 0 });
  }, []);

  const handleModifierChange = useCallback(
    (day: number, exerciseId: string, order: number, modifierId: string, categoryId?: string) => {
      setTrainingBlockBuilder((prev) => {
        return {
          ...prev,
          exercises: prev.exercises.map((exercise) => {
            if (
              exercise.day !== day ||
              exercise.exerciseId !== exerciseId ||
              exercise.order !== order
            )
              return exercise;

            // If modifierId is empty, remove modifiers from the specified category
            if (modifierId === '' && categoryId) {
              return {
                ...exercise,
                modifiers: (exercise.modifiers ?? []).filter((modId) => {
                  const existingModifier = modifiersData?.modifiers?.find((m) => m.id === modId);
                  return existingModifier?.modifier_category_id !== categoryId;
                }),
              };
            }

            // Otherwise, add/replace modifier
            const modifier = modifiersData?.modifiers?.find((m) => m.id === modifierId);
            if (!modifier) return exercise;

            const filteredModifiers = (exercise.modifiers ?? []).filter((modId) => {
              const existingModifier = modifiersData?.modifiers?.find((m) => m.id === modId);
              return existingModifier?.modifier_category_id !== modifier.modifier_category_id;
            });

            return {
              ...exercise,
              modifiers: [...filteredModifiers, modifierId],
            };
          }),
        };
      });
    },
    [modifiersData?.modifiers],
  );

  const handleReorderExercise = (
    exerciseId: string,
    direction: 'up' | 'down',
    targetDay: number,
  ) => {
    const dayToUse = targetDay;
    const exToSwap = trainingBlockBuilder.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId && exercise.day === dayToUse,
    );
    if (!exToSwap) return;
    const targetSwapOrder = direction === 'up' ? exToSwap.order - 1 : exToSwap.order + 1;
    setTrainingBlockBuilder((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) => {
        if (exercise.order === targetSwapOrder && exercise.day === dayToUse) {
          return { ...exercise, order: exToSwap.order };
        }
        if (exercise.order === exToSwap.order && exercise.day === dayToUse) {
          return { ...exercise, order: targetSwapOrder };
        }
        return exercise;
      }),
    }));
  };

  useEffect(() => {
    if (!exercisesData || trainingBlockBuilder.exercises.length === 0) return;

    calculateSummaryMutation.mutate(
      {
        exercises: trainingBlockBuilder.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          order: ex.order,
          day: ex.day,
          sets: ex.sets,
          modifiers: ex.modifiers,
        })),
      },
      {
        onSuccess: (summary) => {
          setTrainingBlockBuilder((prev) => {
            // Only update if there's actually a change to summaries
            const updatedExercises = prev.exercises.map((exercise) => {
              const foundSummary = summary.exercises.find(
                (s) =>
                  s.exerciseId === exercise.exerciseId &&
                  s.day === exercise.day &&
                  s.order === exercise.order,
              );
              // Only update summary if changed
              if (
                foundSummary &&
                JSON.stringify(foundSummary.summary) !== JSON.stringify(exercise.summary)
              ) {
                return {
                  ...exercise,
                  summary: foundSummary.summary,
                };
              }
              return exercise;
            });

            // Only update block summary if changed
            const newSummary = {
              nl: summary.total.nl,
              totalStress: summary.total.total,
              centralStress: summary.total.central,
              peripheralStress: summary.total.peripheral,
              csBalance: summary.total.csBalance,
              patterns: summary.patterns,
            };

            // Compare objects (shallow compare for patterns array by stringifying)
            const summariesAreEqual =
              JSON.stringify(prev.summary) === JSON.stringify(newSummary) &&
              JSON.stringify(prev.exercises.map((e) => e.summary)) ===
                JSON.stringify(updatedExercises.map((e) => e.summary));

            return summariesAreEqual
              ? prev
              : {
                  ...prev,
                  exercises: updatedExercises,
                  summary: newSummary,
                };
          });
        },
      },
    );
  }, [exercisesData, trainingBlockBuilder.exercises]);

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      {exercisesData?.exercises.length === 0 ? (
        <Card className="bg-backgroundSecondary border border-border">
          <CardBody className="flex flex-col items-center justify-center gap-4">
            <div className="text-xl text-text">Exercises Not Found</div>
            <Button
              variant="solid"
              color="primary"
              onPress={() => router.push('/manage/exercises')}
            >
              Add Exercises
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4 p-4 rounded-md bg-backgroundSecondary border border-border">
            <div className="flex flex-col sm:flex-row justify-between gap-y-2">
              <h1 className="text-2xl font-semibold text-text">Create Template</h1>
              <div className="flex justify-end gap-3">
                <Button
                  variant="solid"
                  color="primary"
                  onPress={handleSaveTrainingBlock}
                  isLoading={createTrainingBlockMutation.isPending}
                >
                  Save Template
                </Button>
                <Button variant="solid" color="danger" onPress={handleCancelBuilder}>
                  Cancel
                </Button>
              </div>
            </div>

            <div className="training-block-builder">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  classNames={{
                    inputWrapper: 'border-border group-data-[focus=true]:border-text bg-background',
                  }}
                  variant="bordered"
                  label="Training Block Name"
                  value={trainingBlockBuilder.workout_name}
                  onChange={(e) =>
                    setTrainingBlockBuilder((prev) => ({
                      ...prev,
                      workout_name: e.target.value,
                    }))
                  }
                  isRequired
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <SelectWithClassName
                    fullwidth
                    id="training-block-type"
                    label="Training Method"
                    placeholder="Select Training Method"
                    selectorIconColor="text-text"
                    selectedKeys={
                      trainingBlockBuilder.workout_method &&
                      Object.keys(WorkoutMethod).includes(trainingBlockBuilder.workout_method)
                        ? [trainingBlockBuilder.workout_method]
                        : []
                    }
                    onSelectionChange={(e) => {
                      setTrainingBlockBuilder((prev) => ({
                        ...prev,
                        workout_method: (e.currentKey as WorkoutMethod) || '',
                        workout_week_number: e.currentKey === 'JIM_WENDLER' ? 4 : 1,
                      }));
                    }}
                    classNames={{
                      trigger: 'bg-background border-border data-[open=true]:border-border',
                      label: 'text-text',
                      value: 'text-text group-data-[has-value=true]:text-text',
                    }}
                    isRequired
                    children={
                      <>
                        <SelectItem key="JIM_WENDLER" textValue="JIM WENDLER'S">
                          <div className="flex flex-col">
                            <div className="font-medium">JIM WENDLER'S</div>
                            <div className="text-sm">
                              4-week cycle for steady, progressive strength.
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem key="WESTSIDE_CONJUGATE" textValue="WESTSIDE CONJUGATE">
                          <div className="flex flex-col">
                            <div className="font-medium">WESTSIDE CONJUGATE</div>
                            <div className="text-sm">
                              4-day split for concurrent strength and speed training.
                            </div>
                          </div>
                        </SelectItem>
                      </>
                    }
                  />
                  <SelectWithClassName
                    fullwidth
                    id="training-block-type"
                    label="Training Type"
                    placeholder="Select Training Type"
                    selectorIconColor="text-text"
                    selectedKeys={
                      trainingBlockBuilder.workout_type &&
                      Object.keys(WorkoutType).includes(trainingBlockBuilder.workout_type)
                        ? [trainingBlockBuilder.workout_type]
                        : []
                    }
                    onSelectionChange={(e) => {
                      setTrainingBlockBuilder((prev) => ({
                        ...prev,
                        workout_type: (e.currentKey as WorkoutType) || '',
                      }));
                    }}
                    classNames={{
                      trigger: 'bg-background border-border data-[open=true]:border-border',
                      label: 'text-text',
                      value: 'text-text group-data-[has-value=true]:text-text',
                    }}
                    isRequired
                    children={
                      <>
                        <SelectItem key="CUTTING" textValue="CUTTING">
                          <div className="flex flex-col">
                            <div className="font-medium">CUTTING</div>
                            <div className="text-sm">
                              Focus on fat loss and muscle preservation.
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem key="HYPERTROPHY" textValue="HYPERTROPHY">
                          <div className="flex flex-col">
                            <div className="font-medium">HYPERTROPHY</div>
                            <div className="text-sm">Focus on muscle growth and size.</div>
                          </div>
                        </SelectItem>
                      </>
                    }
                  />
                  {
                    isAdmin() && (
                      <div className="flex items-center gap-3 mt-4">
                        <label
                          htmlFor="available-for-free-checkbox"
                          className="flex items-center gap-2 bg-backgroundSecondary border border-border rounded-md px-3 py-2 shadow-sm transition hover:bg-accent cursor-pointer select-none"
                          style={{ minWidth: 0 }}
                        >
                          <input
                        type="checkbox"
                        id="available-for-free-checkbox"
                        checked={!!trainingBlockBuilder.is_free}
                        onChange={(e) =>
                          setTrainingBlockBuilder((prev) => ({
                            ...prev,
                            is_free: e.target.checked,
                          }))
                        }
                        className="accent-primary focus:ring-2 focus:ring-primary rounded w-5 h-5 mr-1"
                      />
                      <span className="text-text text-sm font-medium whitespace-nowrap">
                        Available for free plan users
                      </span>
                    </label>
                  </div>
                    )
                  }
                  
                </div>
                <div className="w-full">
                  <h2 className="text-lg font-semibold text-text mb-2">Workout Summary</h2>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[1000px] grid grid-cols-7 gap-2 mb-2">
                      {/* Total */}
                      <Card className="bg-background border border-border shadow-none">
                        <CardBody className="p-3">
                          <div className="text-sm font-semibold text-text mb-2 text-center border-b border-border pb-1">
                            Total
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-text">
                            <div className="flex justify-between">
                              <span>NL:</span>
                              <span className="font-medium">
                                {trainingBlockBuilder.summary.nl.toFixed(2) || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Peripheral:</span>
                              <span className="font-medium">
                                {trainingBlockBuilder.summary.peripheralStress.toFixed(2) || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Central:</span>
                              <span className="font-medium">
                                {trainingBlockBuilder.summary.centralStress.toFixed(2) || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span className="font-medium">
                                {trainingBlockBuilder.summary.totalStress.toFixed(2) || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>CS Balance:</span>
                              <span className="font-medium">
                                {trainingBlockBuilder.summary.csBalance.toFixed(1) || 0}%
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Movement Patterns */}
                      {Array.isArray(trainingBlockBuilder.summary?.patterns) &&
                    trainingBlockBuilder.summary.patterns.map((patternMetrics, idx) => {
                      if (!patternMetrics || typeof patternMetrics !== 'object') return null;

                      const type = (patternMetrics as any).type ?? '';
                      const formatType = (typeStr: string) => {
                        return typeStr
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ');
                      };

                      // The metric fields to render, in order
                      const metrics = [
                        { key: 'nl', label: 'NL', digits: 0, suffix: null },
                        { key: 'peripheralStress', label: 'Peripheral', digits: 2, suffix: null  },
                        { key: 'totalStress', label: 'Total', digits: 2, suffix: null  },
                        { key: 'centralStress', label: 'Central', digits: 2, suffix: null },
                        { key: 'csBalance', label: 'CS Balance', digits: 1, suffix: '%' }
                      ] as const;

                      const val = (field: string, digits = 2, fallback = 0) => {
                        const value = (patternMetrics as any)?.[field];
                        if (typeof value === "number" && !isNaN(value)) {
                          return Number(value).toFixed(digits);
                        }
                        return fallback;
                      };


                      return (
                        <Card
                          key={type || idx}
                          className="bg-background border border-border shadow-none"
                        >
                          <CardBody className="p-3">
                            <div className="text-sm text-text mb-2 text-center border-b border-border pb-1 whitespace-normal break-words">
                              {formatType(type)}
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-text">
                              {metrics.map(({ key, label, digits, suffix }) => (
                                <div className="flex justify-between" key={key}>
                                  <span>{label}:</span>
                                  <span className="font-medium">
                                    {val(key, digits)}
                                    {suffix || ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })
                  }
                    </div>
                  </div>
                </div>
                <div className="w-full overflow-x-auto">
                  <div className="md:min-w-[1440px] grid grid-cols-1 md:grid-cols-7 gap-2 mb-2">
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const day = dayIdx + 1;
                      return (
                        <div
                          key={'day-' + day}
                          className="bg-backgroundSecondary border border-border rounded-md p-2 flex-shrink-0"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="font-semibold text-text">Day {day}</div>
                              <div className="flex gap-1 items-center">
                                <Button
                                  isIconOnly
                                  variant="solid"
                                  size="sm"
                                  className="ml-auto bg-background text-text w-auto max-w-40"
                                  onPress={() => {
                                    if (
                                      trainingBlockBuilder.exercises.some((exercise) => {
                                        return exercise.day === day;
                                      })
                                    ) {
                                      setOnTarget(true);
                                    }
                                    handleAssignExercises(day);
                                  }}
                                >
                                  {trainingBlockBuilder.exercises.some((exercise) => {
                                    return exercise.day === day;
                                  }) ? (
                                    <FaEdit />
                                  ) : (
                                    <FaPlus />
                                  )}
                                </Button>
                                {trainingBlockBuilder.exercises.some(
                                  (exercise) => exercise.day === day,
                                ) && (
                                  <Dropdown
                                    classNames={{
                                      content:
                                        'bg-backgroundSecondary text-text border border-border',
                                    }}
                                  >
                                    <DropdownTrigger>
                                      <Button
                                        isIconOnly
                                        variant="light"
                                        size="sm"
                                        className="ml-auto bg-background text-text w-auto max-w-40"
                                      >
                                        <FaEllipsis />
                                      </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu>
                                      <DropdownItem
                                        variant="bordered"
                                        key="move-day"
                                        onPress={() =>
                                          setDeployModal({
                                            mode: 'move',
                                            isOpen: true,
                                            day: day,
                                          })
                                        }
                                      >
                                        Move Day
                                      </DropdownItem>
                                      <DropdownItem
                                        variant="bordered"
                                        key="copy-day"
                                        onPress={() =>
                                          setDeployModal({
                                            mode: 'copy',
                                            isOpen: true,
                                            day: day,
                                          })
                                        }
                                      >
                                        Copy Day
                                      </DropdownItem>
                                      <DropdownItem
                                        variant="bordered"
                                        key="delete-day"
                                        onPress={() => handleDeleteDay(day)}
                                      >
                                        Delete Exercises in Day {day}
                                      </DropdownItem>
                                    </DropdownMenu>
                                  </Dropdown>
                                )}
                              </div>
                            </div>
                            {/* {trainingBlockBuilder.exercises.filter(
                              (exercise) => exercise.day === day,
                            ).length > 0 && (
                              <div className="flex gap-2 items-center justify-center">
                                {day > 1 && (
                                  <Button
                                    isIconOnly
                                    variant="bordered"
                                    size="sm"
                                    color="primary"
                                    onPress={() => handleMoveExercise(day, day - 1)}
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
                                    onPress={() => handleMoveExercise(day, day + 1)}
                                  >
                                    <FaArrowRight />
                                  </Button>
                                )}
                              </div>
                            )} */}
                            {(() => {
                              const exercisesForDay = trainingBlockBuilder.exercises
                                .filter((exercise) => exercise.day === day)
                                .sort((a, b) => (a.order || 0) - (b.order || 0));

                              return exercisesForDay.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {exercisesForDay.map((exercise, exerciseIndex) => (
                                    <Card
                                      key={`exercise-card-${exercise.exerciseId}-${exerciseIndex}`}
                                      className="w-full min-w-0 bg-background border border-border"
                                    >
                                      <CardBody className="p-3 flex flex-col gap-2">
                                        <div className="font-medium text-text pb-2 text-center border-b border-border">
                                          {getModifiedExerciseName(exercise)}
                                        </div>
                                        <div className="flex flex-col gap-2 text-xs text-text">
                                          {exercise.sets.map((set, index) => (
                                            <div
                                              key={`${exercise.exerciseId}-${exercise.day}-${exercise.order || 0}-set-${index}`}
                                            >
                                              <div
                                                className="flex justify-between gap-2"
                                                key={`set-${set.reps}-${set.rpe}`}
                                              >
                                                <span className="text-xs"># {index + 1}</span>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs">{set.reps} reps</span>
                                                  <span className="text-xs">@ {set.rpe} RPE</span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <div className="flex gap-2 text-xs">
                                            <span>NL:</span>
                                            <span className="font-medium">
                                              {exercise.summary.nl.toFixed(0) || 0}
                                            </span>
                                          </div>
                                          <div className="flex gap-2 text-xs">
                                            <span>Total Stress:</span>
                                            <span className="font-medium">
                                              {exercise.summary.totalStress.toFixed(2) || 0}
                                            </span>
                                          </div>
                                          <div className="flex gap-2 text-xs">
                                            <span>Central Stress:</span>
                                            <span className="font-medium">
                                              {exercise.summary.centralStress.toFixed(2) || 0}
                                            </span>
                                          </div>
                                          <div className="flex gap-2 text-xs">
                                            <span>Peripheral Stress:</span>
                                            <span className="font-medium">
                                              {exercise.summary.peripheralStress.toFixed(2) || 0}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex gap-1 justify-center items-center">
                                          <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            color="primary"
                                            isDisabled={exerciseIndex === 0}
                                            onPress={() =>
                                              handleReorderExercise(
                                                exercise.exerciseId,
                                                'up',
                                                exercise.day,
                                              )
                                            }
                                            title="Move up"
                                          >
                                            <FaArrowUp />
                                          </Button>
                                          <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            color="primary"
                                            isDisabled={
                                              exerciseIndex === exercisesForDay.length - 1
                                            }
                                            onPress={() =>
                                              handleReorderExercise(
                                                exercise.exerciseId,
                                                'down',
                                                exercise.day,
                                              )
                                            }
                                            title="Move down"
                                          >
                                            <FaArrowDown />
                                          </Button>
                                        </div>
                                      </CardBody>
                                    </Card>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Drawer
            size="2xl"
            isDismissable={true}
            isKeyboardDismissDisabled={false}
            hideCloseButton={true}
            isOpen={assignExdrawer}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setAssignExdrawer(false);
                setOnTarget(false);
                setSearchExercisesTerm('');
              }
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
                <Button
                  isIconOnly
                  variant="bordered"
                  color="danger"
                  onPress={() => {
                    setAssignExdrawer(false);
                    setSelectedDay(1);
                    setOnTarget(false);
                    setSearchExercisesTerm('');
                  }}
                >
                  <FaTimes />
                </Button>
              </DrawerHeader>
              <DrawerBody className="px-4 py-4 overflow-y-auto">
                {!onTarget ? (
                  <div className="flex flex-col gap-4 border border-border rounded-md p-4">
                    <div className="flex justify-between items-center gap-2">
                      <div className="text-base font-medium text-text">Exercises</div>
                      <span className="text-sm text-text bg-background px-2 py-1 rounded border border-border">
                        {selectedDayExercises.length} selected
                      </span>
                    </div>
                    <Input
                      size="md"
                      type="text"
                      variant="bordered"
                      placeholder="Search exercises by name..."
                      value={searchExercisesTerm}
                      onValueChange={(e) => setSearchExercisesTerm(e)}
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
                            const isExerciseAdded = selectedDayExercises.some(
                              (ex) => ex.exerciseId === exercise.id,
                            );
                            return (
                              <Button
                                key={exercise.id}
                                variant="bordered"
                                color="primary"
                                onPress={() => {
                                  setTrainingBlockBuilder((prev) => {
                                    const exercisesForDay = prev.exercises.filter(
                                      (ex) => ex.day === selectedDay,
                                    );
                                    const nextOrder =
                                      exercisesForDay.length > 0
                                        ? Math.max(...exercisesForDay.map((ex) => ex.order ?? 0)) +
                                          1
                                        : 1;
                                    return {
                                      ...prev,
                                      exercises: [
                                        ...prev.exercises,
                                        {
                                          exerciseId: exercise.id,
                                          exerciseName: exercise.name,
                                          modifiers: [],
                                          order: nextOrder,
                                          day: selectedDay,
                                          sets: [
                                            {
                                              reps: 0,
                                              rpe: 0,
                                            },
                                          ],
                                          summary: {
                                            nl: 0,
                                            totalStress: 0,
                                            centralStress: 0,
                                            peripheralStress: 0,
                                          },
                                        },
                                      ],
                                    };
                                  });
                                }}
                                className="text-text"
                              >
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
                                      selectedDayExercises.filter(
                                        (ex) => ex.exerciseId === exercise.id,
                                      ).length
                                    }
                                  </Chip>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedDayExercises.map((exercise, index) => (
                      <div
                        key={`target-${exercise.exerciseId}-${exercise.day}-${exercise.order || index}`}
                        className="mb-4 border border-border rounded-lg bg-backgroundSecondary"
                      >
                        <div className="flex gap-2 items-center p-2 border-b border-border">
                          <div className="flex flex-col sm:flex-row gap-2 flex-1">
                            <div className="text-lg font-semibold text-text">
                              {exercise.exerciseName}
                            </div>
                            <div className="flex gap-2 items-center">
                              <Input
                                size="sm"
                                type="number"
                                variant="bordered"
                                readOnly
                                value={exercise.sets && exercise.sets.length.toString()}
                                endContent={<span className="text-text text-xs">sets</span>}
                                classNames={{
                                  base: 'w-20 bg-background text-text',
                                  inputWrapper:
                                    'bg-transparent group-data-[focus=true]:border-border',
                                  input: 'text-text',
                                }}
                              />
                              <Button
                                isIconOnly
                                variant="solid"
                                size="sm"
                                color="success"
                                onPress={() =>
                                  handleAddSetToExercise(
                                    exercise.exerciseId,
                                    exercise.order,
                                    exercise.sets.length + 1,
                                  )
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
                                  handleAddSetToExercise(
                                    exercise.exerciseId,
                                    exercise.order,
                                    exercise.sets.length - 1,
                                  )
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
                              onPress={() => {
                                setTrainingBlockBuilder((prev) => ({
                                  ...prev,
                                  exercises: prev.exercises.filter(
                                    (ex) =>
                                      !(
                                        ex.exerciseId === exercise.exerciseId &&
                                        ex.day === exercise.day &&
                                        ex.order === exercise.order
                                      ),
                                  ),
                                }));
                              }}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1">
                          <div className="flex flex-col gap-2 p-2">
                            {exercise.sets &&
                              exercise.sets.map((target, setIdx) => (
                                <div
                                  key={`target-${exercise.exerciseId}-${exercise.day}-${exercise.order || 0}-${setIdx}`}
                                  className="flex gap-2 items-center"
                                >
                                  <div className="hover:bg-background transition-colors duration-150 w-full">
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-1 gap-3">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-backgroundSecondary rounded-lg border border-border w-full">
                                          <div className="text-sm font-medium text-text">
                                            Set {setIdx + 1}
                                          </div>
                                          <div className="flex items-center gap-1 sm:gap-2 flex-1">
                                            <Input
                                              size="sm"
                                              label="Reps"
                                              type="number"
                                              min={1}
                                              max={30}
                                              value={
                                                Number.isFinite(target.reps)
                                                  ? target.reps.toString()
                                                  : ''
                                              }
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                              onValueChange={(e) => {
                                                const num = Number(e);
                                                setTrainingBlockBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) => {
                                                    if (
                                                      ex.exerciseId === exercise.exerciseId &&
                                                      ex.day === selectedDay &&
                                                      ex.order === exercise.order
                                                    ) {
                                                      return {
                                                        ...ex,
                                                        sets: ex.sets.map((t, j) =>
                                                          j === setIdx
                                                            ? {
                                                                ...t,
                                                                reps: isNaN(num) ? 0 : num,
                                                              }
                                                            : t,
                                                        ),
                                                      };
                                                    }
                                                    return ex;
                                                  }),
                                                }));
                                              }}
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
                                              value={
                                                Number.isFinite(target.rpe)
                                                  ? target.rpe.toString()
                                                  : ''
                                              }
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                              onValueChange={(e) => {
                                                const num = Number(e);
                                                if (num > 10) return;
                                                setTrainingBlockBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) => {
                                                    if (
                                                      ex.exerciseId === exercise.exerciseId &&
                                                      ex.day === selectedDay &&
                                                      ex.order === exercise.order
                                                    ) {
                                                      return {
                                                        ...ex,
                                                        sets: ex.sets.map((t, j) =>
                                                          j === setIdx
                                                            ? {
                                                                ...t,
                                                                rpe: isNaN(num) ? 0 : num,
                                                              }
                                                            : t,
                                                        ),
                                                      };
                                                    }
                                                    return ex;
                                                  }),
                                                }));
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
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
                                onPress={() => {
                                  setModalModifier({
                                    day: exercise.day,
                                    exerciseId: exercise.exerciseId,
                                    order: exercise.order,
                                  });
                                }}
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
                                        modifiersData?.modifiers?.find((m) => m.id === modifier)
                                          ?.name,
                                    )
                                    .join(', ')}
                                </div>
                              ) : (
                                <div className="text-text text-center text-sm">No modifiers</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
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
                    onPress={() => {
                      setOnTarget(true);
                    }}
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
                      onPress={() => {
                        setAssignExdrawer(false);
                        setOnTarget(false);
                        setSelectedDay(1);
                        setSearchExercisesTerm('');
                      }}
                    >
                      Done
                    </Button>
                  </div>
                )}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Modal
            className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
            isOpen={deployModal.mode !== ''}
            onOpenChange={(isOpen) => setDeployModal({ mode: deployModal.mode, isOpen: !isOpen, day: deployModal.day })}
            size="2xl"
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            hideCloseButton
          >
            <ModalContent>
              <ModalHeader className="flex justify-between items-center gap-4">
                <div className="text-2xl font-semibold text-text">Select Day</div>
                <Button
                  isIconOnly
                  variant="solid"
                  color="danger"
                  onPress={() => setDeployModal({ mode: '', isOpen: false, day: 0 })}
                >
                  <FaTimes />
                </Button>
              </ModalHeader>

              <ModalBody className="py-4">
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {Array.from({ length: 7 }).map((_, index) => {
                    const dayList = index + 1;
                    return (
                      <Button
                        key={dayList}
                        variant="bordered"
                        color="primary"
                        onPress={() => {
                          if (deployModal.mode === 'copy') {
                            handleCopyDay(deployModal.day, dayList);
                          } else if (deployModal.mode === 'move') {
                            handleMoveExercise(deployModal.day, dayList);
                          }
                        }}
                      >
                        Day {dayList}
                      </Button>
                    );
                  })}
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>

          <ModifierSelector
            isOpen={modalModifier?.day !== 0 && modalModifier?.exerciseId !== ''}
            onClose={() => setModalModifier({ day: 0, exerciseId: '', order: 0 })}
            day={modalModifier?.day ?? 0}
            exerciseId={modalModifier?.exerciseId ?? ''}
            order={modalModifier?.order ?? 0}
            selectedModifiers={trainingBlockBuilder.exercises
              .filter(
                (ex) =>
                  ex.day === modalModifier?.day &&
                  ex.exerciseId === modalModifier?.exerciseId &&
                  ex.order === modalModifier?.order,
              )
              .flatMap((ex) => ex.modifiers ?? [])}
            onModifierChange={handleModifierChange}
          />
        </>
      )}
    </PageWrapper>
  );
};

const CreateTrainingBlockContent = CreateTrainingBlock;

export default function CreateTrainingBlockPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <CreateTrainingBlockContent />
    </Suspense>
  );
}
