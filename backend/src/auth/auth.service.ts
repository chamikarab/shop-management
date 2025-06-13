import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email });
    console.log('User from DB:', user);

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    return isMatch ? user : null;
  }

  generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      role: user.role,
      permissions: user.permissions,
      name: user.name,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async findUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }
}
