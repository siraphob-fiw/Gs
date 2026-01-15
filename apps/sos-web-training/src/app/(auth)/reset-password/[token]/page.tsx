'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResetPasswordApi, useValidateResetPasswordTokenApi } from '@/hooks/api/use-auth-api';
import { Button, Input } from '@heroui/react';
import { CiCircleCheck } from 'react-icons/ci';
import { RxCrossCircled } from 'react-icons/rx';
import { useTranslation } from '@/hooks/api/useTranslation';

function ResetPasswordPageContent() {
  const [status, setStatus] = useState<'verifying' | 'verified' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const mutationValidateResetPasswordToken = useValidateResetPasswordTokenApi();
  const [formData, setFormData] = useState({
    userId: '',
    newPassword: '',
    confirmPassword: '',
  });
  const mutationResetPassword = useResetPasswordApi();
  const { token } = useParams();
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const verifyToken = async () => {
      setStatus('verifying');
      setMessage('');

      if (!token) {
        if (!cancelled) {
          setStatus('error');
          setMessage(t('auth.resetPassword.invalidToken', { defaultValue: 'Invalid or missing token.' }));
        }
        return;
      }

      try {
        const res = await mutationValidateResetPasswordToken.mutateAsync({ token: token as string });
        if (!cancelled) {
          if (res.success === false) {
            setStatus('error');
            setMessage(res.message || t('auth.resetPassword.error', { defaultValue: 'Something went wrong.' }));
            return;
          } else {
            setFormData({ ...formData, userId: res.userId || '' });
            setStatus('verified');
            setMessage(res.message || '');
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e.message || t('auth.resetPassword.error', { defaultValue: 'Something went wrong.' }));
        }
      }
    };

    // Avoid firing repeatedly if mutateAsync reference changes,
    // only listen to token and t.
    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResetPassword = async () => {
    const res = await mutationResetPassword.mutateAsync({ token: token as string, userId: formData.userId, newPassword: formData.newPassword });
    if (!res.success) {
      setStatus('error');
      setMessage(res.message || t('auth.resetPassword.error', { defaultValue: 'Something went wrong.' }));
      return;
    }
    setStatus('success');
    setMessage(t('auth.resetPassword.success', { defaultValue: 'Password reset successfully.' }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-text">
      <h1 className="text-2xl font-semibold">{t('auth.resetPassword.title')}</h1>
      <div className="mt-6">
        {status === 'verifying' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="font-medium">{t('auth.resetPassword.verifying')}</div>
            <div className="flex-col gap-4 w-full flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-transparent text-primary text-4xl animate-spin flex items-center justify-center border-t-primary rounded-full">
                <div className="w-16 h-16 border-4 border-transparent text-primary text-2xl animate-spin flex items-center justify-center border-t-primary rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        {status === 'verified' && (
          <div className="flex flex-col items-center justify-center gap-6">
            {message && (
              <div className="flex items-center gap-2 text-success">
                <CiCircleCheck className="text-3xl" />
                <span className="text-lg font-medium">{message}</span>
              </div>
            )}
            <form
              className="flex flex-col gap-5 p-8 bg-surface rounded-2xl shadow-lg w-full min-w-[320px] max-w-md border border-border/50"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.newPassword || !formData.confirmPassword) {
                  setMessage(t('auth.resetPassword.emptyFields', { defaultValue: 'Please enter password.' }));
                  setStatus('error');
                  return;
                }
                if (formData.newPassword !== formData.confirmPassword) {
                  setMessage(t('auth.resetPassword.confirmMismatch', { defaultValue: 'Passwords do not match.' }));
                  setStatus('error');
                  return;
                }
                await handleResetPassword();
              }}
            >
              <div className="text-center mb-2">
                <p className="text-textSecondary text-sm">
                  {t('auth.resetPassword.instructions', { defaultValue: 'Enter your new password below' })}
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <Input
                  type="password"
                  label={t('auth.resetPassword.newPassword', { defaultValue: 'New Password' })}
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  minLength={8}
                  classNames={{
                    inputWrapper: "bg-background border-border hover:border-primary focus-within:border-primary transition-colors",
                    label: "text-textSecondary font-medium"
                  }}
                />
                <Input
                  type="password"
                  label={t('auth.resetPassword.confirmPassword', { defaultValue: 'Confirm Password' })}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  classNames={{
                    inputWrapper: "bg-background border-border hover:border-primary focus-within:border-primary transition-colors",
                    label: "text-textSecondary font-medium"
                  }}
                />
              </div>
              <Button
                variant="solid"
                color="primary"
                type="submit"
                className="w-full mt-2 font-semibold text-base py-6 shadow-md hover:shadow-lg transition-shadow"
                size="lg"
              >
                {t('auth.resetPassword.resetPassword', { defaultValue: 'Reset Password' })}
              </Button>
            </form>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <CiCircleCheck className="text-success text-6xl" />
            <div className="text-success text-2xl font-medium max-w-md text-center">{message}</div>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <RxCrossCircled className="text-error text-6xl" />
            <div className="text-error text-2xl font-medium max-w-md text-center">{message}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
