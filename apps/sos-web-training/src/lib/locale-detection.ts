import {
  detectLocaleFromRequest,
  validateLocale,
  getSupportedLocales,
} from '@strengthos/shared-i18n';

/**
 * Detect user's preferred locale from various sources
 * Priority: user preference > browser settings > default
 */
export function detectUserLocale(options: {
  userPreference?: string;
  acceptLanguage?: string;
  tenantDefault?: string;
}): string {
  const { userPreference, acceptLanguage, tenantDefault } = options;

  return detectLocaleFromRequest({
    acceptLanguage,
    userPreference,
    tenantDefault,
  });
}

/**
 * Detect locale from browser environment
 */
export function detectBrowserLocale(): string {
  if (typeof window === 'undefined') {
    return 'en-US'; // Server-side fallback
  }

  const browserLanguage = navigator.language || navigator.languages?.[0];
  const supportedLocales = getSupportedLocales();

  // Try exact match first
  if (browserLanguage && supportedLocales.includes(browserLanguage)) {
    return browserLanguage;
  }

  // Try language-only match (e.g., 'en' matches 'en-US')
  if (browserLanguage) {
    const languageCode = browserLanguage.split('-')[0];
    const matchingLocale = supportedLocales.find((locale) => locale.startsWith(languageCode + '-'));
    if (matchingLocale) {
      return matchingLocale;
    }
  }

  return 'en-US'; // Default fallback
}

/**
 * Cookie manager for locale preference
 */
const localeCookieManager = {
  setCookie(name: string, value: string, days = 365): void {
    if (typeof window === 'undefined') return;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax;${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
  },
  getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    const nameEQ = `${name}=`;
    return (
      document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(nameEQ))
        ?.substring(nameEQ.length) || null
    );
  },
  deleteCookie(name: string): void {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },
};

/**
 * Get locale from cookie with validation
 */
export function getStoredLocale(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localeCookieManager.getCookie('preferred-locale');
    if (stored && validateLocale(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read locale from cookie:', error);
  }

  return null;
}

/**
 * Store locale preference in cookie
 */
export function storeLocale(locale: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!validateLocale(locale)) {
    console.warn('Invalid locale provided for storage:', locale);
    return;
  }

  try {
    localeCookieManager.setCookie('preferred-locale', locale, 365);
  } catch (error) {
    console.warn('Failed to store locale in cookie:', error);
  }
}

/**
 * Get the best locale based on all available sources
 */
export function getBestLocale(): string {
  // 1. Check stored preference first
  const stored = getStoredLocale();
  if (stored) {
    return stored;
  }

  // 2. Detect from browser
  return detectBrowserLocale();
}
