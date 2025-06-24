import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  discount?: number;

  @Prop({ enum: ['flat', 'percentage'], default: 'flat' })
  discountType?: 'flat' | 'percentage';

  @Prop({ default: false })
  free?: boolean;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  invoiceId: string;

  @Prop({ required: true })
  invoiceDate: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  total: number;

  @Prop({ default: null })
  customerName?: string;

  @Prop({ default: null })
  phoneNumber?: string;

  @Prop({ required: true })
  paymentType: string;

  @Prop({ default: null })
  cashGiven?: number;

  @Prop({ default: null })
  balance?: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
