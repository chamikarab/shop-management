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
  getFilterSubtitle,
  getItemRevenue,
  normalizeId,
  type Order,
  type Product,
  type ReportFiltersState,
} from "@/lib/reports";

const PAGE_DEFAULT_FILTERS: ReportFiltersState = {
  ...DEFAULT_REPORT_FILTERS,
  datePreset: "last30",
  sortBy: "revenue",
  topLimit: "10",
};

export default function TopProductsReportPage() {
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

  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; category: string; quantity: number; revenue: number; orders: number }
    >();

    filterOrders(orders, filters, productMap).forEach((order) => {
      order.items.forEach((item) => {
        if (filters.category !== "all") {
          const product = productMap.get(normalizeId(item.productId));
          if ((product?.category || "Uncategorized") !== filters.category) return;
        }

        const key = item.productId || item.name;
        const product = productMap.get(normalizeId(item.productId));
        const entry = map.get(key) || {
          name: item.name,
          category: product?.category || "Uncategorized",
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
        entry.quantity += item.quantity;
        entry.revenue += getItemRevenue(item);
        entry.orders += 1;
        map.set(key, entry);
      });
    });

    let rows = Array.from(map.values());

    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      if (filters.sortBy === "quantity") return b.quantity - a.quantity;
      if (filters.sortBy === "orders") return b.orders - a.orders;
      if (filters.sortBy === "name_asc") return a.name.localeCompare(b.name);
      return b.revenue - a.revenue;
    });

    if (filters.topLimit !== "all") {
      rows = rows.slice(0, Number(filters.topLimit));
    }

    return rows;
  }, [orders, productMap, filters]);

  const totals = useMemo(
    () =>
      topProducts.reduce(
        (acc, p) => ({
          quantity: acc.quantity + p.quantity,
          revenue: acc.revenue + p.revenue,
        }),
        { quantity: 0, revenue: 0 }
      ),
    [topProducts]
  );

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Top Products Report",
      subtitle: getFilterSubtitle(filters),
      filename: buildExportFilename("top-products-report"),
      summary: [
        { label: "Total Units Sold", value: String(totals.quantity) },
        { label: "Total Product Revenue", value: formatCurrency(totals.revenue) },
      ],
      sections: [
        {
          title: "Top Products",
          headers: ["Rank", "Product", "Category", "Qty Sold", "Revenue", "Line Items", "Revenue Share"],
          rows: topProducts.map((row, index) => [
            index + 1,
            row.name,
            row.category,
            row.quantity,
            formatCurrency(row.revenue),
            row.orders,
            totals.revenue > 0
              ? `${((row.revenue / totals.revenue) * 100).toFixed(1)}%`
              : "—",
          ]),
        },
      ],
    }),
    [topProducts, totals, filters]
  );

  if (loading) return <BeerLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
              Product Performance
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Top Products
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
          searchPlaceholder: "Product name...",
          category: true,
          paymentType: true,
          topLimit: true,
          sortBy: [
            { value: "revenue", label: "Revenue (High → Low)" },
            { value: "quantity", label: "Quantity Sold" },
            { value: "orders", label: "Order Lines" },
            { value: "name_asc", label: "Name (A → Z)" },
          ],
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Total Units Sold
          </p>
          <p className="text-2xl font-black text-slate-900">{totals.quantity}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Total Product Revenue
          </p>
          <p className="text-2xl font-black text-indigo-600">{formatCurrency(totals.revenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Qty Sold</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-right">Line Items</th>
                <th className="px-6 py-4 text-right">Revenue Share</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No product sales match the selected filters
                  </td>
                </tr>
              ) : (
                topProducts.map((row, index) => (
                  <tr key={row.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-xs font-black ${
                          index === 0
                            ? "bg-amber-100 text-amber-600"
                            : index === 1
                              ? "bg-slate-200 text-slate-600"
                              : index === 2
                                ? "bg-orange-100 text-orange-600"
                                : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{row.name}</td>
                    <td className="px-6 py-4 text-slate-600">{row.category}</td>
                    <td className="px-6 py-4 text-right font-bold">{row.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{row.orders}</td>
                    <td className="px-6 py-4 text-right">
                      {totals.revenue > 0
                        ? `${((row.revenue / totals.revenue) * 100).toFixed(1)}%`
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
  );
}
