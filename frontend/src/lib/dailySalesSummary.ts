import type { Order, Product, Purchase } from "./reports";

export type DailySalesSummaryRow = {
  category: string;
  unit: number;
  openingStock: number;
  purchaseStock: number;
  totalStock: number;
  salesStock: number;
  inHandStock: number;
  unitPrice: number;
  totalValue: number;
};

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function qtyFromOrders(
  orders: Order[],
  productId: string,
  predicate: (date: string) => boolean
): number {
  return orders.reduce((sum, order) => {
    if (!predicate(dateOnly(order.createdAt))) return sum;
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        if (item.productId !== productId) return itemSum;
        return itemSum + item.quantity;
      }, 0)
    );
  }, 0);
}

function qtyFromPurchases(
  purchases: Purchase[],
  productId: string,
  predicate: (date: string) => boolean
): number {
  return purchases.reduce((sum, purchase) => {
    if (!predicate(dateOnly(purchase.purchaseDate))) return sum;
    return (
      sum +
      purchase.items.reduce((itemSum, item) => {
        if (item.productId !== productId) return itemSum;
        return itemSum + item.quantity;
      }, 0)
    );
  }, 0);
}

export function buildDailySalesSummary(
  products: Product[],
  orders: Order[],
  purchases: Purchase[],
  selectedDate: string
): DailySalesSummaryRow[] {
  const categoryMap = new Map<string, DailySalesSummaryRow>();

  products.forEach((product) => {
    const category = product.category || "Uncategorized";
    const salesOnDay = qtyFromOrders(
      orders,
      product._id,
      (date) => date === selectedDate
    );
    const purchasesOnDay = qtyFromPurchases(
      purchases,
      product._id,
      (date) => date === selectedDate
    );
    const salesAfterDay = qtyFromOrders(
      orders,
      product._id,
      (date) => date > selectedDate
    );
    const purchasesAfterDay = qtyFromPurchases(
      purchases,
      product._id,
      (date) => date > selectedDate
    );

    const inHandAtEnd = Math.max(
      0,
      product.stock - purchasesAfterDay + salesAfterDay
    );
    const openingStock = Math.max(0, inHandAtEnd + salesOnDay - purchasesOnDay);
    const totalStock = openingStock + purchasesOnDay;
    const inHandStock = Math.max(0, totalStock - salesOnDay);
    const totalValue = salesOnDay * product.price;

    const existing = categoryMap.get(category) || {
      category,
      unit: 0,
      openingStock: 0,
      purchaseStock: 0,
      totalStock: 0,
      salesStock: 0,
      inHandStock: 0,
      unitPrice: 0,
      totalValue: 0,
    };

    existing.unit += 1;
    existing.openingStock += openingStock;
    existing.purchaseStock += purchasesOnDay;
    existing.totalStock += totalStock;
    existing.salesStock += salesOnDay;
    existing.inHandStock += inHandStock;
    existing.totalValue += totalValue;

    categoryMap.set(category, existing);
  });

  return Array.from(categoryMap.values())
    .map((row) => ({
      ...row,
      unitPrice: row.inHandStock > 0 ? row.totalValue / row.inHandStock : 0,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function sumDailySalesSummary(rows: DailySalesSummaryRow[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      unit: acc.unit + row.unit,
      openingStock: acc.openingStock + row.openingStock,
      purchaseStock: acc.purchaseStock + row.purchaseStock,
      totalStock: acc.totalStock + row.totalStock,
      salesStock: acc.salesStock + row.salesStock,
      inHandStock: acc.inHandStock + row.inHandStock,
      totalValue: acc.totalValue + row.totalValue,
    }),
    {
      unit: 0,
      openingStock: 0,
      purchaseStock: 0,
      totalStock: 0,
      salesStock: 0,
      inHandStock: 0,
      totalValue: 0,
    }
  );

  return {
    ...totals,
    unitPrice: totals.inHandStock > 0 ? totals.totalValue / totals.inHandStock : 0,
  };
}
