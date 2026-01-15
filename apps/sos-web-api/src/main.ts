import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import {
  swaggerConfig,
  swaggerDocumentOptions,
  swaggerSetupOptions,
} from './config/swagger.config';
import {
  createSecurityHeadersMiddleware,
  createCorsMiddleware,
  ProductionSecurityConfig,
  DevelopmentSecurityConfig,
  ProductionCorsConfig,
  DevelopmentCorsConfig,
} from './common/middleware';
import { StartupValidationService } from './config/startup-validation.service';
import { StartupHealthCheckService } from './config/startup-health-check.service';

declare const module: any;

async function bootstrap() {
  const bootstrapLogger = new Logger('Bootstrap');

  try {
    bootstrapLogger.log('🚀 Starting StrengthOS API...');

    // Create application instance
    const app = await NestFactory.create(AppModule);

    // Get configuration service and logger
    const configService = app.get(ConfigService);
    const logger = app.get('ILogger');

    // Perform startup configuration validation
    bootstrapLogger.log('🔍 Validating startup configuration...');
    const validationService = new StartupValidationService(configService);
    const validationResult =
      await validationService.validateStartupConfiguration();

    // Display validation results
    bootstrapLogger.log(
      validationService.formatValidationResults(validationResult),
    );

    // Fail fast if critical configuration errors exist
    if (!validationResult.isValid) {
      const criticalErrors = validationResult.errors.filter(
        (e) => e.severity === 'critical',
      );
      if (criticalErrors.length > 0) {
        bootstrapLogger.error(
          '💥 Application startup aborted due to critical configuration errors.',
        );
        bootstrapLogger.error(
          'Please fix the configuration issues above and restart the application.',
        );
        process.exit(1);
      }
    }

    // Perform startup health checks
    bootstrapLogger.log('🏥 Performing startup health checks...');
    const healthCheckService = new StartupHealthCheckService(configService);
    const healthResult = await healthCheckService.performStartupHealthChecks();

    // Display health check results
    bootstrapLogger.log(
      healthCheckService.formatHealthCheckResults(healthResult),
    );

    // Fail fast if critical services are unhealthy
    if (healthResult.overall === 'unhealthy') {
      const criticalFailures = healthResult.checks.filter(
        (check) =>
          ['database', 'application'].includes(check.service) &&
          check.status === 'unhealthy',
      );

      if (criticalFailures.length > 0) {
        bootstrapLogger.error(
          '💥 Application startup aborted due to critical service failures.',
        );
        bootstrapLogger.error(
          'Please ensure all required services are available and properly configured.',
        );
        process.exit(1);
      }
    }

    // Log successful startup validation
    if (validationResult.isValid && healthResult.overall !== 'unhealthy') {
      bootstrapLogger.log(
        '✅ Startup validation and health checks completed successfully',
      );
      if (healthResult.overall === 'degraded') {
        bootstrapLogger.warn(
          '⚠️  Some services are degraded but application can continue',
        );
      }
    }

    const isProduction = configService.get('NODE_ENV') === 'production';

    // Increase body parser limit for large payloads (e.g., base64 images in page builder)
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));

    // Compression middleware with optimized settings
    app.use(
      compression({
        filter: (req, res) => {
          // Don't compress responses with this request header
          if (req.headers['x-no-compression']) {
            return false;
          }
          // Fallback to standard filter function
          return compression.filter(req, res);
        },
        level: 6, // Balanced compression level
        threshold: 1024, // Only compress responses larger than 1KB
        memLevel: 8, // Memory usage optimization
      }),
    );

    // Custom security headers middleware
    const securityConfig = isProduction
      ? ProductionSecurityConfig
      : DevelopmentSecurityConfig;
    const securityHeadersMiddleware =
      createSecurityHeadersMiddleware(securityConfig);
    app.use(securityHeadersMiddleware.use.bind(securityHeadersMiddleware));

    // Custom CORS middleware
    const corsConfig = isProduction
      ? ProductionCorsConfig
      : DevelopmentCorsConfig;
    const corsMiddleware = createCorsMiddleware(logger, corsConfig);
    app.use(corsMiddleware.use.bind(corsMiddleware));

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Performance monitoring interceptors
    // const performanceInterceptor = app.get(PerformanceInterceptor);
    // const queryProfilerInterceptor = app.get(QueryProfilerInterceptor);
    // app.useGlobalInterceptors(
    //   performanceInterceptor as any,
    //   queryProfilerInterceptor as any,
    // );

    // API prefix
    app.setGlobalPrefix('api/v1');

    // Swagger documentation
    const document = SwaggerModule.createDocument(
      app as any,
      swaggerConfig,
      swaggerDocumentOptions,
    );
    SwaggerModule.setup('api/docs', app as any, document, swaggerSetupOptions);
    app.getHttpAdapter().get('/openapi.json', (req, res) => {
      res.json(document);
    });
    // Start server
    const port = configService.get('PORT', 3000);
    await app.listen(port);

    if (configService.get('NODE_ENV') === 'development') {
      if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
      }
    }

    bootstrapLogger.log(
      `🚀 StrengthOS API is running on: http://localhost:${port}`,
    );
    bootstrapLogger.log(
      `📚 Swagger documentation: http://localhost:${port}/api/docs`,
    );
  } catch (error) {
    bootstrapLogger.error('💥 Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
