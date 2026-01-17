import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';

let server: any;

async function createServer() {
  if (server) return server;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    index: 'index.html',
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: [
      'https://my-journals-with-react-js.vercel.app',
      'http://localhost:5173',
      'http://localhost:*',
      'https://*.vercel.app',
    ],
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('My Journals API')
    .setDescription('My Journals Management System')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: false,
    },
  });
  
  console.log('Swagger documentation available at /api');

  await app.init();

  server = app.getHttpAdapter().getInstance();
  return server;
}

/**
 * Vercel entry
 */
export default async function handler(req: Request, res: Response) {
  const server = await createServer();
  return server(req, res);
}

/**
 * Local dev
 */
if (!process.env.VERCEL) {
  createServer().then(() => {
    server.listen(3000);
    console.log('🚀 Local server ready');
  });
}
