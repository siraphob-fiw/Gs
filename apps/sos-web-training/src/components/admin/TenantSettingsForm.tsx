'use client';

import { useAuth } from '@/contexts/auth-context';
import { UpdateTenantRequest, useTenantById, useTenants, useUpdateTenant, useUpdateTenantSettings } from '@/hooks/api/use-tenants';
import {
  addToast,
  Button,
  Card,
  CardBody,
  CardHeader,
  DateInput,
  Form,
  Input,
  SelectItem,
  Switch,
  Textarea,
} from '@heroui/react';
import {
  BillingInfo,
  SubscriptionInfo,
  SubscriptionStatus,
  TenantSettings,
  TenantStatus,
  UserRole,
} from '@strengthos/shared-types';
import { useEffect, useState } from 'react';
import { GoOrganization } from 'react-icons/go';
import { FaBuilding, FaPlus, FaTrash } from 'react-icons/fa';
import { SelectWithClassName } from '../forms/selectWithClassName';
import { parseDate } from '@internationalized/date';
import { useLocale } from '@/hooks/api/useLocale';
import { useTranslation } from '@/hooks/api/useTranslation';
import dayjs from 'dayjs';
import useRoleAccess from '@/hooks/api/use-role-access';
import { useCreateSubscription, useSubscriptionPlans } from '@/hooks/api/use-subscription';


export interface TenantSettingsFormData {
  id: string;
  name: string;
  description: string;
  status: TenantStatus;
  settings: TenantSettings;
  subscription_info: string;
  subscription_info_details: SubscriptionInfo | null;
  billing_info: BillingInfo;
  contact?: { [key: string]: string };
  availableEquipment?: string[];
  created_at: Date;
  updated_at: Date;
  suspended_at: Date | null;
}

const initialFormData: TenantSettingsFormData = {
  id: '',
  name: '',
  description: '',
  status: TenantStatus.ACTIVE,
  settings: {
    allowSelfCoached: false,
    requireCoachApproval: false,
    enableVideoAnalysis: false,
    defaultLanguage: 'en',
    availableLanguages: ['en'],
    maxCoaches: 0,
    maxAthletes: 0,
    logo: '',
    complianceSettings: {
      gdprEnabled: false,
      pdpaEnabled: false,
      hipaaEnabled: false,
    },
  },
  subscription_info: '',
  subscription_info_details: {
    planId: '',
    status: SubscriptionStatus.ACTIVE,
    start_date: undefined,
    end_date: undefined,
    auto_renew: undefined,
  },
  billing_info: {
    amount: 0,
    currency: 'USD',
    billingCycle: 'MONTHLY',
  },
  contact: {},
  availableEquipment: [],
  created_at: new Date(),
  updated_at: new Date(),
  suspended_at: null,
};

