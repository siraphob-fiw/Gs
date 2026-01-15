'use client';

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { addToast, Button } from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { RelationshipStatus, UserRole, UserStatus } from '@strengthos/shared-types';
import { useCreateTrainingSession } from '@/hooks/api/use-training-session';
import { useCoachClients } from '@/hooks/api/use-coach-clients';
import { useTrainingBlocks } from '@/hooks/api/use-training-blocks';
import { useUsers } from '@/hooks/api/use-users';
import { Card, CardBody } from '@heroui/react';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useTrainingSessionBuilder } from '@/components/session/hooks/use-training-session-builder';
import { useExerciseManagement } from '@/components/session/hooks/use-exercise-management';
import { useTrainingBlockSelection } from '@/components/session/hooks/use-training-block-selection';
import { useAthleteSelection } from '@/components/session/hooks/use-athlete-selection';
import { validateTrainingSession } from '@/utils/session-validation';
import { prepareSessionsForDeployment } from '@/utils/session-utils';
import { DayColumn } from '@/components/session/DayColumn';
import { ExerciseDrawer } from '@/components/session/ExerciseDrawer';
import { DeployModal } from '@/components/session/DeployModal';
import { SessionFormFields } from '@/components/session/SessionFormFields';
import { useExercises } from '@/hooks/api/use-exercises';
import { useModifiers, useModifierCategories } from '@/hooks/api/use-modifier';
import { useCalculateWorkoutSummary } from '@/hooks/api/use-training-blocks';
import dayjs from 'dayjs';
import { consoleLogService } from '@/lib/console-logger';

