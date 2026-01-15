'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { CoachingInterface } from '@/components/coaching/CoachingInterface';
import { UserDashboard } from '@/components/athlete/UserDashboard';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useUserById } from '@/hooks/api/use-users';
import { useCoachDiscoveryProfile } from '@/hooks/api/use-coach-clients';

function AppDashboardContent() {
  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  const { isAdmin, isCoach, isUser } = useRoleAccess();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto"></div>
          <p className="mt-2 text-textMuted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isAdmin()) {
      router.replace('/admin');
    }
  }, [user]);

  const { data: userProfile, isLoading: isLoadingProfile } = useUserById(user?.id || '');
  const { data: coachDiscoveryProfile, isLoading: isLoadingCoachDiscoveryProfile } = isCoach()
    ? useCoachDiscoveryProfile()
    : { data: null, isLoading: false };
  const [isProfileValidated, setIsProfileValidated] = useState(false);

  useEffect(() => {
    // If user is not a regular user or coach (e.g., admin), skip profile validation
    if (!isUser() && !isCoach()) {
      setIsProfileValidated(true);
      return;
    }

    if (isLoadingProfile) {
      return;
    }

    const { dateOfBirth, gender, bodyWeight, height } = userProfile?.profile ?? {};
    if (isUser() && (!dateOfBirth || !gender || !bodyWeight || !height)) {
      router.replace('/setupUserProfile');
    } else if (
      isCoach() &&
      (!dateOfBirth || !gender || !bodyWeight || !height) &&
      (!coachDiscoveryProfile ||
        (coachDiscoveryProfile as any)?.message === 'Coach discovery profile not found' ||
        (coachDiscoveryProfile &&
          (!Array.isArray((coachDiscoveryProfile as any).specializations) ||
            ((coachDiscoveryProfile as any).specializations?.length ?? 0) === 0 ||
            !Array.isArray((coachDiscoveryProfile as any).certifications) ||
            ((coachDiscoveryProfile as any).certifications?.length ?? 0) === 0 ||
            !(coachDiscoveryProfile as any)?.availability ||
            !Array.isArray((coachDiscoveryProfile as any).socialLinks) ||
            ((coachDiscoveryProfile as any).socialLinks?.length ?? 0) === 0)))
    ) {
      router.replace('/setupCoachProfile');
    } else {
      setIsProfileValidated(true);
    }
  }, [
    userProfile,
    isLoadingProfile,
    isUser,
    isCoach,
    router,
    coachDiscoveryProfile,
    isLoadingCoachDiscoveryProfile,
  ]);

  // Show loading while validating profile for users/coaches
  if ((isUser() || isCoach()) && !isProfileValidated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto"></div>
          <p className="mt-2 text-textMuted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {isCoach() && <CoachingInterface />}
      {isUser() && <UserDashboard />}
    </div>
  );
}

export default function AppDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <AppDashboardContent />
    </Suspense>
  );
}
