import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordUtils, createPasswordUtils, getPasswordUtils } from '../password-utils';
import * as bcrypt from 'bcrypt';

describe('PasswordUtils', () => {
  let passwordUtils: PasswordUtils;

  beforeEach(() => {
    passwordUtils = new PasswordUtils();
  });

  describe('password hashing', () => {
    it('should hash password successfully', async () => {
      (bcrypt.hash as any).mockResolvedValue('hashed-password');

      const result = await passwordUtils.hashPassword('plaintext-password');

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe('hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext-password', 12);
    });

    it('should handle hashing errors', async () => {
      (bcrypt.hash as any).mockRejectedValue(new Error('Hashing failed'));

      const result = await passwordUtils.hashPassword('plaintext-password');

      expect(result.isOk).toBe(false);
    });
  });

  describe('password verification', () => {
    it('should verify password successfully', async () => {
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await passwordUtils.verifyPassword('plaintext', 'hashed-password');

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('plaintext', 'hashed-password');
    });

    it('should return false for invalid password', async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await passwordUtils.verifyPassword('wrong-password', 'hashed-password');

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe(false);
    });

    it('should handle verification errors', async () => {
      (bcrypt.compare as any).mockRejectedValue(new Error('Verification failed'));

      const result = await passwordUtils.verifyPassword('plaintext', 'hashed-password');

      expect(result.isOk).toBe(false);
    });
  });

  describe('password validation', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongP@ssw0rd123!';

      const result = passwordUtils.validatePassword(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('strong');
      expect(result.score).toBeGreaterThan(70);
    });

    it('should reject weak passwords', () => {
      const weakPassword = '123';

      const result = passwordUtils.validatePassword(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBe('weak');
    });

    it('should identify medium strength password', () => {
      const mediumPassword = 'Password123';

      const result = passwordUtils.validatePassword(mediumPassword);

      expect(result.strength).toBe('medium');
    });

    it('should detect common patterns', () => {
      const commonPassword = 'password123';

      const result = passwordUtils.validatePassword(commonPassword);

      expect(result.errors).toContain('Password contains common patterns and may be easily guessed');
    });
  });

  describe('password generation', () => {
    it('should generate secure password with default length', () => {
      const password = passwordUtils.generateSecurePassword();

      expect(password).toHaveLength(16);
      expect(/[A-Z]/.test(password)).toBe(true); // uppercase
      expect(/[a-z]/.test(password)).toBe(true); // lowercase
      expect(/\d/.test(password)).toBe(true); // numbers
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true); // special chars
    });

    it('should generate password with custom length', () => {
      const password = passwordUtils.generateSecurePassword(20);

      expect(password).toHaveLength(20);
    });
  });

  describe('password rehashing', () => {
    it('should detect when password needs rehashing', async () => {
      // Mock hash with different salt rounds
      const oldHash = '$2b$10$oldHashValue';

      const needsRehash = await passwordUtils.needsRehash(oldHash);

      expect(needsRehash).toBe(true); // Default is 12 rounds, hash has 10
    });

    it('should detect when password does not need rehashing', async () => {
      // Mock hash with same salt rounds
      const currentHash = '$2b$12$currentHashValue';

      const needsRehash = await passwordUtils.needsRehash(currentHash);

      expect(needsRehash).toBe(false);
    });
  });

  describe('crack time estimation', () => {
    it('should estimate crack time for weak password', () => {
      const weakPassword = '123';

      const crackTime = passwordUtils.estimateCrackTime(weakPassword);

      expect(crackTime).toBe('Less than a minute');
    });

    it('should estimate crack time for strong password', () => {
      const strongPassword = 'VeryStr0ng!P@ssw0rd#2024$';

      const crackTime = passwordUtils.estimateCrackTime(strongPassword);

      expect(crackTime).toContain('years');
    });
  });

  describe('factory functions', () => {
    it('should create password utils using factory function', () => {
      const utils = createPasswordUtils({ minLength: 10 });
      expect(utils).toBeInstanceOf(PasswordUtils);
    });

    it('should return singleton instance', () => {
      const utils1 = getPasswordUtils();
      const utils2 = getPasswordUtils();
      expect(utils1).toBe(utils2);
    });
  });
});
