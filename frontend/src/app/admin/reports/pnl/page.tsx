"use client";

import { useEffect, useMemo, useState } from "react";
import BeerLoader from "@/components/BeerLoader";
import ReportExportButtons from "@/components/ReportExportButtons";
import ReportFiltersBar from "@/components/ReportFiltersBar";
import ReportsNav from "@/components/ReportsNav";
import { buildExportFilename, type ExportReportPayload } from "@/lib/exportReports";
import {
  DEFAULT_REPORT_FILTERS,
  fetchReportData,
  filterOrders,
  formatCurrency,
  formatDate,
  getFilterSubtitle,
  getProductCost,
  normalizeId,
  type Order,
  type Product,
  type ReportFiltersState,
} from "@/lib/reports";

export default function PnlReportPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>(DEFAULT_REPORT_FILTERS);

  useEffect(() => {
    fetchReportData()
      .then((data) => {
        setProducts(data.products);
        setOrders(data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((p) => [normalizeId(p._id), p])),
    [products]
  );

  const report = useMemo(() => {
    const filtered = filterOrders(orders, filters, productMap);

    let revenue = 0;
    let cogs = 0;
    const dailyMap = new Map<string, { revenue: number; cogs: number; orders: number }>();

    filtered.forEach((order) => {
      revenue += order.total;
      const day = order.createdAt.slice(0, 10);
      const entry = dailyMap.get(day) || { revenue: 0, cogs: 0, orders: 0 };

      entry.revenue += order.total;
      entry.orders += 1;

      order.items.forEach((item) => {
        const product = productMap.get(normalizeId(item.productId));
        const unitCost = getProductCost(product);
        cogs += unitCost * item.quantity;
        entry.cogs += unitCost * item.quantity;
      });

      dailyMap.set(day, entry);
    });

    const grossProfit = revenue - cogs;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    let dailyRows = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        cogs: data.cogs,
        profit: data.revenue - data.cogs,
        orders: data.orders,
        margin: data.revenue > 0 ? ((data.revenue - data.cogs) / data.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (filters.sortBy === "revenue_desc") dailyRows.sort((a, b) => b.revenue - a.revenue);
    if (filters.sortBy === "revenue_asc") dailyRows.sort((a, b) => a.revenue - b.revenue);
    if (filters.sortBy === "profit_desc") dailyRows.sort((a, b) => b.profit - a.profit);
    if (filters.sortBy === "date_asc") dailyRows.sort((a, b) => a.date.localeCompare(b.date));

    return { revenue, cogs, grossProfit, margin, dailyRows, orderCount: filtered.length };
  }, [orders, productMap, filters]);

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Profit & Loss Report",
      subtitle: getFilterSubtitle(filters),
      filename: buildExportFilename("pnl-report"),
      summary: [
        { label: "Total Revenue", value: formatCurrency(report.revenue) },
        { label: "Cost of Goods Sold", value: formatCurrency(report.cogs) },
        { label: "Gross Profit", value: formatCurrency(report.grossProfit) },
        { label: "Gross Margin", value: `${report.margin.toFixed(1)}%` },
        { label: "Total Orders", value: String(report.orderCount) },
      ],
      sections: [
        {
          title: "Daily P&L Breakdown",
          headers: ["Date", "Orders", "Revenue", "COGS", "Gross Profit", "Margin %"],
          rows: report.dailyRows.map((row) => [
            formatDate(row.date),
            row.orders,
            formatCurrency(row.revenue),
            formatCurrency(row.cogs),
            formatCurrency(row.profit),
            `${row.margin.toFixed(1)}%`,
          ]),
        },
      ],
    }),
    [report, filters]
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
              Profit & Loss
            </h1>
          </div>
          <ReportExportButtons payload={exportPayload} />
        </div>
        <ReportsNav />
      </header>

      <ReportFiltersBar
        filters={filters}
        onChange={setFilters}
        products={products}
        orders={orders}
        config={{
          date: true,
          search: true,
          searchPlaceholder: "Invoice, customer, product...",
          category: true,
          paymentType: true,
          minMaxTotal: true,
          sortBy: [
            { value: "default", label: "Date (Newest)" },
            { value: "date_asc", label: "Date (Oldest)" },
            { value: "revenue_desc", label: "Revenue (High → Low)" },
            { value: "revenue_asc", label: "Revenue (Low → High)" },
            { value: "profit_desc", label: "Profit (High → Low)" },
          ],
        }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(report.revenue), color: "text-indigo-600" },
          { label: "Cost of Goods Sold", value: formatCurrency(report.cogs), color: "text-amber-600" },
          { label: "Gross Profit", value: formatCurrency(report.grossProfit), color: "text-emerald-600" },
          { label: "Gross Margin", value: `${report.margin.toFixed(1)}%`, color: "text-violet-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <p className={`text-xl sm:text-2xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{report.orderCount} orders</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Daily P&L Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Orders</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-right">COGS</th>
                <th className="px-6 py-4 text-right">Gross Profit</th>
                <th className="px-6 py-4 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {report.dailyRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No sales data for the selected filters.
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
                    <td className="px-6 py-4 text-right text-amber-600">{formatCurrency(row.cogs)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{row.margin.toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
