import {
  I18nContext,
  Translation,
  TranslationInterpolation,
  PluralizationContext,
  I18nServiceConfig,
  TranslationLoadOptions,
  LocaleDetectionOptions,
} from './types';
import { getLocaleConfig, DEFAULT_LOCALE, FALLBACK_LOCALE } from './locales';

export class I18nService {
  private translations: Map<string, Map<string, Translation>> = new Map();
  private config: I18nServiceConfig;
  private cache: Map<string, string> = new Map();

  constructor(config: Partial<I18nServiceConfig> = {}) {
    this.config = {
      defaultLocale: DEFAULT_LOCALE,
      fallbackLocale: FALLBACK_LOCALE,
      supportedLocales: ['en-US', 'th-TH', 'zh-CN', 'ja-JP', 'ko-KR'],
      translationPath: './translations',
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      lazyLoading: false,
      interpolationPrefix: '{{',
      interpolationSuffix: '}}',
      ...config,
    };
  }

  /**
   * Initialize the i18n service with translations
   */
  async initialize(translations?: Record<string, Record<string, Translation>>): Promise<void> {
    if (translations) {
      this.loadTranslations(translations);
    } else if (!this.config.lazyLoading) {
      await this.loadAllTranslations();
    }
    
    // Setup cache cleanup interval
    if (this.config.cacheEnabled && this.config.cacheTTL > 0) {
      this.setupCacheCleanup();
    }
  }

  /**
   * Load translations into memory
   */
  private loadTranslations(translations: Record<string, Record<string, Translation>>): void {
    for (const [locale, localeTranslations] of Object.entries(translations)) {
      const localeMap = new Map<string, Translation>();
      for (const [key, translation] of Object.entries(localeTranslations)) {
        localeMap.set(key, translation);
      }
      this.translations.set(locale, localeMap);
    }
  }

  /**
   * Load all translations for supported locales
   */
  private async loadAllTranslations(): Promise<void> {
    // In a real implementation, this would load from files or API
    // For now, we'll use default translations
    const defaultTranslations = this.getDefaultTranslations();
    this.loadTranslations(defaultTranslations);
  }

  /**
   * Translate a key with optional interpolation and pluralization
   */
  translate(
    key: string,
    options: {
      locale?: string;
      interpolation?: TranslationInterpolation;
      count?: number;
      defaultValue?: string;
      namespace?: string;
    } = {}
  ): string {
    const {
      locale = this.config.defaultLocale,
      interpolation = {},
      count,
      defaultValue,
      namespace,
    } = options;

    const fullKey = namespace ? `${namespace}.${key}` : key;
    const cacheKey = this.getCacheKey(fullKey, locale, interpolation, count);

    // Check cache first
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let translation = this.getTranslation(fullKey, locale);

    // Fallback to default locale if not found
    if (!translation && locale !== this.config.fallbackLocale) {
      translation = this.getTranslation(fullKey, this.config.fallbackLocale);
    }

    // Use default value if still not found
    if (!translation) {
      translation = {
        locale,
        key: fullKey,
        value: defaultValue || fullKey,
        lastUpdated: new Date(),
        version: 1,
      };
    }

    let result = translation.value;

    // Handle pluralization
    if (count !== undefined && translation.pluralValues) {
      result = this.pluralize(translation, { count, locale });
    }

    // Handle interpolation
    if (Object.keys(interpolation).length > 0) {
      result = this.interpolate(result, interpolation);
    }

    // Cache the result
    if (this.config.cacheEnabled) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Get translation object for a key and locale
   */
  private getTranslation(key: string, locale: string): Translation | undefined {
    const localeTranslations = this.translations.get(locale);
    return localeTranslations?.get(key);
  }

  /**
   * Handle pluralization based on count and locale rules
   */
  private pluralize(translation: Translation, context: PluralizationContext): string {
    if (!translation.pluralValues) {
      return translation.value;
    }

    const { count, locale } = context;
    const pluralRule = this.getPluralRule(count, locale);
    
    return translation.pluralValues[pluralRule] || translation.value;
  }

  /**
   * Get plural rule for a count and locale
   */
  private getPluralRule(count: number, locale: string): string {
    // Simplified plural rules - in production, use Intl.PluralRules
    if (locale.startsWith('zh') || locale.startsWith('ja') || locale.startsWith('ko')) {
      return 'other'; // No plural forms in these languages
    }
    
    if (locale.startsWith('th')) {
      return 'other'; // Thai doesn't have plural forms
    }

    // English and most European languages
    return count === 1 ? 'one' : 'other';
  }

  /**
   * Interpolate variables into translation string
   */
  private interpolate(text: string, variables: TranslationInterpolation): string {
    let result = text;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `${this.config.interpolationPrefix}${key}${this.config.interpolationSuffix}`;
      const replacement = this.formatValue(value);
      result = result.replace(new RegExp(placeholder, 'g'), replacement);
    }

    return result;
  }

