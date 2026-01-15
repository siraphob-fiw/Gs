'use client';
import React from 'react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { PageWrapper } from '../layout/PageWrapper';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Skeleton,
  Table,
  TableColumn,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { FaSyncAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/auth-context';
import { useTenantLeaderboard } from '@/hooks/api/use-tenants';
import { UserStatus } from '@strengthos/shared-types';
import dayjs from 'dayjs';
import { LiftLeaderBoard } from './LiftLeaderboard';

export default function TenantAdminDashboard() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const user = state.user;
  const {
    data: tenantLeaderboard,
    isLoading: isLoadingTenantLeaderboard,
    refetch: refetchTenantLeaderboard,
  } = useTenantLeaderboard(user?.tenantId ?? '');

  if (!user) return null;

  return (
    <PageWrapper
      title={t('tenantAdminDashboard.title', { defaultValue: 'Tenant Dashboard' })}
      actions={
        <Button
          variant="solid"
          color="primary"
          onPress={() => refetchTenantLeaderboard()}
          startContent={<FaSyncAlt />}
        >
          {t('common.refreshData')}
        </Button>
      }
    >
      <div className="w-full flex flex-col gap-4">
        {isLoadingTenantLeaderboard ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 bg-backgroundSecondary rounded-lg w-full" />
            <Skeleton className="h-24 bg-backgroundSecondary rounded-lg w-full" />
            <Skeleton className="h-24 bg-backgroundSecondary rounded-lg w-full" />
          </div>
        ) : (
          <div className="w-full flex flex-col gap-8">
            {/* Card List for Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-backgroundSecondary border border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium text-text">
                    {t('common.total')} {t('common.users')}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="text-2xl font-semibold text-text">
                    {tenantLeaderboard ? tenantLeaderboard.leaderboard.length : '--'}
                  </div>
                </CardBody>
              </Card>
              {/* Placeholder cards for active users/last activity (pending actual data/hook) */}
              <Card className="bg-backgroundSecondary border border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium text-text">
                    {t('tenantAdminDashboard.activeUsers', { defaultValue: 'Active Users' })}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="text-2xl font-semibold text-text">
                    {tenantLeaderboard
                      ? tenantLeaderboard.leaderboard.filter(
                          (user) => user.status === UserStatus.ACTIVE,
                        ).length
                      : '--'}
                  </div>
                </CardBody>
              </Card>
              <Card className="bg-backgroundSecondary border border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium text-text">
                    {t('tenantAdminDashboard.lastActivity', { defaultValue: 'Last Activity' })}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="font-medium text-text">
                    {tenantLeaderboard && tenantLeaderboard.leaderboard.length > 0
                      ? dayjs(
                          tenantLeaderboard.leaderboard.sort(
                            (a, b) =>
                              dayjs(b.lastActivity).valueOf() - dayjs(a.lastActivity).valueOf(),
                          )[0].lastActivity,
                        ).format('DD MMM YYYY')
                      : '--'}
                  </div>
                </CardBody>
              </Card>
            </div>
            {/* Table for Leaderboard, using HeroUI Table */}
            {tenantLeaderboard && tenantLeaderboard.leaderboard.length > 0  ? (
              <LiftLeaderBoard leaderboard={tenantLeaderboard.leaderboard}/>
            ) : (
              <Card className='bg-background'>
                <CardBody className='text-center my-8'>
                  No Leaderboard data available
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
