import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Textarea,
  Badge,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  addToast,
  DateValue,
  CalendarDate,
} from '@heroui/react';
import {
  FaCalendarAlt as CalendarIcon,
  FaPlus as Plus,
  FaTrashAlt as Trash2,
} from 'react-icons/fa';
import { format } from 'date-fns';

interface HealthProfileProps {
  userId: string;
  onSave?: (profile: any) => void;
}

interface MenstrualCycleTracking {
  enabled: boolean;
  trackingStartDate: Date;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStart?: Date;
  symptoms: MenstrualSymptom[];
  trainingAdjustments: MenstrualTrainingAdjustment[];
  privacySettings: MenstrualPrivacySettings;
  notifications: MenstrualNotificationSettings;
}

interface MenstrualSymptom {
  symptom: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  cycleDay: number;
  notes?: string;
  impactOnTraining: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
}

interface MenstrualTrainingAdjustment {
  cyclePhase: 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';
  adjustments: {
    intensityModifier: number;
    volumeModifier: number;
    frequencyModifier: number;
    exerciseRestrictions: string[];
    recommendedExercises: string[];
    restPeriodModifier: number;
  };
  enabled: boolean;
}

interface MenstrualPrivacySettings {
  shareWithCoach: boolean;
  shareAggregatedData: boolean;
  shareSymptoms: boolean;
  shareTrainingImpact: boolean;
  anonymizeData: boolean;
}

interface MenstrualNotificationSettings {
  periodReminders: boolean;
  ovulationReminders: boolean;
  trainingAdjustmentNotifications: boolean;
  symptomTrackingReminders: boolean;
  reminderDaysBefore: number;
}

