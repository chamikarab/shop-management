import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PurchaseDocument = Purchase & Document;

@Schema({ _id: false })
export class PurchaseItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  unitCost: number;
}

export const PurchaseItemSchema = SchemaFactory.createForClass(PurchaseItem);

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ required: true })
  supplierName: string;

  @Prop()
  invoiceNumber?: string;

  @Prop({ required: true })
  purchaseDate: string;

  @Prop()
  notes?: string;

  @Prop({ type: [PurchaseItemSchema], required: true })
  items: PurchaseItem[];

  @Prop({ default: 0 })
  totalWithoutVat?: number;

  @Prop({ default: 0 })
  totalWithVat?: number;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
