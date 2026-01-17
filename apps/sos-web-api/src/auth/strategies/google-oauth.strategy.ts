import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleOAuthStrategy.name);

  constructor(private configService: ConfigService) {
    const apiUrl = (process.env.API_URL || '').replace(/\/$/, ''); // Remove trailing slash
    let callbackURL = '';
    if (process.env.NODE_ENV === 'development') {
      callbackURL = `http://localhost:3001/api/v1/auth/google/callback`;
    } else {
      callbackURL = `${apiUrl}/openapi/api/v1/auth/google/callback`;
    }

    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret =
      configService.get<string>('GOOGLE_CLIENT_SECRET') || '';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true, // Enable passing request to validate
    });

    this.logger.log('Google OAuth Strategy initialized');
    this.logger.log(`Callback URL: ${callbackURL}`);
    this.logger.log(`Client ID: ${clientID ? 'Set' : 'NOT SET'}`);
    this.logger.log(`Client Secret: ${clientSecret ? 'Set' : 'NOT SET'}`);

    if (!clientID || !clientSecret) {
      this.logger.warn(
        'Google OAuth credentials are missing. OAuth will not work.',
      );
    }
  }

  // Note: When passReqToCallback is true, the first parameter is the request object
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { id, name, emails, photos } = profile;

      if (!emails || !emails[0] || !emails[0].value) {
        return done(new Error('Email not provided by Google'), undefined);
      }

      const user = {
        googleId: id,
        email: emails[0].value.toLowerCase(),
        firstName: name?.givenName || '',
        lastName: name?.familyName || '',
        picture: photos && photos[0] ? photos[0].value : undefined,
        accessToken,
        refreshToken,
      };

      done(null, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
