import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { expandPermissionsForAccessCheck } from '../user/permission.utils';

@Controller('api')
export class MeController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const cookieToken = req.cookies?.['access_token'];
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const token = cookieToken || headerToken;

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      const user = await this.authService.findUserById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        user: {
          _id: user._id,
          role: user.role,
          permissions: expandPermissionsForAccessCheck(user.permissions),
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('❌ Invalid token in /api/me:', error?.message || error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
