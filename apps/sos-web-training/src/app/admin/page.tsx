'use client';

import { Suspense } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';

function AdminPageContent() {
  return <AdminLayout />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
