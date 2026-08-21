export type Product = {
  _id: string;
  name: string;
  category?: string;
  categoryColor?: string;
  size?: string;
  packaging?: string;
  price: number;
  stock: number;
  status?: string;
  purchasePriceWithoutVat?: number;
  purchasePriceWithVat?: number;
  vatPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  discountType?: "flat" | "percentage";
  free?: boolean;
};

export type Order = {
  _id: string;
  invoiceId: string;
  invoiceDate?: string;
  items: OrderItem[];
  total: number;
  customerName?: string;
  phoneNumber?: string;
  paymentType: string;
  cashGiven?: number;
  balance?: number;
  createdAt: string;
  updatedAt?: string;
};

export type PurchaseItem = {
  productId: string;
  name: string;
  quantity: number;
  unitCost?: number;
};

export type Purchase = {
  _id: string;
  supplierName: string;
  invoiceNumber?: string;
  purchaseDate: string;
  notes?: string;
  items: PurchaseItem[];
  totalWithoutVat?: number;
  totalWithVat?: number;
  createdAt?: string;
};

export type DailySalesSummaryRow = {
  category: string;
  size: string;
  openingStock: number;
  purchaseStock: number;
  totalStock: number;
  salesStock: number;
  inHandStock: number;
  unitPrice: number;
  totalValue: number;
};

export type StockStatusLabel = "Out" | "Low" | "OK";

export type DailyStockBalanceRow = {
  category: string;
  size: string;
  openingStock: number;
  purchaseStock: number;
  salesStock: number;
  inHandStock: number;
  costValue: number;
  retailValue: number;
  status: StockStatusLabel;
};

export type PurchasingReportRow = {
  category: string;
  size: string;
  purchasedStock: number;
  purchaseCost: number;
  sellingPrice: number;
  unitProfit: number;
  margin: number;
  inventoryCost: number;
};

export type Expense = {
  _id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  isFixed?: boolean;
  effectiveFrom?: string;
  createdAt?: string;
};

export const FIXED_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salary",
  "Insurance",
  "Loan",
  "Other",
];

export const DAILY_EXPENSE_CATEGORIES = [
  "Transport",
  "Supplies",
  "Maintenance",
  "Utilities",
  "Other",
];

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: T[] }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

export async function fetchWithRetry(url: string): Promise<Response> {
  let res = await fetch(url, { credentials: "include", cache: "no-store" });

  if (!res.ok) {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!refreshRes.ok) throw new Error("Session refresh failed");
    res = await fetch(url, { credentials: "include", cache: "no-store" });
    if (!res.ok) throw new Error("Request failed");
  }

  return res;
}

export async function fetchReportData() {
  const [productsRes, ordersRes] = await Promise.all([
    fetchWithRetry(`${API_URL}/products`),
    fetchWithRetry(`${API_URL}/orders`),
  ]);

  const products = extractArray<Product>(await productsRes.json());
  const orders = extractArray<Order>(await ordersRes.json());

  return { products, orders };
}

export async function fetchFullReportData() {
  const [productsRes, ordersRes, purchasesRes] = await Promise.all([
    fetchWithRetry(`${API_URL}/products`),
    fetchWithRetry(`${API_URL}/orders`),
    fetchWithRetry(`${API_URL}/purchases`),
  ]);

  const products = extractArray<Product>(await productsRes.json());
  const orders = extractArray<Order>(await ordersRes.json());
  const purchases = extractArray<Purchase>(await purchasesRes.json());

  return { products, orders, purchases };
}

function orderDateKey(order: Order): string {
  return (order.createdAt || order.invoiceDate || "").slice(0, 10);
}

function qtyFromOrders(
  orders: Order[],
  productId: string,
  predicate: (dateKey: string) => boolean
): number {
  return orders.reduce((sum, order) => {
    if (!predicate(orderDateKey(order))) return sum;
    return (
      sum +
      order.items
        .filter(
          (item) =>
            normalizeId(item.productId) === normalizeId(productId) && !item.free
        )
        .reduce((s, item) => s + item.quantity, 0)
    );
  }, 0);
}

