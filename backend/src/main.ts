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

  // ✅ Enable CORS for frontend at http://localhost:3001
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  // ✅ Automatically validate incoming request DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`✅ Backend is running at: http://localhost:${port}`);
  logger.log('✅ MongoDB connection initialized');
}

bootstrap();
