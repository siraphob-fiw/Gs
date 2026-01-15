'use client';
import React, { Suspense } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useUserById } from '@/hooks/api/use-users';
import { TrainingPreferences } from '@/components/preferences';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useSearchParams } from 'next/navigation';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const { isAdmin } = useRoleAccess();
  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Profile Preferences' },
  ];

  const { data: userData, isLoading, error } = useUserById(id || '');

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading user preferences...</div>
      ) : error ? (
        <div className="p-8 text-center text-danger">Failed to load user.</div>
      ) : userData ? (
        <TrainingPreferences userId={userData.id} />
      ) : (
        <div className="p-8 text-center text-gray-500">User not found.</div>
      )}
    </PageWrapper>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