function CreateTrainingSessionContent() {
  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams?.get('date') ?? '';
  const trainingBlockIdParam = searchParams?.get('id') ?? '';
  const athleteIdParam = searchParams?.get('athlete_id') ?? '';
  const { isCoach, isAdmin, isUser } = useRoleAccess();

  const { trainingSessionBuilder, setTrainingSessionBuilder, updateBuilder } =
    useTrainingSessionBuilder();

  useEffect(() => {
    if (dateParam !== '') {
      const startDate = dayjs(dateParam).startOf('day').format('YYYY-MM-DD');
      const endDate = dayjs(startDate).add(6, 'day').endOf('day').format('YYYY-MM-DD');

      setTrainingSessionBuilder((prev) => ({
        ...prev,
        date: [
          {
            start_date: startDate,
            end_date: endDate,
          },
        ],
      }));
      const url = new URL(window.location.href);
      url.searchParams.delete('date');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, [dateParam]);

  const { data: availableAthletes } = useCoachClients(
    isCoach()
      ? { coach_id: user?.id, status: RelationshipStatus.ACTIVE }
      : isAdmin()
        ? undefined
        : { athlete_id: user?.id, status: RelationshipStatus.ACTIVE },
  );

  const { data: trainingBlocksData } = useTrainingBlocks({ status: 'ACTIVE' });
  const createTrainingSessionMutation = useCreateTrainingSession();
  const [assignExdrawer, setAssignExdrawer] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [deployModal, setDeployModal] = useState<{ isOpen: boolean; day: number }>({
    isOpen: false,
    day: 0,
  });
  const [error, setError] = useState<string[]>([]);
  const [selectedTrainingBlock, setSelectedTrainingBlock] = useState<string>('');

  const { data: coachesData } = isAdmin()
    ? useUsers({
        tenantId: user?.tenantId,
        status: UserStatus.ACTIVE,
      })
    : { data: undefined };

  const availableCoaches = useMemo(() => {
    if (coachesData && Array.isArray(coachesData.users)) {
      return coachesData.users.filter((e) => e.role === UserRole.COACH);
    }
    return [];
  }, [coachesData]);

  // Fetch exercises and modifiers for dynamic summary calculation
  const { data: exercisesData } = useExercises({ limit: 1000 });
  const { data: modifiersData } = useModifiers({ limit: 1000 });
  const { data: modifierCategoriesData } = useModifierCategories({ limit: 1000 });
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

  // Calculate dynamic summary based on current exercises in the builder
  useEffect(() => {
    if (!exercisesData?.exercises || trainingSessionBuilder.exercises.length === 0) {
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

  const { handleSelectTrainingBlock } = useTrainingBlockSelection({
    trainingSessionBuilder,
    updateBuilder,
    trainingBlocks: trainingBlocksData?.blocks || [],
  });

  const { handleSelectAthlete } = useAthleteSelection({
    trainingSessionBuilder,
    updateBuilder,
    availableAthletes,
  });

  const exerciseManagement = useExerciseManagement({
    trainingSessionBuilder,
    updateBuilder,
    selectedDay,
  });

  useEffect(() => {
    if (
      trainingBlockIdParam &&
      trainingBlocksData?.blocks &&
      trainingBlocksData.blocks.length > 0
    ) {
      handleSelectTrainingBlock(trainingBlockIdParam);
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, [trainingBlockIdParam, trainingBlocksData, handleSelectTrainingBlock]);

  useEffect(() => {
    if (user && isCoach()) {
      setTrainingSessionBuilder((prev) => ({
        ...prev,
        coach_id: user.id,
        athlete_id: athleteIdParam ?? '',
      }));
    } else if (user && isUser()) {
      // Athletes deploy blocks to themselves
      setTrainingSessionBuilder((prev) => ({
        ...prev,
        athlete_id: user.id,
      }));
    }
    if (athleteIdParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('athlete_id');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, [user, athleteIdParam]);

  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Program Builder', href: '/workout/manage-workouts' },
    { label: 'Deploy Training Session' },
  ];

  const filteredAthletes = useMemo(() => {
    if (!availableAthletes || !Array.isArray(availableAthletes.relationships)) {
      return [];
    }
    if (!trainingSessionBuilder.coach_id) {
      return [];
    }
    return availableAthletes.relationships.filter(
      (athlete) => athlete.coach_id === trainingSessionBuilder.coach_id,
    );
  }, [availableAthletes, trainingSessionBuilder.coach_id]);

  const handleCancelBuilder = () => {
    router.push('/workout/session');
  };

  const handleSaveTrainingSession = async () => {
    setError([]);
    const validationErrors = validateTrainingSession(trainingSessionBuilder, isUser());

    if (validationErrors.length > 0) {
      setError(validationErrors);
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

  const handleAssignExercises = (day: number) => {
    setSelectedDay(day);
    setAssignExdrawer(true);
  };

  const handleCopyDay = (fromDay: number, toDay: number) => {
    exerciseManagement.handleCopyDay(fromDay, toDay);
    setDeployModal({ isOpen: false, day: 0 });
  };

  const handleModifierChange = useCallback(
    (day: number, exerciseId: string, order: number, modifierId: string, categoryId?: string) => {
      updateBuilder((prev) => {
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
    [modifiersData?.modifiers, updateBuilder],
  );

  // Handler for multi-select modifier categories (Load Accommodation, Kit, Other)
  const handleMultiModifierChange = useCallback(
    (day: number, exerciseId: string, order: number, modifierIds: string[], categoryId: string) => {
      updateBuilder((prev) => {
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
    [modifiersData?.modifiers, updateBuilder],
  );

  return (
    <PageWrapper
      breadcrumbs={breadcrumbs}
      title="Deploy Training Session"
      actions={
        <div className="flex gap-2">
          <Button
            variant="solid"
            color="primary"
            onPress={handleSaveTrainingSession}
            isLoading={createTrainingSessionMutation.isPending}
          >
            Deploy
          </Button>
          <Button variant="solid" color="danger" onPress={handleCancelBuilder}>
            Cancel
          </Button>
        </div>
      }
    >
      <SessionFormFields
        trainingSessionBuilder={trainingSessionBuilder}
        onUpdateBuilder={updateBuilder}
        errors={error}
        onErrorChange={setError}
        selectedTrainingBlock={selectedTrainingBlock}
        onSelectTrainingBlock={(blockId) => {
          setSelectedTrainingBlock(blockId);
          handleSelectTrainingBlock(blockId);
        }}
        trainingBlocks={trainingBlocksData?.blocks || []}
        isAdmin={isAdmin()}
        availableCoaches={availableCoaches}
        filteredAthletes={filteredAthletes}
        onSelectAthlete={handleSelectAthlete}
      />

      {/* Workout Summary */}
      {dynamicSummary && (
        <div className="w-full mt-4">
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
                      <span className="font-medium">{dynamicSummary.nl?.toFixed(2) || 0}</span>
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
                const patternData = dynamicSummary?.patterns?.find((p: any) => p.type === pattern);
                return (
                  <Card key={pattern} className="bg-background border border-border shadow-none">
                    <CardBody className="p-3">
                      <div className="text-sm text-text mb-2 text-center border-b border-border pb-1">
                        {pattern.replace('_', ' ').toLowerCase().charAt(0).toUpperCase() +
                          pattern.replace('_', ' ').toLowerCase().slice(1)}
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-text">
                        <div className="flex justify-between">
                          <span>NL:</span>
                          <span className="font-medium">{patternData?.nl?.toFixed(0) || 0}</span>
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

      <div className="w-full md:col-span-2 overflow-x-auto mt-4">
        <div className="md:min-w-[1440px] grid grid-cols-1 md:grid-cols-7 gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const day = dayIdx + 1;
            return (
              <DayColumn
                key={`day-${day}`}
                day={day}
                exercises={trainingSessionBuilder.exercises}
                onAssignExercises={handleAssignExercises}
                onMoveExercise={exerciseManagement.handleMoveExercise}
                onReorderExercise={exerciseManagement.handleReorderExercise}
                onOpenCopyModal={(day) => setDeployModal({ isOpen: true, day })}
                onDeleteDay={exerciseManagement.handleDeleteDay}
                modifiersData={modifiersData}
                modifierCategoriesData={modifierCategoriesData}
                exerciseSummaries={exerciseSummaries}
              />
            );
          })}
        </div>
      </div>

      <ExerciseDrawer
        isOpen={assignExdrawer}
        onClose={() => {
          setAssignExdrawer(false);
          setSelectedDay(1);
        }}
        selectedDay={selectedDay}
        trainingSessionBuilder={trainingSessionBuilder}
        onUpdateExercises={updateBuilder}
        onAddSetToExercise={exerciseManagement.handleAddSetToExercise}
        onRecalculateWeight={exerciseManagement.handleRecalculateWeightForSet}
        onModifierChange={handleModifierChange}
        onMultiModifierChange={handleMultiModifierChange}
      />

      <DeployModal
        isOpen={deployModal.isOpen}
        onClose={() => setDeployModal({ isOpen: false, day: 0 })}
        sourceDay={deployModal.day}
        trainingSessionBuilder={trainingSessionBuilder}
        onCopyDay={handleCopyDay}
      />
    </PageWrapper>
  );
}

export default function CreateTrainingSession() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <CreateTrainingSessionContent />
    </Suspense>
  );
}
