'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button, CardBody, Card, CardHeader, SelectItem } from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { UserRole, UserStatus, RelationshipStatus } from '@strengthos/shared-types';
import { TrainingSession, useTrainingSessions } from '@/hooks/api/use-training-session';
import { SessionManagement } from '@/components/trainingBlock/SessionManagement';
import { WorkoutCalendar } from '@/components/trainingBlock/WorkoutCalendar';
import { useCoachClients } from '@/hooks/api/use-coach-clients';
import useRoleAccess from '@/hooks/api/use-role-access';
import { UserListResponse, useUsers } from '@/hooks/api/use-users';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';

// Components
const LoadingSpinner = ({ text }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info" />
    {text && <span className="ml-2 text-text mt-2">{text}</span>}
  </div>
);

const EmptyState = () => (
  <div className="text-center p-8 flex flex-col items-center">
    <svg
      className="w-16 h-16 mx-auto text-textMuted mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <h3 className="text-lg font-medium text-textSecondary mb-2">No Workout Session Found</h3>
    <p className="text-textMuted">No training sessions are deployed yet.</p>
  </div>
);

interface AthleteSelectorProps {
  selectedAthlete: string | null;
  onAthleteChange: (athleteId: string | null) => void;
  availableAthletes?: Array<{
    athlete_id: string;
    athlete_firstName: string;
    athlete_lastName: string;
    athlete_email: string;
  }>;
}

const AthleteSelector = ({
  selectedAthlete,
  onAthleteChange,
  availableAthletes,
}: AthleteSelectorProps) => {
  return (
    <Card className="bg-backgroundSecondary border border-border">
      <CardBody>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Athletes</div>
            <div className="text-xs text-textMuted">
              Select an athlete to view their workout sessions
            </div>
          </div>
          {availableAthletes &&
            availableAthletes.length > 0 &&
              <SelectWithClassName
                key={'Athlete Selector'}
                wrapperClassName="w-full sm:w-[50%]"
                value={selectedAthlete ? [selectedAthlete] : []}
                onSelectionChange={(value) => {
                  if(value.currentKey === selectedAthlete) {
                    onAthleteChange(null);
                  } else {
                    onAthleteChange(value.currentKey || null);
                  }
                }}
                label="Select Athlete"
                classNames={{
                  trigger: 'bg-background border-border data-[open=true]:border-border',
                  label: 'text-text',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                  selectorIcon: 'text-text',
                }}
                children={availableAthletes.map((athlete) => (
                  <SelectItem key={athlete.athlete_id} textValue={athlete.athlete_firstName + ' ' + athlete.athlete_lastName}>
                    {athlete.athlete_firstName} {athlete.athlete_lastName}
                  </SelectItem>
                ))}
              />
                // <Button
                //   key={athlete.athlete_id}
                //   variant="bordered"
                //   color={selectedAthlete === athlete.athlete_id ? 'primary' : 'default'}
                //   onPress={() =>
                //     onAthleteChange(
                //       selectedAthlete === athlete.athlete_id ? null : athlete.athlete_id,
                //     )
                //   }
                //   className="h-full"
                // >
                //   <div className="flex flex-col gap-1 p-2">
                //     <span className="text-sm font-medium">
                //       {athlete.athlete_firstName} {athlete.athlete_lastName}
                //     </span>
                //     <span className="text-xs text-textMuted">{athlete.athlete_email}</span>
                //   </div>
                // </Button>
               
            }
        </div>
      </CardBody>
    </Card>
  );
};

interface AthleteCalendarProps {
  athleteId: string;
  user: NonNullable<ReturnType<typeof useAuth>['state']['user']>;
  refreshKey?: number;
}

const AthleteCalendar = ({ athleteId, user, refreshKey }: AthleteCalendarProps) => (
  <div key={refreshKey}>
    <Card className="bg-backgroundSecondary border border-border">
      <CardBody>
        <WorkoutCalendar user={user} ableToAction={false} athleteId={athleteId} />
      </CardBody>
    </Card>
  </div>
);

// Custom hook for workout session filters
const useWorkoutSessionFilters = (userRole: any, userId?: string) => {
  return useMemo(() => {
    if (!userRole || !userId) {
      return { page: 1, limit: 100 };
    }

    const userIdKey =
      userRole === UserRole.ATHLETE
        ? 'athleteId'
        : userRole === UserRole.COACH
          ? 'coachId'
          : undefined;

    if (!userIdKey) {
      return { page: 1, limit: 100 };
    }

    return { [userIdKey]: userId, page: 1, limit: 100 };
  }, [userRole, userId]);
};

// Custom hook for breadcrumbs
const useWorkoutSessionBreadcrumbs = (isAdmin: boolean) => {
  return useMemo(
    () => [
      {
        label: 'Dashboard',
        href: isAdmin ? '/admin' : '/dashboard',
      },
      { label: 'Workout Sessions', href: '/workout/session' },
    ],
    [isAdmin],
  );
};

