'use client';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAuth } from '@/hooks/api/use-auth-hooks';
import React, { useMemo, useState, Suspense, useEffect } from 'react';
import { UserRole } from '@strengthos/shared-types';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableRow,
  TableBody,
  TableCell,
  SelectItem,
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Input,
  addToast,
  Pagination,
  Popover,
  PopoverTrigger,
  PopoverContent,
  RangeCalendar,
} from '@heroui/react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { useProgressions, useCreateProgression } from '@/hooks/api/use-progression';
import { useExercises } from '@/hooks/api/use-exercises';
import { useDebounce } from '@/hooks/api/use-debounce';
import { FaTimes, FaCalendar } from 'react-icons/fa';
import dayjs from 'dayjs';
import { parseDate, getLocalTimeZone } from '@internationalized/date';
import { format } from 'date-fns';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { useCoachClients } from '@/hooks/api/use-coach-clients';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useUsers } from '@/hooks/api/use-users';
import Chart from '@/components/dashboard/Chart';
import { useModifiers, useModifierCategories } from '@/hooks/api/use-modifier';
import { generateModifiedExerciseName } from '@/utils/exercise-name-modifier';

type ProgressionType = 'squat' | 'bench' | 'deadlift';

const ProgressionPage = () => {
  const { state } = useAuth();
  const user = state.user;
  const { t } = useTranslation();
  const { isCoach, isAdmin } = useRoleAccess();
  const { data: exercisesData } = useExercises({ limit: 1000 });
  const { data: modifiersData } = useModifiers({ limit: 1000 });
  const { data: modifierCategoriesData } = useModifierCategories({ limit: 1000 });
  const isValidDate = (date: Date | null | undefined): boolean => {
    if (!date) return false;
    const time = date.getTime();
    return !isNaN(time) && isFinite(time);
  };

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(() => {
    const start = dayjs().subtract(1, 'month').toDate();
    const end = dayjs().toDate();
    if (isValidDate(start) && isValidDate(end)) {
      return { start, end };
    }
    return null;
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    page: 1,
    limit: 20,
  });
  const [compareWith4Weeks, setCompareWith4Weeks] = useState(false);

  const selectedDayCount = useMemo(() => {
    if (
      !dateRange?.start ||
      !dateRange?.end ||
      !isValidDate(dateRange.start) ||
      !isValidDate(dateRange.end)
    ) {
      return 0;
    }
    return dayjs(dateRange.end).diff(dayjs(dateRange.start), 'day') + 1;
  }, [dateRange]);


  // When comparing, we need to fetch data from the comparison period as well
  const apiStartDate = useMemo(() => {
    if (!dateRange?.start || !isValidDate(dateRange.start)) return undefined;

    // If comparison is enabled, expand the start date to include the comparison period
    if (compareWith4Weeks && selectedDayCount > 0) {
      return dayjs(dateRange.start).subtract(selectedDayCount, 'days').format('YYYY-MM-DD');
    }

    return dayjs(dateRange.start).format('YYYY-MM-DD');
  }, [dateRange?.start, compareWith4Weeks, selectedDayCount]);

  const { data: progressionSummary, refetch } = useProgressions({
    page: filter.page,
    limit: filter.limit,
    athleteId: selectedAthlete ? selectedAthlete : user?.id,
    startDate: apiStartDate,
    endDate:
      dateRange?.end && isValidDate(dateRange.end)
        ? dayjs(dateRange.end).format('YYYY-MM-DD')
        : undefined,
  });

  // Refetch data when selected athlete changes
  useEffect(() => {
    refetch();
  }, [selectedAthlete, refetch]);

  const createProgressionMutation = useCreateProgression();
  const [showExerciseDrawer, setShowExerciseDrawer] = useState(false);

  const [progressionType, setProgressionType] = useState<ProgressionType | null>(null);
  const [searchExercisesTerm, setSearchExercisesTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchExercisesTerm, 300);
  const [searchTerm, setSearchTerm] = useState('');
  const athleteData = isCoach()
    ? (useCoachClients({ coach_id: user?.id }).data?.relationships.map((relationship) => {
        return {
          id: relationship.athlete_id,
          name: `${relationship.athlete_firstName} ${relationship.athlete_lastName}`,
        };
      }) ?? [])
    : isAdmin()
      ? (useUsers({ role: UserRole.ATHLETE, tenantId: user?.tenantId ?? '' }).data?.users.map(
          (user) => {
            return {
              id: user.id,
              name: `${user.profile.firstName} ${user.profile.lastName}`,
            };
          },
        ) ?? [])
      : [];

  const handleSaveProgression = (type: ProgressionType, exerciseId: string) => {
    const formFields = {
      squat: type === 'squat' ? exerciseId : '',
      bench: type === 'bench' ? exerciseId : '',
      deadlift: type === 'deadlift' ? exerciseId : '',
    };
    createProgressionMutation.mutate(formFields, {
      onSuccess: () => {
        addToast({
          title: 'Progression created successfully',
          description: 'The progression has been created successfully',
          color: 'success',
        });
      },
      onError: () => {
        addToast({
          title: 'Progression creation failed',
          description: 'The progression has not been created',
          color: 'danger',
        });
      },
    });
    setShowExerciseDrawer(false);
    setProgressionType(null);
  };

  const filteredExercises = useMemo(() => {
    const allExercises = exercisesData?.exercises || [];
    let filtered = allExercises;

    if (progressionType) {
      filtered = filtered.filter((exercise) =>
        exercise.name.toLowerCase().includes(progressionType),
      );
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter((exercise) =>
        exercise.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      );
    }
    return filtered;
  }, [exercisesData?.exercises, progressionType, debouncedSearchTerm]);

  // Calculate comparison metrics for previous period (same day count as selected range)
  const comparisonMetrics = useMemo(() => {
    if (
      !compareWith4Weeks ||
      !progressionSummary?.chart ||
      !dateRange?.start ||
      !dateRange?.end ||
      selectedDayCount === 0
    )
      return [];

    return progressionSummary.chart.map((chart, chartIndex) => {
      const comparisonData: Array<{ date: string; value: number; label?: string }> = [];

      const currentPeriodData =
        dateRange?.start && dateRange?.end
          ? chart.data.filter((point) => {
              const pointDate = dayjs(point.date).format('YYYY-MM-DD');
              const startStr = dayjs(dateRange.start).format('YYYY-MM-DD');
              const endStr = dayjs(dateRange.end).format('YYYY-MM-DD');
              return pointDate >= startStr && pointDate <= endStr;
            })
          : chart.data;

      // For each point in the current period, find the corresponding point from the previous period
      for (const currentPoint of currentPeriodData) {
        const currentDate = dayjs(currentPoint.date);
        if (!currentDate.isValid()) continue;

        // Calculate the date from the previous period (selectedDayCount days earlier)
        const previousPeriodDate = currentDate.subtract(selectedDayCount, 'days');
        const previousPeriodDateStr = previousPeriodDate.format('YYYY-MM-DD');

        // Find the data point from the previous period
        const comparisonPoint = chart.data.find((d) => {
          const dDate = dayjs(d.date);
          if (!dDate.isValid()) return false;
          const dDateStr = dDate.format('YYYY-MM-DD');
          return dDateStr === previousPeriodDateStr;
        });

        if (comparisonPoint) {
          comparisonData.push({
            date: currentPoint.date, // Use current date for chart alignment
            value: comparisonPoint.value,
            label: comparisonPoint.date, // Store original date in label for tooltip display
          });
        }
      }

      return {
        id: `${chart.label}_previous_period`,
        name: `${chart.label} (${selectedDayCount} days ago)`,
        data: comparisonData,
        color: chart.color ? `${chart.color}80` : `hsla(${chartIndex * 60},70%,50%,0.5)`,
        unit: undefined,
        lineStyle: 'dashed' as const,
      };
    });
  }, [compareWith4Weeks, progressionSummary?.chart, dateRange, selectedDayCount]);

  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Progression' },
  ];

  const handleOpenDrawer = (type: 'squat' | 'bench' | 'deadlift') => {
    setProgressionType(type);
    setSearchExercisesTerm('');
    setShowExerciseDrawer(true);
  };

  const SetupActionButton = ({
    type,
    reselect,
  }: {
    type: 'squat' | 'bench' | 'deadlift';
    reselect?: boolean;
  }) => {
    return (
      <Button
        key={type}
        variant="bordered"
        color="primary"
        onPress={() => handleOpenDrawer(type)}
        className="w-fit mx-auto"
      >
        Setup {reselect ? 'new' : ''} {type} Progression
      </Button>
    );
  };

  const getModifiedExerciseName = useMemo(() => {
    return (exerciseName: string, modifiers: string[]) => {
      if (!modifiersData?.modifiers || !modifierCategoriesData?.modifier_categories) {
        return exerciseName || 'Unknown Exercise';
      }
      return generateModifiedExerciseName(
        exerciseName || 'Unknown Exercise',
        modifiers || [],
        modifiersData.modifiers as any,
        modifierCategoriesData.modifier_categories as any,
      );
    };
  }, [modifiersData, modifierCategoriesData]);

  return (
    <PageWrapper title={t('progression')} breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-4">
        <Card className="bg-backgroundSecondary border border-border">
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 items-start sm:items-center justify-between">
              {user?.role !== UserRole.ATHLETE && athleteData && athleteData.length > 0 ? (
                <div className="w-full max-w-[300px]">
                  <SelectWithClassName
                    fullwidth={true}
                    label="Athlete"
                    labelPlacement="outside-left"
                    placeholder="Select Athlete"
                    selectedKeys={selectedAthlete ? [selectedAthlete] : []}
                    onSelectionChange={(keys) => {
                      setSelectedAthlete(keys.currentKey || null);
                    }}
                    classNames={{
                      trigger: 'bg-background border-border data-[open=true]:border-border',
                      label: 'text-text',
                      value: 'text-text group-data-[has-value=true]:text-text',
                      listbox:
                        'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                      selectorIcon: 'text-text',
                    }}
                    selectorIconColor="text-text"
                  >
                    {athleteData.map((athlete) => (
                      <SelectItem key={athlete.id} textValue={athlete.name ?? ''}>
                        {athlete.name ?? ''}
                      </SelectItem>
                    ))}
                  </SelectWithClassName>
                </div>
              ) : null}
              <Popover
                isOpen={isCalendarOpen}
                onOpenChange={setIsCalendarOpen}
                placement="bottom-start"
                classNames={{
                  content: 'w-full p-0 bg-backgroundSecondary border border-border',
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="bordered"
                    className="w-fit text-text bg-backgroundSecondary border-border"
                  >
                    <FaCalendar className="mr-2" />
                    {dateRange?.start &&
                    dateRange?.end &&
                    isValidDate(dateRange.start) &&
                    isValidDate(dateRange.end)
                      ? `${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`
                      : 'Select date range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <RangeCalendar
                    maxValue={parseDate(dayjs().format('YYYY-MM-DD'))}
                    value={
                      dateRange?.start &&
                      dateRange?.end &&
                      isValidDate(dateRange.start) &&
                      isValidDate(dateRange.end)
                        ? (() => {
                            try {
                              const startStr = dayjs(dateRange.start).format('YYYY-MM-DD');
                              const endStr = dayjs(dateRange.end).format('YYYY-MM-DD');
                              return {
                                start: parseDate(startStr),
                                end: parseDate(endStr),
                              };
                            } catch (error) {
                              return null;
                            }
                          })()
                        : null
                    }
                    onChange={(value: any) => {
                      if (value && value.start && value.end) {
                        try {
                          const startDate = value.start.toDate(getLocalTimeZone());
                          const endDate = value.end.toDate(getLocalTimeZone());
                          // Validate dates before setting
                          if (isValidDate(startDate) && isValidDate(endDate)) {
                            setDateRange({
                              start: startDate,
                              end: endDate,
                            });
                            setIsCalendarOpen(false);
                          }
                        } catch (error) {
                          console.error('Error parsing date range:', error);
                        }
                      }
                    }}
                    classNames={{
                      base: 'bg-backgroundSecondary',
                      header: 'bg-transparent text-text',
                      headerWrapper: 'bg-backgroundSecondary',
                      gridHeaderRow: 'bg-backgroundSecondary p-2',
                      cellButton: 'text-text data-[disabled=true]:text-textMuted',
                      content: 'bg-backgroundSecondary border border-border',
                      prevButton: 'text-text',
                      nextButton: 'text-text',
                      pickerItem: 'text-text',
                      pickerWrapper: 'bg-transparent',
                      pickerHighlight: 'bg-transparent border-2 border-border',
                      title: 'text-text',
                    }}
                  />
                </PopoverContent>
              </Popover>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compareWith4Weeks}
                  onChange={(e) => setCompareWith4Weeks(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">
                  Compare with previous period{' '}
                  {selectedDayCount > 0 ? `(${selectedDayCount} days ago)` : ''}
                </span>
              </label>
            </div>
            {['squat', 'bench', 'deadlift'].some((exercise) => {
              const chart = progressionSummary?.chart?.find((c) => c.label === exercise);
              return chart && chart.data && chart.data.length > 0;
            }) ? (
              <div className="flex flex-col lg:flex-row justify-center items-stretch gap-2">
                {['squat', 'bench', 'deadlift'].map((exercise) => {
                  const chart = progressionSummary?.chart?.find((c) => c.label === exercise);
                  const hasData = chart && chart.data && chart.data.length > 0;
                  const alreadySetup = chart?.exerciseId ? true : false;
                  return (
                    <div style={{ flex: '1 1 0' }} key={exercise} className="flex">
                      {alreadySetup ? (
                        hasData ? (
                          <div className="flex-1 flex flex-col gap-2 justify-center">
                            {user?.role === UserRole.ATHLETE && (
                              <SetupActionButton
                                type={exercise as 'squat' | 'bench' | 'deadlift'}
                                reselect={true}
                              />
                            )}
                            <Chart
                              type="line"
                              metrics={[
                                {
                                  id: chart.label,
                                  name: chart.label,
                                  data:
                                    dateRange?.start && dateRange?.end
                                      ? chart.data.filter((point) => {
                                          const pointDate = new Date(point.date)
                                            .toISOString()
                                            .split('T')[0];
                                          const startStr = dayjs(dateRange?.start).format(
                                            'YYYY-MM-DD',
                                          );
                                          const endStr = dayjs(dateRange?.end).format('YYYY-MM-DD');
                                          return pointDate >= startStr && pointDate <= endStr;
                                        })
                                      : chart.data,
                                  color: chart.color ?? '#3B82F6',
                                },
                                ...(compareWith4Weeks
                                  ? comparisonMetrics
                                      .filter((m) => m.id === `${chart.label}_previous_period`)
                                      .map((m) => ({
                                        id: m.id,
                                        name: m.name,
                                        data: m.data,
                                        color: m.color,
                                        unit: m.unit,
                                        lineStyle: m.lineStyle,
                                      }))
                                  : []),
                              ]}
                              title={chart.label}
                              showLegend
                              showGrid
                            />
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col gap-2 justify-center">
                            {user?.role === UserRole.ATHLETE ? (
                              <SetupActionButton
                                type={exercise as 'squat' | 'bench' | 'deadlift'}
                              />
                            ) : (
                              <div className="bg-background flex items-center justify-between text-text text-center rounded-lg p-2 border border-border">
                                {exercise
                                  .replaceAll('_', ' ')
                                  .toLowerCase()
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </div>
                            )}
                            <div className="bg-background flex flex-col gap-2 text-text text-center border border-border rounded-md p-2 flex-1 items-center justify-center">
                              <div className="text-text text-center">No data available</div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col gap-2 text-text text-center border border-border rounded-md p-2 flex-1 items-center justify-center">
                          <div className="text-text text-center">No Exercise setup</div>
                          <SetupActionButton type={exercise as 'squat' | 'bench' | 'deadlift'} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : user?.role === UserRole.ATHLETE ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2" key="no-data">
                {['squat', 'bench', 'deadlift'].map((exercise) => (
                  <SetupActionButton
                    key={exercise}
                    type={exercise as 'squat' | 'bench' | 'deadlift'}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-text text-center border border-border rounded-md p-2 flex-1 items-center justify-center">
                <div className="text-text text-center">No Exercise setup</div>
              </div>
            )}
          </CardBody>
        </Card>

        <Table
          aria-label="Progression Table"
          classNames={{
            wrapper:
              'bg-backgroundSecondary border-border border',
            th: 'bg-surface text-text',
            td: 'text-text',
            tbody: 'bg-background',
          }}
          topContent={
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <SelectWithClassName
                aria-label="Limit"
                labelPlacement="outside-left"
                label="Limit"
                placeholder="Limit"
                selectedKeys={filter.limit ? [filter.limit.toString()] : []}
                onSelectionChange={(keys) => {
                  setFilter({ ...filter, limit: Number(keys.currentKey) });
                }}
                selectorIconColor="text-text"
                classNames={{
                  base: 'w-40',
                  label: 'text-text',
                  trigger: 'bg-backgroundSecondary border-white data-[open=true]:border-text',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                  selectorIcon: 'text-text',
                }}
                children={
                  <>
                    <SelectItem key="10">10</SelectItem>
                    <SelectItem key="20">20</SelectItem>
                    <SelectItem key="50">50</SelectItem>
                    <SelectItem key="100">100</SelectItem>
                  </>
                }
              />
              <Input
                type="text"
                placeholder="Search exercises..."
                labelPlacement="outside-left"
                label="Search"
                variant="bordered"
                classNames={{
                  base: 'max-w-sm',
                  label: 'text-text',
                  mainWrapper: 'w-full',
                  inputWrapper: 'bg-transparent',
                  input: 'text-text',
                }}
                value={searchTerm}
                onValueChange={(e) => setSearchTerm(e)}
              />
            </div>
          }
          bottomContent={
            <div className="flex justify-center items-center">
              <Pagination
                total={progressionSummary?.totalPages ?? 0}
                page={progressionSummary?.page ?? 1}
                onChange={(page) => setFilter({ ...filter, page })}
              />
            </div>
          }
        >
          <TableHeader>
            <TableColumn>Date</TableColumn>
            <TableColumn>Workout</TableColumn>
            <TableColumn>Exercise</TableColumn>
            <TableColumn>Sets</TableColumn>
            <TableColumn>Total Reps</TableColumn>
            <TableColumn>Exercise Volume</TableColumn>
            <TableColumn>Max RPE</TableColumn>
            <TableColumn>Estimated Max</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={<div className="text-text text-center">No data available</div>}
          >
            {progressionSummary?.summaries &&
            progressionSummary.summaries.length &&
            progressionSummary.summaries.length > 0 ? (
              progressionSummary.summaries
                .slice()
                .sort((a, b) => dayjs(a.date).diff(dayjs(b.date), 'day'))
                .filter((progression) =>
                  progression.exercise.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((progression) => (
                  <TableRow key={progression.id}>
                    <TableCell>{dayjs(progression.date).format('MMM DD YYYY')}</TableCell>
                    <TableCell>{progression.workout}</TableCell>
                    <TableCell>{getModifiedExerciseName(progression.exercise, progression.modifiers || [])}</TableCell>
                    <TableCell>{progression.sets}</TableCell>
                    <TableCell>{progression.totalReps}</TableCell>
                    <TableCell>{progression.exerciseVolume}</TableCell>
                    <TableCell>{progression.maxRPE}</TableCell>
                    <TableCell>{progression.estimatedMax}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-text text-center">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Drawer
        backdrop="blur"
        isOpen={showExerciseDrawer}
        onClose={() => {
          setShowExerciseDrawer(false);
          setProgressionType(null);
        }}
        size="2xl"
        hideCloseButton
      >
        <DrawerContent>
          <DrawerHeader className="flex justify-between gap-4">
            <h1 className="text-lg sm:text-2xl font-semibold text-text">Select Exercise</h1>
            <Button
              isIconOnly
              variant="bordered"
              color="danger"
              onPress={() => {
                setShowExerciseDrawer(false);
                setProgressionType(null);
              }}
            >
              <FaTimes />
            </Button>
          </DrawerHeader>
          <DrawerBody className="px-3">
            <Input
              type="text"
              value={searchExercisesTerm}
              onValueChange={(e) => setSearchExercisesTerm(e)}
              placeholder="Filter exercises by name"
              className="mb-4 p-2 border border-border rounded text-text bg-background"
            />
            <div className="flex flex-wrap gap-2">
              {filteredExercises.length === 0 && (
                <div className="text-text">No exercises found.</div>
              )}
              {filteredExercises.map((exercise) =>
                progressionType ? (
                  <Button
                    key={exercise.id}
                    variant="bordered"
                    color="primary"
                    onPress={() => {
                      handleSaveProgression(progressionType, exercise.id);
                    }}
                  >
                    {exercise.name}
                  </Button>
                ) : null,
              )}
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </PageWrapper>
  );
};

const ProgressionPageContent = ProgressionPage;

export default function ProgressionPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <ProgressionPageContent />
    </Suspense>
  );
}
