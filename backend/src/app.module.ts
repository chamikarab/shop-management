import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // 🔑 Loads .env file
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    ProductModule, // 🔗 Connects to MongoDB
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
