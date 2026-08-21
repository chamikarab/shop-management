import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseItem } from './purchase.schema';

type CreatePurchaseDto = {
  supplierName: string;
  invoiceNumber?: string;
  purchaseDate: string;
  notes?: string;
  items: PurchaseItem[];
  totalWithoutVat?: number;
  totalWithVat?: number;
};

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  create(@Body() body: CreatePurchaseDto) {
    return this.purchaseService.create(body);
  }

  @Get()
  findAll() {
    return this.purchaseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseService.findById(id);
  }
}
