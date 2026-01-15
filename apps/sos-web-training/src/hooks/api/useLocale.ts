import { useI18n } from '../../contexts/I18nContext';
import { detectBrowserLocale, detectUserLocale } from '../../lib/locale-detection';
import { FallbackHandler } from '../../lib/fallback-handler';
import { getSupportedLocales, validateLocale } from '@strengthos/shared-i18n';

/**
 * Hook for locale management and switching
 */
export const useLocale = () => {
  const { context, setLocale: setContextLocale, isLoading, error } = useI18n();

  const changeLocale = (newLocale: string) => {
    // remove trailing whitespace from 'en-US ' in mapping, ensure clean strings
    const localeMap: Record<string, string> = {
      en: 'en-US',
      th: 'th-TH',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-BR',
    };

    const mappedLocale = localeMap[newLocale];

    if (!mappedLocale) {
      console.warn('Invalid locale provided:', newLocale);
      return false;
    }

    try {
      setContextLocale(mappedLocale);

      return true;
    } catch (err) {
      console.error('Failed to change locale:', err);
      return false;
    }
  };

  const detectBrowserPreference = () => {
    return detectBrowserLocale();
  };

  const detectUserPreference = (options: {
    userPreference?: string;
    acceptLanguage?: string;
    tenantDefault?: string;
  }) => {
    return detectUserLocale(options);
  };

  const getSupportedLocalesWithNames = () => {
    return FallbackHandler.getSupportedLocalesWithNames();
  };

  const isRTL = () => {
    return FallbackHandler.isRTL(context.locale);
  };

  const getTextDirection = () => {
    return FallbackHandler.getTextDirection(context.locale);
  };

  const isLocaleSupported = (locale: string) => {
    return validateLocale(locale);
  };

  const getAvailableLocales = () => {
    return getSupportedLocales();
  };

  return {
    // Current locale information
    locale: context.locale,
    context,
    isLoading,
    error,

    // Locale management
    changeLocale,
    isLocaleSupported,

    // Locale detection
    detectBrowserPreference,
    detectUserPreference,

    // Locale information
    getSupportedLocalesWithNames,
    getAvailableLocales,
    isRTL,
    getTextDirection,

    // Convenience properties
    isEnglish: context.locale.startsWith('en'),
    isThai: context.locale.startsWith('th'),
    languageCode: context.locale.split('-')[0],
    regionCode: context.locale.split('-')[1] || null,
  };
};
