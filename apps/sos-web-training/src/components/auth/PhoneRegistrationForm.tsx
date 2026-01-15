'use client';

import React, { useState } from 'react';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { AuthMethod } from './AuthMethodSelector';
import { PhoneVerificationForm } from './PhoneVerificationForm';
import type { RegisterWithPhoneRequest } from '@strengthos/shared-security';
import dayjs from 'dayjs';

interface PhoneRegistrationFormProps {
  authMethod: 'WHATSAPP' | 'LINE';
  onSubmit: (data: RegisterWithPhoneRequest) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  bodyWeight?: number;
  height?: number;
  experienceLevel?: string;
}

export const PhoneRegistrationForm: React.FC<PhoneRegistrationFormProps> = ({
  authMethod,
  onSubmit,
  onBack,
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'verification' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    experienceLevel: 'BEGINNER',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateProfile = () => {
    const errors: Record<string, string> = {};

    if (!profileData.firstName.trim()) {
      errors.firstName = t('validation.required', 'This field is required');
    }

    if (!profileData.lastName.trim()) {
      errors.lastName = t('validation.required', 'This field is required');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      setValidationErrors({ phoneNumber: t('validation.required', 'This field is required') });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setValidationErrors({
        phoneNumber: t('validation.phone.invalid', 'Please enter a valid phone number'),
      });
      return;
    }

    try {
      // Request phone verification
      const authService = (await import('@/hooks/api/use-auth')).default;
      const result = await authService.requestPhoneVerification({
        phoneNumber,
        method: authMethod === 'WHATSAPP' ? 'WHATSAPP' : 'SMS',
      });

      if (result.success) {
        setStep('verification');
        setValidationErrors({});
      } else {
        setValidationErrors({ phoneNumber: result.message || 'Failed to send verification code' });
      }
    } catch (error) {
      setValidationErrors({ phoneNumber: 'Failed to send verification code' });
    }
  };

  const handleVerificationSubmit = async (token: string) => {
    try {
      // Confirm verification code
      const authService = (await import('@/hooks/api/use-auth')).default;
      const confirmResult = await authService.confirmPhoneVerification({
        phoneNumber,
        token,
      });

      if (confirmResult.success && confirmResult.data) {
        setVerificationToken(token);
        setStep('profile');
        setValidationErrors({});
      } else {
        setValidationErrors({ verificationCode: 'Invalid verification code' });
      }
    } catch (error) {
      setValidationErrors({ verificationCode: 'Verification failed' });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) {
      return;
    }

    const registrationData: RegisterWithPhoneRequest = {
      phoneNumber,
      authMethod,
      profile: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dateOfBirth: profileData.dateOfBirth
          ? dayjs(profileData.dateOfBirth).format('YYYY-MM-DD')
          : undefined,
        gender: profileData.gender,
        bodyWeight: profileData.bodyWeight,
        height: profileData.height,
      },
      verificationToken,
    };

    await onSubmit(registrationData);
  };

  const handleResendCode = async () => {
    try {
      const authService = (await import('@/hooks/api/use-auth')).default;
      const result = await authService.requestPhoneVerification({
        phoneNumber,
        method: authMethod === 'WHATSAPP' ? 'WHATSAPP' : 'SMS',
      });

      if (!result.success) {
        setValidationErrors({
          verificationCode: result.message || 'Failed to resend verification code',
        });
      }
    } catch (error) {
      setValidationErrors({ verificationCode: 'Failed to resend verification code' });
    }
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="text-lg font-medium">
            {authMethod === 'WHATSAPP'
              ? t('auth.register.whatsapp.title', 'Register with WhatsApp')
              : t('auth.register.line.title', 'Register with LINE')}
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error/5 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-textSecondary mb-1"
              >
                {t('auth.phoneNumber', 'Phone Number')}
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('auth.phoneNumber.placeholder', '+1234567890')}
                className={validationErrors.phoneNumber ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {validationErrors.phoneNumber && (
                <p className="mt-1 text-sm text-error">{validationErrors.phoneNumber}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="shadow"
                onPress={onBack}
                disabled={isLoading}
                className="flex-1"
              >
                {t('common.back', 'Back')}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? t('common.loading', 'Loading...') : t('auth.sendCode', 'Send Code')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    );
  }

  if (step === 'verification') {
    return (
      <PhoneVerificationForm
        phoneNumber={phoneNumber}
        onCancel={() => setStep('phone')}
        onVerificationComplete={async () => {}}
        onResendCode={async () => {}}
        isLoading={isLoading}
        error={validationErrors.verificationCode}
      />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="text-lg font-medium">
          {t('auth.register.profile.title', 'Complete Your Profile')}
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-error bg-error/5 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-textSecondary mb-1"
              >
                {t('auth.firstName', 'First Name')} *
              </label>
              <Input
                id="firstName"
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                className={validationErrors.firstName ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {validationErrors.firstName && (
                <p className="mt-1 text-sm text-error">{validationErrors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-textSecondary mb-1"
              >
                {t('auth.lastName', 'Last Name')} *
              </label>
              <Input
                id="lastName"
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                className={validationErrors.lastName ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {validationErrors.lastName && (
                <p className="mt-1 text-sm text-error">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-textSecondary mb-1"
            >
              {t('auth.dateOfBirth', 'Date of Birth')}
            </label>
            <Input
              id="dateOfBirth"
              type="date"
              value={
                profileData.dateOfBirth
                  ? new Date(profileData.dateOfBirth).toString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  dateOfBirth: e.target.value || undefined,
                }))
              }
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="experienceLevel"
              className="block text-sm font-medium text-textSecondary mb-1"
            >
              {t('auth.experienceLevel', 'Experience Level')}
            </label>
            <select
              id="experienceLevel"
              value={profileData.experienceLevel}
              onChange={(e) =>
                setProfileData((prev) => ({ ...prev, experienceLevel: e.target.value }))
              }
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              <option value="BEGINNER">{t('auth.experienceLevel.beginner', 'Beginner')}</option>
              <option value="INTERMEDIATE">
                {t('auth.experienceLevel.intermediate', 'Intermediate')}
              </option>
              <option value="ADVANCED">{t('auth.experienceLevel.advanced', 'Advanced')}</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="shadow"
              onPress={() => setStep('verification')}
              disabled={isLoading}
              className="flex-1"
            >
              {t('common.back', 'Back')}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading
                ? t('common.loading', 'Loading...')
                : t('auth.register.complete', 'Complete Registration')}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
