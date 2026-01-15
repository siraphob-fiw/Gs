'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { HomeNavigation } from './HomeNavigation';
import { useRoleAccess } from '@/hooks/api/use-role-access';

interface HomeLayoutProps {
  children: React.ReactNode;
}

export const HomeLayout = ({ children }: HomeLayoutProps) => {
  const { state } = useAuth();
  const { user, isLoading } = state;
  const { isAdmin } = useRoleAccess();

  // Use useMemo instead of setState/useEffect to avoid render loops
  const redirectUrl = useMemo(() => {
    if (user) {
      if (isAdmin()) {
        return { url: '/admin', label: 'Go to Dashboard' };
      } else {
        return { url: '/dashboard', label: 'Go to Dashboard' };
      }
    } else {
      return { url: '/login', label: 'Login' };
    }
    // Only depends directly on user and isAdmin
  }, [user, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto"></div>
          <p className="mt-2 text-textMuted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen">
      <HomeNavigation redirectUrl={redirectUrl} />
      {children}
    </section>
  );
};
