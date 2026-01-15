import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@strengthos/shared-security';
import { AuthenticationService } from '@strengthos/shared-security';
import { Request, Response } from 'express';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('JwtService') private readonly jwtService: JwtService,
    @Inject('AuthenticationService')
    private readonly authenticationService: AuthenticationService,
    private readonly reflector: Reflector,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Extract refresh token from request headers
   */
  private extractRefreshToken(request: Request): string | null {
    const refreshHeader =
      (request.headers['x-refresh-token'] as string) ||
      (request.headers['x-refresh-token'.toLowerCase()] as string);
    if (refreshHeader) {
      return refreshHeader;
    }
    // Optionally check cookies or other sources here
    return null;
  }

  /**
   * Attempt to refresh the access token using a refresh token
   */
  private async attemptTokenRefresh(
    refreshToken: string,
    request: Request,
    response: Response,
  ): Promise<{ success: boolean; newAccessToken?: string }> {
    try {
      const refreshRequest = {
        refreshToken,
        ipAddress:
          request.ip ||
          (request.connection && request.connection.remoteAddress) ||
          undefined,
        userAgent: request.get('User-Agent') || undefined,
      };

      const result =
        await this.authenticationService.refreshToken(refreshRequest);

      if (!result.isOk || !result.returnValue) {
        return { success: false };
      }

      const authResponse = result.returnValue;
      response.setHeader('X-New-Access-Token', authResponse.accessToken);
      response.setHeader('X-New-Refresh-Token', authResponse.refreshToken);
      return { success: true, newAccessToken: authResponse.accessToken };
    } catch (error) {
      await this.databaseService.knex('logs').insert({
        log_level: 'ERROR',
        short_message: 'Token refresh error',
        url: request.path,
        full_message: (error as any)?.message || String(error),
      });
      return { success: false };
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const authHeader = request.headers.authorization;

    try {
      // Step 1: Try extracting the token from Authorization header
      const tokenResult = this.jwtService.extractTokenFromHeader(authHeader);
      if (!tokenResult.isOk || !tokenResult.returnValue) {
        throw new UnauthorizedException('Invalid authorization header');
      }

      let accessToken = tokenResult.returnValue!;
      let verifyResult = this.jwtService.verifyToken(accessToken);

      // Step 2: If token invalid and expired, try to refresh
      if (
        !verifyResult.isOk &&
        verifyResult.message?.toLowerCase().includes('expired')
      ) {
        const refreshToken = this.extractRefreshToken(request);

        if (refreshToken) {
          const refreshOutcome = await this.attemptTokenRefresh(
            refreshToken,
            request,
            response,
          );

          if (refreshOutcome.success && refreshOutcome.newAccessToken) {
            accessToken = refreshOutcome.newAccessToken;
            verifyResult = this.jwtService.verifyToken(accessToken);
            // Optionally: Allow processing to continue, or you can re-fetch the context below
          } else {
            throw new UnauthorizedException('Refresh token invalid or expired');
          }
        } else {
          throw new UnauthorizedException(
            'Expired token and no refresh token provided',
          );
        }
      }

      // Step 3: Validate the session for the (possibly refreshed) access token
      const sessionResult =
        await this.authenticationService.validateSession(accessToken);

      if (!sessionResult.isOk || !sessionResult.returnValue) {
        throw new UnauthorizedException('Session validation failed');
      }

      (request as any).user = sessionResult.returnValue!;
      return true;
    } catch (error) {
      await this.databaseService.knex('logs').insert({
        log_level: 'ERROR',
        short_message: 'JWT authentication error',
        url: request.path,
        full_message: (error as any)?.message || String(error),
      });

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
