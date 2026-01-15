import { I18nService } from '@strengthos/shared-i18n';
import { enUSTranslations } from '../translations/en-US';
import { thTHTranslations } from '../translations/th-TH';

/**
 * Translation management system for the sos-web-training app
 * Handles loading and managing translations using the shared-i18n service
 */
export class AppTranslationManager {
  private i18nService: I18nService;
  private loadedLocales: Set<string> = new Set();

  constructor(i18nService: I18nService) {
    this.i18nService = i18nService;
  }

  /**
   * Load all available translations into the i18n service
   */
  async loadAllTranslations(): Promise<void> {
    try {
      // Load English translations
      this.i18nService.addTranslations('en-US', enUSTranslations);
      this.loadedLocales.add('en-US');

      // Load Thai translations
      this.i18nService.addTranslations('th-TH', thTHTranslations);
      this.loadedLocales.add('th-TH');

      console.log('All translations loaded successfully');
    } catch (error) {
      console.error('Failed to load translations:', error);
      throw error;
    }
  }

  /**
   * Load translations for a specific locale
   */
  async loadLocaleTranslations(locale: string): Promise<void> {
    if (this.loadedLocales.has(locale)) {
      return; // Already loaded
    }

    try {
      switch (locale) {
        case 'en-US':
          this.i18nService.addTranslations('en-US', enUSTranslations);
          break;
        case 'th-TH':
          this.i18nService.addTranslations('th-TH', thTHTranslations);
          break;
        default:
          console.warn(`No translations available for locale: ${locale}`);
          return;
      }

      this.loadedLocales.add(locale);
      console.log(`Translations loaded for locale: ${locale}`);
    } catch (error) {
      console.error(`Failed to load translations for locale ${locale}:`, error);
      throw error;
    }
  }

  /**
   * Check if translations are loaded for a locale
   */
  isLocaleLoaded(locale: string): boolean {
    return this.loadedLocales.has(locale);
  }

  /**
   * Get all loaded locales
   */
  getLoadedLocales(): string[] {
    return Array.from(this.loadedLocales);
  }

  /**
   * Reload translations for a specific locale
   */
  async reloadLocaleTranslations(locale: string): Promise<void> {
    this.loadedLocales.delete(locale);
    await this.loadLocaleTranslations(locale);
  }

  /**
   * Clear all loaded translations
   */
  clearAllTranslations(): void {
    this.i18nService.clearCache();
    this.loadedLocales.clear();
  }

  /**
   * Test translation functionality
   */
  testTranslations(): void {
    const testKeys = ['common.loading', 'nav.dashboard', 'workout.count', 'user.welcome'];

    const testLocales = ['en-US', 'th-TH'];

    console.log('Testing translations...');

    testLocales.forEach((locale) => {
      console.log(`\n--- Testing ${locale} ---`);

      testKeys.forEach((key) => {
        const translation = this.i18nService.translate(key, { locale });
        console.log(`${key}: "${translation}"`);
      });

      // Test pluralization
      const pluralTest = this.i18nService.translate('workout.count', {
        locale,
        count: 1,
        interpolation: { count: 1 },
      });
      console.log(`workout.count (1): "${pluralTest}"`);

      const pluralTestMultiple = this.i18nService.translate('workout.count', {
        locale,
        count: 5,
        interpolation: { count: 5 },
      });
      console.log(`workout.count (5): "${pluralTestMultiple}"`);

      // Test interpolation
      const interpolationTest = this.i18nService.translate('user.welcome', {
        locale,
        interpolation: { name: 'John Doe' },
      });
      console.log(`user.welcome: "${interpolationTest}"`);
    });

    console.log('\nTranslation testing completed.');
  }
}

/**
 * Initialize the translation manager with the app's i18n service
 */
export async function initializeTranslationManager(
  i18nService: I18nService,
): Promise<AppTranslationManager> {
  const manager = new AppTranslationManager(i18nService);
  await manager.loadAllTranslations();
  return manager;
}
