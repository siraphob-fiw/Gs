'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyEmailApi } from '@/hooks/api/use-auth-api';
import { Button } from '@heroui/react';
import { CiCircleCheck } from 'react-icons/ci';
import { RxCrossCircled } from 'react-icons/rx';
import { useTranslation } from '@/hooks/api/useTranslation';

function VerifyEmailPageContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();
  const mutationVerifyEmail = useVerifyEmailApi();
  const { t } = useTranslation();
  // get slug from the url
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  // Track if verification has been attempted to prevent infinite loops
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    // Prevent running multiple times for the same token
    if (hasAttemptedRef.current) return;

    if (!token) {
      setStatus('error');
      setMessage(t('auth.verifyEmail.invalidToken') || 'Invalid or missing token.');
      return;
    }

    hasAttemptedRef.current = true;
    setStatus('verifying');
    setMessage('');

    let isMounted = true;

    mutationVerifyEmail
      .mutateAsync({ token })
      .then((res) => {
        if (!isMounted) return;
        if (!res.status) {
          setStatus('error');
          setMessage(res.message || t('auth.verifyEmail.error'));
        } else {
          setStatus('success');
          setMessage(t('auth.verifyEmail.success'));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
        setMessage(t('auth.verifyEmail.unexpectedError'));
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-text">
      <h1 className="text-2xl font-semibold">
        {t('auth.verifyEmail.title') || 'Email Verification'}
      </h1>
      <div className="mt-6">
        {status === 'verifying' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="font-medium">
              {t('auth.verifyEmail.verifying') || 'Verifying your email...'}
            </div>
            <div className="flex-col gap-4 w-full flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-transparent text-primary text-4xl animate-spin flex items-center justify-center border-t-primary rounded-full">
                <div className="w-16 h-16 border-4 border-transparent text-primary text-2xl animate-spin flex items-center justify-center border-t-primary rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <CiCircleCheck className="text-success text-6xl" />
            <div className="text-success text-2xl font-medium">{message}</div>
            <Button variant="solid" color="primary" onPress={() => router.push('/login')}>
              {t('auth.login')}
            </Button>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <RxCrossCircled className="text-error text-6xl" />
            <div className="text-error text-2xl font-medium">{message}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-text">
        <h1 className="text-2xl font-semibold">Email Verification</h1>
        <div className="mt-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="font-medium">Loading...</div>
            <div className="flex-col gap-4 w-full flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-transparent text-primary text-4xl animate-spin flex items-center justify-center border-t-primary rounded-full">
                <div className="w-16 h-16 border-4 border-transparent text-primary text-2xl animate-spin flex items-center justify-center border-t-primary rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
