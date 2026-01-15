'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Alert,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  Badge,
  Button,
  ModalBody,
  SelectItem,
} from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { SelectWithClassName } from '../forms/selectWithClassName';
import { TeamOverview, CoachPerformanceMetrics } from '@/types/global';
import { proxyClient } from '@/lib/proxy-client';
import { UserRole, UserStatus } from '@strengthos/shared-types';
import { useUsers } from '@/hooks/api/use-users';
import { CoachApprovalList } from './CoachApprovalList';

// ======== Helper Components ========

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const NoData = ({ message = 'No data available.' }) => (
  <div className="text-center text-muted-foreground py-4">{message}</div>
);

const PerformanceBadge = ({ value, type }: { value: number; type: 'rpe' | 'retention' }) => {
  let colors = 'default';
  if (type === 'rpe') {
    if (value >= 8) colors = 'danger';
    else if (value >= 6) colors = 'warning';
    else colors = 'success';
  } else {
    if (value >= 80) colors = 'success';
    else if (value >= 60) colors = 'warning';
    else colors = 'danger';
  }

  const colorMap: Record<string, 'default' | 'danger' | 'warning' | 'success'> = {
    default: 'default',
    danger: 'danger',
    warning: 'warning',
    success: 'success',
  };

  return (
    <Badge color={colorMap[colors] ?? 'default'} variant="flat">
      {typeof value === 'number' ? value.toFixed(1) : 'N/A'}
      {type === 'retention' ? '%' : ''}
    </Badge>
  );
};

// ======== Main Component ========

