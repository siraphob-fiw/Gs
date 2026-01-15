import { useI18n } from '../../contexts/I18nContext';

export interface TranslationOptions {
  defaultValue?: string;
  interpolation?: Record<string, string | number | Date | boolean>;
  count?: number;
}

/**
 * Hook for component-level translations with optional namespace support
 */
export const useTranslation = (namespace?: string) => {
  const { translate, context, isLoading, error } = useI18n();

  const t = (key: string, options: TranslationOptions | string = {}) => {
    // Handle string fallback for backward compatibility
    const translationOptions: TranslationOptions =
      typeof options === 'string' ? { defaultValue: options } : options;
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return translate(fullKey, {
      defaultValue: translationOptions.defaultValue,
      interpolation: translationOptions.interpolation,
      count: translationOptions.count,
    });
  };

  return {
    t,
    locale: context.locale,
    isLoading,
    error,
    // Convenience methods for common translation patterns
    tWithCount: (key: string, count: number, options: Omit<TranslationOptions, 'count'> = {}) =>
      t(key, { ...options, count }),

    tWithInterpolation: (
      key: string,
      interpolation: Record<string, any>,
      options: Omit<TranslationOptions, 'interpolation'> = {},
    ) => t(key, { ...options, interpolation }),
  };
};

/**
 * Hook for translations with a specific namespace
 * Useful for page or component-specific translations
 */
export const useNamespacedTranslation = (namespace: string) => {
  return useTranslation(namespace);
};
