import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);

  const logger = new Logger('Bootstrap');
  logger.log('✅ Application is running on: http://localhost:3000');
  logger.log('✅ Connected to MongoDB');
}
bootstrap();
