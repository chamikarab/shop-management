import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Allow requests from your frontend (Next.js on port 3001)
  app.enableCors({
    origin: 'http://localhost:3001',
  });

  await app.listen(3000);

  const logger = new Logger('Bootstrap');
  logger.log('✅ Application is running on: http://localhost:3000');
  logger.log('✅ Connected to MongoDB');
}
bootstrap();
