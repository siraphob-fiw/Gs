import { registerAs } from '@nestjs/config';

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: number;
    refreshSecret: string;
    refreshExpiresIn: number;
  };
  bcrypt: {
    rounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  ssl: {
    certPath?: string;
    keyPath?: string;
    forceHttps: boolean;
  };
}

export default registerAs(
  'security',
  (): SecurityConfig => ({
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-jwt-secret-key-not-for-production',
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10),
      refreshSecret:
        process.env.JWT_REFRESH_SECRET ||
        'dev-refresh-secret-key-not-for-production',
      refreshExpiresIn: parseInt(
        process.env.JWT_REFRESH_EXPIRES_IN || '2592000',
        10,
      ),
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    ssl: {
      certPath: process.env.SSL_CERT_PATH,
      keyPath: process.env.SSL_KEY_PATH,
      forceHttps: process.env.FORCE_HTTPS === 'true',
    },
  }),
);
