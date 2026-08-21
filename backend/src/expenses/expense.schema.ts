import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  expenseDate: string;

  @Prop({ default: false })
  isFixed?: boolean;

  /** YYYY-MM — first month this fixed expense applies */
  @Prop()
  effectiveFrom?: string;

  @Prop()
  notes?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
