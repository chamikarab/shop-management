import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document & { _id: string };

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier';

export const ALL_PERMISSIONS = [
  'dashboard:access',
  'billing:access',
  'expenses:view',
  'products:view',
  'products:add',
  'products:edit',
  'products:purchase_products',
  'products:purchase_pricing',
  'products:purchasing',
  'orders:view',
  'reports:view',
  'users:view',
  'users:add',
] as const;

export type PermissionType = (typeof ALL_PERMISSIONS)[number];

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

  @Prop({ required: true, enum: ['super_admin', 'admin', 'manager', 'cashier'] })
  role: UserRole;

  @Prop({
    type: [String],
    enum: ALL_PERMISSIONS,
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
