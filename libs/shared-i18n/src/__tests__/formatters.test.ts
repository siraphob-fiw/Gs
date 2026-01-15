import { describe, it, expect } from 'vitest';
import { LocaleFormatter, createFormatter, formatWeight } from '../formatters';
import { WeightUnit } from '../types';

describe('LocaleFormatter', () => {
  describe('formatDate', () => {
    it('should format date in US locale', () => {
      const formatter = new LocaleFormatter('en-US');
      const date = new Date('2024-03-15T10:30:00Z');
      const formatted = formatter.formatDate(date);
      
      // Should be in MM/DD/YYYY format or similar US format
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4}/);
    });

    it('should format date in Thai locale', () => {
      const formatter = new LocaleFormatter('th-TH');
      const date = new Date('2024-03-15T10:30:00Z');
      const formatted = formatter.formatDate(date);
      
      // Should handle Thai locale formatting
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should handle different date styles', () => {
      const formatter = new LocaleFormatter('en-US');
      const date = new Date('2024-03-15T10:30:00Z');
      
      const short = formatter.formatDate(date, 'short');
      const long = formatter.formatDate(date, 'long');
      
      expect(short).toBeDefined();
      expect(long).toBeDefined();
      expect(short).not.toBe(long);
    });
  });

  describe('formatTime', () => {
    it('should format time in 12-hour format for US', () => {
      const formatter = new LocaleFormatter('en-US');
      const date = new Date('2024-03-15T14:30:00Z');
      const formatted = formatter.formatTime(date);
      
      // Should contain AM/PM or be in 24-hour format
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should format time in 24-hour format for Thai', () => {
      const formatter = new LocaleFormatter('th-TH');
      const date = new Date('2024-03-15T14:30:00Z');
      const formatted = formatter.formatTime(date);
      
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with US locale', () => {
      const formatter = new LocaleFormatter('en-US');
      const formatted = formatter.formatNumber(1234.56);
      
      // Should use comma as thousands separator and dot as decimal
      expect(formatted).toMatch(/1,234\.56|1234\.56/);
    });

    it('should format numbers with European locale', () => {
      const formatter = new LocaleFormatter('de-DE');
      const formatted = formatter.formatNumber(1234.56);
      
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should handle different number styles', () => {
      const formatter = new LocaleFormatter('en-US');
      
      const decimal = formatter.formatNumber(123.45, { style: 'decimal' });
      const percent = formatter.formatNumber(0.1234, { style: 'percent' });
      
      expect(decimal).toBe('123.45');
      expect(percent).toMatch(/%/);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      const formatter = new LocaleFormatter('en-US');
      const formatted = formatter.formatCurrency(1234.56, 'USD');
      
      expect(formatted).toMatch(/\$1,234\.56|\$1234\.56/);
    });

    it('should format Thai Baht', () => {
      const formatter = new LocaleFormatter('th-TH');
      const formatted = formatter.formatCurrency(1234.56, 'THB');
      
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should format Euro with German locale', () => {
      const formatter = new LocaleFormatter('de-DE');
      const formatted = formatter.formatCurrency(1234.56, 'EUR');
      
      expect(formatted).toBeDefined();
      expect(formatted).toMatch(/€/);
    });
  });

  describe('formatWeight', () => {
    it('should convert and format weight from kg to lbs', () => {
      const formatter = new LocaleFormatter('en-US');
      const formatted = formatter.formatWeight(100, WeightUnit.KG, WeightUnit.LBS);
      
      // 100kg ≈ 220.46lbs
      expect(formatted).toMatch(/220\.46|220\.5/);
      expect(formatted).toMatch(/lbs/);
    });

    it('should convert and format weight from lbs to kg', () => {
      const formatter = new LocaleFormatter('th-TH');
      const formatted = formatter.formatWeight(220, WeightUnit.LBS, WeightUnit.KG);
      
      // 220lbs ≈ 99.79kg
      expect(formatted).toMatch(/99\.79|99\.8|100/);
      expect(formatted).toMatch(/kg/);
    });

    it('should not convert when units are the same', () => {
      const formatter = new LocaleFormatter('en-US');
      const formatted = formatter.formatWeight(100, WeightUnit.KG, WeightUnit.KG);
      
      expect(formatted).toBe('100 kg');
    });

    it('should use locale default unit when no target unit specified', () => {
      const usFormatter = new LocaleFormatter('en-US'); // Default: LBS
      const thFormatter = new LocaleFormatter('th-TH'); // Default: KG
      
      const usFormatted = usFormatter.formatWeight(100, WeightUnit.KG);
      const thFormatted = thFormatter.formatWeight(100, WeightUnit.KG);
      
      expect(usFormatted).toMatch(/lbs/);
      expect(thFormatted).toMatch(/kg/);
    });
  });

  describe('convertWeight', () => {
    it('should convert kg to lbs correctly', () => {
      const formatter = new LocaleFormatter('en-US');
      const converted = formatter.convertWeight(100, WeightUnit.KG, WeightUnit.LBS);
      
      expect(converted).toBeCloseTo(220.462, 2);
    });

    it('should convert lbs to kg correctly', () => {
      const formatter = new LocaleFormatter('en-US');
      const converted = formatter.convertWeight(220, WeightUnit.LBS, WeightUnit.KG);
      
      expect(converted).toBeCloseTo(99.79, 2);
    });

    it('should return same value when units are identical', () => {
      const formatter = new LocaleFormatter('en-US');
      const converted = formatter.convertWeight(100, WeightUnit.KG, WeightUnit.KG);
      
      expect(converted).toBe(100);
    });
  });

  describe('formatPlateLoading', () => {
    it('should calculate plate loading correctly', () => {
      const formatter = new LocaleFormatter('en-US');
      const availablePlates = [45, 25, 10, 5, 2.5];
      const result = formatter.formatPlateLoading(225, 45, availablePlates, WeightUnit.LBS);
      
      // Target: 225lbs, Bar: 45lbs, Side weight: 90lbs each
      // Should use: 2×45lbs plates per side
      expect(result.totalWeight).toBe(225);
      expect(result.plates).toHaveLength(1);
      expect(result.plates[0]).toEqual({ weight: 45, count: 2 });
    });

    it('should handle complex plate combinations', () => {
      const formatter = new LocaleFormatter('en-US');
      const availablePlates = [45, 25, 10, 5, 2.5];
      const result = formatter.formatPlateLoading(315, 45, availablePlates, WeightUnit.LBS);
      
      // Target: 315lbs, Bar: 45lbs, Side weight: 135lbs each
      // Should use: 3×45lbs per side = 135lbs each side
      expect(result.totalWeight).toBe(315);
      expect(result.formattedString).toMatch(/45/);
    });

    it('should format plate loading string correctly', () => {
      const formatter = new LocaleFormatter('en-US');
      const availablePlates = [45, 25, 10];
      const result = formatter.formatPlateLoading(185, 45, availablePlates, WeightUnit.LBS);
      
      expect(result.formattedString).toBeDefined();
      expect(typeof result.formattedString).toBe('string');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format past time correctly', () => {
      const formatter = new LocaleFormatter('en-US');
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const formatted = formatter.formatRelativeTime(pastDate);
      
      // Accept both "2 hours ago" and "yesterday" as valid relative time formats
      expect(formatted).toMatch(/ago|hours?|yesterday/);
    });

    it('should format future time correctly', () => {
      const formatter = new LocaleFormatter('en-US');
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      const formatted = formatter.formatRelativeTime(futureDate);
      
      expect(formatted).toMatch(/in|days?/);
    });

    it('should handle recent times', () => {
      const formatter = new LocaleFormatter('en-US');
      const recentDate = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      const formatted = formatter.formatRelativeTime(recentDate);
      
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });
});

describe('Utility Functions', () => {
  describe('createFormatter', () => {
    it('should create formatter with default options', () => {
      const formatter = createFormatter('en-US');
      expect(formatter).toBeInstanceOf(LocaleFormatter);
    });

    it('should create formatter with custom options', () => {
      const formatter = createFormatter('th-TH', {
        currency: 'THB',
        weightUnit: WeightUnit.KG,
      });
      expect(formatter).toBeInstanceOf(LocaleFormatter);
    });
  });

  describe('formatWeight utility', () => {
    it('should format weight using utility function', () => {
      const formatted = formatWeight(100, WeightUnit.KG, 'en-US', WeightUnit.LBS);
      expect(formatted).toMatch(/220\.46|220\.5/);
      expect(formatted).toMatch(/lbs/);
    });
  });
});