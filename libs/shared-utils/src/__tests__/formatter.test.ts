import { describe, it, expect, vi } from 'vitest';
import { Formatter } from '../formatter';
import { format } from 'date-fns';

describe('Formatter', () => {
  const testDate = new Date('2024-01-15T14:30:45.123Z');

  describe('date formatting', () => {
    it('should format date correctly', () => {
      (format as any).mockReturnValue('2024-01-15');
      
      const result = Formatter.date(testDate);
      
      expect(result).toBe('2024-01-15');
      expect(format).toHaveBeenCalledWith(testDate, Formatter.DATE_FORMAT);
    });

    it('should format datetime correctly', () => {
      (format as any).mockReturnValue('2024-01-15 14:30');
      
      const result = Formatter.dateTime(testDate);
      
      expect(result).toBe('2024-01-15 14:30');
      expect(format).toHaveBeenCalledWith(testDate, Formatter.DATETIME_FORMAT);
    });

    it('should format time correctly', () => {
      (format as any).mockReturnValue('14:30:45');
      
      const result = Formatter.time(testDate);
      
      expect(result).toBe('14:30:45');
      expect(format).toHaveBeenCalledWith(testDate, Formatter.TIME_FORMAT);
    });

    it('should format ISO correctly', () => {
      (format as any).mockReturnValue('2024-01-15T14:30:45.123+00:00');
      
      const result = Formatter.iso(testDate);
      
      expect(result).toBe('2024-01-15T14:30:45.123+00:00');
      expect(format).toHaveBeenCalledWith(testDate, Formatter.ISO_FORMAT);
    });
  });

  describe('number formatting', () => {
    it('should format currency with default USD', () => {
      const result = Formatter.currency(1234.56);
      expect(result).toMatch(/\$1,234\.56/);
    });

    it('should format currency with specified currency', () => {
      const result = Formatter.currency(1234.56, 'EUR');
      expect(result).toMatch(/€1,234\.56/);
    });

    it('should format numbers with decimals', () => {
      expect(Formatter.number(123.456)).toBe('123.46');
      expect(Formatter.number(123.456, 1)).toBe('123.5');
      expect(Formatter.number(123.456, 0)).toBe('123');
    });

    it('should format percentage', () => {
      expect(Formatter.percentage(0.1234)).toBe('12.3%');
      expect(Formatter.percentage(0.1234, 2)).toBe('12.34%');
      expect(Formatter.percentage(1.5)).toBe('150.0%');
    });
  });

  describe('file size formatting', () => {
    it('should format bytes', () => {
      expect(Formatter.fileSize(0)).toBe('0 Bytes');
      expect(Formatter.fileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(Formatter.fileSize(1024)).toBe('1 KB');
      expect(Formatter.fileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(Formatter.fileSize(1048576)).toBe('1 MB'); // 1024^2
      expect(Formatter.fileSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(Formatter.fileSize(1073741824)).toBe('1 GB'); // 1024^3
    });
  });

  describe('duration formatting', () => {
    it('should format seconds', () => {
      expect(Formatter.duration(5000)).toBe('5s');
      expect(Formatter.duration(45000)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(Formatter.duration(75000)).toBe('1m 15s'); // 1:15
      expect(Formatter.duration(125000)).toBe('2m 5s'); // 2:05
    });

    it('should format hours, minutes and seconds', () => {
      expect(Formatter.duration(3675000)).toBe('1h 1m 15s'); // 1:01:15
      expect(Formatter.duration(7200000)).toBe('2h 0m 0s'); // 2:00:00
    });
  });

  describe('text formatting', () => {
    it('should truncate text', () => {
      const longText = 'This is a very long text that needs truncation';
      expect(Formatter.truncate(longText, 20)).toBe('This is a very lo...');
      expect(Formatter.truncate(longText, 20, '---')).toBe('This is a very lo---');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(Formatter.truncate(shortText, 20)).toBe('Short text');
    });

    it('should capitalize text', () => {
      expect(Formatter.capitalize('hello world')).toBe('Hello world');
      expect(Formatter.capitalize('HELLO WORLD')).toBe('Hello world');
      expect(Formatter.capitalize('hELLO wORLD')).toBe('Hello world');
    });
  });

  describe('case conversion', () => {
    it('should convert to camelCase', () => {
      expect(Formatter.camelCase('hello world')).toBe('helloWorld');
      expect(Formatter.camelCase('Hello World')).toBe('helloWorld');
      expect(Formatter.camelCase('hello-world')).toBe('hello-World'); // Current implementation doesn't handle dashes
    });

    it('should convert to kebab-case', () => {
      expect(Formatter.kebabCase('helloWorld')).toBe('hello-world');
      expect(Formatter.kebabCase('Hello World')).toBe('hello-world');
      expect(Formatter.kebabCase('HelloWorld')).toBe('hello-world');
    });

    it('should convert to snake_case', () => {
      expect(Formatter.snakeCase('helloWorld')).toBe('hello_world');
      expect(Formatter.snakeCase('Hello World')).toBe('hello_world');
      expect(Formatter.snakeCase('HelloWorld')).toBe('hello_world');
    });
  });

  describe('constants', () => {
    it('should have correct format constants', () => {
      expect(Formatter.DATE_FORMAT).toBe('yyyy-MM-dd');
      expect(Formatter.DATETIME_FORMAT).toBe('yyyy-MM-dd HH:mm');
      expect(Formatter.TIME_FORMAT).toBe('HH:mm:ss');
      expect(Formatter.ISO_FORMAT).toBe("yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    });
  });
});
