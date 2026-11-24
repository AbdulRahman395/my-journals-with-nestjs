import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';
import * as net from 'net';

let server: any;

/**
 * Decide whether a browser origin may call this API.
 */
function isAllowedOrigin(origin: string): boolean {
  // Local development (React / Vite / Flutter Web, any port)
  if (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  ) {
    return true;
  }

  // Notevia mobile app (Capacitor web view: Android / iOS)
  if (origin === 'https://localhost' || origin === 'capacitor://localhost') {
    return true;
  }

  // Any Vercel deployment (production + previews)
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol === 'https:' && hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    // Malformed origin -> not allowed
  }

  return false;
}

async function createServer() {
  if (server) return server;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS: register first so preflight (OPTIONS) requests are answered
  // before any other middleware, pipe or guard can reject them.
  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser requests (mobile native, Postman, curl) send no Origin
      if (!origin) {
        return callback(null, true);
      }

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      // Reject cleanly (no CORS headers) instead of throwing a 500
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Timezone',
    ],
    credentials: true,
    optionsSuccessStatus: 204,
  });

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

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Notevia API')
    .setDescription('Notevia Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: false,
    },
    // Swagger UI assets are loaded from a CDN so /docs also works on Vercel
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js',
    ],
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
async function findAvailablePort(
  startPort: number,
  maxAttempts: number = 100,
): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const portToTry = startPort + attempt;

    const isAvailable = await new Promise<boolean>((resolve) => {
      const testServer = net.createServer();

      testServer.once('error', () => {
        resolve(false);
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

  throw new Error(
    `Could not find an available port after ${maxAttempts} attempts (tried ports ${startPort} to ${startPort + maxAttempts - 1})`,
  );
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
      console.log(
        `🌐 Swagger documentation available at http://localhost:${availablePort}/docs`,
      );
    });
  });
}