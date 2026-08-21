import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './expense.schema';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(data: any): Promise<Expense> {
    const createdExpense = new this.expenseModel(data);
    return createdExpense.save();
  }

  async findAll(): Promise<Expense[]> {
    return this.expenseModel.find().sort({ expenseDate: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseModel.findById(id).exec();
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: string, data: any): Promise<Expense> {
    const updatedExpense = await this.expenseModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updatedExpense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return updatedExpense;
  }

  async remove(id: string): Promise<any> {
    const result = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return result;
  }
}