export const HealthProfile: React.FC<HealthProfileProps> = ({ userId, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>({
    menstrualCycleTracking: null,
    metabolicProfile: null,
    cardiovascularProfile: null,
    musculoskeletalProfile: null,
    nutritionalProfile: null,
    sleepProfile: null,
    stressProfile: null,
    lastUpdated: new Date(),
  });

  const [showMenstrualTracking, setShowMenstrualTracking] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/health-profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setShowMenstrualTracking(!!data.menstrualCycleTracking?.enabled);
      }
    } catch (error) {
      console.error('Failed to load health profile:', error);
      addToast({
        title: 'Error loading profile',
        description: 'Failed to load health profile from server.',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/health-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        addToast({
          title: 'Profile saved',
          description: 'Your health profile was saved successfully.',
          color: 'success',
        });
        onSave?.(profile);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save health profile:', error);
      addToast({
        title: 'Error saving profile',
        description: 'Failed to save health profile to server.',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMenstrualTracking = () => {
    const menstrualTracking: MenstrualCycleTracking = {
      enabled: true,
      trackingStartDate: new Date(),
      averageCycleLength: 28,
      averagePeriodLength: 5,
      symptoms: [],
      trainingAdjustments: [
        {
          cyclePhase: 'MENSTRUAL',
          adjustments: {
            intensityModifier: 0.8,
            volumeModifier: 0.9,
            frequencyModifier: 1.0,
            exerciseRestrictions: [],
            recommendedExercises: ['light_cardio', 'yoga', 'stretching'],
            restPeriodModifier: 1.2,
          },
          enabled: true,
        },
        {
          cyclePhase: 'FOLLICULAR',
          adjustments: {
            intensityModifier: 1.1,
            volumeModifier: 1.1,
            frequencyModifier: 1.0,
            exerciseRestrictions: [],
            recommendedExercises: ['strength_training', 'hiit'],
            restPeriodModifier: 1.0,
          },
          enabled: true,
        },
        {
          cyclePhase: 'OVULATORY',
          adjustments: {
            intensityModifier: 1.2,
            volumeModifier: 1.1,
            frequencyModifier: 1.0,
            exerciseRestrictions: [],
            recommendedExercises: ['strength_training', 'power_training'],
            restPeriodModifier: 1.0,
          },
          enabled: true,
        },
        {
          cyclePhase: 'LUTEAL',
          adjustments: {
            intensityModifier: 0.9,
            volumeModifier: 1.0,
            frequencyModifier: 1.0,
            exerciseRestrictions: [],
            recommendedExercises: ['moderate_cardio', 'strength_training'],
            restPeriodModifier: 1.1,
          },
          enabled: true,
        },
      ],
      privacySettings: {
        shareWithCoach: false,
        shareAggregatedData: false,
        shareSymptoms: false,
        shareTrainingImpact: true,
        anonymizeData: true,
      },
      notifications: {
        periodReminders: true,
        ovulationReminders: false,
        trainingAdjustmentNotifications: true,
        symptomTrackingReminders: true,
        reminderDaysBefore: 2,
      },
    };

    setProfile((prev: any) => ({
      ...prev,
      menstrualCycleTracking: menstrualTracking,
    }));
    setShowMenstrualTracking(true);
  };

  const disableMenstrualTracking = () => {
    setProfile((prev: any) => ({
      ...prev,
      menstrualCycleTracking: null,
    }));
    setShowMenstrualTracking(false);
  };

  const updateMenstrualTracking = (field: string, value: any) => {
    setProfile((prev: any) => ({
      ...prev,
      menstrualCycleTracking: {
        ...prev.menstrualCycleTracking,
        [field]: value,
      },
    }));
  };

  const updateTrainingAdjustment = (phaseIndex: number, field: string, value: any) => {
    setProfile((prev: any) => ({
      ...prev,
      menstrualCycleTracking: {
        ...prev.menstrualCycleTracking,
        trainingAdjustments: prev.menstrualCycleTracking.trainingAdjustments.map(
          (adj: any, index: number) =>
            index === phaseIndex
              ? { ...adj, adjustments: { ...adj.adjustments, [field]: value } }
              : adj,
        ),
      },
    }));
  };

  const symptomTypes = [
    'CRAMPS',
    'BLOATING',
    'MOOD_CHANGES',
    'FATIGUE',
    'HEADACHE',
    'BREAST_TENDERNESS',
    'FOOD_CRAVINGS',
    'ACNE',
    'SLEEP_DISTURBANCE',
    'JOINT_PAIN',
  ];

  const cyclePhases = ['MENSTRUAL', 'FOLLICULAR', 'OVULATORY', 'LUTEAL'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="text-lg font-medium">Health Profile</div>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Menstrual Cycle Tracking */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Menstrual Cycle Tracking</h3>
              {!showMenstrualTracking ? (
                <Button variant="bordered" onPress={initializeMenstrualTracking}>
                  Enable Tracking
                </Button>
              ) : (
                <Button variant="bordered" onPress={disableMenstrualTracking}>
                  Disable Tracking
                </Button>
              )}
            </div>

            {showMenstrualTracking && profile.menstrualCycleTracking && (
              <div className="space-y-6">
                {/* Basic Settings */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4">Basic Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-lg font-medium">Average Cycle Length (days)</div>
                      <Input
                        id="cycle-length"
                        type="number"
                        min="21"
                        max="35"
                        value={profile.menstrualCycleTracking.averageCycleLength}
                        onChange={(e) =>
                          updateMenstrualTracking('averageCycleLength', parseInt(e.target.value))
                        }
                      />
                    </div>

                    <div>
                      <div className="text-lg font-medium">Average Period Length (days)</div>
                      <Input
                        id="period-length"
                        type="number"
                        min="3"
                        max="8"
                        value={profile.menstrualCycleTracking.averagePeriodLength}
                        onChange={(e) =>
                          updateMenstrualTracking('averagePeriodLength', parseInt(e.target.value))
                        }
                      />
                    </div>

                    <div>
                      <div className="text-lg font-medium">Last Period Start</div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="bordered"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {profile.menstrualCycleTracking.lastPeriodStart
                              ? format(
                                  new Date(profile.menstrualCycleTracking.lastPeriodStart),
                                  'PPP',
                                )
                              : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            value={
                              (profile.menstrualCycleTracking.lastPeriodStart as DateValue) ?? null
                            }
                            onChange={(date) =>
                              updateMenstrualTracking('lastPeriodStart', date as CalendarDate)
                            }
                            // initialFocus not supported
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </Card>

                {/* Training Adjustments */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4">Training Adjustments</h4>
                  <div className="space-y-4">
                    {profile.menstrualCycleTracking.trainingAdjustments.map(
                      (adjustment: MenstrualTrainingAdjustment, index: number) => (
                        <Card key={adjustment.cyclePhase} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">
                              {adjustment.cyclePhase.charAt(0) +
                                adjustment.cyclePhase.slice(1).toLowerCase()}
                            </h5>
                            <Checkbox
                              checked={adjustment.enabled}
                              onValueChange={(checked) =>
                                setProfile((prev: any) => ({
                                  ...prev,
                                  menstrualCycleTracking: {
                                    ...prev.menstrualCycleTracking,
                                    trainingAdjustments:
                                      prev.menstrualCycleTracking.trainingAdjustments.map(
                                        (adj: any, i: number) =>
                                          i === index ? { ...adj, enabled: checked } : adj,
                                      ),
                                  },
                                }))
                              }
                            />
                          </div>

                          {adjustment.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="text-lg font-medium">Intensity Modifier</div>
                                <Input
                                  type="number"
                                  min="0.5"
                                  max="1.5"
                                  step="0.1"
                                  value={adjustment.adjustments.intensityModifier.toString()}
                                  onChange={(e) =>
                                    updateTrainingAdjustment(
                                      index,
                                      'intensityModifier',
                                      parseFloat(e.target.value),
                                    )
                                  }
                                />
                              </div>

                              <div>
                                <div className="text-lg font-medium">Volume Modifier</div>
                                <Input
                                  type="number"
                                  min="0.5"
                                  max="1.5"
                                  step="0.1"
                                  value={adjustment.adjustments.volumeModifier.toString()}
                                  onChange={(e) =>
                                    updateTrainingAdjustment(
                                      index,
                                      'volumeModifier',
                                      parseFloat(e.target.value),
                                    )
                                  }
                                />
                              </div>

                              <div>
                                <div className="text-lg font-medium">Rest Period Modifier</div>
                                <Input
                                  type="number"
                                  min="0.5"
                                  max="2.0"
                                  step="0.1"
                                  value={adjustment.adjustments.restPeriodModifier.toString()}
                                  onChange={(e) =>
                                    updateTrainingAdjustment(
                                      index,
                                      'restPeriodModifier',
                                      parseFloat(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </Card>
                      ),
                    )}
                  </div>
                </Card>

                {/* Privacy Settings */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4">Privacy Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="share-with-coach"
                        checked={profile.menstrualCycleTracking.privacySettings.shareWithCoach}
                        onValueChange={(checked) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            menstrualCycleTracking: {
                              ...prev.menstrualCycleTracking,
                              privacySettings: {
                                ...prev.menstrualCycleTracking.privacySettings,
                                shareWithCoach: checked,
                              },
                            },
                          }))
                        }
                      />
                      <div className="text-lg font-medium">Share with coach</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="share-training-impact"
                        checked={profile.menstrualCycleTracking.privacySettings.shareTrainingImpact}
                        onValueChange={(checked) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            menstrualCycleTracking: {
                              ...prev.menstrualCycleTracking,
                              privacySettings: {
                                ...prev.menstrualCycleTracking.privacySettings,
                                shareTrainingImpact: checked,
                              },
                            },
                          }))
                        }
                      />
                      <div className="text-lg font-medium">Share training impact</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anonymize-data"
                        checked={profile.menstrualCycleTracking.privacySettings.anonymizeData}
                        onValueChange={(checked) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            menstrualCycleTracking: {
                              ...prev.menstrualCycleTracking,
                              privacySettings: {
                                ...prev.menstrualCycleTracking.privacySettings,
                                anonymizeData: checked,
                              },
                            },
                          }))
                        }
                      />
                      <div className="text-lg font-medium">Anonymize data</div>
                    </div>
                  </div>
                </Card>

                {/* Notification Settings */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4">Notification Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="period-reminders"
                        checked={profile.menstrualCycleTracking.notifications.periodReminders}
                        onValueChange={(checked) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            menstrualCycleTracking: {
                              ...prev.menstrualCycleTracking,
                              notifications: {
                                ...prev.menstrualCycleTracking.notifications,
                                periodReminders: checked,
                              },
                            },
                          }))
                        }
                      />
                      <div className="text-lg font-medium">Period reminders</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="training-adjustments"
                        checked={
                          profile.menstrualCycleTracking.notifications
                            .trainingAdjustmentNotifications
                        }
                        onValueChange={(checked) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            menstrualCycleTracking: {
                              ...prev.menstrualCycleTracking,
                              notifications: {
                                ...prev.menstrualCycleTracking.notifications,
                                trainingAdjustmentNotifications: checked,
                              },
                            },
                          }))
                        }
                      />
                      <div className="text-lg font-medium">Training adjustment notifications</div>
                    </div>

                    <div>
                      <div className="text-lg font-medium">Reminder days before</div>
                      <Input
                        id="reminder-days"
                        type="number"
                        min="0"
                        max="7"
                        value={profile.menstrualCycleTracking.notifications.reminderDaysBefore}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            menstrualCycleTracking: {
                              ...prev.menstrualCycleTracking,
                              notifications: {
                                ...prev.menstrualCycleTracking.notifications,
                                reminderDaysBefore: parseInt(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="bordered" onPress={loadProfile} disabled={loading}>
              Reset
            </Button>
            <Button onPress={saveProfile} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
