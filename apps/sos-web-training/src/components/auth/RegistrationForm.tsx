'use client';

import React, { useState } from 'react';
import { Button, Input, Card, CardBody, addToast, SelectItem } from '@heroui/react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { AuthMethod } from './AuthMethodSelector';
import { PhoneVerificationForm } from './PhoneVerificationForm';
import { SelectWithClassName } from '../forms/selectWithClassName';

interface RegistrationFormProps {
  authMethod: AuthMethod;
  onSubmit: (data: RegistrationData) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export interface RegistrationData {
  email?: string;
  phoneNumber?: string;
  password?: string;
  authMethod: AuthMethod;
  firstName: string;
  lastName: string;
  role: string;
  verificationToken?: string;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
}

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
    />
  </svg>
);

export const RegistrationForm = ({
  authMethod,
  onSubmit,
  onBack,
  isLoading = false,
  error,
}: RegistrationFormProps) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<RegistrationData | null>(
    null,
  );

  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'ATHLETE',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) return false;
    const hasNumber = /\d/.test(password);
    return hasNumber;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = t('validation.required', 'This field is required');
    }

    if (!formData.lastName.trim()) {
      errors.lastName = t('validation.required', 'This field is required');
    }

    if (authMethod === 'EMAIL') {
      if (!formData.email.trim()) {
        errors.email = t('validation.required', 'This field is required');
      } else if (!validateEmail(formData.email)) {
        errors.email = t('validation.email.invalid', 'Please enter a valid email address');
      }

      if (!formData.password) {
        errors.password = t('validation.required', 'This field is required');
      } else if (!validatePassword(formData.password)) {
        errors.password = t(
          'validation.password.requirements',
          'Password must be at least 8 characters with letters, numbers, and special characters',
        );
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t('validation.password.mismatch', 'Passwords do not match');
      }
    } else if (authMethod === 'WHATSAPP' || authMethod === 'LINE') {
      if (!formData.phoneNumber.trim()) {
        errors.phoneNumber = t('validation.required', 'This field is required');
      } else if (!validatePhoneNumber(formData.phoneNumber)) {
        errors.phoneNumber = t('validation.phone.invalid', 'Please enter a valid phone number');
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        title: 'Validation Error',
        description: `Please fill in ${Object.values(validationErrors).join(', ')}`,
        color: 'danger',
      });
      return;
    }

    const registrationData: RegistrationData = {
      authMethod,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
    };

    if (authMethod === 'EMAIL') {
      registrationData.email = formData.email;
      registrationData.password = formData.password;
      // For email registration, submit directly
      await onSubmit(registrationData);
    } else if (authMethod === 'WHATSAPP' || authMethod === 'LINE') {
      registrationData.phoneNumber = formData.phoneNumber;
      // For phone-based registration, show verification form first
      setPendingRegistrationData(registrationData);
      setShowPhoneVerification(true);
      // Here you would typically send the verification code
      // For now, we'll simulate it
    }
  };

  const handlePhoneVerification = async (verificationToken: string) => {
    if (pendingRegistrationData) {
      const finalData = {
        ...pendingRegistrationData,
        verificationToken,
      };
      await onSubmit(finalData);
    }
  };

  const handleResendCode = async () => {
    try {
      const method = authMethod === 'WHATSAPP' ? 'WHATSAPP' : 'LINE';
      // TODO: Implement requestPhoneVerification from auth context
      console.log('Resending verification code to:', formData.phoneNumber, 'via', method);
    } catch (error) {
      console.error('Failed to resend verification code:', error);
    }
  };

  const handleCancelVerification = () => {
    setShowPhoneVerification(false);
    setPendingRegistrationData(null);
  };

  if (showPhoneVerification && pendingRegistrationData) {
    return (
      <PhoneVerificationForm
        phoneNumber={formData.phoneNumber}
        onVerificationComplete={handlePhoneVerification}
        onResendCode={handleResendCode}
        onCancel={handleCancelVerification}
        isLoading={isLoading}
        error={error || undefined}
      />
    );
  }

  const getMethodTitle = () => {
    switch (authMethod) {
      case 'EMAIL':
        return t('auth.register.email.title', 'Create Account with Email');
      case 'WHATSAPP':
        return t('auth.register.whatsapp.title', 'Create Account with WhatsApp');
      case 'LINE':
        return t('auth.register.line.title', 'Create Account with LINE');
      default:
        return t('auth.register.title', 'Create Account');
    }
  };

  return (
    <Card className="rounded-lg bg-backgroundSecondary border-2 border-white">
      <CardBody>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-text">{getMethodTitle()}</h2>
          <p className="text-text">
            {t('auth.register.description', 'Fill in your details to get started')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error/5 border border-error text-error px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              label={t('auth.register.firstName', 'First Name')}
              placeholder={t('auth.register.firstNamePlaceholder', 'Enter your first name')}
              value={formData.firstName}
              onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
              required
              disabled={isLoading}
              variant="bordered"
              errorMessage={validationErrors.firstName}
              classNames={{
                inputWrapper: 'bg-white text-black',
              }}
            />

            <Input
              type="text"
              label={t('auth.register.lastName', 'Last Name')}
              placeholder={t('auth.register.lastNamePlaceholder', 'Enter your last name')}
              value={formData.lastName}
              onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              required
              disabled={isLoading}
              variant="bordered"
              errorMessage={validationErrors.lastName}
              classNames={{
                inputWrapper: 'bg-white text-black',
              }}
            />
          </div>

          {authMethod === 'EMAIL' && (
            <>
              <Input
                type="email"
                label={t('auth.register.email', 'Email Address')}
                placeholder={t('auth.register.emailPlaceholder', 'Enter your email address')}
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
                disabled={isLoading}
                variant="bordered"
                errorMessage={validationErrors.email}
                classNames={{
                  inputWrapper: 'bg-white text-black',
                }}
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label={t('auth.register.password', 'Password')}
                placeholder={t('auth.register.passwordPlaceholder', 'Create a strong password')}
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
                variant="bordered"
                errorMessage={validationErrors.password}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text hover:text-textHover"
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                }
                classNames={{
                  inputWrapper: 'bg-white text-black',
                }}
              />

              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label={t('auth.register.confirmPassword', 'Confirm Password')}
                placeholder={t('auth.register.confirmPasswordPlaceholder', 'Confirm your password')}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                required
                disabled={isLoading}
                variant="bordered"
                errorMessage={validationErrors.confirmPassword}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-text hover:text-textHover"
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                }
                classNames={{
                  inputWrapper: 'bg-white text-black',
                }}
              />
            </>
          )}

          {(authMethod === 'WHATSAPP' || authMethod === 'LINE') && (
            <Input
              type="tel"
              label={t('auth.register.phoneNumber', 'Phone Number')}
              placeholder={t('auth.register.phoneNumberPlaceholder', 'Enter your phone number')}
              value={formData.phoneNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              required
              disabled={isLoading}
              variant="bordered"
              errorMessage={validationErrors.phoneNumber}
              classNames={{
                inputWrapper: 'bg-white text-black',
              }}
            />
          )}

          {/* <SelectWithClassName
            label={t('auth.register.role', 'Role')}
            placeholder={t('auth.register.rolePlaceholder', 'Select your role')}
            value={formData.role}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            required
            disabled={isLoading}
            variant="bordered"
            errorMessage={validationErrors.role}
            children={
              <>
                <SelectItem key="ATHLETE">Athlete</SelectItem>
                <SelectItem key="COACH">Coach</SelectItem>
              </>
            }
          /> */}

          <div className="flex space-x-3">
            <Button
              type="button"
              onPress={onBack}
              isDisabled={isLoading}
              variant="solid"
              color="secondary"
            >
              {t('common.back', 'Back')}
            </Button>

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
              variant="solid"
              color="primary"
              className="flex-1"
            >
              {isLoading
                ? t('auth.register.creating', 'Creating Account...')
                : t('auth.register.create', 'Create Account')}
            </Button>
          </div>

          <div className="text-center text-sm text-text">
            <p>
              {t(
                'auth.register.terms',
                'By creating an account, you agree to our Terms of Service and Privacy Policy',
              )}
            </p>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
