import validator from 'validator';
import { Results } from '@strengthos/shared-utils';

// Common validation utilities that don't require schemas
export class ValidationUtils {
  
  // Email validation utilities
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    return validator.isEmail(email);
  }

  static normalizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }
    
    const normalized = validator.normalizeEmail(email, {
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: false,
      yahoo_lowercase: true,
      yahoo_remove_subaddress: false,
      icloud_lowercase: true,
      icloud_remove_subaddress: false
    });
    
    return normalized || email.toLowerCase().trim();
  }

  static getEmailDomain(email: string): string {
    if (!this.isValidEmail(email)) {
      return '';
    }
    return email.split('@')[1].toLowerCase();
  }

  static isBusinessEmail(email: string): boolean {
    if (!this.isValidEmail(email)) {
      return false;
    }

    const domain = this.getEmailDomain(email);
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'me.com', 'mac.com',
      'live.com', 'msn.com', 'ymail.com', 'rocketmail.com'
    ];

    return !personalDomains.includes(domain);
  }

  // Username validation utilities
  static isValidUsername(username: string): boolean {
    if (!username || typeof username !== 'string') {
      return false;
    }

    // Username must be 3-30 characters, alphanumeric with underscores and hyphens
    return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
  }

  static sanitizeUsername(username: string): string {
    if (!username || typeof username !== 'string') {
      return '';
    }

    return username
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 30);
  }

  static generateUsername(firstName: string, lastName: string, suffix?: string): string {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = suffix ? `${base}${suffix}` : base;
    return this.sanitizeUsername(username);
  }

  // Password validation utilities
  static isStrongPassword(password: string): boolean {
    if (!password || typeof password !== 'string' || password.length < 8) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  static getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
    if (!password || password.length < 6) {
      return 'weak';
    }

    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[@$!%*?&]/.test(password)) score += 1;

    // Complexity bonus
    if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 1; // Other special chars
    if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated chars

    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'strong';
    return 'very-strong';
  }

  static generatePasswordSuggestion(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@$!%*?&';

    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Phone number validation utilities
  static isValidPhone(phone: string, country?: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    return validator.isMobilePhone(phone, country as any || 'any', { strictMode: false });
  }

  static formatPhone(phone: string, format: 'international' | 'national' | 'e164' = 'international'): string {
    if (!this.isValidPhone(phone)) {
      return phone;
    }

    // Basic formatting - in a real implementation, you'd use a library like libphonenumber
    const cleaned = phone.replace(/\D/g, '');
    
    switch (format) {
      case 'e164':
        return `+${cleaned}`;
      case 'national':
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
      case 'international':
      default:
        return `+${cleaned}`;
    }
  }

  // UUID validation utilities
  static isValidUUID(uuid: string, version?: number): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }

    if (version) {
      return validator.isUUID(uuid, version as any);
    }

    return validator.isUUID(uuid);
  }

  static generateUUID(): string {
    // Simple UUID v4 generator - in production, use a proper library
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // URL validation utilities
  static isValidURL(url: string, options?: { protocols?: string[]; require_protocol?: boolean }): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    return validator.isURL(url, {
      protocols: options?.protocols || ['http', 'https'],
      require_protocol: options?.require_protocol !== false,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: false,
      host_whitelist: undefined,
      host_blacklist: undefined,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      disallow_auth: false
    });
  }

  static sanitizeURL(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  // Date validation utilities
  static isValidDate(date: any): boolean {
    if (!date) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  static isValidDateRange(startDate: Date, endDate: Date): boolean {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return false;
    }

    return startDate <= endDate;
  }

  static isValidAge(dateOfBirth: Date, minAge: number = 13, maxAge: number = 120): boolean {
    if (!this.isValidDate(dateOfBirth)) {
      return false;
    }

    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      actualAge = age - 1;
    }

    return actualAge >= minAge && actualAge <= maxAge;
  }

  // String validation utilities
  static isValidLength(str: string, min: number, max?: number): boolean {
    if (!str || typeof str !== 'string') {
      return false;
    }

    const length = str.trim().length;
    return length >= min && (max === undefined || length <= max);
  }

  static containsOnlyAllowedChars(str: string, allowedChars: string): boolean {
    if (!str || typeof str !== 'string') {
      return false;
    }

    const regex = new RegExp(`^[${allowedChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+$`);
    return regex.test(str);
  }

  static hasMinimumComplexity(str: string, requirements: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    specialChars?: string;
  }): boolean {
    if (!str || typeof str !== 'string') {
      return false;
    }

    const {
      minLength = 0,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSpecialChars = false,
      specialChars = '@$!%*?&'
    } = requirements;

    if (str.length < minLength) return false;
    if (requireUppercase && !/[A-Z]/.test(str)) return false;
    if (requireLowercase && !/[a-z]/.test(str)) return false;
    if (requireNumbers && !/\d/.test(str)) return false;
    if (requireSpecialChars && !new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(str)) return false;

    return true;
  }

  // Sanitization utilities
  static sanitizeString(input: string, options: {
    trim?: boolean;
    toLowerCase?: boolean;
    removeSpecialChars?: boolean;
    allowedChars?: string;
    maxLength?: number;
  } = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }

    if (options.removeSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s-]/g, '');
    }

    if (options.allowedChars) {
      const regex = new RegExp(`[^${options.allowedChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g');
      sanitized = sanitized.replace(regex, '');
    }

    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  static escapeHtml(unsafe: string): string {
    if (!unsafe || typeof unsafe !== 'string') {
      return '';
    }

    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static stripHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return html.replace(/<[^>]*>/g, '');
  }

  // Validation result helpers
  static createValidationResult<T>(isValid: boolean, data?: T, errors?: string[]): Results<T> {
    if (isValid && data !== undefined) {
      return Results.ok<T>(data);
    } else {
      return Results.validationError<T>(null, errors?.join(', ') || 'Validation failed');
    }
  }

  static combineValidationResults<T>(results: Results<T>[]): Results<T[]> {
    const validResults: T[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.isOk && result.returnValue !== undefined && result.returnValue !== null) {
        validResults.push(result.returnValue as T);
      } else {
        errors.push(result.message || 'Validation failed');
      }
    }

    if (errors.length > 0) {
      return Results.validationError<T[]>(null, errors.join(', '));
    }

    return Results.ok<T[]>(validResults);
  }
}

// Export individual utility functions for convenience
export const {
  isValidEmail,
  normalizeEmail,
  getEmailDomain,
  isBusinessEmail,
  isValidUsername,
  sanitizeUsername,
  generateUsername,
  isStrongPassword,
  getPasswordStrength,
  generatePasswordSuggestion,
  isValidPhone,
  formatPhone,
  isValidUUID,
  generateUUID,
  isValidURL,
  sanitizeURL,
  isValidDate,
  isValidDateRange,
  isValidAge,
  isValidLength,
  containsOnlyAllowedChars,
  hasMinimumComplexity,
  sanitizeString,
  escapeHtml,
  stripHtml,
  createValidationResult,
  combineValidationResults
} = ValidationUtils;