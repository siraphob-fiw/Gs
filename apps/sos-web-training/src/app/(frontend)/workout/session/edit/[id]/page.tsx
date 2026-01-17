'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import {
  Accordion,
  AccordionItem,
  addToast,
  Button,
  Card,
  CardBody,
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
} from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { useExercises } from '@/hooks/api/use-exercises';
import {
  FaArrowUp,
  FaArrowDown,
  FaEdit,
  FaMinus,
  FaPlus,
  FaTimes,
  FaWrench,
} from 'react-icons/fa';
import { useRouter, useParams } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { FaEllipsis } from 'react-icons/fa6';
import { useModifiers, useModifierCategories } from '@/hooks/api/use-modifier';
import { generateModifiedExerciseName } from '@/utils/exercise-name-modifier';
import {
  useBulkCalculateWeight,
  useCalculateWeight,
  useTrainingSession,
  useUpdateTrainingSession,
} from '@/hooks/api/use-training-session';
import { useDebounce } from '@/hooks/api/use-debounce';
import { ModifierSelector } from '@/components/forms/ModifierSelector';
import { TrainingSessionBuilder } from '@/types/global';
import { FaTrash } from 'react-icons/fa';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useCalculateWorkoutSummary } from '@/hooks/api/use-training-blocks';
import dayjs from 'dayjs';

const initialTrainingSessionBuilder: TrainingSessionBuilder = {
  session_name: '',
  athlete_id: '',
  coach_id: '',
  date: [],
  exercises: [],
};

