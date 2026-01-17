'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Pagination,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Radio,
  RadioGroup,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Progress,
} from '@heroui/react';
import { FaQuestionCircle } from 'react-icons/fa';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@strengthos/shared-types';
import { Chart } from '../dashboard/Chart';
import { useStressSummary } from '@/hooks/api/use-progression';
import { HiCheckCircle, HiDotsCircleHorizontal } from 'react-icons/hi';
import dayjs from 'dayjs';
import { PostStatus, usePosts } from '@/hooks/api/use-cms';
import { usePublicTenants } from '@/hooks/api/use-tenants';
import {
  TrainingSession,
  TrainingSessionExercise,
  useTrainingSessionsCalendar,
} from '@/hooks/api/use-training-session';
import { useRouter } from 'next/navigation';
import { HiXMark } from 'react-icons/hi2';

interface UserDashboardProps {
  className?: string;
}

export const UserDashboard = ({ className = '' }: UserDashboardProps) => {
  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  const [stressFilter, setStressFilter] = useState({ range: '3D', page: 1, limit: 10 });
  const [chartPeriod, setChartPeriod] = useState<'3' | '6' | '12'>('3');

  const { data: stressSummaryData, isLoading: stressSummaryLoading } = useStressSummary();
  const { data: currentWorkoutData, isLoading: currentWorkoutLoading } =
    user?.role === UserRole.ATHLETE
      ? useTrainingSessionsCalendar({
        day: dayjs().day(),
        month: dayjs().month(),
        year: dayjs().year(),
        athleteId: user?.id,
      })
      : { data: { sessions: [] } };
  const { data: publicTenants } =
    user?.role === UserRole.ATHLETE && user?.freePlan === true ? usePublicTenants() : { data: [] };
  const [viewTenantDetail, setViewTenantDetail] = useState<string | null>(null);

  const { data: postsData } = usePosts({
    limit: 5,
    page: 1,
    status: PostStatus.PUBLISHED,
  });

  const chartMetrics = useMemo(() => {
    if (!stressSummaryData?.summaries || stressSummaryData.summaries.length === 0) {
      return [];
    }

    const hasCentral = stressSummaryData.summaries.some(
      (s) => s.metrics && typeof s.metrics.central_stress === 'number',
    );
    const hasPeripheral = stressSummaryData.summaries.some(
      (s) => s.metrics && typeof s.metrics.peripheral_stress === 'number',
    );

    // Sort summaries by date
    const sortedSummaries = [...stressSummaryData.summaries].sort(
      (a, b) => dayjs(a.exercise_date).valueOf() - dayjs(b.exercise_date).valueOf(),
    );

    // Calculate baseline function
    const calculateBaseline = (values: number[], index: number, period: number): number => {
      const startIdx = Math.max(0, index - period + 1);
      const periodValues = values
        .slice(startIdx, index + 1)
        .filter((v) => typeof v === 'number' && !isNaN(v));
      if (periodValues.length === 0) return 0;
      return periodValues.reduce((sum, v) => sum + v, 0) / periodValues.length;
    };

    const periodDays = parseInt(chartPeriod);
    const metrics: {
      id: string;
      name: string;
      data: { date: string; value: number }[];
      color: string;
      unit: string;
      lineStyle: 'solid' | 'dashed';
    }[] = [];

    // Total Stress (green)
    const totalStressValues = sortedSummaries.map((s) => s.metrics?.total_stress ?? 0);
    metrics.push({
      id: 'total_stress',
      name: 'Total Stress',
      data: sortedSummaries.map((summary) => ({
        date: dayjs(summary.exercise_date).format('MM/DD/YYYY'),
        value: summary.metrics?.total_stress ?? 0,
      })),
      color: '#10B981', // Green
      unit: '',
      lineStyle: 'solid' as const,
    });
    metrics.push({
      id: 'total_stress_baseline',
      name: 'Total Stress Baseline',
      data: sortedSummaries.map((summary, idx) => ({
        date: dayjs(summary.exercise_date).format('MM/DD/YYYY'),
        value: calculateBaseline(totalStressValues, idx, periodDays),
      })),
      color: '#10B981', // Green
      unit: '',
      lineStyle: 'dashed' as const,
    });

    // Central Stress (red)
    if (hasCentral) {
      const centralStressValues = sortedSummaries.map((s) => s.metrics?.central_stress ?? 0);
      metrics.push({
        id: 'central_stress',
        name: 'Central Stress',
        data: sortedSummaries.map((summary) => ({
          date: dayjs(summary.exercise_date).format('MM/DD/YYYY'),
          value: summary.metrics?.central_stress ?? 0,
        })),
        color: '#EF4444', // Red
        unit: '',
        lineStyle: 'solid' as const,
      });
      metrics.push({
        id: 'central_stress_baseline',
        name: 'Central Stress Baseline',
        data: sortedSummaries.map((summary, idx) => ({
          date: dayjs(summary.exercise_date).format('MM/DD/YYYY'),
          value: calculateBaseline(centralStressValues, idx, periodDays),
        })),
        color: '#EF4444', // Red
        unit: '',
        lineStyle: 'dashed' as const,
      });
    }

    // Peripheral Stress (blue)
    if (hasPeripheral) {
      const peripheralStressValues = sortedSummaries.map((s) => s.metrics?.peripheral_stress ?? 0);
      metrics.push({
        id: 'peripheral_stress',
        name: 'Peripheral Stress',
        data: sortedSummaries.map((summary) => ({
          date: dayjs(summary.exercise_date).format('MM/DD/YYYY'),
          value: summary.metrics?.peripheral_stress ?? 0,
        })),
        color: '#3B82F6', // Blue
        unit: '',
        lineStyle: 'solid' as const,
      });
      metrics.push({
        id: 'peripheral_stress_baseline',
        name: 'Peripheral Stress Baseline',
        data: sortedSummaries.map((summary, idx) => ({
          date: dayjs(summary.exercise_date).format('MM/DD/YYYY'),
          value: calculateBaseline(peripheralStressValues, idx, periodDays),
        })),
        color: '#3B82F6', // Blue
        unit: '',
        lineStyle: 'dashed' as const,
      });
    }

    return metrics;
  }, [stressSummaryData, chartPeriod]);

  const calculateProgress = (exercises: TrainingSessionExercise[]) => {
    const completedExercises = exercises.filter(
      (exercise) => exercise.exerciseStatus === 'COMPLETED',
    );
    return {
      complete: completedExercises.length,
      total: exercises.length,
      progress: ((completedExercises.length / exercises.length) * 100).toFixed(2),
    };
  };

  return (
    <div className={`user-dashboard ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-semibold text-text">User Dashboard</div>
          <div className="text-text">
            Welcome back, {user?.firstName} {user?.lastName}!
          </div>
        </div>
      </div>
      <div className={`grid grid-cols-1 xl:grid-cols-2 gap-4`}>
        <Card className="bg-background border border-border">
          <CardHeader className="text-lg font-medium text-text">News</CardHeader>
          <CardBody className="flex flex-col gap-2">
            {postsData?.data && postsData?.data.length === 0 ? (
              <div className="text-center text-textMuted">No news available.</div>
            ) : (
              <>
                {postsData?.data?.map((item, idx) => (
                  <div key={idx} className="p-2 border-2 border-border rounded-lg">
                    <div className="font-medium">
                      <span className="text-xs text-primary">
                        {dayjs(item.created_at).format('MM/DD/YYYY')}{' '}
                      </span>
                      <span className="text-xs text-text">
                        {item.title}
                      </span>
                    </div>
                    <div className="text-sm text-textSecondary">{item.details}</div>
                  </div>
                ))}
              </>
            )}
          </CardBody>
        </Card>
        {/* Currenct workout */}
        <Card className="bg-background border border-border">
          <CardHeader className="text-lg font-medium text-text">Current Workout</CardHeader>
          <CardBody className="flex flex-col gap-2">
            {currentWorkoutLoading ? (
              <Skeleton className="w-full h-60" />
            ) : currentWorkoutData &&
              currentWorkoutData.sessions &&
              currentWorkoutData.sessions.length > 0 ? (
              <div className="text-sm">
                {currentWorkoutData?.sessions?.map((session: TrainingSession) => (
                  <div key={session.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">{session.sessionName}</div>
                      <Chip color="primary" variant="solid">
                        {session.sessionStatus.replace('_', ' ')}
                      </Chip>
                    </div>
                    <Progress
                      value={Number(calculateProgress(session.exercises).progress)}
                      color="primary"
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        {calculateProgress(session.exercises).complete} /{' '}
                        {calculateProgress(session.exercises).total}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-4 border border-border rounded-lg">
                      <div>Daily Workout</div>
                      <div className="flex flex-col gap-2">
                        {session.exercises
                          .filter(
                            (exercise: TrainingSessionExercise) =>
                              exercise.exerciseDate &&
                              dayjs(exercise.exerciseDate).format('YYYY-MM-DD') ===
                              dayjs().format('YYYY-MM-DD'),
                          )
                          .sort(
                            (a: TrainingSessionExercise, b: TrainingSessionExercise) =>
                              a.order - b.order,
                          )
                          .map((exercise: TrainingSessionExercise) => (
                            <div
                              className="bg-surface text-text p-2 rounded-md flex justify-between items-center gap-2"
                              key={exercise.id}
                            >
                              <div className="flex items-center gap-2">
                                {exercise.exerciseName}
                                <span className="text-xs text-text">
                                  ({exercise.actual.length} sets)
                                </span>
                              </div>
                              <div className="text-xs text-text">
                                {exercise.exerciseStatus === 'IN_PROGRESS' ? (
                                  <HiDotsCircleHorizontal className="w-4 h-4 text-primary" />
                                ) : exercise.exerciseStatus === 'COMPLETED' ? (
                                  <HiCheckCircle className="w-4 h-4 text-success" />
                                ) : (
                                  <HiXMark className="w-4 h-4 text-danger" />
                                )}
                              </div>
                            </div>
                          ))}

                        {session.exercises.filter(
                          (exercise: TrainingSessionExercise) =>
                            exercise.exerciseDate &&
                            dayjs(exercise.exerciseDate).format('YYYY-MM-DD') ===
                            dayjs().format('YYYY-MM-DD'),
                        ).length > 0 ? (
                          <div className="flex justify-end">
                            <Button
                              variant="bordered"
                              color="primary"
                              size="sm"
                              className="w-fit"
                              onPress={() => router.push(`/workout/session/${session.id}`)}
                            >
                              Go to Workout
                            </Button>
                          </div>
                        ) : <div className="text-sm text-textMuted">No exercises for today.</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-sm text-textMuted">No current workout available.</div>
                <Button
                  variant="bordered"
                  color="primary"
                  size="sm"
                  className="w-fit"
                  onPress={() => router.push('/workout/session/deploy')}
                >
                  Deploy
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
        {/* Looking For Gyms */}
        {user?.role === UserRole.ATHLETE && user?.freePlan === true && (
          <Card className="bg-background text-text border border-border">
            <CardHeader className="text-lg font-medium text-text">Looking For Gyms</CardHeader>
            <CardBody className="flex flex-col gap-4 p-4">
              {publicTenants?.length === 0 ? (
                <div className="text-center text-textMuted">No gyms available.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {publicTenants?.map((tenant) => (
                    <Card
                      key={tenant.id}
                      className="bg-background text-text border border-border rounded-xl shadow-enhanced-md hover:border-primary transition-all max-w-full"
                    >
                      <CardBody className="flex flex-col gap-3 p-4">
                        <div className="text-base font-semibold text-primary">{tenant.name}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="text-sm text-textMuted">
                              <span className="font-medium text-text">{tenant.total_athletes}</span>
                              {' / '}
                              {tenant.settings.maxAthletes} athletes
                            </div>
                            <div className="text-sm text-textMuted">
                              <span className="font-medium text-text">{tenant.total_coaches}</span>
                              {' / '}
                              {tenant.settings.maxCoaches} coaches
                            </div>
                            {tenant.pricing_info && tenant.pricing_info.length > 0 && (
                              <div className="text-xs text-textSecondary bg-backgroundSecondary px-2 py-1 rounded-md flex flex-col gap-1 mt-2">
                                {tenant.pricing_info.map((price) => (
                                  <span key={price.id} className="whitespace-nowrap">
                                    <span className="font-medium">{price.service_type}</span>
                                    {' - '}
                                    <span className="text-success">{price.price}</span>{' '}
                                    {price.currency}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-end items-end">
                            <Button
                              variant="bordered"
                              color="primary"
                              size="sm"
                              className="w-fit"
                              onPress={() => setViewTenantDetail(tenant.id)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
        {stressSummaryLoading ? (
          <Skeleton className="w-full h-60" />
        ) : stressSummaryData &&
          stressSummaryData.summaries &&
          stressSummaryData.summaries.length > 0 ? (
          <Card className="bg-background text-text border border-border">
            <CardHeader className="flex gap-y-2 flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-text">Training Stress</h3>
                <Popover placement="bottom-start">
                  <PopoverTrigger>
                    <button className="text-primary hover:text-primary/80 transition-colors">
                      <FaQuestionCircle className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs">
                    <div className="px-1 py-2 text-sm text-text">
                      <p>
                        This chart displays your Stress Index stats for the last 30 days. Stress
                        Index is a measure of how demanding the work has been. Dotted lines are
                        baselines - this represents how much work you are accustomed to for the
                        selected term (3 day / 6 day / 12 day). Workloads above baseline are more
                        taxing than normal. Workloads below baseline are less taxing than normal.
                        You can use the dropdown to narrow the display onto a particular movement
                        pattern.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <RadioGroup
                orientation="horizontal"
                value={chartPeriod}
                onValueChange={(value) => setChartPeriod(value as '3' | '6' | '12')}
              >
                <Radio value="3">3 Day</Radio>
                <Radio value="6">6 Day</Radio>
                <Radio value="12">12 Day</Radio>
              </RadioGroup>
            </CardHeader>
            <CardBody>
              <Chart
                type="line"
                title=""
                metrics={chartMetrics}
                className="bg-transparent border-0 p-0 shadow-none"
                showLegend={true}
              />
            </CardBody>
          </Card>
        ) : null}

        {stressSummaryData &&
          Array.isArray(stressSummaryData.summaries) &&
          stressSummaryData.summaries.length > 0 ? (
          <Card className="bg-background text-text border border-border">
            <CardHeader className="flex gap-y-2 flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start justify-between pb-2">
              <div className="text-lg text-text text-start font-medium mb-2">Stress Summary</div>
              <RadioGroup
                orientation="horizontal"
                value={stressFilter.range}
                onValueChange={(value) => {
                  setStressFilter({
                    ...stressFilter,
                    range: value as '3D' | '6D' | '12D',
                    page: 1,
                  });
                }}
              >
                <Radio value="3D">3 days</Radio>
                <Radio value="6D">6 days</Radio>
                <Radio value="12D">12 days</Radio>
              </RadioGroup>
            </CardHeader>
            <CardBody>
              {(() => {
                // Calculate the start and end dates for the filter
                const rangeInDays = Number(stressFilter.range.replace('D', '')) || 3;
                const startDate = dayjs()
                  .subtract(rangeInDays - 1, 'day')
                  .startOf('day');
                const endDate = dayjs().endOf('day');

                // Always check for valid summaries
                const summaries =
                  stressSummaryData && Array.isArray(stressSummaryData.summaries)
                    ? stressSummaryData.summaries
                    : [];

                // Filter summaries for those ON or AFTER startDate, and ON or BEFORE end of today
                const filteredSummaries = summaries.filter((summary) => {
                  const date = dayjs(summary.exercise_date);
                  // Show dates that are >= startDate and <= today (end of day)
                  return (
                    date.isSame(startDate, 'day') ||
                    (date.isAfter(startDate, 'day') && date.isBefore(endDate, 'day')) ||
                    date.isSame(endDate, 'day')
                  );
                });

                // Page the results
                const paged = filteredSummaries.slice(
                  (stressFilter.page - 1) * stressFilter.limit,
                  stressFilter.page * stressFilter.limit,
                );

                return filteredSummaries.length > 0 ? (
                  <>
                    <Table
                      aria-label="stress-summary"
                      removeWrapper
                      classNames={{
                        base: 'bg-background',
                        th: 'bg-transparent text-text text-sm font-medium border-b border-border',
                        td: 'text-text',
                      }}
                    >
                      <TableHeader>
                        <TableColumn>Date</TableColumn>
                        <TableColumn>Exercise</TableColumn>
                        <TableColumn>Estimated 1RM</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {paged.length > 0 ? (
                          paged.map((summary, idx) => (
                            <TableRow
                              key={summary.exercise_date + '-' + summary.exercise + '-' + idx}
                            >
                              <TableCell>
                                {summary.exercise_date
                                  ? dayjs(summary.exercise_date).format('MM/DD/YYYY')
                                  : '—'}
                              </TableCell>
                              <TableCell>{summary.exercise || '—'}</TableCell>
                              <TableCell>
                                {summary.metrics && typeof summary.metrics.e1rm === 'number'
                                  ? Number(summary.metrics.e1rm).toFixed(2) + ' Kgs'
                                  : '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-textMuted">
                              No stress summary available for this period.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <Pagination
                      className="mx-auto"
                      total={Math.max(1, Math.ceil(filteredSummaries.length / stressFilter.limit))}
                      page={stressFilter.page}
                      onChange={(page) => setStressFilter({ ...stressFilter, page })}
                    />
                  </>
                ) : (
                  <div className="text-sm text-center text-textMuted py-4">
                    No stress summary available for this period.
                  </div>
                );
              })()}
            </CardBody>
          </Card>
        ) : null}
      </div>

      <Modal
        className="bg-background text-text border border-border"
        isOpen={viewTenantDetail !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewTenantDetail(null);
          }
        }}
      >
        <ModalContent>
          <ModalHeader>View Tenant Details</ModalHeader>
          <ModalBody></ModalBody>
          <ModalFooter>
            <Button variant="bordered" color="default" onPress={() => setViewTenantDetail(null)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default UserDashboard;
