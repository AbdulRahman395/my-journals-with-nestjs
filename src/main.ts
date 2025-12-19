// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

// Cache for the server instance
let cachedServer: INestApplication;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('Starting application...');
    
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    // Enable cookie parser
    app.use(cookieParser.default());

    // Only enable Swagger in development
    if (process.env.NODE_ENV !== 'production') {
      logger.log('Initializing Swagger...');
      const config = new DocumentBuilder()
        .setTitle('My Journals API')
        .setDescription('My Journals Management System')
        .setVersion('1.0')
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'JWT',
        )
        .build();
      
      const document = SwaggerModule.createDocument(app, config, {
        include: [AppModule, UsersModule],
        extraModels: [User],
      });

      // Serve the Swagger UI
      SwaggerModule.setup('api', app, document);
      logger.log('Swagger initialized at /api');
    }
    // Enable CORS with specific configuration
    app.enableCors({
      origin: [
        'http://localhost:5173',
        'http://localhost:3001',
        'http://localhost:3000',
        'https://*.vercel.app'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    });

    const port = process.env.PORT || 3000;
    
    if (process.env.VERCEL) {
      logger.log('Running in Vercel environment');
      await app.init();
      return app;
    } else {
      // For local development
      await app.listen(port);
      logger.log(`🚀 Application is running on: http://localhost:${port}`);
      return app;
    }
  } catch (error) {
    logger.error('Error during application startup', error);
    throw error;
  }
}

// For Vercel serverless environment
if (process.env.VERCEL) {
  const logger = new Logger('VercelServerless');
  
  // Initialize the server when the function is first called
  const serverPromise = bootstrap().catch(error => {
    logger.error('Failed to initialize application', error);
    throw error;
  });

  // Export the serverless function
  module.exports = async (req: Request, res: Response) => {
    try {
      const app = await serverPromise;
      const httpAdapter = app.getHttpAdapter();
      return httpAdapter.getInstance()(req, res);
    } catch (error) {
      logger.error('Error in serverless function:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
      });
    }
  };
} else {
  // For local development
  bootstrap().catch(error => {
    const logger = new Logger('LocalBootstrap');
    logger.error('Failed to start application', error);
    process.exit(1);
  });
}
