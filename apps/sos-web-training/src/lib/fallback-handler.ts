import { validateLocale, getSupportedLocales } from '@strengthos/shared-i18n';

/**
 * Handle fallback logic for unsupported locales
 */
export class FallbackHandler {
  private static readonly DEFAULT_LOCALE = 'en-US';
  private static readonly FALLBACK_LOCALE = 'en-US';

  /**
   * Get the appropriate fallback locale for a given locale
   */
  static getFallbackLocale(locale: string): string {
    const supportedLocales = getSupportedLocales();

    // If the locale is already supported, return it
    if (validateLocale(locale)) {
      return locale;
    }

    // Try to find a locale with the same language code
    const languageCode = locale.split('-')[0];
    const sameLanguageLocale = supportedLocales.find((supported) =>
      supported.startsWith(languageCode + '-'),
    );

    if (sameLanguageLocale) {
      return sameLanguageLocale;
    }

    // Return default fallback
    return this.FALLBACK_LOCALE;
  }

  /**
   * Validate and normalize a locale, returning fallback if invalid
   */
  static normalizeLocale(locale: string): string {
    if (!locale) {
      return this.DEFAULT_LOCALE;
    }

    // Normalize format (e.g., 'en_US' -> 'en-US')
    const normalized = locale.replace('_', '-');

    return this.getFallbackLocale(normalized);
  }

  /**
   * Get supported locales with their display names
   */
  static getSupportedLocalesWithNames(): Array<{ code: string; name: string }> {
    const appSupportedLocales = ['en', 'th'];

    // This would ideally come from the shared-i18n library's locale configs
    const localeNames: Record<string, { name: string }> = {
      en: { name: 'English' },
      th: { name: 'Thai' },
    };

    return appSupportedLocales.map((code) => ({
      code,
      name: localeNames[code].name,
    }));
  }

  /**
   * Check if a locale requires right-to-left text direction
   */
  static isRTL(locale: string): boolean {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    const languageCode = locale.split('-')[0];
    return rtlLocales.includes(languageCode);
  }

  /**
   * Get text direction for a locale
   */
  static getTextDirection(locale: string): 'ltr' | 'rtl' {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }
}
