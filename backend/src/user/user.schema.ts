import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document & { _id: string };

export type UserRole = 'admin' | 'cashier' | 'manager';

export type PermissionType =
  | 'dashboard:access'
  | 'products:view'
  | 'products:add'
  | 'products:purchasing'
  | 'users:view'
  | 'users:add'
  | 'orders:view';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  nic: string;

  @Prop({ required: true, enum: ['admin', 'cashier', 'manager'] })
  role: UserRole;

  @Prop({
    type: [String],
    enum: [
      'dashboard:access',
      'products:view',
      'products:add',
      'products:purchasing',
      'users:view',
      'users:add',
      'orders:view',
    ],
    default: [],
  })
  permissions: PermissionType[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// 🔐 Hash password before saving
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});
