import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [MeController],
})
export class MeModule {}
