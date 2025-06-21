import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false }) // Subdocument schema for each item
export class OrderItem {
  @Prop({ required: true }) productId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) price: number;
  @Prop({ required: true }) quantity: number;
  @Prop() discount?: number;
  @Prop() discountType?: 'flat' | 'percentage';
  @Prop() free?: boolean;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  total: number;

  @Prop()
  customerName?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ required: true })
  paymentType: string;

  @Prop()
  cashGiven?: number;

  @Prop()
  balance?: number;

  @Prop({ required: true, unique: true })
  invoiceId: string;

  @Prop({ required: true })
  invoiceDate: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
