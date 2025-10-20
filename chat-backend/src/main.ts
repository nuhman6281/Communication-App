import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import morgan from 'morgan';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  const corsOrigins = configService.get('CORS_ORIGIN')?.split(',') || '*';
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix (without version - versioning will add it)
  const apiPrefix = configService.get('API_PREFIX') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // API Versioning (adds /v1, /v2, etc.)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Logging
  if (configService.get('NODE_ENV') !== 'test') {
    app.use(morgan('combined'));
  }

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global guards - Require authentication by default
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Chat API')
    .setDescription('Comprehensive Enterprise Chat Application API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('messages', 'Messaging endpoints')
    .addTag('conversations', 'Conversation endpoints')
    .addTag('groups', 'Group management endpoints')
    .addTag('channels', 'Channel endpoints')
    .addTag('calls', 'Video/Audio call endpoints')
    .addTag('media', 'Media/File endpoints')
    .addTag('workspaces', 'Workspace endpoints')
    .addTag('notifications', 'Notification endpoints')
    .addTag('stories', 'Story endpoints')
    .addTag('presence', 'Presence/Status endpoints')
    .addTag('search', 'Search endpoints')
    .addTag('ai', 'AI features endpoints')
    .addTag('subscriptions', 'Subscription/Billing endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