function salesValueFromOrders(
  orders: Order[],
  productId: string,
  dateKey: string
): number {
  return orders.reduce((sum, order) => {
    if (orderDateKey(order) !== dateKey) return sum;
    return (
      sum +
      order.items
        .filter((item) => normalizeId(item.productId) === normalizeId(productId))
        .reduce((s, item) => s + getItemRevenue(item), 0)
    );
  }, 0);
}

function qtyFromPurchases(
  purchases: Purchase[],
  productId: string,
  predicate: (purchaseDate: string) => boolean
): number {
  return purchases.reduce((sum, purchase) => {
    const date = purchaseDateKey(purchase);
    if (!date || !predicate(date)) return sum;
    const items = Array.isArray(purchase.items) ? purchase.items : [];
    return (
      sum +
      items
        .filter((item) => normalizeId(item.productId) === normalizeId(productId))
        .reduce((s, item) => s + (item.quantity || 0), 0)
    );
  }, 0);
}

export function buildDailySalesSummary(
  products: Product[],
  orders: Order[],
  purchases: Purchase[],
  dateRange: { start: string; end: string }
): DailySalesSummaryRow[] {
  const groupMap = new Map<
    string,
    DailySalesSummaryRow & { salesValue: number; priceWeight: number }
  >();

  products.forEach((product) => {
    const category = product.category || "Uncategorized";
    const size = product.size || "—";
    const key = `${category}||${size}`;

    const salesInPeriod = qtyFromOrders(orders, product._id, (d) =>
      isInReportRange(d, dateRange)
    );
    const purchaseInPeriod = qtyFromPurchases(purchases, product._id, (d) =>
      isInReportRange(d, dateRange)
    );
    const salesAfter = qtyFromOrders(orders, product._id, (d) =>
      isAfterReportEnd(d, dateRange)
    );
    const purchasesAfter = qtyFromPurchases(purchases, product._id, (d) =>
      isAfterReportEnd(d, dateRange)
    );

    const inHandStock = Math.max(
      0,
      product.stock - purchasesAfter + salesAfter
    );
    const openingStock = Math.max(
      0,
      inHandStock - purchaseInPeriod + salesInPeriod
    );
    const purchaseStock = purchaseInPeriod;
    const totalStock = openingStock + purchaseStock;
    const salesStock = salesInPeriod;
    const salesValue = salesValueInRange(orders, product._id, dateRange);
    const unitPrice =
      salesInPeriod > 0 ? salesValue / salesInPeriod : product.price;

    const existing = groupMap.get(key);
    if (existing) {
      existing.openingStock += openingStock;
      existing.purchaseStock += purchaseStock;
      existing.totalStock += totalStock;
      existing.salesStock += salesStock;
      existing.inHandStock += inHandStock;
      existing.salesValue += salesValue;
      existing.priceWeight += salesInPeriod > 0 ? salesInPeriod : 1;
    } else {
      groupMap.set(key, {
        category,
        size,
        openingStock,
        purchaseStock,
        totalStock,
        salesStock,
        inHandStock,
        unitPrice,
        totalValue: 0,
        salesValue,
        priceWeight: salesInPeriod > 0 ? salesInPeriod : 1,
      });
    }
  });

  return Array.from(groupMap.values())
    .map((row) => ({
      category: row.category,
      size: row.size,
      openingStock: row.openingStock,
      purchaseStock: row.purchaseStock,
      totalStock: row.totalStock,
      salesStock: row.salesStock,
      inHandStock: row.inHandStock,
      unitPrice:
        row.salesStock > 0
          ? row.salesValue / row.salesStock
          : row.unitPrice,
      totalValue: row.salesValue,
    }))
    .sort((a, b) =>
      a.category.localeCompare(b.category) || a.size.localeCompare(b.size)
    );
}

