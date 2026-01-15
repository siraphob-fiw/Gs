'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../hooks/api/use-auth-hooks';
import { PiWarningFill } from 'react-icons/pi';
import { Button } from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { useRoleAccess } from '@/hooks/api/use-role-access';

function UnauthorizedPageContent() {
  const router = useRouter();
  const { state } = useAuth();
  const { role, displayName } = useUserProfile();
  const { isAdmin } = useRoleAccess();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-surface shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <PiWarningFill className="mx-auto h-16 w-16 text-error" />
        </div>
        <h1 className="text-2xl font-semibold text-text mb-4">Access Denied</h1>

        <div className="mb-6 text-textMuted">
          <p className="mb-2">
            Sorry {displayName ? displayName : 'there'}, you don&apos;t have permission to access
            this page.
          </p>
          {role && (
            <p className="text-sm bg-backgroundSecondary rounded-md p-2">
              Your current role: <span className="font-medium capitalize">{role}</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onPress={() => router.back()}
            variant="bordered"
            className="w-full bg-text hover:bg-textHover text-surface font-medium py-2 px-4 rounded-md transition-colors"
          >
            Go Back
          </Button>

          {state.isAuthenticated && (
            <Button
              onPress={() => {
                if (isAdmin()) {
                  router.push('/admin');
                } else {
                  router.push('/dashboard');
                }
              }}
              variant="bordered"
              className="w-full bg-primary hover:bg-primaryHover text-surface font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go to Dashboard
            </Button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-textMuted">
            If you believe this is an error, please contact your administrator or coach.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <UnauthorizedPageContent />
    </Suspense>
  );
}
