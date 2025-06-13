import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('api')
export class MeController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    // ✅ Try to get token from either cookie or Authorization header
    const cookieToken = req.cookies?.['access_token'];
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const token = cookieToken || headerToken;

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      return { user }; // You can limit returned fields here if needed
    } catch (error) {
      console.error('❌ Invalid token in /api/me:', error?.message || error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
