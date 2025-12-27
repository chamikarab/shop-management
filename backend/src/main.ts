// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Parse cookies from incoming requests
  app.use(cookieParser());

  // ✅ Ensure body parsing for JSON (though Nest does it by default, this ensures compatibility)
  app.use(express.json());

  // ✅ Enable CORS for frontend (allows both localhost and IP addresses)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.8.187:3000',
      'http://192.168.8.187:3001',
      /^http:\/\/localhost:\d+$/, // Allow any localhost port
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Allow any local network IP with any port
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Automatically validate incoming request DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  const logger = new Logger('Bootstrap');
  logger.log(`✅ Backend is running at: http://localhost:${port}`);
  logger.log(`✅ Backend is accessible on network at: http://0.0.0.0:${port}`);
  logger.log('✅ MongoDB connection initialized');
}

bootstrap();