// Helper function to group exercises by date (like view page)
const groupExercisesByDate = (
  exercises: TrainingSessionBuilder['exercises'],
  startDate: string | undefined
) => {
  if (!Array.isArray(exercises) || !startDate) return { grouped: {}, order: [] };
  const map: Record<string, { key: string; exercises: TrainingSessionBuilder['exercises'] }> = {};

  exercises.forEach((ex) => {
    const exerciseDate = dayjs(startDate).add(ex.day - 1, 'day');
    const dateKey = exerciseDate.format('YYYY-MM-DD');
    const displayKey = exerciseDate.format('DD MMM YYYY');
    if (!map[dateKey]) map[dateKey] = { key: displayKey, exercises: [] };
    map[dateKey].exercises.push(ex);
  });

  // Sort exercises within each date by order
  Object.values(map).forEach((group) => {
    group.exercises.sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  const orderedDateKeys = Object.keys(map).sort((a, b) => dayjs(a).diff(dayjs(b)));
  return {
    grouped: Object.fromEntries(orderedDateKeys.map((key) => [map[key].key, map[key].exercises])),
    order: orderedDateKeys.map((key) => map[key].key),
  };
};

export const EditSessionPage = () => {
  const { state } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = typeof params === 'object' && params ? (params['id'] as string) : undefined;
  const { data: session, isLoading: isLoadingSession } = useTrainingSession(id as string);
  const { isAdmin, isCoach, isUser } = useRoleAccess();

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [trainingSessionBuilder, setTrainingSessionBuilder] = useState<TrainingSessionBuilder>(
    initialTrainingSessionBuilder,
  );
  const calculateSummaryMutation = useCalculateWorkoutSummary();
  const [dynamicSummary, setDynamicSummary] = useState<{
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
    csBalance: number;
    patterns: any[];
  } | null>(null);
  const [exerciseSummaries, setExerciseSummaries] = useState<any[]>([]);

  useEffect(() => {
    if (!session || !id || sessionLoaded) return;
    const sessionStartDate = session.startDate ? dayjs(session.startDate).format('YYYY-MM-DD') : null;
    const sessionEndDate = session.endDate ? dayjs(session.endDate).format('YYYY-MM-DD') : null;

    // Build exercises preserving original data
    const exercises = Array.isArray(session.exercises)
      ? session.exercises.map((exercise) => {
          let day = 1;
          if (exercise.exerciseDate && sessionStartDate) {
            const exerciseDate = dayjs(exercise.exerciseDate).format('YYYY-MM-DD');
            const diffDays = dayjs(exerciseDate).diff(dayjs(sessionStartDate), 'days');
            day = Math.max(1, Math.min(7, diffDays + 1));
          }
          return {
            exercise_id: exercise.exerciseId,
            exercise_name: exercise.exerciseName,
            day: day,
            order: exercise.order || 1,
            target: Array.isArray(exercise.target)
              ? exercise.target.map((target, index) => ({
                  sets: index + 1,
                  weight: target.weight || 0,
                  reps: target.reps,
                  rpe: target.rpe,
                }))
              : [],
            actual: Array.isArray(exercise.actual)
              ? exercise.actual.map((actual, index) => ({
                  sets: index + 1,
                  weight: actual.weight || 0,
                  reps: actual.reps || 0,
                  rpe: actual.rpe || 0,
                  central_stress: actual.central_stress || 0,
                  peripheral_stress: actual.peripheral_stress || 0,
                  total_stress: actual.total_stress || 0,
                }))
              : [],
            modifiers: Array.isArray(exercise.modifiers) ? exercise.modifiers : [],
            metrics: exercise.metrics || {
              e1rm: 0,
              nl: 0,
              tonnage: 0,
              total_stress: 0,
              peripheral_stress: 0,
              central_stress: 0,
            },
            notes: typeof exercise.notes === 'string' ? exercise.notes : '',
          };
        })
      : [];

    setTrainingSessionBuilder({
      ...initialTrainingSessionBuilder,
      session_name: session.sessionName,
      athlete_id: session.athleteId || '',
      coach_id: session.coachId || '',
      date: sessionStartDate && sessionEndDate
        ? [{ start_date: sessionStartDate, end_date: sessionEndDate }]
        : [],
      exercises: exercises as {
        exercise_id: string;
        exercise_name?: string;
        order: number;
        day: number;
        target: {
          sets: number;
          weight: number;
          reps: number;
          rpe: number;
        }[];
        actual: {
          sets: number;
          weight: number;
          reps: number;
          rpe: number;
          central_stress: number;
          peripheral_stress: number;
          total_stress: number;
        }[];
        modifiers: string[];
        metrics: {
          e1rm: number;
          nl: number;
          tonnage: number;
          total_stress: number;
          peripheral_stress: number;
          central_stress: number;
        };
        notes: string;
      }[],
    });
    setSessionLoaded(true);
  }, [session, sessionLoaded, id]);

  useEffect(() => {
    setError([]);
    setAssignExdrawer(false);
    setOnTarget(false);
    setSelectedDay(1);
    setSearchExercisesTerm('');
    setModalModifier(null);
    setSessionLoaded(false);
  }, [id]);

  const { data: exercisesData } = useExercises({ status: true, limit: 1000 });
  const updateTrainingSessionMutation = useUpdateTrainingSession();
  const calculateWeightMutation = useCalculateWeight();
  const bulkCalculateWeightMutation = useBulkCalculateWeight();
  const [assignExdrawer, setAssignExdrawer] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [deployModal, setDeployModal] = useState<{ isOpen: boolean; day: number }>({
    isOpen: false,
    day: 0,
  });
  const [moveModal, setMoveModal] = useState<{ isOpen: boolean; day: number }>({
    isOpen: false,
    day: 0,
  });
  const [onTarget, setOnTarget] = useState(false);
  const [error, setError] = useState<string[]>([]);

  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Workout Sessions', href: '/workout/session' },
    { label: 'Edit Workout Session' },
  ];

  const [modalModifier, setModalModifier] = useState<{
    day: number;
    exerciseId: string;
    order: number;
  } | null>(null);
  const { data: modifiersData } = useModifiers({ limit: 1000 });
  const { data: modifierCategoriesData } = useModifierCategories({ limit: 1000 });

  // Helper function to get modified exercise name based on modifiers
  const getModifiedExerciseName = useCallback(
    (exercise: TrainingSessionBuilder['exercises'][0]) => {
      if (!modifiersData?.modifiers || !modifierCategoriesData?.modifier_categories) {
        return exercise.exercise_name || 'Unknown Exercise';
      }
      return generateModifiedExerciseName(
        exercise.exercise_name || 'Unknown Exercise',
        exercise.modifiers || [],
        modifiersData.modifiers,
        modifierCategoriesData.modifier_categories,
      );
    },
    [modifiersData, modifierCategoriesData],
  );
  const [searchExercisesTerm, setSearchExercisesTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchExercisesTerm, 300);

  // Calculate dynamic summary based on current exercises in the builder
  useEffect(() => {
    if (
      !exercisesData?.exercises ||
      trainingSessionBuilder.exercises.length === 0
    ) {
      setDynamicSummary(null);
      setExerciseSummaries([]);
      return;
    }

    calculateSummaryMutation.mutate(
      {
        exercises: trainingSessionBuilder.exercises.map((ex) => ({
          exerciseId: ex.exercise_id,
          order: ex.order,
          day: ex.day,
          sets: (ex.target || []).map((t) => ({
            reps: t.reps,
            rpe: t.rpe,
          })),
          modifiers: ex.modifiers || [],
        })),
      },
      {
        onSuccess: (summary) => {
          setDynamicSummary({
            nl: summary.total.nl,
            totalStress: summary.total.total,
            centralStress: summary.total.central,
            peripheralStress: summary.total.peripheral,
            csBalance: summary.total.csBalance,
            patterns: summary.patterns,
          });
          setExerciseSummaries(summary.exercises);
        },
      },
    );
  }, [trainingSessionBuilder.exercises, exercisesData]);

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

  // Group exercises by date for display (like view page)
  const { grouped: groupedByDate, order: orderedDates } = useMemo(
    () => groupExercisesByDate(trainingSessionBuilder.exercises, trainingSessionBuilder.date[0]?.start_date),
    [trainingSessionBuilder.exercises, trainingSessionBuilder.date],
  );

  const handleSaveTrainingSession = async () => {
    setError([]);

    const validationChecks = [
      {
        field: 'session_name',
        valid: !!trainingSessionBuilder.session_name,
      },
      {
        field: 'exercises',
        valid: trainingSessionBuilder.exercises.length > 0,
      },
    ];

    const validationErrors = validationChecks
      .filter((check) => !check.valid)
      .map((check) => check.field);

    if (validationErrors.length > 0) {
      setError(validationErrors);
      return;
    }

    try {
      const startDateForExercises = trainingSessionBuilder.date[0]?.start_date;
      
      // Prepare all exercises with exerciseDate - using replaceAllExercises mode
      // This handles copy, move, add, delete, and edit operations correctly
      const exerciseUpdates = trainingSessionBuilder.exercises.map((exercise) => {
        const exerciseDate = startDateForExercises 
          ? dayjs(startDateForExercises).add(exercise.day - 1, 'day').format('YYYY-MM-DD')
          : '';
        return {
          exerciseId: exercise.exercise_id,
          order: exercise.order,
          exerciseDate: exerciseDate,
          targets: exercise.target,
          actual: exercise.actual,
          modifiers: exercise.modifiers,
          notes: exercise.notes,
          metrics: exercise.metrics,
        };
      });

      await updateTrainingSessionMutation.mutateAsync({
        id: id!,
        data: {
          sessionName: trainingSessionBuilder.session_name,
          exercises: exerciseUpdates,
          replaceAllExercises: true, // Replace all exercises with current state
        },
      });

      addToast({
        title: 'Training session updated successfully',
        color: 'success',
      });
      router.push(`/workout/session`);
    } catch (error) {
      console.error('Failed to update training session:', error);
      addToast({
        title: 'Failed to update training session',
        color: 'danger',
      });
    }
  };

  const handleAddSetToExercise = (exerciseId: string, order: number, sets: number) => {
    setTrainingSessionBuilder((prev) => {
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
  };

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
          athleteId: trainingSessionBuilder.athlete_id,
        });
        return result.weight;
      } catch (e) {
        console.error('Failed to recalculate weight:', e);
        return null;
      }
    },
    [calculateWeightMutation, trainingSessionBuilder.athlete_id],
  );

  const handleCopyDay = useCallback(
    (fromDay: number, toDay: number) => {
      setTrainingSessionBuilder((prev) => {
        // Get exercises to copy from the current state (not stale closure)
        const exercisesToCopy = prev.exercises.filter(
          (exercise) => exercise.day === fromDay,
        );
        
        // Remove exercises from target day and add copied ones
        return {
          ...prev,
          exercises: prev.exercises
            .filter((exercise) => exercise.day !== toDay)
            .concat(
              exercisesToCopy.map((exercise) => ({
                ...exercise,
                day: toDay,
              })),
            ),
        };
      });
      setDeployModal({ isOpen: false, day: 0 });
    },
    [],
  );

  const handleMoveToDay = useCallback(
    (fromDay: number, toDay: number) => {
      setTrainingSessionBuilder((prev) => {
        // Get exercises from both days
        const exercisesToMove = prev.exercises.filter((ex) => ex.day === fromDay);
        const exercisesAtTarget = prev.exercises.filter((ex) => ex.day === toDay);

        // If target day has exercises, swap them
        if (exercisesAtTarget.length > 0) {
          return {
            ...prev,
            exercises: prev.exercises.map((exercise) => {
              if (exercise.day === fromDay) {
                return { ...exercise, day: toDay };
              } else if (exercise.day === toDay) {
                return { ...exercise, day: fromDay };
              }
              return exercise;
            }),
          };
        } else {
          // Otherwise just move to target day
          return {
            ...prev,
            exercises: prev.exercises.map((exercise) =>
              exercise.day === fromDay ? { ...exercise, day: toDay } : exercise,
            ),
          };
        }
      });
      setMoveModal({ isOpen: false, day: 0 });
    },
    [],
  );

  const handleDeleteDay = (day: number) => {
    setTrainingSessionBuilder((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((exercise) => exercise.day !== day),
    }));
  };

  const handleAssignExercises = (day: number) => {
    setSelectedDay(day);
    setAssignExdrawer(true);
  };

  const handleMoveExercise = (oldDay: number, newDay: number) => {
    setTrainingSessionBuilder((prev) => {
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
  };

  const handleModifierChange = useCallback(
    (day: number, exerciseId: string, order: number, modifierId: string, categoryId?: string) => {
      setTrainingSessionBuilder((prev) => {
        return {
          ...prev,
          exercises: prev.exercises.map((exercise) => {
            if (
              exercise.day !== day ||
              exercise.exercise_id !== exerciseId ||
              exercise.order !== order
            )
              return exercise;

            if (modifierId === '' && categoryId) {
              return {
                ...exercise,
                modifiers: (exercise.modifiers ?? []).filter((modId) => {
                  const existingModifier = modifiersData?.modifiers?.find((m) => m.id === modId);
                  return existingModifier?.modifier_category_id !== categoryId;
                }),
              };
            }

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

  const handleMultiModifierChange = useCallback(
    (day: number, exerciseId: string, order: number, modifierIds: string[], categoryId: string) => {
      setTrainingSessionBuilder((prev) => {
        return {
          ...prev,
          exercises: prev.exercises.map((exercise) => {
            if (
              exercise.day !== day ||
              exercise.exercise_id !== exerciseId ||
              exercise.order !== order
            )
              return exercise;

            const filteredModifiers = (exercise.modifiers ?? []).filter((modId) => {
              const existingModifier = modifiersData?.modifiers?.find((m) => m.id === modId);
              return existingModifier?.modifier_category_id !== categoryId;
            });

            return {
              ...exercise,
              modifiers: [...filteredModifiers, ...modifierIds],
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
    setTrainingSessionBuilder((prev) => {
      const exToSwap = prev.exercises.find(
        (exercise) => exercise.exercise_id === exerciseId && exercise.day === targetDay,
      );
      if (!exToSwap) return prev;
      
      const targetSwapOrder = direction === 'up' ? exToSwap.order - 1 : exToSwap.order + 1;
      
      return {
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
      };
    });
  };

  if (isLoadingSession || !sessionLoaded) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <div className="flex flex-col items-center gap-6 p-12">
          <div className="text-2xl font-semibold text-text">Loading session...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4 p-4 rounded-md bg-backgroundSecondary border border-border">
        <div className="flex flex-col sm:flex-row justify-between gap-y-2">
          <h1 className="text-2xl font-semibold text-text">Edit Workout Session</h1>
          <div className="flex justify-end gap-3">
            <Button
              variant="solid"
              color="primary"
              onPress={handleSaveTrainingSession}
              isLoading={updateTrainingSessionMutation.isPending}
            >
              Save Changes
            </Button>
            <Button
              variant="solid"
              color="danger"
              onPress={() => {
                router.push('/workout/session');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              classNames={{
                inputWrapper: 'border-border group-data-[focus=true]:border-text bg-background',
              }}
              variant="bordered"
              label="Training Session Name"
              value={trainingSessionBuilder.session_name}
              onChange={(e) => {
                setError((prev) => prev.filter((error) => error !== 'session_name'));
                setTrainingSessionBuilder((prev) => ({
                  ...prev,
                  session_name: e.target.value,
                }));
              }}
              isRequired
              isInvalid={error.includes('session_name')}
            />

            {/* Display session info (read-only) */}
            <div className="flex flex-col gap-2 p-3 bg-background rounded-lg border border-border">
              <div className="text-xs text-text">Session Period</div>
              <div className="text-text font-medium">
                {dayjs(trainingSessionBuilder.date[0]?.start_date).format('DD/MM/YYYY')} - {dayjs(trainingSessionBuilder.date[0]?.end_date).format('DD/MM/YYYY')}
              </div>
            </div>

            {/* Workout Summary */}
            {dynamicSummary && (
              <div className="w-full md:col-span-2">
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
                              {dynamicSummary.nl?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Peripheral:</span>
                            <span className="font-medium">
                              {dynamicSummary.peripheralStress?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Central:</span>
                            <span className="font-medium">
                              {dynamicSummary.centralStress?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-medium">
                              {dynamicSummary.totalStress?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>CS Balance:</span>
                            <span className="font-medium">
                              {dynamicSummary.csBalance?.toFixed(1) || 0}%
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Movement Patterns */}
                    {[
                      'Horizontal push',
                      'Vertical push',
                      'Horizontal pull',
                      'Vertical pull',
                      'Knee dominant',
                      'Hip dominant',
                    ].map((pattern) => {
                      const patternData = dynamicSummary?.patterns?.find(
                        (p: any) => p.type === pattern,
                      );
                      return (
                        <Card
                          key={pattern}
                          className="bg-background border border-border shadow-none"
                        >
                          <CardBody className="p-3">
                            <div className="text-sm text-text mb-2 text-center border-b border-border pb-1">
                              {pattern.replace('_', ' ').toLowerCase().charAt(0).toUpperCase() +
                                pattern.replace('_', ' ').toLowerCase().slice(1)}
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-text">
                              <div className="flex justify-between">
                                <span>NL:</span>
                                <span className="font-medium">
                                  {patternData?.nl?.toFixed(0) || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Peripheral:</span>
                                <span className="font-medium">
                                  {patternData?.peripheralStress?.toFixed(2) || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total:</span>
                                <span className="font-medium">
                                  {patternData?.totalStress?.toFixed(2) || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Central:</span>
                                <span className="font-medium">
                                  {patternData?.centralStress?.toFixed(2) || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>CS Balance:</span>
                                <span className="font-medium">
                                  {patternData?.csBalance?.toFixed(1) || 0}%
                                </span>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Exercises grouped by date - like view page */}
            <div className="w-full md:col-span-2">
              {orderedDates.length > 0 ? (
                <Accordion variant="splitted" defaultSelectedKeys="all" selectionMode="multiple" className="w-full px-0">
                  {orderedDates.map((dateStr, dateIndex) => {
                    const exercisesForDate = groupedByDate[dateStr] || [];
                    // Use the actual day from exercises, not dateIndex (which can be wrong if days are sparse)
                    const day = exercisesForDate.length > 0 ? exercisesForDate[0].day : dateIndex + 1;
                    return (
                      <AccordionItem
                        key={dateStr}
                        classNames={{ base: 'bg-surface px-2', title: 'text-text' }}
                        title={
                          <div className="text-text">
                            <span className="font-semibold">{dateStr}</span>
                            <span className="text-xs text-text ml-2">
                              ({dayjs(dateStr, 'DD MMM YYYY').format('dddd')})
                            </span>
                            <span className="text-xs text-textSecondary ml-2">
                              - {exercisesForDate.length} exercise{exercisesForDate.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        }
                      >
                        {/* Day action buttons */}
                        <div className="flex gap-2 mb-3 justify-end">
                          <Button
                            variant="solid"
                            size="sm"
                            color="primary"
                            onPress={() => {
                              if (exercisesForDate.length > 0) {
                                setOnTarget(true);
                              }
                              handleAssignExercises(day);
                            }}
                            startContent={exercisesForDate.length > 0 ? <FaEdit /> : <FaPlus />}
                          >
                            {exercisesForDate.length > 0 ? 'Edit Exercises' : 'Add Exercises'}
                          </Button>
                          {exercisesForDate.length > 0 && (
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
                                  className="bg-background text-text"
                                >
                                  <FaEllipsis />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  variant="bordered"
                                  key="copy-day"
                                  onPress={() => setDeployModal({ isOpen: true, day })}
                                >
                                  Copy Day
                                </DropdownItem>
                                <DropdownItem
                                  variant="bordered"
                                  key="move-day"
                                  onPress={() => setMoveModal({ isOpen: true, day })}
                                >
                                  Move Day
                                </DropdownItem>
                                <DropdownItem
                                  variant="bordered"
                                  key="delete-day"
                                  onPress={() => handleDeleteDay(day)}
                                >
                                  Delete Exercises
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          )}
                        </div>
                        <div className="flex flex-col gap-3">
                          {exercisesForDate.map((exercise, exerciseIndex) => (
                            <Card
                              key={`exercise-card-${exercise.exercise_id}-${exercise.day}-${exercise.order || exerciseIndex}`}
                              className="bg-backgroundSecondary border border-border p-2"
                              isBlurred
                            >
                              <CardBody className="text-text space-y-2 p-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-lg font-medium">
                                    {getModifiedExerciseName(exercise)}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      isIconOnly
                                      variant="bordered"
                                      size="sm"
                                      color="primary"
                                      isDisabled={exerciseIndex === 0}
                                      onPress={() =>
                                        handleReorderExercise(exercise.exercise_id, 'up', exercise.day)
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
                                      isDisabled={exerciseIndex === exercisesForDate.length - 1}
                                      onPress={() =>
                                        handleReorderExercise(exercise.exercise_id, 'down', exercise.day)
                                      }
                                      title="Move down"
                                    >
                                      <FaArrowDown />
                                    </Button>
                                    <Dropdown>
                                      <DropdownTrigger>
                                        <Button isIconOnly variant="solid" color="primary" size="sm">
                                          <FaEllipsis />
                                        </Button>
                                      </DropdownTrigger>
                                      <DropdownMenu>
                                        <DropdownItem
                                          textValue="Edit Exercise"
                                          key="edit-exercise"
                                          onPress={() => {
                                            setSelectedDay(exercise.day);
                                            setOnTarget(true);
                                            setAssignExdrawer(true);
                                          }}
                                        >
                                          Edit Exercise
                                        </DropdownItem>
                                        <DropdownItem
                                          textValue="Edit Modifiers"
                                          key="edit-modifiers"
                                          onPress={() =>
                                            setModalModifier({
                                              day: exercise.day,
                                              exerciseId: exercise.exercise_id,
                                              order: exercise.order,
                                            })
                                          }
                                        >
                                          Edit Modifiers
                                        </DropdownItem>
                                      </DropdownMenu>
                                    </Dropdown>
                                  </div>
                                </div>
                                <Divider className="border-solid border-border" />
                                <div className="flex flex-col gap-2 w-full">
                                  {/* Header row */}
                                  <div className="flex items-center gap-2">
                                    <span className="flex-1 text-center font-medium text-text">Target</span>
                                    <span className="w-8"></span>
                                    <span className="flex-1 text-center font-medium text-text">Actual</span>
                                  </div>
                                  {/* Sets rows */}
                                  <div className="flex flex-col gap-2">
                                    {exercise.target.map((targetSet, setIndex) => {
                                      const actualSet = exercise.actual?.[setIndex] || {
                                        sets: setIndex + 1,
                                        weight: 0,
                                        reps: 0,
                                        rpe: 0,
                                      };
                                      return (
                                        <div
                                          key={`${exercise.exercise_id}-${exercise.day}-${exercise.order}-set-${setIndex}`}
                                          className="flex items-center gap-1 p-2 bg-background rounded-lg border border-border"
                                        >
                                          {/* Target inputs */}
                                          <div className="flex items-center gap-1 flex-1">
                                            <Input
                                              size="sm"
                                              label="Weight"
                                              type="number"
                                              min={0}
                                              step="any"
                                              inputMode="decimal"
                                              value={Number.isFinite(targetSet.weight) ? targetSet.weight.toString() : ''}
                                              onValueChange={(val) => {
                                                const num = parseFloat(val);
                                                setTrainingSessionBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) =>
                                                    ex.exercise_id === exercise.exercise_id &&
                                                    ex.day === exercise.day &&
                                                    ex.order === exercise.order
                                                      ? {
                                                          ...ex,
                                                          target: ex.target.map((t, i) =>
                                                            i === setIndex ? { ...t, weight: isNaN(num) ? 0 : num } : t
                                                          ),
                                                        }
                                                      : ex
                                                  ),
                                                }));
                                              }}
                                              endContent={<span className="text-text text-xs">kgs</span>}
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                            />
                                            <span className="text-text font-medium">×</span>
                                            <Input
                                              size="sm"
                                              label="Reps"
                                              type="number"
                                              min={1}
                                              max={30}
                                              value={Number.isFinite(targetSet.reps) ? targetSet.reps.toString() : ''}
                                              onValueChange={(val) => {
                                                const num = parseInt(val);
                                                setTrainingSessionBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) =>
                                                    ex.exercise_id === exercise.exercise_id &&
                                                    ex.day === exercise.day &&
                                                    ex.order === exercise.order
                                                      ? {
                                                          ...ex,
                                                          target: ex.target.map((t, i) =>
                                                            i === setIndex ? { ...t, reps: isNaN(num) ? 0 : num } : t
                                                          ),
                                                        }
                                                      : ex
                                                  ),
                                                }));
                                              }}
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                            />
                                            <span className="text-text font-medium">@</span>
                                            <Input
                                              size="sm"
                                              label="RPE"
                                              type="number"
                                              min={1}
                                              max={10}
                                              step="any"
                                              inputMode="decimal"
                                              value={Number.isFinite(targetSet.rpe) ? targetSet.rpe.toString() : ''}
                                              onValueChange={(val) => {
                                                const num = parseFloat(val);
                                                setTrainingSessionBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) =>
                                                    ex.exercise_id === exercise.exercise_id &&
                                                    ex.day === exercise.day &&
                                                    ex.order === exercise.order
                                                      ? {
                                                          ...ex,
                                                          target: ex.target.map((t, i) =>
                                                            i === setIndex ? { ...t, rpe: isNaN(num) ? 0 : num } : t
                                                          ),
                                                        }
                                                      : ex
                                                  ),
                                                }));
                                              }}
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                            />
                                          </div>
                                          {/* Arrow separator */}
                                          <div className="w-8 flex justify-center">
                                            <span className="text-text font-medium">→</span>
                                          </div>
                                          {/* Actual inputs */}
                                          <div className="flex items-center gap-1 flex-1">
                                            <Input
                                              size="sm"
                                              label="Weight"
                                              type="number"
                                              min={0}
                                              step="any"
                                              inputMode="decimal"
                                              value={Number.isFinite(actualSet.weight) ? actualSet.weight.toString() : ''}
                                              onValueChange={(val) => {
                                                const num = parseFloat(val);
                                                setTrainingSessionBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) => {
                                                    if (
                                                      ex.exercise_id === exercise.exercise_id &&
                                                      ex.day === exercise.day &&
                                                      ex.order === exercise.order
                                                    ) {
                                                      const newActual = [...(ex.actual || [])];
                                                      if (!newActual[setIndex]) {
                                                        newActual[setIndex] = {
                                                          sets: setIndex + 1,
                                                          weight: 0,
                                                          reps: 0,
                                                          rpe: 0,
                                                          central_stress: 0,
                                                          peripheral_stress: 0,
                                                          total_stress: 0,
                                                        };
                                                      }
                                                      newActual[setIndex] = { ...newActual[setIndex], weight: isNaN(num) ? 0 : num };
                                                      return { ...ex, actual: newActual };
                                                    }
                                                    return ex;
                                                  }),
                                                }));
                                              }}
                                              endContent={<span className="text-text text-xs">kgs</span>}
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                            />
                                            <span className="text-text font-medium">×</span>
                                            <Input
                                              size="sm"
                                              label="Reps"
                                              type="number"
                                              min={1}
                                              max={30}
                                              value={Number.isFinite(actualSet.reps) ? actualSet.reps.toString() : ''}
                                              onValueChange={(val) => {
                                                const num = parseInt(val);
                                                setTrainingSessionBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) => {
                                                    if (
                                                      ex.exercise_id === exercise.exercise_id &&
                                                      ex.day === exercise.day &&
                                                      ex.order === exercise.order
                                                    ) {
                                                      const newActual = [...(ex.actual || [])];
                                                      if (!newActual[setIndex]) {
                                                        newActual[setIndex] = {
                                                          sets: setIndex + 1,
                                                          weight: 0,
                                                          reps: 0,
                                                          rpe: 0,
                                                          central_stress: 0,
                                                          peripheral_stress: 0,
                                                          total_stress: 0,
                                                        };
                                                      }
                                                      newActual[setIndex] = { ...newActual[setIndex], reps: isNaN(num) ? 0 : num };
                                                      return { ...ex, actual: newActual };
                                                    }
                                                    return ex;
                                                  }),
                                                }));
                                              }}
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                            />
                                            <span className="text-text font-medium">@</span>
                                            <Input
                                              size="sm"
                                              label="RPE"
                                              type="number"
                                              min={1}
                                              max={10}
                                              step="any"
                                              inputMode="decimal"
                                              value={Number.isFinite(actualSet.rpe) ? actualSet.rpe.toString() : ''}
                                              onValueChange={(val) => {
                                                const num = parseFloat(val);
                                                setTrainingSessionBuilder((prev) => ({
                                                  ...prev,
                                                  exercises: prev.exercises.map((ex) => {
                                                    if (
                                                      ex.exercise_id === exercise.exercise_id &&
                                                      ex.day === exercise.day &&
                                                      ex.order === exercise.order
                                                    ) {
                                                      const newActual = [...(ex.actual || [])];
                                                      if (!newActual[setIndex]) {
                                                        newActual[setIndex] = {
                                                          sets: setIndex + 1,
                                                          weight: 0,
                                                          reps: 0,
                                                          rpe: 0,
                                                          central_stress: 0,
                                                          peripheral_stress: 0,
                                                          total_stress: 0,
                                                        };
                                                      }
                                                      newActual[setIndex] = { ...newActual[setIndex], rpe: isNaN(num) ? 0 : num };
                                                      return { ...ex, actual: newActual };
                                                    }
                                                    return ex;
                                                  }),
                                                }));
                                              }}
                                              classNames={{
                                                inputWrapper:
                                                  'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                                label: 'text-text text-sm',
                                                input: 'text-text',
                                              }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {exercise.modifiers && exercise.modifiers.length > 0 && (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-text">Modifiers</span>
                                    <div className="text-sm text-textSecondary">
                                      {exercise.modifiers
                                        .map(
                                          (modId) =>
                                            modifiersData?.modifiers?.find((m) => m.id === modId)?.name,
                                        )
                                        .filter(Boolean)
                                        .join(', ') || 'None'}
                                    </div>
                                  </div>
                                )}
                                {exercise.notes && (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-text">Notes</span>
                                    <div className="text-sm text-textSecondary">{exercise.notes}</div>
                                  </div>
                                )}
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-textSecondary">
                  <p className="text-lg mb-4">No exercises added yet</p>
                  <Button
                    variant="solid"
                    color="primary"
                    onPress={() => handleAssignExercises(1)}
                  >
                    <FaPlus className="mr-2" /> Add Exercises
                  </Button>
                </div>
              )}
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
              Edit Exercises (Day {selectedDay})
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
                  <div className="flex gap-2 items-center">
                    {trainingSessionBuilder.exercises.filter(
                      (exercise) => exercise.day === selectedDay,
                    ).length > 0 && (
                      <Button
                        isIconOnly
                        variant="bordered"
                        size="sm"
                        color="danger"
                        onPress={() => {
                          setTrainingSessionBuilder((prev) => ({
                            ...prev,
                            exercises: prev.exercises.filter(
                              (exercise) => exercise.day !== selectedDay,
                            ),
                          }));
                          setSearchExercisesTerm('');
                        }}
                        title="Clear all exercises for this day"
                      >
                        <FaTrash />
                      </Button>
                    )}
                    <span className="text-sm text-text bg-background px-2 py-1 rounded border border-border">
                      {
                        trainingSessionBuilder.exercises.filter(
                          (exercise) => exercise.day === selectedDay,
                        ).length
                      }{' '}
                      selected
                    </span>
                  </div>
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
                        return (
                          <Button
                            key={exercise.id}
                            variant="bordered"
                            color="primary"
                            onPress={() => {
                              setTrainingSessionBuilder((prev) => {
                                const exercisesForDay = prev.exercises.filter(
                                  (ex) => ex.day === selectedDay,
                                );
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
                            }}
                            className="text-text"
                          >
                            {exercise.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {trainingSessionBuilder.exercises
                  .filter((exercise) => exercise.day === selectedDay)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((exercise, index) => (
                    <div
                      key={`target-${exercise.exercise_id}-${exercise.day}-${exercise.order || index}`}
                      className="mb-4 border border-border rounded-lg bg-backgroundSecondary"
                    >
                      <div className="flex gap-2 items-center px-4 py-2 border-b border-border">
                        <div className="flex gap-2 flex-1">
                          <div className="text-lg font-semibold text-text">
                            {getModifiedExerciseName(exercise)}
                          </div>
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
                                handleAddSetToExercise(
                                  exercise.exercise_id,
                                  exercise.order,
                                  exercise.target.length + 1,
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
                                  exercise.exercise_id,
                                  exercise.order,
                                  exercise.target.length - 1,
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
                              setTrainingSessionBuilder((prev) => {
                                // Remove the exercise
                                const filteredExercises = prev.exercises.filter(
                                  (ex) =>
                                    !(
                                      ex.exercise_id === exercise.exercise_id &&
                                      ex.day === exercise.day &&
                                      ex.order === exercise.order
                                    ),
                                );
                                
                                // Renumber remaining exercises for the same day to avoid order gaps
                                const dayExercises = filteredExercises
                                  .filter((ex) => ex.day === exercise.day)
                                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                                
                                const renumberedExercises = filteredExercises.map((ex) => {
                                  if (ex.day === exercise.day) {
                                    const newOrder = dayExercises.findIndex(
                                      (de) => de.exercise_id === ex.exercise_id && de.order === ex.order
                                    ) + 1;
                                    return { ...ex, order: newOrder };
                                  }
                                  return ex;
                                });
                                
                                return {
                                  ...prev,
                                  exercises: renumberedExercises,
                                };
                              });
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1">
                        <div className="flex flex-col gap-2 px-4 py-2">
                          {exercise.target &&
                            exercise.target.map((target, setIdx) => (
                              <div
                                key={`target-${exercise.exercise_id}-${exercise.day}-${exercise.order || 0}-${setIdx}`}
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
                                            label="Weight"
                                            type="number"
                                            min={0.1}
                                            step="any"
                                            inputMode="decimal"
                                            value={
                                              Number.isFinite(target.weight)
                                                ? target.weight.toString()
                                                : ''
                                            }
                                            endContent={
                                              <span className="text-surface text-xs">kgs</span>
                                            }
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            onValueChange={(e) => {
                                              const num = parseFloat(e);
                                              setTrainingSessionBuilder((prev) => ({
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
                                                              weight: isNaN(num) ? 0 : num,
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
                                          <span className="text-text font-medium">×</span>
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
                                            onValueChange={async (e) => {
                                              const num = Number(e);
                                              const newReps = isNaN(num) ? 0 : num;
                                              const currentSet = exercise.target[setIdx];
                                              const currentRpe = currentSet?.rpe ?? 0;

                                              let newWeight = currentSet?.weight ?? 0;
                                              if (
                                                newReps > 0 &&
                                                currentRpe > 0 &&
                                                currentRpe <= 10
                                              ) {
                                                const calculatedWeight =
                                                  await handleRecalculateWeightForSet(
                                                    exercise.exercise_id,
                                                    newReps,
                                                    currentRpe,
                                                  );
                                                if (calculatedWeight !== null) {
                                                  newWeight = calculatedWeight;
                                                }
                                              }

                                              setTrainingSessionBuilder((prev) => ({
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
                                            }}
                                          />
                                          <span className="text-text font-medium">@</span>
                                          <Input
                                            size="sm"
                                            label="RPE"
                                            type="number"
                                            min={1.0}
                                            max={10.0}
                                            step="any"
                                            inputMode="decimal"
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
                                            onValueChange={async (e) => {
                                              let newRpe = Number(e);
                                              if (isNaN(newRpe) || newRpe < 1 || newRpe > 10) {
                                                newRpe = 0;
                                              }
                                              const currentSet = exercise.target[setIdx];
                                              const currentReps = currentSet?.reps ?? 0;

                                              let newWeight = currentSet?.weight ?? 0;
                                              if (currentReps > 0 && newRpe > 0 && newRpe <= 10) {
                                                const calculatedWeight =
                                                  await handleRecalculateWeightForSet(
                                                    exercise.exercise_id,
                                                    currentReps,
                                                    newRpe,
                                                  );
                                                if (calculatedWeight !== null) {
                                                  newWeight = calculatedWeight;
                                                }
                                              }

                                              setTrainingSessionBuilder((prev) => ({
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
                              onPress={() =>
                                setModalModifier({
                                  day: exercise.day,
                                  exerciseId: exercise.exercise_id,
                                  order: exercise.order,
                                })
                              }
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

      {/* Copy Day Modal */}
      <Modal
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
        isOpen={deployModal.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeployModal({ isOpen: false, day: 0 });
          }
        }}
        size="2xl"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        hideCloseButton
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center gap-4">
            <div className="text-2xl font-semibold text-text">Copy to Day</div>
            <Button
              isIconOnly
              variant="solid"
              color="danger"
              onPress={() => setDeployModal({ isOpen: false, day: 0 })}
            >
              <FaTimes />
            </Button>
          </ModalHeader>
          <ModalBody className="py-4">
            <div className="flex flex-wrap justify-center items-center gap-2">
              {Array.from({ length: 7 }).map((_, index) => {
                const targetDay = index + 1;
                const daysWithExercises = new Set(
                  trainingSessionBuilder.exercises.map((ex) => ex.day),
                );
                const isDisabled =
                  targetDay === deployModal.day ||
                  (daysWithExercises.size >= 4 && !daysWithExercises.has(targetDay));
                return (
                  <Button
                    key={targetDay}
                    variant="bordered"
                    color={targetDay === deployModal.day ? 'success' : 'primary'}
                    isDisabled={isDisabled}
                    onPress={() => handleCopyDay(deployModal.day, targetDay)}
                  >
                    Day {targetDay}
                  </Button>
                );
              })}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Move Day Modal */}
      <Modal
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
        isOpen={moveModal.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setMoveModal({ isOpen: false, day: 0 });
          }
        }}
        size="2xl"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        hideCloseButton
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center gap-4">
            <div className="text-2xl font-semibold text-text">Move to Day</div>
            <Button
              isIconOnly
              variant="solid"
              color="danger"
              onPress={() => setMoveModal({ isOpen: false, day: 0 })}
            >
              <FaTimes />
            </Button>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-textSecondary text-center mb-4">
              Move all exercises from Day {moveModal.day} to another day. If the target day has exercises, they will be swapped.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {Array.from({ length: 7 }).map((_, index) => {
                const targetDay = index + 1;
                const isSourceDay = targetDay === moveModal.day;
                const hasExercises = trainingSessionBuilder.exercises.some((ex) => ex.day === targetDay);
                return (
                  <Button
                    key={targetDay}
                    variant="bordered"
                    color={isSourceDay ? 'success' : hasExercises ? 'warning' : 'primary'}
                    isDisabled={isSourceDay}
                    onPress={() => handleMoveToDay(moveModal.day, targetDay)}
                  >
                    Day {targetDay}
                    {hasExercises && !isSourceDay && ' (swap)'}
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
        selectedModifiers={trainingSessionBuilder.exercises
          .filter(
            (ex) =>
              ex.day === modalModifier?.day &&
              ex.exercise_id === modalModifier?.exerciseId &&
              ex.order === modalModifier?.order,
          )
          .flatMap((ex) => ex.modifiers ?? [])}
        onModifierChange={handleModifierChange}
        onMultiModifierChange={handleMultiModifierChange}
      />
    </PageWrapper>
  );
};

const EditSessionPageContent = EditSessionPage;

export default function EditSessionPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <EditSessionPageContent />
    </Suspense>
  );
}
