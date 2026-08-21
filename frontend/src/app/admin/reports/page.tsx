"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BeerLoader from "@/components/BeerLoader";
import ReportExportButtons from "@/components/ReportExportButtons";
import ReportFiltersBar from "@/components/ReportFiltersBar";
import ReportsNav from "@/components/ReportsNav";
import { buildExportFilename, type ExportReportPayload } from "@/lib/exportReports";
import {
  DEFAULT_REPORT_FILTERS,
  fetchReportData,
  filterOrders,
  filterProducts,
  formatCurrency,
  getFilterSubtitle,
  getProductCost,
  type Order,
  type Product,
  type ReportFiltersState,
} from "@/lib/reports";
import {
  FaArrowRight,
  FaChartLine,
  FaBoxes,
  FaShoppingCart,
  FaReceipt,
  FaTrophy,
  FaCalendarDay,
} from "react-icons/fa";

const PAGE_DEFAULT_FILTERS: ReportFiltersState = {
  ...DEFAULT_REPORT_FILTERS,
  datePreset: "last30",
};

export default function ReportsOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>(PAGE_DEFAULT_FILTERS);

  useEffect(() => {
    const load = async () => {
      const startTime = Date.now();
      try {
        const data = await fetchReportData();
        setProducts(data.products);
        setOrders(data.orders);
      } finally {
        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) {
          setTimeout(() => setLoading(false), 1000 - elapsed);
        } else {
          setLoading(false);
        }
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const filteredOrders = filterOrders(orders, filters);
    const filteredProducts = filterProducts(products, filters);

    const revenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const inventoryCost = filteredProducts.reduce(
      (sum, p) => sum + getProductCost(p) * p.stock,
      0
    );
    const inventoryRetail = filteredProducts.reduce(
      (sum, p) => sum + p.price * p.stock,
      0
    );
    const lowStock = filteredProducts.filter((p) => p.stock < 10).length;
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = filteredOrders.filter((o) => o.createdAt.startsWith(today));

    return {
      revenue,
      inventoryCost,
      inventoryRetail,
      lowStock,
      totalProducts: filteredProducts.length,
      totalOrders: filteredOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0),
      todayOrders: todayOrders.length,
    };
  }, [products, orders, filters]);

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Reports Overview",
      subtitle: getFilterSubtitle(filters),
      filename: buildExportFilename("reports-overview"),
      sections: [
        {
          title: "Business Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Total Revenue", formatCurrency(metrics.revenue)],
            ["Stock Value (Cost)", formatCurrency(metrics.inventoryCost)],
            ["Stock Value (Retail)", formatCurrency(metrics.inventoryRetail)],
            ["Low Stock Items", String(metrics.lowStock)],
            ["Total Products", String(metrics.totalProducts)],
            ["Total Orders", String(metrics.totalOrders)],
            ["Orders Today", String(metrics.todayOrders)],
            ["Today's Revenue", formatCurrency(metrics.todayRevenue)],
          ],
        },
      ],
    }),
    [metrics, filters]
  );

  const cards = [
    {
      href: "/admin/reports/daily-sales-summary",
      title: "Daily Sales Summary",
      desc: "Opening, purchase, sales & closing stock",
      icon: FaCalendarDay,
      color: "from-violet-500 to-purple-600",
      stat: String(metrics.todayOrders),
      statLabel: "Orders Today",
    },
    {
      href: "/admin/reports/pnl",
      title: "Monthly P&L",
      desc: "Revenue, expenses, gross & net profit by month",
      icon: FaChartLine,
      color: "from-emerald-500 to-teal-600",
      stat: formatCurrency(metrics.revenue),
      statLabel: "Total Revenue",
    },
    {
      href: "/admin/reports/stock-balance",
      title: "Daily Stock Balance",
      desc: "Current stock levels & valuation",
      icon: FaBoxes,
      color: "from-indigo-500 to-violet-600",
      stat: String(metrics.totalProducts),
      statLabel: "SKUs Tracked",
    },
    {
      href: "/admin/reports/purchasing",
      title: "Purchasing",
      desc: "Inventory cost & margin analysis",
      icon: FaShoppingCart,
      color: "from-amber-500 to-orange-600",
      stat: formatCurrency(metrics.inventoryCost),
      statLabel: "Stock at Cost",
    },
    {
      href: "/admin/reports/sales",
      title: "Sales Report",
      desc: "Daily sales, payment breakdown",
      icon: FaReceipt,
      color: "from-blue-500 to-cyan-600",
      stat: String(metrics.todayOrders),
      statLabel: "Orders Today",
    },
    {
      href: "/admin/reports/top-products",
      title: "Top Products",
      desc: "Best sellers by quantity & revenue",
      icon: FaTrophy,
      color: "from-rose-500 to-pink-600",
      stat: formatCurrency(metrics.todayRevenue),
      statLabel: "Today's Revenue",
    },
  ];

  if (loading) return <BeerLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
              Analytics Hub
            </p>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl">
              Business intelligence derived from sales, inventory, and purchasing data.
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
          category: true,
          stockStatus: true,
          paymentType: true,
        }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(metrics.revenue) },
          { label: "Stock Value (Cost)", value: formatCurrency(metrics.inventoryCost) },
          { label: "Stock Value (Retail)", value: formatCurrency(metrics.inventoryRetail) },
          { label: "Low Stock Items", value: String(metrics.lowStock) },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
            >
              <card.icon size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1">{card.title}</h2>
            <p className="text-sm text-slate-500 mb-4">{card.desc}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {card.statLabel}
                </p>
                <p className="text-xl font-black text-indigo-600">{card.stat}</p>
              </div>
              <FaArrowRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