export function sumDailySalesSummary(rows: DailySalesSummaryRow[]) {
  return rows.reduce(
    (acc, row) => ({
      openingStock: acc.openingStock + row.openingStock,
      purchaseStock: acc.purchaseStock + row.purchaseStock,
      totalStock: acc.totalStock + row.totalStock,
      salesStock: acc.salesStock + row.salesStock,
      inHandStock: acc.inHandStock + row.inHandStock,
      totalValue: acc.totalValue + row.totalValue,
    }),
    {
      openingStock: 0,
      purchaseStock: 0,
      totalStock: 0,
      salesStock: 0,
      inHandStock: 0,
      totalValue: 0,
    }
  );
}

export function getStockStatus(stock: number): StockStatusLabel {
  if (stock === 0) return "Out";
  if (stock < 10) return "Low";
  return "OK";
}

export function buildDailyStockBalance(
  products: Product[],
  orders: Order[],
  purchases: Purchase[],
  dateRange: { start: string; end: string }
): DailyStockBalanceRow[] {
  const groupMap = new Map<string, DailyStockBalanceRow>();

  products.forEach((product) => {
    const category = product.category || "Uncategorized";
    const size = product.size || "—";
    const key = `${category}||${size}`;

    const salesInPeriod = qtyFromOrders(orders, product._id, (d) =>
      isInReportRange(d, dateRange)
    );
    const purchaseInPeriod = qtyFromPurchases(purchases, product._id, (d) =>
      isInReportRange(d, dateRange)
    );
    const salesAfter = qtyFromOrders(orders, product._id, (d) =>
      isAfterReportEnd(d, dateRange)
    );
    const purchasesAfter = qtyFromPurchases(purchases, product._id, (d) =>
      isAfterReportEnd(d, dateRange)
    );

    const inHandStock = Math.max(
      0,
      product.stock - purchasesAfter + salesAfter
    );
    const openingStock = Math.max(
      0,
      inHandStock - purchaseInPeriod + salesInPeriod
    );
    const unitCost = getProductCost(product);
    const productCostValue = unitCost * inHandStock;
    const productRetailValue = product.price * inHandStock;

    const existing = groupMap.get(key);
    if (existing) {
      existing.openingStock += openingStock;
      existing.purchaseStock += purchaseInPeriod;
      existing.salesStock += salesInPeriod;
      existing.inHandStock += inHandStock;
      existing.costValue += productCostValue;
      existing.retailValue += productRetailValue;
      existing.status = getStockStatus(existing.inHandStock);
    } else {
      groupMap.set(key, {
        category,
        size,
        openingStock,
        purchaseStock: purchaseInPeriod,
        salesStock: salesInPeriod,
        inHandStock,
        costValue: productCostValue,
        retailValue: productRetailValue,
        status: getStockStatus(inHandStock),
      });
    }
  });

  return Array.from(groupMap.values()).sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.size.localeCompare(b.size)
  );
}

export function sumDailyStockBalance(rows: DailyStockBalanceRow[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      openingStock: acc.openingStock + row.openingStock,
      purchaseStock: acc.purchaseStock + row.purchaseStock,
      salesStock: acc.salesStock + row.salesStock,
      inHandStock: acc.inHandStock + row.inHandStock,
      costValue: acc.costValue + row.costValue,
      retailValue: acc.retailValue + row.retailValue,
    }),
    {
      openingStock: 0,
      purchaseStock: 0,
      salesStock: 0,
      inHandStock: 0,
      costValue: 0,
      retailValue: 0,
    }
  );

  return {
    ...totals,
    status: getStockStatus(totals.inHandStock),
  };
}

function purchaseDateKey(purchase: Purchase): string {
  return String(purchase.purchaseDate ?? "").slice(0, 10);
}

