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
  addToast,
} from '@heroui/react';
import { FaPlus } from 'react-icons/fa';
// Simple shield icon component
const Shield = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const AlertTriangle = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const Trash2 = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
import { useTranslation } from '../../hooks/api/useTranslation';
// import { useDisabilityAccommodations, useUpdateDisabilityAccommodations } from '@/hooks/api/use-user-preferences.ts';
import { MonitoringHelpers } from '../../lib/monitoring-service';

interface DisabilityAccommodationsProps {
  userId: string;
  onSave?: (accommodations: any) => void;
}

interface Accommodation {
  id: string;
  type: 'VISUAL' | 'AUDITORY' | 'MOBILITY' | 'COGNITIVE' | 'COMMUNICATION' | 'OTHER';
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  equipmentRequired?: string[];
  environmentalNeeds?: string[];
  assistanceRequired?: boolean;
  notes?: string;
}

interface AccessibilityFeature {
  feature: string;
  required: boolean;
  alternatives?: string[];
  notes?: string;
}

export const DisabilityAccommodations: React.FC<DisabilityAccommodationsProps> = ({
  userId,
  onSave,
}) => {
  const { t } = useTranslation();

  // Use the new API hooks
  // const { data: accommodationsData, isLoading: loadingAccommodations, refetch } = useDisabilityAccommodations(userId);
  // const updateAccommodationsMutation = useUpdateDisabilityAccommodations();

  const [accommodations, setAccommodations] = useState<any>({
    accommodations: [],
    accessibilityFeatures: [],
    emergencyProcedures: [],
    communicationPreferences: {
      preferredLanguage: 'en',
      requiresSignLanguage: false,
      requiresLargeText: false,
      requiresAudioDescription: false,
      preferredCommunicationMethod: 'VERBAL',
    },
    assistiveDevices: [],
    environmentalNeeds: {
      lightingSensitivity: false,
      noiseSensitivity: false,
      temperatureSensitivity: false,
      spacialRequirements: [],
      allergyConsiderations: [],
    },
  });

  const [newAccommodation, setNewAccommodation] = useState<Partial<Accommodation>>({});
  const [newAccessibilityFeature, setNewAccessibilityFeature] = useState<
    Partial<AccessibilityFeature>
  >({});
  const [showAddAccommodation, setShowAddAccommodation] = useState(false);
  const [showAddFeature, setShowAddFeature] = useState(false);

  // Update local state when API data changes
  // useEffect(() => {
  //   if (accommodationsData) {
  //     setAccommodations(accommodationsData);
  //   }
  // }, [accommodationsData]);

  // const saveAccommodations = async () => {
  //   try {
  //     await updateAccommodationsMutation.mutateAsync({
  //       userId,
  //       accommodations
  //     });

  //     // Track the accommodation update
  //     MonitoringHelpers.trackPreferencesUpdated('disability-accommodations', userId);

  //     addToast({
  //       title: t('success.saved'),
  //       description: t('preferences.accommodations.saveSuccess'),
  //       color: 'success',
  //     });
  //     onSave?.(accommodations);
  //   } catch (error) {
  //     console.error('Failed to save disability accommodations:', error);
  //     addToast({
  //       title: t('error.saveFailed'),
  //       description: t('preferences.accommodations.saveError'),
  //       variant: 'flat',
  //       color: 'danger',
  //     });
  //   }
  // };

  const addAccommodation = () => {
    if (newAccommodation.type && newAccommodation.description && newAccommodation.priority) {
      const accommodation = {
        ...newAccommodation,
        id: Date.now().toString(),
      };

      setAccommodations((prev: any) => ({
        ...prev,
        accommodations: [...prev.accommodations, accommodation],
      }));
      setNewAccommodation({});
      setShowAddAccommodation(false);
    }
  };

  const removeAccommodation = (id: string) => {
    setAccommodations((prev: any) => ({
      ...prev,
      accommodations: prev.accommodations.filter((acc: Accommodation) => acc.id !== id),
    }));
  };

  const addAccessibilityFeature = () => {
    if (newAccessibilityFeature.feature) {
      setAccommodations((prev: any) => ({
        ...prev,
        accessibilityFeatures: [...prev.accessibilityFeatures, newAccessibilityFeature],
      }));
      setNewAccessibilityFeature({});
      setShowAddFeature(false);
    }
  };

  const removeAccessibilityFeature = (index: number) => {
    setAccommodations((prev: any) => ({
      ...prev,
      accessibilityFeatures: prev.accessibilityFeatures.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateCommunicationPreferences = (field: string, value: any) => {
    setAccommodations((prev: any) => ({
      ...prev,
      communicationPreferences: {
        ...prev.communicationPreferences,
        [field]: value,
      },
    }));
  };

  const updateEnvironmentalNeeds = (field: string, value: any) => {
    setAccommodations((prev: any) => ({
      ...prev,
      environmentalNeeds: {
        ...prev.environmentalNeeds,
        [field]: value,
      },
    }));
  };

  const accommodationTypes = [
    'VISUAL',
    'AUDITORY',
    'MOBILITY',
    'COGNITIVE',
    'COMMUNICATION',
    'OTHER',
  ];

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-warning/10 text-warningHover',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const communicationMethods = [
    'VERBAL',
    'WRITTEN',
    'SIGN_LANGUAGE',
    'VISUAL_CUES',
    'ASSISTIVE_TECHNOLOGY',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield />
            <span>{t('preferences.accommodations.title')}</span>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Accommodations List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{t('preferences.accommodations.list')}</h3>
              <Button variant="bordered" size="sm" onPress={() => setShowAddAccommodation(true)}>
                <FaPlus />
                {t('preferences.accommodations.addAccommodation')}
              </Button>
            </div>

            {showAddAccommodation && (
              <Card className="p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-lg font-medium">
                      {t('preferences.accommodations.type')}
                    </div>
                    <Select
                      value={newAccommodation.type || ''}
                      onVolumeChange={(value) =>
                        setNewAccommodation((prev) => ({ ...prev, type: value as any }))
                      }
                      title={t('preferences.accommodations.selectType')}
                    >
                      {accommodationTypes.map((type) => (
                        <SelectItem key={type}>
                          {t(`accommodations.type.${type.toLowerCase()}`)}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <div className="text-lg font-medium">
                      {t('preferences.accommodations.priority')}
                    </div>
                    <Select
                      value={newAccommodation.priority || ''}
                      onVolumeChange={(value) =>
                        setNewAccommodation((prev) => ({ ...prev, priority: value as any }))
                      }
                      title={t('preferences.accommodations.selectPriority')}
                    >
                      <SelectItem key="LOW">{t('priority.low')}</SelectItem>
                      <SelectItem key="MEDIUM">{t('priority.medium')}</SelectItem>
                      <SelectItem key="HIGH">{t('priority.high')}</SelectItem>
                      <SelectItem key="CRITICAL">{t('priority.critical')}</SelectItem>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-lg font-medium">
                      {t('preferences.accommodations.description')}
                    </div>
                    <Textarea
                      value={newAccommodation.description || ''}
                      onChange={(e) =>
                        setNewAccommodation((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder={t('preferences.accommodations.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assistance-required"
                      checked={newAccommodation.assistanceRequired || false}
                      onValueChange={(value) =>
                        setNewAccommodation((prev) => ({
                          ...prev,
                          assistanceRequired: value as boolean,
                        }))
                      }
                    />
                    <div className="text-lg font-medium">
                      {t('preferences.accommodations.assistanceRequired')}
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-medium">
                      {t('preferences.accommodations.notes')}
                    </div>
                    <Input
                      value={newAccommodation.notes || ''}
                      onValueChange={(e: string) => {
                        if (e) {
                          setNewAccommodation((prev) => ({ ...prev, notes: e as string }));
                        } else {
                          setNewAccommodation((prev) => ({ ...prev, notes: '' }));
                        }
                      }}
                      placeholder={t('preferences.accommodations.notesPlaceholder')}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="bordered"
                    onPress={() => {
                      setShowAddAccommodation(false);
                      setNewAccommodation({});
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button onPress={addAccommodation}>{t('common.add')}</Button>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {accommodations.accommodations.map((accommodation: Accommodation) => (
                <div
                  key={accommodation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge className={priorityColors[accommodation.priority]}>
                      {t(`priority.${accommodation.priority.toLowerCase()}`)}
                    </Badge>
                    <span className="font-medium">
                      {t(`accommodations.type.${accommodation.type.toLowerCase()}`)}
                    </span>
                    <span className="text-sm text-Secondary">{accommodation.description}</span>
                    {accommodation.assistanceRequired && (
                      <Badge variant="shadow" className="text-info">
                        <AlertTriangle />
                        {t('preferences.accommodations.assistanceNeeded')}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => removeAccommodation(accommodation.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Communication Preferences */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              {t('preferences.accommodations.communication')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.preferredLanguage')}
                </div>
                <Select
                  value={accommodations.communicationPreferences.preferredLanguage}
                  onSelectionChange={(value) =>
                    updateCommunicationPreferences('preferredLanguage', value.currentKey)
                  }
                >
                  <SelectItem key="en">English</SelectItem>
                  <SelectItem key="es">Español</SelectItem>
                  <SelectItem key="fr">Français</SelectItem>
                  <SelectItem key="de">Deutsch</SelectItem>
                  <SelectItem key="th">ไทย</SelectItem>
                </Select>
              </div>

              <div>
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.communicationMethod')}
                </div>
                <Select
                  value={accommodations.communicationPreferences.preferredCommunicationMethod}
                  onSelectionChange={(value) =>
                    updateCommunicationPreferences('preferredCommunicationMethod', value)
                  }
                >
                  {communicationMethods.map((method) => (
                    <SelectItem key={method}>
                      {t(`communication.${method.toLowerCase()}`)}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sign-language"
                  checked={accommodations.communicationPreferences.requiresSignLanguage}
                  onValueChange={(checked) =>
                    updateCommunicationPreferences('requiresSignLanguage', checked)
                  }
                />
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.requiresSignLanguage')}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="large-text"
                  checked={accommodations.communicationPreferences.requiresLargeText}
                  onValueChange={(checked) =>
                    updateCommunicationPreferences('requiresLargeText', checked)
                  }
                />
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.requiresLargeText')}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="audio-description"
                  checked={accommodations.communicationPreferences.requiresAudioDescription}
                  onValueChange={(checked) =>
                    updateCommunicationPreferences('requiresAudioDescription', checked)
                  }
                />
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.requiresAudioDescription')}
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Needs */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              {t('preferences.accommodations.environmental')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lighting-sensitivity"
                  checked={accommodations.environmentalNeeds.lightingSensitivity}
                  onValueChange={(checked) =>
                    updateEnvironmentalNeeds('lightingSensitivity', checked)
                  }
                />
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.lightingSensitivity')}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noise-sensitivity"
                  checked={accommodations.environmentalNeeds.noiseSensitivity}
                  onValueChange={(checked) => updateEnvironmentalNeeds('noiseSensitivity', checked)}
                />
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.noiseSensitivity')}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temperature-sensitivity"
                  checked={accommodations.environmentalNeeds.temperatureSensitivity}
                  onValueChange={(checked) =>
                    updateEnvironmentalNeeds('temperatureSensitivity', checked)
                  }
                />
                <div className="text-lg font-medium">
                  {t('preferences.accommodations.temperatureSensitivity')}
                </div>
              </div>
            </div>
          </div>

          {/* <div className="flex justify-end space-x-2">
            <Button 
              variant="bordered" 
              onPress={() => refetch()} 
              disabled={loadingAccommodations || updateAccommodationsMutation.isPending}
            >
              {t('common.reset')}
            </Button>
            <Button 
              onPress={saveAccommodations} 
              disabled={loadingAccommodations || updateAccommodationsMutation.isPending}
            >
              {updateAccommodationsMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div> */}
        </CardBody>
      </Card>
    </div>
  );
};
