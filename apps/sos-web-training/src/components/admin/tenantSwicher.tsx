'use client';

import React, { useState } from 'react';
import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { useTenants } from '@/hooks/api/use-tenants';
import { UserRole } from '@strengthos/shared-types';

// Icon for tenants, you may change as needed
const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
    <path strokeWidth={2} d="M9 21V9h6v12" />
    <path strokeWidth={2} d="M15 9V3M9 9V3" />
    <circle cx="7.5" cy="17.5" r="1.5" />
    <circle cx="16.5" cy="17.5" r="1.5" />
  </svg>
);

type Tenant = {
  id: string;
  name: string;
};

const useAvailableTenants = () => {
  const { data: tenants } = useTenants();
  return tenants ?? [];
};

const useCurrentTenant = () => {
  const { state } = useAuth();
  const user = state.user;
  return user?.tenantId;
};

export function TenantSwitcher() {
  const { state } = useAuth();
  const user = state.user;
  const [pending, setPending] = useState(false);
  const tenants = useAvailableTenants();
  const currentTenant = useCurrentTenant();
  const { switchTenantContext } = useAuth();
  if (!user || user.role !== UserRole.SUPER_ADMIN || tenants.length === 0) return null;

  const handleSwitchTenant = async (tenant: Tenant) => {
    if (pending || tenant.id === state.user?.tenantId) return;

    setPending(true);
    try {
      const result = await switchTenantContext(tenant.id);

      if (result && result.success) {
        window.location.reload();
      } else {
        addToast({
          title: 'Error',
          description: result?.message || 'Failed to switch tenant',
          variant: 'bordered',
          color: 'danger',
        });
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    }
  };

  return (
    <Dropdown
      classNames={{
        content: `text-text bg-background border border-border`,
      }}
    >
      <DropdownTrigger>
        <Button
          size="sm"
          variant="bordered"
          className="flex items-center gap-2 rounded-lg shadow-lg border border-border text-sm font-medium text-text hover:border-info transition"
          isLoading={pending}
        >
          <BuildingIcon className="w-4 h-4" />
          <span className="hidden lg:inline truncate max-w-[150px]">
            {tenants.length > 0
              ? tenants.find((tenant) => tenant.id === currentTenant)?.name || 'Select Tenant'
              : 'No tenants found'}
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu>
        {tenants.map((tenant) => (
          <DropdownItem
            textValue={tenant.id}
            key={tenant.id}
            onPress={() => handleSwitchTenant(tenant)}
            className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-all ${
              currentTenant === tenant.id
                ? 'bg-surface text-text cursor-not-allowed'
                : 'hover:border-borderHover'
            }`}
          >
            <div className="flex items-center gap-2 w-full max-w-[250px]">
              <span className="font-medium truncate">{tenant.name}</span>
              {currentTenant === tenant.id && (
                <span
                  className="ml-auto rounded-full bg-success w-2 h-2"
                  title="Current tenant"
                ></span>
              )}
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
