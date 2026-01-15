'use client';

import React, { useEffect, useMemo, Suspense, useCallback } from 'react';
import { Button, Card, CardBody, Divider } from '@heroui/react';
import { useTrainingBlock } from '@/hooks/api/use-training-blocks';
import { useModifierCategories, useModifiers } from '@/hooks/api/use-modifier';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { TrainingBlockExerciseResponse, WorkoutMethod, WorkoutType } from '@/types/global';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useAuth } from '@/hooks/api/use-auth-hooks';
import { UserRole } from '@strengthos/shared-types';
import { generateModifiedExerciseName } from '@/utils/exercise-name-modifier';

export const ViewTrainingBlock = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingBlockId = searchParams?.get('id') ?? '';
  const tenantIdParam = searchParams?.get('tenantId') ?? '';
  const { isAdmin } = useRoleAccess();

  // Auth and tenant handling
  const { state } = useAuth();
  const user = state.user;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const effectiveTenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user?.tenantId;

  // API hooks
  const { data: modifiersData } = useModifiers({ limit: 1000 });
  const { data: modifierCategoriesData } = useModifierCategories({ limit: 1000 });
  const { data: trainingBlockData, isLoading: isLoadingTrainingBlock } = useTrainingBlock(
    trainingBlockId || '',
    effectiveTenantId,
  );

  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Program Builder', href: '/workout/manage-workouts' },
    { label: 'View Training Block' },
  ];
  
  const getModifiedExerciseName = useCallback(
    (exercise: TrainingBlockExerciseResponse) => {
      if (!modifiersData?.modifiers || !modifierCategoriesData?.modifier_categories) {
        return exercise.exerciseName || 'Unknown Exercise';
      }
      return generateModifiedExerciseName(
        exercise.exerciseName || 'Unknown Exercise',
        exercise.modifiers || [],
        modifiersData.modifiers,
        modifierCategoriesData.modifier_categories,
      );
    },
    [modifiersData, modifierCategoriesData],
  );

  const exercisesByDay = useMemo(() => {
    if (!trainingBlockData?.exercises) return {};
    const grouped: Record<number, typeof trainingBlockData.exercises> = {};
    trainingBlockData.exercises.forEach((exercise) => {
      if (!grouped[exercise.day]) {
        grouped[exercise.day] = [];
      }
      grouped[exercise.day].push(exercise);
    });
    Object.keys(grouped).forEach((day) => {
      grouped[Number(day)].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return grouped;
  }, [trainingBlockData?.exercises]);

  useEffect(() => {
    if (!trainingBlockId) {
      router.push('/workout/manage-workouts');
    }
  }, [trainingBlockId, router]);

  const handleBack = () => {
    router.push('/workout/manage-workouts');
  };

  const getWorkoutMethodLabel = (method: WorkoutMethod) => {
    switch (method) {
      case WorkoutMethod.JIM_WENDLER:
        return "JIM WENDLER'S";
      case WorkoutMethod.WESTSIDE_CONJUGATE:
        return 'WESTSIDE CONJUGATE';
      default:
        return method;
    }
  };

  const getWorkoutTypeLabel = (type: WorkoutType) => {
    switch (type) {
      case WorkoutType.CUTTING:
        return 'CUTTING';
      case WorkoutType.HYPERTROPHY:
        return 'HYPERTROPHY';
      default:
        return type;
    }
  };

  if (isLoadingTrainingBlock) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <div className="flex flex-col gap-4 p-4 rounded-md bg-backgroundSecondary border border-border">
          <div className="flex justify-center items-center h-64">
            <div className="text-text">Loading training block...</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!trainingBlockData && !isLoadingTrainingBlock) {
    return (
      <PageWrapper breadcrumbs={breadcrumbs}>
        <div className="flex flex-col gap-4 p-4 rounded-md bg-backgroundSecondary border border-border">
          <div className="flex justify-center items-center h-64">
            <div className="text-text">Training block not found</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4 p-4 rounded-md bg-backgroundSecondary border border-border">
        <div className="flex flex-col sm:flex-row justify-between gap-y-2">
          <h1 className="text-2xl font-semibold text-text">{trainingBlockData?.workoutName}</h1>
          <div className="flex justify-end gap-3">
            <Button
              variant="solid"
              color="default"
              onPress={handleBack}
              startContent={<FaArrowLeft />}
            >
              Back
            </Button>
          </div>
        </div>

        <div className="training-block-view">
          <div className="grid grid-cols-1 gap-4">
            {/* Workout Information */}
            <Card className="bg-background border border-border">
              <CardBody className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs font-light text-muted-foreground">Created By</div>
                    <div className="text-text">{trainingBlockData?.createdByName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-light text-muted-foreground">Training Method</div>
                    <div className="text-text">
                      {trainingBlockData?.workoutMethod
                        ? getWorkoutMethodLabel(trainingBlockData.workoutMethod)
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-light text-muted-foreground">Training Type</div>
                    <div className="text-text">
                      {trainingBlockData?.workoutType
                        ? getWorkoutTypeLabel(trainingBlockData.workoutType)
                        : '-'}
                    </div>
                  </div>
                  {trainingBlockData?.isGlobal && (
                    <div>
                      <div className="text-xs font-light text-muted-foreground">
                        Available for free plan users
                      </div>
                      <div className="text-text">{trainingBlockData?.is_free ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Workout Summary */}
            {trainingBlockData?.summary && (
              <div className="w-full">
                <h2 className="text-lg font-semibold text-text mb-2">Workout Summary</h2>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[1280px] grid grid-cols-7 gap-2 mb-2">
                    {/* Total */}
                    <Card className="bg-background border border-border shadow-none">
                      <CardBody className="p-3">
                        <div className="text-sm font-semibold text-text mb-2 text-center border-b border-border pb-1 whitespace-normal break-words">
                          Total
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-text">
                          <div className="flex justify-between">
                            <span>NL:</span>
                            <span className="font-medium">
                              {trainingBlockData.summary.nl?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Peripheral:</span>
                            <span className="font-medium">
                              {trainingBlockData.summary.peripheralStress?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Central:</span>
                            <span className="font-medium">
                              {trainingBlockData.summary.centralStress?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-medium">
                              {trainingBlockData.summary.totalStress?.toFixed(2) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>CS Balance:</span>
                            <span className="font-medium">
                              {trainingBlockData.summary.csBalance?.toFixed(1) || 0}%
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
                      const patternData = trainingBlockData?.summary?.patterns?.find(
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

            {/* Exercises by Day */}
            <div className="w-full overflow-x-auto">
              <div className="md:min-w-[1440px] grid grid-cols-1 md:grid-cols-7 gap-2 mb-2">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const day = dayIdx + 1;
                  const dayExercises = exercisesByDay[day] || [];

                  return (
                    <div
                      key={'day-' + day}
                      className="bg-backgroundSecondary border border-border rounded-md p-2 flex-shrink-0"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-text">Day {day}</div>
                          {dayExercises.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {dayExercises.length}{' '}
                              {dayExercises.length === 1 ? 'exercise' : 'exercises'}
                            </div>
                          )}
                        </div>

                        {dayExercises.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {dayExercises.map((exercise) => (
                              <Card
                                key={`exercise-card-${exercise.exerciseId}-${exercise.day}-${exercise.order}`}
                                className="w-full min-w-0 bg-background border border-border"
                              >
                                <CardBody className="p-3 flex flex-col gap-2">
                                  <div className="text-sm font-medium text-text pb-2 text-center border-b border-border">
                                    {getModifiedExerciseName(exercise)}{' '}
                                  </div>
                                  <div className="flex flex-col gap-2 text-xs text-text">
                                    {exercise.sets.map((set, index) => (
                                      <div
                                        key={`${exercise.exerciseId}-${exercise.day}-${exercise.order}-set-${index}`}
                                        className="grid grid-cols-[auto_1fr] gap-1"
                                      >
                                        <span className="text-xs font-medium w-fit mr-2">
                                          Set {index + 1}
                                        </span>
                                        <div className="flex w-full justify-end items-center gap-2">
                                          <span className="text-xs">{set.reps} reps</span>
                                          <span className="text-xs">@ {set.rpe} RPE</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <Divider className="my-2" />
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
                                </CardBody>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            No exercises
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const ViewTrainingBlockContent = ViewTrainingBlock;

export default function ViewTrainingBlockPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <ViewTrainingBlockContent />
    </Suspense>
  );
}
