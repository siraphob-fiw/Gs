'use client';

import { Alert } from '@heroui/react';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { SuperAdminDashboard } from '../SuperAdminDashboard';
import { CoachAdminDashboard } from '../../coaching/CoachAdminDashboard';
import { TbAlertTriangleFilled } from 'react-icons/tb';
import { useTranslation } from '@/hooks/api/useTranslation';
import TenantAdminDashboard from '../TenantAdminDashboard';

export function AdminLayout() {
  const { state } = useAuth();
  const user = state.user;
  const { t } = useTranslation();

  if (!user) {
    return <Alert icon={<TbAlertTriangleFilled />} description={t('adminLayout.loginRequired')} />;
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'TENANT_ADMIN':
      return <TenantAdminDashboard />;
    case 'COACH_ADMIN':
      return <CoachAdminDashboard />;
    default:
      return null;
  }
}
