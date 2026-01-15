'use client';

import {
  Card,
  CardBody,
  Alert,
  Tabs,
  Tab,
  CardHeader,
  Button,
  Chip,
  Skeleton,
} from '@heroui/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { proxyClient } from '@/lib/proxy-client';
import { SubscriptionInfo } from '@strengthos/shared-types';
import { useTranslation } from '@/hooks/api/useTranslation';
import { PageWrapper } from '../layout/PageWrapper';
import dayjs from 'dayjs';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  tenantsByStatus: Record<string, number>;
  recentGrowth: {
    newTenants: number;
    newUsers: number;
    period: string;
  };
}

interface TenantHealthMetrics {
  tenantId: string;
  tenantName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'TRIAL';
  userCount: number;
  activeUsers: number;
  lastActivity: Date;
  subscription_info: string;
  subscription_info_details: Record<string, any> | null;
  healthScore: number;
  issues: string[];
}

interface SystemHealthCheck {
  overall: 'healthy' | 'warning' | 'critical';
  database: 'healthy' | 'warning' | 'critical';
  cache: 'healthy' | 'warning' | 'critical';
  external: 'healthy' | 'warning' | 'critical';
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
}

// Icon components
const UsersIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const ActivityIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const ServerIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
    />
  </svg>
);

const ZapIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="var(--color-text)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

