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
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

// Keep a cached instance of the application
let cachedServer: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe());

app.use(cookieParser());

  // Only enable Swagger in development
  if (process.env.NODE_ENV !== 'production') {
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
    // For Vercel serverless functions
    const server = app.getHttpAdapter().getInstance();
    await app.init();
    return server;
  } else {
    // For local development
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}`);
  }
}

// For Vercel serverless
if (process.env.VERCEL) {
  const server = bootstrap();
  module.exports = (req: Request, res: Response) => {
    server.then(app => {
      if (app) {
        return app(req, res);
      }
      res.status(500).send('Server not initialized');
    }).catch(err => {
      console.error('Error in serverless function:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  };
} else {
  // For local development
  bootstrap().catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
}