// Main content component
function WorkoutSessionContent() {
  const { state } = useAuth();
  const user = state.user;
  const { isCoach, isAdmin } = useRoleAccess();
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const router = useRouter();
  const userRole = user?.role;
  const userId = user?.id;
  const isAdminRole = isAdmin();

  const handleSessionDeleted = () => {
    setCalendarRefreshKey((prev) => prev + 1);
  };

  const filters = useWorkoutSessionFilters(userRole, userId);
  const breadcrumbs = useWorkoutSessionBreadcrumbs(isAdminRole);

  // Use coach-athlete relationships API for coaches to get their athletes
  const { data: coachClientsData } = isCoach() ? 
  useCoachClients({ coach_id: user?.id, status: RelationshipStatus.ACTIVE }) 
  : { data: undefined };
  
  const adminUsersFilters = isAdmin()
    ? {
        tenantId: user?.tenantId,
        role: UserRole.ATHLETE,
        status: UserStatus.ACTIVE,
        limit: 1000,
      }
    : { tenantId: '', limit: 0 }; // Fallback filters when not admin
  
  const { data: adminAthletesData } = isAdmin() ? useUsers(adminUsersFilters) : { data: undefined };

  const availableAthletes = useMemo(() => {
    if (isCoach() && coachClientsData?.relationships) {
      return coachClientsData.relationships.map((rel) => ({
        athlete_id: rel.athlete_id,
        athlete_firstName: rel.athlete_firstName,
        athlete_lastName: rel.athlete_lastName,
        athlete_email: rel.athlete_email,
      }));
    } else if (isAdmin() && adminAthletesData) {
      return (adminAthletesData as UserListResponse)?.users?.map((user) => ({
        athlete_id: user.id,
        athlete_firstName: user.profile.firstName,
        athlete_lastName: user.profile.lastName,
        athlete_email: user.email,
      }));
    }
    return undefined;
  }, [coachClientsData, adminAthletesData, isCoach, isAdmin]);

  const { data: sessionsResponse, isLoading, error } = useTrainingSessions(filters);

  const sessionData = useMemo(
    () =>
      Array.isArray(sessionsResponse?.sessions)
        ? (sessionsResponse.sessions as TrainingSession[])
        : [],
    [sessionsResponse?.sessions],
  );

  const pageTitle = useMemo(
    () => (userRole === UserRole.ATHLETE ? 'My Workouts' : 'Athlete Workouts'),
    [userRole],
  );

  // Error state
  if (error) {
    return (
      <PageWrapper title="Workout Session" breadcrumbs={breadcrumbs}>
        <div className="flex flex-col items-center justify-center p-8">
          <span className="text-error font-medium">Failed to load sessions</span>
          <pre className="mt-2 text-xs text-textMuted">{String(error.message || error)}</pre>
        </div>
      </PageWrapper>
    );
  }

  // Loading state
  if (isLoading || !user) {
    return (
      <PageWrapper title="Workout Session" breadcrumbs={breadcrumbs}>
        <LoadingSpinner text={!user ? 'Loading user...' : 'Loading training sessions...'} />
      </PageWrapper>
    );
  }

  const isAthlete = userRole === UserRole.ATHLETE;
  const hasSessions = sessionData.length > 0;

  return (
    <PageWrapper
      title={pageTitle}
      breadcrumbs={breadcrumbs}
      actions={
        <Button
          variant="solid"
          color="primary"
          onPress={() => router.push('/workout/session/deploy')}
        >
          Deploy
        </Button>
      }
    >
      {!isAthlete ? (
        <div className="flex flex-col gap-4">
          <AthleteSelector
            selectedAthlete={selectedAthlete}
            onAthleteChange={setSelectedAthlete}
            availableAthletes={
              (availableAthletes?.map(({ athlete_email, ...rest }) => ({
                ...rest,
                athlete_email: athlete_email ?? '',
              })) ?? []) as Array<{
                athlete_id: string;
                athlete_firstName: string;
                athlete_lastName: string;
                athlete_email: string;
              }>
            }
          />
          {selectedAthlete ? (
            <>
              <AthleteCalendar
                key={`calendar-${selectedAthlete}`}
                athleteId={selectedAthlete}
                user={user}
                refreshKey={calendarRefreshKey}
              />
              <SessionManagement
                key={`sessions-${selectedAthlete}`}
                isAthlete={isAthlete}
                onSessionDeleted={handleSessionDeleted}
                selectedAthlete={selectedAthlete}
              />
            </>
          ) : null}
        </div>
      ) : !hasSessions ? (
        <EmptyState />
      ) : (
        <SessionManagement isAthlete={isAthlete} onSessionDeleted={handleSessionDeleted} />
      )}
    </PageWrapper>
  );
}

export default function WorkoutSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <WorkoutSessionContent />
    </Suspense>
  );
}
