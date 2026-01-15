'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalFooter,
  ModalBody,
  ModalContent,
  ModalHeader,
  addToast,
} from '@heroui/react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { AuthMethod } from './AuthMethodSelector';
import { PhoneVerificationForm } from './PhoneVerificationForm';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSendResetPasswordEmailApi } from '@/hooks/api/use-auth-api';
interface EnhancedLoginFormProps {
  authMethod: AuthMethod;
  onSubmit: (data: LoginData) => Promise<void>;
  onBack: () => void;
  onForgotPassword?: (identifier: string) => void;
  isLoading?: boolean;
  error?: string;
}

export interface LoginData {
  identifier: string; // Can be email or phone number
  password?: string; // Optional for phone-based auth
  authMethod: AuthMethod;
  verificationToken?: string;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
}

export const GoogleIcon = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
};

export const EnhancedLoginForm: React.FC<EnhancedLoginFormProps> = ({
  authMethod,
  onSubmit,
  onBack,
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<LoginData | null>(null);
  const [isForgetPassword, setIsForgetPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const sendEmailResetPasswordMutation = useSendResetPasswordEmailApi();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateIdentifier = (identifier: string) => {
    if (authMethod === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(identifier);
    } else if (authMethod === 'WHATSAPP' || authMethod === 'LINE') {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(identifier);
    }
    return true;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.identifier.trim()) {
      errors.identifier = t('validation.required', 'This field is required');
    } else if (!validateIdentifier(formData.identifier)) {
      if (authMethod === 'EMAIL') {
        errors.identifier = t('validation.email.invalid', 'Please enter a valid email address');
      } else {
        errors.identifier = t('validation.phone.invalid', 'Please enter a valid phone number');
      }
    }

    if (authMethod === 'EMAIL' && !formData.password) {
      errors.password = t('validation.required', 'This field is required');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const loginData: LoginData = {
      identifier: formData.identifier,
      authMethod,
    };

    if (authMethod === 'EMAIL') {
      loginData.password = formData.password;
      // For email login, submit directly
      await onSubmit(loginData);
    } else if (authMethod === 'WHATSAPP' || authMethod === 'LINE') {
      // For phone-based login, first request verification code
      setPendingLoginData(loginData);

      try {
        // Request phone verification using the new auth service
        const authService = (await import('@/hooks/api/use-auth')).default;
        const result = await authService.requestPhoneVerification({
          phoneNumber: formData.identifier,
          method: authMethod === 'WHATSAPP' ? 'WHATSAPP' : 'SMS', // LINE uses SMS for now
        });

        if (result.success) {
          setShowPhoneVerification(true);
        } else {
          setValidationErrors({ identifier: result.message || 'Failed to send verification code' });
        }
      } catch (error) {
        setValidationErrors({ identifier: 'Failed to send verification code' });
      }
    } else if (authMethod === 'OAUTH') {
      await onSubmit(loginData);
    }
  };

  const handlePhoneVerification = async (verificationToken: string) => {
    if (pendingLoginData) {
      try {
        // First confirm the verification code
        const authService = (await import('@/hooks/api/use-auth')).default;
        const confirmResult = await authService.confirmPhoneVerification({
          phoneNumber: pendingLoginData.identifier,
          token: verificationToken,
        });

        if (confirmResult.success && confirmResult.data) {
          // If verification successful, proceed with login
          const finalData = {
            ...pendingLoginData,
            verificationToken,
          };
          await onSubmit(finalData);
        } else {
          setValidationErrors({ verificationCode: 'Invalid verification code' });
        }
      } catch (error) {
        setValidationErrors({ verificationCode: 'Verification failed' });
      }
    }
  };

  const handleResendCode = async () => {
    try {
      const authService = (await import('@/hooks/api/use-auth')).default;
      const result = await authService.requestPhoneVerification({
        phoneNumber: formData.identifier,
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

  const handleCancelVerification = () => {
    setShowPhoneVerification(false);
    setPendingLoginData(null);
  };

  const handleForgotPassword = () => {
    if (forgotPasswordEmail) {
      sendEmailResetPasswordMutation.mutate(
        { email: forgotPasswordEmail },
        {
          onSuccess: (data: { success: boolean; message: string }) => {
            if (data.success) {
              addToast({
                title: 'Password reset instructions sent to your email',
                description: data.message,
                color: 'primary',
              });
              setIsForgetPassword(false);
              setForgotPasswordEmail('');
            } else {
              addToast({
                title: 'Failed to send password reset instructions',
                description: data.message,
                color: 'danger',
              });
            }
          },
          onError: (error: any) => {
            addToast({
              title: 'Failed to send password reset instructions',
              description: error?.message ?? 'Unknown error',
              color: 'danger',
            });
          },
        },
      );
    }
  };

  if (showPhoneVerification && pendingLoginData) {
    return (
      <PhoneVerificationForm
        phoneNumber={formData.identifier}
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
        return t('auth.login.email.title', 'Sign In with Email');
      case 'WHATSAPP':
        return t('auth.login.whatsapp.title', 'Sign In with WhatsApp');
      case 'LINE':
        return t('auth.login.line.title', 'Sign In with LINE');
      case 'OAUTH':
        return t('auth.login.oauth.title', 'Sign In with Google');
      default:
        return t('auth.login.title', 'Sign In');
    }
  };

  const getIdentifierLabel = () => {
    switch (authMethod) {
      case 'EMAIL':
        return t('auth.login.email.label', 'Email Address');
      case 'WHATSAPP':
        return t('auth.login.whatsapp.label', 'WhatsApp Number');
      case 'LINE':
        return t('auth.login.line.label', 'LINE Phone Number');
      case 'OAUTH':
        return t('auth.login.oauth.label', 'Google Account');
      default:
        return t('auth.login.identifier', 'Email or Phone');
    }
  };

  const getIdentifierPlaceholder = () => {
    switch (authMethod) {
      case 'EMAIL':
        return t('auth.login.email.placeholder', 'Enter your email address');
      case 'WHATSAPP':
        return t('auth.login.whatsapp.placeholder', 'Enter your WhatsApp number');
      case 'LINE':
        return t('auth.login.line.placeholder', 'Enter your LINE phone number');
      case 'OAUTH':
        return t('auth.login.oauth.placeholder', 'Enter your Google account');
      default:
        return t('auth.login.identifierPlaceholder', 'Enter email or phone number');
    }
  };

  return (
    <>
      <Card className="rounded-lg bg-backgroundSecondary border">
        <CardBody>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2 text-text">{getMethodTitle()}</h2>
            <p className="text-text">
              {t('auth.login.description', 'Enter your credentials to access your account')}
            </p>
          </div>

          {authMethod === 'OAUTH' ? (
            <div className="space-y-4">
              {error && (
                <div className="border border-error text-error px-4 py-3 rounded-lg text-center">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border border-error text-error px-4 py-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <Input
                type={authMethod === 'EMAIL' ? 'email' : 'tel'}
                label={getIdentifierLabel()}
                value={formData.identifier}
                variant="bordered"
                onChange={(e) => setFormData((prev) => ({ ...prev, identifier: e.target.value }))}
                required
                disabled={isLoading}
                classNames={{
                  inputWrapper: 'bg-white text-black',
                }}
              />

              {authMethod === 'EMAIL' && (
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.login.password', 'Password')}
                  placeholder={t('auth.login.passwordPlaceholder', 'Enter your password')}
                  value={formData.password}
                  variant="bordered"
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  endContent={
                    <button
                      type="button"
                      className="m-auto"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5" />
                      ) : (
                        <FaEye className="h-5 w-5" />
                      )}
                    </button>
                  }
                  disabled={isLoading}
                  autoComplete="off"
                  classNames={{
                    inputWrapper: 'bg-white text-black',
                  }}
                />
              )}

              {authMethod === 'EMAIL' && (
                <div className="text-end">
                  <Button
                    size="sm"
                    onPress={() => setIsForgetPassword(true)}
                    disabled={isLoading || !formData.identifier}
                    className="bg-transparent text-text hover:text-textHover hover:underline"
                  >
                    {t('auth.login.forgotPassword', 'Forgot Password?')}
                  </Button>
                </div>
              )}

              <div className="flex space-x-3">
                <Button onPress={onBack} disabled={isLoading} variant="solid" color="secondary">
                  {t('common.back', 'Back')}
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="solid"
                  className="flex-1"
                  color="primary"
                >
                  {isLoading
                    ? t('auth.login.signingIn', 'Signing In...')
                    : t('auth.login.signIn', 'Sign In')}
                </Button>
              </div>

              {(authMethod === 'WHATSAPP' || authMethod === 'LINE') && (
                <div className="text-center text-sm text-textMuted">
                  <p>
                    {authMethod === 'WHATSAPP'
                      ? t(
                          'auth.login.whatsapp.info',
                          'We will send a verification code to your WhatsApp',
                        )
                      : t(
                          'auth.login.line.info',
                          'We will send a verification code to your LINE account',
                        )}
                  </p>
                </div>
              )}
            </form>
          )}

          {authMethod === 'OAUTH' && (
            <div className="space-y-4">
              <Button
                onPress={() => onSubmit({ identifier: '', authMethod: 'OAUTH' })}
                disabled={isLoading}
                variant="solid"
                className="w-full"
                color="primary"
                startContent={
                  <GoogleIcon className="w-5 h-5" />
                }
              >
                {isLoading
                  ? t('auth.login.signingIn', 'Signing In...')
                  : t('auth.login.oauth.google', 'Sign in with Google')}
              </Button>

              <div className="flex justify-center">
                <Button onPress={onBack} disabled={isLoading} variant="solid" color="secondary">
                  {t('common.back', 'Back')}
                </Button>
              </div>
            </div>
          )}

          {/* Forgot Password Modal */}
          {authMethod === 'EMAIL' && (
            <Modal
              isOpen={isForgetPassword}
              onOpenChange={() => {
                setIsForgetPassword(false);
                setForgotPasswordEmail('');
              }}
              title={t('auth.login.forgotPassword.title', 'Forgot Password')}
            >
              <ModalContent>
                <ModalHeader>{t('auth.login.forgotPassword.title', 'Forgot Password')}</ModalHeader>
                <ModalBody>
                  <Input
                    type="email"
                    label={t('auth.login.forgotPassword.email', 'Email Address')}
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    onPress={handleForgotPassword}
                    disabled={isLoading || !forgotPasswordEmail}
                    isLoading={sendEmailResetPasswordMutation.isPending}
                  >
                    {t('auth.login.forgotPassword.submit', 'Submit')}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </CardBody>
      </Card>
    </>
  );
};
