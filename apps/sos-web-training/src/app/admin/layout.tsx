'use client';

import { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { withAuth } from '@/components/auth/with-auth';

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return <AppLayout>{children}</AppLayout>;
}

export default withAuth(AdminLayoutWrapper);
