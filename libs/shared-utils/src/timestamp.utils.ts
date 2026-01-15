/**
 * Timestamp utility functions for consistent timezone handling
 * These utilities ensure that timestamps are handled consistently across the application
 * without automatic timezone conversion
 */

export interface TimestampConfig {
  /** Whether to disable timezone conversion (default: true) */
  disableTimezoneConversion?: boolean;
  /** Default timezone for display purposes (default: 'UTC') */
  defaultTimezone?: string;
  /** Whether to return timestamps as ISO strings (default: true) */
  asISOString?: boolean;
}

export class TimestampUtils {
  private static readonly DEFAULT_CONFIG: Required<TimestampConfig> = {
    disableTimezoneConversion: true,
    defaultTimezone: 'UTC',
    asISOString: true,
  };

  /**
   * Formats a timestamp for database storage
   * Ensures no timezone conversion occurs
   */
  static formatForDatabase(timestamp: Date | string | number, config: TimestampConfig = {}): string {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (timestamp instanceof Date) {
      return mergedConfig.asISOString ? timestamp.toISOString() : timestamp.toISOString();
    }
    
    if (typeof timestamp === 'string') {
      // If it's already a string, validate it's a valid ISO string
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp string: ${timestamp}`);
      }
      return mergedConfig.asISOString ? date.toISOString() : timestamp;
    }
    
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp number: ${timestamp}`);
      }
      return mergedConfig.asISOString ? date.toISOString() : date.toISOString();
    }
    
    throw new Error(`Unsupported timestamp type: ${typeof timestamp}`);
  }

  /**
   * Parses a timestamp from database without timezone conversion
   * Returns the timestamp as a string to prevent automatic conversion
   */
  static parseFromDatabase(timestamp: string | Date | null | undefined, config: TimestampConfig = {}): string | null {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (!timestamp) {
      return null;
    }
    
    if (typeof timestamp === 'string') {
      // Validate it's a proper timestamp string
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp string: ${timestamp}`);
      }
      return mergedConfig.asISOString ? date.toISOString() : timestamp;
    }
    
    if (timestamp instanceof Date) {
      return mergedConfig.asISOString ? timestamp.toISOString() : timestamp.toISOString();
    }
    
    throw new Error(`Unsupported timestamp type: ${typeof timestamp}`);
  }

  /**
   * Gets the current timestamp as a string (no timezone conversion)
   */
  static now(config: TimestampConfig = {}): string {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const now = new Date();
    return mergedConfig.asISOString ? now.toISOString() : now.toISOString();
  }

  /**
   * Validates that a timestamp string is valid
   */
  static isValidTimestamp(timestamp: string): boolean {
    if (typeof timestamp !== 'string') {
      return false;
    }
    
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  }

  /**
   * Converts a timestamp to a specific timezone for display purposes only
   * This should only be used for UI display, not for database operations
   */
  static formatForDisplay(timestamp: string | Date, timezone: string = 'UTC'): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid timestamp: ${timestamp}`);
    }
    
    // Use Intl.DateTimeFormat for timezone conversion
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }

  /**
   * Creates a timestamp string from individual date components
   * Ensures consistent formatting without timezone conversion
   */
  static createFromComponents(
    year: number,
    month: number, // 1-12
    day: number,
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
    millisecond: number = 0,
    config: TimestampConfig = {}
  ): string {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    // Create date in UTC to avoid timezone issues
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date components: ${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}`);
    }
    
    return mergedConfig.asISOString ? date.toISOString() : date.toISOString();
  }

  /**
   * Compares two timestamps without timezone conversion
   * Returns -1 if first is earlier, 0 if equal, 1 if first is later
   */
  static compare(timestamp1: string | Date, timestamp2: string | Date): number {
    const date1 = timestamp1 instanceof Date ? timestamp1 : new Date(timestamp1);
    const date2 = timestamp2 instanceof Date ? timestamp2 : new Date(timestamp2);
    
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      throw new Error('Invalid timestamps for comparison');
    }
    
    return date1.getTime() - date2.getTime();
  }

  /**
   * Checks if a timestamp is within a date range
   */
  static isWithinRange(
    timestamp: string | Date,
    startDate: string | Date,
    endDate: string | Date
  ): boolean {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    if (isNaN(date.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid timestamps for range check');
    }
    
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }
}

/**
 * Default timestamp configuration for the application
 * This ensures consistent behavior across all timestamp operations
 */
export const DEFAULT_TIMESTAMP_CONFIG: Required<TimestampConfig> = {
  disableTimezoneConversion: true,
  defaultTimezone: 'UTC',
  asISOString: true,
};

/**
 * Helper function to create a timestamp for database insertion
 * This is the recommended way to create timestamps for database operations
 */
export function createDatabaseTimestamp(config: TimestampConfig = {}): string {
  return TimestampUtils.now(config);
}

/**
 * Helper function to parse a timestamp from database results
 * This is the recommended way to handle timestamps from database queries
 */
export function parseDatabaseTimestamp(timestamp: string | Date | null | undefined, config: TimestampConfig = {}): string | null {
  return TimestampUtils.parseFromDatabase(timestamp, config);
}
