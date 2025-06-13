import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Enable CORS for frontend access
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Validate incoming requests using DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`✅ Backend is running at: http://localhost:${port}`);
  logger.log('✅ MongoDB connection initialized');
}
bootstrap();
