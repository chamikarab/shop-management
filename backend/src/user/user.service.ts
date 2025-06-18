import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ✅ Create new user
  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  // ✅ Get all users
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  // ✅ Get single user by ID
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ✅ Update user by ID
  async update(id: string, updateData: Partial<User>): Promise<User> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  // ✅ Delete user by ID
  async delete(id: string): Promise<User> {
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('User not found');
    return deleted;
  }
}
