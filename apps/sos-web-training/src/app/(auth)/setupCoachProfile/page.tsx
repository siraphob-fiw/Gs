'use client';

import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { useAuth } from '@/contexts/auth-context';
import {
  Input,
  SelectItem,
  Button,
  addToast,
  Textarea,
  Checkbox,
  TimeInput,
  PopoverContent,
  PopoverTrigger,
  Popover,
  Calendar,
  Autocomplete,
} from '@heroui/react';
import { Gender } from '@strengthos/shared-types';
import React, { useEffect, useState, Suspense } from 'react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { TimeValue } from '@react-types/datepicker';
import { useUpdateUser, useUserById } from '@/hooks/api/use-users';
import { useRouter } from 'next/navigation';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useCreateCoachDiscoveryProfile } from '@/hooks/api/use-coach-clients';
import { WeeklyAvailability } from '@strengthos/shared-types/src/user-management';
import { FaCalendar } from 'react-icons/fa';
import dayjs from 'dayjs';
import { parseDate } from '@internationalized/date';

function SetupCoachProfilePageContent() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const user = state.user;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const router = useRouter();
  const { isCoach } = useRoleAccess();
  const { data: userProfile } = useUserById(user?.id || '');

  const days: (keyof WeeklyAvailability)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  // Redirect if not a coach
  useEffect(() => {
    if (user && !isCoach()) {
      router.push('/dashboard');
    }
  }, [user, isCoach, router]);

  // Redirect if profile is already complete
  useEffect(() => {
    if (userProfile) {
      const { dateOfBirth, gender, bodyWeight, height } = userProfile.profile || {};
      if (dateOfBirth && gender && bodyWeight && height) {
        router.push('/dashboard');
      }
    }
  }, [userProfile, router]);

  const [customCertificationInput, setCustomCertificationInput] = useState('');
  const [customSpecializationInput, setCustomSpecializationInput] = useState('');

  const [formData, setFormData] = useState<{
    dateOfBirth: number | null;
    gender: string;
    bodyWeight: number;
    height: number;
    bio: string;
    specializations: string[];
    certifications: string[];
    availability: WeeklyAvailability;
    socialLinks: string[];
  }>({
    dateOfBirth: dayjs()
      .year(dayjs().year() - 15)
      .unix(),
    gender: '',
    bodyWeight: 0,
    height: 0,
    bio: '',
    specializations: [],
    certifications: [],
    availability: {
      monday: { isAvailable: false, timeSlots: { startTime: '', endTime: '' } },
      tuesday: { isAvailable: false, timeSlots: { startTime: '', endTime: '' } },
      wednesday: { isAvailable: false, timeSlots: { startTime: '', endTime: '' } },
      thursday: { isAvailable: false, timeSlots: { startTime: '', endTime: '' } },
      friday: { isAvailable: false, timeSlots: { startTime: '', endTime: '' } },
      saturday: { isAvailable: false, timeSlots: { startTime: '', endTime: '' } },
      sunday: { isAvailable: false, timeSlots: { startTime: '', endTime: '' } },
    },
    socialLinks: [],
  });

  const updateUserMutation = useUpdateUser();
  const createCoachDiscoveryProfileMutation = useCreateCoachDiscoveryProfile();

  const handleSubmit = async () => {
    try {
      const coachProfilePromise = createCoachDiscoveryProfileMutation.mutateAsync({
        bio: formData.bio,
        specializations: formData.specializations,
        certifications: formData.certifications,
        availability: formData.availability,
        socialLinks: formData.socialLinks,
      });

      const userUpdatePromise = updateUserMutation.mutateAsync({
        id: user?.id || '',
        data: {
          gender: formData.gender as Gender,
          bodyWeight: formData.bodyWeight,
          height: formData.height,
          dateOfBirth: formData.dateOfBirth
            ? dayjs.unix(formData.dateOfBirth).format('YYYY-MM-DD')
            : undefined,
        },
      });

      await Promise.all([coachProfilePromise, userUpdatePromise]);

      addToast({
        title: t('account.updateSuccess') || 'Profile updated successfully',
        color: 'success',
      });
    } catch (error: any) {
      addToast({
        title: error?.message || t('account.updateError') || 'Failed to update profile',
        color: 'danger',
      });
    }
  };

  return (
    <div className="h-screen bg-backgroundSecondary flex items-center justify-center overflow-hidden">
      <div className="h-[90%] container max-w-5xl rounded-2xl border shadow-xl p-8 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Setup Your Coach Profile</h2>
        <p className="text-text mb-6">Complete your profile details to star coaching athletes!</p>
        <div className="flex flex-col gap-4">
          {/* Personal data section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              label={t('gender') || 'Gender'}
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
                    <SelectItem key={gender}>{t(gender.replaceAll('_', ' ')) || gender}</SelectItem>
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
          </div>
          {/* Coach data section */}
          <Textarea
            label={'Bio'}
            description={
              "This is your most important sales tool. It's your first chance to connect with new clients. Please introduce yourself, your coaching philosophy, and who you love to help."
            }
            variant="bordered"
            classNames={{
              description: 'text-textMuted',
              inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-info',
              input: 'text-text',
            }}
            value={formData.bio ?? ''}
            onValueChange={(value) => {
              setFormData({
                ...formData,
                bio: value,
              });
            }}
          />
          {(() => {
            const enumValues: string[] = [];
            const currentValues = Array.isArray(formData.certifications)
              ? formData.certifications
              : [];
            const customValues = currentValues.filter((val: string) => !enumValues.includes(val));
            const allOptions = [...enumValues, ...customValues];

            return (
              <SelectWithClassName
                id="certifications"
                label="Certifications"
                variant="bordered"
                selectedKeys={currentValues.length > 0 ? new Set(currentValues) : new Set()}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    certifications: Array.from(keys) as string[],
                  }));
                }}
                isDisabled={allOptions.length === 0}
                selectorIconColor="text-text"
                classNames={{
                  trigger: `bg-surface data-[open=true]:border-border`,
                  value: `group-data-[has-value=true]:text-text`,
                  label: 'text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                }}
              >
                {allOptions.map((certification) => (
                  <SelectItem key={certification}>
                    {t(certification.replaceAll('_', ' ')) || certification}
                  </SelectItem>
                ))}
              </SelectWithClassName>
            );
          })()}
          <div className="flex gap-2 items-center">
            <Input
              classNames={{
                inputWrapper: 'bg-surface group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
              size="sm"
              variant="bordered"
              label="Add Certification"
              placeholder="e.g. Certified Strength and Conditioning Specialist (CSCS)"
              value={customCertificationInput}
              onChange={(e) => setCustomCertificationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const inputValue = customCertificationInput.trim();
                  if (inputValue && !formData.certifications?.includes(inputValue)) {
                    setFormData((prev: any) => ({
                      ...prev,
                      certifications: [...(prev.certifications || []), inputValue],
                    }));
                    setCustomCertificationInput('');
                  }
                }
              }}
              className="flex-1"
            />
            <Button
              className="bg-primary text-surface"
              onPress={() => {
                const inputValue = customCertificationInput.trim();
                if (inputValue && !formData.certifications?.includes(inputValue)) {
                  setFormData((prev: any) => ({
                    ...prev,
                    certifications: [...(prev.certifications || []), inputValue],
                  }));
                  setCustomCertificationInput('');
                }
              }}
              isDisabled={
                !customCertificationInput.trim() ||
                formData.certifications?.includes(customCertificationInput.trim())
              }
            >
              Add
            </Button>
          </div>
          {(() => {
            const enumValues: string[] = [];
            const currentValues = Array.isArray(formData.specializations)
              ? formData.specializations
              : [];
            const customValues = currentValues.filter((val: string) => !enumValues.includes(val));
            const allOptions = [...enumValues, ...customValues];

            return (
              <SelectWithClassName
                id="specializations"
                label={t('Specializations')}
                variant="bordered"
                selectedKeys={currentValues.length > 0 ? new Set(currentValues) : new Set()}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    specializations: Array.from(keys) as string[],
                  }));
                }}
                isDisabled={allOptions.length === 0}
                selectorIconColor="text-text"
                classNames={{
                  base: '',
                  trigger: 'bg-surface data-[open=true]:border-border',
                  value: 'group-data-[has-value=true]:text-text',
                  label: '',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                }}
              >
                {allOptions.map((option) => (
                  <SelectItem key={option} textValue={option.replaceAll('_', ' ')}>
                    {t(option.replaceAll('_', ' ')) || option}
                  </SelectItem>
                ))}
              </SelectWithClassName>
            );
          })()}
          <div className="flex gap-2 items-center">
            <Input
              classNames={{
                inputWrapper: 'bg-surface group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
              size="sm"
              variant="bordered"
              label="Add Specialization"
              placeholder="e.g. Weight Loss for Busy Dads, Powerlifting for Beginners"
              value={customSpecializationInput}
              onChange={(e) => setCustomSpecializationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const inputValue = customSpecializationInput.trim();
                  if (inputValue && !formData.specializations?.includes(inputValue)) {
                    setFormData((prev: any) => ({
                      ...prev,
                      specializations: [...(prev.specializations || []), inputValue],
                    }));
                    setCustomSpecializationInput('');
                  }
                }
              }}
              className="flex-1"
            />
            <Button
              className="bg-primary text-surface"
              onPress={() => {
                const inputValue = customSpecializationInput.trim();
                if (inputValue && !formData.specializations?.includes(inputValue)) {
                  setFormData((prev: any) => ({
                    ...prev,
                    specializations: [...(prev.specializations || []), inputValue],
                  }));
                  setCustomSpecializationInput('');
                }
              }}
              isDisabled={
                !customSpecializationInput.trim() ||
                formData.specializations?.includes(customSpecializationInput.trim())
              }
            >
              Add
            </Button>
          </div>
          {/* availability */}
          {days.map((day) => {
            const availability = formData.availability[day];
            return (
              <div key={day} className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2">
                  <Checkbox
                    id={day}
                    isSelected={availability?.isAvailable}
                    classNames={{
                      label: 'text-text',
                    }}
                    onValueChange={(checked) => {
                      setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          [day]: {
                            ...availability,
                            isAvailable: checked,
                          },
                        },
                      });
                    }}
                  >
                    {t(`${day}`)}
                  </Checkbox>
                  {availability?.isAvailable && (
                    <div className="flex-1 flex items-center gap-2 w-full">
                      <TimeInput
                        label={t('startTime')}
                        hourCycle={24}
                        variant="bordered"
                        size="sm"
                        classNames={{
                          base: 'max-w-[200px]',
                          inputWrapper: 'bg-surface',
                          input: 'text-text',
                          label: 'text-text',
                          segment: 'text-text data-[editable=true]:text-text',
                        }}
                        value={
                          availability?.timeSlots?.startTime
                            ? (() => {
                                const [hour, minute] = (
                                  availability.timeSlots.startTime ?? ''
                                ).split(':');
                                if (hour !== undefined && minute !== undefined) {
                                  return {
                                    hour: Number(hour),
                                    minute: Number(minute),
                                  } as TimeValue;
                                }
                                return null;
                              })()
                            : null
                        }
                        onChange={(val) => {
                          if (
                            val &&
                            typeof val.hour === 'number' &&
                            typeof val.minute === 'number'
                          ) {
                            const hour = String(val.hour).padStart(2, '0');
                            const minute = String(val.minute).padStart(2, '0');
                            const updateValue = `${hour}:${minute}`;
                            setFormData({
                              ...formData,
                              availability: {
                                ...formData.availability,
                                [day]: {
                                  ...availability,
                                  timeSlots: {
                                    ...availability.timeSlots,
                                    startTime: updateValue,
                                  },
                                },
                              },
                            });
                          }
                        }}
                      />
                      <TimeInput
                        label={t('endTime')}
                        hourCycle={24}
                        variant="bordered"
                        size="sm"
                        classNames={{
                          base: 'max-w-[200px]',
                          input: 'text-text',
                          label: 'text-text',
                          segment: 'text-text data-[editable=true]:text-text',
                          inputWrapper: 'bg-surface',
                        }}
                        value={
                          availability?.timeSlots?.endTime
                            ? (() => {
                                const [hour, minute] = (availability.timeSlots.endTime ?? '').split(
                                  ':',
                                );
                                if (hour !== undefined && minute !== undefined) {
                                  return {
                                    hour: Number(hour),
                                    minute: Number(minute),
                                  } as TimeValue;
                                }
                                return null;
                              })()
                            : null
                        }
                        onChange={(val) => {
                          if (
                            val &&
                            typeof val.hour === 'number' &&
                            typeof val.minute === 'number'
                          ) {
                            const hour = String(val.hour).padStart(2, '0');
                            const minute = String(val.minute).padStart(2, '0');
                            const updateValue = `${hour}:${minute}`;
                            setFormData({
                              ...formData,
                              availability: {
                                ...formData.availability,
                                [day]: {
                                  ...availability,
                                  timeSlots: {
                                    ...availability.timeSlots,
                                    endTime: updateValue,
                                  },
                                },
                              },
                            });
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        color="danger"
                        onPress={() => {
                          setFormData({
                            ...formData,
                            availability: {
                              ...formData.availability,
                              [day]: {
                                ...availability,
                                timeSlots: {
                                  startTime: '',
                                  endTime: '',
                                },
                              },
                            },
                          });
                        }}
                      >
                        {t('reset')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* social links */}
          <Textarea
            label={'Social Links'}
            variant="bordered"
            classNames={{
              inputWrapper: 'bg-background group-data-[focus=true]:border-info',
              input: 'text-text',
            }}
            value={formData.socialLinks?.join(', ') ?? ''}
            onValueChange={(value) => {
              setFormData({
                ...formData,
                socialLinks: value.split(','),
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

export default function SetupCoachProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <SetupCoachProfilePageContent />
    </Suspense>
  );
}
