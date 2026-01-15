import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

// Shared module imports
import { DatabaseModule } from './database/database.module';
import { SharedCacheModule } from './cache/cache.module';
import { LoggingModule } from './logging/logging.module';
import { SecurityModule } from './security/security.module';
import { SharedServicesService } from './services/shared-services.service';
import { SharedTestController } from './controllers/shared-test.controller';

@Global()
@Module({
  imports: [
    // Shared library modules
    DatabaseModule,
    SharedCacheModule,
    LoggingModule,
    SecurityModule,

    // JWT Module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') as any,
        },
      }),
      inject: [ConfigService],
    }),

    // Passport Module
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Cache Module - Redis with @keyv/redis (compatible with cache-manager v7+)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        Logger.log('[CacheModule] 🔧 Initializing CACHE_MANAGER with Redis...');

        const ttlMs = configService.get<number>('REDIS_TTL', 600) * 1000; // Convert to milliseconds
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisDb = configService.get<number>('REDIS_DB', 0);
        const redisPassword = configService.get<string>('REDIS_PASSWORD', '');

        // Build Redis URL
        const authPart = redisPassword ? `:${redisPassword}@` : '';
        const redisUrl = `redis://${authPart}${redisHost}:${redisPort}/${redisDb}`;

        Logger.log(
          `[CacheModule] 🔌 Connecting to Redis at ${redisHost}:${redisPort} db=${redisDb}`,
        );

        // Create Keyv instance with Redis store
        // Set empty namespace to disable the default 'keyv' prefix
        const keyvRedis = new KeyvRedis(redisUrl);
        const keyv = new Keyv({ store: keyvRedis, namespace: '' });

        keyv.on('error', (err) => {
          Logger.error(
            `[CacheModule] ❌ Redis connection error: ${err.message}`,
          );
        });

        Logger.log(
          `[CacheModule] ✅ CACHE_MANAGER connected to Redis successfully (db=${redisDb}, TTL=${ttlMs / 1000}s)`,
        );

        return {
          stores: [keyv],
          ttl: ttlMs,
        };
      },
      inject: [ConfigService],
    }),

    // Note: ThrottlerModule removed due to version conflicts
    // Rate limiting is handled by custom middleware instead
  ],
  controllers: [SharedTestController],
  providers: [SharedServicesService],
  exports: [
    // Shared library modules
    DatabaseModule,
    SharedCacheModule,
    LoggingModule,
    SecurityModule,

    // NestJS modules
    JwtModule,
    PassportModule,
    CacheModule,

    // Services
    SharedServicesService,
  ],
})
export class SharedModule {}
