import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  SelectItem,
  Checkbox,
  TimeInput,
  addToast,
  Skeleton,
} from '@heroui/react';
import { useTrainingPreferences, useUpdateTrainingPreferences } from '../../hooks/api/use-users';
import {
  NotificationPreferences,
  UserPreferences,
} from '@strengthos/shared-types/src/user-management';
import {
  NotificationFrequency,
  NotificationType,
} from '@strengthos/shared-types/src/user-management-enums';
import { TimeValue } from '@react-types/datepicker';
import { SelectWithClassName } from '../forms/selectWithClassName';
import { useExercises } from '@/hooks/api/use-exercises';
import { useAppSelector } from '@/store';
import { useTranslation } from '@/hooks/api/useTranslation';
import { useLocale } from '@/hooks/api/useLocale';
import { useAppDispatch } from '@/store';
import { setLanguage } from '@/store/slices/preferencesSlice';
import { useEquipments } from '@/hooks/api/use-equipment';

interface TrainingPreferencesProps {
  userId: string;
}

interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

interface DayAvailability {
  isAvailable: boolean;
  timeSlots: AvailableTimeSlot[];
  preferredTimes: string[];
  maxSessions: number;
  notes?: string;
}

interface AvailableTimeSlot {
  startTime: string;
  endTime: string;
  preference: 'HIGH' | 'MEDIUM' | 'LOW';
  equipmentProfileId?: string;
}

export const defaultPreferences: UserPreferences = {
  language: 'en',
  notifications: {
    email: {
      enabled: false,
      workoutReminders: false,
      progressUpdates: false,
      coachMessages: false,
      systemUpdates: false,
      marketingEmails: false,
      frequency: NotificationFrequency.DAILY,
    },
    sms: {
      enabled: false,
      emergencyOnly: false,
    },
    inApp: {
      enabled: false,
      showBadges: false,
      categories: [],
    },
  },
  training: {
    weeklySchedule: {
      monday: {
        isAvailable: false,
        timeSlots: {
          startTime: '',
          endTime: '',
        },
      },
      tuesday: {
        isAvailable: false,
        timeSlots: {
          startTime: '',
          endTime: '',
        },
      },
      wednesday: {
        isAvailable: false,
        timeSlots: {
          startTime: '',
          endTime: '',
        },
      },
      thursday: {
        isAvailable: false,
        timeSlots: {
          startTime: '',
          endTime: '',
        },
      },
      friday: {
        isAvailable: false,
        timeSlots: {
          startTime: '',
          endTime: '',
        },
      },
      saturday: {
        isAvailable: false,
        timeSlots: {
          startTime: '',
          endTime: '',
        },
      },
      sunday: {
        isAvailable: false,
        timeSlots: {
          startTime: '',
          endTime: '',
        },
      },
    },
    exerciseBlacklist: [],
    equipmentProfile: [],
  },
};

