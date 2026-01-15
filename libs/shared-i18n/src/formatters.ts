import { FormattingOptions, WeightUnit } from './types';
import { getLocaleConfig } from './locales';

export class LocaleFormatter {
  private locale: string;
  private options: FormattingOptions;

  constructor(locale: string, options: Partial<FormattingOptions> = {}) {
    this.locale = locale;
    const localeConfig = getLocaleConfig(locale);
    
    this.options = {
      locale,
      timeZone: options.timeZone || 'UTC',
      currency: options.currency || localeConfig.currency,
      weightUnit: options.weightUnit || localeConfig.weightUnit,
      dateStyle: options.dateStyle || 'medium',
      timeStyle: options.timeStyle || 'short',
      numberStyle: options.numberStyle || 'decimal',
      ...options,
    };
  }

  /**
   * Format a date according to locale preferences
   */
  formatDate(date: Date | string | number, style?: 'short' | 'medium' | 'long' | 'full'): string {
    const dateObj = new Date(date);
    const localeConfig = getLocaleConfig(this.locale);

    try {
      return new Intl.DateTimeFormat(this.locale, {
        dateStyle: style || this.options.dateStyle,
        timeZone: this.options.timeZone,
      }).format(dateObj);
    } catch (error) {
      // Fallback to manual formatting if Intl is not available
      return this.formatDateFallback(dateObj, localeConfig.dateFormat);
    }
  }

  /**
   * Format a time according to locale preferences
   */
  formatTime(date: Date | string | number, style?: 'short' | 'medium' | 'long' | 'full'): string {
    const dateObj = new Date(date);

    try {
      return new Intl.DateTimeFormat(this.locale, {
        timeStyle: style || this.options.timeStyle,
        timeZone: this.options.timeZone,
      }).format(dateObj);
    } catch (error) {
      // Fallback to manual formatting
      return this.formatTimeFallback(dateObj);
    }
  }

  /**
   * Format a date and time together
   */
  formatDateTime(
    date: Date | string | number,
    dateStyle?: 'short' | 'medium' | 'long' | 'full',
    timeStyle?: 'short' | 'medium' | 'long' | 'full'
  ): string {
    const dateObj = new Date(date);

    try {
      return new Intl.DateTimeFormat(this.locale, {
        dateStyle: dateStyle || this.options.dateStyle,
        timeStyle: timeStyle || this.options.timeStyle,
        timeZone: this.options.timeZone,
      }).format(dateObj);
    } catch (error) {
      // Fallback to combining date and time
      return `${this.formatDate(dateObj, dateStyle)} ${this.formatTime(dateObj, timeStyle)}`;
    }
  }

  /**
   * Format a number according to locale preferences
   */
  formatNumber(
    number: number,
    options: {
      style?: 'decimal' | 'currency' | 'percent';
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      currency?: string;
    } = {}
  ): string {
    const localeConfig = getLocaleConfig(this.locale);

    try {
      const formatOptions: Intl.NumberFormatOptions = {
        style: options.style || this.options.numberStyle,
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits,
      };

      if (options.style === 'currency') {
        formatOptions.currency = options.currency || this.options.currency;
      }

      return new Intl.NumberFormat(this.locale, formatOptions).format(number);
    } catch (error) {
      // Fallback to manual formatting
      return this.formatNumberFallback(number, localeConfig.numberFormat);
    }
  }

