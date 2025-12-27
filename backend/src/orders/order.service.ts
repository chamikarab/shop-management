import { Injectable, NotFoundException } from '@nestjs/common';
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

  // Create a new order with stock deduction
  async create(orderData: CreateOrderInput) {
    const items = orderData.items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      discount: item.discount ?? 0,
      discountType: item.discountType ?? 'flat',
      free: item.free ?? false,
    }));

    const order = new this.orderModel({
      items,
      total: orderData.total,
      customerName: orderData.customerName || null,
      phoneNumber: orderData.phoneNumber || null,
      paymentType: orderData.paymentType,
      cashGiven: orderData.cashGiven || null,
      balance: orderData.balance || null,
      invoiceId: orderData.invoiceId,
      invoiceDate: orderData.invoiceDate,
    });

    const savedOrder = await order.save();

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
  async findByInvoiceId(invoiceId: string) {
    const order = await this.orderModel.findOne({ invoiceId }).exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrder(invoiceId: string, updateData: Partial<CreateOrderInput>) {
    const existingOrder = await this.orderModel.findOne({ invoiceId });
    if (!existingOrder) throw new NotFoundException('Order not found');

    for (const item of existingOrder.items) {
      if (!item.free) {
        await this.productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { new: true },
        );
      }
    }

    if (updateData.items) {
      for (const item of updateData.items) {
        if (!item.free) {
          await this.productModel.findByIdAndUpdate(
            item.id,
            { $inc: { stock: -item.quantity } },
            { new: true },
          );
        }
      }

      const mappedItems = updateData.items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount ?? 0,
        discountType: item.discountType ?? 'flat',
        free: item.free ?? false,
      }));

      const updated = await this.orderModel.findOneAndUpdate(
        { invoiceId },
        { ...updateData, items: mappedItems },
        { new: true },
      );

      return updated;
    }

    const updated = await this.orderModel.findOneAndUpdate(
      { invoiceId },
      updateData,
      { new: true },
    );

    return updated;
  }

  async deleteOrder(invoiceId: string) {
    const order = await this.orderModel.findOne({ invoiceId });
    if (!order) throw new NotFoundException('Order not found');

    for (const item of order.items) {
      if (!item.free) {
        await this.productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { new: true },
        );
      }
    }

    await order.deleteOne();

    return { message: 'Order deleted and stock restored' };
  }
}

type OrderItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  discountType?: 'flat' | 'percentage';
  free?: boolean;
};

type CreateOrderInput = {
  invoiceId: string;
  invoiceDate: string;
  items: OrderItemInput[];
  total: number;
  customerName?: string;
  phoneNumber?: string;
  paymentType: string;
  cashGiven?: number;
  balance?: number;
};
