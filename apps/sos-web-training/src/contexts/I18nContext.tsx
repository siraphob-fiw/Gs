'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  I18nService,
  I18nContext as I18nContextType,
  createI18nContext,
  WeightUnit,
} from '@strengthos/shared-i18n';
import { getBestLocale, storeLocale } from '../lib/locale-detection';
import { FallbackHandler } from '../lib/fallback-handler';
import { initializeTranslationManager } from '../lib/translation-manager';

interface I18nProviderProps {
  children: ReactNode;
  i18nService: I18nService;
  initialLocale?: string;
}

interface I18nContextValue {
  context: I18nContextType;
  translate: (key: string, options?: any) => string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
  error: string | null;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  i18nService,
  initialLocale,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<I18nContextType>(() => {
    const locale = initialLocale || getBestLocale();
    return createI18nContext({
      locale: FallbackHandler.normalizeLocale(locale),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      currency: 'USD',
    });
  });

  // Initialize the i18n service and load translations
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await i18nService.initialize();
        // Load translations into the service
        await initializeTranslationManager(i18nService);
      } catch (err) {
        console.error('Failed to initialize i18n service:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize i18n service');
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, [i18nService]);

  const translate = (key: string, options: any = {}) => {
    try {
      return i18nService.translate(key, {
        locale: context.locale,
        ...options,
      });
    } catch (err) {
      console.warn('Translation failed for key:', key, err);
      return options.defaultValue || key;
    }
  };

  const setLocale = (newLocale: string) => {
    try {
      const normalizedLocale = FallbackHandler.normalizeLocale(newLocale);

      setContext((prev) =>
        createI18nContext({
          locale: normalizedLocale,
          timeZone: prev.timeZone,
          currency: prev.currency,
          weightUnit: prev.weightUnit as WeightUnit,
        }),
      );

      // Store the preference
      storeLocale(normalizedLocale);

      // Update document direction if needed
      if (typeof document !== 'undefined') {
        document.documentElement.dir = FallbackHandler.getTextDirection(normalizedLocale);
        document.documentElement.lang = normalizedLocale.split('-')[0];
      }
    } catch (err) {
      console.error('Failed to set locale:', err);
      setError(err instanceof Error ? err.message : 'Failed to set locale');
    }
  };

  // Set initial document attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = FallbackHandler.getTextDirection(context.locale);
      document.documentElement.lang = context.locale.split('-')[0];
    }
  }, [context.locale]);

  const value: I18nContextValue = {
    context,
    translate,
    setLocale,
    isLoading,
    error,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
