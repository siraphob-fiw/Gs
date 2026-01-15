/**
 * Enhanced I18n System Tests
 * Tests for caching improvements, dynamic loading, and hot-swapping
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { I18nService } from '../i18n-service';
import { LocaleFormatter } from '../formatters';
import { WeightUnit } from '../types';

describe('Enhanced I18n System', () => {
  let i18nService: I18nService;

  beforeEach(() => {
    i18nService = new I18nService({
      cacheEnabled: true,
      cacheTTL: 1000,
      lazyLoading: true,
    });
  });

  afterEach(() => {
    i18nService.clearCache();
  });

  describe('Caching Improvements', () => {
    it('should cache translation results', async () => {
      await i18nService.initialize();

      const key = 'test.key';
      const options = { locale: 'en-US', defaultValue: 'Test Value' };

      // First call
      const result1 = i18nService.translate(key, options);
      
      // Second call should use cache
      const result2 = i18nService.translate(key, options);

      expect(result1).toBe(result2);
      expect(result1).toBe('Test Value');
    });

    it('should clear cache for specific locale', async () => {
      await i18nService.initialize();

      // Add translations for multiple locales
      i18nService.addTranslations('en-US', {
        'test.key': {
          locale: 'en-US',
          key: 'test.key',
          value: 'English Value',
          lastUpdated: new Date(),
          version: 1,
        },
      });

      i18nService.addTranslations('th-TH', {
        'test.key': {
          locale: 'th-TH',
          key: 'test.key',
          value: 'Thai Value',
          lastUpdated: new Date(),
          version: 1,
        },
      });

      // Translate in both locales
      const englishResult = i18nService.translate('test.key', { locale: 'en-US' });
      const thaiResult = i18nService.translate('test.key', { locale: 'th-TH' });

      expect(englishResult).toBe('English Value');
      expect(thaiResult).toBe('Thai Value');

      // Clear cache should work
      i18nService.clearCache();
      
      // Should still work after cache clear
      const englishResult2 = i18nService.translate('test.key', { locale: 'en-US' });
      expect(englishResult2).toBe('English Value');
    });

    it('should provide translation statistics', async () => {
      await i18nService.initialize();

      i18nService.addTranslations('en-US', {
        'key1': {
          locale: 'en-US',
          key: 'key1',
          value: 'Value 1',
          lastUpdated: new Date(),
          version: 1,
        },
        'key2': {
          locale: 'en-US',
          key: 'key2',
          value: 'Value 2',
          lastUpdated: new Date(),
          version: 1,
        },
      });

      const stats = i18nService.getTranslationStats();

      expect(stats.locales).toContain('en-US');
      expect(stats.totalTranslations).toBeGreaterThan(0);
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dynamic Translation Loading', () => {
    it('should load translations for specific locale', async () => {
      // Mock fetch for testing
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          'dynamic.key': 'Dynamic Value',
          'another.key': 'Another Value',
        }),
      });

      await i18nService.initialize();
      await i18nService.loadLocaleTranslations('en-US');

      const result = i18nService.translate('dynamic.key', { locale: 'en-US' });
      expect(result).toBe('Dynamic Value');
    });

    it('should handle failed translation loading gracefully', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await i18nService.initialize();
      await i18nService.loadLocaleTranslations('en-US');

      // Should not throw and should use fallback
      const result = i18nService.translate('missing.key', { 
        locale: 'en-US', 
        defaultValue: 'Fallback Value' 
      });
      expect(result).toBe('Fallback Value');
    });

    it('should preload multiple locales', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          'preload.key': 'Preloaded Value',
        }),
      });

      await i18nService.initialize();
      await i18nService.preloadTranslations(['en-US', 'th-TH'], ['common', 'forms']);

      // Should have made multiple fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(4); // 2 locales × 2 namespaces
    });
  });

  describe('Hot-Swapping', () => {
    it('should support hot-reload of translations', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          'hot.key': 'Hot Reloaded Value',
        }),
      });

      await i18nService.initialize();

      // Mock window for event dispatching
      Object.defineProperty(window, 'dispatchEvent', {
        value: vi.fn(),
        writable: true,
      });

      await i18nService.hotReloadTranslations('en-US');

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'i18n:hot-reload',
          detail: { locale: 'en-US', namespace: undefined },
        })
      );
    });
  });
});

describe('Enhanced Formatters', () => {
  let formatter: LocaleFormatter;

  beforeEach(() => {
    formatter = new LocaleFormatter('en-US');
  });

  describe('Additional Formatting Functions', () => {
    it('should format distances with locale-specific units', () => {
      const usFormatter = new LocaleFormatter('en-US');
      const metricFormatter = new LocaleFormatter('en-GB');

      // US should prefer miles
      const usDistance = usFormatter.formatDistance(1000, 'm', 'en-US');
      expect(usDistance).toContain('mi');

      // UK should prefer kilometers
      const metricDistance = metricFormatter.formatDistance(1000, 'm', 'en-GB');
      expect(metricDistance).toContain('km');
    });

    it('should format temperatures with locale-specific units', () => {
      const usFormatter = new LocaleFormatter('en-US');
      const metricFormatter = new LocaleFormatter('en-GB');

      const usTemp = usFormatter.formatTemperature(20, 'C', 'en-US');
      expect(usTemp).toContain('°F');

      const metricTemp = metricFormatter.formatTemperature(68, 'F', 'en-GB');
      expect(metricTemp).toContain('°C');
    });

    it('should format durations in human-readable format', () => {
      const shortDuration = formatter.formatDuration(3665, 'en-US', { format: 'short' });
      expect(shortDuration).toBe('1h 1m');

      const longDuration = formatter.formatDuration(3665, 'en-US', { format: 'long' });
      expect(longDuration).toBe('1 hour, 1 minute');
    });

    it('should format file sizes with appropriate units', () => {
      const smallFile = formatter.formatFileSize(1024, 'en-US');
      expect(smallFile).toBe('1 KB');

      const largeFile = formatter.formatFileSize(1048576, 'en-US');
      expect(largeFile).toBe('1 MB');
    });

    it('should format lists with locale-appropriate conjunctions', () => {
      const items = ['apple', 'banana', 'cherry'];
      
      const conjunction = formatter.formatList(items, 'en-US', { type: 'conjunction' });
      expect(conjunction).toBe('apple, banana, and cherry');

      const disjunction = formatter.formatList(items, 'en-US', { type: 'disjunction' });
      expect(disjunction).toBe('apple, banana, or cherry');
    });

    it('should format ordinal numbers', () => {
      expect(formatter.formatOrdinal(1, 'en-US')).toBe('1st');
      expect(formatter.formatOrdinal(2, 'en-US')).toBe('2nd');
      expect(formatter.formatOrdinal(3, 'en-US')).toBe('3rd');
      expect(formatter.formatOrdinal(4, 'en-US')).toBe('4th');
      expect(formatter.formatOrdinal(11, 'en-US')).toBe('11th');
      expect(formatter.formatOrdinal(21, 'en-US')).toBe('21st');
    });
  });

  describe('Weight Formatting', () => {
    it('should convert and format weights correctly', () => {
      const kgFormatter = new LocaleFormatter('en-GB');
      const lbsFormatter = new LocaleFormatter('en-US');

      const kgWeight = kgFormatter.formatWeight(100, WeightUnit.LBS, WeightUnit.KG);
      expect(kgWeight).toContain('kg');
      expect(parseFloat(kgWeight)).toBeCloseTo(45.36, 1);

      const lbsWeight = lbsFormatter.formatWeight(45.36, WeightUnit.KG, WeightUnit.LBS);
      expect(lbsWeight).toContain('lbs');
      expect(parseFloat(lbsWeight)).toBeCloseTo(100, 1);
    });

    it('should format plate loading calculations', () => {
      const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
      const barWeight = 20;
      const targetWeight = 100;

      const plateLoading = formatter.formatPlateLoading(
        targetWeight,
        barWeight,
        availablePlates,
        WeightUnit.KG
      );

      expect(plateLoading.totalWeight).toBeCloseTo(100, 1);
      expect(plateLoading.plates.length).toBeGreaterThan(0);
      expect(plateLoading.formattedString).toBeTruthy();
    });
  });

  describe('Relative Time Formatting', () => {
    it('should format relative time correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneHourLater = new Date(now.getTime() + 3600000);

      const pastTime = formatter.formatRelativeTime(oneHourAgo, now);
      const futureTime = formatter.formatRelativeTime(oneHourLater, now);

      expect(pastTime).toContain('ago');
      expect(futureTime).toContain('in');
    });
  });
});

describe('Locale Detection and Fallbacks', () => {
  let i18nService: I18nService;

  beforeEach(() => {
    i18nService = new I18nService();
  });

  it('should detect locale from Accept-Language header', () => {
    const detectedLocale = i18nService.detectLocale({
      acceptLanguageHeader: 'th-TH,th;q=0.9,en;q=0.8',
      defaultLocale: 'en-US',
      supportedLocales: ['en-US', 'th-TH', 'zh-CN'],
    });

    expect(detectedLocale).toBe('th-TH');
  });

  it('should fall back to default locale when preferred is not supported', () => {
    const detectedLocale = i18nService.detectLocale({
      acceptLanguageHeader: 'fr-FR,fr;q=0.9',
      defaultLocale: 'en-US',
      supportedLocales: ['en-US', 'th-TH', 'zh-CN'],
    });

    expect(detectedLocale).toBe('en-US');
  });

  it('should prioritize user preference over Accept-Language', () => {
    const detectedLocale = i18nService.detectLocale({
      acceptLanguageHeader: 'th-TH,th;q=0.9',
      userPreference: 'zh-CN',
      defaultLocale: 'en-US',
      supportedLocales: ['en-US', 'th-TH', 'zh-CN'],
    });

    expect(detectedLocale).toBe('zh-CN');
  });
});

// Mock global fetch for tests
beforeAll(() => {
  global.fetch = vi.fn();
});

afterAll(() => {
  delete (global as any).fetch;
});