  /**
   * Format currency according to locale preferences
   */
  formatCurrency(
    amount: number,
    currency?: string,
    options: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    } = {}
  ): string {
    return this.formatNumber(amount, {
      style: 'currency',
      currency: currency || this.options.currency,
      ...options,
    });
  }

  /**
   * Format percentage according to locale preferences
   */
  formatPercent(
    value: number,
    options: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    } = {}
  ): string {
    return this.formatNumber(value / 100, {
      style: 'percent',
      ...options,
    });
  }

  /**
   * Format weight with appropriate unit conversion
   */
  formatWeight(
    weight: number,
    fromUnit: WeightUnit,
    toUnit?: WeightUnit,
    precision: number = 2
  ): string {
    const targetUnit: WeightUnit = toUnit || (this.options.weightUnit as WeightUnit) || WeightUnit.KG;
    const convertedWeight = this.convertWeight(weight, fromUnit, targetUnit);
    
    return `${this.formatNumber(convertedWeight, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    })} ${targetUnit.toLowerCase()}`;
  }

  /**
   * Convert weight between units
   */
  convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
    if (fromUnit === toUnit) {
      return weight;
    }

    // Convert to kg first, then to target unit
    let weightInKg = weight;
    if (fromUnit === WeightUnit.LBS) {
      weightInKg = weight * 0.453592;
    }

    if (toUnit === WeightUnit.LBS) {
      return weightInKg * 2.20462;
    }

    return weightInKg;
  }

  /**
   * Format plate loading for weight calculation
   */
  formatPlateLoading(
    targetWeight: number,
    barWeight: number,
    availablePlates: number[],
    unit: WeightUnit = (this.options.weightUnit as WeightUnit) || WeightUnit.KG
  ): {
    plates: Array<{ weight: number; count: number }>;
    totalWeight: number;
    formattedString: string;
  } {
    const sideWeight = (targetWeight - barWeight) / 2;
    const plates: Array<{ weight: number; count: number }> = [];
    let remainingWeight = sideWeight;

    // Sort plates in descending order
    const sortedPlates = [...availablePlates].sort((a, b) => b - a);

    for (const plateWeight of sortedPlates) {
      const count = Math.floor(remainingWeight / plateWeight);
      if (count > 0) {
        plates.push({ weight: plateWeight, count });
        remainingWeight -= plateWeight * count;
      }
    }

    const actualSideWeight = plates.reduce((sum, plate) => sum + (plate.weight * plate.count), 0);
    const totalWeight = barWeight + (actualSideWeight * 2);

    const formattedString = plates
      .map(plate => `${plate.count}×${this.formatWeight(plate.weight, unit, unit, 2)}`)
      .join(' + ');

    return {
      plates,
      totalWeight,
      formattedString: formattedString || '0',
    };
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  formatRelativeTime(date: Date | string | number, baseDate: Date = new Date()): string {
    const targetDate = new Date(date);
    const diffMs = targetDate.getTime() - baseDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    try {
      // Use Intl.RelativeTimeFormat if available
      const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });

      if (Math.abs(diffDays) >= 1) {
        return rtf.format(diffDays, 'day');
      } else if (Math.abs(diffHours) >= 1) {
        return rtf.format(diffHours, 'hour');
      } else if (Math.abs(diffMinutes) >= 1) {
        return rtf.format(diffMinutes, 'minute');
      } else {
        return rtf.format(diffSeconds, 'second');
      }
    } catch (error) {
      // Fallback to manual formatting
      return this.formatRelativeTimeFallback(diffSeconds);
    }
  }

  /**
   * Fallback date formatting
   */
  private formatDateFallback(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  /**
   * Fallback time formatting
   */
  private formatTimeFallback(date: Date): string {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const localeConfig = getLocaleConfig(this.locale);

    if (localeConfig.timeFormat === '12h') {
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${displayHours}:${minutes} ${ampm}`;
    } else {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  /**
   * Fallback number formatting
   */
  private formatNumberFallback(number: number, config: any): string {
    const parts = number.toFixed(config.precision).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousands);
    const decimalPart = parts[1] ? config.decimal + parts[1] : '';
    
    return integerPart + decimalPart;
  }

  /**
   * Fallback relative time formatting
   */
  private formatRelativeTimeFallback(diffSeconds: number): string {
    const absDiff = Math.abs(diffSeconds);
    const isPast = diffSeconds < 0;

    if (absDiff < 60) {
      return isPast ? 'just now' : 'in a moment';
    } else if (absDiff < 3600) {
      const minutes = Math.floor(absDiff / 60);
      return isPast ? `${minutes} minutes ago` : `in ${minutes} minutes`;
    } else if (absDiff < 86400) {
      const hours = Math.floor(absDiff / 3600);
      return isPast ? `${hours} hours ago` : `in ${hours} hours`;
    } else {
      const days = Math.floor(absDiff / 86400);
      return isPast ? `${days} days ago` : `in ${days} days`;
    }
  }
}

/**
 * Create a formatter for a specific locale
 */
export function createFormatter(locale: string, options?: Partial<FormattingOptions>): LocaleFormatter {
  return new LocaleFormatter(locale, options);
}

/**
 * Format date with locale
 */
export function formatDate(date: Date | string | number, locale: string, style?: 'short' | 'medium' | 'long' | 'full'): string {
  const formatter = createFormatter(locale);
  return formatter.formatDate(date, style);
}

/**
 * Format time with locale
 */
export function formatTime(date: Date | string | number, locale: string, style?: 'short' | 'medium' | 'long' | 'full'): string {
  const formatter = createFormatter(locale);
  return formatter.formatTime(date, style);
}

/**
 * Format number with locale
 */
export function formatNumber(number: number, locale: string, options?: any): string {
  const formatter = createFormatter(locale);
  return formatter.formatNumber(number, options);
}

/**
 * Format currency with locale
 */
export function formatCurrency(amount: number, locale: string, currency?: string): string {
  const formatter = createFormatter(locale);
  return formatter.formatCurrency(amount, currency);
}

/**
 * Format weight with locale and unit conversion
 */
export function formatWeight(weight: number, fromUnit: WeightUnit, locale: string, toUnit?: WeightUnit): string {
  const formatter = createFormatter(locale);
  return formatter.formatWeight(weight, fromUnit, toUnit);
}

/**
 * Convert distance between units
 */
function convertDistance(distance: number, fromUnit: string, toUnit: string): number {
  const conversions: Record<string, number> = {
    'm': 1,
    'km': 1000,
    'ft': 0.3048,
    'mi': 1609.34,
  };
  
  const meters = distance * conversions[fromUnit];
  return meters / conversions[toUnit];
}

/**
 * Convert temperature between units
 */
function convertTemperature(temp: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return temp;
  
  if (fromUnit === 'C' && toUnit === 'F') {
    return (temp * 9/5) + 32;
  } else if (fromUnit === 'F' && toUnit === 'C') {
    return (temp - 32) * 5/9;
  }
  
  return temp;
}

/**
 * Format distance with locale-specific units
 */
export function formatDistance(
  distance: number,
  fromUnit: 'km' | 'mi' | 'm' | 'ft',
  locale: string,
  precision: number = 2
): string {
  const formatter = createFormatter(locale);
  const localeConfig = getLocaleConfig(locale);
  
  // Determine preferred unit based on locale
  const preferredUnit = localeConfig.region === 'US' ? 'mi' : 'km';
  const convertedDistance = convertDistance(distance, fromUnit, preferredUnit);
  
  return `${formatter.formatNumber(convertedDistance, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  })} ${preferredUnit}`;
}

/**
 * Format temperature with locale-specific units
 */
export function formatTemperature(
  temperature: number,
  fromUnit: 'C' | 'F',
  locale: string,
  precision: number = 1
): string {
  const formatter = createFormatter(locale);
  const localeConfig = getLocaleConfig(locale);
  
  // Determine preferred unit based on locale
  const preferredUnit = localeConfig.region === 'US' ? 'F' : 'C';
  const convertedTemp = convertTemperature(temperature, fromUnit, preferredUnit);
  
  return `${formatter.formatNumber(convertedTemp, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  })}°${preferredUnit}`;
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(
  seconds: number,
  locale: string,
  options: {
    format?: 'short' | 'long';
    maxUnits?: number;
  } = {}
): string {
  const { format = 'short', maxUnits = 2 } = options;
  
  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
    { name: 'second', seconds: 1 },
  ];

  const parts: string[] = [];
  let remainingSeconds = Math.abs(seconds);

  for (const unit of units) {
    if (parts.length >= maxUnits) break;
    
    const count = Math.floor(remainingSeconds / unit.seconds);
    if (count > 0) {
      remainingSeconds -= count * unit.seconds;
      
      if (format === 'short') {
        const shortUnit = unit.name.charAt(0);
        parts.push(`${count}${shortUnit}`);
      } else {
        const unitName = count === 1 ? unit.name : `${unit.name}s`;
        parts.push(`${count} ${unitName}`);
      }
    }
  }

  if (parts.length === 0) {
    return format === 'short' ? '0s' : '0 seconds';
  }

  return parts.join(format === 'short' ? ' ' : ', ');
}

/**
 * Format file size with appropriate units
 */
export function formatFileSize(bytes: number, locale: string, precision: number = 2): string {
  const formatter = createFormatter(locale);
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${formatter.formatNumber(size, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  })} ${units[unitIndex]}`;
}

