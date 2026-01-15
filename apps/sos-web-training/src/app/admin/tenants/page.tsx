'use client';

import { Suspense, useState } from 'react';
import { TenantSettingsForm } from '@/components/admin/TenantSettingsForm';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@strengthos/shared-types';
import { Button, Drawer, DrawerHeader, DrawerContent, DrawerBody } from '@heroui/react';
import { CreateTenantForm } from '@/components/admin/CreateTenantForm';

const breadcrumbs = [{ label: 'Dashboard', href: '/admin' }, { label: 'Tenant Management' }];

function TenantsPageContent() {
  const { state } = useAuth();
  const user = state.user;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const Actions: React.ReactNode[] = [];
  const [isCreateTenantDrawerOpen, setIsCreateTenantDrawerOpen] = useState(false);
  const [Loading, setLoading] = useState(false);
  

  if(isSuperAdmin) {
    Actions.push(
      <Button key="create-tenant" color="primary" variant="solid" onPress={() => {
        setIsCreateTenantDrawerOpen(true);
      }}>
        Create Tenant
      </Button>
    );
  }

  if(Loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
      </div>
    );
  }

  return (
    <PageWrapper title="Tenant Management" breadcrumbs={breadcrumbs} actions={Actions}>
      <TenantSettingsForm />

      <Drawer
        backdrop="blur"
        isOpen={isCreateTenantDrawerOpen}
        onOpenChange={setIsCreateTenantDrawerOpen}
        size="2xl"
      >
        <DrawerContent className="bg-backgroundSecondary">
          <>
            <DrawerHeader className="flex justify-between gap-4">
              <h3 className="text-lg font-medium">Create Tenant</h3>
            </DrawerHeader>
            <DrawerBody>
              <CreateTenantForm 
                onTenantCreated={() => {
                  setLoading(false);
                  setIsCreateTenantDrawerOpen(false);
                }}
              />
            </DrawerBody>
          </>
        </DrawerContent>
        
      </Drawer>
    </PageWrapper>
  );
}

export default function TenantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <TenantsPageContent />
    </Suspense>
  );
}