export const TrainingPreferences = ({ userId }: TrainingPreferencesProps) => {
  const {
    data: preferencesData,
    isLoading: loadingPreferences,
    refetch,
  } = useTrainingPreferences(userId);
  // const { data: exercisesData } = useExercises({ limit: 1000, search: '' });
  const { data: equipmentsData } = useEquipments({ limit: 1000, search: '' });
  const updatePreferencesMutation = useUpdateTrainingPreferences();
  const { t } = useTranslation();
  const { changeLocale, languageCode } = useLocale();
  const dispatch = useAppDispatch();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    if (preferencesData) {
      setPreferences((prev) => {
        return {
          ...prev,
          ...preferencesData,
        };
      });
    }
  }, [preferencesData]);

  const savePreferences = async () => {
    await updatePreferencesMutation.mutateAsync(
      {
        userId,
        preferences,
      },
      {
        onSuccess: () => {
          dispatch(setLanguage(preferences.language));
          if (languageCode !== preferences.language) {
            changeLocale(preferences.language);
          }

          refetch();
          addToast({
            title: t('trainingPreferencesSavedSuccessfully'),
            description: t('yourTrainingPreferencesHaveBeenSavedSuccessfully'),
            color: 'success',
          });
        },
        onError: () => {
          addToast({
            title: t('failedToSaveTrainingPreferences'),
            description: t('anErrorOccurredWhileSavingYourTrainingPreferences'),
            color: 'danger',
          });
        },
      },
    );
  };

  const days: (keyof WeeklyAvailability)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const availableLanguages = useAppSelector((state) => state.preferences.availableLanguages);

  const notificationTypes = [
    { value: 'inApp' as keyof NotificationPreferences, label: t('inApp') },
    { value: 'email' as keyof NotificationPreferences, label: t('email') },
    { value: 'sms' as keyof NotificationPreferences, label: t('sms') },
  ];

  const notificationCategories = [
    { value: NotificationType.WORKOUT_REMINDER, label: t('workoutReminders') },
    { value: NotificationType.PROGRESS_UPDATE, label: t('progressUpdates') },
    { value: NotificationType.COACH_MESSAGE, label: t('coachMessages') },
    { value: NotificationType.SYSTEM_UPDATE, label: t('systemUpdates') },
    { value: NotificationType.MARKETING_EMAIL, label: t('marketingEmails') },
  ];

  return (
    <div className="space-y-4">
      {loadingPreferences ? (
        <Skeleton className="w-full h-32 rounded-md" />
      ) : (
        <Card className="bg-backgroundSecondary border border-border">
          <CardBody className="space-y-4">
            <div className="grid grid-col-1 sm:grid-cols-2 gap-4">
              <SelectWithClassName
                id="language"
                label={t('language')}
                selectedKeys={[preferences.language]}
                onSelectionChange={(value) => {
                  const selectedValue = Array.from(value)[0] as string;
                  setPreferences((prev: any) => ({
                    ...prev,
                    language: selectedValue,
                  }));
                }}
                selectionMode="single"
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-surface data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                  selectorIcon: 'text-text',
                }}
                children={
                  <>
                    {availableLanguages.map((language) => (
                      <SelectItem key={language} textValue={t(`${language}`)}>
                        {t(`${language}`)}
                      </SelectItem>
                    ))}
                  </>
                }
              />
            </div>
            <div>
              <h3 className="text-text font-medium mb-4">{t('availableDaysToWorkout')}</h3>
              <div className="flex flex-col gap-2">
                {days.map((day) => {
                  const weeklySchedule = preferences.training.weeklySchedule[day];
                  return (
                    <div key={day} className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2">
                        <Checkbox
                          id={day}
                          isSelected={weeklySchedule?.isAvailable}
                          classNames={{
                            label: 'text-text',
                          }}
                          onValueChange={(checked) => {
                            setPreferences((prev: any) => ({
                              ...prev,
                              training: {
                                ...prev.training,
                                weeklySchedule: {
                                  ...prev.training.weeklySchedule,
                                  [day]: {
                                    ...prev.training.weeklySchedule[day],
                                    isAvailable: checked,
                                  },
                                },
                              },
                            }));
                          }}
                        >
                          {t(`${day}`)}
                        </Checkbox>
                        {weeklySchedule?.isAvailable && (
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
                                weeklySchedule?.timeSlots?.startTime
                                  ? (() => {
                                    const [hour, minute] = (
                                      weeklySchedule.timeSlots.startTime ?? ''
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
                                  setPreferences((prev: any) => ({
                                    ...prev,
                                    training: {
                                      ...prev.training,
                                      weeklySchedule: {
                                        ...prev.training.weeklySchedule,
                                        [day]: {
                                          ...weeklySchedule,
                                          timeSlots: {
                                            ...weeklySchedule.timeSlots,
                                            startTime: updateValue,
                                          },
                                        },
                                      },
                                    },
                                  }));
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
                                weeklySchedule?.timeSlots?.endTime
                                  ? (() => {
                                    const [hour, minute] = (
                                      weeklySchedule.timeSlots.endTime ?? ''
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
                                  setPreferences((prev: any) => ({
                                    ...prev,
                                    training: {
                                      ...prev.training,
                                      weeklySchedule: {
                                        ...prev.training.weeklySchedule,
                                        [day]: {
                                          ...weeklySchedule,
                                          timeSlots: {
                                            ...weeklySchedule.timeSlots,
                                            endTime: updateValue,
                                          },
                                        },
                                      },
                                    },
                                  }));
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              color="danger"
                              onPress={() => {
                                setPreferences((prev: any) => ({
                                  ...prev,
                                  training: {
                                    ...prev.training,
                                    weeklySchedule: {
                                      ...prev.training.weeklySchedule,
                                      [day]: {
                                        ...weeklySchedule,
                                        timeSlots: {
                                          startTime: '',
                                          endTime: '',
                                        },
                                      },
                                    },
                                  },
                                }));
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
              </div>
            </div>

            <div className="flex flex-col gap-2 text-text">
              <div className="text-lg font-medium">{t('notifications')}</div>
              {notificationTypes.map((type) => (
                <div key={type.value} className="flex flex-col gap-2">
                  <Checkbox
                    id={type.value}
                    classNames={{
                      label: 'text-text',
                    }}
                    isSelected={preferences.notifications[type.value].enabled}
                    onValueChange={(checked) => {
                      setPreferences((prev: any) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [type.value]: {
                            ...prev.notifications[type.value],
                            enabled: checked,
                          },
                        },
                      }));
                    }}
                  >
                    {type.label}
                  </Checkbox>
                  {type.value === 'inApp' && preferences.notifications[type.value].enabled && (
                    <div className="p-4 flex flex-col gap-2 rounded-lg border border-border">
                      <Checkbox
                        id="inApp-showBadges"
                        classNames={{
                          label: 'text-text',
                        }}
                        isSelected={preferences.notifications[type.value].showBadges}
                        onValueChange={(checked) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                showBadges: checked,
                              },
                            },
                          }));
                        }}
                      >
                        {t('showBadges')}
                      </Checkbox>
                      <SelectWithClassName
                        id="inApp-categories"
                        label={t('categories')}
                        size="sm"
                        selectedKeys={preferences.notifications[type.value].categories}
                        onSelectionChange={(value) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                categories: Array.from(value) as string[],
                              },
                            },
                          }));
                        }}
                        selectionMode="multiple"
                        selectorIconColor="text-text"
                        classNames={{
                          trigger: 'bg-surface data-[open=true]:border-border',
                          value: 'text-text group-data-[has-value=true]:text-text',
                          listbox:
                            'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                          label: 'group-data-[filled=true]:hidden',
                          innerWrapper: 'group-data-[has-label=true]:pt-0',
                        }}
                        renderValue={(selectedItems) => {
                          if (!selectedItems || selectedItems.length === 0) {
                            return (
                              <span className="truncate block max-w-full">
                                {t('selectCategories')}
                              </span>
                            );
                          }
                          return (
                            <div className="flex gap-2 flex-wrap w-full min-w-0">
                              {selectedItems.map((item) => (
                                <div
                                  key={item.key ?? item.toString()}
                                  className="px-2 py-1 rounded-full border-2 text-white text-xs font-medium min-w-0 max-w-full bg-primary"
                                  style={{ maxWidth: '100%' }}
                                >
                                  <span className="truncate block max-w-[108px]">
                                    {'textValue' in item
                                      ? item.textValue
                                      : typeof item === 'string'
                                        ? item
                                        : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                        children={
                          <>
                            {notificationCategories.map((category) => (
                              <SelectItem key={category.value}>{category.label}</SelectItem>
                            ))}
                          </>
                        }
                      />
                    </div>
                  )}
                  {type.value === 'email' && preferences.notifications[type.value].enabled && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-border">
                      <Checkbox
                        id="email-workout-reminders"
                        classNames={{
                          label: 'text-text',
                        }}
                        isSelected={preferences.notifications[type.value].workoutReminders}
                        onValueChange={(checked) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                workoutReminders: checked,
                              },
                            },
                          }));
                        }}
                      >
                        {t('workoutReminders')}
                      </Checkbox>
                      <Checkbox
                        id="email-progress-updates"
                        classNames={{
                          label: 'text-text',
                        }}
                        isSelected={preferences.notifications[type.value].progressUpdates}
                        onValueChange={(checked) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                progressUpdates: checked,
                              },
                            },
                          }));
                        }}
                      >
                        {t('progressUpdates')}
                      </Checkbox>
                      <Checkbox
                        id="email-coach-messages"
                        classNames={{
                          label: 'text-text',
                        }}
                        isSelected={preferences.notifications[type.value].coachMessages}
                        onValueChange={(checked) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                coachMessages: checked,
                              },
                            },
                          }));
                        }}
                      >
                        {t('coachMessages')}
                      </Checkbox>
                      <Checkbox
                        id="email-system-updates"
                        classNames={{
                          label: 'text-text',
                        }}
                        isSelected={preferences.notifications[type.value].systemUpdates}
                        onValueChange={(checked) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                systemUpdates: checked,
                              },
                            },
                          }));
                        }}
                      >
                        {t('systemUpdates')}
                      </Checkbox>
                      <Checkbox
                        id="email-marketing-emails"
                        classNames={{
                          label: 'text-text',
                        }}
                        isSelected={preferences.notifications[type.value].marketingEmails}
                        onValueChange={(checked) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                marketingEmails: checked,
                              },
                            },
                          }));
                        }}
                      >
                        {t('marketingEmails')}
                      </Checkbox>
                      <div className="col-span-2">
                        <SelectWithClassName
                          id="email-frequency"
                          label={t('frequency')}
                          selectedKeys={[preferences.notifications[type.value].frequency]}
                          onSelectionChange={(value) => {
                            setPreferences((prev: any) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [type.value]: {
                                  ...prev.notifications[type.value],
                                  frequency: value.currentKey,
                                },
                              },
                            }));
                          }}
                          selectionMode="single"
                          selectorIconColor="text-text"
                          size="sm"
                          classNames={{
                            trigger: 'bg-surface data-[open=true]:border-border',
                            value: 'text-text group-data-[has-value=true]:text-text',
                            listbox:
                              'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                          }}
                          children={
                            <>
                              {Object.values(NotificationFrequency).map((frequency) => (
                                <SelectItem key={frequency}>
                                  {frequency.charAt(0).toUpperCase() +
                                    frequency.slice(1).toLowerCase().replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </>
                          }
                        />
                      </div>
                    </div>
                  )}
                  {type.value === 'sms' && preferences.notifications[type.value].enabled && (
                    <div className="p-4 flex flex-col gap-2 rounded-lg border border-border">
                      <Checkbox
                        id="sms-emergency-only"
                        classNames={{
                          label: 'text-text',
                        }}
                        isSelected={preferences.notifications[type.value].emergencyOnly}
                        onValueChange={(checked) => {
                          setPreferences((prev: any) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [type.value]: {
                                ...prev.notifications[type.value],
                                emergencyOnly: checked,
                              },
                            },
                          }));
                        }}
                      >
                        {t('emergencyOnly')}
                      </Checkbox>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* <div className="text-text">
              <h3 className="font-medium mb-4">{t('exerciseBlacklist')}</h3>
              <SelectWithClassName
                id="exercise-blacklist"
                label={t('exerciseBlacklist')}
                selectedKeys={preferences?.training?.exerciseBlacklist ?? []}
                showScrollIndicators={true}
                onSelectionChange={(value) => {
                  let newBlacklist: string[] = [];
                  if (Array.isArray(value)) {
                    newBlacklist = value;
                  } else if (value && typeof value === 'object' && value.size !== undefined) {
                    newBlacklist = Array.from(value) as string[];
                  }
                  setPreferences((prev: any) => ({
                    ...prev,
                    training: {
                      ...prev.training,
                      exerciseBlacklist: newBlacklist,
                    },
                  }));
                }}
                selectionMode="multiple"
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-surface data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                  popoverContent: 'bg-backgroundSecondary',
                }}
              >
                {exercisesData?.exercises && exercisesData.exercises.length > 0 ? (
                  exercisesData.exercises
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((exercise) => <SelectItem key={exercise.id}>{exercise.name}</SelectItem>)
                ) : (
                  <SelectItem key="no-exercises" textValue="No exercises available">
                    No exercises available
                  </SelectItem>
                )}
              </SelectWithClassName>
            </div> */}

            <div className="text-text">
              <h3 className="font-medium mb-4">{t('common.availableEquipment')}</h3>
              <SelectWithClassName
                id="equipment-profile"
                label={t('common.availableEquipment')}
                selectedKeys={preferences.training.equipmentProfile}
                onSelectionChange={(value) => {
                  setPreferences((prev: any) => ({
                    ...prev,
                    training: {
                      ...prev.training,
                      equipmentProfile: Array.from(value) as string[],
                    },
                  }));
                }}
                selectionMode="multiple"
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-surface data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                }}
                children={
                  <>
                    {equipmentsData?.equipments?.map((equipment) => (
                      <SelectItem key={equipment.id}>{equipment.name}</SelectItem>
                    ))}
                  </>
                }
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="bordered"
                color="danger"
                onPress={() => refetch()}
                disabled={loadingPreferences || updatePreferencesMutation.isPending}
              >
                {t('reset')}
              </Button>
              <Button
                variant="bordered"
                color="primary"
                onPress={savePreferences}
                disabled={loadingPreferences || updatePreferencesMutation.isPending}
              >
                {updatePreferencesMutation.isPending ? t('saving') : t('save')}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
