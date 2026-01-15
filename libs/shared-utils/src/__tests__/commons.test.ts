import { describe, it, expect, vi } from 'vitest';
import { Utils } from '../commons';

describe('Utils', () => {
  describe('DbBitToBoolen', () => {
    it('should convert buffer bit to boolean true', () => {
      const buffer = Buffer.from([1]);
      const result = Utils.DbBitToBoolen(buffer);
      expect(result).toBe(true);
    });

    it('should convert buffer bit to boolean false', () => {
      const buffer = Buffer.from([0]);
      const result = Utils.DbBitToBoolen(buffer);
      expect(result).toBe(false);
    });

    it('should throw error for non-buffer input', () => {
      expect(() => Utils.DbBitToBoolen('not a buffer')).toThrow('Can not convert data to boolean');
    });
  });

  describe('getDateTimeUTCNow', () => {
    it('should return current UTC date', () => {
      const result = Utils.getDateTimeUTCNow();
      expect(result).toBeInstanceOf(Date);
      
      // Should be close to current time (within 1 second)
      const now = new Date();
      const diff = Math.abs(now.getTime() - result.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('isUndefinedOrNull', () => {
    it('should return true for undefined', () => {
      expect(Utils.isUndefinedOrNull(undefined)).toBe(true);
    });

    it('should return true for null', () => {
      expect(Utils.isUndefinedOrNull(null)).toBe(true);
    });

    it('should return false for valid values', () => {
      expect(Utils.isUndefinedOrNull(0)).toBe(false);
      expect(Utils.isUndefinedOrNull('')).toBe(false);
      expect(Utils.isUndefinedOrNull(false)).toBe(false);
      expect(Utils.isUndefinedOrNull([])).toBe(false);
      expect(Utils.isUndefinedOrNull({})).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate a UUID', () => {
      const id = Utils.generateId();
      expect(id).toBe('mocked-uuid-v4');
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await Utils.sleep(10);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(9); // Allow some margin
    });
  });

  describe('deepClone', () => {
    it('should create deep copy of object', () => {
      const original = { a: 1, b: { c: 2 } };
      const clone = Utils.deepClone(original);
      
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.b).not.toBe(original.b);
    });

    it('should handle arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const clone = Utils.deepClone(original);
      
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone[1]).not.toBe(original[1]);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty values', () => {
      expect(Utils.isEmpty(null)).toBe(true);
      expect(Utils.isEmpty(undefined)).toBe(true);
      expect(Utils.isEmpty('')).toBe(true);
      expect(Utils.isEmpty('   ')).toBe(true);
      expect(Utils.isEmpty([])).toBe(true);
      expect(Utils.isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(Utils.isEmpty('test')).toBe(false);
      expect(Utils.isEmpty([1])).toBe(false);
      expect(Utils.isEmpty({ a: 1 })).toBe(false);
      expect(Utils.isEmpty(0)).toBe(false);
      expect(Utils.isEmpty(false)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = Utils.sanitizeString(input);
      expect(result).toBe('scriptalert(xss)/script');
    });

    it('should handle empty string', () => {
      expect(Utils.sanitizeString('')).toBe('');
    });
  });

  describe('truncateString', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that needs truncation';
      const result = Utils.truncateString(longString, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    it('should not truncate short strings', () => {
      const shortString = 'Short';
      const result = Utils.truncateString(shortString, 20);
      expect(result).toBe('Short');
    });

    it('should handle exact length', () => {
      const exactString = '12345';
      const result = Utils.truncateString(exactString, 5);
      expect(result).toBe('12345');
    });
  });
});
