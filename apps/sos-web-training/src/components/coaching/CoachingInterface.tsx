'use client';

import React, { useState, useMemo } from 'react';
import {
  Button,
  Card,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  CardBody,
  ModalBody,
  addToast,
  TableColumn,
  Table,
  TableCell,
  TableHeader,
  TableBody,
  TableRow,
  RadioGroup,
  Radio,
} from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { UserRole, User } from '@strengthos/shared-types';
import {
  useCoachClients,
  useCoachOverview,
  useCreateRelationship,
} from '@/hooks/api/use-coach-clients';
import { CiLock, CiViewTable, CiGrid41 } from 'react-icons/ci';
import { IoMdArrowBack, IoMdArrowForward } from 'react-icons/io';
import { FaDumbbell } from 'react-icons/fa6';
import InviteClientModal from './InviteClientModal';
import { useAthleteInvitation } from '@/hooks/api/use-users';
import { WorkoutCalendar } from '../trainingBlock/WorkoutCalendar';
import dayjs from 'dayjs';

export function CoachingInterface() {
  const { state } = useAuth();
  const user = state.user;
  const { data: clientsData } = useCoachClients({ coach_id: user?.id });
  const { data: usersData } = useAthleteInvitation({ role: UserRole.ATHLETE, availableToInvite: true });
  const createRelationshipMutation = useCreateRelationship();
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [durationFilter, setDurationFilter] = useState(14);
  const [calendarDate, setCalendarDate] = useState(dayjs());

  const { data: overviewData } = useCoachOverview(durationFilter);

  const processedCompetitionLifts = useMemo(() => {
    if (!overviewData?.competitionLifts) return [];

    const groupedByExercise: { [key: string]: typeof overviewData.competitionLifts } = {};
    overviewData.competitionLifts.forEach((lift) => {
      const exerciseName = lift.exercise_name;
      if (!groupedByExercise[exerciseName]) {
        groupedByExercise[exerciseName] = [];
      }
      groupedByExercise[exerciseName].push(lift);
    });

    const processed: Array<
      (typeof overviewData.competitionLifts)[0] & { previousE1rm?: number; isImproved?: boolean }
    > = [];

    Object.values(groupedByExercise).forEach((lifts) => {
      const sortedLifts = [...lifts].sort((a, b) => {
        const dateA = a.date ? dayjs(a.date).valueOf() : 0;
        const dateB = b.date ? dayjs(b.date).valueOf() : 0;
        return dateA - dateB;
      });

      sortedLifts.forEach((lift, index) => {
        const previousLift = index > 0 ? sortedLifts[index - 1] : null;
        const previousE1rm = previousLift?.e1rm ?? null;
        const currentE1rm = lift.e1rm ?? 0;
        const isImproved = previousE1rm !== null && currentE1rm > previousE1rm;

        processed.push({
          ...lift,
          previousE1rm: previousE1rm ?? undefined,
          isImproved,
        });
      });
    });

    return processed.sort((a, b) => {
      const dateA = a.date ? dayjs(a.date).valueOf() : 0;
      const dateB = b.date ? dayjs(b.date).valueOf() : 0;
      return dateB - dateA;
    });
  }, [overviewData]);

  const calendarWeek = useMemo(() => {
    const startOfWeek = calendarDate.startOf('week');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      days,
      startDate: startOfWeek,
      athletes: clientsData?.relationships || [],
    };
  }, [calendarDate, clientsData]);

  const handleInviteClient = (clientId: string) => {
    createRelationshipMutation.mutate(
      {
        coach_id: user?.id as string,
        athlete_id: clientId,
        notes: 'Added by coach',
      },
      {
        onSuccess: () => {
          addToast({
            title: 'Client invited successfully',
            description: 'The client has been invited successfully',
            color: 'success',
          });
        },
      },
    );
    setSelectedClient(null);
    setInviteModalOpen(false);
  };

  const isCoach = user?.role === UserRole.COACH || user?.role === UserRole.COACH_ADMIN;

  if (!isCoach) {
    return (
      <div className="">
        <div className="text-center p-8">
          <div className="mb-4">
            <CiLock className="w-16 h-16 mx-auto text-textMuted" />
          </div>
          <h3 className="text-lg font-medium text-textSecondary mb-2">Access Restricted</h3>
          <p className="text-textMuted">
            This section is only available to coaches and coach administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-text">Coach's Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="solid" color="primary" onPress={() => setInviteModalOpen(true)}>
                Add Athlete
              </Button>
              <Button
                variant="light"
                isIconOnly
                onPress={() => setMode(mode === 'grid' ? 'list' : 'grid')}
              >
                {mode === 'grid' ? (
                  <CiGrid41 className="w-5 h-5" />
                ) : (
                  <CiViewTable className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          <Card shadow="none" className="mb-6 border border-border">
            <CardBody>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-text mb-4">
                  Overview - Competition Lifts
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-sm text-textSecondary">Duration:</span>
                    <RadioGroup
                      orientation="horizontal"
                      value={durationFilter.toString()}
                      onValueChange={(value: string) => setDurationFilter(parseInt(value))}
                      size="sm"
                    >
                      <Radio value="14">2 Weeks</Radio>
                      <Radio value="28">4 Weeks</Radio>
                      <Radio value="42">6 Weeks</Radio>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              {processedCompetitionLifts.length === 0 ? (
                <div className="text-center text-textMuted text-sm">No competition lifts found</div>
              ) : mode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {processedCompetitionLifts.sort((a, b) => {
                    return b.date - a.date;
                  }).map((lift, index) => (
                    <Card
                      key={lift.session_id + '-' + lift.date + '-' + lift.exercise_name + '-' + index}
                      className="border border-border"
                    >
                      <CardBody className="p-2">
                        <div className="h-full flex items-start justify-between">
                          <div className="h-full flex flex-col justify-between flex-1">
                            <div className="text-textMuted text-xs">{lift.athlete_name}</div>
                            <div className="font-medium text-text text-sm mb-2">
                              {lift.exercise_name}
                            </div>
                            <FaDumbbell className="w-5 h-5" />
                          </div>
                          <div className="h-full flex flex-col items-end justify-between flex-1">
                            <div className="text-textMuted text-xs">
                              {lift.date && dayjs(lift.date).isValid() ? (
                                dayjs(lift.date).format('DD MMM YYYY')
                              ) : (
                                <span className="text-danger">Invalid date</span>
                              )}
                            </div>
                            <div className="text-end text-sm">
                              <div className="text-textSecondary">
                                {lift.actual.reps} x {lift.actual.weight.toFixed(2)} kgs
                              </div>
                              <div className="text-text">
                                E1RM:{' '}
                                <span
                                  className={
                                    lift.previousE1rm !== undefined
                                      ? lift.isImproved
                                        ? 'text-success'
                                        : 'text-danger'
                                      : 'text-text'
                                  }
                                >
                                  {lift.e1rm.toFixed(2)} kgs
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableColumn>Exercise</TableColumn>
                    <TableColumn>Date</TableColumn>
                    <TableColumn>Athlete</TableColumn>
                    <TableColumn>Weight</TableColumn>
                    <TableColumn>Reps</TableColumn>
                    <TableColumn>RPE</TableColumn>
                    <TableColumn>E1RM</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {processedCompetitionLifts.sort((a, b) => {
                      return b.date - a.date;
                    }).map((lift, index) => (
                      <TableRow key={lift.session_id + '-' + lift.date + '-' + lift.exercise_name + '-' + index}>
                        <TableCell>{lift.exercise_name}</TableCell>
                        <TableCell>
                          {lift.date ? dayjs(lift.date).format('DD MMM YYYY') : ''}
                        </TableCell>
                        <TableCell>{lift.athlete_name}</TableCell>
                        <TableCell>{lift.actual.weight.toFixed(2)} kgs</TableCell>
                        <TableCell>{lift.actual.reps}</TableCell>
                        <TableCell>{lift.actual.rpe}</TableCell>
                        <TableCell
                          className={
                            lift.previousE1rm !== undefined
                              ? lift.isImproved
                                ? 'text-success'
                                : 'text-danger'
                              : 'text-text'
                          }
                        >
                          {lift.e1rm.toFixed(2)} kgs
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="mb-6 border border-border">
            <CardBody>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-text mb-4">
                  Overview - Session Schedule
                </h2>
                {overviewData?.sessionSchedule &&
                Object.keys(overviewData?.sessionSchedule).length > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Button
                        isIconOnly
                        variant="light"
                        onPress={() => setCalendarDate(calendarWeek.startDate.subtract(1, 'week'))}
                      >
                        <IoMdArrowBack className="w-5 h-5" />
                      </Button>
                      <h2 className="text-sm sm:text-lg font-semibold text-text text-center">
                        {calendarWeek.startDate.format('MMM D')} -{' '}
                        {dayjs(calendarWeek.startDate).add(6, 'day').format('MMM D, YYYY')}
                      </h2>
                      <Button
                        isIconOnly
                        variant="light"
                        onPress={() => setCalendarDate(calendarWeek.startDate.add(1, 'week'))}
                      >
                        <IoMdArrowForward className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px] w-full">
                        <div className="grid grid-cols-9 gap-2 mb-2">
                          <div className="font-medium text-text text-sm col-span-2"></div>
                          {calendarWeek.days.map((day) => (
                            <div key={day} className="font-medium text-text text-sm text-center">
                              {day.substring(0, 3)}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {calendarWeek.athletes.map((athlete) => (
                            <div key={athlete.id} className="grid grid-cols-9 gap-2 items-center">
                              <div className="text-sm text-text truncate col-span-2">
                                {athlete.athlete_firstName} {athlete.athlete_lastName}
                              </div>
                              {calendarWeek.days.map((_, dayIdx) => {
                                const targetDate = calendarWeek.startDate.add(dayIdx, 'day');
                                const athleteSessions =
                                  overviewData?.sessionSchedule[athlete.athlete_id];
                                const hasActivity = athleteSessions?.includes(
                                  targetDate.format('YYYY-MM-DD'),
                                );
                                return (
                                  <div
                                    key={dayIdx}
                                    className="flex items-center justify-center h-8"
                                  >
                                    <div
                                      className={`w-6 h-6 border border-border rounded ${
                                        hasActivity ? 'bg-success' : 'bg-backgroundSecondary'
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-textMuted text-sm">
                    No session schedule found
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <InviteClientModal
        isOpen={inviteModalOpen}
        clientsData={usersData?.users ?? []}
        onClose={() => setInviteModalOpen(false)}
        onInvite={(clientId) => handleInviteClient(clientId)}
      />

      <Modal
        scrollBehavior="inside"
        size="4xl"
        backdrop="blur"
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
        isOpen={selectedClient !== null ? true : false}
        onClose={() => setSelectedClient(null)}
      >
        <ModalContent>
          <ModalHeader>User calendar</ModalHeader>
          <ModalBody>
            <WorkoutCalendar user={user} ableToAction={false} athleteId={selectedClient?.id} />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="solid"
              color="secondary"
              className="w-fit ml-auto"
              onPress={() => setSelectedClient(null)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
