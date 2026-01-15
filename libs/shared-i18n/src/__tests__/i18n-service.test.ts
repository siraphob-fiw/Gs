import { describe, it, expect, beforeEach } from 'vitest';
import { I18nService } from '../i18n-service';

describe('I18nService', () => {
  let i18nService: I18nService;

  beforeEach(async () => {
    i18nService = new I18nService({
      defaultLocale: 'en-US',
      fallbackLocale: 'en-US',
      supportedLocales: ['en-US', 'th-TH', 'zh-CN'],
      cacheEnabled: false, // Disable cache for testing
    });

    await i18nService.initialize();
  });

  describe('translate', () => {
    it('should translate basic keys', () => {
      const result = i18nService.translate('common.loading', { locale: 'en-US' });
      expect(result).toBe('Loading...');
    });

    it('should use fallback locale when translation not found', () => {
      const result = i18nService.translate('nonexistent.key', { 
        locale: 'th-TH',
        defaultValue: 'Default Value'
      });
      expect(result).toBe('Default Value');
    });

    it('should handle interpolation', () => {
      const result = i18nService.translate('user.welcome', {
        locale: 'en-US',
        interpolation: { name: 'John' }
      });
      expect(result).toBe('Welcome, John!');
    });

    it('should handle pluralization', () => {
      const singular = i18nService.translate('workout.count', {
        locale: 'en-US',
        count: 1,
        interpolation: { count: 1 }
      });
      expect(singular).toBe('1 workout');

      const plural = i18nService.translate('workout.count', {
        locale: 'en-US',
        count: 5,
        interpolation: { count: 5 }
      });
      expect(plural).toBe('5 workouts');
    });

    it('should handle namespaced keys', () => {
      const result = i18nService.translate('loading', {
        locale: 'en-US',
        namespace: 'common'
      });
      expect(result).toBe('Loading...');
    });

    it('should work with Thai locale', () => {
      const result = i18nService.translate('common.loading', { locale: 'th-TH' });
      expect(result).toBe('กำลังโหลด...');
    });
  });

  describe('detectLocale', () => {
    it('should detect locale from Accept-Language header', () => {
      const locale = i18nService.detectLocale({
        acceptLanguageHeader: 'th-TH,th;q=0.9,en;q=0.8',
        defaultLocale: 'en-US',
        supportedLocales: ['en-US', 'th-TH'],
      });
      expect(locale).toBe('th-TH');
    });

    it('should fallback to default when no supported locale found', () => {
      const locale = i18nService.detectLocale({
        acceptLanguageHeader: 'fr-FR,fr;q=0.9',
        defaultLocale: 'en-US',
        supportedLocales: ['en-US', 'th-TH'],
      });
      expect(locale).toBe('en-US');
    });

    it('should prioritize user preference over header', () => {
      const locale = i18nService.detectLocale({
        acceptLanguageHeader: 'en-US,en;q=0.9',
        userPreference: 'th-TH',
        defaultLocale: 'en-US',
        supportedLocales: ['en-US', 'th-TH'],
      });
      expect(locale).toBe('th-TH');
    });
  });

  describe('addTranslations', () => {
    it('should add new translations', () => {
      i18nService.addTranslations('en-US', {
        'test.key': {
          locale: 'en-US',
          key: 'test.key',
          value: 'Test Value',
          lastUpdated: new Date(),
          version: 1,
        },
      });

      const result = i18nService.translate('test.key', { locale: 'en-US' });
      expect(result).toBe('Test Value');
    });

    it('should update existing translations', () => {
      // Add initial translation
      i18nService.addTranslations('en-US', {
        'test.update': {
          locale: 'en-US',
          key: 'test.update',
          value: 'Original Value',
          lastUpdated: new Date(),
          version: 1,
        },
      });

      // Update translation
      i18nService.addTranslations('en-US', {
        'test.update': {
          locale: 'en-US',
          key: 'test.update',
          value: 'Updated Value',
          lastUpdated: new Date(),
          version: 2,
        },
      });

      const result = i18nService.translate('test.update', { locale: 'en-US' });
      expect(result).toBe('Updated Value');
    });
  });

  describe('isLocaleSupported', () => {
    it('should return true for supported locales', () => {
      expect(i18nService.isLocaleSupported('en-US')).toBe(true);
      expect(i18nService.isLocaleSupported('th-TH')).toBe(true);
    });

    it('should return false for unsupported locales', () => {
      expect(i18nService.isLocaleSupported('fr-FR')).toBe(false);
      expect(i18nService.isLocaleSupported('invalid')).toBe(false);
    });
  });

  describe('getAvailableLocales', () => {
    it('should return list of available locales', () => {
      const locales = i18nService.getAvailableLocales();
      expect(locales).toContain('en-US');
      expect(locales).toContain('th-TH');
    });
  });

  describe('clearCache', () => {
    it('should clear translation cache', () => {
      // Enable cache for this test
      const cachedService = new I18nService({
        defaultLocale: 'en-US',
        cacheEnabled: true,
      });

      // This should work without throwing
      cachedService.clearCache();
    });
  });
});