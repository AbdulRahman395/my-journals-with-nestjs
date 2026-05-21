import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';
import * as net from 'net';

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
  // app.enableCors({
  //   origin: [
  //     'https://my-journals-with-react-js.vercel.app',
  //     'http://localhost:5173',
  //     'http://localhost:*',
  //     'https://*.vercel.app',
  //   ],
  //   credentials: true,
  // });

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Flutter mobile, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all localhost ports (Flutter Web, React dev)
      if (
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        return callback(null, true);
      }

      // Allow all Vercel deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  });


  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Notevia API')
    .setDescription('Notevia Management System')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: false,
    },
  });

  console.log('Swagger documentation available at /docs');

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
 * Find an available port with retry logic
 */
async function findAvailablePort(startPort: number, maxAttempts: number = 100): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const portToTry = startPort + attempt;

    const isAvailable = await new Promise<boolean>((resolve) => {
      const testServer = net.createServer();

      testServer.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });

      testServer.once('listening', () => {
        testServer.close();
        resolve(true);
      });

      testServer.listen(portToTry);
    });

    if (isAvailable) {
      return portToTry;
    }

    console.log(`Port ${portToTry} is in use, trying next port...`);
  }

  throw new Error(`Could not find an available port after ${maxAttempts} attempts (tried ports ${startPort} to ${startPort + maxAttempts - 1})`);
}

/**
 * Local dev
 */
if (!process.env.VERCEL) {
  createServer().then(async (app) => {
    const startPort = 3000;
    const availablePort = await findAvailablePort(startPort);

    app.listen(availablePort, () => {
      console.log('🚀 Local server ready');
      console.log(`🚀 Listening on http://localhost:${availablePort}`);
      console.log(`🌐 Swagger documentation available at http://localhost:${availablePort}/docs`);
    });
  });
}