// Encryption service moved from human-lift-training-api/src/Services/Security/EncryptionService.ts
import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac, timingSafeEqual, pbkdf2, CipherGCM, DecipherGCM } from 'crypto';
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag?: string;
  salt?: string;
}

export interface KeyDerivationOptions {
  iterations: number;
  keyLength: number;
  digest: string;
}

export class EncryptionService {
  private static readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 32
  };

  private static readonly DEFAULT_KDF_OPTIONS: KeyDerivationOptions = {
    iterations: 100000,
    keyLength: 32,
    digest: 'sha256'
  };

  private config: EncryptionConfig;
  private kdfOptions: KeyDerivationOptions;
  private logger?: ILogger;

  constructor(
    config?: Partial<EncryptionConfig>,
    kdfOptions?: Partial<KeyDerivationOptions>,
    logger?: ILogger
  ) {
    this.config = { ...EncryptionService.DEFAULT_CONFIG, ...config };
    this.kdfOptions = { ...EncryptionService.DEFAULT_KDF_OPTIONS, ...kdfOptions };
    this.logger = logger;
  }

  /**
   * Encrypt data using AES-GCM with a derived key
   */
  public async encryptWithPassword(data: string, password: string): Promise<Results<EncryptedData>> {
    try {
      const salt = randomBytes(this.config.saltLength);
      const key = await this.deriveKey(password, salt);
      const iv = randomBytes(this.config.ivLength);
      
      const cipher = createCipheriv(this.config.algorithm, key, iv);
      let tag: Buffer = Buffer.alloc(0);
      
      if (this.config.algorithm.includes('gcm')) {
        const gcmCipher = cipher as CipherGCM;
        gcmCipher.setAAD(salt); // Use salt as additional authenticated data
        
        let encrypted = gcmCipher.update(data, 'utf8', 'hex');
        encrypted += gcmCipher.final('hex');
        tag = gcmCipher.getAuthTag();
        
        const result: EncryptedData = {
          encrypted,
          iv: iv.toString('hex'),
          tag: tag.toString('hex'),
          salt: salt.toString('hex')
        };
        
        await this.logSecurityEvent('DATA_ENCRYPTED', { algorithm: this.config.algorithm });
        return Results.ok(result);
      } else {
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const result: EncryptedData = {
          encrypted,
          iv: iv.toString('hex'),
          salt: salt.toString('hex')
        };
        
        await this.logSecurityEvent('DATA_ENCRYPTED', { algorithm: this.config.algorithm });
        return Results.ok(result);
      }
      

    } catch (error) {
      await this.logSecurityEvent('ENCRYPTION_FAILED', { error: (error as any).message });
      return Results.fail<EncryptedData>(null, `Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt data using AES-GCM with a derived key
   */
  public async decryptWithPassword(encryptedData: EncryptedData, password: string): Promise<Results<string>> {
    try {
      if (!encryptedData.salt || !encryptedData.tag) {
        return Results.fail<string>(null, 'Invalid encrypted data format');
      }
      
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const key = await this.deriveKey(password, salt);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = createDecipheriv(this.config.algorithm, key, iv);
      let decrypted: string;
      
      if (this.config.algorithm.includes('gcm')) {
        const gcmDecipher = decipher as DecipherGCM;
        gcmDecipher.setAAD(salt);
        gcmDecipher.setAuthTag(tag);
        
        decrypted = gcmDecipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += gcmDecipher.final('utf8');
      } else {
        decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
      }
      
      await this.logSecurityEvent('DATA_DECRYPTED', { algorithm: this.config.algorithm });
      return Results.ok(decrypted);
    } catch (error) {
      await this.logSecurityEvent('DECRYPTION_FAILED', { error: (error as any).message });
      return Results.fail<string>(null, `Decryption failed: ${error}`);
    }
  }

  /**
   * Generate a cryptographically secure random key
   */
  public generateKey(): Buffer {
    return randomBytes(this.config.keyLength);
  }

  /**
   * Generate a secure random string
   */
  public generateRandomString(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash data using SHA-256
   */
  public hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create HMAC signature
   */
  public createHmac(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  public verifyHmac(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHmac(data, secret);
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Derive key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      pbkdf2(
        password,
        salt,
        this.kdfOptions.iterations,
        this.kdfOptions.keyLength,
        this.kdfOptions.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(event: string, metadata?: any): Promise<void> {
    if (this.logger) {
      await this.logger.info({
        message: `Security event: ${event}`,
        metadata,
        timestamp: new Date()
      });
    }
  }
}

// Factory function
export function createEncryptionService(
  config?: Partial<EncryptionConfig>,
  kdfOptions?: Partial<KeyDerivationOptions>,
  logger?: ILogger
): EncryptionService {
  return new EncryptionService(config, kdfOptions, logger);
}
