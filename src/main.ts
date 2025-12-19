import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';

let server: any;

async function createServer() {
  if (server) return server;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
      'http://localhost:5173',
      'http://localhost:3000',
      'https://*.vercel.app',
    ],
    credentials: true,
  });

  // Swagger (disable in prod if you want)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('My Journals API')
      .setDescription('My Journals Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

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