  /**
   * Format a value for interpolation
   */
  private formatValue(value: string | number | Date | boolean): string {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    key: string,
    locale: string,
    interpolation: TranslationInterpolation,
    count?: number
  ): string {
    const interpolationKey = Object.keys(interpolation).length > 0 
      ? JSON.stringify(interpolation) 
      : '';
    return `${locale}:${key}:${interpolationKey}:${count || ''}`;
  }

  /**
   * Detect locale from various sources
   */
  detectLocale(options: LocaleDetectionOptions): string {
    const { acceptLanguageHeader, userAgent, ipAddress, defaultLocale, supportedLocales, userPreference } = options;

    // Prioritize user preference if provided and supported
    if (userPreference && supportedLocales.includes(userPreference)) {
      return userPreference;
    }

    // Try to parse Accept-Language header
    if (acceptLanguageHeader) {
      const preferredLocales = this.parseAcceptLanguage(acceptLanguageHeader);
      for (const locale of preferredLocales) {
        if (supportedLocales.includes(locale)) {
          return locale;
        }
      }
    }

    // Fallback to default
    return defaultLocale;
  }

  /**
   * Parse Accept-Language header
   */
  private parseAcceptLanguage(header: string): string[] {
    return header
      .split(',')
      .map(lang => {
        const [locale, quality] = lang.trim().split(';q=');
        return { locale: locale.trim(), quality: quality ? parseFloat(quality) : 1.0 };
      })
      .sort((a, b) => b.quality - a.quality)
      .map(item => item.locale);
  }

