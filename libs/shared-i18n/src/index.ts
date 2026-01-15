// Core types and interfaces
export * from './types';
export { WeightUnit } from './types';
export type { I18nContext } from './types';

// Locale configurations and utilities
export * from './locales';

// Internationalization service
export { I18nService } from './i18n-service';

// Formatting utilities
export {
  LocaleFormatter,
  createFormatter,
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency,
  formatWeight,
} from './formatters';

// Translation management
export { TranslationManager } from './translation-manager';
export type { TranslationManagerConfig } from './translation-manager';

// Utility functions
export {
  detectLocaleFromRequest,
  createI18nContext,
  validateLocale,
  getPreferredWeightUnit,
  convertBetweenUnits,
} from './utils';

// Constants
export {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  getSupportedLocales,
} from './locales';
