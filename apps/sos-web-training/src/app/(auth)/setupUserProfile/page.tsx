'use client';

import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { useAuth } from '@/contexts/auth-context';
import {
  Input,
  SelectItem,
  Button,
  Popover,
  Calendar,
  PopoverContent,
  PopoverTrigger,
  addToast,
  Autocomplete,
} from '@heroui/react';
import { Gender } from '@strengthos/shared-types';
import React, { useEffect, useState, Suspense } from 'react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { FaCalendar } from 'react-icons/fa';
import { parseDate } from '@internationalized/date';
import dayjs from 'dayjs';
import { useUpdateUser, useUserById } from '@/hooks/api/use-users';
import { useRouter } from 'next/navigation';

function SetupProfilePageContent() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const user = state.user;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const router = useRouter();
  const { data: userProfile, refetch: refetchUserProfile } = useUserById(user?.id || '');

  useEffect(() => {
    if (userProfile) {
      if (
        userProfile.profile.dateOfBirth &&
        userProfile.profile.gender &&
        userProfile.profile.bodyWeight &&
        userProfile.profile.height
      ) {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [userProfile]);

  const [formData, setFormData] = useState<{
    dateOfBirth: number | null;
    gender: string;
    bodyWeight: number;
    height: number;
    phone: string;
  }>({
    dateOfBirth: dayjs()
      .year(dayjs().year() - 15)
      .unix(),
    gender: '',
    bodyWeight: 0,
    height: 0,
    phone: '',
  });

  const updateUserMutation = useUpdateUser();

  const handleSubmit = async () => {
    try {
      await updateUserMutation.mutateAsync({
        id: user?.id || '',
        data: {
          dateOfBirth: formData.dateOfBirth
            ? dayjs.unix(formData.dateOfBirth).format('YYYY-MM-DD')
            : undefined,
          gender: formData.gender as Gender,
          bodyWeight: formData.bodyWeight,
          height: formData.height,
        },
      });

      await refetchUserProfile();

      addToast({
        title: t('account.updateSuccess'),
        color: 'success',
      });
      router.replace('/dashboard');
    } catch (error) {}
  };

  return (
    <div className="h-screen bg-backgroundSecondary flex items-center justify-center">
      <div className="container max-w-md rounded-2xl border shadow-xl p-8">
        <h2 className="text-xl font-semibold mb-4">Setup Your Profile</h2>
        <p className="text-text mb-6">
          Let&apos;s complete your profile details so you can get started!
        </p>
        <div className="flex flex-col gap-4">
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
                {formData.dateOfBirth
                  ? dayjs.unix(formData.dateOfBirth).format('DD/MM/YYYY')
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
                      formData.dateOfBirth && !isNaN(formData.dateOfBirth)
                        ? dayjs.unix(formData.dateOfBirth)
                        : dayjs();
                    const updated = current.year(newYear);
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: updated.unix(),
                    }));
                  }}
                  selectedKey={
                    formData.dateOfBirth && !isNaN(formData.dateOfBirth)
                      ? dayjs.unix(formData.dateOfBirth).year().toString()
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
                      if (formData.dateOfBirth && !isNaN(formData.dateOfBirth)) {
                        const current = dayjs.unix(formData.dateOfBirth);
                        setFormData((prev) => ({
                          ...prev,
                          dateOfBirth: current.month(0).unix(),
                        }));
                      }
                      return;
                    }
                    const newMonth = parseInt(e as string, 10);
                    const current =
                      formData.dateOfBirth && !isNaN(formData.dateOfBirth)
                        ? dayjs.unix(formData.dateOfBirth)
                        : dayjs();
                    const updated = current.month(newMonth);
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: updated.unix(),
                    }));
                  }}
                  selectedKey={
                    formData.dateOfBirth && !isNaN(formData.dateOfBirth)
                      ? dayjs.unix(formData.dateOfBirth).month().toString()
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
                  formData.dateOfBirth && !isNaN(formData.dateOfBirth)
                    ? parseDate(dayjs.unix(formData.dateOfBirth).format('YYYY-MM-DD'))
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
                  formData.dateOfBirth && !isNaN(formData.dateOfBirth)
                    ? dayjs.unix(formData.dateOfBirth).format('YYYY-MM')
                    : dayjs().format('YYYY-MM')
                }
              />
            </PopoverContent>
          </Popover>
          <SelectWithClassName
            fullwidth
            id="gender"
            label={t('gender')}
            selectedKeys={[formData.gender ?? '']}
            onSelectionChange={(e) => {
              setFormData({
                ...formData,
                gender: e.currentKey as Gender,
              });
            }}
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
          />
          <Input
            label={t('weight')}
            variant="bordered"
            classNames={{
              inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
              input: 'text-text',
            }}
            value={formData.bodyWeight?.toString() ?? '0'}
            type="number"
            onValueChange={(e) => {
              setFormData({
                ...formData,
                bodyWeight: Number(e),
              });
            }}
          />
          <Input
            label={t('height')}
            variant="bordered"
            classNames={{
              inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
              input: 'text-text',
            }}
            value={formData.height?.toString() ?? '0'}
            type="number"
            onValueChange={(e) => {
              setFormData({
                ...formData,
                height: Number(e),
              });
            }}
          />
          <Button
            type="submit"
            color="primary"
            className="w-full text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-primary-700 transition"
            isLoading={updateUserMutation.isPending}
            onPress={handleSubmit}
          >
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SetupProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <SetupProfilePageContent />
    </Suspense>
  );
}
