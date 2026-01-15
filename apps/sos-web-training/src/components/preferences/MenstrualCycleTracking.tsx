import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Textarea,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  addToast,
  CalendarDate,
} from '@heroui/react';

import { FaCalendar, FaHeart } from 'react-icons/fa';
import { format, toDate } from 'date-fns';
// Removed useTranslation
import { MonitoringHelpers } from '../../lib/monitoring-service';
import { parseDate } from '@internationalized/date';

interface MenstrualCycleTrackingProps {
  userId: string;
  onSave?: (tracking: any) => void;
}

interface CyclePhase {
  phase: 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';
  trainingAdjustments: {
    intensityModifier: number;
    volumeModifier: number;
    exerciseRestrictions: string[];
    recommendedExercises: string[];
  };
  nutritionRecommendations: string[];
  supplementRecommendations: string[];
}

export const MenstrualCycleTracking: React.FC<MenstrualCycleTrackingProps> = ({
  userId,
  onSave,
}) => {
  // Removed useTranslation
  // const { t } = useTranslation();

  // Use the new API hooks

  const TrendingUpIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );

  const [tracking, setTracking] = useState<any>({
    enabled: false,
    cycleLength: 28,
    periodLength: 5,
    lastPeriodStart: null,
    trackingPreferences: {
      trackSymptoms: true,
      trackMood: true,
      trackEnergy: true,
      trackSleep: true,
      trackWeight: false,
      trackTemperature: false,
      shareWithCoach: false,
      privateNotes: true,
    },
    phaseAdjustments: {
      menstrual: {
        intensityModifier: 0.8,
        volumeModifier: 0.9,
        exerciseRestrictions: ['HIGH_IMPACT_CARDIO', 'HEAVY_LIFTING'],
        recommendedExercises: ['YOGA', 'LIGHT_CARDIO', 'STRETCHING'],
      },
      follicular: {
        intensityModifier: 1.0,
        volumeModifier: 1.0,
        exerciseRestrictions: [],
        recommendedExercises: ['STRENGTH_TRAINING', 'HIIT', 'CARDIO'],
      },
      ovulatory: {
        intensityModifier: 1.1,
        volumeModifier: 1.1,
        exerciseRestrictions: [],
        recommendedExercises: ['STRENGTH_TRAINING', 'POWER_TRAINING', 'HIIT'],
      },
      luteal: {
        intensityModifier: 0.9,
        volumeModifier: 0.95,
        exerciseRestrictions: ['EXCESSIVE_CARDIO'],
        recommendedExercises: ['MODERATE_STRENGTH', 'YOGA', 'PILATES'],
      },
    },
    symptoms: {
      trackCramps: true,
      trackBloating: true,
      trackHeadaches: true,
      trackMoodSwings: true,
      trackFatigue: true,
      trackBreastTenderness: false,
      trackBackPain: true,
      customSymptoms: [],
    },
    notifications: {
      periodReminder: true,
      ovulationReminder: false,
      phaseTransitionReminder: true,
      trainingAdjustmentReminder: true,
      reminderDaysBefore: 2,
    },
  });

  const [lastPeriodDate, setLastPeriodDate] = useState<Date | undefined>(undefined);

  // Update local state when API data changes
  // useEffect(() => {
  //   if (trackingData) {
  //     setTracking(trackingData);
  //     if ((trackingData as any)?.lastPeriodStart) {
  //       setLastPeriodDate(new Date((trackingData as any).lastPeriodStart));
  //     }
  //   }
  // }, [trackingData]);

  const saveTracking = async () => {
    try {
      const trackingToSave = {
        ...tracking,
        lastPeriodStart: lastPeriodDate?.toString(),
      };

      // await updateTrackingMutation.mutateAsync({
      //   userId,
      //   tracking: trackingToSave,
      // });

      // Track the preference update
      MonitoringHelpers.trackPreferencesUpdated('menstrual-cycle-tracking', userId);

      addToast({
        title: 'Saved',
        description: 'Menstrual cycle tracking preferences saved successfully.',
        color: 'success',
      });
      onSave?.(trackingToSave);
    } catch (error) {
      console.error('Failed to save menstrual cycle tracking:', error);
      addToast({
        title: 'Save Failed',
        description: 'There was an error saving menstrual cycle tracking preferences.',
        color: 'danger',
      });
    }
  };

  const updateTrackingPreferences = (field: string, value: any) => {
    setTracking((prev: any) => ({
      ...prev,
      trackingPreferences: {
        ...prev.trackingPreferences,
        [field]: value,
      },
    }));
  };

  const updatePhaseAdjustments = (phase: string, field: string, value: any) => {
    setTracking((prev: any) => ({
      ...prev,
      phaseAdjustments: {
        ...prev.phaseAdjustments,
        [phase]: {
          ...prev.phaseAdjustments[phase],
          [field]: value,
        },
      },
    }));
  };

  const updateSymptomTracking = (field: string, value: any) => {
    setTracking((prev: any) => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [field]: value,
      },
    }));
  };

  const updateNotifications = (field: string, value: any) => {
    setTracking((prev: any) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const getCurrentPhase = () => {
    if (!lastPeriodDate) return null;

    const daysSinceLastPeriod = Math.floor(
      (Date.now() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const cycleDay = (daysSinceLastPeriod % tracking.cycleLength) + 1;

    if (cycleDay <= tracking.periodLength) return 'menstrual';
    if (cycleDay <= 13) return 'follicular';
    if (cycleDay <= 16) return 'ovulatory';
    return 'luteal';
  };

  const getNextPeriodDate = () => {
    if (!lastPeriodDate) return null;

    const nextPeriod = new Date(lastPeriodDate);
    nextPeriod.setDate(nextPeriod.getDate() + tracking.cycleLength);
    return nextPeriod;
  };

  const PHASE_LABELS: Record<string, string> = {
    menstrual: 'Menstrual',
    follicular: 'Follicular',
    ovulatory: 'Ovulatory',
    luteal: 'Luteal',
  };

  const currentPhase = getCurrentPhase();
  const nextPeriodDate = getNextPeriodDate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FaHeart className="h-4 w-4" />
            <span>Menstrual Cycle Tracking</span>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Enable/Disable Tracking */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-tracking"
              checked={tracking.enabled}
              onValueChange={(checked) =>
                setTracking((prev: any) => ({ ...prev, enabled: checked }))
              }
            />
            <div className="text-lg font-medium">Enable menstrual cycle tracking</div>
          </div>

          {tracking.enabled && (
            <>
              {/* Basic Cycle Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Basic Cycle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-lg font-medium">Cycle Length (days)</div>
                    <Input
                      id="cycle-length"
                      type="number"
                      min="21"
                      max="35"
                      value={tracking.cycleLength}
                      onValueChange={(e) =>
                        setTracking((prev: any) => ({
                          ...prev,
                          cycleLength: parseInt(e),
                        }))
                      }
                    />
                  </div>

                  <div>
                    <div className="text-lg font-medium">Period Length (days)</div>
                    <Input
                      id="period-length"
                      type="number"
                      min="2"
                      max="8"
                      value={tracking.periodLength}
                      onValueChange={(e) =>
                        setTracking((prev: any) => ({
                          ...prev,
                          periodLength: parseInt(e),
                        }))
                      }
                    />
                  </div>

                  <div>
                    <div className="text-lg font-medium">Last Period Start Date</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="bordered"
                          className="w-full justify-start text-left font-normal"
                        >
                          <FaCalendar className="mr-2 h-4 w-4" />
                          {lastPeriodDate ? format(lastPeriodDate, 'PPP') : 'Select a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          value={lastPeriodDate ? parseDate(lastPeriodDate.toString()) : null}
                          onChange={(date) => {
                            setLastPeriodDate(
                              date ? new Date((date as any).toString()) : undefined,
                            );
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Current Cycle Status */}
              {currentPhase && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Current Cycle Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUpIcon />
                        <span className="font-medium">Current Phase</span>
                      </div>
                      <Badge className="bg-pink-100 text-pink-800">
                        {PHASE_LABELS[currentPhase] || currentPhase}
                      </Badge>
                    </Card>

                    {nextPeriodDate && (
                      <Card className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaCalendar />
                          <span className="font-medium">Next Period</span>
                        </div>
                        <span className="text-sm text-Secondary">
                          {format(nextPeriodDate, 'PPP')}
                        </span>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Tracking Preferences */}
              <div>
                <h3 className="text-lg font-medium mb-4">Tracking Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="track-symptoms"
                      checked={tracking.trackingPreferences.trackSymptoms}
                      onValueChange={(checked) =>
                        updateTrackingPreferences('trackSymptoms', checked)
                      }
                    />
                    <div className="text-lg font-medium">Track symptoms</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="track-mood"
                      checked={tracking.trackingPreferences.trackMood}
                      onValueChange={(checked) => updateTrackingPreferences('trackMood', checked)}
                    />
                    <div className="text-lg font-medium">Track mood</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="track-energy"
                      checked={tracking.trackingPreferences.trackEnergy}
                      onValueChange={(checked) => updateTrackingPreferences('trackEnergy', checked)}
                    />
                    <div className="text-lg font-medium">Track energy</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="track-sleep"
                      checked={tracking.trackingPreferences.trackSleep}
                      onValueChange={(checked) => updateTrackingPreferences('trackSleep', checked)}
                    />
                    <div className="text-lg font-medium">Track sleep</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="share-with-coach"
                      checked={tracking.trackingPreferences.shareWithCoach}
                      onValueChange={(checked) =>
                        updateTrackingPreferences('shareWithCoach', checked)
                      }
                    />
                    <div className="text-lg font-medium">Share with coach</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="private-notes"
                      checked={tracking.trackingPreferences.privateNotes}
                      onValueChange={(checked) =>
                        updateTrackingPreferences('privateNotes', checked)
                      }
                    />
                    <div className="text-lg font-medium">Private notes</div>
                  </div>
                </div>
              </div>

              {/* Training Adjustments */}
              <div>
                <h3 className="text-lg font-medium mb-4">Training Adjustments</h3>
                <div className="space-y-4">
                  {Object.entries(tracking.phaseAdjustments).map(
                    ([phase, adjustments]: [string, any]) => (
                      <Card key={phase} className="p-4">
                        <h4 className="font-medium mb-3 flex items-center space-x-2">
                          <Badge variant="shadow">{PHASE_LABELS[phase] || phase}</Badge>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-lg font-medium">Intensity Modifier (%)</div>
                            <Input
                              id={`${phase}-intensity`}
                              type="number"
                              min="0.5"
                              max="1.5"
                              step="0.1"
                              value={adjustments.intensityModifier}
                              onChange={(e) =>
                                updatePhaseAdjustments(
                                  phase,
                                  'intensityModifier',
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>

                          <div>
                            <div className="text-lg font-medium">Volume Modifier (%)</div>
                            <Input
                              id={`${phase}-volume`}
                              type="number"
                              min="0.5"
                              max="1.5"
                              step="0.1"
                              value={adjustments.volumeModifier}
                              onChange={(e) =>
                                updatePhaseAdjustments(
                                  phase,
                                  'volumeModifier',
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    ),
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="text-lg font-medium mb-4">Notifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="period-reminder"
                      checked={tracking.notifications.periodReminder}
                      onValueChange={(checked) => updateNotifications('periodReminder', checked)}
                    />
                    <div className="text-lg font-medium">Period reminder</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="phase-transition-reminder"
                      checked={tracking.notifications.phaseTransitionReminder}
                      onValueChange={(checked) =>
                        updateNotifications('phaseTransitionReminder', checked)
                      }
                    />
                    <div className="text-lg font-medium">Phase transition reminder</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="training-adjustment-reminder"
                      checked={tracking.notifications.trainingAdjustmentReminder}
                      onValueChange={(checked) =>
                        updateNotifications('trainingAdjustmentReminder', checked)
                      }
                    />
                    <div className="text-lg font-medium">Training adjustment reminder</div>
                  </div>

                  <div>
                    <div className="text-lg font-medium">Reminder days before</div>
                    <Input
                      id="reminder-days"
                      type="number"
                      min="1"
                      max="7"
                      value={tracking.notifications.reminderDaysBefore}
                      onChange={(e) =>
                        updateNotifications('reminderDaysBefore', parseInt(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="shadow"
              // onPress={() => refetch()}
              // disabled={loadingTracking || updateTrackingMutation.isPending}
            >
              Reset
            </Button>
            <Button
              variant="shadow"
              onPress={saveTracking}
              // disabled={loadingTracking || updateTrackingMutation.isPending}
            >
              Save
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
