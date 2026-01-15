'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import {
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
  SelectItem,
} from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { useExercises } from '@/hooks/api/use-exercises';
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaEdit,
  FaMinus,
  FaPlus,
  FaTimes,
  FaWrench,
} from 'react-icons/fa';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { useRouter, useParams } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { RelationshipStatus, UserRole, UserStatus } from '@strengthos/shared-types';
import { FaEllipsis } from 'react-icons/fa6';
import { useModifiers, useModifierCategories } from '@/hooks/api/use-modifier';
import { generateModifiedExerciseName } from '@/utils/exercise-name-modifier';
import {
  useBulkCalculateWeight,
  useCalculateWeight,
  useCreateTrainingSession,
  useTrainingSession,
} from '@/hooks/api/use-training-session';
import { useCoachClients } from '@/hooks/api/use-coach-clients';
import { UserResponse, useUsers } from '@/hooks/api/use-users';
import { useIsMobile } from '@/hooks/api/use-screen-utils';
import { useDebounce } from '@/hooks/api/use-debounce';
import { ModifierSelector } from '@/components/forms/ModifierSelector';
import { TrainingSessionBuilder } from '@/types/global';
import { WeekSelectionCalendar } from '@/components/forms/WeekSelectionCalendar';
import { FaTrash } from 'react-icons/fa';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useCalculateWorkoutSummary } from '@/hooks/api/use-training-blocks';
import { prepareSessionsForDeployment } from '@/utils/session-utils';
import dayjs from 'dayjs';

const initialTrainingSessionBuilder: TrainingSessionBuilder = {
  session_name: '',
  athlete_id: '',
  coach_id: '',
  date: [],
  exercises: [],
};