export function TenantSettingsForm({ onTenantCreated }: { onTenantCreated?: () => void }) {
  const { state } = useAuth();
  const user = state.user;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const [selectedTenantId, setSelectedTenantId] = useState<string>(user?.tenantId ?? '');
  const { isAdmin } = useRoleAccess();
  const isAdminUser = isAdmin();
  // Fetch all tenants for SUPER_ADMIN - using enabled option instead of conditional hook call
  const { data: tenantsData, isLoading: tenantsLoading, refetch: refetchTenants } = useTenants(undefined, { enabled: isAdminUser });
  // const { data: plansData } = useSubscriptionPlans({ isactive: true });

  // Use selected tenant ID for SUPER_ADMIN, or user's tenant ID for others
  const activeTenantId = isSuperAdmin ? selectedTenantId : (user?.tenantId ?? '');

  const { data: tenant, refetch: refetchTenant } = useTenantById(activeTenantId);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<TenantSettingsFormData>(initialFormData);
  const updateTenantSettingsMutation = useUpdateTenantSettings(activeTenantId);
  const updateTenantMutation = useUpdateTenant(activeTenantId);
  const [contactObj, setContactObj] = useState<{ type: string; value: string }>({ type: '', value: '' });
  const { getSupportedLocalesWithNames } = useLocale();
  const supportLocale = getSupportedLocalesWithNames();
  const { t } = useTranslation();
  const [newPlan, setNewPlan] = useState<string>('');
  const assignNewSubscriptionMutation = useCreateSubscription();

  useEffect(() => {
    if (onTenantCreated) {
      refetchTenants();
    }
  }, [onTenantCreated]);

  useEffect(() => {
    if (tenant) {
      setFormData({
        ...initialFormData,
        ...tenant,
      });
      setIsLoading(false);
    } else if (tenant === null) {
      setIsLoading(false);
    }
  }, [tenant]);

  const handleAddSubscription = () => {
    if (newPlan) {
      assignNewSubscriptionMutation.mutate({
        tenant_id: activeTenantId,
        plan_id: newPlan,
        auto_renew: true,
      },
        {
          onSuccess: () => {
            refetchTenant();
          }
        }
      );
    }
  };

  const handleUpdateTenantSettings = async () => {
    setIsLoading(true);
    const data: UpdateTenantRequest = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      contact: formData.contact ?? {},
    };

    const settings: TenantSettings = {
      allowSelfCoached: formData.settings.allowSelfCoached,
      requireCoachApproval: formData.settings.requireCoachApproval,
      enableVideoAnalysis: formData.settings.enableVideoAnalysis,
      defaultLanguage: formData.settings.defaultLanguage,
      availableLanguages: formData.settings.availableLanguages,
      maxCoaches: formData.settings.maxCoaches,
      maxAthletes: formData.settings.maxAthletes,
      logo: formData.settings.logo,
      complianceSettings: formData.settings.complianceSettings,
    };

    const promise1 = updateTenantMutation.mutateAsync(data);
    const promise2 = updateTenantSettingsMutation.mutateAsync(settings);

    await Promise.all([promise1, promise2])
      .then(([res1, res2]) => {
        if (res1 && res2) {
          addToast({
            title: t('tenantSettings.updateSuccess'),
            description: t('tenantSettings.updateSuccessDescription'),
            color: 'success',
          });
          setIsLoading(false);
        }
      })
      .catch((error) => {
        addToast({
          title: t('tenantSettings.updateFailed'),
          description: t('tenantSettings.updateFailedDescription'),
          color: 'danger',
        });
        setIsLoading(false);
      })
  };

  // Show tenant selector for SUPER_ADMIN when no tenant is selected
  if (isSuperAdmin && !selectedTenantId) {
    return (
      <Card className="bg-backgroundSecondary border border-border">
        <CardBody className="flex flex-col items-center justify-center p-8 gap-4">
          <FaBuilding className="text-warning text-4xl" />
          <div className="text-lg font-medium text-text text-center">
            {t('tenantSettings.selectTenantFirst', { defaultValue: 'Please Select a Tenant' })}
          </div>
          <p className="text-textMuted text-center max-w-md">
            {t('tenantSettings.selectTenantDescription', {
              defaultValue:
                'As a Super Admin, you need to select a tenant to view and manage its settings.',
            })}
          </p>
          <div className="w-full max-w-md">
            <SelectWithClassName
              fullwidth
              label={t('tenantSettings.selectTenant', { defaultValue: 'Select Tenant' })}
              selectedKeys={selectedTenantId ? [selectedTenantId] : []}
              onSelectionChange={(value: any) => {
                setSelectedTenantId(value.currentKey ?? '');
              }}
              selectorIconColor="text-text"
              classNames={{
                trigger: 'bg-backgroundSecondary data-[open=true]:border-primary border-border',
                value: 'text-text group-data-[has-value=true]:text-text',
                listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                selectorIcon: 'text-text',
              }}
              isLoading={tenantsLoading}
              children={
                <>
                  {(tenantsData ?? []).map((t) => (
                    <SelectItem key={t.id} startContent={<FaBuilding />}>
                      {t.name}
                    </SelectItem>
                  ))}
                </>
              }
            />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-backgroundSecondary border border-border">
      <CardHeader className="flex flex-col gap-2">
        <div className="w-full flex justify-between items-center gap-3">
          <div className="text-lg font-medium text-text">{t('tenantSettings.title')}</div>
          {isSuperAdmin && (
            <div className="w-full max-w-md">
              <SelectWithClassName
                fullwidth
                label={t('tenantSettings.managingTenant', { defaultValue: 'Managing Tenant' })}
                labelPlacement="outside-left"
                selectedKeys={selectedTenantId ? [selectedTenantId] : []}
                onSelectionChange={(value: any) => {
                  setSelectedTenantId(value.currentKey ?? '');
                  setIsLoading(true);
                }}
                selectorIconColor="text-text"
                classNames={{
                  label: 'text-text text-sm whitespace-nowrap hidden sm:block',
                  trigger: 'bg-background data-[open=true]:border-primary border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                  selectorIcon: 'text-text',
                }}
                children={
                  <>
                    {(tenantsData ?? []).map((t) => (
                      <SelectItem key={t.id} startContent={<FaBuilding />}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </>
                }
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info"></div>
            <span className="ml-2 text-text mt-2">{t('tenantSettings.loading')}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Card className="bg-backgroundSecondary border border-border">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={
                      <div>
                        {t('tenantSettings.name')}{' '}
                        <span className="text-xs text-textMuted">
                          {t('tenantSettings.readOnly')}
                        </span>
                      </div>
                    }
                    labelPlacement='outside'
                    endContent={<GoOrganization className="text-textMuted size-6" />}
                    variant="bordered"
                    classNames={{
                      base: 'md:col-span-2',
                      inputWrapper: 'bg-backgroundSecondary border-border',
                      input: 'text-text',
                    }}
                    value={formData.name ?? ''}
                    disabled
                  />

                  <Textarea
                    label={t('tenantSettings.description', { defaultValue: 'Description' })}
                    variant="bordered"
                    classNames={{
                      base: 'md:col-span-2',
                      inputWrapper: 'bg-backgroundSecondary border-border',
                      input: 'text-text',
                    }}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        description: value,
                      });
                    }}
                    value={formData.description ?? ''}
                  />

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="text-small font-medium text-text">
                        {t('tenantSettings.contact', { defaultValue: 'Contact' })}
                      </div>
                      <p className="text-tiny text-textMuted">
                        Manage your tenant's contact information.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-background/50">
                      {/* Add New Contact Row */}
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 sm:col-span-4">
                          <SelectWithClassName
                            id='contactType'
                            label=''
                            size="sm"
                            placeholder="Select contact"
                            variant="bordered"
                            selectedKeys={contactObj.type ? [contactObj.type] : []}
                            onSelectionChange={(value) => {
                              value && value.currentKey && setContactObj({ ...contactObj, type: value.currentKey })
                            }}
                            classNames={{
                              trigger: 'bg-backgroundSecondary border-1 border-border',
                              value: 'text-text',
                            }}
                          >
                            <SelectItem textValue='Email' key='email'> Email </SelectItem>
                            <SelectItem textValue='Website' key='website'> Website </SelectItem>
                            <SelectItem textValue='Phone' key='phone'> Phone </SelectItem>
                          </SelectWithClassName>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <Input
                            size="sm"
                            label=''
                            placeholder={
                              contactObj.type === 'email' ? 'e.g. example@domain.com' :
                                contactObj.type === 'phone' ? 'e.g. +1 234 567 890' :
                                  contactObj.type === 'website' ? 'e.g. https://www.domain.com' : ''
                            }
                            variant="bordered"
                            classNames={{
                              inputWrapper: 'bg-backgroundSecondary border-1 border-border',
                              input: 'text-text',
                            }}
                            value={contactObj.value}
                            onValueChange={(value) =>
                              setContactObj({ ...contactObj, value: value })
                            }
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-2">
                          <Button
                            color="primary"
                            size="sm"
                            className="w-full font-medium"
                            startContent={<FaPlus />}
                            onPress={() => {
                              if (!contactObj.type || !contactObj.value) return;
                              setFormData({
                                ...formData,
                                contact: { ...formData.contact, [contactObj.type]: contactObj.value },
                              });
                              setContactObj({ type: '', value: '' });
                            }}
                          >
                            {t('tenantSettings.add', { defaultValue: 'Add' })}
                          </Button>
                        </div>
                      </div>

                      {/* Existing Contacts List */}
                      {formData.contact && Object.keys(formData.contact).length > 0 && (
                        <div className="flex flex-col gap-2 p-2 border border-border rounded-md">
                          {Object.entries(formData.contact).map(([key, value], index) => (
                            <div
                              key={index}
                              className="group grid grid-cols-12 gap-1 items-center rounded-md hover:bg-content2 transition-colors"
                            >
                              <div className="col-span-12 sm:col-span-4">
                                <Input
                                  size="sm"
                                  variant="bordered"
                                  aria-label="Contact Type"
                                  classNames={{
                                    inputWrapper: 'bg-backgroundSecondary border-1 border-border',
                                    input: 'text-text',
                                  }}
                                  value={key}
                                  onValueChange={(val) => {
                                    const newContacts = { ...formData.contact };
                                    newContacts[val] = value;
                                    setFormData({ ...formData, contact: newContacts });
                                  }}
                                />
                              </div>
                              <div className="col-span-12 sm:col-span-7">
                                <Input
                                  size="sm"
                                  variant="bordered"
                                  aria-label="Contact Value"
                                  classNames={{
                                    inputWrapper: 'bg-backgroundSecondary border-1 border-border',
                                    input: 'text-text',
                                  }}
                                  value={value}
                                  onValueChange={(val) => {
                                    const newContacts = { ...formData.contact };
                                    newContacts[val] = value;
                                    setFormData({ ...formData, contact: newContacts });
                                  }}
                                />
                              </div>
                              <div className="col-span-12 sm:col-span-1 flex justify-end sm:justify-center">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() => {
                                    const newContacts = { ...formData.contact };
                                    delete newContacts[key];
                                    setFormData({ ...formData, contact: newContacts });
                                  }}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.settings.maxAthletes > 0 && (
                    <div>
                      <Input
                        label={t('tenantSettings.maxCoaches')}
                        variant="bordered"
                        classNames={{
                          inputWrapper:
                            'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
                          input: 'text-text',
                        }}
                        value={
                          formData.settings.maxCoaches !== null &&
                            formData.settings.maxCoaches !== undefined
                            ? formData.settings.maxCoaches.toString()
                            : ''
                        }
                        onValueChange={(value) => {
                          if (value === '') {
                            setFormData({
                              ...formData,
                              settings: { ...formData.settings, maxCoaches: 0 },
                            });
                            return;
                          }
                          if (!/^\d+$/.test(value)) {
                            return;
                          }
                          setFormData({
                            ...formData,
                            settings: { ...formData.settings, maxCoaches: parseInt(value) },
                          });
                        }}
                      />
                    </div>
                  )}
                  {formData.settings.maxAthletes > 0 && (
                    <div>
                      <Input
                        label={t('tenantSettings.maxAthletes')}
                        variant="bordered"
                        classNames={{
                          inputWrapper:
                            'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
                          input: 'text-text',
                        }}
                        value={
                          formData.settings.maxAthletes !== null &&
                            formData.settings.maxAthletes !== undefined
                            ? formData.settings.maxAthletes.toString()
                            : ''
                        }
                        onValueChange={(value) => {
                          if (value === '') {
                            setFormData({
                              ...formData,
                              settings: { ...formData.settings, maxAthletes: 0 },
                            });
                            return;
                          }
                          if (!/^\d+$/.test(value)) {
                            return;
                          }
                          const parseValue = parseInt(value);
                          setFormData({
                            ...formData,
                            settings: { ...formData.settings, maxAthletes: parseValue },
                          });
                        }}
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 flex flex-col md:flex-row flex-wrap justify-evenly gap-3 rounded-lg p-2 border-2 border-border bg-backgroundSecondary">
                    <Switch
                      isSelected={formData.settings.allowSelfCoached}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          settings: { ...formData.settings, allowSelfCoached: value },
                        });
                      }}
                      classNames={{
                        label: 'text-text text-sm',
                      }}
                    >
                      {t('tenantSettings.allowSelfCoached')}
                    </Switch>
                    <Switch
                      isSelected={formData.settings.requireCoachApproval}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          settings: { ...formData.settings, requireCoachApproval: value },
                        });
                      }}
                      classNames={{
                        label: 'text-text text-sm',
                      }}
                    >
                      {t('tenantSettings.requireCoachApproval')}
                    </Switch>
                    <Switch
                      isSelected={formData.settings.enableVideoAnalysis}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          settings: { ...formData.settings, enableVideoAnalysis: value },
                        });
                      }}
                      classNames={{
                        label: 'text-text text-sm',
                      }}
                    >
                      {t('tenantSettings.enableVideoAnalysis')}
                    </Switch>
                  </div>

                  <SelectWithClassName
                    fullwidth
                    label={t('tenantSettings.defaultLanguage')}
                    selectedKeys={[formData.settings.defaultLanguage]}
                    onSelectionChange={(value) => {
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          defaultLanguage: value.currentKey as string,
                        },
                      });
                    }}
                    selectionMode="single"
                    selectorIconColor="text-text"
                    classNames={{
                      trigger:
                        'bg-backgroundSecondary data-[open=true]:border-border border-border',
                      value: 'text-text group-data-[has-value=true]:text-text uppercase',
                      listbox:
                        'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                      selectorIcon: 'text-text',
                    }}
                    children={
                      <>
                        {formData.settings.availableLanguages.length > 0 &&
                          formData.settings.availableLanguages.map((language) => (
                            <SelectItem
                              key={language}
                              textValue={t(language)}
                              className="uppercase"
                            >
                              {t(language)}
                            </SelectItem>
                          ))}
                      </>
                    }
                  />

                  <SelectWithClassName
                    label={t('tenantSettings.availableLanguage')}
                    selectedKeys={formData.settings.availableLanguages}
                    selectionMode="multiple"
                    onSelectionChange={(value) => {
                      const selectedLanguages = Array.from(value) as string[];
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          availableLanguages: selectedLanguages,
                        },
                      });
                    }}
                    selectorIconColor="text-text"
                    classNames={{
                      trigger:
                        'bg-backgroundSecondary data-[open=true]:border-border border-border',
                      value: 'text-text group-data-[has-value=true]:text-text uppercase',
                      listbox:
                        'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                      selectorIcon: 'text-text',
                    }}
                    children={
                      <>
                        {' '}
                        {supportLocale.length > 0 &&
                          supportLocale.map((lang) => (
                            <SelectItem key={lang.code} textValue={t(lang.name)}>
                              {t(lang.name)}
                            </SelectItem>
                          ))}
                      </>
                    }
                  />

                  {/* Need to change to file input or Uploader */}
                  <Input
                    label={t('tenantSettings.logo')}
                    variant="bordered"
                    classNames={{
                      inputWrapper:
                        'bg-backgroundSecondary border-border group-data-[focus=true]:border-border',
                      input: 'text-text',
                    }}
                    value={formData.settings.logo ?? ''}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          logo: value,
                        },
                      });
                    }}
                  />
                  {/* Compliance Settings */}
                  <div className="col-span-full md:col-span-2 flex flex-col md:flex-row justify-evenly gap-3 rounded-lg p-2 border-2 border-border bg-backgroundSecondary">
                    <Switch
                      isSelected={formData.settings?.complianceSettings?.gdprEnabled ?? false}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            complianceSettings: {
                              ...formData.settings.complianceSettings,
                              gdprEnabled: value,
                            },
                          },
                        });
                      }}
                      classNames={{
                        label: 'text-text text-sm',
                      }}
                    >
                      {t('tenantSettings.gdprEnabled')}
                    </Switch>
                    <Switch
                      isSelected={formData.settings?.complianceSettings?.pdpaEnabled ?? false}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            complianceSettings: {
                              ...formData.settings.complianceSettings,
                              pdpaEnabled: value,
                            },
                          },
                        });
                      }}
                      classNames={{
                        label: 'text-text text-sm',
                      }}
                    >
                      {t('tenantSettings.pdpaEnabled')}
                    </Switch>
                    <Switch
                      isSelected={formData.settings?.complianceSettings?.hipaaEnabled ?? false}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            complianceSettings: {
                              ...formData.settings.complianceSettings,
                              hipaaEnabled: value,
                            },
                          },
                        });
                      }}
                      classNames={{
                        label: 'text-text text-sm',
                      }}
                    >
                      {t('tenantSettings.hipaaEnabled')}
                    </Switch>
                  </div>
                  <Button
                    color="primary"
                    onPress={handleUpdateTenantSettings}
                    isLoading={isLoading}
                    isDisabled={isLoading}
                    className="col-span-full md:col-span-2 w-fit ml-auto"
                  >
                    {t('tenantSettings.updateButton')}
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* {formData.subscription_info !== null ? (
              <Card className="bg-backgroundSecondary border border-border">
                <CardHeader>
                  <div className="text-lg font-medium text-text">
                    {t('tenantSettings.subscription')}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('tenantSettings.plan')}
                      variant="bordered"
                      value={formData.subscription_info_details?.planId}
                      classNames={{
                        inputWrapper: 'bg-backgroundSecondary border-border',
                        input: 'text-text',
                      }}
                      disabled
                    />
                    <Input
                      label={t('tenantSettings.status')}
                      variant="bordered"
                      value={formData.subscription_info_details?.status}
                      classNames={{
                        inputWrapper: 'bg-backgroundSecondary border-border',
                        input: 'text-text',
                      }}
                      disabled
                    />
                    {formData.status === TenantStatus.ACTIVE &&
                      formData.subscription_info_details?.start_date &&
                      formData.subscription_info_details?.end_date && (
                        <>
                          <DateInput
                            variant="bordered"
                            label={t('tenantSettings.currentPeriodStart')}
                            value={
                              formData.subscription_info_details?.start_date
                                ? parseDate(
                                  dayjs(formData.subscription_info_details.start_date).format(
                                    'YYYY-MM-DD',
                                  ),
                                )
                                : undefined
                            }
                            classNames={{
                              base: 'opacity-100',
                              inputWrapper: 'bg-backgroundSecondary border-border',
                              input: 'text-text',
                              label: 'text-text',
                              segment: 'text-text data-[editable=true]:text-text',
                            }}
                            isDisabled
                          />
                          <DateInput
                            variant="bordered"
                            label={t('tenantSettings.currentPeriodEnd')}
                            value={
                              formData.subscription_info_details?.end_date
                                ? parseDate(
                                  dayjs(formData.subscription_info_details.end_date).format(
                                    'YYYY-MM-DD',
                                  ),
                                )
                                : undefined
                            }
                            classNames={{
                              base: 'opacity-100',
                              inputWrapper: 'bg-backgroundSecondary border-border',
                              input: 'text-text',
                              label: 'text-text',
                              segment: 'text-text data-[editable=true]:text-text',
                            }}
                            isDisabled
                          />
                        </>
                      )}
                    {formData.billing_info !== null && formData.billing_info !== undefined && (
                      <>
                        <Input
                          label={t('tenantSettings.amount')}
                          variant="bordered"
                          value={formData.billing_info.amount.toString()}
                          endContent={
                            <div className="text-textMuted text-sm">
                              {formData.billing_info.currency}
                            </div>
                          }
                          classNames={{
                            inputWrapper: 'bg-backgroundSecondary border-border',
                            input: 'text-text',
                          }}
                          disabled
                        />
                        <Input
                          label={t('tenantSettings.billingCycle')}
                          variant="bordered"
                          value={formData.billing_info.billingCycle}
                          classNames={{
                            inputWrapper: 'bg-backgroundSecondary border-border',
                            input: 'text-text',
                          }}
                          disabled
                        />
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card className="bg-backgroundSecondary border border-border">
                <CardHeader>
                  <div className="text-lg font-medium text-text">
                    {t('tenantSettings.subscription')}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-between'>
                    <div className="text-textMuted text-sm">No subscription information</div>
                    <div className="flex gap-4 items-center">
                      <SelectWithClassName
                        fullwidth
                        id="plans"
                        label="Plans"
                        variant="bordered"
                        selectedKeys={newPlan ? [newPlan] : undefined}
                        onSelectionChange={(keys) => {
                          if (keys && keys.currentKey) {
                            setNewPlan(keys.currentKey);
                          }
                        }}
                        isDisabled={plansData?.length === 0}
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
                            {plansData?.map((plan) => (
                              <SelectItem
                                key={plan.id}
                                textValue={plan.name}
                              >
                                {plan.name}
                              </SelectItem>
                            ))}
                          </>
                        }
                      />
                      <Button
                        variant="solid"
                        color='primary'
                        onPress={handleAddSubscription}
                        disabled={newPlan === undefined}
                        isIconOnly
                      >
                        <FaPlus />
                      </Button>
                    </div>

                  </div>
                </CardBody>
              </Card>
            )} */}
          </div>
        )}
      </CardBody>
    </Card >
  );
}
