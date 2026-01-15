'use client';

import React, { Suspense, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { WorkoutManagement } from '@/components/trainingBlock/WorkoutManagement';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/api/use-auth-hooks';
import { UserRole } from '@strengthos/shared-types';
import { useTenants } from '@/hooks/api/use-tenants';
import { useTranslation } from '@/hooks/api/useTranslation';

export default function ManageWorkoutsPage() {
  const { isAdmin, isCoach } = useRoleAccess();
  const router = useRouter();
  const { state } = useAuth();
  const user = state.user;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const [selectedTenantId, setSelectedTenantId] = useState<string>(user?.tenantId ?? '');
  const { data: tenantsData } = isAdmin() ? useTenants() : { data: [] };
  const { t } = useTranslation();

  // For super admin, use selected tenant; otherwise use user's tenant
  const effectiveTenantId = isSuperAdmin ? selectedTenantId : user?.tenantId;

  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: isAdmin() ? 'Global Program Builder' : 'Program Builder' },
  ];

  const DeployButton = () => {
    return (
      <Button
        variant="solid"
        color="primary"
        onPress={() => router.push('/workout/session/deploy')}
        className="text-sm"
      >
        Deploy Custom Session
      </Button>
    );
  };

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info"></div>
        </div>
      }
    >
      <PageWrapper
        breadcrumbs={breadcrumbs}
        title="Program Builder"
        actions={isCoach() && <DeployButton />}
      >
         <WorkoutManagement
            ableToCreate={isAdmin() || isCoach()}
            ableToEditCustom={isAdmin() || isCoach()}
            ableToEditGlobal={isAdmin()}
            ableToDelete={isAdmin()}
            effectiveTenantId={effectiveTenantId}
          />
      </PageWrapper>
    </Suspense>
  );
}
