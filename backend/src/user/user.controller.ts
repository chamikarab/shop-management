import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.schema';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() userData: Partial<User>) {
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
  async updateUser(@Param('id') id: string, @Body() updateData: Partial<User>) {
    const updated = await this.userService.update(id, updateData);
    if (!updated) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const deleted = await this.userService.delete(id);
    if (!deleted) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'User deleted successfully' };
  }
}
