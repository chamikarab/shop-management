import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(product: Partial<Product>) {
    // Check if product already exists by name (case-insensitive)
    const existing = await this.productModel.findOne({
      name: { $regex: new RegExp(`^${product.name}$`, 'i') },
    });

    if (existing) {
      // Increase stock instead of creating duplicate
      existing.stock += product.stock || 0;
      return existing.save();
    }

    // Create new product
    return this.productModel.create(product);
  }

  findAll() {
    return this.productModel.find().exec();
  }

  findOne(id: string) {
    return this.productModel.findById(id).exec();
  }

  update(id: string, update: Partial<Product>) {
    return this.productModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  delete(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
