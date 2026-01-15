import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtService, JwtPayload, createJwtService, getJwtService } from '../jwt';
import { createSigner, createVerifier } from 'fast-jwt';

describe('JwtService', () => {
  let jwtService: JwtService;
  let mockSigner: any;
  let mockVerifier: any;

  beforeEach(() => {
    mockSigner = vi.fn();
    mockVerifier = vi.fn();
    
    (createSigner as any).mockReturnValue(mockSigner);
    (createVerifier as any).mockReturnValue(mockVerifier);

    jwtService = new JwtService({
      secret: 'test-secret',
      algorithm: 'HS256',
      expiresIn: '24h',
    });
  });

  describe('token generation', () => {
    it('should generate a token successfully', () => {
      const payload: JwtPayload = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        role: 'user',
      };
      
      mockSigner.mockReturnValue('mocked-jwt-token');

      const result = jwtService.generateToken(payload);

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe('mocked-jwt-token');
      expect(mockSigner).toHaveBeenCalledWith(payload);
    });

    it('should handle token generation errors', () => {
      const payload: JwtPayload = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        role: 'user',
      };
      
      mockSigner.mockImplementation(() => {
        throw new Error('Signing failed');
      });

      const result = jwtService.generateToken(payload);

      expect(result.isOk).toBe(false);
    });
  });

  describe('token verification', () => {
    it('should verify a token successfully', () => {
      const mockPayload: JwtPayload = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        role: 'user',
      };
      
      mockVerifier.mockReturnValue(mockPayload);

      const result = jwtService.verifyToken('valid-token');

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toEqual(mockPayload);
      expect(mockVerifier).toHaveBeenCalledWith('valid-token');
    });

    it('should handle token verification errors', () => {
      mockVerifier.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = jwtService.verifyToken('invalid-token');

      expect(result.isOk).toBe(false);
    });
  });

  describe('token extraction from header', () => {
    it('should extract token from valid Bearer header', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should handle missing authorization header', () => {
      const result = jwtService.extractTokenFromHeader(undefined);

      expect(result.isOk).toBe(false);
    });

    it('should handle invalid authorization header format', () => {
      const result = jwtService.extractTokenFromHeader('Invalid format');

      expect(result.isOk).toBe(false);
    });
  });

  describe('request context creation', () => {
    it('should create request context from JWT payload', () => {
      const payload: JwtPayload = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        role: 'user',
        sessionId: 'session-789',
      };

      const context = jwtService.createRequestContext(payload, '127.0.0.1', 'Mozilla/5.0');

      expect(context.userId).toBe('user-123');
      expect(context.tenantId).toBe('tenant-456');
      expect(context.sessionId).toBe('session-789');
      expect(context.ipAddress).toBe('127.0.0.1');
      expect(context.userAgent).toBe('Mozilla/5.0');
      expect(context.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('token refresh', () => {
    it('should refresh a valid token', () => {
      const originalPayload: JwtPayload = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        role: 'user',
        iat: 1234567890,
        exp: 1234567890 + 86400,
      };

      mockVerifier.mockReturnValue(originalPayload);
      mockSigner.mockReturnValue('new-refreshed-token');

      const result = jwtService.refreshToken('old-token');

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe('new-refreshed-token');
    });

    it('should fail to refresh invalid token', () => {
      mockVerifier.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = jwtService.refreshToken('invalid-token');

      expect(result.isOk).toBe(false);
    });
  });

  describe('factory functions', () => {
    it('should create JWT service using factory function', () => {
      const service = createJwtService({ secret: 'factory-secret' });
      expect(service).toBeInstanceOf(JwtService);
    });

    it('should return singleton instance', () => {
      const service1 = getJwtService();
      const service2 = getJwtService();
      expect(service1).toBe(service2);
    });
  });
});
