/**
 * Utility functions for parsing JSON data from database
 */
export class JsonParserUtil {
  /**
   * Safely parse a JSON string or return the value as-is
   */
  static parse<T>(value: string | T | null | undefined, defaultValue: T): T {
    if (value === null || value === undefined) {
      return defaultValue;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }

    return value as T;
  }

  /**
   * Parse JSON array with fallback to empty array
   */
  static parseArray<T>(value: string | T[] | null | undefined): T[] {
    return this.parse(value, [] as T[]);
  }

  /**
   * Parse JSON object with fallback to empty object
   */
  static parseObject<T>(value: string | T | null | undefined): T {
    return this.parse(value, {} as T);
  }

  /**
   * Parse JSON with fallback to null
   */
  static parseNullable<T>(value: string | T | null | undefined): T | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }

    return value as T;
  }
}
