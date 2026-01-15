import { I18nContext, LocaleDetectionOptions, WeightUnit } from './types';
import { getLocaleConfig, getSupportedLocales, DEFAULT_LOCALE } from './locales';

/**
 * Detect locale from HTTP request headers and other sources
 */
export function detectLocaleFromRequest(options: {
  acceptLanguage?: string;
  userAgent?: string;
  ipAddress?: string;
  userPreference?: string;
  tenantDefault?: string;
}): string {
  const { acceptLanguage, userAgent, ipAddress, userPreference, tenantDefault } = options;
  const supportedLocales = getSupportedLocales();

  // Priority order: user preference > tenant default > accept-language > default
  
  // 1. User preference (highest priority)
  if (userPreference && supportedLocales.includes(userPreference)) {
    return userPreference;
  }

  // 2. Tenant default
  if (tenantDefault && supportedLocales.includes(tenantDefault)) {
    return tenantDefault;
  }

  // 3. Accept-Language header
  if (acceptLanguage) {
    const preferredLocales = parseAcceptLanguage(acceptLanguage);
    for (const locale of preferredLocales) {
      // Try exact match first
      if (supportedLocales.includes(locale)) {
        return locale;
      }
      
      // Try language-only match (e.g., 'en' matches 'en-US')
      const languageCode = locale.split('-')[0];
      const matchingLocale = supportedLocales.find(supported => 
        supported.startsWith(languageCode + '-')
      );
      if (matchingLocale) {
        return matchingLocale;
      }
    }
  }

  // 4. IP-based detection (simplified - in production, use a GeoIP service)
  if (ipAddress) {
    const detectedLocale = detectLocaleFromIP(ipAddress);
    if (detectedLocale && supportedLocales.includes(detectedLocale)) {
      return detectedLocale;
    }
  }

  // 5. Default fallback
  return DEFAULT_LOCALE;
}

/**
 * Parse Accept-Language header
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map(lang => {
      const [locale, quality] = lang.trim().split(';q=');
      return { 
        locale: locale.trim(), 
        quality: quality ? parseFloat(quality) : 1.0 
      };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(item => item.locale);
}

/**
 * Detect locale from IP address (simplified implementation)
 */
function detectLocaleFromIP(ipAddress: string): string | null {
  // This is a simplified implementation
  // In production, use a proper GeoIP service like MaxMind
  
  // IPv4 private ranges - assume default locale
  if (ipAddress.startsWith('192.168.') || 
      ipAddress.startsWith('10.') || 
      ipAddress.startsWith('172.')) {
    return null;
  }

  // This would normally query a GeoIP database
  // For now, return null to use other detection methods
  return null;
}

/**
 * Create an I18n context object
 */
export function createI18nContext(options: {
  locale: string;
  timeZone?: string;
  currency?: string;
  weightUnit?: WeightUnit;
}): I18nContext {
  const { locale, timeZone, currency, weightUnit } = options;
  const localeConfig = getLocaleConfig(locale);

  return {
    locale,
    fallbackLocale: DEFAULT_LOCALE,
    timeZone: timeZone || 'UTC',
    currency: currency || localeConfig.currency,
    weightUnit: weightUnit || localeConfig.weightUnit,
    direction: localeConfig.direction,
    region: localeConfig.region,
  };
}

/**
 * Validate if a locale is supported
 */
export function validateLocale(locale: string): boolean {
  const supportedLocales = getSupportedLocales();
  return supportedLocales.includes(locale);
}

/**
 * Get preferred weight unit for a locale
 */
export function getPreferredWeightUnit(locale: string): WeightUnit {
  const localeConfig = getLocaleConfig(locale);
  return localeConfig.weightUnit as WeightUnit;
}

/**
 * Convert between weight units
 */
