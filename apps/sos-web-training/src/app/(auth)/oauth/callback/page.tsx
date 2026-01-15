'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cookieManager } from '@/contexts/auth-context';
import { addToast } from '@heroui/react';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthState } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      addToast({
        title: 'OAuth Authentication Failed',
        description: message || 'An error occurred during authentication',
        color: 'danger',
      });
      router.push('/login');
      return;
    }

    if (accessToken && refreshToken && userParam) {
      let user: any;
      try {
        user = JSON.parse(userParam);
      } catch (err) {
        console.error('Error parsing OAuth callback:', err);
        addToast({
          title: 'Authentication Error',
          description: 'Failed to process authentication response',
          color: 'danger',
        });
        router.push('/login');
        return;
      }

      try {
        // Ensure robust cookie writing with correct serialization
        cookieManager.setCookie('auth_access_token', accessToken, 7);
        cookieManager.setCookie('auth_refresh_token', refreshToken, 30);
        cookieManager.setCookie('auth_user', JSON.stringify(user), 7); // Always store as stringified object

        // Update auth state (this also sets cookies, but that's fine for redundancy)
        setAuthState({
          user,
          accessToken,
          refreshToken,
          tenantId: user.tenantId,
        });

        // Verify cookies are set before redirecting
        const verifyCookies = () => {
          const hasAccessToken = cookieManager.getCookie('auth_access_token');
          const hasRefreshToken = cookieManager.getCookie('auth_refresh_token');
          const hasUser = cookieManager.getCookie('auth_user');
          return hasAccessToken && hasRefreshToken && hasUser;
        };

        // Wait a brief moment to ensure cookies are committed, then redirect
        setTimeout(() => {
          if (verifyCookies()) {
            addToast({
              title: 'Login Successful',
              description: 'You have been logged in successfully',
              color: 'primary',
            });

            // Use window.location.href for full page reload to ensure middleware can read cookies
            // Use a user?.role check in case "role" is missing or user is malformed
            if (
              user?.role === 'SUPER_ADMIN' ||
              user?.role === 'COACH_ADMIN' ||
              user?.role === 'TENANT_ADMIN'
            ) {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          } else {
            console.error('Cookies not set properly, redirecting to login');
            addToast({
              title: 'Authentication Error',
              description: 'Failed to set authentication cookies',
              color: 'danger',
            });
            router.push('/login');
          }
        }, 100);
      } catch (err) {
        console.error('Error handling OAuth callback:', err);
        addToast({
          title: 'Authentication Error',
          description: 'Failed to process authentication response',
          color: 'danger',
        });
        router.push('/login');
      }
    } else {
      addToast({
        title: 'Authentication Error',
        description: 'Missing authentication data',
        color: 'danger',
      });
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  }, [searchParams, router, setAuthState]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
