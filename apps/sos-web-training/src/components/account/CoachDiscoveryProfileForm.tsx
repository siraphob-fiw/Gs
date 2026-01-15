'use client';

import { useMemo, useCallback } from 'react';
import { Input, SelectItem, Textarea, Button } from '@heroui/react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { CoachDiscoveryProfile } from '@/types/coaching';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { UseMutationResult } from '@tanstack/react-query';

interface CoachDiscoveryProfileFormProps {
  coachDiscoveryProfileData: CoachDiscoveryProfile | null;
  setCoachDiscoveryProfileData: React.Dispatch<React.SetStateAction<CoachDiscoveryProfile | null>>;
  customCertificationsInput: string;
  setCustomCertificationsInput: React.Dispatch<React.SetStateAction<string>>;
  customSpecializationsInput: string;
  setCustomSpecializationsInput: React.Dispatch<React.SetStateAction<string>>;
  updateCoachDiscoveryProfileMutation: UseMutationResult<any, Error, any, unknown>;
  handleUpdateCoachDiscoveryProfile: () => Promise<void>;
}

export default function CoachDiscoveryProfileForm({
  coachDiscoveryProfileData,
  setCoachDiscoveryProfileData,
  customCertificationsInput,
  setCustomCertificationsInput,
  customSpecializationsInput,
  setCustomSpecializationsInput,
  updateCoachDiscoveryProfileMutation,
  handleUpdateCoachDiscoveryProfile,
}: CoachDiscoveryProfileFormProps) {
  const { t } = useTranslation();

  // Memoize certifications data
  const certificationsData = useMemo(() => {
    const enumValues: string[] = [];
    const currentValues = Array.isArray(coachDiscoveryProfileData?.certifications)
      ? coachDiscoveryProfileData.certifications
      : [];
    const customValues = currentValues.filter((val: string) => !enumValues.includes(val));
    const allOptions = [...enumValues, ...customValues];
    const selectedKeys =
      currentValues.length > 0 ? new Set<string>(currentValues) : new Set<string>();

    return { currentValues, allOptions, selectedKeys };
  }, [coachDiscoveryProfileData?.certifications]);

  // Memoize specializations data
  const specializationsData = useMemo(() => {
    const enumValues: string[] = [];
    const currentValues = Array.isArray(coachDiscoveryProfileData?.specializations)
      ? coachDiscoveryProfileData.specializations
      : [];
    const customValues = currentValues.filter((val: string) => !enumValues.includes(val));
    const allOptions = [...enumValues, ...customValues];
    const selectedKeys =
      currentValues.length > 0 ? new Set<string>(currentValues) : new Set<string>();

    return { currentValues, allOptions, selectedKeys };
  }, [coachDiscoveryProfileData?.specializations]);

  // Memoize handlers using functional updates to avoid stale closures
  const handleBioChange = useCallback(
    (value: string) => {
      setCoachDiscoveryProfileData(
        (prev) =>
          ({
            ...prev,
            bio: value,
          }) as CoachDiscoveryProfile,
      );
    },
    [setCoachDiscoveryProfileData],
  );

  const handleCertificationsChange = useCallback(
    (keys: any) => {
      setCoachDiscoveryProfileData(
        (prev) =>
          ({
            ...prev,
            certifications: Array.from(keys) as string[],
          }) as CoachDiscoveryProfile,
      );
    },
    [setCoachDiscoveryProfileData],
  );

  const handleSpecializationsChange = useCallback(
    (keys: any) => {
      setCoachDiscoveryProfileData(
        (prev) =>
          ({
            ...prev,
            specializations: Array.from(keys) as string[],
          }) as CoachDiscoveryProfile,
      );
    },
    [setCoachDiscoveryProfileData],
  );

  const handleSocialLinksChange = useCallback(
    (value: string) => {
      setCoachDiscoveryProfileData(
        (prev) =>
          ({
            ...prev,
            socialLinks: value
              .split(',')
              .map((val) => val.trim())
              .filter((val) => !!val),
          }) as CoachDiscoveryProfile,
      );
    },
    [setCoachDiscoveryProfileData],
  );

  const handleAddCertification = useCallback(() => {
    const inputValue = customCertificationsInput.trim();
    if (inputValue) {
      setCoachDiscoveryProfileData((prev) => {
        const currentCerts = prev?.certifications || [];
        if (!currentCerts.includes(inputValue)) {
          return {
            ...prev,
            certifications: [...currentCerts, inputValue],
          } as CoachDiscoveryProfile;
        }
        return prev;
      });
      setCustomCertificationsInput('');
    }
  }, [customCertificationsInput, setCoachDiscoveryProfileData, setCustomCertificationsInput]);

  const handleAddSpecialization = useCallback(() => {
    const inputValue = customSpecializationsInput.trim();
    if (inputValue) {
      setCoachDiscoveryProfileData((prev) => {
        const currentSpecs = prev?.specializations || [];
        if (!currentSpecs.includes(inputValue)) {
          return {
            ...prev,
            specializations: [...currentSpecs, inputValue],
          } as CoachDiscoveryProfile;
        }
        return prev;
      });
      setCustomSpecializationsInput('');
    }
  }, [customSpecializationsInput, setCoachDiscoveryProfileData, setCustomSpecializationsInput]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg text-text font-medium">{t('account.coachProfile')}</div>
      <Textarea
        label={'Bio'}
        description={
          "This is your most important sales tool. It's your first chance to connect with new clients. Please introduce yourself, your coaching philosophy, and who you love to help."
        }
        variant="bordered"
        classNames={{
          description: 'text-text',
          inputWrapper: 'bg-background group-data-[focus=true]:border-info',
          input: 'text-text',
        }}
        value={coachDiscoveryProfileData?.bio ?? ''}
        onValueChange={handleBioChange}
      />

      <SelectWithClassName
        id="certifications"
        label="Certifications"
        variant="bordered"
        selectedKeys={certificationsData.selectedKeys}
        selectionMode="multiple"
        onSelectionChange={handleCertificationsChange}
        isDisabled={certificationsData.allOptions.length === 0}
        selectorIconColor="text-text"
        classNames={{
          trigger: `bg-surface data-[open=true]:border-border`,
          value: `group-data-[has-value=true]:text-text`,
          label: 'text-text',
          listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
        }}
      >
        {certificationsData.allOptions.map((certification) => (
          <SelectItem key={certification}>
            {t(certification.replaceAll('_', ' ')) || certification}
          </SelectItem>
        ))}
      </SelectWithClassName>

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
          value={customCertificationsInput}
          onChange={(e) => setCustomCertificationsInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCertification();
            }
          }}
          className="flex-1"
        />
        <Button
          className="bg-primary text-surface"
          onPress={handleAddCertification}
          isDisabled={
            !customCertificationsInput.trim() ||
            coachDiscoveryProfileData?.certifications?.includes(customCertificationsInput.trim())
          }
        >
          Add
        </Button>
      </div>

      <SelectWithClassName
        id="specializations"
        label={t('account.specializations')}
        variant="bordered"
        selectedKeys={specializationsData.selectedKeys}
        selectionMode="multiple"
        onSelectionChange={handleSpecializationsChange}
        isDisabled={specializationsData.allOptions.length === 0}
        selectorIconColor="text-text"
        classNames={{
          base: '',
          trigger: 'bg-surface data-[open=true]:border-border',
          value: 'group-data-[has-value=true]:text-text',
          label: '',
          listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
        }}
      >
        {specializationsData.allOptions.map((option) => (
          <SelectItem key={option} textValue={option.replaceAll('_', ' ')}>
            {t(option.replaceAll('_', ' ')) || option}
          </SelectItem>
        ))}
      </SelectWithClassName>

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
          value={customSpecializationsInput}
          onChange={(e) => setCustomSpecializationsInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSpecialization();
            }
          }}
          className="flex-1"
        />
        <Button
          className="bg-primary text-surface"
          onPress={handleAddSpecialization}
          isDisabled={
            !customSpecializationsInput.trim() ||
            coachDiscoveryProfileData?.specializations?.includes(customSpecializationsInput.trim())
          }
        >
          Add
        </Button>
      </div>

      <Textarea
        label={t('account.socialLinks')}
        variant="bordered"
        classNames={{
          inputWrapper: 'bg-background group-data-[focus=true]:border-info',
          input: 'text-text',
        }}
        value={coachDiscoveryProfileData?.socialLinks?.join(', ') ?? ''}
        onValueChange={handleSocialLinksChange}
      />
      <div className="flex justify-end gap-2">
        <Button
          color="primary"
          className="text-white"
          isLoading={updateCoachDiscoveryProfileMutation.isPending}
          onPress={handleUpdateCoachDiscoveryProfile}
        >
          {updateCoachDiscoveryProfileMutation.isPending
            ? t('Updating...')
            : t('Update Coach Profile')}
        </Button>
      </div>
    </div>
  );
}
