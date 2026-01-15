'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import {
  Card,
  CardBody,
  Button,
  Input,
  addToast,
  Skeleton,
  Divider,
  AccordionItem,
  Accordion,
  Dropdown,
  DropdownTrigger,
  DropdownItem,
  DropdownMenu,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalContent,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
} from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import {
  useProgressSessionExercise,
  ProgressSessionExerciseDto,
  SessionExerciseActualValues,
  SessionExerciseValues,
  SessionWarmupValues,
  TrainingSessionExercise,
  UpdateTrainingSessionExerciseDto,
  useCalculateWeight,
  useTrainingSession,
  useUpdateTrainingSession,
} from '@/hooks/api/use-training-session';
import { UserRole } from '@strengthos/shared-types';
import { FaArrowRight, FaMinus, FaPlus, FaSearch } from 'react-icons/fa';
import dayjs from 'dayjs';
import { useIsMobile } from '@/hooks/api/use-screen-utils';
import { FaEllipsis } from 'react-icons/fa6';
import { useModifierCategories, useModifiers } from '@/hooks/api/use-modifier';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import {
  generateModifiedExerciseName,
  isMultiSelectCategory,
} from '@/utils/exercise-name-modifier';

const metricOrder = [
  'e1rm',
  'nl',
  'tonnage',
  'total_stress',
  'peripheral_stress',
  'central_stress',
];

function roundToEvenHalf(num: number): number {
  return Math.round(num * 2) / 2;
}

function metricsOrdered(metrics: any) {
  if (!metrics) return [];
  return metricOrder.filter((key) => metrics[key] !== undefined).map((key) => [key, metrics[key]]);
}

const groupExercisesByDate = (exercises: TrainingSessionExercise[]) => {
  if (!Array.isArray(exercises)) return { grouped: {}, order: [] };
  const map: Record<string, { key: string; exercises: TrainingSessionExercise[] }> = {};
  exercises.forEach((ex) => {
    const dateKey = dayjs(ex.exerciseDate).format('YYYY-MM-DD');
    const displayKey = dayjs(ex.exerciseDate).format('DD MMM YYYY');
    if (!map[dateKey]) map[dateKey] = { key: displayKey, exercises: [] };
    map[dateKey].exercises.push(ex);
  });
  const orderedDateKeys = Object.keys(map).sort((a, b) => dayjs(a).diff(dayjs(b)));
  return {
    grouped: Object.fromEntries(orderedDateKeys.map((key) => [map[key].key, map[key].exercises])),
    order: orderedDateKeys.map((key) => map[key].key),
  };
};

