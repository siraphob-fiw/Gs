// JWT utilities moved from human-lift-training-api/src/Helpers/Security/Jwt.ts
import { createSigner, createVerifier, TokenError } from 'fast-jwt';
import { Results } from '@strengthos/shared-utils';
import { RequestContext } from '@strengthos/shared-types';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface JwtConfig {
  secret: string;
  algorithm?: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
}

export class JwtService {
  private signer: any;
  private verifier: any;
  private config: JwtConfig;

  constructor(config: JwtConfig) {
    this.config = {
      algorithm: 'HS256',
      expiresIn: '24h',
      ...config
    };

    this.signer = createSigner({
      key: this.config.secret,
      algorithm: this.config.algorithm as any,
      expiresIn: this.config.expiresIn,
      iss: this.config.issuer,
      aud: this.config.audience
    });

    this.verifier = createVerifier({
      key: this.config.secret,
      algorithms: [this.config.algorithm as any]
    });
  }

  /**
   * Generate a JWT token
   */
  public generateToken(payload: JwtPayload): Results<string> {
    try {
      const token = this.signer(payload);
      return Results.ok(token);
    } catch (error) {
      return Results.fail<string>(null, `Failed to generate token: ${error}`);
    }
  }

  /**
   * Verify and decode a JWT token
   */
  public verifyToken(token: string): Results<JwtPayload> {
    try {
      const payload = this.verifier(token) as JwtPayload;
      return Results.ok(payload);
    } catch (error) {
      if (error instanceof TokenError) {
        return Results.fail<JwtPayload>(null, `Token verification failed: ${(error as any).message}`);
      }
      return Results.fail<JwtPayload>(null, `Token verification error: ${error}`);
    }
  }

  /**
   * Extract token from Authorization header
   */
  public extractTokenFromHeader(authHeader?: string): Results<string> {
    if (!authHeader) {
      return Results.fail<string>(null, 'Authorization header is missing');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return Results.fail<string>(null, 'Invalid authorization header format');
    }

    return Results.ok(parts[1]);
  }

  /**
   * Create request context from JWT payload
   */
  public createRequestContext(payload: JwtPayload, ipAddress?: string, userAgent?: string): RequestContext {
    return {
      userId: payload.userId,
      tenantId: payload.tenantId,
      sessionId: payload.sessionId,
      ipAddress,
      userAgent,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Refresh token (generate new token with updated expiry)
   */
  public refreshToken(token: string): Results<string> {
    const verifyResult = this.verifyToken(token);
    if (!verifyResult.isOk) {
      return Results.fail<string>(null, 'Cannot refresh invalid token');
    }

    const payload = verifyResult.returnValue!;
    // Remove timing claims to generate fresh token
    const { iat, exp, ...freshPayload } = payload;
    return this.generateToken(freshPayload as JwtPayload);
  }

  /**
   * Get token expiration date
   */
  public getTokenExpiration(token: string): Results<Date> {
    try {
      const payload = this.verifier(token) as JwtPayload;
      if (!payload.exp) {
        return Results.fail<Date>(null, 'Token has no expiration claim');
      }
      
      const expirationDate = new Date(payload.exp * 1000);
      return Results.ok(expirationDate);
    } catch (error) {
      return Results.fail<Date>(null, `Failed to get token expiration: ${error}`);
    }
  }

  /**
   * Debug method to inspect token without verification
   */
  public inspectToken(token: string): Results<{ header: any; payload: any; expiration: Date | null }> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return Results.fail<{ header: any; payload: any; expiration: Date | null }>(null, 'Invalid token format');
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const expiration = payload.exp ? new Date(payload.exp * 1000) : null;

      return Results.ok({ header, payload, expiration });
    } catch (error) {
      return Results.fail<{ header: any; payload: any; expiration: Date | null }>(null, `Failed to inspect token: ${error}`);
    }
  }

  /**
   * Validate token and extract user context
   */
  public validateAndExtractContext(authHeader?: string, ipAddress?: string, userAgent?: string): Results<RequestContext> {
    const tokenResult = this.extractTokenFromHeader(authHeader);
    if (!tokenResult.isOk) {
      return Results.fail<RequestContext>(null, tokenResult.message || 'Token extraction failed');
    }

    const verifyResult = this.verifyToken(tokenResult.returnValue!);
    if (!verifyResult.isOk) {
      return Results.fail<RequestContext>(null, verifyResult.message || 'Token verification failed');
    }

    const context = this.createRequestContext(verifyResult.returnValue!, ipAddress, userAgent);
    return Results.ok(context);
  }
}

// Factory function for creating JWT service
export function createJwtService(config?: Partial<JwtConfig>): JwtService {
  const defaultConfig: JwtConfig = {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'strengthos',
    audience: process.env.JWT_AUDIENCE || 'strengthos-api'
  };

  return new JwtService({ ...defaultConfig, ...config });
}

// Singleton instance
let jwtServiceInstance: JwtService | null = null;

export function getJwtService(config?: Partial<JwtConfig>): JwtService {
  if (!jwtServiceInstance) {
    jwtServiceInstance = createJwtService(config);
  }
  return jwtServiceInstance;
}
