// Formatter utilities moved from human-lift-training-api/src/Helpers/Commons.ts
import { format } from 'date-fns';

/**
 * Formatting utilities for dates, numbers, and other data types
 */
export class Formatter {
  public static readonly DATE_FORMAT = 'yyyy-MM-dd';
  public static readonly DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';
  public static readonly TIME_FORMAT = 'HH:mm:ss';
  public static readonly ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";

  public static date(date: Date): string {
    return format(date, this.DATE_FORMAT);
  }

  public static dateTime(date: Date): string {
    return format(date, this.DATETIME_FORMAT);
  }

  public static time(date: Date): string {
    return format(date, this.TIME_FORMAT);
  }

  public static iso(date: Date): string {
    return format(date, this.ISO_FORMAT);
  }

  public static currency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  public static number(value: number, decimals: number = 2): string {
    return value.toFixed(decimals);
  }

  public static percentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  public static fileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  public static duration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  public static truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  public static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  public static camelCase(text: string): string {
    return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  public static kebabCase(text: string): string {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  public static snakeCase(text: string): string {
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }
}