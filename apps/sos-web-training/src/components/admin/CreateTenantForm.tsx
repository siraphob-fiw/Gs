'use client';

import { useCreateTenant } from '@/hooks/api/use-tenants';
import { addToast, Alert, Button, Card, CardBody, CardHeader, Form, Input, SelectItem } from '@heroui/react';
import { useState } from 'react';
import { FaBuilding } from 'react-icons/fa';
import { GoGlobe } from 'react-icons/go';
import { TbAlertTriangleFilled } from 'react-icons/tb';
import { useTranslation } from '@/hooks/api/useTranslation';
// import { useSubscriptionPlans } from '@/hooks/api/use-subscription';
import { SelectWithClassName } from '../forms/selectWithClassName';

interface CreateTenantFormProps {
  onTenantCreated?: (tenantId: string) => void;
}

export const initialValue = {
  name: '',
  plan: '',
  adminEmail: '',
  adminFirstName: '',
  adminLastName: '',
  adminPassword: '',
  confirmPassword: '',
};

export function CreateTenantForm({ onTenantCreated }: CreateTenantFormProps) {
  const { t } = useTranslation();
  const createTenantMutation = useCreateTenant();
  // const { data: subscriptionPlans } = useSubscriptionPlans({ isactive: true });
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState<{
    name: string;
    plan: string;
    adminEmail: string;
    adminFirstName: string;
    adminLastName: string;
    adminPassword: string;
    confirmPassword: string;
  }>(initialValue);

  const handleCreateTenant = async () => {
    if (!newTenantForm.name.trim()) {
      addToast({
        title: t('tenantSettings.createTenantNameRequired', {
          defaultValue: 'Tenant name is required',
        }),
        color: 'warning',
      });
      return;
    }

    if (!newTenantForm.adminEmail.trim()) {
      addToast({
        title: t('tenantSettings.createTenantAdminEmailRequired', {
          defaultValue: 'Admin email is required',
        }),
        color: 'warning',
      });
      return;
    }

    if (!newTenantForm.adminPassword) {
      addToast({
        title: t('tenantSettings.createTenantPasswordRequired', {
          defaultValue: 'Admin password is required',
        }),
        color: 'warning',
      });
      return;
    }

    if (newTenantForm.adminPassword !== newTenantForm.confirmPassword) {
      addToast({
        title: t('tenantSettings.createTenantPasswordMismatch', {
          defaultValue: 'Passwords do not match',
        }),
        color: 'warning',
      });
      return;
    }

    try {
      setIsCreatingTenant(true);
      const createdTenant = await createTenantMutation.mutateAsync({
        name: newTenantForm.name.trim(),
        plan: newTenantForm.plan.trim(),
        adminEmail: newTenantForm.adminEmail.trim(),
        adminFirstName: newTenantForm.adminFirstName,
        adminLastName: newTenantForm.adminLastName,
        adminPassword: newTenantForm.adminPassword,
      });

      addToast({
        title: t('tenantSettings.createTenantSuccess', {
          defaultValue: 'Tenant created successfully',
        }),
        description: t('tenantSettings.createTenantSuccessDescription', {
          defaultValue: 'The new tenant has been created and an admin user has been set up.',
        }),
        color: 'success',
      });

      setNewTenantForm(initialValue);

      if (createdTenant?.id && onTenantCreated) {
        onTenantCreated(createdTenant.id);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : t('tenantSettings.createTenantFailed', {
            defaultValue: 'Failed to create tenant. Please try again.',
          });
      addToast({
        title: t('tenantSettings.createTenantFailed', {
          defaultValue: 'Failed to create tenant',
        }),
        description: errorMessage,
        color: 'danger',
      });
    } finally {
      setIsCreatingTenant(false);
    }
  };

  return (
    <Form className="grid grid-cols-1 gap-4">
      <div className="">Tenant Information</div>
      <Input
        isRequired
        label={t('tenantSettings.newTenantName', {
          defaultValue: 'Tenant Name',
        })}
        variant="bordered"
        classNames={{
          inputWrapper: 'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
          input: 'text-text',
        }}
        value={newTenantForm.name}
        onValueChange={(value) =>
          setNewTenantForm((prev) => ({
            ...prev,
            name: value,
          }))
        }
        endContent={<FaBuilding className="text-textMuted size-5" />}
      />

      <SelectWithClassName
        id="plans"
        label="Plans"
        variant="bordered"
        selectedKeys={newTenantForm.plan || []}
        onSelectionChange={(keys) => {
          setNewTenantForm((prev: any) => ({
            ...prev,
            plan: Array.from(keys) as string[],
          }));
        }}
        // isDisabled={subscriptionPlans?.length === 0}
        selectorIconColor="text-text"
        classNames={{
          trigger: `bg-backgroundSecondary data-[open=true]:border-border`,
          value: `group-data-[has-value=true]:text-text`,
          label: 'text-text',
          listbox:
            'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
        }}
        children={
          <>
            <SelectItem
              key={'trial'}
              textValue={'Trial Plan'}
            >
              Trial Plan
            </SelectItem>
            {/* {subscriptionPlans?.map((plan) => (
              <SelectItem
                key={plan.id}
                textValue={plan.name}
              >
                {plan.name}
              </SelectItem>
            ))} */}
          </>
        }
      />


      <div>Admin Information</div>
      <Input
        isRequired
        type="email"
        label={t('tenantSettings.newTenantAdminEmail', {
          defaultValue: 'Admin Email',
        })}
        size='sm'
        variant="bordered"
        classNames={{
          inputWrapper: 'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
          input: 'text-text',
        }}
        value={newTenantForm.adminEmail}
        onValueChange={(value) =>
          setNewTenantForm((prev) => ({
            ...prev,
            adminEmail: value,
          }))
        }
      />
      <Input
        isRequired
        type="text"
        label={t('tenantSettiong.newTenantAdminFirstname', {
          defaultValue: 'Admin Firstname',
        })}
        variant="bordered"
        classNames={{
          inputWrapper: 'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
          input: 'text-text',
        }}
        size='sm'
        value={newTenantForm.adminFirstName}
        onValueChange={(value) =>
          setNewTenantForm((prev) => ({
            ...prev,
            adminFirstName: value,
          }))
        }
      />
      <Input
        isRequired
        type="text"
        label={t('tenantSettiong.newTenantAdminLastname', {
          defaultValue: 'Admin Lastname',
        })}
        variant="bordered"
        classNames={{
          inputWrapper: 'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
          input: 'text-text',
        }}
        size='sm'
        value={newTenantForm.adminLastName}
        onValueChange={(value) =>
          setNewTenantForm((prev) => ({
            ...prev,
            adminLastName: value,
          }))
        }
      />
      <Alert
        color="warning"
        variant="flat"
        icon={<TbAlertTriangleFilled className="text-warning" />}
        title={t('tenantSettings.createTenantWarningTitle', {
          defaultValue: 'Security recommendation',
        })}
        description={t('tenantSettings.createTenantWarningDescription', {
          defaultValue:
            'Use a strong, unique password for the admin account and share it securely with the tenant owner.',
        })}
      />
      <Input
        isRequired
        type="password"
        label={t('tenantSettings.newTenantAdminPassword', {
          defaultValue: 'Admin Password',
        })}
        variant="bordered"
        classNames={{
          inputWrapper: 'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
          input: 'text-text',
        }}
        size='sm'
        value={newTenantForm.adminPassword}
        onValueChange={(value) =>
          setNewTenantForm((prev) => ({
            ...prev,
            adminPassword: value,
          }))
        }
      />
      <Input
        isRequired
        type="password"
        label={t('tenantSettings.newTenantAdminPasswordConfirm', {
          defaultValue: 'Confirm Password',
        })}
        variant="bordered"
        classNames={{
          inputWrapper: 'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
          input: 'text-text',
        }}
        size='sm'
        value={newTenantForm.confirmPassword}
        onValueChange={(value) =>
          setNewTenantForm((prev) => ({
            ...prev,
            confirmPassword: value,
          }))
        }
      />
      <Button
        color="primary"
        onPress={handleCreateTenant}
        isLoading={isCreatingTenant}
        isDisabled={isCreatingTenant}
        className="w-fit ml-auto"
      >
        {t('tenantSettings.createTenantButton', {
          defaultValue: 'Create Tenant',
        })}
      </Button>
    </Form>
  );
}


