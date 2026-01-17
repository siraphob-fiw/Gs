import { useState, useCallback, useMemo } from 'react';
import {
  Autocomplete,
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SelectItem,
} from '@heroui/react';
import { LuMail } from 'react-icons/lu';
import { UserRole, UserStatus, Gender, Tenant } from '@strengthos/shared-types';
import { SelectWithClassName } from '../forms/selectWithClassName';
import { parseDate } from '@internationalized/date';
import { UserResponse } from '@/hooks/api/use-users';
import { isPhoneNumber } from '@/utils/user-adapter';
import { useTranslation } from '@/hooks/api/useTranslation';
import { FaCalendar, FaUser } from 'react-icons/fa';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { FaBuilding } from 'react-icons/fa6';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/auth-context';

export interface ProfileFormContainerProps {
  user: UserResponse;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  canEditRole?: boolean;
  canAssignTenant?: boolean;
  tenants?: Tenant[];
  onAssignTenant?: (tenantId: string) => void | Promise<void>;
}

export default function ProfileFormContainer({
  user,
  onSubmit,
  onCancel,
  canEditRole = false,
  canAssignTenant = false,
  tenants = [],
  onAssignTenant,
}: ProfileFormContainerProps) {
  const { t } = useTranslation();
  const { state } = useAuth();
  const stateUser = state.user;
  const [formData, setFormData] = useState<UserResponse>(user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [isAssigningTenant, setIsAssigningTenant] = useState(false);
  const { isAdmin } = useRoleAccess();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.profile.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.profile.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (formData.phone && !isPhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (
      formData.profile.bodyWeight &&
      (formData.profile.bodyWeight < 20 || formData.profile.bodyWeight > 500)
    )
      newErrors.bodyWeight = 'Please enter a valid body weight (20-500 kg)';

    if (formData.profile.height && (formData.profile.height < 100 || formData.profile.height > 250))
      newErrors.height = 'Please enter a valid height (100-250 cm)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        profile: {
          firstName: formData.profile.firstName,
          lastName: formData.profile.lastName,
          dateOfBirth: formData.profile.dateOfBirth,
          gender: formData.profile.gender,
          bodyWeight: formData.profile.bodyWeight || null,
          height: formData.profile.height || null,
        },
        phone: formData.phone || undefined,
        role: formData.role,
        status: formData.status,
      };
      await onSubmit(submitData);
    } catch (error: any) {
      if (error.response?.data?.errors) setErrors(error.response.data.errors);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  const formatRoleForDisplay = (role: UserRole) => {
    switch (role) {
      case UserRole.COACH:
        return t('coach');
      case UserRole.ATHLETE:
        return t('athlete');
      case UserRole.SELF_COACHED:
        return t('selfCoached');
      case UserRole.COACH_ADMIN:
        return t('coachAdmin');
      case UserRole.TENANT_ADMIN:
        return t('tenantAdmin');
      case UserRole.SUPER_ADMIN:
        return t('superAdmin');
    }
  };

  const formatStatusForDisplay = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return t('active');
      case UserStatus.INACTIVE:
        return t('inactive');
      case UserStatus.SUSPENDED:
        return t('suspended');
      case UserStatus.PENDING_VERIFICATION:
        return t('pendingVerification');
      case UserStatus.PENDING_APPROVAL:
        return t('pendingApproval');
      default:
        return status;
    }
  };

  // Memoized handlers
  const handleFirstNameChange = useCallback((e: string) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, firstName: e },
    }));
  }, []);

  const handleLastNameChange = useCallback((e: string) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, lastName: e },
    }));
  }, []);

  const handlePhoneChange = useCallback((e: string) => {
    setFormData((prev) => ({ ...prev, phone: e }));
  }, []);

  // const handleDateOfBirthChange = useCallback((value: number, format: 'year' | 'month' | 'day') => {
  //   const baseData = formData.profile.dateOfBirth ? dayjs(formData.profile.dateOfBirth).valueOf() : dayjs().unix();
  //   if(!value) return;
  //   const jsDate = dayjs(baseData).set(format, value).toDate();
  //   setFormData((prev) => ({
  //     ...prev,
  //     profile: {
  //       ...prev.profile,
  //       dateOfBirth: jsDate,
  //     },
  //   }));
  //   setIsCalendarOpen(false);
  // }, []);

  const handleRoleChange = useCallback((e: any) => {
    setFormData((prev) => ({
      ...prev,
      role: (e?.currentKey ?? '') as UserRole,
    }));
  }, []);

  const handleStatusChange = useCallback((e: any) => {
    if (e && e.currentKey) {
      setFormData((prev) => {
        if (e.currentKey !== prev.status) {
          return {
            ...prev,
            status: e.currentKey as UserStatus,
          };
        }
        return prev;
      });
    }
  }, []);

  const handleGenderChange = useCallback((e: any) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        gender: e.currentKey as Gender,
      },
    }));
  }, []);

  const handleBodyWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, bodyWeight: Number(e.target.value) },
    }));
  }, []);

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, height: Number(e.target.value) },
    }));
  }, []);

  const handleTenantChange = useCallback((e: any) => {
    setSelectedTenantId(e?.currentKey ?? '');
  }, []);

  const handleAssignTenant = useCallback(async () => {
    if (!selectedTenantId || !onAssignTenant) return;
    setIsAssigningTenant(true);
    try {
      await onAssignTenant(selectedTenantId);
    } finally {
      setIsAssigningTenant(false);
    }
  }, [selectedTenantId, onAssignTenant]);

  // Memoize selectedKeys
  const roleSelectedKeys = useMemo(() => {
    return formData.role ? new Set<string>([formData.role]) : new Set<string>();
  }, [formData.role]);

  const statusSelectedKeys = useMemo(() => {
    return formData.status ? new Set<string>([formData.status]) : new Set<string>();
  }, [formData.status]);

  const genderSelectedKeys = useMemo(() => {
    return formData.profile.gender ? new Set<string>([formData.profile.gender]) : new Set<string>();
  }, [formData.profile.gender]);

  const tenantSelectedKeys = useMemo(() => {
    return selectedTenantId ? new Set<string>([selectedTenantId]) : new Set<string>();
  }, [selectedTenantId]);

  // Check if user has no tenant assigned
  const hasNoTenant = !user.tenantId;

  return (
    <div className="space-y-4">
      <div className="font-medium">{t('personalInformation')}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email - read only */}
        <Input
          label={
            <div>
              {t('email')} <span className="text-xs text-textMuted">({t('readOnly')})</span>
            </div>
          }
          endContent={<LuMail />}
          variant="bordered"
          classNames={{
            base: 'md:col-span-2',
            inputWrapper: 'bg-backgroundSecondary',
            input: 'text-text',
          }}
          value={formData.email ?? ''}
          disabled
        />

        {/* First Name */}
        <Input
          label={t('firstName')}
          variant="bordered"
          classNames={{
            inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
            input: 'text-text',
          }}
          value={formData.profile.firstName ?? ''}
          isInvalid={!!errors.firstName}
          errorMessage={errors.firstName}
          onValueChange={handleFirstNameChange}
        />

        {/* Last Name */}
        <Input
          label={t('lastName')}
          variant="bordered"
          classNames={{
            inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
            input: 'text-text',
          }}
          value={formData.profile.lastName ?? ''}
          isInvalid={!!errors.lastName}
          errorMessage={errors.lastName}
          onValueChange={handleLastNameChange}
        />

        {/* Phone Number */}
        <Input
          label={t('phoneNumber')}
          variant="bordered"
          classNames={{
            inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
            input: 'text-text',
          }}
          value={formData.phone ?? ''}
          isInvalid={!!errors.phone}
          errorMessage={errors.phone}
          onValueChange={handlePhoneChange}
        />

        {/* Date of Birth */}
        {/* <Popover isOpen={isCalendarOpen} onOpenChange={setIsCalendarOpen} placement="bottom-start">
          <PopoverTrigger asChild>
            <Button
              variant="bordered"
              className="text-text bg-backgroundSecondary h-14"
              aria-label="Select date of birth"
              aria-expanded={isCalendarOpen}
              aria-haspopup="dialog"
            >
              <FaCalendar />
              {formData.profile.dateOfBirth
                ? format(new Date(formData.profile.dateOfBirth), 'PPPP')
                : t('selectDateOfBirth')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" role="dialog" aria-label="Date picker">
            <Calendar
              value={
                formData.profile.dateOfBirth
                  ? parseDate(format(new Date(formData.profile.dateOfBirth), 'yyyy-MM-dd'))
                  : null
              }
              showMonthAndYearPickers
              onChange={handleDateOfBirthChange}
              classNames={{
                base: 'bg-backgroundSecondary after:bg-backgroundSecondary',
                header: 'bg-transparent border border-border text-text',
                headerWrapper: 'bg-backgroundSecondary after:bg-backgroundSecondary',
                gridHeaderRow: 'bg-backgroundSecondary p-2',
                cellButton: `text-text data-[disabled=true]:text-textMuted`,
                content: 'bg-backgroundSecondary border border-border',
                prevButton: 'text-text',
                nextButton: 'text-text',
                pickerItem: 'text-text',
                pickerWrapper: 'bg-transparent',
                pickerHighlight: 'bg-transparent border-2 border-border',
                title: 'text-text',
              }}
            />
          </PopoverContent>
        </Popover> */}
        <Popover
          isOpen={isCalendarOpen}
          onOpenChange={setIsCalendarOpen}
          placement="bottom-start"
          classNames={{
            content: 'bg-backgroundSecondary p-2',
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="bordered"
              className="text-text bg-backgroundSecondary h-14"
              aria-label="Select date of birth"
              aria-expanded={isCalendarOpen}
              aria-haspopup="dialog"
            >
              <FaCalendar />
              {formData.profile.dateOfBirth
                ? dayjs(formData.profile.dateOfBirth).format('DD/MM/YYYY')
                : t('selectDateOfBirth')}
            </Button>
          </PopoverTrigger>
          <PopoverContent role="dialog" aria-label="Date picker">
            <div className="w-full flex flex-col items-center justify-between gap-2 pb-2 bg-backgroundSecondary">
              <Autocomplete
                id="year-autocomplete"
                label={t('year')}
                onSelectionChange={(e) => {
                  if (e === null) {
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: null,
                    }));
                    return;
                  }
                  const newYear = parseInt(e as string, 10);
                  const current =
                    formData.profile.dateOfBirth && dayjs(formData.profile.dateOfBirth).isValid()
                      ? dayjs(formData.profile.dateOfBirth)
                      : dayjs();
                  const updated = current.year(newYear);
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: updated.unix(),
                  }));
                }}
                selectedKey={
                  formData.profile.dateOfBirth && dayjs(formData.profile.dateOfBirth).isValid()
                    ? dayjs(formData.profile.dateOfBirth).year().toString()
                    : undefined
                }
                size="sm"
                classNames={{
                  base: 'bg-backgroundSecondary w-full max-w-[256px] border-2 border-border rounded-lg',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                  listboxWrapper: 'bg-backgroundSecondary',
                  popoverContent: 'bg-backgroundSecondary',
                  clearButton: 'text-text',
                  endContentWrapper: 'text-text',
                  selectorButton: 'bg-backgroundSecondary data-[open=true]:border-border',
                }}
                allowsEmptyCollection={false}
                isClearable={true}
              >
                {Array.from({ length: 85 }, (_, i) => dayjs().year() - 15 - i).map((year) => (
                  <SelectItem key={year} textValue={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </Autocomplete>

              <Autocomplete
                id="month-autocomplete"
                label={t('month')}
                onSelectionChange={(e) => {
                  if (e === null) {
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: null,
                    }));
                    return;
                  }
                  const newMonth = parseInt(e as string, 10);
                  const current =
                    formData.profile.dateOfBirth && dayjs(formData.profile.dateOfBirth).isValid()
                      ? dayjs(formData.profile.dateOfBirth)
                      : dayjs();
                  const updated = current.year(newMonth);
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: updated.unix(),
                  }));
                }}
                selectedKey={
                  formData.profile.dateOfBirth && dayjs(formData.profile.dateOfBirth).isValid()
                    ? dayjs(formData.profile.dateOfBirth).month().toString()
                    : undefined
                }
                size="sm"
                classNames={{
                  base: 'bg-backgroundSecondary w-full max-w-[256px] border-2 border-border rounded-lg',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                  listboxWrapper: 'bg-backgroundSecondary',
                  popoverContent: 'bg-backgroundSecondary',
                  clearButton: 'text-text',
                  endContentWrapper: 'text-text',
                  selectorButton: 'bg-backgroundSecondary data-[open=true]:border-border',
                }}
                allowsEmptyCollection={false}
                isClearable={true}
              >
                {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                  <SelectItem key={month} textValue={dayjs().month(month).format('MMMM')}>
                    {dayjs().month(month).format('MMMM')}
                  </SelectItem>
                ))}
              </Autocomplete>
            </div>
            <Calendar
              value={
                formData.profile.dateOfBirth && dayjs(formData.profile.dateOfBirth).isValid()
                  ? parseDate(dayjs(formData.profile.dateOfBirth).format('YYYY-MM-DD'))
                  : null
              }
              onChange={(dateValue) => {
                if (!dateValue) return;
                const jsDate = dayjs(dateValue.toString(), [
                  'YYYY-MM-DD',
                  'YYYY-MM-DDTHH:mm:ssZ',
                  'YYYY-MM-DDTHH:mm:ss.SSSZ',
                ])
                  .startOf('day')
                  .unix();
                setFormData((prev) => ({
                  ...prev,
                  dateOfBirth: jsDate,
                }));
                setIsCalendarOpen(false);
              }}
              classNames={{
                base: 'bg-backgroundSecondary',
                header: 'hidden',
                headerWrapper: 'hidden',
                gridHeaderRow: 'bg-backgroundSecondary p-2',
                cellButton: `text-text data-[disabled=true]:text-textMuted`,
                content: 'bg-backgroundSecondary',
                pickerItem: 'text-text',
                pickerWrapper: 'bg-transparent',
                pickerHighlight: 'bg-transparent',
                title: 'hidden',
              }}
              key={

                formData.profile.dateOfBirth && dayjs(formData.profile.dateOfBirth).isValid()
                  ? dayjs(formData.profile.dateOfBirth).format('YYYY-MM')
                  : dayjs().format('YYYY-MM')
              }
            />
          </PopoverContent>
        </Popover>

        {formData.profile.dateOfBirth && dayjs(formData.profile.dateOfBirth).isValid() && (
          <Input
            label={t('Age')}
            variant="bordered"
            classNames={{
              inputWrapper: 'bg-backgroundSecondary data-[dis',
              input: 'text-text data-[disabled=true]:text-text',
            }}
            value={dayjs().diff(dayjs(formData.profile.dateOfBirth), 'year').toString()}
            isDisabled
          />
        )}

        {/* Role */}
        {canEditRole && stateUser?.id !== user.id ? (
          <SelectWithClassName
            fullwidth
            id="role"
            label={t('role')}
            selectedKeys={roleSelectedKeys}
            onSelectionChange={handleRoleChange}
            selectorIconColor="text-text"
            classNames={{
              label: 'text-text',
              trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
              value: 'text-text group-data-[has-value=true]:text-text',
              listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
              selectorIcon: 'text-text',
            }}
            children={
              <>
                <SelectItem key="COACH">{t('coach')}</SelectItem>
                <SelectItem key="ATHLETE">{t('athlete')}</SelectItem>
                <SelectItem key="SELF_COACHED">{t('selfCoached')}</SelectItem>
                <SelectItem key="COACH_ADMIN">{t('coachAdmin')}</SelectItem>
                <SelectItem key="TENANT_ADMIN">{t('tenantAdmin')}</SelectItem>
                <SelectItem key="SUPER_ADMIN" className="hidden">
                  {t('superAdmin')}
                </SelectItem>
              </>
            }
          />
        ) : (
          <Input
            label={t('role')}
            variant="bordered"
            classNames={{
              inputWrapper: 'bg-backgroundSecondary',
              input: 'text-text',
            }}
            value={formData.role ? formatRoleForDisplay(formData.role) : ''}
            disabled
          />
        )}

        {isAdmin() && stateUser?.id !== user.id ? (
          <SelectWithClassName
            fullwidth
            id="status"
            label={t('status')}
            aria-label="Status"
            selectedKeys={statusSelectedKeys}
            disallowEmptySelection
            onSelectionChange={handleStatusChange}
            selectorIconColor="text-text"
            classNames={{
              label: 'text-text',
              trigger: `bg-backgroundSecondary  
              ${formData.status === 'ACTIVE'
                  ? 'data-[hover=true]:border-success data-[open=true]:border-success border-success'
                  : formData.status === 'INACTIVE'
                    ? 'data-[hover=true]:border-warning data-[open=true]:border-warning border-warning'
                    : formData.status === 'SUSPENDED'
                      ? 'data-[hover=true]:border-danger data-[open=true]:border-danger border-danger'
                      : 'data-[hover=true]:border-border data-[open=true]:border-border border-border'
                }`,
              value: 'text-text group-data-[has-value=true]:text-text',
              listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
              selectorIcon: 'text-text',
            }}
            children={
              <>
                <SelectItem key="ACTIVE">{t('active')}</SelectItem>
                <SelectItem key="INACTIVE">{t('inactive')}</SelectItem>
                <SelectItem key="SUSPENDED">{t('suspended')}</SelectItem>
                <SelectItem key="PENDING_VERIFICATION">{t('pendingVerification')}</SelectItem>
                <SelectItem key="PENDING_APPROVAL">{t('pendingApproval')}</SelectItem>
              </>
            }
          />
        ) : (
          <Input
            label={t('status')}
            variant="bordered"
            classNames={{
              inputWrapper: 'bg-backgroundSecondary',
              input: 'text-text',
            }}
            value={formData.status ? formatStatusForDisplay(formData.status) : ''}
            disabled
          />
        )}
      </div>

      {/* Tenant Assignment Section - only for SUPER_ADMIN when user has no tenant */}
      {canAssignTenant && hasNoTenant && tenants.length > 0 && (
        <>
          <div className="font-medium flex items-center gap-2">
            <FaBuilding className="text-warning" />
            {t('tenantAssignment', { defaultValue: 'Tenant Assignment' })}
          </div>
          <div className="p-4 border-2 border-warning rounded-lg bg-warning/10">
            <p className="text-sm text-warning mb-3">
              {t('noTenantWarning', {
                defaultValue:
                  'This user has no tenant assigned. Please assign a tenant to enable full functionality.',
              })}
            </p>
            <div className="flex gap-2 items-end">
              <SelectWithClassName
                fullwidth
                id="tenant"
                label={t('selectTenant', { defaultValue: 'Select Tenant' })}
                selectedKeys={tenantSelectedKeys}
                onSelectionChange={handleTenantChange}
                selectorIconColor="text-text"
                classNames={{
                  label: 'text-text',
                  trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                  selectorIcon: 'text-text',
                }}
              >
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id}>{tenant.name}</SelectItem>
                ))}
              </SelectWithClassName>
              <Button
                color="warning"
                className="text-white shrink-0"
                onPress={handleAssignTenant}
                isDisabled={!selectedTenantId || isAssigningTenant}
                isLoading={isAssigningTenant}
              >
                {t('assignTenant', { defaultValue: 'Assign Tenant' })}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Show current tenant info if user has a tenant */}
      {user.tenantId && (
        <>
          <div className="font-medium flex items-center gap-2">
            <FaBuilding />
            {t('tenantInfo', { defaultValue: 'Tenant Information' })}
          </div>
          <Input
            label={t('tenant', { defaultValue: 'Tenant' })}
            variant="bordered"
            classNames={{
              inputWrapper: 'bg-backgroundSecondary',
              input: 'text-text',
            }}
            value={user.tenantName || user.tenantId}
            disabled
            startContent={<FaBuilding className="text-text" />}
          />
        </>
      )}

      <div className="font-medium">{t('physicalInformation')}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('common.gender')}
          variant="bordered"
          classNames={{
            inputWrapper: 'bg-backgroundSecondary',
            input: 'text-text',
          }}
          value={formData.profile.gender?.toString() || ''}
          isDisabled
          endContent={<FaUser className="text-text" />}
        />
        {/* <SelectWithClassName
          fullwidth
          id="gender"
          label={t('gender')}
          selectedKeys={genderSelectedKeys}
          onSelectionChange={handleGenderChange}
          selectorIconColor="text-text"
          classNames={{
            label: 'text-text',
            trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
            value: 'text-text group-data-[has-value=true]:text-text',
            listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
            selectorIcon: 'text-text',
          }}
          children={
            <>
              {Object.values(Gender).map((gender) => (
                <SelectItem key={gender}>{t(gender.replaceAll('_', ' '))}</SelectItem>
              ))}
            </>
          }
        /> */}
        <Input
          label={t('weight')}
          variant="bordered"
          classNames={{
            inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
            input: 'text-text',
          }}
          endContent={<span className="text-secondary text-xs">{t('kg')}</span>}
          value={formData.profile.bodyWeight?.toString() ?? '0'}
          type="number"
          onChange={handleBodyWeightChange}
        />
        <Input
          label={t('height')}
          variant="bordered"
          classNames={{
            inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
            input: 'text-text',
          }}
          value={formData.profile.height?.toString() ?? '0'}
          type="number"
          onChange={handleHeightChange}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          color="success"
          className="text-white"
          onPress={() => handleSubmit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('saving') : t('save')}
        </Button>
        {onCancel && (
          <Button color="danger" className="text-white" onPress={() => onCancel()}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
