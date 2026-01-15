'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardBody } from '@heroui/react';
import { useTranslation } from '@/hooks/api/useTranslation';

interface PhoneVerificationFormProps {
  phoneNumber: string;
  onVerificationComplete: (token: string) => void;
  onResendCode: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export const PhoneVerificationForm: React.FC<PhoneVerificationFormProps> = ({
  phoneNumber,
  onVerificationComplete,
  onResendCode,
  onCancel,
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      onVerificationComplete(verificationCode);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendCode();
      setTimeLeft(60);
      setCanResend(false);
      setVerificationCode('');
    } catch (err) {
      // Error handling is done by parent component
    } finally {
      setIsResending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple phone number formatting for display
    if (phone.length > 6) {
      return `${phone.slice(0, -4).replace(/./g, '*')}${phone.slice(-4)}`;
    }
    return phone;
  };

  return (
    <Card>
      <CardBody>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {t('auth.phoneVerification.title', 'Verify Your Phone Number')}
          </h2>
          <p className="text-Secondary">
            {t('auth.phoneVerification.description', 'We sent a 6-digit code to')}
          </p>
          <p className="font-medium text-lg mt-1">{formatPhoneNumber(phoneNumber)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error/5 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            type="text"
            label={t('auth.phoneVerification.codeLabel', 'Verification Code')}
            placeholder={t('auth.phoneVerification.codePlaceholder', 'Enter 6-digit code')}
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setVerificationCode(value);
            }}
            maxLength={6}
            required
            disabled={isLoading}
            variant="bordered"
            className="text-center text-2xl tracking-widest"
          />

          <div className="flex space-x-3">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading || verificationCode.length !== 6}
              variant="bordered"
              size="lg"
              className="flex-1"
            >
              {isLoading
                ? t('auth.phoneVerification.verifying', 'Verifying...')
                : t('auth.phoneVerification.verify', 'Verify')}
            </Button>

            <Button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              variant="bordered"
              size="lg"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-Secondary mb-2">
              {t('auth.phoneVerification.noCode', "Didn't receive the code?")}
            </p>

            {canResend ? (
              <Button
                type="button"
                onPress={handleResend}
                isLoading={isResending}
                disabled={isResending}
                variant="ghost"
                size="sm"
              >
                {isResending
                  ? t('auth.phoneVerification.resending', 'Resending...')
                  : t('auth.phoneVerification.resend', 'Resend Code')}
              </Button>
            ) : (
              <p className="text-sm text-gray-500">
                {t('auth.phoneVerification.resendIn', 'Resend in {{seconds}} seconds').replace(
                  '{{seconds}}',
                  timeLeft.toString(),
                )}
              </p>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
