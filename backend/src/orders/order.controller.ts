import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';

interface OrderItemDto {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  discountType?: 'flat' | 'percentage';
  free?: boolean;
}

interface CreateOrderDto {
  items: OrderItemDto[];
  total: number;
  customerName?: string;
  phoneNumber?: string;
  paymentType: string;
  cashGiven?: number;
  balance?: number;
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() body: CreateOrderDto) {
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
        'Invalid request: "items" must be an array and "total" must be a number.',
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
        .slice(0, 12);
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

      return { message: 'Order placed successfully', data: createdOrder };
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
    const orders = await this.orderService.findAll();
    return { data: orders };
  }

  @Get(':invoiceId')
  async findOne(@Param('invoiceId') invoiceId: string) {
    try {
      const order = await this.orderService.findByInvoiceId(invoiceId);
      return { data: order };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put(':invoiceId')
  async update(
    @Param('invoiceId') invoiceId: string,
    @Body() updateData: Partial<CreateOrderDto>,
  ) {
    try {
      const updated = await this.orderService.updateOrder(invoiceId, updateData);
      return { message: 'Order updated successfully', data: updated };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':invoiceId')
  async delete(@Param('invoiceId') invoiceId: string) {
    try {
      const result = await this.orderService.deleteOrder(invoiceId);
      return { message: 'Order deleted successfully', data: result };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
