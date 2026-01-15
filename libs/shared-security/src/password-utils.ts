// Password utilities moved from human-lift-training-api/src/Services/Authentications/PasswordUtils.ts
import * as bcrypt from 'bcrypt';
import { Results } from '@strengthos/shared-utils';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export interface PasswordConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  saltRounds: number;
}

export class PasswordUtils {
  private static readonly DEFAULT_CONFIG: PasswordConfig = {
    minLength: 6,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12
  };

  private config: PasswordConfig;

  constructor(config?: Partial<PasswordConfig>) {
    this.config = { ...PasswordUtils.DEFAULT_CONFIG, ...config };
  }

  /**
   * Hash a password using bcrypt
   */
  public async hashPassword(password: string): Promise<Results<{ hashedPassword: string; salt: string } | null>> {
    try {
      const salt = await bcrypt.genSalt(this.config.saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      return Results.ok({ hashedPassword, salt });
    } catch (error) {
      return Results.fail(null, `Failed to hash password: ${error}`);
    }
  }

  /**
   * Verify a password against its hash
   */
  public async verifyPassword(password: string, hashedPassword: string): Promise<Results<boolean>> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return Results.ok(isValid);
    } catch (error) {
      return Results.fail<boolean>(null, `Failed to verify password: ${error}`);
    }
  }

  /**
   * Validate password strength and requirements
   */
  public validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.config.minLength) {
      errors.push(`Password must be at least ${this.config.minLength} characters long`);
    } else {
      score += Math.min(password.length * 2, 20); // Max 20 points for length
    }

    // Uppercase check
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 10;
    }

    // Lowercase check
    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    // Numbers check
    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 10;
    }

    // Special characters check
    if (this.config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Additional complexity checks
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20); // Max 20 points for character diversity

    // Common patterns penalty
    if (this.hasCommonPatterns(password)) {
      score -= 20;
      errors.push('Password contains common patterns and may be easily guessed');
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 40) {
      strength = 'weak';
    } else if (score < 70) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score: Math.max(0, Math.min(100, score))
    };
  }

  /**
   * Generate a secure random password
   */
  public generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = '';
    let password = '';

    // Ensure at least one character from each required set
    if (this.config.requireUppercase) {
      charset += uppercase;
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
    }
    
    if (this.config.requireLowercase) {
      charset += lowercase;
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
    }
    
    if (this.config.requireNumbers) {
      charset += numbers;
      password += numbers[Math.floor(Math.random() * numbers.length)];
    }
    
    if (this.config.requireSpecialChars) {
      charset += specialChars;
      password += specialChars[Math.floor(Math.random() * specialChars.length)];
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password needs to be rehashed (e.g., salt rounds changed)
   */
  public async needsRehash(hashedPassword: string): Promise<boolean> {
    try {
      // Extract current salt rounds from hash
      const currentRounds = parseInt(hashedPassword.split('$')[2]);
      return currentRounds !== this.config.saltRounds;
    } catch (error) {
      // If we can't parse the hash, assume it needs rehashing
      return true;
    }
  }

  /**
   * Check for common password patterns
   */
  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /(.)\\1{2,}/, // Repeated characters (aaa, 111, etc.)
      /^(.)\\1*$/, // All same character
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Estimate time to crack password (simplified)
   */
  public estimateCrackTime(password: string): string {
    const charset = this.getCharsetSize(password);
    const combinations = Math.pow(charset, password.length);
    
    // Assume 1 billion attempts per second
    const secondsToCrack = combinations / (2 * 1000000000);
    
    if (secondsToCrack < 60) {
      return 'Less than a minute';
    } else if (secondsToCrack < 3600) {
      return `${Math.round(secondsToCrack / 60)} minutes`;
    } else if (secondsToCrack < 86400) {
      return `${Math.round(secondsToCrack / 3600)} hours`;
    } else if (secondsToCrack < 31536000) {
      return `${Math.round(secondsToCrack / 86400)} days`;
    } else {
      return `${Math.round(secondsToCrack / 31536000)} years`;
    }
  }

  private getCharsetSize(password: string): number {
    let size = 0;
    
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/\d/.test(password)) size += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) size += 32;
    
    return size;
  }
}

// Factory function
export function createPasswordUtils(config?: Partial<PasswordConfig>): PasswordUtils {
  return new PasswordUtils(config);
}

// Singleton instance
let passwordUtilsInstance: PasswordUtils | null = null;

export function getPasswordUtils(config?: Partial<PasswordConfig>): PasswordUtils {
  if (!passwordUtilsInstance) {
    passwordUtilsInstance = createPasswordUtils(config);
  }
  return passwordUtilsInstance;
}