export function normalizeId(id: unknown): string {
  if (id == null) return "";
  return String(id).trim();
}

function isWithinPurchaseRange(
  date: string,
  range: { start: string; end: string }
): boolean {
  return isInReportRange(date, range);
}

function finalizePurchasingRow(
  row: {
    category: string;
    size: string;
    purchasedStock: number;
    inventoryCost: number;
    retailTotal: number;
  }
): PurchasingReportRow {
  const purchaseCost =
    row.purchasedStock > 0 ? row.inventoryCost / row.purchasedStock : 0;
  const sellingPrice =
    row.purchasedStock > 0 ? row.retailTotal / row.purchasedStock : 0;
  const unitProfit = sellingPrice - purchaseCost;
  const margin = sellingPrice > 0 ? (unitProfit / sellingPrice) * 100 : 0;

  return {
    category: row.category,
    size: row.size,
    purchasedStock: row.purchasedStock,
    purchaseCost,
    sellingPrice,
    unitProfit,
    margin,
    inventoryCost: row.inventoryCost,
  };
}

type PurchasingGroupAccumulator = {
  category: string;
  size: string;
  purchasedStock: number;
  inventoryCost: number;
  retailTotal: number;
};

function addToPurchasingGroup(
  groupMap: Map<string, PurchasingGroupAccumulator>,
  key: string,
  entry: PurchasingGroupAccumulator
) {
  const existing = groupMap.get(key);
  if (existing) {
    existing.purchasedStock += entry.purchasedStock;
    existing.inventoryCost += entry.inventoryCost;
    existing.retailTotal += entry.retailTotal;
    return;
  }
  groupMap.set(key, { ...entry });
}

export function buildPurchasingReport(
  products: Product[],
  purchases: Purchase[],
  dateRange: { start: string; end: string }
): PurchasingReportRow[] {
  const productMap = new Map(
    products.map((product) => [normalizeId(product._id), product])
  );
  const groupMap = new Map<string, PurchasingGroupAccumulator>();

  purchases.forEach((purchase) => {
    const date = purchaseDateKey(purchase);
    if (!isWithinPurchaseRange(date, dateRange)) return;

    purchase.items.forEach((item) => {
      const product = productMap.get(normalizeId(item.productId));
      if (!product) return;

      const category = product.category || "Uncategorized";
      const size = product.size || "—";
      const key = `${category}||${size}`;
      const unitCost =
        item.unitCost && item.unitCost > 0
          ? item.unitCost
          : getProductCost(product);
      const qty = item.quantity;
      if (qty <= 0) return;

      addToPurchasingGroup(groupMap, key, {
        category,
        size,
        purchasedStock: qty,
        inventoryCost: unitCost * qty,
        retailTotal: product.price * qty,
      });
    });
  });

  const transactionRows = Array.from(groupMap.values()).map(finalizePurchasingRow);
  return transactionRows.sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.size.localeCompare(b.size)
  );
}

export function sumPurchasingReport(rows: PurchasingReportRow[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      purchasedStock: acc.purchasedStock + row.purchasedStock,
      inventoryCost: acc.inventoryCost + row.inventoryCost,
      retailTotal: acc.retailTotal + row.sellingPrice * row.purchasedStock,
    }),
    { purchasedStock: 0, inventoryCost: 0, retailTotal: 0 }
  );

  const purchaseCost =
    totals.purchasedStock > 0 ? totals.inventoryCost / totals.purchasedStock : 0;
  const sellingPrice =
    totals.purchasedStock > 0 ? totals.retailTotal / totals.purchasedStock : 0;
  const unitProfit = sellingPrice - purchaseCost;
  const margin = sellingPrice > 0 ? (unitProfit / sellingPrice) * 100 : 0;

  return {
    purchasedStock: totals.purchasedStock,
    purchaseCost,
    sellingPrice,
    unitProfit,
    margin,
    inventoryCost: totals.inventoryCost,
  };
}

