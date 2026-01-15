'use client';

import { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { withAuth } from '@/components/auth/with-auth';

interface AppLayoutWrapperProps {
  children: ReactNode;
}

function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  return <AppLayout>{children}</AppLayout>;
}

export default withAuth(AppLayoutWrapper);
