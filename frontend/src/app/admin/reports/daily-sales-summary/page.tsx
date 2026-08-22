"use client";

import { useEffect, useMemo, useState } from "react";
import BeerLoader from "@/components/BeerLoader";
import ReportExportButtons from "@/components/ReportExportButtons";
import ReportFiltersBar from "@/components/ReportFiltersBar";
import ReportsNav from "@/components/ReportsNav";
import { buildExportFilename, type ExportReportPayload } from "@/lib/exportReports";
import {
  DEFAULT_REPORT_FILTERS,
  buildDailySalesSummary,
  fetchExpenses,
  fetchFullReportData,
  filterCategorySizeRows,
  filterDailyExpensesForRange,
  formatCurrency,
  formatDate,
  formatReportPeriod,
  getFreeItemsInRange,
  getOrderDiscountsInRange,
  resolveReportDateRange,
  sumDailySalesSummary,
  sumDiscountsInRange,
  sumExpenses,
  sumFreeItemsExpense,
  type Expense,
  type Order,
  type Product,
  type Purchase,
  type ReportFiltersState,
} from "@/lib/reports";

const PAGE_DEFAULT_FILTERS: ReportFiltersState = {
  ...DEFAULT_REPORT_FILTERS,
  datePreset: "today",
};

export default function DailySalesSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>(PAGE_DEFAULT_FILTERS);

  useEffect(() => {
    Promise.all([fetchFullReportData(), fetchExpenses()])
      .then(([data, expenseData]) => {
        setProducts(data.products);
        setOrders(data.orders);
        setPurchases(data.purchases);
        setExpenses(expenseData);
      })
      .finally(() => setLoading(false));
  }, []);

  const dateRange = useMemo(() => resolveReportDateRange(filters), [filters]);
  const periodLabel = useMemo(
    () => formatReportPeriod(dateRange, filters.datePreset),
    [dateRange, filters.datePreset]
  );
  const showExpenseDate = Boolean(
    dateRange.start && dateRange.end && dateRange.start !== dateRange.end
  );

  const rows = useMemo(
    () => buildDailySalesSummary(products, orders, purchases, dateRange),
    [products, orders, purchases, dateRange]
  );

  const filteredRows = useMemo(
    () => filterCategorySizeRows(rows, filters),
    [rows, filters]
  );

  const grandTotal = useMemo(
    () => sumDailySalesSummary(filteredRows),
    [filteredRows]
  );

  const periodExpenses = useMemo(
    () => filterDailyExpensesForRange(expenses, dateRange),
    [expenses, dateRange]
  );

  const freeItemExpenses = useMemo(
    () => getFreeItemsInRange(orders, products, dateRange),
    [orders, products, dateRange]
  );

  const recordedExpensesTotal = useMemo(
    () => sumExpenses(periodExpenses),
    [periodExpenses]
  );

  const freeItemsExpenseTotal = useMemo(
    () => sumFreeItemsExpense(orders, products, dateRange),
    [orders, products, dateRange]
  );

  const discountSummary = useMemo(
    () => sumDiscountsInRange(orders, dateRange),
    [orders, dateRange]
  );

  const discountRows = useMemo(
    () => getOrderDiscountsInRange(orders, dateRange),
    [orders, dateRange]
  );

  const expensesTotal = recordedExpensesTotal + freeItemsExpenseTotal;

  const netTotal =
    grandTotal.grossValue - discountSummary.totalDiscount - expensesTotal;

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Daily Sales Summary",
      subtitle: periodLabel,
      pdfTheme: "dailySales",
      filename: buildExportFilename(
        `daily-sales-summary-${dateRange.start || "all"}${dateRange.end && dateRange.end !== dateRange.start ? `-to-${dateRange.end}` : ""}`
      ),
      summary: [
        { label: "Period", value: periodLabel },
        { label: "Total Sales Qty", value: String(grandTotal.salesStock) },
        {
          label: "Total Value",
          value: formatCurrency(grandTotal.grossValue),
          highlight: true,
        },
        {
          label: "Total Discounts",
          value: formatCurrency(discountSummary.totalDiscount),
          highlight: true,
        },
        {
          label: "Total Expenses",
          value: formatCurrency(expensesTotal),
          highlight: true,
        },
        {
          label: "Free Items Expense",
          value: formatCurrency(freeItemsExpenseTotal),
        },
        {
          label: "Net Total",
          value: formatCurrency(netTotal),
          highlight: true,
        },
      ],
      sections: [
        {
          title: "Daily Sales Summary",
          headers: [
            "Category",
            "Size",
            "Opening Stock",
            "Purchase Stock",
            "Total Stock",
            "Sales Stock",
            "In Hand Stock",
            "Selling Price",
            "Gross Value",
          ],
          rows: [
            ...filteredRows.map((row) => [
              row.category,
              row.size,
              row.openingStock,
              row.purchaseStock,
              row.totalStock,
              row.salesStock,
              row.inHandStock,
              formatCurrency(row.sellingPrice),
              formatCurrency(row.grossValue),
            ]),
            [
              "Grand Total",
              "",
              grandTotal.openingStock,
              grandTotal.purchaseStock,
              grandTotal.totalStock,
              grandTotal.salesStock,
              grandTotal.inHandStock,
              "",
              formatCurrency(grandTotal.grossValue),
            ],
          ],
          mergeCategoryColumn: true,
        },
        {
          title: "Daily Expenses",
          headers: showExpenseDate
            ? ["Date", "Title", "Category", "Amount"]
            : ["Title", "Category", "Amount"],
          rows: [
            ...periodExpenses.map((expense) =>
              showExpenseDate
                ? [
                    formatDate(expense.expenseDate),
                    expense.title,
                    expense.category,
                    formatCurrency(expense.amount),
                  ]
                : [expense.title, expense.category, formatCurrency(expense.amount)]
            ),
            showExpenseDate
              ? ["Grand Total", "", "", formatCurrency(recordedExpensesTotal)]
              : ["Grand Total", "", formatCurrency(recordedExpensesTotal)],
          ],
        },
        {
          title: "Free Items",
          headers: showExpenseDate
            ? ["Date", "Product", "Qty", "Selling Price", "Amount"]
            : ["Product", "Qty", "Selling Price", "Amount"],
          rows: [
            ...freeItemExpenses.map((item) =>
              showExpenseDate
                ? [
                    "—",
                    item.name,
                    item.quantity,
                    formatCurrency(item.sellingPrice),
                    formatCurrency(item.amount),
                  ]
                : [
                    item.name,
                    item.quantity,
                    formatCurrency(item.sellingPrice),
                    formatCurrency(item.amount),
                  ]
            ),
            showExpenseDate
              ? ["Grand Total", "", "", "", formatCurrency(freeItemsExpenseTotal)]
              : ["Grand Total", "", "", formatCurrency(freeItemsExpenseTotal)],
          ],
        },
        {
          title: "Discounts",
          headers: showExpenseDate
            ? ["Date", "Invoice", "Item Discount", "Bill Discount", "Total"]
            : ["Invoice", "Item Discount", "Bill Discount", "Total"],
          rows: [
            ...discountRows.map((row) =>
              showExpenseDate
                ? [
                    formatDate(row.date),
                    row.invoiceId,
                    formatCurrency(row.itemDiscount),
                    formatCurrency(row.billDiscount),
                    formatCurrency(row.totalDiscount),
                  ]
                : [
                    row.invoiceId,
                    formatCurrency(row.itemDiscount),
                    formatCurrency(row.billDiscount),
                    formatCurrency(row.totalDiscount),
                  ]
            ),
            showExpenseDate
              ? [
                  "Grand Total",
                  "",
                  formatCurrency(discountSummary.itemDiscount),
                  formatCurrency(discountSummary.billDiscount),
                  formatCurrency(discountSummary.totalDiscount),
                ]
              : [
                  "Grand Total",
                  formatCurrency(discountSummary.itemDiscount),
                  formatCurrency(discountSummary.billDiscount),
                  formatCurrency(discountSummary.totalDiscount),
                ],
          ],
        },
        {
          title: "Daily Summary",
          headers: ["Item", "Amount"],
          rows: [
            ["Total Value", formatCurrency(grandTotal.grossValue)],
            ["Item Discounts", formatCurrency(discountSummary.itemDiscount)],
            ["Bill Discounts", formatCurrency(discountSummary.billDiscount)],
            ["Total Discounts", formatCurrency(discountSummary.totalDiscount)],
            ["Recorded Expenses", formatCurrency(recordedExpensesTotal)],
            ["Free Items Expense", formatCurrency(freeItemsExpenseTotal)],
            ["Total Expenses", formatCurrency(expensesTotal)],
            ["Net Total", formatCurrency(netTotal)],
          ],
        },
      ],
    }),
    [
      filteredRows,
      grandTotal,
      periodLabel,
      dateRange,
      periodExpenses,
      recordedExpensesTotal,
      freeItemExpenses,
      freeItemsExpenseTotal,
      discountSummary,
      discountRows,
      expensesTotal,
      netTotal,
      showExpenseDate,
    ]
  );

  if (loading) return <BeerLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
              Daily Operations
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Daily Sales Summary
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Sales, stock movement & daily expenses — {periodLabel}
            </p>
          </div>
          <ReportExportButtons payload={exportPayload} />
        </div>
        <ReportsNav />
      </header>

      <ReportFiltersBar
        filters={filters}
        onChange={setFilters}
        defaultFilters={PAGE_DEFAULT_FILTERS}
        products={products}
        orders={orders}
        config={{
          date: true,
          search: true,
          searchPlaceholder: "Category or size...",
          category: true,
        }}
      />

      <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-2xl border border-slate-100">
        <div>
          <label className={labelClass}>Report Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                datePreset: "custom",
                startDate: e.target.value,
                endDate: e.target.value,
              }))
            }
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium"
          />
        </div>
        {dateRange.start && dateRange.end && dateRange.start !== dateRange.end && (
          <p className="text-sm text-slate-500 font-medium pb-2">
            Range: {periodLabel}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {[
          { label: "Total Sales Qty", value: String(grandTotal.salesStock), color: "text-slate-900" },
          { label: "Total Value", value: formatCurrency(grandTotal.grossValue), color: "text-indigo-600" },
          {
            label: "Total Discounts",
            value: formatCurrency(discountSummary.totalDiscount),
            color: "text-violet-600",
            hint:
              discountSummary.totalDiscount > 0
                ? `Item ${formatCurrency(discountSummary.itemDiscount)} · Bill ${formatCurrency(discountSummary.billDiscount)}`
                : undefined,
          },
          { label: "Purchase Stock", value: String(grandTotal.purchaseStock), color: "text-slate-900" },
          { label: "In Hand Stock", value: String(grandTotal.inHandStock), color: "text-emerald-600" },
          {
            label: "Total Expenses",
            value: formatCurrency(expensesTotal),
            color: "text-rose-600",
            hint:
              freeItemsExpenseTotal > 0
                ? `Includes ${formatCurrency(freeItemsExpenseTotal)} free items`
                : undefined,
          },
          {
            label: "Net Total",
            value: formatCurrency(netTotal),
            color: netTotal >= 0 ? "text-violet-600" : "text-rose-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <p className={`text-xl sm:text-2xl font-black ${item.color}`}>{item.value}</p>
            {"hint" in item && item.hint ? (
              <p className="text-[10px] font-bold text-amber-600 mt-1">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Sales by Category & Size</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Size</th>
                <th className="px-4 py-4 text-right">Opening Stock</th>
                <th className="px-4 py-4 text-right">Purchase Stock</th>
                <th className="px-4 py-4 text-right">Total Stock</th>
                <th className="px-4 py-4 text-right">Sales Stock</th>
                <th className="px-4 py-4 text-right">In Hand Stock</th>
                <th className="px-4 py-4 text-right">Selling Price</th>
                <th className="px-4 py-4 text-right">Gross Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No sales data for the selected period and filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={`${row.category}-${row.size}`}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">{row.category}</td>
                    <td className="px-4 py-3 text-slate-600">{row.size}</td>
                    <td className="px-4 py-3 text-right">{row.openingStock}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{row.purchaseStock}</td>
                    <td className="px-4 py-3 text-right font-medium">{row.totalStock}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">
                      {row.salesStock}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">{row.inHandStock}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatCurrency(row.grossValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50 font-black text-slate-900 border-t-2 border-indigo-100">
                  <td colSpan={2} className="px-4 py-4 uppercase text-[10px] tracking-widest">
                    Grand Total
                  </td>
                  <td className="px-4 py-4 text-right">{grandTotal.openingStock}</td>
                  <td className="px-4 py-4 text-right">{grandTotal.purchaseStock}</td>
                  <td className="px-4 py-4 text-right">{grandTotal.totalStock}</td>
                  <td className="px-4 py-4 text-right text-indigo-700">
                    {grandTotal.salesStock}
                  </td>
                  <td className="px-4 py-4 text-right text-emerald-700">
                    {grandTotal.inHandStock}
                  </td>
                  <td className="px-4 py-4 text-right">—</td>
                  <td className="px-4 py-4 text-right text-indigo-700">
                    {formatCurrency(grandTotal.grossValue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Daily Expenses — {periodLabel}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Variable costs recorded on the Daily Expenses page
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                {showExpenseDate && <th className="px-6 py-4">Date</th>}
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {periodExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={showExpenseDate ? 4 : 3}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No recorded expenses for this period.
                  </td>
                </tr>
              ) : (
                periodExpenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    {showExpenseDate && (
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {formatDate(expense.expenseDate)}
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-slate-900">{expense.title}</td>
                    <td className="px-6 py-4 text-slate-600">{expense.category}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {periodExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-rose-50 font-black text-slate-900 border-t-2 border-rose-100">
                  <td
                    colSpan={showExpenseDate ? 3 : 2}
                    className="px-6 py-4 uppercase text-[10px] tracking-widest"
                  >
                    Recorded Expenses Total
                  </td>
                  <td className="px-6 py-4 text-right text-rose-700">
                    {formatCurrency(recordedExpensesTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            Free Items — {periodLabel}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Items billed as free, valued at selling price
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                {showExpenseDate && <th className="px-6 py-4">Date</th>}
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Selling Price</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {freeItemExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={showExpenseDate ? 5 : 4}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No free items for this period.
                  </td>
                </tr>
              ) : (
                freeItemExpenses.map((item) => (
                  <tr
                    key={item.productId || item.name}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    {showExpenseDate && (
                      <td className="px-6 py-4 font-medium text-slate-600">—</td>
                    )}
                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-600">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {freeItemExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 font-black text-slate-900 border-t-2 border-amber-100">
                  <td
                    colSpan={showExpenseDate ? 4 : 3}
                    className="px-6 py-4 uppercase text-[10px] tracking-widest"
                  >
                    Free Items Expense Total
                  </td>
                  <td className="px-6 py-4 text-right text-amber-700">
                    {formatCurrency(freeItemsExpenseTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            Discounts — {periodLabel}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Item-level and bill-level reductions applied at checkout
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                {showExpenseDate && <th className="px-6 py-4">Date</th>}
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4 text-right">Item Discount</th>
                <th className="px-6 py-4 text-right">Bill Discount</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {discountRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={showExpenseDate ? 5 : 4}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No discounts for this period.
                  </td>
                </tr>
              ) : (
                discountRows.map((row) => (
                  <tr
                    key={row.orderId}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    {showExpenseDate && (
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {formatDate(row.date)}
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-slate-900">{row.invoiceId}</td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {formatCurrency(row.itemDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {formatCurrency(row.billDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-violet-600">
                      {formatCurrency(row.totalDiscount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {discountRows.length > 0 && (
              <tfoot>
                <tr className="bg-violet-50 font-black text-slate-900 border-t-2 border-violet-100">
                  <td
                    colSpan={showExpenseDate ? 2 : 1}
                    className="px-6 py-4 uppercase text-[10px] tracking-widest"
                  >
                    Grand Total
                  </td>
                  <td className="px-6 py-4 text-right text-violet-700">
                    {formatCurrency(discountSummary.itemDiscount)}
                  </td>
                  <td className="px-6 py-4 text-right text-violet-700">
                    {formatCurrency(discountSummary.billDiscount)}
                  </td>
                  <td className="px-6 py-4 text-right text-violet-700">
                    {formatCurrency(discountSummary.totalDiscount)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Daily Summary</h2>
          <p className="text-xs text-slate-500 mt-1">
            Net = Total Value − Discounts − Expenses (recorded + free items)
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-px bg-slate-100">
          {[
            { label: "Total Value", value: grandTotal.grossValue, color: "text-indigo-600" },
            {
              label: "Item Discounts",
              value: discountSummary.itemDiscount,
              color: "text-violet-600",
            },
            {
              label: "Bill Discounts",
              value: discountSummary.billDiscount,
              color: "text-violet-600",
            },
            {
              label: "Total Discounts",
              value: discountSummary.totalDiscount,
              color: "text-violet-700",
            },
            {
              label: "Recorded Expenses",
              value: recordedExpensesTotal,
              color: "text-rose-600",
            },
            {
              label: "Free Items Expense",
              value: freeItemsExpenseTotal,
              color: "text-amber-600",
            },
            {
              label: "Total Expenses",
              value: expensesTotal,
              color: "text-rose-700",
            },
            {
              label: "Net Total",
              value: netTotal,
              color: netTotal >= 0 ? "text-emerald-600" : "text-rose-700",
            },
          ].map((item) => (
            <div key={item.label} className="bg-white p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {item.label}
              </p>
              <p className={`text-2xl font-black ${item.color}`}>
                {formatCurrency(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const labelClass =
  "text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-2";
