import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(
    @Body()
    body: {
      items: any[];
      total: number;
      customerName?: string;
      phoneNumber?: string;
      paymentType: string;
      cashGiven?: number;
      balance?: number;
    },
  ) {
    const {
      items,
      total,
      customerName,
      phoneNumber,
      paymentType,
      cashGiven,
      balance,
    } = body;

    if (!items || !Array.isArray(items) || typeof total !== 'number') {
      throw new HttpException(
        'Invalid request body. Expected "items" (array) and "total" (number).',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!paymentType) {
      throw new HttpException(
        'Payment type is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const now = new Date();
      const formattedDate = now
        .toISOString()
        .replace(/[-:.TZ]/g, '')
        .slice(0, 12); // e.g., 202506211327

      const invoiceId = `INV${formattedDate}`;

      const createdOrder = await this.orderService.create({
        invoiceId,
        invoiceDate: now.toISOString(),
        items,
        total,
        customerName,
        phoneNumber,
        paymentType,
        cashGiven,
        balance,
      });

      return {
        message: 'Order placed successfully',
        data: createdOrder,
      };
    } catch (err) {
      console.error('❌ Order creation failed:', err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    return this.orderService.findAll();
  }
}
