import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

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
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 🔐 Secure password hashing before saving
UserSchema.pre<UserDocument>('save', async function (next) {
  // `this` is the document
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});
