'use client';

import React, { useEffect, useState } from 'react';
import {
  addToast,
  Button,
  Card,
  CardBody,
  SelectItem,
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import {
  TrainingSession,
  useDeleteTrainingSession,
  useTrainingSessions,
} from '@/hooks/api/use-training-session';
import { FaCopy, FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { SelectWithClassName } from '../forms/selectWithClassName';
import dayjs from 'dayjs';
import useRoleAccess from '@/hooks/api/use-role-access';
import ConfirmationModal from '../forms/ConfirmationModal';
import { SessionStatus } from '@/types/global';

const LoadingSpinner = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info"></div>
    <span className="ml-2 text-text">{text}</span>
  </div>
);

const TableListSessions = ({
  sessions,
  isAthlete,
  onDeleteSession,
}: {
  sessions: TrainingSession[];
  isAthlete: boolean;
  onDeleteSession: (id: string) => void;
}) => {
  const defaultSortDescriptor: SortDescriptor = {
    column: 'startDate',
    direction: 'ascending',
  };
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(defaultSortDescriptor);
  const [sessionData, setSessionData] = useState<TrainingSession[]>(sessions);
  const router = useRouter();

  const handleDeleteSession = (id: string) => {
    onDeleteSession(id);
  };

  const handleViewSession = (id: string) => {
    router.push(`/workout/session/${id}`);
  };

  const handleDuplicateSession = (id: string) => {
    router.push(`/workout/session/duplicate/${id}`);
  };

  const handleEditSession = (id: string) => {
    router.push(`/workout/session/edit/${id}`);
  };

  const getSessionDateRange = (session: TrainingSession) => {
    if (!session.exercises || session.exercises.length === 0) return 'N/A';

    const dates = session.exercises
      .map((ex) => {
        if (!ex.exerciseDate) return null;
        return typeof ex.exerciseDate === 'string'
          ? dayjs(ex.exerciseDate).unix()
          : ex.exerciseDate instanceof Date
            ? dayjs(ex.exerciseDate).unix()
            : null;
      })
      .filter((d): d is number => d !== null);

    if (dates.length === 0) return 'N/A';

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    return dayjs.unix(minDate).format('DD MMM') + ' - ' + dayjs.unix(maxDate).format('DD MMM');
  };

  const getEarliestDate = (session: TrainingSession): number => {
    if (!session.exercises || session.exercises.length === 0) return dayjs().unix();
    const dates = session.exercises
      .map((ex) => {
        if (!ex.exerciseDate) return null;
        return typeof ex.exerciseDate === 'string'
          ? dayjs(ex.exerciseDate).unix()
          : ex.exerciseDate instanceof Date
            ? dayjs(ex.exerciseDate).unix()
            : null;
      })
      .filter((d): d is number => d !== null);
    return dates.length > 0 ? Math.min(...dates) : dayjs().unix();
  };

  const sortSessions = (
    items: TrainingSession[],
    descriptor: SortDescriptor,
  ): TrainingSession[] => {
    const sorted = [...items];
    const columnKey = String(descriptor.column);

    return sorted.sort((a, b) => {
      let first: any;
      let second: any;

      if (columnKey === 'startDate') {
        first = getEarliestDate(a);
        second = getEarliestDate(b);
      } else if (columnKey === 'sessionName') {
        first = a.sessionName || '';
        second = b.sessionName || '';
      } else if (columnKey === 'athleteName') {
        first = a.athleteName || '';
        second = b.athleteName || '';
      } else if (columnKey === 'sessionStatus') {
        first = a.sessionStatus || '';
        second = b.sessionStatus || '';
      } else {
        first = a[columnKey as keyof TrainingSession];
        second = b[columnKey as keyof TrainingSession];
      }

      let cmp: number;

      if (first == null && second == null) return 0;
      if (first == null) return 1;
      if (second == null) return -1;

      if (typeof first === 'number' && typeof second === 'number') {
        cmp = first - second;
      } else if (typeof first === 'string' && typeof second === 'string') {
        const firstNum = !isNaN(Number(first)) && first !== '' ? Number(first) : undefined;
        const secondNum = !isNaN(Number(second)) && second !== '' ? Number(second) : undefined;
        if (firstNum !== undefined && secondNum !== undefined) {
          cmp = firstNum - secondNum;
        } else {
          cmp = first.localeCompare(second, undefined, { sensitivity: 'base' });
        }
      } else if (first instanceof Date && second instanceof Date) {
        cmp = first.getTime() - second.getTime();
      } else {
        cmp = first < second ? -1 : first > second ? 1 : 0;
      }

      if (descriptor.direction === 'descending') {
        cmp *= -1;
      }

      return cmp;
    });
  };

  const handleSortChange = (descriptor: SortDescriptor | undefined) => {
    const sortToUse = descriptor || defaultSortDescriptor;
    setSortDescriptor(sortToUse);
    const sorted = sortSessions(sessions, sortToUse);
    setSessionData(sorted);
  };

  useEffect(() => {
    const sorted = sortSessions(sessions, sortDescriptor);
    setSessionData(sorted);
  }, [sessions, sortDescriptor]);

  return (
    <Table
      aria-label="List Training Sessions"
      removeWrapper
      classNames={{
        th: 'bg-background text-text text-sm font-medium',
        td: 'text-text',
      }}
      sortDescriptor={sortDescriptor}
      onSortChange={handleSortChange}
    >
      <TableHeader>
        <TableColumn className="text-center">#</TableColumn>
        <TableColumn key="sessionName" allowsSorting>
          Session Name
        </TableColumn>
        <TableColumn key="athleteName" className="text-center" allowsSorting>
          Athlete
        </TableColumn>
        <TableColumn key="startDate" className="text-center" allowsSorting>
          Session Date
        </TableColumn>
        <TableColumn key="sessionStatus" className="text-center" allowsSorting>
          Status
        </TableColumn>
        <TableColumn className="text-center">Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {sessionData.map((session, index) => (
          <TableRow key={index + '-' + session.id}>
            <TableCell className="text-center font-medium">{index + 1}</TableCell>
            <TableCell>
              <span className="font-medium">{session.sessionName || 'Untitled'}</span>
            </TableCell>
            <TableCell className="text-center">{session.athleteName}</TableCell>
            <TableCell className="text-center">{getSessionDateRange(session)}</TableCell>
            <TableCell className="text-center">
              {session.sessionStatus ? session.sessionStatus.replaceAll('_', ' ') : 'Unknown'}
            </TableCell>
            <TableCell className="text-center flex items-center gap-2 justify-center">
              {(session.sessionStatus === SessionStatus.PLANNED ||
                session.sessionStatus === SessionStatus.IN_PROGRESS ||
                session.sessionStatus === SessionStatus.OVERDUE) && (
                  <Button
                    variant="solid"
                    size="sm"
                    color="warning"
                    onPress={() => handleEditSession(session.id)}
                    aria-label="Edit Session"
                    isIconOnly
                  >
                    <FaEdit className="text-white" />
                  </Button>
                )}
              <Button
                variant="solid"
                size="sm"
                color="secondary"
                onPress={() => handleDuplicateSession(session.id)}
                aria-label="Duplicate Session"
                isIconOnly
              >
                <FaCopy className="text-white" />
              </Button>
              <Button
                variant="solid"
                size="sm"
                color="primary"
                onPress={() => handleViewSession(session.id)}
                aria-label="View Session"
                isIconOnly
              >
                <FaEye className="text-white" />
              </Button>
              {/* {!isAthlete && ( */}
              <Button
                variant="solid"
                size="sm"
                color="danger"
                onPress={() => handleDeleteSession(session.id)}
                aria-label="Delete Session"
                isIconOnly
              >
                <FaTrash className="text-white" />
              </Button>
              {/* )} */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface SessionManagementProps {
  isAthlete?: boolean;
  onSessionDeleted?: () => void;
  selectedAthlete?: string;
}

export const SessionManagement = ({
  isAthlete = false,
  onSessionDeleted,
  selectedAthlete,
}: SessionManagementProps) => {
  const [filter, setFilter] = useState<{
    coachId?: string;
    athleteId?: string;
    trainingBlockId?: string;
    status?: SessionStatus[];
    page?: number;
    limit?: number;
  }>({ page: 1, limit: 10, status: [] });
  const { data: sessionsData, isLoading: sessionsLoading } = useTrainingSessions({
    ...filter,
    ...(selectedAthlete ? { athleteId: selectedAthlete } : {}),
  });
  const [deleteSessionModalOpen, setDeleteSessionModalOpen] = useState<string | null>(null);
  const deleteSessionMutation = useDeleteTrainingSession();
  const router = useRouter();

  const handleDeleteSession = (id: string) => {
    deleteSessionMutation.mutate(
      { id: id },
      {
        onSuccess: () => {
          addToast({
            title: 'Session deleted successfully',
            description: 'The session has been deleted successfully',
            color: 'success',
          });
          setDeleteSessionModalOpen(null);
          router.refresh();
          // Trigger calendar refresh if callback is provided
          if (onSessionDeleted) {
            onSessionDeleted();
          }
        },
        onError: (error) => {
          addToast({
            title: 'Error deleting session',
            description: error.message,
            color: 'danger',
          });
        },
      },
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <Card className="bg-backgroundSecondary border border-border">
        <CardBody className="flex flex-col gap-2">
          {sessionsLoading ? (
            <LoadingSpinner text="Loading training sessions..." />
          ) : sessionsData ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-row justify-end gap-2">
                <SelectWithClassName
                  aria-labelledby="status-filter"
                  fullwidth
                  id="status"
                  placeholder="Select status"
                  variant="bordered"
                  selectedKeys={filter.status ? filter.status.map((status) => status) : []}
                  onSelectionChange={(e) => {
                    const statusKey = e.currentKey as SessionStatus | 'all' | null;
                    if (statusKey === 'all' || statusKey === null) {
                      setFilter({ ...filter, status: [], page: 1 });
                      return;
                    }
                    const currentStatuses = filter.status || [];
                    if (currentStatuses.includes(statusKey)) {
                      setFilter({
                        ...filter,
                        status: currentStatuses.filter((s) => s !== statusKey),
                        page: 1,
                      });
                    } else {
                      setFilter({
                        ...filter,
                        status: [...currentStatuses, statusKey],
                        page: 1,
                      });
                    }
                  }}
                  selectorIconColor="text-text"
                  classNames={{
                    base: 'w-40',
                    trigger: 'bg-surface data-[open=true]:border-border',
                    value: 'text-text group-data-[has-value=true]:text-text',
                    listbox:
                      'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                    selectorIcon: 'text-text',
                  }}
                  children={
                    <>
                      {Object.values(SessionStatus).map((status: SessionStatus) => (
                        <SelectItem key={status} textValue={status}>
                          {status.replaceAll('_', ' ')}
                        </SelectItem>
                      ))}
                    </>
                  }
                />
              </div>
              <TableListSessions
                sessions={sessionsData.sessions}
                isAthlete={isAthlete}
                onDeleteSession={(id) => setDeleteSessionModalOpen(id)}
              />
            </div>
          ) : (
            <div className="text-center p-8 text-text">
              <HiOutlineLightningBolt className="w-12 h-12 mx-auto mb-4 text-text" />
              <h3 className="text-lg font-medium text-text mb-2">No Training Sessions</h3>
              <p className="text-text">No training sessions found.</p>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmationModal
        isOpen={deleteSessionModalOpen !== null ? true : false}
        onClose={() => setDeleteSessionModalOpen(null)}
        onConfirm={() => handleDeleteSession(deleteSessionModalOpen ?? '')}
        title="Delete Session"
        message="Are you sure you want to delete this session?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default SessionManagement;
