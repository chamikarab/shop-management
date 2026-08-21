"use client";

import { useEffect, useMemo, useState } from "react";
import BeerLoader from "@/components/BeerLoader";
import ReportExportButtons from "@/components/ReportExportButtons";
import ReportFiltersBar from "@/components/ReportFiltersBar";
import ReportsNav from "@/components/ReportsNav";
import { buildExportFilename, type ExportReportPayload } from "@/lib/exportReports";
import {
  DEFAULT_REPORT_FILTERS,
  buildDailyStockBalance,
  fetchFullReportData,
  filterCategorySizeRows,
  formatCurrency,
  formatReportPeriod,
  resolveReportDateRange,
  sumDailyStockBalance,
  type Order,
  type Product,
  type Purchase,
  type ReportFiltersState,
  type StockStatusLabel,
} from "@/lib/reports";
import { FaExclamationTriangle } from "react-icons/fa";

const PAGE_DEFAULT_FILTERS: ReportFiltersState = {
  ...DEFAULT_REPORT_FILTERS,
  datePreset: "today",
};

function StatusBadge({ status }: { status: StockStatusLabel }) {
  if (status === "Out") {
    return (
      <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase">
        Out
      </span>
    );
  }
  if (status === "Low") {
    return (
      <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">
        <FaExclamationTriangle size={8} /> Low
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">
      OK
    </span>
  );
}

export default function StockBalanceReportPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>(PAGE_DEFAULT_FILTERS);

  useEffect(() => {
    fetchFullReportData()
      .then((data) => {
        setProducts(data.products);
        setOrders(data.orders);
        setPurchases(data.purchases);
      })
      .finally(() => setLoading(false));
  }, []);

  const dateRange = useMemo(() => resolveReportDateRange(filters), [filters]);
  const periodLabel = useMemo(
    () => formatReportPeriod(dateRange, filters.datePreset),
    [dateRange, filters.datePreset]
  );

  const rows = useMemo(
    () => buildDailyStockBalance(products, orders, purchases, dateRange),
    [products, orders, purchases, dateRange]
  );

  const filteredRows = useMemo(
    () => filterCategorySizeRows(rows, filters),
    [rows, filters]
  );

  const grandTotal = useMemo(
    () => sumDailyStockBalance(filteredRows),
    [filteredRows]
  );

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Daily Stock Balance Report",
      subtitle: periodLabel,
      pdfTheme: "dailyStock",
      filename: buildExportFilename(
        `stock-balance-${dateRange.start || "all"}${dateRange.end && dateRange.end !== dateRange.start ? `-to-${dateRange.end}` : ""}`
      ),
      summary: [
        { label: "Period", value: periodLabel },
        { label: "Total In Hand", value: String(grandTotal.inHandStock) },
        { label: "Value at Cost", value: formatCurrency(grandTotal.costValue) },
        { label: "Value at Retail", value: formatCurrency(grandTotal.retailValue) },
      ],
      sections: [
        {
          title: "Daily Stock Balance",
          headers: [
            "Category",
            "Size",
            "Opening Stock",
            "Purchase Stock",
            "Sales Stock",
            "In Hand",
            "Cost Value",
            "Retail Value",
            "Status",
          ],
          rows: [
            ...filteredRows.map((row) => [
              row.category,
              row.size,
              row.openingStock,
              row.purchaseStock,
              row.salesStock,
              row.inHandStock,
              formatCurrency(row.costValue),
              formatCurrency(row.retailValue),
              row.status,
            ]),
            [
              "Grand Total",
              "",
              grandTotal.openingStock,
              grandTotal.purchaseStock,
              grandTotal.salesStock,
              grandTotal.inHandStock,
              formatCurrency(grandTotal.costValue),
              formatCurrency(grandTotal.retailValue),
              "",
            ],
          ],
          mergeCategoryColumn: true,
        },
      ],
    }),
    [filteredRows, grandTotal, periodLabel, dateRange]
  );

  if (loading) return <BeerLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
              Inventory Report
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Daily Stock Balance
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Stock movement and valuation by category & size — {periodLabel}
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
          stockStatus: true,
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Opening Stock", value: String(grandTotal.openingStock) },
          { label: "Purchase Stock", value: String(grandTotal.purchaseStock) },
          { label: "Value at Cost", value: formatCurrency(grandTotal.costValue) },
          { label: "Value at Retail", value: formatCurrency(grandTotal.retailValue) },
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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Size</th>
                <th className="px-4 py-4 text-right">Opening Stock</th>
                <th className="px-4 py-4 text-right">Purchase Stock</th>
                <th className="px-4 py-4 text-right">Sales Stock</th>
                <th className="px-4 py-4 text-right">In Hand</th>
                <th className="px-4 py-4 text-right">Cost Value</th>
                <th className="px-4 py-4 text-right">Retail Value</th>
                <th className="px-4 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No data for the selected period and filters.
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
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">
                      {row.salesStock}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">{row.inHandStock}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.costValue)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {formatCurrency(row.retailValue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={row.status} />
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
                  <td className="px-4 py-4 text-right text-indigo-700">
                    {grandTotal.salesStock}
                  </td>
                  <td className="px-4 py-4 text-right text-emerald-700">
                    {grandTotal.inHandStock}
                  </td>
                  <td className="px-4 py-4 text-right">{formatCurrency(grandTotal.costValue)}</td>
                  <td className="px-4 py-4 text-right text-emerald-700">
                    {formatCurrency(grandTotal.retailValue)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={grandTotal.status} />
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
