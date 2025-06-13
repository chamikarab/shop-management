import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('api')
export class MeController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const cookieToken = req.cookies?.['access_token'];
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const token = cookieToken || headerToken;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      return { user };
    } catch (err) {
      console.error('JWT verify error:', err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
