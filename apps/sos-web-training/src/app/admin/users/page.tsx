'use client';

import { Suspense } from 'react';
import { UserManagement } from '@/components/admin/UserManagement';

function UsersManagementPageContent() {
  return <UserManagement />;
}

export default function UsersManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <UsersManagementPageContent />
    </Suspense>
  );
}
