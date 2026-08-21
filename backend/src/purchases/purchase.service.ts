import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase, PurchaseDocument, PurchaseItem } from './purchase.schema';
import { Product, ProductDocument } from '../product/product.schema';

type CreatePurchaseInput = {
  supplierName: string;
  invoiceNumber?: string;
  purchaseDate: string;
  notes?: string;
  items: PurchaseItem[];
  totalWithoutVat?: number;
  totalWithVat?: number;
};

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(data: CreatePurchaseInput) {
    const purchase = new this.purchaseModel(data);
    const saved = await purchase.save();

    for (const item of data.items) {
      const product = await this.productModel.findById(item.productId);
      if (!product) continue;

      const newStock = product.stock + item.quantity;
      await this.productModel.findByIdAndUpdate(item.productId, {
        stock: newStock,
        status: newStock > 0 ? 'Available' : 'Out of Stock',
      });
    }

    return saved;
  }

  async findAll() {
    return this.purchaseModel.find().sort({ purchaseDate: -1, createdAt: -1 }).exec();
  }

  async findById(id: string) {
    const purchase = await this.purchaseModel.findById(id).exec();
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }
}
