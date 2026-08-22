import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from './user.service';
import { User, UserRole } from './user.schema';
import { sanitizePermissions } from './permission.utils';
import {
  canAssignRole,
  canCreateUsers,
  canDeleteUser,
  canUpdateUser,
} from './user-role.policy';

type Actor = { id: string; role: UserRole };

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private async getActor(req: Request): Promise<Actor> {
    const token =
      req.cookies?.['access_token'] ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      return {
        id: decoded.sub as string,
        role: decoded.role as UserRole,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Post()
  async createUser(@Req() req: Request, @Body() userData: Partial<User>) {
    const actor = await this.getActor(req);

    if (!canCreateUsers(actor.role)) {
      throw new ForbiddenException('You do not have permission to create users');
    }

    if (!userData.role || !canAssignRole(actor.role, userData.role)) {
      throw new ForbiddenException('You do not have permission to create this role');
    }

    if (userData.permissions) {
      userData.permissions = sanitizePermissions(userData.permissions);
    }

    try {
      const created = await this.userService.create(userData);
      return created;
    } catch {
      throw new HttpException('User creation failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Put(':id')
  async updateUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateData: Partial<User>,
  ) {
    const actor = await this.getActor(req);
    const target = await this.userService.findById(id);

    if (!canUpdateUser(actor.role, target.role)) {
      throw new ForbiddenException('You do not have permission to update this user');
    }

    if (updateData.role && !canAssignRole(actor.role, updateData.role)) {
      throw new ForbiddenException('You do not have permission to assign this role');
    }

    if (updateData.permissions) {
      updateData.permissions = sanitizePermissions(updateData.permissions);
    }

    const updated = await this.userService.update(id, updateData);
    if (!updated) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  @Delete(':id')
  async deleteUser(@Req() req: Request, @Param('id') id: string) {
    const actor = await this.getActor(req);
    const target = await this.userService.findById(id);

    if (!canDeleteUser(actor.role, target.role, actor.id, id)) {
      throw new ForbiddenException('You do not have permission to delete this user');
    }

    const deleted = await this.userService.delete(id);
    if (!deleted) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'User deleted successfully' };
  }
}
