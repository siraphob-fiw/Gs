'use client';

import ModifierList from '@/components/modifier/modifierList';
import { PageWrapper } from '@/components/layout/PageWrapper';
import useRoleAccess from '@/hooks/api/use-role-access';
import { useAuth } from '@/contexts/auth-context';
import React, { Suspense } from 'react';

const ModifierPage = () => {
  const { isAdmin } = useRoleAccess();
  const { state } = useAuth();
  const user = state.user;

  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Manage Modifiers' },
  ];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info"></div>
        </div>
      }
    >
      <PageWrapper breadcrumbs={breadcrumbs}>
        <ModifierList effectiveTenantId={user?.tenantId ?? ''} />
      </PageWrapper>
    </Suspense>
  );
};

export default ModifierPage;
