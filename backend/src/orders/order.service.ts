import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { Product, ProductDocument } from '../product/product.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(orderData: {
    items: OrderItemInput[];
    total: number;
    customerName?: string;
    phoneNumber?: string;
    paymentType: string;
    cashGiven?: number;
    balance?: number;
  }) {
    const items = orderData.items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      discount: item.discount ?? 0,
      discountType: item.discountType ?? 'flat',
      free: item.free ?? false,
    }));

    // Save order to DB
    const order = new this.orderModel({
      items,
      total: orderData.total,
      customerName: orderData.customerName || null,
      phoneNumber: orderData.phoneNumber || null,
      paymentType: orderData.paymentType,
      cashGiven: orderData.cashGiven || null,
      balance: orderData.balance || null,
    });

    const savedOrder = await order.save();

    // Decrease stock for non-free products
    for (const item of items) {
      if (!item.free) {
        await this.productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true },
        );
      }
    }

    return savedOrder;
  }

  async findAll() {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }
}

// Local input type for cart items
type OrderItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  discountType?: 'flat' | 'percentage';
  free?: boolean;
};
