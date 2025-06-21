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

    // Get the count of existing orders to generate invoiceId
    const orderCount = await this.orderModel.countDocuments();

    const now = new Date();
    const formattedDate = now
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 12); // "YYYYMMDDHHMM"

    const invoiceId = `${String(orderCount + 1).padStart(4, '0')}${formattedDate}`;

    const invoiceDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours(),
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Save order to DB
    const order = new this.orderModel({
      items,
      total: orderData.total,
      customerName: orderData.customerName || null,
      phoneNumber: orderData.phoneNumber || null,
      paymentType: orderData.paymentType,
      cashGiven: orderData.cashGiven || null,
      balance: orderData.balance || null,
      invoiceId,
      invoiceDate,
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