export function SuperAdminDashboard() {
  const { state } = useAuth();
  const user = state.user;
  const { t } = useTranslation();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [tenantHealth, setTenantHealth] = useState<TenantHealthMetrics[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, healthResponse, systemResponse] = await Promise.all([
        proxyClient.get('/super-admin/platform-stats'),
        proxyClient.get('/super-admin/tenant-health'),
        proxyClient.get('/super-admin/system-health'),
      ]);

      setPlatformStats(statsResponse as any);
      setTenantHealth(healthResponse as TenantHealthMetrics[]);
      setSystemHealth(systemResponse as SystemHealthCheck);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(t('common.failedToLoad'));
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  // Use heroui Badge color prop instead of custom classes
  const getHealthBadgeColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'critical':
        return 'bg-danger';
      default:
        return 'bg-default';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <ActivityIcon />;
      case 'warning':
        return <AlertTriangleIcon />;
      case 'critical':
        return <AlertTriangleIcon />;
      default:
        return <ActivityIcon />;
    }
  };

  const getTranslatedHealthStatus = (health: string) => {
    return t(`superAdminDashboard.healthStatus.${health}`, { defaultValue: health });
  };

  const getTenantStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success';
      case 'SUSPENDED':
        return 'bg-danger';
      case 'CANCELLED':
        return 'bg-warning';
      case 'TRIAL':
        return 'bg-primary';
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return <Alert description={t('common.accessRequired')} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 bg-backgroundSecondary rounded-lg w-full" />
          <Skeleton className="h-24 bg-backgroundSecondary rounded-lg w-full" />
          <Skeleton className="h-24 bg-backgroundSecondary rounded-lg w-full" />
          <Skeleton className="h-24 bg-backgroundSecondary rounded-lg w-full" />
        </div>
        <Skeleton className="h-48 bg-backgroundSecondary rounded-lg w-full" />
      </div>
    );
  }

  if (error) {
    return <Alert description={error} title={t('common.error')} />;
  }

  return (
    <PageWrapper
      title={t('superAdminDashboard.title')}
      actions={
        <Button onPress={loadDashboardData} variant="solid" color="primary">
          {t('common.refreshData')}
        </Button>
      }
    >
      <div className="w-full flex flex-col gap-4">
        <Tabs
          classNames={{
            tabList: 'border border-border bg-backgroundSecondary',
            tabContent: 'group-data-[selected=true]:text-white text-text',
          }}
          variant="bordered"
          color="primary"
        >
          <Tab key="tenants" title={t('common.tabs.tenants')}>
            <Card className="bg-backgroundSecondary">
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium text-text">
                    {t('superAdminDashboard.tenantHealthMetrics')}
                  </h4>
                  <div className="text-sm text-textMuted">
                    {t('superAdminDashboard.tenantHealthMetricsDescription')}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-backgroundSecondary border border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-text">
                          {t('common.total')} {t('common.tenants')}
                        </div>
                        <BuildingIcon />
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-semibold text-text">
                          {platformStats?.totalTenants || 0}
                        </div>
                        <p className="text-xs text-textMuted">
                          {platformStats?.activeTenants || 0} {t('active')}
                        </p>
                      </CardBody>
                    </Card>

                    <Card className="bg-backgroundSecondary border border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-text">
                          {t('common.total')} {t('common.users')}
                        </div>
                        <UsersIcon />
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-semibold text-text">
                          {platformStats?.totalUsers || 0}
                        </div>
                        <p className="text-xs text-textMuted">
                          {platformStats?.activeUsers || 0} {t('active')}
                        </p>
                      </CardBody>
                    </Card>

                    <Card className="bg-backgroundSecondary border border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-text">
                          {t('superAdminDashboard.newTenants')}
                        </div>
                        <TrendingUpIcon />
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-semibold text-text">
                          {platformStats?.recentGrowth.newTenants || 0}
                        </div>
                        <p className="text-xs text-textMuted">
                          {t('common.last')} {platformStats?.recentGrowth.period || '30'}{' '}
                          {t('common.days')}
                        </p>
                      </CardBody>
                    </Card>

                    <Card className="bg-backgroundSecondary border border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-text">
                          {t('common.new')} {t('common.users')}
                        </div>
                        <TrendingUpIcon />
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-semibold text-text">
                          {platformStats?.recentGrowth.newUsers || 0}
                        </div>
                        <p className="text-xs text-textMuted">
                          {t('common.last')} {platformStats?.recentGrowth.period || '30'}{' '}
                          {t('common.days')}
                        </p>
                      </CardBody>
                    </Card>
                  </div>
                  {tenantHealth.map((tenant) => (
                    <div
                      key={tenant.tenantId}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-text">{tenant.tenantName}</h4>
                          <Chip
                            variant="solid"
                            className={`${getTenantStatusColor(tenant.status)} text-surface`}
                          >
                            {t(tenant.status.toLowerCase())}
                          </Chip>
                        </div>
                        <div className="text-sm text-textMuted mt-1">
                          {tenant.activeUsers}/{tenant.userCount} {t('common.active')}{' '}
                          {t('common.users')}
                        </div>
                        <div className="text-sm text-text mt-1">
                          {tenant.subscription_info && tenant.subscription_info_details ? (
                            <div className="flex flex-col gap-1">
                              <div>
                                <strong>{t('common.plan')}:</strong>{' '}
                                {tenant.subscription_info_details.plan_name}
                              </div>
                              <div>
                                <strong>{t('common.price')}:</strong>{' '}
                                {tenant.subscription_info_details.plan_price} {tenant.subscription_info_details.plan_currency}
                              </div>
                              <div>
                                <strong>{t('common.billingCycle')}:</strong>{' '}
                                {tenant.subscription_info_details.plan_billing_cycle}
                              </div>
                              <div>
                                <strong>{t('common.autoRenew')}:</strong>{' '}
                                {tenant.subscription_info_details.subscription_auto_renew ? t('common.yes') : t('common.no')}
                              </div>
                              {tenant.subscription_info_details !== null && (
                                <>
                                  <div>
                                    <strong>{t('superAdminDashboard.currentPeriodStart')}:</strong>{' '}
                                    {tenant.subscription_info_details.subscription_start_date
                                      ? dayjs(tenant.subscription_info_details.subscription_start_date).format('DD MMMM YYYY')
                                      : 'N/A'}
                                  </div>
                                  <div>
                                    <strong>{t('superAdminDashboard.currentPeriodEnd')}:</strong>{' '}
                                    {tenant.subscription_info_details.subscription_end_date
                                      ? dayjs(tenant.subscription_info_details.subscription_end_date).format('DD MMMM YYYY')
                                      : 'N/A'}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div>{t('superAdminDashboard.noSubscriptionInfo')}</div>
                          )}
                        </div>
                        {tenant.issues.length > 0 && (
                          <div className="text-sm text-danger mt-1">
                            {t('common.issues')}: {tenant.issues.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-text">{tenant.healthScore}</div>
                        <div className="text-sm text-textMuted">
                          {t('superAdminDashboard.healthScore')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="system" title={t('common.tabs.system')}>
            {systemHealth && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-backgroundSecondary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="text-sm font-medium text-text">
                        {t('superAdminDashboard.avgResponseTime')}
                      </div>
                      <ZapIcon />
                    </CardHeader>
                    <CardBody>
                      <div className="text-2xl font-semibold text-text">
                        {systemHealth.performance.avgResponseTime}ms
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="bg-backgroundSecondary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="text-sm font-medium text-text">
                        {t('superAdminDashboard.errorRate')}
                      </div>
                      <AlertTriangleIcon />
                    </CardHeader>
                    <CardBody>
                      <div className="text-2xl font-semibold text-text">
                        {systemHealth.performance.errorRate}%
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="bg-backgroundSecondary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="text-sm font-medium text-text">
                        {t('superAdminDashboard.throughput')}
                      </div>
                      <GlobeIcon />
                    </CardHeader>
                    <CardBody>
                      <div className="text-2xl font-semibold text-text">
                        {systemHealth.performance.throughput}
                      </div>
                      <p className="text-xs text-textMuted">{t('superAdminDashboard.reqPerMin')}</p>
                    </CardBody>
                  </Card>
                </div>

                <Card className="bg-backgroundSecondary">
                  <CardHeader>
                    <div className="font-medium text-text">
                      {t('superAdminDashboard.systemComponents')}
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-2">
                          <DatabaseIcon />
                          <span className="font-medium text-text">{t('common.database')}</span>
                        </div>
                        <Chip
                          variant="solid"
                          className={`${getHealthBadgeColor(systemHealth.database)} text-surface`}
                        >
                          {getTranslatedHealthStatus(systemHealth.database)}
                        </Chip>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-2">
                          <ServerIcon />
                          <span className="font-medium text-text">{t('common.cache')}</span>
                        </div>
                        <Chip
                          variant="solid"
                          className={`${getHealthBadgeColor(systemHealth.cache)} text-surface`}
                        >
                          {getTranslatedHealthStatus(systemHealth.cache)}
                        </Chip>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-2">
                          <GlobeIcon />
                          <span className="font-medium text-text">
                            {t('superAdminDashboard.externalServices')}
                          </span>
                        </div>
                        <Chip
                          variant="solid"
                          className={`${getHealthBadgeColor(systemHealth.external)} text-surface`}
                        >
                          {getTranslatedHealthStatus(systemHealth.external)}
                        </Chip>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-2">
                          <ActivityIcon />
                          <span className="font-medium text-text">
                            {t('superAdminDashboard.overallSystem')}
                          </span>
                        </div>
                        <Chip
                          variant="solid"
                          className={`${getHealthBadgeColor(systemHealth.overall)} text-surface`}
                        >
                          {getTranslatedHealthStatus(systemHealth.overall)}
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </Tab>

          {/* <Tab key="settings" title={t('common.tabs.globalSettings')}>
            <Card className="bg-backgroundSecondary">
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium text-text">{t('common.constants.title')}</h4>
                </div>
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-4">
                <Input
                  label={t('common.constants.kc')}
                  description={t('common.constants.kcDescription')}
                  value={constants.kc.toString()}
                  onChange={(e) => setConstants({ ...constants, kc: Number(e.target.value) })}
                  classNames={{
                    inputWrapper: 'bg-backgroundSecondary rounded-lg border-2 border-border',
                    input: 'text-text',
                  }}
                />
                <Input
                  label={t('common.constants.kp')}
                  description={t('common.constants.kpDescription')}
                  value={constants.kp.toString()}
                  onChange={(e) => setConstants({ ...constants, kp: Number(e.target.value) })}
                  classNames={{
                    inputWrapper: 'bg-backgroundSecondary rounded-lg border-2 border-border',
                    input: 'text-text',
                  }}
                />
              </CardBody>
              <CardFooter className="flex justify-end">
                <Button onPress={updateConstants} variant="solid" color="primary">
                  {t('common.save')}
                </Button>
              </CardFooter>
            </Card>
          </Tab> */}
        </Tabs>
      </div>
    </PageWrapper>
  );
}
