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
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import cookieParser from 'cookie-parser';


import { UsersModule } from './users/users.module';
import { ConfigService } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { Request, Response } from 'express';

// Keep a cached instance of the application
let cachedServer: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  app.use(cookieParser());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Busy Fool API')
    .setDescription('Coffee Shop Management System')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-master-token' },
      'MasterToken',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [
      AppModule,
      UsersModule,
    ],
    extraModels: [User],
  });

  // Serve the Swagger JSON specification
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api-json', (req: Request, res: Response) => {
    res.json(document);
  });

  // Serve the Swagger UI
  // Serve the static swagger.html file
  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  const configService = app.get(ConfigService);
  console.log(`DB_HOST: ${configService.get('DB_HOST')}`);
  console.log(`DB_PORT: ${configService.get('DB_PORT')}`);
  console.log(`DB_USER: ${configService.get('DB_USER')}`);
  console.log(`DB_NAME: ${configService.get('DB_NAME')}`);

  // Enable CORS with specific configuration
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:3000',
      'https://busyfoolfrontend-six.vercel.app',
      'https://*.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV}`);
  
  // Check if running in Vercel (serverless) environment
  if (process.env.VERCEL_ENV) {
    console.log('Running in Vercel environment, initializing serverless handler.');
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
    return cachedServer;
  } else {
    // Local development mode
    console.log('Attempting to start local server...');
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger UI available at: http://localhost:${port}/swagger.html`);
  }
}

// Call bootstrap for local development
if (!process.env.VERCEL_ENV) {
  bootstrap().catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
}

// Export handler for Vercel serverless
export default async (req: Request, res: Response) => {
  const server = await bootstrap();
  server(req, res);
};