  /**
   * Add or update translations
   */
  addTranslations(locale: string, translations: Record<string, Translation>): void {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, new Map());
    }

    const localeMap = this.translations.get(locale)!;
    for (const [key, translation] of Object.entries(translations)) {
      localeMap.set(key, translation);
    }

    // Clear cache for this locale
    if (this.config.cacheEnabled) {
      this.clearCacheForLocale(locale);
    }
  }

  /**
   * Clear cache for a specific locale
   */
  private clearCacheForLocale(locale: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${locale}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): string[] {
    return Array.from(this.translations.keys());
  }

  /**
   * Check if locale is supported
   */
  isLocaleSupported(locale: string): boolean {
    return this.config.supportedLocales.includes(locale);
  }

  /**
   * Setup cache cleanup interval
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.config.cacheTTL);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    // In a more sophisticated implementation, we would track cache timestamps
    // and remove expired entries. For now, we'll clear the entire cache periodically.
    if (this.cache.size > 1000) { // Arbitrary threshold
      this.cache.clear();
    }
  }

  /**
   * Load translations dynamically for a specific locale
   */
  async loadLocaleTranslations(locale: string, namespace?: string): Promise<void> {
    try {
      // In a real implementation, this would fetch from an API or load from files
      const translations = await this.fetchTranslationsFromAPI(locale, namespace);
      
      if (translations) {
        this.addTranslations(locale, translations);
      }
    } catch (error) {
      console.warn(`Failed to load translations for locale ${locale}:`, error);
    }
  }

  /**
   * Fetch translations from API (placeholder implementation)
   */
  private async fetchTranslationsFromAPI(
    locale: string, 
    namespace?: string
  ): Promise<Record<string, Translation> | null> {
    // Placeholder implementation - in production this would make actual API calls
    const endpoint = namespace 
      ? `${this.config.translationPath}/${locale}/${namespace}.json`
      : `${this.config.translationPath}/${locale}.json`;
    
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        // Convert API response to Translation objects
        const translations: Record<string, Translation> = {};
        Object.entries(data).forEach(([key, value]) => {
          translations[key] = {
            locale,
            key,
            value: value as string,
            lastUpdated: new Date(),
            version: 1,
          };
        });
        
        return translations;
      }
    } catch (error) {
      console.warn(`Failed to fetch translations from ${endpoint}:`, error);
    }
    
    return null;
  }

  /**
   * Hot-reload translations (for development)
   */
  async hotReloadTranslations(locale: string, namespace?: string): Promise<void> {
    // Clear cache for this locale
    this.clearCacheForLocale(locale);
    
    // Reload translations
    await this.loadLocaleTranslations(locale, namespace);
    
    // Emit hot-reload event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('i18n:hot-reload', {
        detail: { locale, namespace }
      }));
    }
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(): {
    locales: string[];
    totalTranslations: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    const locales = this.getAvailableLocales();
    let totalTranslations = 0;
    
    this.translations.forEach(localeMap => {
      totalTranslations += localeMap.size;
    });
    
    return {
      locales,
      totalTranslations,
      cacheSize: this.cache.size,
      cacheHitRate: 0, // Would need to track hits/misses for accurate calculation
    };
  }

  /**
   * Preload translations for multiple locales
   */
  async preloadTranslations(locales: string[], namespaces?: string[]): Promise<void> {
    const loadPromises: Promise<void>[] = [];
    
    locales.forEach(locale => {
      if (namespaces) {
        namespaces.forEach(namespace => {
          loadPromises.push(this.loadLocaleTranslations(locale, namespace));
        });
      } else {
        loadPromises.push(this.loadLocaleTranslations(locale));
      }
    });
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Get default translations for bootstrapping
   */
  private getDefaultTranslations(): Record<string, Record<string, Translation>> {
    return {
      'en-US': {
        'common.loading': {
          locale: 'en-US',
          key: 'common.loading',
          value: 'Loading...',
          lastUpdated: new Date(),
          version: 1,
        },
        'common.save': {
          locale: 'en-US',
          key: 'common.save',
          value: 'Save',
          lastUpdated: new Date(),
          version: 1,
        },
        'common.cancel': {
          locale: 'en-US',
          key: 'common.cancel',
          value: 'Cancel',
          lastUpdated: new Date(),
          version: 1,
        },
        'user.welcome': {
          locale: 'en-US',
          key: 'user.welcome',
          value: 'Welcome, {{name}}!',
          lastUpdated: new Date(),
          version: 1,
        },
        'workout.count': {
          locale: 'en-US',
          key: 'workout.count',
          value: '{{count}} workout',
          pluralValues: {
            one: '{{count}} workout',
            other: '{{count}} workouts',
          },
          lastUpdated: new Date(),
          version: 1,
        },
      },
      'th-TH': {
        'common.loading': {
          locale: 'th-TH',
          key: 'common.loading',
          value: 'กำลังโหลด...',
          lastUpdated: new Date(),
          version: 1,
        },
        'common.save': {
          locale: 'th-TH',
          key: 'common.save',
          value: 'บันทึก',
          lastUpdated: new Date(),
          version: 1,
        },
        'common.cancel': {
          locale: 'th-TH',
          key: 'common.cancel',
          value: 'ยกเลิก',
          lastUpdated: new Date(),
          version: 1,
        },
        'user.welcome': {
          locale: 'th-TH',
          key: 'user.welcome',
          value: 'ยินดีต้อนรับ {{name}}!',
          lastUpdated: new Date(),
          version: 1,
        },
        'workout.count': {
          locale: 'th-TH',
          key: 'workout.count',
          value: 'การออกกำลังกาย {{count}} ครั้ง',
          lastUpdated: new Date(),
          version: 1,
        },
      },
    };
  }
}
