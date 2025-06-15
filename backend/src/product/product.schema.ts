import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  category: string;

  @Prop({ required: true })
  size: string; // e.g., "750ml", "500ml"

  @Prop({ required: true })
  packaging: string; // e.g., "Bottle", "Can"

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  stock: number;

  @Prop()
  status: 'Available' | 'Out of Stock' | 'Unavailable';
}

export const ProductSchema = SchemaFactory.createForClass(Product);