export function getItemRevenue(item: OrderItem): number {
  if (item.free) return 0;
  const base = item.price * item.quantity;
  if (!item.discount) return base;
  if (item.discountType === "percentage") {
    return base - (base * item.discount) / 100;
  }
  return base - item.discount * item.quantity;
}

export function getProductCost(product: Product | undefined): number {
  return (
    product?.purchasePriceWithVat ??
    product?.purchasePriceWithoutVat ??
    0
  );
}

export function formatCurrency(value: number): string {
  return `Rs. ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 1).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
  });
}

export function currentMonthKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function isFixedExpenseActiveInMonth(
  expense: Expense,
  monthKey: string
): boolean {
  if (!expense.isFixed) return false;
  const from = (expense.effectiveFrom || expense.expenseDate).slice(0, 7);
  return Boolean(from && from <= monthKey);
}

export function sumDailyExpensesForMonth(
  expenses: Expense[],
  monthKey: string
): number {
  return expenses
    .filter((e) => !e.isFixed && e.expenseDate.slice(0, 7) === monthKey)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function filterDailyExpensesForRange(
  expenses: Expense[],
  range: { start: string; end: string }
): Expense[] {
  return expenses
    .filter((e) => !e.isFixed)
    .filter((e) => isWithinDateRange(e.expenseDate, range.start, range.end))
    .sort(
      (a, b) =>
        b.expenseDate.localeCompare(a.expenseDate) || a.title.localeCompare(b.title)
    );
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function sumFixedExpensesForMonth(
  expenses: Expense[],
  monthKey: string
): number {
  return expenses
    .filter((e) => isFixedExpenseActiveInMonth(e, monthKey))
    .reduce((sum, e) => sum + e.amount, 0);
}

export async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetchWithRetry(`${API_URL}/expenses`);
  return extractArray<Expense>(await res.json());
}

export function isWithinDateRange(dateStr: string, start: string, end: string): boolean {
  const date = dateStr.slice(0, 10);
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export type StockStatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export type ReportFiltersState = {
  datePreset: DatePreset;
  startDate: string;
  endDate: string;
  search: string;
  category: string;
  packaging: string;
  paymentType: string;
  stockStatus: StockStatusFilter;
  minTotal: string;
  maxTotal: string;
  sortBy: string;
  minMargin: string;
  hasCostData: boolean;
  topLimit: string;
};

export const DEFAULT_REPORT_FILTERS: ReportFiltersState = {
  datePreset: "all",
  startDate: "",
  endDate: "",
  search: "",
  category: "all",
  packaging: "all",
  paymentType: "all",
  stockStatus: "all",
  minTotal: "",
  maxTotal: "",
  sortBy: "default",
  minMargin: "",
  hasCostData: false,
  topLimit: "all",
};

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateString(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toDateString(today);
}

export function resolveReportDateRange(
  filters: ReportFiltersState
): { start: string; end: string } {
  if (filters.datePreset === "all") {
    return { start: "", end: "" };
  }

  let { start, end } = getEffectiveDateRange(filters);

  if (start && !end) end = start;
  if (!start && end) start = end;

  if (!start && !end) {
    const preset = getDatePresetRange(filters.datePreset);
    return {
      start: preset.start,
      end: preset.end || preset.start || todayDateString(),
    };
  }

  return { start, end };
}

export function formatReportPeriod(
  range: { start: string; end: string },
  datePreset?: DatePreset
): string {
  if (datePreset === "all") return "All time";
  if (range.start && range.end && range.start !== range.end) {
    return `${formatDate(range.start)} – ${formatDate(range.end)}`;
  }
  if (range.end) return formatDate(range.end);
  if (range.start) return formatDate(range.start);
  return "All time";
}

export type CategorySizeRow = {
  category: string;
  size: string;
  inHandStock?: number;
  status?: StockStatusLabel;
  margin?: number;
};

export function filterCategorySizeRows<T extends CategorySizeRow>(
  rows: T[],
  filters: ReportFiltersState
): T[] {
  let result = rows;

  if (filters.category !== "all") {
    result = result.filter((row) => row.category === filters.category);
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (row) =>
        row.category.toLowerCase().includes(q) ||
        row.size.toLowerCase().includes(q)
    );
  }

  if (filters.stockStatus !== "all") {
    result = result.filter((row) => {
      if (row.status) {
        if (filters.stockStatus === "out_of_stock") return row.status === "Out";
        if (filters.stockStatus === "low_stock") return row.status === "Low";
        if (filters.stockStatus === "in_stock") return row.status === "OK";
      }
      return matchesStockStatus(row.inHandStock ?? 0, filters.stockStatus);
    });
  }

  if (filters.minMargin.trim()) {
    const min = parseFloat(filters.minMargin);
    if (!Number.isNaN(min)) {
      result = result.filter((row) => (row.margin ?? 0) >= min);
    }
  }

  return result;
}

function isInReportRange(
  date: string,
  range: { start: string; end: string }
): boolean {
  if (!date) return false;
  if (!range.start && !range.end) return true;
  const end = range.end || range.start || todayDateString();
  if (range.start && date < range.start) return false;
  if (date > end) return false;
  return true;
}

function isAfterReportEnd(
  date: string,
  range: { start: string; end: string }
): boolean {
  if (!range.start && !range.end) return false;
  const end = range.end || range.start || todayDateString();
  return date > end;
}

function salesValueInRange(
  orders: Order[],
  productId: string,
  range: { start: string; end: string }
): number {
  return orders.reduce((sum, order) => {
    const date = orderDateKey(order);
    if (!isInReportRange(date, range)) return sum;
    return (
      sum +
      order.items
        .filter((item) => normalizeId(item.productId) === normalizeId(productId))
        .reduce((s, item) => s + getItemRevenue(item), 0)
    );
  }, 0);
}

export function getDatePresetRange(preset: DatePreset): { start: string; end: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = toDateString(today);

  switch (preset) {
    case "today":
      return { start: end, end };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const s = toDateString(y);
      return { start: s, end: s };
    }
    case "last7": {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { start: toDateString(s), end };
    }
    case "last30": {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { start: toDateString(s), end };
    }
    case "thisMonth": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: toDateString(s), end };
    }
    case "lastMonth": {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toDateString(s), end: toDateString(e) };
    }
    case "custom":
    case "all":
    default:
      return { start: "", end: "" };
  }
}

export function getEffectiveDateRange(filters: ReportFiltersState): { start: string; end: string } {
  if (filters.datePreset === "custom") {
    return { start: filters.startDate, end: filters.endDate };
  }
  if (filters.datePreset === "all") {
    return { start: "", end: "" };
  }
  return getDatePresetRange(filters.datePreset);
}

export function getUniqueCategories(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.category || "Uncategorized"))].sort();
}

export function getUniquePackaging(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.packaging).filter(Boolean) as string[])].sort();
}

export function getUniquePaymentTypes(orders: Order[]): string[] {
  return [...new Set(orders.map((o) => o.paymentType).filter(Boolean))].sort();
}

export function matchesStockStatus(stock: number, status: StockStatusFilter): boolean {
  if (status === "all") return true;
  if (status === "out_of_stock") return stock === 0;
  if (status === "low_stock") return stock > 0 && stock < 10;
  if (status === "in_stock") return stock >= 10;
  return true;
}

export function filterProducts(products: Product[], filters: ReportFiltersState): Product[] {
  const q = filters.search.trim().toLowerCase();

  return products.filter((p) => {
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.packaging || "").toLowerCase().includes(q) ||
      (p.size || "").toLowerCase().includes(q);

    const matchCategory =
      filters.category === "all" || (p.category || "Uncategorized") === filters.category;

    const matchPackaging =
      filters.packaging === "all" || p.packaging === filters.packaging;

    const matchStock = matchesStockStatus(p.stock, filters.stockStatus);

    const cost = getProductCost(p);
    const margin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
    const matchMargin = !filters.minMargin || margin >= Number(filters.minMargin);
    const matchCostData = !filters.hasCostData || cost > 0;

    return matchSearch && matchCategory && matchPackaging && matchStock && matchMargin && matchCostData;
  });
}

export function filterOrders(
  orders: Order[],
  filters: ReportFiltersState,
  productMap?: Map<string, Product>
): Order[] {
  const { start, end } = getEffectiveDateRange(filters);
  const q = filters.search.trim().toLowerCase();
  const minTotal = filters.minTotal ? Number(filters.minTotal) : null;
  const maxTotal = filters.maxTotal ? Number(filters.maxTotal) : null;

  return orders.filter((order) => {
    if (!isWithinDateRange(order.createdAt, start, end)) return false;
    if (filters.paymentType !== "all" && order.paymentType !== filters.paymentType) return false;
    if (minTotal !== null && order.total < minTotal) return false;
    if (maxTotal !== null && order.total > maxTotal) return false;

    if (filters.category !== "all" && productMap) {
      const hasCategory = order.items.some((item) => {
        const product = productMap.get(normalizeId(item.productId));
        return (product?.category || "Uncategorized") === filters.category;
      });
      if (!hasCategory) return false;
    }

    if (q) {
      const matchOrder =
        order.invoiceId.toLowerCase().includes(q) ||
        (order.customerName || "").toLowerCase().includes(q) ||
        (order.phoneNumber || "").toLowerCase().includes(q) ||
        order.items.some((item) => item.name.toLowerCase().includes(q));
      if (!matchOrder) return false;
    }

    return true;
  });
}

export function countActiveFilters(
  filters: ReportFiltersState,
  config: {
    date?: boolean;
    search?: boolean;
    category?: boolean;
    packaging?: boolean;
    paymentType?: boolean;
    stockStatus?: boolean;
    minMaxTotal?: boolean;
    minMargin?: boolean;
    hasCostData?: boolean;
    topLimit?: boolean;
    sortBy?: boolean;
  },
  baseline: ReportFiltersState = DEFAULT_REPORT_FILTERS
): number {
  let count = 0;

  if (config.date && filters.datePreset !== baseline.datePreset) count++;
  if (
    config.date &&
    filters.datePreset === "custom" &&
    (filters.startDate !== baseline.startDate || filters.endDate !== baseline.endDate)
  ) {
    count++;
  }
  if (config.search && filters.search.trim()) count++;
  if (config.category && filters.category !== baseline.category) count++;
  if (config.packaging && filters.packaging !== baseline.packaging) count++;
  if (config.paymentType && filters.paymentType !== baseline.paymentType) count++;
  if (config.stockStatus && filters.stockStatus !== baseline.stockStatus) count++;
  if (config.minMaxTotal && (filters.minTotal || filters.maxTotal)) count++;
  if (config.minMargin && filters.minMargin) count++;
  if (config.hasCostData && filters.hasCostData !== baseline.hasCostData) count++;
  if (config.topLimit && filters.topLimit !== baseline.topLimit) count++;
  if (config.sortBy && filters.sortBy !== baseline.sortBy) count++;

  return count;
}

export function getFilterSubtitle(filters: ReportFiltersState): string {
  const { start, end } = getEffectiveDateRange(filters);
  if (start && end) return `${start} to ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;

  const presetLabels: Record<DatePreset, string> = {
    all: "All Time",
    today: "Today",
    yesterday: "Yesterday",
    last7: "Last 7 Days",
    last30: "Last 30 Days",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    custom: "Custom Range",
  };

  return presetLabels[filters.datePreset] || "All Time";
}
