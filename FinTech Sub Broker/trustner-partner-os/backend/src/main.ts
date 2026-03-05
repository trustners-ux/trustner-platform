import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 5000;
  const env = process.env.NODE_ENV || 'development';

  // Enable CORS with configurable origins
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Security: Helmet for HTTP headers
  if (process.env.ENABLE_HELMET_SECURITY !== 'false') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        frameguard: { action: 'deny' },
        noSniff: true,
        xssFilter: true,
      }),
    );
  }

  // Compression middleware
  app.use(compression());

  // Rate limiting
  if (process.env.ENABLE_RATE_LIMITING !== 'false') {
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health check
        return req.path === '/health';
      },
    });
    app.use('/api', limiter);
  }

  // Global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );

  // Global error filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global transform interceptor for response formatting
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger/OpenAPI Documentation
  if (process.env.ENABLE_SWAGGER_DOCS !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('Trustner Partner OS API')
      .setDescription(
        'B2B2C Fintech Distribution Platform - Complete REST API for Sub-Brokers, Clients, Commissions, and Financial Operations',
      )
      .setVersion('1.0.0')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Sub-Brokers', 'Sub-broker management and operations')
      .addTag('Clients', 'Client and portfolio management')
      .addTag('Transactions', 'Investment transactions and orders')
      .addTag('Commissions', 'Commission calculation and management')
      .addTag('Payouts', 'Payout processing and statements')
      .addTag('Dashboard', 'Analytics and reporting dashboards')
      .addTag('Compliance', 'Compliance monitoring and alerts')
      .addTag('Reports', 'Business and financial reports')
      .addTag('Notifications', 'User notifications and communications')
      .addTag('System', 'System configuration and utilities')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'jwt',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
      },
      customSiteTitle: 'Trustner Partner OS API Docs',
    });

    logger.log('Swagger documentation available at http://localhost:' + port + '/api/docs');
  }

  // Health check endpoint (before rate limiting)
  app.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.listen(port);
  logger.log(`✓ Application started on port ${port} in ${env} mode`);
  logger.log(`✓ Database: ${process.env.DATABASE_URL?.split('/').pop() || 'postgresql'}`);
  logger.log(`✓ CORS Origins: ${allowedOrigins.join(', ')}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