export function CoachAdminDashboard() {
  const { state } = useAuth();
  const user = state.user;
  const [teamOverview, setTeamOverview] = useState<TeamOverview | null>(null);
  const [coachMetrics, setCoachMetrics] = useState<CoachPerformanceMetrics[]>([]);
  const { data: usersResponse } = useUsers({ tenantId: user?.tenantId, limit: 1000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign Coach Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedAthlete, setSelectedAthlete] = useState<string>('');

  // Memoized options for selects to avoid recalculating on each render
  const availableCoaches = useMemo(
    () =>
      usersResponse?.users.filter(
        (u) => u.role === UserRole.COACH && u.status === UserStatus.ACTIVE,
      ),
    [usersResponse],
  );
  const availableAthletes = useMemo(
    () =>
      usersResponse?.users.filter(
        (u) =>
          (u.role === UserRole.ATHLETE || u.role === UserRole.SELF_COACHED) &&
          u.status === UserStatus.ACTIVE,
      ),
    [usersResponse],
  );

  const loadDashboardData = useCallback(async () => {
    if (!(user?.role === UserRole.COACH_ADMIN && user?.tenantId)) return;
    setLoading(true);
    setError(null);
    try {
      const [overviewResponse, metricsResponse] = await Promise.all([
        proxyClient.get(`/tenants/${user.tenantId}/coach-admin/overview`),
        proxyClient.get(`/tenants/${user.tenantId}/coach-admin/coach-performance`),
      ]);

      setTeamOverview((overviewResponse as TeamOverview) || null);
      setCoachMetrics((metricsResponse as CoachPerformanceMetrics[]) || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.tenantId]);

  useEffect(() => {
    if (user?.role === UserRole.COACH_ADMIN && user?.tenantId) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Handlers

  // Dialog
  const handleAssignDialogOpen = useCallback(() => setAssignDialogOpen(true), []);
  const handleAssignDialogClose = useCallback(() => {
    setAssignDialogOpen(false);
    setSelectedCoach('');
    setSelectedAthlete('');
  }, []);

  // Assign coach to athlete
  const handleAssignCoach = useCallback(async () => {
    if (!selectedCoach || !selectedAthlete || !user?.tenantId) return;
    setError(null);
    try {
      await proxyClient.post(`/tenants/${user.tenantId}/coach-admin/assign-coach`, {
        coachId: selectedCoach,
        athleteId: selectedAthlete,
      });
      handleAssignDialogClose();
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to assign coach:', err);
      setError('Failed to assign coach to athlete');
    }
  }, [selectedCoach, selectedAthlete, user?.tenantId, loadDashboardData, handleAssignDialogClose]);

  // Early returns for role, loading, error
  if (!user?.role || user.role !== UserRole.COACH_ADMIN) {
    return <Alert color="danger" title="Coach admin access required to view this dashboard." />;
  }
  if (loading) return <LoadingSpinner />;
  if (error) return <Alert color="danger">{error}</Alert>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Coach Admin Dashboard</h1>
          <p className="text-muted-foreground">Team management and coaching oversight</p>
        </div>
        <div className="flex gap-2">
          {/* Assign Coach */}
          <Button onPress={handleAssignDialogOpen} color="primary">
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Assign Coach
          </Button>

          <Modal
            isOpen={assignDialogOpen}
            onOpenChange={(open) => {
              if (!open) handleAssignDialogClose();
            }}
            className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
          >
            <ModalContent>
              <ModalHeader className="flex flex-col gap-2">
                <div>Assign Coach to Athlete</div>
                <div className="text-sm font-light text-textSecondary">
                  Create a new coaching relationship between a coach and athlete.
                </div>
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <SelectWithClassName
                  label="Coach"
                  labelPlacement="outside"
                  placeholder="Select Coach"
                  selectedKeys={selectedCoach ? [selectedCoach] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.isArray(keys)
                      ? keys[0]
                      : (keys as { currentKey: string }).currentKey;
                    setSelectedCoach(selected || '');
                  }}
                  selectorIconColor="text-text"
                  classNames={{
                    trigger:
                      'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                    value: 'text-text group-data-[has-value=true]:text-text',
                    listbox:
                      'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                    label: 'text-text text-sm group-data-[filled=true]:text-text',
                  }}
                >
                  {availableCoaches && availableCoaches.length > 0 ? (
                    availableCoaches.map((coach) => (
                      <SelectItem
                        key={coach.id}
                        textValue={`${coach.profile.firstName} ${coach.profile.lastName} (${coach.email})`}
                      >
                        {coach.profile.firstName} {coach.profile.lastName} ({coach.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-coaches" textValue="No coaches available">
                      No coaches available
                    </SelectItem>
                  )}
                </SelectWithClassName>
                <SelectWithClassName
                  label="Athlete"
                  labelPlacement="outside"
                  placeholder="Select Athlete"
                  selectedKeys={selectedAthlete ? [selectedAthlete] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.isArray(keys)
                      ? keys[0]
                      : (keys as { currentKey: string }).currentKey;
                    setSelectedAthlete(selected || '');
                  }}
                  selectorIconColor="text-text"
                  classNames={{
                    trigger:
                      'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                    value: 'text-text group-data-[has-value=true]:text-text',
                    listbox:
                      'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                    label: 'text-text text-sm group-data-[filled=true]:text-text',
                  }}
                >
                  {availableAthletes && availableAthletes.length > 0 ? (
                    availableAthletes.map((athlete) => (
                      <SelectItem key={athlete.id}>
                        {athlete.profile.firstName} {athlete.profile.lastName} ({athlete.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-athletes" textValue="No athletes available">
                      No athletes available
                    </SelectItem>
                  )}
                </SelectWithClassName>
                <div className="flex justify-end gap-2">
                  <Button
                    onPress={handleAssignCoach}
                    disabled={!selectedCoach || !selectedAthlete}
                    color="primary"
                  >
                    Assign Coach
                  </Button>
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>
          {/* Refresh Data */}
          <Button onPress={loadDashboardData} variant="bordered" color="primary">
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs: Overview, Coaches, Relationships */}
      <Tabs
        classNames={{
          tabList: 'border border-border bg-backgroundSecondary',
          tabContent: 'group-data-[selected=true]:text-text text-text',
        }}
      >
        {/* ----- Overview Tab ----- */}
        <Tab key="overview" title="Overview">
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Total Coaches',
                  value: teamOverview?.stats?.totalCoaches ?? 0,
                  sub: `${teamOverview?.stats?.activeCoaches ?? 0} active`,
                },
                {
                  title: 'Total Athletes',
                  value: teamOverview?.stats?.totalAthletes ?? 0,
                  sub: `${teamOverview?.stats?.activeAthletes ?? 0} active`,
                },
                {
                  title: 'Coaching Relationships',
                  value: teamOverview?.stats?.coachingRelationships ?? 0,
                },
                {
                  title: 'Avg Athletes/Coach',
                  value:
                    typeof teamOverview?.stats?.averageAthletesPerCoach === 'number'
                      ? teamOverview.stats.averageAthletesPerCoach.toFixed(1)
                      : '0.0',
                },
              ].map(({ title, value, sub }, idx) => (
                <Card key={title} className="bg-backgroundSecondary border border-border text-text">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">{title}</div>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-semibold">{value}</div>
                    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Recent Activity & Alerts */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Activity */}
              <Card className="bg-backgroundSecondary border border-border text-text">
                <CardHeader>
                  <div>Recent Activity</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {teamOverview?.recentActivity?.length ? (
                      teamOverview.recentActivity.slice(0, 5).map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp
                                ? new Date(activity.timestamp as string).toLocaleDateString()
                                : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <NoData message="No recent activity" />
                    )}
                  </div>
                </CardBody>
              </Card>
              {/* Team Alerts */}
              <Card className="bg-backgroundSecondary border border-border text-text">
                <CardHeader>
                  <div>Team Alerts</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {teamOverview?.alerts?.length ? (
                      teamOverview.alerts.map((alert, idx) => (
                        <Alert
                          key={idx}
                          icon={
                            <svg
                              className="h-4 w-4 text-yellow-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          }
                        >
                          <div className="ml-2">{alert.message}</div>
                        </Alert>
                      ))
                    ) : (
                      <NoData message="No alerts at this time" />
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        {/* ----- Coaches Tab ----- */}
        <Tab key="coaches" title="Coaches">
          <Card className="bg-backgroundSecondary border border-border text-text">
            <CardHeader>
              <div className="flex flex-col">
                <div className="text-lg font-medium">Coach Performance Metrics</div>
                <div className="text-sm font-light text-textSecondary">
                  Performance data for all coaches in your team
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {coachMetrics.length === 0 ? (
                  <NoData message="No coach performance data available." />
                ) : (
                  coachMetrics.map((coach) => (
                    <div
                      key={coach.coachId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{coach.coachName}</h4>
                          <Badge variant="shadow">{coach.athleteCount} athletes</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {coach.activeAthletes} active • {coach.completedSessions} sessions
                          completed
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Avg RPE:</span>
                            <PerformanceBadge value={coach.averageRPE} type="rpe" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Retention:</span>
                            <PerformanceBadge value={coach.retentionRate} type="retention" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {coach.lastActivity
                            ? new Date(coach.lastActivity as string).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* ----- Approvals Tab ----- */}
        <Tab key="approvals" title="Approvals">
          <CoachApprovalList />
        </Tab>
      </Tabs>
    </div>
  );
}