function SessionProgressPageContent() {
  // --- Hooks & params ---
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params?.id ?? '';
  const { state } = useAuth();
  const user = state.user;
  const isMobile = useIsMobile();
  const { isAdmin } = useRoleAccess();

  const progress = searchParams?.get('progress') ?? '';
  const date = searchParams?.get('date') ?? '';
  const isToday = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: session, isLoading, isError, refetch } = useTrainingSession(id as string);
  const updateExerciseActual = useProgressSessionExercise();
  const calculateWeight = useCalculateWeight();
  // --- State ---
  const [formFields, setFormFields] = useState<TrainingSessionExercise[]>([]);
  const [targetFields, setTargetFields] = useState<TrainingSessionExercise[]>([]);
  const [showTargetMobile, setShowTargetMobile] = useState<string[]>([]);

  const [calcModal, setCalcModal] = useState<{
    isOpen: boolean;
    exercise?: TrainingSessionExercise;
  }>({ isOpen: false, exercise: undefined });
  const [changeModifiersModal, setChangeModifiersModal] = useState<{
    isOpen: boolean;
    exerciseId?: string;
    day?: number;
    order?: number;
  }>({ isOpen: false, exerciseId: undefined });
  const { data: modifiersData } = useModifiers({ limit: 1000 });
  const { data: modifierCategoriesData } = useModifierCategories({ limit: 1000 });
  const [calculationForm, setCalculationForm] = useState<{ reps: number; rpe: number }>({
    reps: 0,
    rpe: 0,
  });
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [modifierSearchTerm, setModifierSearchTerm] = useState('');

  // Helper function to get modified exercise name based on modifiers
  const getModifiedExerciseName = useCallback(
    (exercise: TrainingSessionExercise) => {
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

  const updateSessionExerciseModifiers = useUpdateTrainingSession();
  const [calculatedWeight, setCalculatedWeight] = useState<{ weight: number; e1rm: number }>({
    weight: 0,
    e1rm: 0,
  });
  // --- Computed permissions ---
  const canEdit = useMemo(
    () =>
      [UserRole.COACH, UserRole.COACH_ADMIN, UserRole.SUPER_ADMIN].includes(user?.role as UserRole),
    [user?.role],
  );
  const canProgress = useMemo(
    () =>
      user?.id &&
      session?.athleteId &&
      `${user.id}` === `${session.athleteId}` &&
      progress === 'true',
    [user?.id, session?.athleteId, progress],
  );

  // --- Populate forms when session loads or date filter changes ---
  useEffect(() => {
    if (!session) {
      setFormFields([]);
      setTargetFields([]);
      return;
    }
    let filtered = Array.isArray(session.exercises) ? session.exercises : [];
    if (date) {
      filtered = filtered.filter((ex) => dayjs(ex.exerciseDate).format('YYYY-MM-DD') === date);
    }
    // Stable sort: order then date only
    const sorted = [...filtered]
      .sort((a, b) => {
        const oA = typeof a.order === 'number' ? a.order : 0;
        const oB = typeof b.order === 'number' ? b.order : 0;
        if (oA !== oB) return oA - oB;
        return dayjs(a.exerciseDate).unix() - dayjs(b.exerciseDate).unix();
      })
      .map((ex) => ({
        ...ex,
        warmup: Array.isArray(ex.warmup) ? [...ex.warmup] : [],
        actual: Array.isArray(ex.actual) ? ex.actual.map((a) => ({ ...a })) : [],
      }));

    setFormFields(sorted);
    setTargetFields(
      sorted.map((ex) => ({
        ...ex,
        exerciseId: ex.exerciseId,
        target: Array.isArray(ex.target)
          ? ex.target.map((t: SessionExerciseValues) => ({ ...t }))
          : [],
      })) as TrainingSessionExercise[],
    );
  }, [session, date]);

  useEffect(() => {
    if (changeModifiersModal.isOpen && changeModifiersModal.exerciseId) {
      const exercise = formFields.find((ex) => ex.id === changeModifiersModal.exerciseId);
      if (exercise) {
        setSelectedModifiers(exercise.modifiers ?? []);
      }
    } else if (!changeModifiersModal.isOpen) {
      setSelectedModifiers([]);
    }
  }, [changeModifiersModal.isOpen, changeModifiersModal.exerciseId, formFields]);

  // --- Handlers ---
  const handleActualChange = useCallback(
    (
      exerciseId: string,
      idx: number,
      field: keyof SessionExerciseValues,
      value: string | number,
    ) => {
      setFormFields((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          let updatedActual = Array.isArray(ex.actual) ? [...ex.actual] : [];
          if (!updatedActual[idx])
            updatedActual[idx] = {
              sets: idx + 1,
              weight: 0,
              reps: 0,
              rpe: 0,
              central_stress: 0,
              peripheral_stress: 0,
              total_stress: 0,
            };
          updatedActual[idx] = {
            ...updatedActual[idx],
            [field]: value === '' ? '' : Number(value),
          };
          return { ...ex, actual: updatedActual };
        }),
      );
    },
    [],
  );

  const handleAddWarmup = useCallback((exerciseId: string, sets: number) => {
    setFormFields((prev) => {
      const exercise = prev.find((ex) => ex.id === exerciseId);
      if (!exercise) return prev;
      const FirstSetWeight = exercise.target?.[0]?.weight ?? 0;
      const basicWarmup: Record<number, SessionWarmupValues[]> = {
        1: [{ sets: 1, weight: roundToEvenHalf(FirstSetWeight * 0.85), reps: 5 }],
        3: [
          { sets: 1, weight: roundToEvenHalf(FirstSetWeight * 0.75), reps: 5 },
          { sets: 2, weight: roundToEvenHalf(FirstSetWeight * 0.85), reps: 3 },
          { sets: 3, weight: roundToEvenHalf(FirstSetWeight * 0.93), reps: 1 },
        ],
        5: [
          { sets: 1, weight: roundToEvenHalf(FirstSetWeight * 0.35), reps: 5 },
          { sets: 2, weight: roundToEvenHalf(FirstSetWeight * 0.6), reps: 3 },
          { sets: 3, weight: roundToEvenHalf(FirstSetWeight * 0.75), reps: 1 },
          { sets: 4, weight: roundToEvenHalf(FirstSetWeight * 0.85), reps: 1 },
          { sets: 5, weight: roundToEvenHalf(FirstSetWeight * 0.93), reps: 1 },
        ],
      };
      return prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, warmup: basicWarmup[sets] || [] } : ex,
      );
    });
  }, []);

  const handleRemoveWarmup = useCallback((exerciseId: string, warmupIdx: number) => {
    setFormFields((prev) =>
      prev.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : {
            ...ex,
            warmup: Array.isArray(ex.warmup)
              ? ex.warmup.filter((_, idx) => idx !== warmupIdx)
              : [],
          },
      ),
    );
  }, []);

  const handleNotesChange = useCallback((exerciseId: string, value: string) => {
    setFormFields((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, notes: value } : ex)),
    );
  }, []);

  const handleUpdateSessionExerciseModifiers = useCallback(
    async (exerciseId: string, modifiers: string[]) => {
      if (!session?.id || !exerciseId) return;

      const exercise = formFields.find((ex) => ex.id === exerciseId);
      if (!exercise) return;

      try {
        await updateSessionExerciseModifiers.mutateAsync({
          id: session.id,
          data: {
            exercises: [
              {
                exerciseId: exercise.exerciseId,
                modifiers: modifiers,
              },
            ],
          },
        });
        addToast({
          title: 'Updated!',
          description: 'Modifiers updated successfully.',
          color: 'success',
        });
        refetch();
      } catch (e: any) {
        addToast({
          title: 'Error updating modifiers!',
          description: e?.message || 'Something went wrong.',
          color: 'danger',
        });
      }
    },
    [session?.id, formFields, updateSessionExerciseModifiers, refetch],
  );

  const handleUpdateSession = useCallback(async () => {
    try {
      // Always call progress endpoint if progress=true
      if (progress === 'true') {
        const progressPayload: ProgressSessionExerciseDto[] = formFields.map(
          (ex: TrainingSessionExercise) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            actual: Array.isArray(ex.actual)
              ? ex.actual.map((a: SessionExerciseActualValues) => ({
                sets: a.sets ?? 0,
                weight: a.weight ?? 0,
                reps: a.reps ?? 0,
                rpe: a.rpe ?? 0,
                central_stress: a.central_stress ?? 0,
                peripheral_stress: a.peripheral_stress ?? 0,
                total_stress: a.total_stress ?? 0,
              }))
              : [],
            warmup: Array.isArray(ex.warmup)
              ? ex.warmup.map((a: SessionWarmupValues) => ({
                sets: a.sets ?? 0,
                weight: a.weight ?? 0,
                reps: a.reps ?? 0,
              }))
              : [],
            metrics: {
              e1rm: ex.metrics?.e1rm ?? 0,
              nl: ex.metrics?.nl ?? 0,
              tonnage: ex.metrics?.tonnage ?? 0,
              total_stress: ex.metrics?.total_stress ?? 0,
              peripheral_stress: ex.metrics?.peripheral_stress ?? 0,
              central_stress: ex.metrics?.central_stress ?? 0,
            },
            notes: ex.notes || '',
          }),
        );
        await updateExerciseActual.mutateAsync({
          exerciseDate: dayjs(date ?? isToday).format('YYYY-MM-DD'),
          id: session?.id ?? '',
          data: progressPayload,
        });
        addToast({
          title: 'Updated!',
          description: 'Progress updated successfully.',
          color: 'success',
        });
        refetch();
        return;
      }

      // Check if actual values have changed
      const hasActualChanges = formFields.some((ex: TrainingSessionExercise) => {
        const originalExercise = session?.exercises?.find((orig) => orig.id === ex.id);
        if (!originalExercise) return false;

        const currentActual = ex.actual || [];
        const originalActual = originalExercise.actual || [];

        // Check if lengths differ
        if (currentActual.length !== originalActual.length) return true;

        // Check if any actual values differ
        return currentActual.some((current, idx) => {
          const original = originalActual[idx];
          if (!original) return true;
          return (
            (current.weight ?? 0) !== (original.weight ?? 0) ||
            (current.reps ?? 0) !== (original.reps ?? 0) ||
            (current.rpe ?? 0) !== (original.rpe ?? 0) ||
            (current.sets ?? 0) !== (original.sets ?? 0)
          );
        });
      });

      // If actual values changed, use progress endpoint
      if (hasActualChanges) {
        const progressPayload: ProgressSessionExerciseDto[] = formFields.map(
          (ex: TrainingSessionExercise) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            actual: Array.isArray(ex.actual)
              ? ex.actual.map((a: SessionExerciseActualValues) => ({
                sets: a.sets ?? 0,
                weight: a.weight ?? 0,
                reps: a.reps ?? 0,
                rpe: a.rpe ?? 0,
                central_stress: a.central_stress ?? 0,
                peripheral_stress: a.peripheral_stress ?? 0,
                total_stress: a.total_stress ?? 0,
              }))
              : [],
            warmup: Array.isArray(ex.warmup)
              ? ex.warmup.map((a: SessionWarmupValues) => ({
                sets: a.sets ?? 0,
                weight: a.weight ?? 0,
                reps: a.reps ?? 0,
              }))
              : [],
            metrics: {
              e1rm: ex.metrics?.e1rm ?? 0,
              nl: ex.metrics?.nl ?? 0,
              tonnage: ex.metrics?.tonnage ?? 0,
              total_stress: ex.metrics?.total_stress ?? 0,
              peripheral_stress: ex.metrics?.peripheral_stress ?? 0,
              central_stress: ex.metrics?.central_stress ?? 0,
            },
            notes: ex.notes || '',
          }),
        );
        await updateExerciseActual.mutateAsync({
          exerciseDate: dayjs(date ?? isToday).format('YYYY-MM-DD'),
          id: session?.id ?? '',
          data: progressPayload,
        });
        addToast({
          title: 'Updated!',
          description: 'Progress updated successfully.',
          color: 'success',
        });
        refetch();
        return;
      }

      // Otherwise, use update endpoint for targets and other changes
      const payload = formFields.map((ex: TrainingSessionExercise) => {
        const targetField = targetFields.find((t) => t.id === ex.id);
        const exerciseUpdate: UpdateTrainingSessionExerciseDto = {
          exerciseId: ex.exerciseId,
          warmup: Array.isArray(ex.warmup)
            ? ex.warmup.map((a: SessionWarmupValues) => ({
              sets: a.sets ?? 0,
              weight: a.weight ?? 0,
              reps: a.reps ?? 0,
            }))
            : [],
          metrics: {
            e1rm: ex.metrics?.e1rm ?? 0,
            nl: ex.metrics?.nl ?? 0,
            tonnage: ex.metrics?.tonnage ?? 0,
            total_stress: ex.metrics?.total_stress ?? 0,
            peripheral_stress: ex.metrics?.peripheral_stress ?? 0,
            central_stress: ex.metrics?.central_stress ?? 0,
          },
          notes: ex.notes || '',
        };

        // Include targets if they exist in targetFields
        if (targetField && Array.isArray(targetField.target) && targetField.target.length > 0) {
          exerciseUpdate.targets = targetField.target.map((t: SessionExerciseValues) => ({
            sets: t.sets ?? 0,
            weight: t.weight ?? 0,
            reps: t.reps ?? 0,
            rpe: t.rpe ?? 0,
          }));
        }

        return exerciseUpdate;
      });

      await updateSessionExerciseModifiers.mutateAsync({
        id: session?.id ?? '',
        data: {
          exercises: payload,
        },
      });
      addToast({
        title: 'Updated!',
        description: 'Session updated successfully.',
        color: 'success',
      });
      refetch();
    } catch (e: any) {
      addToast({
        title: 'Error updating session!',
        description: e?.message || 'Something went wrong.',
        color: 'danger',
      });
    }
  }, [
    formFields,
    targetFields,
    session?.id,
    session?.exercises,
    date,
    isToday,
    progress,
    updateSessionExerciseModifiers,
    updateExerciseActual,
    refetch,
  ]);

  const handleCopyTargetValues = useCallback(
    (exerciseId: string, setIndex: number) => {
      const exercise = formFields.find((ex: TrainingSessionExercise) => ex.id === exerciseId);
      if (!exercise || !Array.isArray(exercise.target)) return;

      const actual =
        Array.isArray(exercise.actual) && exercise.actual.length === exercise.target.length
          ? [...exercise.actual]
          : exercise.target.map(() => ({ sets: 0, weight: 0, reps: 0, rpe: 0 }));

      if (exercise.target[setIndex]) {
        // If actual[setIndex]?.weight is not null or undefined, preserve it, else copy from target
        const currentActual = actual[setIndex] || {};
        const targetValue = exercise.target[setIndex];

        actual[setIndex] = {
          ...targetValue,
          weight:
            currentActual.weight !== null && currentActual.weight !== undefined && currentActual.weight !== 0
              ? currentActual.weight
              : targetValue.weight,
        };
      }

      setFormFields((prev) =>
        prev.map((ex) =>
          ex.id === exerciseId ? { ...ex, actual: actual as SessionExerciseActualValues[] } : ex,
        ),
      );
    },
    [formFields],
  );

  const handleShowTargetMobile = useCallback((exerciseId: string) => {
    setShowTargetMobile((prev) =>
      prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId],
    );
  }, []);

  const handleCalculateWeight = useCallback(
    async (id: string) => {
      if (
        !id ||
        !calculationForm.reps ||
        !calculationForm.rpe ||
        calculationForm.reps <= 0 ||
        calculationForm.rpe <= 0 ||
        calculationForm.rpe > 10
      ) {
        return;
      }

      // SUPER_ADMIN should send athleteId and tenantId from the session
      const athleteId = user?.role !== 'ATHLETE' && session?.athleteId ? session.athleteId : undefined;
      const tenantId = user?.role !== 'ATHLETE' && session?.tenantId ? session.tenantId : undefined;

      await calculateWeight.mutateAsync(
        {
          exerciseId: id,
          reps: calculationForm.reps,
          rpe: calculationForm.rpe,
          athleteId,
          tenantId,
        },
        {
          onSuccess: (data) => {
            setCalculatedWeight(data);
          },
        },
      );
    },
    [
      calculationForm,
      calculateWeight,
      setCalculatedWeight,
      user?.role,
      session?.athleteId,
      session?.tenantId,
    ],
  );

  // --- Breadcrumbs & Grouping ---
  const breadcrumbsList = useMemo(
    () => [
      { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
      { label: 'My Workouts', href: '/workout/session' },
      { label: 'Session Progress' },
    ],
    [isAdmin],
  );

  const { grouped: groupedByDate, order: orderedDates } = useMemo(
    () => groupExercisesByDate(formFields),
    [formFields],
  );

  // --- Render Loading/Error ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <PageWrapper breadcrumbs={breadcrumbsList}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
          <div className="flex flex-col items-center">
            <div className="bg-danger/10 rounded-full p-7 shadow-lg mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#F87171" fillOpacity="0.18"/>
                <path d="M23.999 13v13M23.999 33h.02" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-danger mb-2">Session Could Not Be Loaded</h2>
            <p className="text-muted-foreground max-w-md text-center mb-6">
              We ran into an issue loading your training session.<br />
              Please check your internet connection & try refreshing the page.
            </p>
            <div className="flex gap-3">
              <Button
                color="secondary"
                variant="solid"
                onPress={() =>
                  user?.role === UserRole.ATHLETE
                    ? router.push('/workout/calendar-session')
                    : router.push('/workout/session')
                }
              >
                Back to Workouts
              </Button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={breadcrumbsList}
      title={session.sessionName || 'Session'}
      actions={
        <div className="flex gap-2">
          {canProgress && (
            <Button color="primary" onPress={handleUpdateSession}>
              Save
            </Button>
          )}
          <Button
            color="danger"
            onPress={() => {
              if (user?.role === UserRole.ATHLETE) {
                router.push('/workout/calendar-session');
              } else {
                router.push('/workout/session');
              }
            }}
          >
            Back
          </Button>
        </div>
      }
    >
      {formFields.length > 0 ? (
        <div>
          <div className="flex flex-col gap-2">
            {!canProgress ? (
              <Accordion variant="splitted" defaultSelectedKeys={'all'} selectionMode='multiple' className="w-full px-0">
                {orderedDates.map((dateStr) => {
                  return (
                    <AccordionItem
                      classNames={{ base: 'bg-surface px-2', title: 'text-text' }}
                      title={
                        <div className="text-text">
                          <span>{dateStr}</span>
                          <span className="text-xs text-text">({dayjs(dateStr).format('dddd')})</span>
                        </div>
                      }
                      key={dateStr}
                    >
                      {groupedByDate[dateStr].map((ex: TrainingSessionExercise) => (
                        <Card
                          key={ex.id}
                          className="bg-backgroundSecondary border border-border p-2 mb-3"
                          isBlurred
                        >
                          <CardBody className="text-text space-y-2 p-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-lg font-medium">
                                {getModifiedExerciseName(ex)}
                              </div>
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button isIconOnly variant="solid" color="primary" size="sm">
                                    <FaEllipsis />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                  <DropdownItem
                                    textValue='Workout Planner'
                                    key="workout-planner"
                                    onPress={() => setCalcModal({ isOpen: true, exercise: ex })}
                                  >
                                    Workout Planner
                                  </DropdownItem>
                                  {user?.role === UserRole.ATHLETE ||
                                    user?.role === UserRole.COACH ? (
                                    <DropdownItem
                                      textValue='Change Modifiers'
                                      key="change-modifiers"
                                      onPress={() =>
                                        setChangeModifiersModal({ isOpen: true, exerciseId: ex.id })
                                      }
                                    >
                                      Change Modifiers
                                    </DropdownItem>
                                  ) : null}
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                            <div className="flex flex-col gap-2 w-full">
                              <div className="flex gap-2">
                                <span className="md:flex-1 text-center font-medium">Warmup</span>
                                <div className="flex flex-col gap-1 flex-1">
                                  {Array.isArray(ex.warmup) && ex.warmup.length > 0 ? (
                                    ex.warmup.map(
                                      (warmupSet: SessionExerciseValues, warmupIdx: number) => (
                                        <div
                                          key={`warmup-${ex.id}-${warmupIdx}`}
                                          className="flex gap-2 items-center"
                                        >
                                          <Input
                                            id={`warmup-weight-${ex.id}-${warmupIdx}`}
                                            size="sm"
                                            label="Weight"
                                            type="number"
                                            min={0}
                                            step="any"
                                            inputMode="decimal"
                                            value={
                                              Number.isFinite(warmupSet.weight)
                                                ? warmupSet.weight.toString()
                                                : ''
                                            }
                                            onValueChange={(e) => {
                                              if (!canProgress) return;
                                              setFormFields((prev) =>
                                                prev.map((exe) =>
                                                  exe.id === ex.id
                                                    ? {
                                                      ...exe,
                                                      warmup: exe.warmup?.map((w, idx) =>
                                                        idx === warmupIdx
                                                          ? { ...w, weight: Number(e) }
                                                          : w,
                                                      ) as SessionExerciseValues[],
                                                    }
                                                    : exe,
                                                ),
                                              );
                                            }}
                                            endContent={
                                              <span className="text-text text-xs">kgs</span>
                                            }
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canProgress}
                                          />
                                          <span className="flex items-center text-text font-medium">
                                            ×
                                          </span>
                                          <Input
                                            id={`warmup-reps-${ex.id}-${warmupIdx}`}
                                            size="sm"
                                            label="Reps"
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={
                                              Number.isFinite(warmupSet.reps)
                                                ? warmupSet.reps.toString()
                                                : ''
                                            }
                                            onValueChange={(e) => {
                                              if (!canProgress) return;
                                              setFormFields((prev) =>
                                                prev.map((exe) =>
                                                  exe.id === ex.id
                                                    ? {
                                                      ...exe,
                                                      warmup: exe.warmup?.map((w, idx) =>
                                                        idx === warmupIdx
                                                          ? { ...w, reps: Number(e) }
                                                          : w,
                                                      ) as SessionExerciseValues[],
                                                    }
                                                    : exe,
                                                ),
                                              );
                                            }}
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canProgress}
                                          />
                                          {canProgress && (
                                            <Button
                                              isIconOnly
                                              variant="solid"
                                              color="primary"
                                              size="sm"
                                              onPress={() => handleRemoveWarmup(ex.id, warmupIdx)}
                                            >
                                              <FaMinus />
                                            </Button>
                                          )}
                                        </div>
                                      ),
                                    )
                                  ) : (
                                    <div className="flex-1 text-text text-sm text-center">
                                      No warmup sets
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Divider className="border-solid border-border" />
                              <div className="flex items-center gap-2">
                                <span
                                  className={`${!isMobile ? 'flex-1' : showTargetMobile.includes(ex.id) ? 'flex-1' : ''} text-center font-medium`}
                                >
                                  {isMobile ? (
                                    <Button
                                      variant="solid"
                                      color={
                                        showTargetMobile.includes(ex.id) ? 'primary' : 'default'
                                      }
                                      size="sm"
                                      onPress={() => handleShowTargetMobile(ex.id)}
                                    >
                                      Target
                                    </Button>
                                  ) : (
                                    'Target'
                                  )}
                                </span>
                                <span
                                  className={`${!isMobile ? 'flex-1' : !showTargetMobile.includes(ex.id) ? 'flex-1' : ''} text-center font-medium`}
                                >
                                  {isMobile ? (
                                    <Button
                                      variant="solid"
                                      color={
                                        !showTargetMobile.includes(ex.id) ? 'primary' : 'default'
                                      }
                                      size="sm"
                                      onPress={() => handleShowTargetMobile(ex.id)}
                                    >
                                      Actual
                                    </Button>
                                  ) : (
                                    'Actual'
                                  )}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2">
                                {ex.target.map((target: SessionExerciseValues, index: number) => {
                                  const showTarget = isMobile
                                    ? showTargetMobile.includes(ex.id)
                                    : true;
                                  const showActual = isMobile
                                    ? !showTargetMobile.includes(ex.id)
                                    : true;
                                  const targetField = targetFields.find((t) => t.id === ex.id);
                                  const tfSet =
                                    targetField?.target?.[index] || ({} as SessionExerciseValues);
                                  const afActual =
                                    formFields.find((ee) => ee.id === ex.id)?.actual?.[index] ||
                                    ({} as SessionExerciseActualValues);

                                  return (
                                    <div
                                      key={`target-${index}`}
                                      className="flex items-center sm:items-center gap-1 flex-1"
                                    >
                                      {showTarget && (
                                        <>
                                          <Input
                                            id={`target-weight-${ex.id}-${index}`}
                                            size="sm"
                                            label="Weight"
                                            type="number"
                                            min={0.0}
                                            step="any"
                                            inputMode="decimal"
                                            value={
                                              Number.isFinite(tfSet.weight)
                                                ? tfSet.weight.toString()
                                                : ''
                                            }
                                            onValueChange={(e) => {
                                              if (!canEdit) return;
                                              setTargetFields((prev) =>
                                                prev.map((t) =>
                                                  t.id === ex.id
                                                    ? {
                                                      ...t,
                                                      target: t.target.map(
                                                        (tt: SessionExerciseValues, i) =>
                                                          i === index
                                                            ? { ...tt, weight: Number(e) }
                                                            : tt,
                                                      ),
                                                    }
                                                    : t,
                                                ),
                                              );
                                            }}
                                            endContent={
                                              <span className="text-text text-xs">kgs</span>
                                            }
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canEdit}
                                          />
                                          <span className="flex items-center text-text font-medium">
                                            ×
                                          </span>
                                          <Input
                                            id={`target-reps-${ex.id}-${index}`}
                                            size="sm"
                                            label="Reps"
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={
                                              Number.isFinite(tfSet.reps)
                                                ? tfSet.reps.toString()
                                                : ''
                                            }
                                            onValueChange={(e) => {
                                              if (!canEdit) return;
                                              setTargetFields((prev) =>
                                                prev.map((t) =>
                                                  t.id === ex.id
                                                    ? {
                                                      ...t,
                                                      target: t.target.map(
                                                        (tt: SessionExerciseValues, i) =>
                                                          i === index
                                                            ? { ...tt, reps: Number(e) }
                                                            : tt,
                                                      ),
                                                    }
                                                    : t,
                                                ),
                                              );
                                            }}
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canEdit}
                                          />
                                          <span className="flex items-center text-text font-medium">
                                            @
                                          </span>
                                          <Input
                                            id={`target-rpe-${ex.id}-${index}`}
                                            size="sm"
                                            label="RPE"
                                            type="number"
                                            min={1.0}
                                            step="any"
                                            inputMode="decimal"
                                            max={10.0}
                                            value={
                                              Number.isFinite(tfSet.rpe) ? tfSet.rpe.toString() : ''
                                            }
                                            onValueChange={(e) => {
                                              if (!canEdit) return;
                                              setTargetFields((prev) =>
                                                prev.map((t) =>
                                                  t.id === ex.id
                                                    ? {
                                                      ...t,
                                                      target: t.target.map(
                                                        (tt: SessionExerciseValues, i) =>
                                                          i === index
                                                            ? { ...tt, rpe: Number(e) }
                                                            : tt,
                                                      ),
                                                    }
                                                    : t,
                                                ),
                                              );
                                            }}
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canEdit}
                                          />
                                        </>
                                      )}
                                      <Button
                                        isIconOnly
                                        variant="solid"
                                        onPress={() => handleCopyTargetValues(ex.id, index)}
                                        disabled={!canProgress}
                                        color={canProgress ? 'primary' : 'secondary'}
                                        size="sm"
                                        className={`my-auto${!canProgress ? ' pointer-events-none opacity-50' : ''}`}
                                      >
                                        <FaArrowRight className="text-white w-4 h-4" />
                                      </Button>
                                      {showActual && (
                                        <>
                                          <Input
                                            id={`actual-weight-${ex.id}-${index}`}
                                            size="sm"
                                            label="Weight"
                                            type="number"
                                            min={0.0}
                                            step="any"
                                            inputMode="decimal"
                                            value={
                                              Number.isFinite(afActual.weight)
                                                ? afActual.weight.toString()
                                                : ''
                                            }
                                            onValueChange={(e) => {
                                              handleActualChange(ex.id, index, 'weight', e);
                                            }}
                                            endContent={
                                              <span className="text-text text-xs">kgs</span>
                                            }
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canProgress}
                                          />
                                          <span className="flex items-center text-text font-medium">
                                            ×
                                          </span>
                                          <Input
                                            id={`actual-reps-${ex.id}-${index}`}
                                            size="sm"
                                            label="Reps"
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={
                                              Number.isFinite(afActual.reps)
                                                ? afActual.reps.toString()
                                                : ''
                                            }
                                            onValueChange={(e) => {
                                              handleActualChange(ex.id, index, 'reps', e);
                                            }}
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canProgress}
                                          />
                                          <span className="flex items-center text-text font-medium">
                                            @
                                          </span>
                                          <Input
                                            id={`actual-rpe-${ex.id}-${index}`}
                                            size="sm"
                                            label="RPE"
                                            type="number"
                                            min={1.0}
                                            max={10.0}
                                            step="any"
                                            inputMode="decimal"
                                            value={
                                              Number.isFinite(afActual.rpe)
                                                ? afActual.rpe.toString()
                                                : ''
                                            }
                                            onValueChange={(e) => {
                                              handleActualChange(ex.id, index, 'rpe', e);
                                            }}
                                            classNames={{
                                              inputWrapper:
                                                'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                              label: 'text-text text-sm',
                                              input: 'text-text',
                                            }}
                                            disabled={!canProgress}
                                          />
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <span>Metrics</span>
                              <div className="flex flex-wrap gap-2">
                                {ex.metrics &&
                                  metricsOrdered(ex.metrics).map(([key, value]) => {
                                    let display;
                                    if (typeof value === 'number' && Number.isFinite(value)) {
                                      if (
                                        [
                                          'e1rm',
                                          'total_stress',
                                          'central_stress',
                                          'peripheral_stress',
                                          'nl',
                                          'tonnage',
                                          'e1rm',
                                        ].includes(key)
                                      ) {
                                        display =
                                          value % 1 === 0
                                            ? value.toString()
                                            : value.toFixed(2).replace(/\.?0+$/, '');
                                      } else {
                                        display = Math.round(value).toString();
                                      }
                                    } else {
                                      display = '';
                                    }
                                    return (
                                      <div key={`metric-${key}`}>
                                        <Input
                                          id={`metric-${key}-${ex.id}`}
                                          size="sm"
                                          label={key.replaceAll('_', ' ')}
                                          value={display}
                                          classNames={{
                                            inputWrapper:
                                              'px-2 border-border group-data-[focus=true]:border-border bg-white max-w-[140px]',
                                            label: 'text-text text-sm line-clamp-1 ',
                                            input: 'text-text',
                                          }}
                                          disabled
                                        />
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Input
                                id={`notes-${ex.id}`}
                                label="Notes"
                                labelPlacement="outside"
                                placeholder={!ex.notes && canProgress ? 'Add notes...' : 'No notes'}
                                type="text"
                                value={ex.notes || ''}
                                classNames={{
                                  inputWrapper:
                                    'border-border group-data-[focus=true]:border-border bg-white',
                                  label:
                                    'text-text group-data-[filled-within=true]:text-text text-sm',
                                  input: 'text-text data-[focus=true]:border-border',
                                }}
                                onValueChange={(e) => handleNotesChange(ex.id, e)}
                                disabled={!canProgress}
                              />
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              formFields.map((ex: TrainingSessionExercise, idx: number) => {
                const targetField = targetFields.find((t) => t.id === ex.id);
                return (
                  <Card
                    key={ex.id}
                    className="bg-backgroundSecondary border border-border p-2"
                    isBlurred
                  >
                    <CardBody className="text-text space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-2">
                          <div className="text-lg font-medium">
                            {getModifiedExerciseName(ex)}{' '}
                            <span className="text-sm text-text">
                              ({dayjs(ex.exerciseDate).format('ddd')} {dayjs(ex.exerciseDate).format('DD MMM YYYY')})
                            </span>
                          </div>
                        </div>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              variant="solid"
                              color="primary"
                              size="sm"
                              onPress={() => setCalcModal({ isOpen: true, exercise: ex })}
                            >
                              <FaEllipsis />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              textValue='Workout Planner'
                              key="workout-planner"
                              onPress={() => setCalcModal({ isOpen: true, exercise: ex })}
                            >
                              Workout Planner
                            </DropdownItem>
                            <DropdownItem
                              textValue='Change Modifiers'
                              key="change-modifiers"
                              onPress={() =>
                                setChangeModifiersModal({ isOpen: true, exerciseId: ex.id })
                              }
                            >
                              Change Modifiers
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        {canProgress && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex items-center gap-2 md:flex-1 md:justify-center">
                              <span className="text-center font-medium">Warmup</span>
                              <Dropdown
                                classNames={{
                                  content: 'bg-backgroundSecondary text-text border border-border',
                                }}
                              >
                                <DropdownTrigger>
                                  <Button isIconOnly variant="bordered" color="primary" size="sm">
                                    <FaPlus />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="warmup-sets">
                                  <DropdownItem
                                    textValue='single set'
                                    key="single-set"
                                    onPress={() => handleAddWarmup(ex.id, 1)}
                                  >
                                    Single Set
                                  </DropdownItem>
                                  <DropdownItem
                                    textValue='3 Sets'
                                    key="3-sets"
                                    onPress={() => handleAddWarmup(ex.id, 3)}
                                  >
                                    3 Sets
                                  </DropdownItem>
                                  <DropdownItem
                                    textValue='5 Sets'
                                    key="5-sets"
                                    onPress={() => handleAddWarmup(ex.id, 5)}
                                  >
                                    5 Sets
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                              {Array.isArray(ex.warmup) && ex.warmup.length > 0 ? (
                                ex.warmup.map(
                                  (warmupSet: SessionWarmupValues, warmupIdx: number) => (
                                    <div
                                      key={`warmup-${ex.id}-${warmupIdx}`}
                                      className="flex gap-2 items-center"
                                    >
                                      <Input
                                        id={`warmup-weight-${ex.id}-${warmupIdx}`}
                                        size="sm"
                                        label="Weight"
                                        type="number"
                                        min={0}
                                        step="any"
                                        inputMode="decimal"
                                        value={
                                          Number.isFinite(warmupSet.weight)
                                            ? warmupSet.weight.toString()
                                            : ''
                                        }
                                        onValueChange={(e) => {
                                          if (!canProgress) return;
                                          setFormFields((prev) =>
                                            prev.map((exe) =>
                                              exe.id === ex.id
                                                ? {
                                                  ...exe,
                                                  warmup: exe.warmup?.map((w, idx) =>
                                                    idx === warmupIdx
                                                      ? { ...w, weight: Number(e) }
                                                      : w,
                                                  ) as SessionWarmupValues[],
                                                }
                                                : exe,
                                            ),
                                          );
                                        }}
                                        endContent={<span className="text-text text-xs">kgs</span>}
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled={!canProgress}
                                      />
                                      <span className="flex items-center text-text font-medium">
                                        ×
                                      </span>
                                      <Input
                                        id={`warmup-reps-${ex.id}-${warmupIdx}`}
                                        size="sm"
                                        label="Reps"
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={
                                          Number.isFinite(warmupSet.reps)
                                            ? warmupSet.reps.toString()
                                            : ''
                                        }
                                        onValueChange={(e) => {
                                          if (!canProgress) return;
                                          setFormFields((prev) =>
                                            prev.map((exe) =>
                                              exe.id === ex.id
                                                ? {
                                                  ...exe,
                                                  warmup: exe.warmup?.map((w, idx) =>
                                                    idx === warmupIdx
                                                      ? { ...w, reps: Number(e) }
                                                      : w,
                                                  ) as SessionWarmupValues[],
                                                }
                                                : exe,
                                            ),
                                          );
                                        }}
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled={!canProgress}
                                      />
                                      <Button
                                        isIconOnly
                                        variant="solid"
                                        color="primary"
                                        size="sm"
                                        onPress={() => handleRemoveWarmup(ex.id, warmupIdx)}
                                      >
                                        <FaMinus />
                                      </Button>
                                    </div>
                                  ),
                                )
                              ) : (
                                <div className="flex-1 text-text text-sm text-center">
                                  No warmup sets
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <Divider className="border-solid border-border" />
                        <div className="flex items-center gap-2">
                          <span
                            className={`${!isMobile ? 'flex-1' : showTargetMobile.includes(ex.id) ? 'flex-1' : ''} text-center font-medium`}
                          >
                            {isMobile ? (
                              <Button
                                variant="solid"
                                color={showTargetMobile.includes(ex.id) ? 'primary' : 'default'}
                                size="sm"
                                onPress={() => handleShowTargetMobile(ex.id)}
                              >
                                Target
                              </Button>
                            ) : (
                              'Target'
                            )}
                          </span>
                          <span
                            className={`${!isMobile ? 'flex-1' : !showTargetMobile.includes(ex.id) ? 'flex-1' : ''} text-center font-medium`}
                          >
                            {isMobile ? (
                              <Button
                                variant="solid"
                                color={!showTargetMobile.includes(ex.id) ? 'primary' : 'default'}
                                size="sm"
                                onPress={() => handleShowTargetMobile(ex.id)}
                              >
                                Actual
                              </Button>
                            ) : (
                              'Actual'
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {ex.target.map((target: SessionExerciseValues, index: number) => {
                            const showTarget = isMobile ? showTargetMobile.includes(ex.id) : true;
                            const showActual = isMobile ? !showTargetMobile.includes(ex.id) : true;
                            const tfSet =
                              targetField?.target?.[index] || ({} as SessionExerciseValues);
                            const afActual =
                              formFields[idx]?.actual?.[index] || ({} as SessionExerciseValues);
                            return (
                              <div key={`target-${index}`} className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 flex-1">
                                  {showTarget && (
                                    <>
                                      <Input
                                        id={`target-weight-${ex.id}-${index}`}
                                        size="sm"
                                        label="Weight"
                                        type="number"
                                        min={0.0}
                                        step="any"
                                        inputMode="decimal"
                                        value={
                                          Number.isFinite(tfSet.weight)
                                            ? tfSet.weight.toString()
                                            : ''
                                        }
                                        endContent={<span className="text-text text-xs">kgs</span>}
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled
                                      />
                                      <span className="flex items-center text-text font-medium">
                                        ×
                                      </span>
                                      <Input
                                        id={`target-reps-${ex.id}-${index}`}
                                        size="sm"
                                        label="Reps"
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={
                                          Number.isFinite(tfSet.reps) ? tfSet.reps.toString() : ''
                                        }
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled
                                      />
                                      <span className="flex items-center text-text font-medium">
                                        @
                                      </span>
                                      <Input
                                        id={`target-rpe-${ex.id}-${index}`}
                                        size="sm"
                                        label="RPE"
                                        type="number"
                                        min={1.0}
                                        max={10.0}
                                        step="any"
                                        inputMode="decimal"
                                        value={
                                          Number.isFinite(tfSet.rpe) ? tfSet.rpe.toString() : ''
                                        }
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled
                                      />
                                    </>
                                  )}
                                  <Button
                                    isIconOnly
                                    variant="solid"
                                    onPress={() => handleCopyTargetValues(ex.id, index)}
                                    disabled={!canProgress}
                                    color={canProgress ? 'primary' : 'secondary'}
                                    size="sm"
                                    className={`my-auto${!canProgress ? ' pointer-events-none opacity-50' : ''}`}
                                  >
                                    <FaArrowRight className="text-white w-4 h-4" />
                                  </Button>
                                  {showActual && (
                                    <>
                                      <Input
                                        id={`actual-weight-${ex.id}-${index}`}
                                        size="sm"
                                        label="Weight"
                                        type="number"
                                        min={0.0}
                                        step="any"
                                        inputMode="decimal"
                                        value={
                                          Number.isFinite(afActual.weight)
                                            ? afActual.weight.toString()
                                            : ''
                                        }
                                        onValueChange={(e) => {
                                          handleActualChange(ex.id, index, 'weight', e);
                                        }}
                                        endContent={<span className="text-text text-xs">kgs</span>}
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled={!canProgress}
                                      />
                                      <span className="flex items-center text-text font-medium">
                                        ×
                                      </span>
                                      <Input
                                        id={`actual-reps-${ex.id}-${index}`}
                                        size="sm"
                                        label="Reps"
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={
                                          Number.isFinite(afActual.reps)
                                            ? afActual.reps.toString()
                                            : ''
                                        }
                                        onValueChange={(e) => {
                                          handleActualChange(ex.id, index, 'reps', e);
                                        }}
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled={!canProgress}
                                      />
                                      <span className="flex items-center text-text font-medium">
                                        @
                                      </span>
                                      <Input
                                        id={`actual-rpe-${ex.id}-${index}`}
                                        size="sm"
                                        label="RPE"
                                        type="number"
                                        min={1.0}
                                        max={10.0}
                                        step="any"
                                        inputMode="decimal"
                                        value={
                                          Number.isFinite(afActual.rpe)
                                            ? afActual.rpe.toString()
                                            : ''
                                        }
                                        onValueChange={(e) => {
                                          handleActualChange(ex.id, index, 'rpe', e);
                                        }}
                                        classNames={{
                                          inputWrapper:
                                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                                          label: 'text-text text-sm',
                                          input: 'text-text',
                                        }}
                                        disabled={!canProgress}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span>Metrics</span>
                        <div className="flex flex-wrap gap-2">
                          {ex.metrics &&
                            metricsOrdered(ex.metrics).map(([key, value]) => (
                              <div key={`metric-${key}`}>
                                <Input
                                  id={`metric-${key}-${ex.id}`}
                                  size="sm"
                                  label={key.replaceAll('_', ' ')}
                                  value={Number.isFinite(value) ? value.toString() : ''}
                                  classNames={{
                                    inputWrapper:
                                      'px-2 border-border group-data-[focus=true]:border-border bg-white max-w-[140px]',
                                    label: 'text-text text-sm line-clamp-1 ',
                                    input: 'text-text',
                                  }}
                                  disabled
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input
                          id={`notes-${ex.id}`}
                          label="Notes"
                          labelPlacement="outside"
                          placeholder={!ex.notes && canProgress ? 'Add notes...' : 'No notes'}
                          type="text"
                          value={ex.notes || ''}
                          classNames={{
                            inputWrapper:
                              'border-border group-data-[focus=true]:border-border bg-white',
                            label: 'text-text group-data-[filled-within=true]:text-text text-sm',
                            input: 'text-text data-[focus=true]:border-border',
                          }}
                          onValueChange={(e) => handleNotesChange(ex.id, e)}
                          disabled={!canProgress}
                        />
                      </div>
                    </CardBody>
                  </Card>
                );
              })
            )}

            {session.session_metric && Object.values(session.session_metric).every((value) => value !== null && value > 0) && (
              <Card className="bg-backgroundSecondary border border-border p-2">
                <CardBody className="text-text space-y-2">
                  <div className="text-text text-lg">Session Metrics</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(session.session_metric).map(([key, value]) => (
                      <Input
                        key={key}
                        size="sm"
                        label-placement="outside"
                        label={key.replaceAll('_', ' ')}
                        value={value ? value.toString() : ''}
                        disabled
                        classNames={{
                          inputWrapper:
                            'px-2 border-border group-data-[focus=true]:border-border bg-white',
                          label: 'text-text text-sm',
                          input: 'text-text text-end',
                        }}
                      />
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-2">
            <Skeleton className="w-full h-[70px] rounded-lg bg-background border border-border animate-pulse" />
            <Skeleton className="w-full h-[70px] rounded-lg bg-background border border-border animate-pulse" />
            <Skeleton className="w-full h-[70px] rounded-lg bg-background border border-border animate-pulse" />
          </div>
        </div>
      )}

      <Modal
        backdrop="blur"
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
        isOpen={calcModal.isOpen}
        onOpenChange={(open) => {
          setCalcModal({ isOpen: open, exercise: open ? calcModal.exercise : undefined });
          if (!open) {
            setCalculationForm({ reps: 0, rpe: 0 });
            setCalculatedWeight({ weight: 0, e1rm: 0 });
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <span className="text-text font-semibold text-lg">Calculate suggested weight</span>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <span className="text-text">
                {calcModal.exercise && (
                  <span>Exercise: {getModifiedExerciseName(calcModal.exercise)}</span>
                )}
              </span>
              <span className="text-xs text-text">
                {calcModal.exercise?.exerciseDate && (
                  <span>Date: {dayjs(calcModal.exercise.exerciseDate).format('MM/DD/YYYY')}</span>
                )}
              </span>
              <div className="flex flex-col items-center gap-2">
                <Input
                  id="reps"
                  label="Reps"
                  min={1}
                  max={30}
                  type="number"
                  size="sm"
                  value={calculationForm.reps > 0 ? calculationForm.reps.toString() : ''}
                  onValueChange={(e) =>
                    setCalculationForm((prev) => ({
                      ...prev,
                      reps: Number(e ?? 0),
                    }))
                  }
                  classNames={{
                    base: 'w-full bg-background rounded-lg text-text',
                    inputWrapper: 'bg-transparent group-data-[focus=true]:border-border',
                    input: 'text-text',
                  }}
                />

                <Input
                  id="rpe"
                  label="RPE"
                  min={1.0}
                  step="any"
                  inputMode="decimal"
                  max={10.0}
                  type="number"
                  size="sm"
                  value={calculationForm.rpe > 0 ? calculationForm.rpe.toString() : ''}
                  onValueChange={(e) =>
                    setCalculationForm((prev) => ({
                      ...prev,
                      rpe: Number(e ?? 0),
                    }))
                  }
                  classNames={{
                    base: 'w-full bg-background rounded-lg text-text',
                    inputWrapper: 'bg-transparent group-data-[focus=true]:border-border',
                    input: 'text-text',
                  }}
                />

                <Input
                  size="sm"
                  label="Calculated Weight"
                  value={calculatedWeight?.weight ? calculatedWeight.weight.toString() : ''}
                  disabled
                  classNames={{
                    base: 'w-full bg-background rounded-lg text-text',
                    inputWrapper: 'bg-transparent group-data-[focus=true]:border-border',
                    input: 'text-text',
                  }}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="solid"
              color="primary"
              disabled={
                !calculationForm.reps ||
                !calculationForm.rpe ||
                calculationForm.reps < 1 ||
                calculationForm.rpe < 1
              }
              onPress={() =>
                calcModal.exercise?.id && handleCalculateWeight(calcModal.exercise?.exerciseId)
              }
            >
              Calculate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        scrollBehavior="inside"
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
        isOpen={changeModifiersModal.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setChangeModifiersModal({ isOpen: false, exerciseId: undefined });
            setModifierSearchTerm('');
          }
        }}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center gap-4">
            <div className="text-2xl font-semibold text-text">Select Modifier</div>
          </ModalHeader>
          <ModalBody>
            {!changeModifiersModal.exerciseId ? null : (
              <>
                <div className="mb-4">
                  <Input
                    placeholder="Search modifiers..."
                    value={modifierSearchTerm}
                    onChange={(e) => setModifierSearchTerm(e.target.value)}
                    startContent={<FaSearch className="text-text" />}
                    classNames={{
                      inputWrapper:
                        'border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary bg-background',
                      input: 'text-text group-data-[has-value=true]:text-text',
                    }}
                  />
                </div>
                {modifierCategoriesData?.modifier_categories &&
                  modifierCategoriesData.modifier_categories.length > 0 ? (
                  (() => {
                    const hasModifiers = modifierCategoriesData.modifier_categories
                      ?.sort((a, b) => a.name.localeCompare(b.name))
                      .some((category) => {
                        const count =
                          modifiersData?.modifiers?.filter(
                            (modifier) => modifier.modifier_category_id === category.id,
                          )?.length ?? 0;
                        return count > 0;
                      });

                    return hasModifiers ? (
                      modifierCategoriesData.modifier_categories
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((category) => {
                          const modifiers =
                            modifiersData?.modifiers?.filter(
                              (modifier) => modifier.modifier_category_id === category.id,
                            ) ?? [];
                          if (modifiers.length === 0) return null;

                          const isMultiSelect = isMultiSelectCategory(category.name);

                          // Get selected modifiers for this category
                          const selectedModifiersForCategory = (() => {
                            if (!Array.isArray(selectedModifiers)) return [];
                            return selectedModifiers.filter((modifierId) => {
                              const mod = modifiersData?.modifiers?.find(
                                (m) => m.id === modifierId,
                              );
                              return mod?.modifier_category_id === category.id;
                            });
                          })();

                          const filteredModifiers = modifiers.filter((modifier) =>
                            modifier.name.toLowerCase().includes(modifierSearchTerm.toLowerCase()),
                          );

                          if (isMultiSelect) {
                            // Multi-select category - use CheckboxGroup
                            return (
                              <div
                                key={category.id}
                                className="border border-border rounded-lg p-2"
                              >
                                <div className="mb-2">
                                  <div className="font-medium text-text mb-1">
                                    {category.name}
                                    <span className="text-xs text-textSecondary ml-2">
                                      (multiple)
                                    </span>
                                  </div>
                                  <CheckboxGroup
                                    orientation="horizontal"
                                    className="gap-4 flex flex-wrap"
                                    value={selectedModifiersForCategory}
                                    onValueChange={(values) => {
                                      setSelectedModifiers((prev) => {
                                        // Remove all modifiers from this category
                                        const filtered = prev.filter((id) => {
                                          const mod = modifiersData?.modifiers?.find(
                                            (m) => m.id === id,
                                          );
                                          return mod?.modifier_category_id !== category.id;
                                        });
                                        // Add the new selected modifiers
                                        return [...filtered, ...values];
                                      });
                                    }}
                                  >
                                    {filteredModifiers.map((modifier) => (
                                      <Checkbox
                                        key={modifier.id}
                                        value={modifier.id}
                                        size="sm"
                                        classNames={{
                                          label: 'text-sm text-text font-medium',
                                        }}
                                      >
                                        {modifier.name}
                                      </Checkbox>
                                    ))}
                                  </CheckboxGroup>
                                </div>
                              </div>
                            );
                          }

                          // Single-select category - use RadioGroup
                          const selectedModifierId =
                            selectedModifiersForCategory.length > 0
                              ? selectedModifiersForCategory[0]
                              : '';

                          return (
                            <div key={category.id} className="border border-border rounded-lg p-2">
                              <div className="mb-2">
                                <div className="font-medium text-text mb-1">{category.name}</div>
                                <RadioGroup
                                  orientation="horizontal"
                                  className="gap-4 flex flex-wrap"
                                  value={selectedModifierId}
                                  onValueChange={(val) => {
                                    if (val === '') {
                                      setSelectedModifiers((prev) =>
                                        prev.filter((id) => {
                                          const mod = modifiersData?.modifiers?.find(
                                            (m) => m.id === id,
                                          );
                                          return mod?.modifier_category_id !== category.id;
                                        }),
                                      );
                                    } else {
                                      setSelectedModifiers((prev) => {
                                        // Remove any existing modifier from this category
                                        const filtered = prev.filter((id) => {
                                          const mod = modifiersData?.modifiers?.find(
                                            (m) => m.id === id,
                                          );
                                          return mod?.modifier_category_id !== category.id;
                                        });
                                        // Add the new modifier
                                        return [...filtered, val];
                                      });
                                    }
                                  }}
                                >
                                  <Radio
                                    value=""
                                    size="sm"
                                    classNames={{ label: 'text-sm text-text font-medium' }}
                                  >
                                    {category.name === 'Bar type' ? 'Barbell' : 'None'}
                                  </Radio>
                                  {filteredModifiers.map((modifier) => (
                                    <Radio
                                      key={modifier.id}
                                      value={modifier.id}
                                      size="sm"
                                      classNames={{
                                        label: 'text-sm text-text font-medium',
                                      }}
                                    >
                                      {modifier.name}
                                    </Radio>
                                  ))}
                                </RadioGroup>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No modifiers available.
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center text-muted-foreground">
                    No modifier categories available.
                  </div>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="solid"
              color="success"
              className="text-white"
              onPress={() => {
                if (changeModifiersModal.exerciseId) {
                  handleUpdateSessionExerciseModifiers(
                    changeModifiersModal.exerciseId,
                    selectedModifiers,
                  );
                  setChangeModifiersModal({ isOpen: false, exerciseId: undefined });
                  setModifierSearchTerm('');
                }
              }}
            >
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageWrapper>
  );
}

export default function SessionProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <SessionProgressPageContent />
    </Suspense>
  );
}
