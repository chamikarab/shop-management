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
  normalizeId,
  type Order,
  type Product,
  type ReportFiltersState,
} from "@/lib/reports";

const PAGE_DEFAULT_FILTERS: ReportFiltersState = {
  ...DEFAULT_REPORT_FILTERS,
  datePreset: "last30",
};

export default function SalesReportPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>(PAGE_DEFAULT_FILTERS);

  useEffect(() => {
    fetchReportData()
      .then((data) => {
        setOrders(data.orders);
        setProducts(data.products);
      })
      .finally(() => setLoading(false));
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((p) => [normalizeId(p._id), p])),
    [products]
  );

  const report = useMemo(() => {
    const filtered = filterOrders(orders, filters, productMap);

    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    const paymentMap = new Map<string, { count: number; total: number }>();

    filtered.forEach((order) => {
      const day = order.createdAt.slice(0, 10);
      const daily = dailyMap.get(day) || { revenue: 0, orders: 0 };
      daily.revenue += order.total;
      daily.orders += 1;
      dailyMap.set(day, daily);

      const payment = paymentMap.get(order.paymentType) || { count: 0, total: 0 };
      payment.count += 1;
      payment.total += order.total;
      paymentMap.set(order.paymentType, payment);
    });

    let dailyRows = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
        avg: data.orders > 0 ? data.revenue / data.orders : 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (filters.sortBy === "revenue_desc") dailyRows.sort((a, b) => b.revenue - a.revenue);
    if (filters.sortBy === "orders_desc") dailyRows.sort((a, b) => b.orders - a.orders);
    if (filters.sortBy === "date_asc") dailyRows.sort((a, b) => a.date.localeCompare(b.date));

    const paymentRows = Array.from(paymentMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.total - a.total);

    const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);

    return {
      totalRevenue,
      totalOrders: filtered.length,
      avgOrder: filtered.length > 0 ? totalRevenue / filtered.length : 0,
      dailyRows,
      paymentRows,
    };
  }, [orders, productMap, filters]);

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Sales Report",
      subtitle: getFilterSubtitle(filters),
      filename: buildExportFilename("sales-report"),
      summary: [
        { label: "Total Revenue", value: formatCurrency(report.totalRevenue) },
        { label: "Total Orders", value: String(report.totalOrders) },
        { label: "Average Order Value", value: formatCurrency(report.avgOrder) },
      ],
      sections: [
        {
          title: "Daily Sales",
          headers: ["Date", "Orders", "Revenue", "Avg Order"],
          rows: report.dailyRows.map((row) => [
            formatDate(row.date),
            row.orders,
            formatCurrency(row.revenue),
            formatCurrency(row.avg),
          ]),
        },
        {
          title: "Payment Methods",
          headers: ["Method", "Orders", "Total", "Share"],
          rows: report.paymentRows.map((row) => [
            row.type,
            row.count,
            formatCurrency(row.total),
            report.totalRevenue > 0
              ? `${((row.total / report.totalRevenue) * 100).toFixed(1)}%`
              : "—",
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
              Sales Analytics
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Sales Report
            </h1>
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
          searchPlaceholder: "Invoice, customer, phone...",
          category: true,
          paymentType: true,
          minMaxTotal: true,
          sortBy: [
            { value: "default", label: "Date (Newest)" },
            { value: "date_asc", label: "Date (Oldest)" },
            { value: "revenue_desc", label: "Revenue (High → Low)" },
            { value: "orders_desc", label: "Orders (High → Low)" },
          ],
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(report.totalRevenue) },
          { label: "Total Orders", value: String(report.totalOrders) },
          { label: "Average Order Value", value: formatCurrency(report.avgOrder) },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <p className="text-2xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Daily Sales</h2>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Orders</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                  <th className="px-6 py-4 text-right">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {report.dailyRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No sales match the selected filters
                    </td>
                  </tr>
                ) : (
                  report.dailyRows.map((row) => (
                    <tr key={row.date} className="border-b border-slate-50">
                      <td className="px-6 py-3 font-bold">{formatDate(row.date)}</td>
                      <td className="px-6 py-3 text-right">{row.orders}</td>
                      <td className="px-6 py-3 text-right font-bold text-indigo-600">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-600">
                        {formatCurrency(row.avg)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Payment Methods</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Orders</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {report.paymentRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No payment data
                    </td>
                  </tr>
                ) : (
                  report.paymentRows.map((row) => (
                    <tr key={row.type} className="border-b border-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.type}</td>
                      <td className="px-6 py-4 text-right">{row.count}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">
                        {formatCurrency(row.total)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {report.totalRevenue > 0
                          ? `${((row.total / report.totalRevenue) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