export function convertBetweenUnits(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number {
  if (fromUnit === toUnit) {
    return value;
  }

  // Convert to kg first, then to target unit
  let valueInKg = value;
  if (fromUnit === WeightUnit.LBS) {
    valueInKg = value * 0.453592;
  }

  if (toUnit === WeightUnit.LBS) {
    return valueInKg * 2.20462;
  }

  return valueInKg;
}

/**
 * Get available plate denominations for a locale/region
 */
export function getAvailablePlates(locale: string, unit: WeightUnit): number[] {
  const localeConfig = getLocaleConfig(locale);
  
  if (unit === WeightUnit.KG) {
    // Standard metric plates
    return [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
  } else {
    // Standard imperial plates
    return [45, 35, 25, 10, 5, 2.5, 1.25];
  }
}

/**
 * Format plate loading string for display
 */
export function formatPlateLoadingString(
  plates: Array<{ weight: number; count: number }>,
  locale: string,
  unit: WeightUnit
): string {
  if (plates.length === 0) {
    return '0';
  }

  const localeConfig = getLocaleConfig(locale);
  const unitSymbol = unit === WeightUnit.KG ? 'kg' : 'lbs';

  return plates
    .map(plate => {
      const formattedWeight = formatNumberForLocale(plate.weight, locale);
      return `${plate.count}×${formattedWeight}${unitSymbol}`;
    })
    .join(' + ');
}

/**
 * Format number according to locale preferences
 */
function formatNumberForLocale(number: number, locale: string): string {
  const localeConfig = getLocaleConfig(locale);
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  } catch (error) {
    // Fallback formatting
    const parts = number.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, localeConfig.numberFormat.thousands);
    const decimalPart = parts[1] && parseFloat(parts[1]) > 0 
      ? localeConfig.numberFormat.decimal + parts[1].replace(/0+$/, '') 
      : '';
    
    return integerPart + decimalPart;
  }
}

/**
 * Get culturally appropriate training days for a locale
 */
export function getCulturalTrainingDays(locale: string): number[] {
  // Return array of day numbers (0 = Sunday, 1 = Monday, etc.)
  
  if (locale.startsWith('ar-') || locale === 'he-IL') {
    // Middle Eastern countries: Sunday to Thursday
    return [0, 1, 2, 3, 4];
  } else if (locale === 'th-TH') {
    // Thailand: Monday to Saturday (some businesses)
    return [1, 2, 3, 4, 5, 6];
  } else {
    // Most Western countries: Monday to Friday
    return [1, 2, 3, 4, 5];
  }
}

/**
 * Get culturally appropriate rest day for a locale
 */
export function getCulturalRestDay(locale: string): number {
  if (locale.startsWith('ar-') || locale === 'he-IL') {
    return 5; // Friday
  } else {
    return 0; // Sunday
  }
}

/**
 * Check if a locale uses right-to-left text direction
 */
export function isRTLLocale(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  const languageCode = locale.split('-')[0];
  return rtlLocales.includes(languageCode);
}

/**
 * Get appropriate date format pattern for a locale
 */
export function getDateFormatPattern(locale: string): string {
  const localeConfig = getLocaleConfig(locale);
  return localeConfig.dateFormat;
}

/**
 * Get appropriate time format for a locale
 */
export function getTimeFormatPattern(locale: string): '12h' | '24h' {
  const localeConfig = getLocaleConfig(locale);
  return localeConfig.timeFormat as '12h' | '24h';
}

/**
 * Normalize locale string (e.g., 'en_US' -> 'en-US')
 */
export function normalizeLocale(locale: string): string {
  return locale.replace('_', '-');
}

/**
 * Get language code from locale (e.g., 'en-US' -> 'en')
 */
export function getLanguageCode(locale: string): string {
  return locale.split('-')[0];
}

/**
 * Get region code from locale (e.g., 'en-US' -> 'US')
 */
export function getRegionCode(locale: string): string | null {
  const parts = locale.split('-');
  return parts.length > 1 ? parts[1] : null;
}

/**
 * Check if two locales share the same language
 */
export function isSameLanguage(locale1: string, locale2: string): boolean {
  return getLanguageCode(locale1) === getLanguageCode(locale2);
}

/**
 * Get fallback locale for a given locale
 */
export function getFallbackLocale(locale: string): string {
  const languageCode = getLanguageCode(locale);
  const supportedLocales = getSupportedLocales();
  
  // Try to find another locale with the same language
  const sameLanguageLocale = supportedLocales.find(supported => 
    supported !== locale && getLanguageCode(supported) === languageCode
  );
  
  return sameLanguageLocale || DEFAULT_LOCALE;
}