export const DuplicateSessionPage = () => {
  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  const params = useParams();
  const id = typeof params === 'object' && params ? params['id'] : undefined;
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
    const athleteId = isUser() ? user?.id || '' : isCoach() ? session.athleteId || '' : '';

    // Build exercises with initial weight = 0, then recalculate asynchronously
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
                  weight: 0,
                  reps: target.reps,
                  rpe: target.rpe,
                }))
              : [],
            actual: Array.isArray(exercise.actual)
              ? exercise.actual.map((actual, index) => ({
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
            notes: typeof exercise.notes === 'string' ? exercise.notes : '',
          };
        })
      : [];

    setTrainingSessionBuilder({
      ...initialTrainingSessionBuilder,
      session_name: session.sessionName + ' - copy',
      athlete_id: athleteId,
      coach_id: isCoach() ? user?.id || '' : session.coachId || '',
      exercises,
    });
    setSessionLoaded(true);

    if (athleteId && exercises.length > 0) {
      const recalculateWeights = async () => {
        // Flatten out all unique combinations of exercise_id, reps, and rpe for all targets that need calculation
        const bulkRequests: { exerciseId: string; reps: number; rpe: number }[] = [];

        exercises.forEach((exercise) => {
          exercise.target.forEach((target) => {
            if (
              target.reps > 0 &&
              target.rpe > 0 &&
              target.rpe <= 10
            ) {
              bulkRequests.push({
                exerciseId: exercise.exercise_id,
                reps: target.reps,
                rpe: target.rpe,
              });
            }
          });
        });

        // Remove duplicates based on exerciseId, reps, rpe
        const uniqueKey = (item: { exerciseId: string; reps: number; rpe: number }) =>
          `${item.exerciseId}-${item.reps}-${item.rpe}`;
        const seen = new Set<string>();
        const dedupedBulkRequests = bulkRequests.filter((item) => {
          const key = uniqueKey(item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        let bulkResults: { exerciseId: string; reps: number; rpe: number; weight: number; e1rm: number }[] = [];

        try {
          if (dedupedBulkRequests.length > 0) {
            const results = await bulkCalculateWeightMutation.mutateAsync({
              athleteId,
              data: dedupedBulkRequests,
            });
            // results may only include exerciseId, reps and rpe are not echoed, but group by {exerciseId, reps, rpe}
            // So we map back by index
            bulkResults = dedupedBulkRequests.map((req, idx) => ({
              exerciseId: req.exerciseId,
              reps: req.reps,
              rpe: req.rpe,
              weight: results[idx]?.weight ?? 0,
              e1rm: results[idx]?.e1rm ?? 0,
            }));
          }
        } catch (e) {
          console.error('Failed to bulk recalculate weights:', e);
        }

        // Create a lookup map for fast assignment
        const weightMap = new Map<string, number>();
        bulkResults.forEach(({ exerciseId, reps, rpe, weight }) => {
          weightMap.set(`${exerciseId}-${reps}-${rpe}`, weight);
        });

        const updatedExercises = exercises.map((exercise) => {
          const updatedTargets = exercise.target.map((target) => {
            if (
              target.reps > 0 &&
              target.rpe > 0 &&
              target.rpe <= 10
            ) {
              const key = `${exercise.exercise_id}-${target.reps}-${target.rpe}`;
              if (weightMap.has(key)) {
                return { ...target, weight: weightMap.get(key)! }
              }
            }
            return target;
          });
          return { ...exercise, target: updatedTargets };
        });

        setTrainingSessionBuilder((prev) => ({
          ...prev,
          exercises: updatedExercises,
        }));
      };

      recalculateWeights();
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('date');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, [session, sessionLoaded, user?.id, id]);

  useEffect(() => {
    setError([]);
    setAssignExdrawer(false);
    setOnTarget(false);
    setSelectedDay(1);
    setSearchExercisesTerm('');
    setModalModifier(null);
    setSessionLoaded(false);
  }, [id]);

  const { data: availableAthletes } = useCoachClients(
    isCoach()
      ? { coach_id: user?.id, status: RelationshipStatus.ACTIVE }
      : isAdmin()
        ? undefined
        : { athlete_id: user?.id, status: RelationshipStatus.ACTIVE },
  );
  const { data: exercisesData } = useExercises({ status: true, limit: 1000 });
  const createTrainingSessionMutation = useCreateTrainingSession();
  const calculateWeightMutation = useCalculateWeight();
  const bulkCalculateWeightMutation = useBulkCalculateWeight();
  const [assignExdrawer, setAssignExdrawer] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [deployModal, setDeployModal] = useState<{ isOpen: boolean; day: number }>({
    isOpen: false,
    day: 0,
  });
  const [onTarget, setOnTarget] = useState(false);
  const [error, setError] = useState<string[]>([]);
  const { data: coachesData } = isAdmin()
    ? useUsers({
        tenantId: user?.tenantId,
        status: UserStatus.ACTIVE,
      })
    : { data: undefined };

  const [availableCoaches, setAvailableCoaches] = useState<UserResponse[]>([]);
  useEffect(() => {
    if (coachesData?.users && Array.isArray(coachesData.users)) {
      setAvailableCoaches(coachesData.users.filter((e) => e.role === UserRole.COACH));
    }
  }, [coachesData]);
  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Workout Sessions', href: '/workout/session' },
    { label: 'Duplicate Workout Session' },
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

  const filteredAthletes = useMemo(() => {
    if (!availableAthletes || !Array.isArray(availableAthletes?.relationships)) {
      return [];
    }
    if (!trainingSessionBuilder.coach_id) {
      return [];
    }
    return availableAthletes.relationships.filter(
      (athlete) => athlete.coach_id === trainingSessionBuilder.coach_id,
    );
  }, [availableAthletes?.relationships, trainingSessionBuilder.coach_id]);

  const handleSaveTrainingSession = async () => {
    // Clear previous errors
    setError([]);

    const validationChecks = [
      {
        field: 'session_name',
        valid: !!trainingSessionBuilder.session_name,
      },
      {
        field: 'date',
        valid: !!trainingSessionBuilder.date && trainingSessionBuilder.date.length > 0,
      },
      {
        field: 'exercises',
        valid: trainingSessionBuilder.exercises.length > 0,
      },
      {
        field: 'athlete_id',
        valid: !!trainingSessionBuilder.athlete_id,
      },
      {
        field: 'coach_id',
        valid: !!trainingSessionBuilder.coach_id,
      },
    ];

    // Collect all validation errors
    const validationErrors = validationChecks
      .filter((check) => !check.valid)
      .map((check) => check.field);

    // If there are validation errors, set them and return early
    if (validationErrors.length > 0) {
      setError(validationErrors);
      console.log(validationErrors);
      return;
    }

    try {
          const coachId = isUser() ? null : isCoach() ? user?.id! : trainingSessionBuilder.coach_id;
          if (!isUser() && !coachId) {
            setError(['coach_id']);
            return;
          }
    
          const sessions = prepareSessionsForDeployment(trainingSessionBuilder, coachId);
    
          let successCount = 0;
          let errorCount = 0;
          await Promise.all(
            sessions.map((session) =>
              createTrainingSessionMutation.mutateAsync(session, {
                onSuccess: () => {
                  successCount++;
                },
                onError: () => {
                  errorCount++;
                },
              }),
            ),
          );
    
          if (successCount > 0) {
            addToast({
              title: `${successCount} training session${successCount > 1 ? 's' : ''} created successfully`,
              color: 'success',
            });
            router.push(`/workout/session`);
          }
          if (errorCount > 0) {
            addToast({
              title: `${errorCount} training session${errorCount > 1 ? 's' : ''} failed to create`,
              color: 'danger',
            });
          }
        } catch (error) {
          console.error('Failed to create training session:', error);
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
      const exercisesToCopy = trainingSessionBuilder.exercises.filter(
        (exercise) => exercise.day === fromDay,
      );

      setTrainingSessionBuilder((prev) => ({
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
      setDeployModal({ isOpen: false, day: 0 });
    },
    [trainingSessionBuilder.exercises],
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

  // Handler for multi-select modifier categories (Load Accommodation, Kit, Other)
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

            // Remove all modifiers from this category, then add the new ones
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
    const dayToUse = targetDay;
    const exToSwap = trainingSessionBuilder.exercises.find(
      (exercise) => exercise.exercise_id === exerciseId && exercise.day === dayToUse,
    );
    if (!exToSwap) return;
    const targetSwapOrder = direction === 'up' ? exToSwap.order - 1 : exToSwap.order + 1;
    setTrainingSessionBuilder((prev) => ({
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

  const handleSelectAthlete = async (athleteId: string) => {
    const newAthleteId = athleteId || '';
    setTrainingSessionBuilder((prev) => {
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
                  const weight = await calculateWeightMutation.mutateAsync({
                    exerciseId: exercise.exercise_id,
                    reps: targetSet.reps,
                    rpe: targetSet.rpe,
                    athleteId: newAthleteId,
                  });
                  return { ...targetSet, weight: Number(weight) || 0 };
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
      setTrainingSessionBuilder((prev) => ({
        ...prev,
        exercises: updatedExercises,
      }));
    }
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
          <h1 className="text-2xl font-semibold text-text">Duplicate Workout Session</h1>
          <div className="flex justify-end gap-3">
            <Button
              variant="solid"
              color="primary"
              onPress={handleSaveTrainingSession}
              isLoading={createTrainingSessionMutation.isPending}
            >
              Duplicate & deploy
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
            {isAdmin() && (
              <SelectWithClassName
                fullWidth
                isRequired
                id="coach"
                label="Coach"
                isInvalid={error.includes('coach_id')}
                selectedKeys={
                  trainingSessionBuilder.coach_id ? [trainingSessionBuilder.coach_id] : []
                }
                onSelectionChange={(e) => {
                  setTrainingSessionBuilder((prev) => {
                    if (prev.athlete_id === '') {
                      const foundAthlete = availableAthletes?.relationships?.find(
                        (athlete) => athlete.coach_id === e.currentKey,
                      );
                      return {
                        ...prev,
                        coach_id: e.currentKey || '',
                        athlete_id: foundAthlete?.athlete_id || '',
                      };
                    } else {
                      return {
                        ...prev,
                        coach_id: e.currentKey || '',
                      };
                    }
                  });
                }}
                placeholder="Select Coach"
                classNames={{
                  trigger: 'bg-background border-border data-[open=true]:border-border',
                  label: 'text-text',
                  value: 'text-text group-data-[has-value=true]:text-text',
                }}
                selectorIconColor="text-text"
                children={availableCoaches.map((coach) => (
                  <SelectItem
                    key={coach.id}
                    textValue={`${coach.profile.firstName} ${coach.profile.lastName}`}
                  >
                    {coach.profile.firstName} {coach.profile.lastName}
                  </SelectItem>
                ))}
              />
            )}

            {isCoach() && (
              <SelectWithClassName
                fullWidth
                isRequired
                isInvalid={error.includes('athlete_id')}
                id="athlete"
                label="Athlete"
                selectedKeys={
                  trainingSessionBuilder.athlete_id ? [trainingSessionBuilder.athlete_id] : []
                }
                onSelectionChange={(e) => {
                  handleSelectAthlete(e.currentKey || '');
                }}
                placeholder="Select Athlete"
                classNames={{
                  trigger: 'bg-background border-border data-[open=true]:border-border',
                  label: 'text-text',
                  value: 'text-text group-data-[has-value=true]:text-text',
                }}
                selectorIconColor="text-text"
                children={filteredAthletes.map((athlete) => (
                  <SelectItem
                    key={athlete.athlete_id}
                    textValue={`${athlete.athlete_firstName} ${athlete.athlete_lastName}`}
                  >
                    {athlete.athlete_firstName} {athlete.athlete_lastName}
                  </SelectItem>
                ))}
              />
            )}

            {/* <SelectWithClassName
              fullWidth
              isRequired
              isInvalid={error.includes('athlete_id')}
              id="athlete"
              label="Athlete"
              selectedKeys={trainingSessionBuilder.athlete_id ? [trainingSessionBuilder.athlete_id] : []}
              onSelectionChange={(e) => {
                handleSelectAthlete(e.currentKey || '');
              }}
              placeholder="Select Athlete"
              classNames={{
                trigger: 'bg-background border-border data-[open=true]:border-border',
                label: 'text-text',
                value: 'text-text group-data-[has-value=true]:text-text',
              }}
              selectorIconColor="text-text"
              children={
                Array.isArray(availableAthletes?.relationships)
                  ? availableAthletes.relationships
                      .filter(
                        (athlete) =>
                          trainingSessionBuilder.coach_id === '' ||
                          trainingSessionBuilder.athlete_id === '' ||
                          athlete.coach_id === trainingSessionBuilder.coach_id
                      )
                      .map((athlete) => (
                        <SelectItem
                          key={athlete.athlete_id}
                          textValue={`${athlete.athlete_firstName} ${athlete.athlete_lastName}`}
                        >
                          {athlete.athlete_firstName} {athlete.athlete_lastName}
                        </SelectItem>
                      ))
                  : []
              }
            /> */}

            <WeekSelectionCalendar
              trainingSessionBuilder={trainingSessionBuilder}
              onChange={(date: { start: string, end: string }) => {
                const weekStart = date.start;
                const weekEnd = date.end;

                const isWeekSelected = trainingSessionBuilder.date.some((dateRange) => {
                  const rangeStartTime = dateRange.start_date;
                  const rangeEndTime = dateRange.end_date;
                  return rangeStartTime === weekStart && rangeEndTime === weekEnd;
                });

                setError((prev) => prev.filter((error) => error !== 'date'));

                if (isWeekSelected) {
                  setTrainingSessionBuilder((prev) => ({
                    ...prev,
                    date: prev.date.filter((dateRange) => {
                      const rangeStartTime = dateRange.start_date;
                      const rangeEndTime = dateRange.end_date;
                      return !(rangeStartTime === weekStart && rangeEndTime === weekEnd);
                    }),
                  }));
                } else {
                  setTrainingSessionBuilder((prev) => ({
                    ...prev,
                    date: [
                      ...prev.date,
                      {
                        start_date: weekStart,
                        end_date: weekEnd,
                      },
                    ],
                  }));
                }
              }}
              onRemoveWeek={(dateRange) => {
                setTrainingSessionBuilder((prev) => ({
                  ...prev,
                  date: prev.date.filter(
                    (date) =>
                      date.start_date !== dateRange.start_date &&
                      date.end_date !== dateRange.end_date,
                  ),
                }));
              }}
              error={error.includes('date')}
            />

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

            <div className="w-full md:col-span-2 overflow-x-auto">
              <div className="md:min-w-[1440px] grid grid-cols-1 md:grid-cols-7 gap-2 mb-2">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const day = dayIdx + 1;
                  return (
                    <div
                      key={'day-' + day}
                      className="bg-backgroundSecondary border border-border rounded-md p-2 flex-shrink-0"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col items-center gap-2">
                          <div className="font-semibold text-text">Day {day}</div>
                          <div className="w-full flex gap-1 justify-end">
                            <Button
                              isIconOnly
                              variant="solid"
                              size="sm"
                              className="bg-background text-text w-auto max-w-40"
                              onPress={() => {
                                if (
                                  trainingSessionBuilder.exercises.some((exercise) => {
                                    return exercise.day === day;
                                  })
                                ) {
                                  setOnTarget(true);
                                }
                                handleAssignExercises(day);
                              }}
                            >
                              {trainingSessionBuilder.exercises.some((exercise) => {
                                return exercise.day === day;
                              }) ? (
                                <FaEdit />
                              ) : (
                                <FaPlus />
                              )}
                            </Button>
                            {trainingSessionBuilder.exercises.some(
                              (exercise) => exercise.day === day,
                            ) && (
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
                                    onPress={() =>
                                      setDeployModal({
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
                        {trainingSessionBuilder.exercises.filter((exercise) => exercise.day === day)
                          .length > 0 && (
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
                        )}
                        {(() => {
                          const exercisesForDay = trainingSessionBuilder.exercises
                            .filter((exercise) => exercise.day === day)
                            .sort((a, b) => (a.order || 0) - (b.order || 0));

                          return exercisesForDay.length > 0 ? (
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
                                          <div
                                            className="flex justify-between gap-2"
                                            key={`set-${set.weight}-${set.reps}-${set.rpe}`}
                                          >
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
                                    <div className="flex gap-1 justify-center items-center">
                                      <Button
                                        isIconOnly
                                        variant="bordered"
                                        size="sm"
                                        color="primary"
                                        isDisabled={exerciseIndex === 0}
                                        onPress={() =>
                                          handleReorderExercise(
                                            exercise.exercise_id,
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
                                        isDisabled={exerciseIndex === exercisesForDay.length - 1}
                                        onPress={() =>
                                          handleReorderExercise(
                                            exercise.exercise_id,
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
                  <div className="flex gap-2 items-center">
                    {/* clear all exercises */}
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
                              setTrainingSessionBuilder((prev) => ({
                                ...prev,
                                exercises: prev.exercises.filter(
                                  (ex) =>
                                    !(
                                      ex.exercise_id === exercise.exercise_id &&
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

                                              // Recalculate weight if we have valid reps and RPE
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
                                                newRpe = 0
                                              }
                                              const currentSet = exercise.target[setIdx];
                                              const currentReps = currentSet?.reps ?? 0;

                                              // Recalculate weight if we have valid reps and RPE
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

      <Modal
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
        isOpen={deployModal.isOpen}
        onOpenChange={(isOpen) => setDeployModal({ isOpen: !isOpen, day: deployModal.day })}
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

const DuplicateSessionPageContent = DuplicateSessionPage;

export default function DuplicateSessionPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <DuplicateSessionPageContent />
    </Suspense>
  );
}
