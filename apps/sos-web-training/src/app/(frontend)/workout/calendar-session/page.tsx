'use client';

import React, { Suspense } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { WorkoutCalendar } from '@/components/trainingBlock/WorkoutCalendar';
import { Card, CardBody } from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { useRoleAccess } from '@/hooks/api/use-role-access';

function CalendarSessionPageContent() {
  const { state } = useAuth();
  const user = state.user;
  const { isAdmin } = useRoleAccess();

  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Calendar Training Session' },
  ];

  const LoadingSpinner = ({ text }: { text?: string }) => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info"></div>
      {text && <span className="ml-2 text-text mt-2">{text}</span>}
    </div>
  );

  if (!user) {
    return <LoadingSpinner text="Loading user..." />;
  }

  return (
    <PageWrapper title="Calendar Training Session" breadcrumbs={breadcrumbs}>
      <Card className="bg-backgroundSecondary border border-border">
        <CardBody>
          <WorkoutCalendar user={user} ableToAction={true} />
        </CardBody>
      </Card>
    </PageWrapper>
  );
}

export default function CalendarSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <CalendarSessionPageContent />
    </Suspense>
  );
}
