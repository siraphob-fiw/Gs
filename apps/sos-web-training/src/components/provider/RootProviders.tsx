'use client';

import { ReactNode, useEffect, useState, useMemo } from 'react';
import { ReduxProvider } from '../../store/providers/ReduxProvider';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '../../contexts/auth-context';
import { I18nProvider } from '../../contexts/I18nContext';
import { createI18nService } from '../../lib/i18n-service';
import { PreferencesProvider } from '../../contexts/PreferencesContext';

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const i18nService = useMemo(() => createI18nService(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ReduxProvider>
      <HeroUIProvider>
        {/* Only render ToastProvider on client to avoid SSR issues */}
        {mounted && (
          <ToastProvider
            placement="top-right"
            regionProps={{
              className: 'z-[9999]',
            }}
            toastProps={{
              radius: 'lg',
              variant: 'solid',
              timeout: 2000,
              hideCloseButton: true,
              hideIcon: true,
              classNames: {
                base: 'max-w-xs w-full shadow-lg rounded-lg text-white text-sm px-4 py-3 top-4 right-4 absolute',
                title: 'font-medium text-base mb-1 text-white',
                description: 'text-sm text-white',
              },
            }}
          />
        )}
        <QueryProvider>
          <I18nProvider i18nService={i18nService}>
            <AuthProvider>
              <PreferencesProvider>{children}</PreferencesProvider>
            </AuthProvider>
          </I18nProvider>
        </QueryProvider>
      </HeroUIProvider>
    </ReduxProvider>
  );
}