/**
 * Format list of items with locale-appropriate conjunctions
 */
export function formatList(
  items: string[],
  locale: string,
  options: {
    style?: 'long' | 'short' | 'narrow';
    type?: 'conjunction' | 'disjunction';
  } = {}
): string {
  const { style = 'long', type = 'conjunction' } = options;
  
  try {
    return new Intl.ListFormat(locale, { style, type }).format(items);
  } catch (error) {
    // Fallback for browsers without Intl.ListFormat
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) {
      const conjunction = type === 'conjunction' ? 'and' : 'or';
      return `${items[0]} ${conjunction} ${items[1]}`;
    }
    
    const conjunction = type === 'conjunction' ? 'and' : 'or';
    const lastItem = items[items.length - 1];
    const otherItems = items.slice(0, -1);
    return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
  }
}

/**
 * Format ordinal numbers (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(number: number, locale: string): string {
  try {
    const pr = new Intl.PluralRules(locale, { type: 'ordinal' });
    const rule = pr.select(number);
    
    // This is a simplified implementation - in production you'd want
    // proper ordinal formatting for each locale
    const suffixes: Record<string, string> = {
      'one': 'st',
      'two': 'nd',
      'few': 'rd',
      'other': 'th'
    };
    
    return `${number}${suffixes[rule] || 'th'}`;
  } catch (error) {
    // Fallback for English ordinals
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = number % 100;
    
    if (remainder >= 11 && remainder <= 13) {
      return `${number}th`;
    }
    
    const lastDigit = number % 10;
    const suffix = suffixes[lastDigit] || suffixes[0];
    return `${number}${suffix}`;
  }
}
