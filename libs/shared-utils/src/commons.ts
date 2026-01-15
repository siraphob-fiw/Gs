// Common utilities moved from human-lift-training-api/src/Helpers/Commons.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * Utilities class with common helper functions
 */
export class Utils {
  public static DbBitToBoolen(data: any): boolean {
    if (Buffer.isBuffer(data)) {
      return data.readInt8() ? true : false;
    }
    throw new Error('Can not convert data to boolean');
  }

  public static getDateTimeUTCNow(): Date {
    const locolNow: Date = new Date();
    const utcNowTimeStamp = Date.UTC(
      locolNow.getUTCFullYear(),
      locolNow.getUTCMonth(),
      locolNow.getUTCDate(),
      locolNow.getUTCHours(),
      locolNow.getUTCMinutes(),
      locolNow.getUTCSeconds(),
      locolNow.getUTCMilliseconds()
    );
    return new Date(utcNowTimeStamp);
  }

  public static isUndefinedOrNull(data: any): boolean {
    return data === undefined || data === null;
  }

  // Additional utility methods
  public static generateId(): string {
    return uuidv4();
  }

  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  public static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  public static sanitizeString(str: string): string {
    return str.replace(/[<>\"'&]/g, '');
  }

  public static truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }
}