"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa";
import BeerLoader from "@/components/BeerLoader";
import ReportExportButtons from "@/components/ReportExportButtons";
import ReportsNav from "@/components/ReportsNav";
import { buildExportFilename, type ExportReportPayload } from "@/lib/exportReports";
import {
  FIXED_EXPENSE_CATEGORIES,
  currentMonthKey,
  fetchExpenses,
  fetchFullReportData,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getFreeItemsInRange,
  getOrderDiscountsInRange,
  isFixedExpenseActiveInMonth,
  monthRange,
  sumDailyExpensesForMonth,
  sumDiscountsForMonth,
  sumFixedExpensesForMonth,
  sumFreeItemsExpenseForMonth,
  type Expense,
  type Order,
  type Product,
} from "@/lib/reports";

const emptyFixedForm = () => ({
  title: "",
  category: "Rent",
  amount: "",
  effectiveFrom: currentMonthKey(),
  notes: "",
});

function buildCategoryTotals(
  expenses: Expense[],
  monthKey: string
): { category: string; daily: number; fixed: number; total: number }[] {
  const map = new Map<string, { daily: number; fixed: number }>();

  expenses.forEach((expense) => {
    const category = expense.category || "Other";
    const entry = map.get(category) || { daily: 0, fixed: 0 };

    if (expense.isFixed) {
      if (isFixedExpenseActiveInMonth(expense, monthKey)) {
        entry.fixed += expense.amount;
      }
    } else if (expense.expenseDate.slice(0, 7) === monthKey) {
      entry.daily += expense.amount;
    }

    map.set(category, entry);
  });

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      daily: data.daily,
      fixed: data.fixed,
      total: data.daily + data.fixed,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

export default function MonthlyPnlPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reportMonth, setReportMonth] = useState(() => currentMonthKey());
  const [fixedForm, setFixedForm] = useState(emptyFixedForm);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const loadData = async () => {
    try {
      const [reportData, expenseData] = await Promise.all([
        fetchFullReportData(),
        fetchExpenses(),
      ]);
      setOrders(reportData.orders);
      setProducts(reportData.products);
      setExpenses(expenseData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load monthly P&L data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { start, end } = useMemo(() => monthRange(reportMonth), [reportMonth]);

  const report = useMemo(() => {
    const monthOrders = orders.filter((order) => {
      const date = order.createdAt.slice(0, 10);
      return date >= start && date <= end;
    });

    let revenue = 0;
    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    monthOrders.forEach((order) => {
      revenue += order.total;
      const day = order.createdAt.slice(0, 10);
      const entry = dailyMap.get(day) || { revenue: 0, orders: 0 };
      entry.revenue += order.total;
      entry.orders += 1;
      dailyMap.set(day, entry);
    });

    const dailyExpenses = sumDailyExpensesForMonth(expenses, reportMonth);
    const fixedExpenses = sumFixedExpensesForMonth(expenses, reportMonth);
    const freeItemsExpense = sumFreeItemsExpenseForMonth(
      orders,
      products,
      reportMonth
    );
    const freeItemRows = getFreeItemsInRange(orders, products, { start, end });
    const discountSummary = sumDiscountsForMonth(orders, reportMonth);
    const discountRows = getOrderDiscountsInRange(orders, { start, end });
    const totalExpenses = dailyExpenses + fixedExpenses + freeItemsExpense;
    const netProfit = revenue - totalExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const dailyRows = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const fixedExpenseRows = expenses
      .filter((e) => isFixedExpenseActiveInMonth(e, reportMonth))
      .sort((a, b) => a.title.localeCompare(b.title));

    const recordedCategoryRows = buildCategoryTotals(expenses, reportMonth);
    const categoryRows = [
      ...recordedCategoryRows,
      ...(freeItemsExpense > 0
        ? [
            {
              category: "Free Items",
              daily: freeItemsExpense,
              fixed: 0,
              total: freeItemsExpense,
            },
          ]
        : []),
    ];
    const categoryDailyTotal = categoryRows.reduce((sum, row) => sum + row.daily, 0);
    const categoryFixedTotal = categoryRows.reduce((sum, row) => sum + row.fixed, 0);
    const categoryGrandTotal = categoryRows.reduce((sum, row) => sum + row.total, 0);
    const recordedExpenses = dailyExpenses + fixedExpenses;

    return {
      revenue,
      dailyExpenses,
      fixedExpenses,
      recordedExpenses,
      freeItemsExpense,
      freeItemRows,
      discountSummary,
      discountRows,
      totalExpenses,
      netProfit,
      netMargin,
      orderCount: monthOrders.length,
      dailyRows,
      fixedExpenseRows,
      categoryRows,
      categoryDailyTotal,
      categoryFixedTotal,
      categoryGrandTotal,
    };
  }, [orders, products, expenses, reportMonth, start, end]);

  const handleAddFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fixedForm.amount);
    if (!fixedForm.title.trim()) {
      toast.error("Please enter an expense title");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: fixedForm.title.trim(),
          category: fixedForm.category,
          amount,
          expenseDate: `${fixedForm.effectiveFrom}-01`,
          effectiveFrom: fixedForm.effectiveFrom,
          isFixed: true,
          notes: fixedForm.notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save fixed expense");
      toast.success("Fixed expense added");
      setFixedForm(emptyFixedForm());
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save fixed expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this fixed expense?")) return;
    try {
      const res = await fetch(`${apiUrl}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Fixed expense deleted");
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete expense");
    }
  };

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Monthly P&L Report",
      subtitle: formatMonthLabel(reportMonth),
      pdfTheme: "monthlyPnl",
      filename: buildExportFilename(`monthly-pnl-${reportMonth}`),
      summary: [
        { label: "Month", value: formatMonthLabel(reportMonth) },
        {
          label: "Revenue",
          value: formatCurrency(report.revenue),
          highlight: true,
        },
        {
          label: "Total Discounts",
          value: formatCurrency(report.discountSummary.totalDiscount),
          highlight: true,
        },
        {
          label: "Total Expenses",
          value: formatCurrency(report.totalExpenses),
          highlight: true,
        },
        { label: "Free Items Expense", value: formatCurrency(report.freeItemsExpense) },
        {
          label: "Net Profit",
          value: formatCurrency(report.netProfit),
          highlight: true,
        },
      ],
      sections: [
        {
          title: "Monthly Summary",
          headers: ["Item", "Amount"],
          rows: [
            ["Revenue", formatCurrency(report.revenue)],
            ["Item Discounts", formatCurrency(report.discountSummary.itemDiscount)],
            ["Bill Discounts", formatCurrency(report.discountSummary.billDiscount)],
            ["Total Discounts", formatCurrency(report.discountSummary.totalDiscount)],
            ["Daily Expenses", formatCurrency(report.dailyExpenses)],
            ["Recorded Expenses", formatCurrency(report.recordedExpenses)],
            ["Free Items Expense", formatCurrency(report.freeItemsExpense)],
            ["Fixed Expenses", formatCurrency(report.fixedExpenses)],
            ["Total Expenses", formatCurrency(report.totalExpenses)],
            ["Net Profit", formatCurrency(report.netProfit)],
          ],
        },
        {
          title: "Discounts",
          headers: ["Date", "Invoice", "Item Discount", "Bill Discount", "Total"],
          rows: [
            ...report.discountRows.map((row) => [
              formatDate(row.date),
              row.invoiceId,
              formatCurrency(row.itemDiscount),
              formatCurrency(row.billDiscount),
              formatCurrency(row.totalDiscount),
            ]),
            [
              "Grand Total",
              "",
              formatCurrency(report.discountSummary.itemDiscount),
              formatCurrency(report.discountSummary.billDiscount),
              formatCurrency(report.discountSummary.totalDiscount),
            ],
          ],
        },
        {
          title: "Free Items",
          headers: ["Product", "Qty", "Selling Price", "Amount"],
          rows: [
            ...report.freeItemRows.map((item) => [
              item.name,
              item.quantity,
              formatCurrency(item.sellingPrice),
              formatCurrency(item.amount),
            ]),
            [
              "Grand Total",
              "",
              "",
              formatCurrency(report.freeItemsExpense),
            ],
          ],
        },
        {
          title: "Expenses by Category",
          headers: ["Category", "Daily", "Fixed", "Total"],
          rows: [
            ...report.categoryRows.map((row) => [
              row.category,
              formatCurrency(row.daily),
              formatCurrency(row.fixed),
              formatCurrency(row.total),
            ]),
            [
              "Grand Total",
              formatCurrency(report.categoryDailyTotal),
              formatCurrency(report.categoryFixedTotal),
              formatCurrency(report.categoryGrandTotal),
            ],
          ],
        },
        {
          title: "Daily Sales Breakdown",
          headers: ["Date", "Orders", "Revenue"],
          rows: report.dailyRows.map((row) => [
            formatDate(row.date),
            row.orders,
            formatCurrency(row.revenue),
          ]),
        },
        {
          title: "Fixed Expenses",
          headers: ["Title", "Category", "Monthly Amount", "Effective From"],
          rows: report.fixedExpenseRows.map((row) => [
            row.title,
            row.category,
            formatCurrency(row.amount),
            (row.effectiveFrom || row.expenseDate).slice(0, 7),
          ]),
        },
      ],
    }),
    [report, reportMonth]
  );

  if (loading) return <BeerLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
              Financial Report
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Monthly P&L
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Revenue, expenses & net profit for {formatMonthLabel(reportMonth)}
            </p>
          </div>
          <ReportExportButtons payload={exportPayload} />
        </div>
        <ReportsNav />
      </header>

      <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-2xl border border-slate-100">
        <div>
          <label className={labelClass}>Report Month</label>
          <input
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Revenue", value: formatCurrency(report.revenue), color: "text-indigo-600" },
          {
            label: "Total Discounts",
            value: formatCurrency(report.discountSummary.totalDiscount),
            color: "text-violet-600",
            hint:
              report.discountSummary.totalDiscount > 0
                ? `Item ${formatCurrency(report.discountSummary.itemDiscount)} · Bill ${formatCurrency(report.discountSummary.billDiscount)}`
                : undefined,
          },
          { label: "Total Expenses", value: formatCurrency(report.totalExpenses), color: "text-rose-600" },
          {
            label: "Free Items Expense",
            value: formatCurrency(report.freeItemsExpense),
            color: "text-amber-600",
          },
          {
            label: "Net Profit",
            value: formatCurrency(report.netProfit),
            color: report.netProfit >= 0 ? "text-emerald-600" : "text-rose-700",
          },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <p className={`text-xl sm:text-2xl font-black ${item.color}`}>{item.value}</p>
            {item.label === "Revenue" && (
              <p className="text-[10px] text-slate-400 mt-1">{report.orderCount} orders</p>
            )}
            {"hint" in item && item.hint ? (
              <p className="text-[10px] font-bold text-violet-600 mt-1">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            Discounts — {formatMonthLabel(reportMonth)}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Item-level and bill-level reductions applied at checkout
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4 text-right">Item Discount</th>
                <th className="px-6 py-4 text-right">Bill Discount</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.discountRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No discounts for this month.
                  </td>
                </tr>
              ) : (
                report.discountRows.map((row) => (
                  <tr key={row.orderId} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {formatDate(row.date)}
                    </td>
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
            {report.discountRows.length > 0 && (
              <tfoot>
                <tr className="bg-violet-50 font-black text-slate-900 border-t-2 border-violet-100">
                  <td colSpan={2} className="px-6 py-4 uppercase text-[10px] tracking-widest">
                    Grand Total
                  </td>
                  <td className="px-6 py-4 text-right text-violet-700">
                    {formatCurrency(report.discountSummary.itemDiscount)}
                  </td>
                  <td className="px-6 py-4 text-right text-violet-700">
                    {formatCurrency(report.discountSummary.billDiscount)}
                  </td>
                  <td className="px-6 py-4 text-right text-violet-700">
                    {formatCurrency(report.discountSummary.totalDiscount)}
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
            Free Items — {formatMonthLabel(reportMonth)}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Items billed as free, valued at selling price
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Selling Price</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.freeItemRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No free items for this month.
                  </td>
                </tr>
              ) : (
                report.freeItemRows.map((item) => (
                  <tr key={item.productId || item.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">{item.quantity}</td>
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
            {report.freeItemRows.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 font-black text-slate-900 border-t-2 border-amber-100">
                  <td colSpan={3} className="px-6 py-4 uppercase text-[10px] tracking-widest">
                    Grand Total
                  </td>
                  <td className="px-6 py-4 text-right text-amber-700">
                    {formatCurrency(report.freeItemsExpense)}
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
            Expenses by Category — {formatMonthLabel(reportMonth)}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Recorded expenses plus free items (valued at selling price)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Daily</th>
                <th className="px-6 py-4 text-right">Fixed</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.categoryRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No expenses recorded for this month.
                  </td>
                </tr>
              ) : (
                report.categoryRows.map((row) => (
                  <tr
                    key={row.category}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 ${
                      row.category === "Free Items" ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">{row.category}</td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {formatCurrency(row.daily)}
                    </td>
                    <td className="px-6 py-4 text-right text-violet-600">
                      {formatCurrency(row.fixed)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {report.categoryRows.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50 font-black text-slate-900 border-t-2 border-indigo-100">
                  <td className="px-6 py-4 uppercase text-[10px] tracking-widest">Grand Total</td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(report.categoryDailyTotal)}
                  </td>
                  <td className="px-6 py-4 text-right text-violet-700">
                    {formatCurrency(report.categoryFixedTotal)}
                  </td>
                  <td className="px-6 py-4 text-right text-rose-700">
                    {formatCurrency(report.categoryGrandTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleAddFixedExpense}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 h-fit"
        >
          <div className="flex items-center gap-2 mb-2">
            <FaPlus className="text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900">Add Fixed Expense</h2>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            Rent, salary, and other monthly costs — managed here only, not on Daily Expenses.
          </p>

          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={fixedForm.title}
              onChange={(e) => setFixedForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Shop rent"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <select
              value={fixedForm.category}
              onChange={(e) => setFixedForm((f) => ({ ...f, category: e.target.value }))}
              className={inputClass}
            >
              {FIXED_EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Monthly Amount (Rs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fixedForm.amount}
              onChange={(e) => setFixedForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Effective From</label>
            <input
              type="month"
              value={fixedForm.effectiveFrom}
              onChange={(e) => setFixedForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={fixedForm.notes}
              onChange={(e) => setFixedForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className={`${inputClass} h-auto py-2 resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save Fixed Expense"}
          </button>
        </form>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">
              Fixed Expenses — {formatMonthLabel(reportMonth)}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">From</th>
                  <th className="px-6 py-4 text-right">Monthly Amount</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {report.fixedExpenseRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No fixed expenses for this month. Add rent, salary, etc. above.
                    </td>
                  </tr>
                ) : (
                  report.fixedExpenseRows.map((expense) => (
                    <tr key={expense._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{expense.title}</td>
                      <td className="px-6 py-4 text-slate-600">{expense.category}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatMonthLabel((expense.effectiveFrom || expense.expenseDate).slice(0, 7))}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete fixed expense"
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {report.fixedExpenseRows.length > 0 && (
                <tfoot>
                  <tr className="bg-violet-50 font-black text-slate-900">
                    <td colSpan={3} className="px-6 py-4 uppercase text-[10px] tracking-widest">
                      Fixed Total
                    </td>
                    <td className="px-6 py-4 text-right text-rose-700">
                      {formatCurrency(report.fixedExpenses)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-slate-900">P&L Summary</h2>
          <p className="text-xs text-slate-500">Net Profit = Revenue − Total Expenses</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-px bg-slate-100">
          {[
            { label: "Revenue", value: report.revenue, color: "text-indigo-600" },
            { label: "Item Discounts", value: report.discountSummary.itemDiscount, color: "text-violet-600" },
            { label: "Bill Discounts", value: report.discountSummary.billDiscount, color: "text-violet-600" },
            { label: "Daily Expenses", value: report.dailyExpenses, color: "text-rose-600" },
            { label: "Free Items Expense", value: report.freeItemsExpense, color: "text-amber-600" },
            { label: "Fixed Expenses", value: report.fixedExpenses, color: "text-violet-600" },
            { label: "Total Expenses", value: report.totalExpenses, color: "text-rose-700" },
          ].map((item) => (
            <div key={item.label} className="bg-white p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <p className={`text-lg font-black ${item.color}`}>{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-px bg-slate-100 border-t border-slate-100">
          {[
            {
              label: "Net Profit",
              value: report.netProfit,
              color: report.netProfit >= 0 ? "text-emerald-600" : "text-rose-700",
            },
          ].map((item) => (
            <div key={item.label} className="bg-white p-5 sm:col-span-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <p className={`text-lg font-black ${item.color}`}>{formatCurrency(item.value)}</p>
              <p className="text-xs text-slate-500 mt-1">{report.netMargin.toFixed(1)}% margin</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            Daily Sales — {formatMonthLabel(reportMonth)}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Orders</th>
                <th className="px-6 py-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {report.dailyRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No sales data for this month.
                  </td>
                </tr>
              ) : (
                report.dailyRows.map((row) => (
                  <tr key={row.date} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{formatDate(row.date)}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{row.orders}</td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {report.dailyRows.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50 font-black text-slate-900">
                  <td className="px-6 py-4 uppercase text-[10px] tracking-widest">Total</td>
                  <td className="px-6 py-4 text-right">{report.orderCount}</td>
                  <td className="px-6 py-4 text-right text-indigo-700">
                    {formatCurrency(report.revenue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

const labelClass =
  "text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-2";

const inputClass =
  "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";
