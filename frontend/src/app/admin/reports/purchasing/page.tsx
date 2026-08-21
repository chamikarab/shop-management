"use client";

import { useEffect, useMemo, useState } from "react";
import BeerLoader from "@/components/BeerLoader";
import ReportExportButtons from "@/components/ReportExportButtons";
import ReportFiltersBar from "@/components/ReportFiltersBar";
import ReportsNav from "@/components/ReportsNav";
import { buildExportFilename, type ExportReportPayload } from "@/lib/exportReports";
import {
  DEFAULT_REPORT_FILTERS,
  buildPurchasingReport,
  fetchFullReportData,
  filterCategorySizeRows,
  formatCurrency,
  formatReportPeriod,
  resolveReportDateRange,
  sumPurchasingReport,
  type Product,
  type Purchase,
  type ReportFiltersState,
} from "@/lib/reports";

const PAGE_DEFAULT_FILTERS: ReportFiltersState = {
  ...DEFAULT_REPORT_FILTERS,
  datePreset: "today",
};

export default function PurchasingReportPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>(PAGE_DEFAULT_FILTERS);

  useEffect(() => {
    fetchFullReportData()
      .then((data) => {
        setProducts(data.products);
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
    () => buildPurchasingReport(products, purchases, dateRange),
    [products, purchases, dateRange]
  );

  const filteredRows = useMemo(
    () => filterCategorySizeRows(rows, filters),
    [rows, filters]
  );

  const grandTotal = useMemo(
    () => sumPurchasingReport(filteredRows),
    [filteredRows]
  );

  const reportSubtitle = periodLabel;

  const exportPayload: ExportReportPayload = useMemo(
    () => ({
      title: "Purchasing Report",
      subtitle: reportSubtitle,
      pdfTheme: "purchasing",
      filename: buildExportFilename(
        `purchasing-report-${dateRange.start || "all"}${dateRange.end && dateRange.end !== dateRange.start ? `-to-${dateRange.end}` : ""}`
      ),
      summary: [
        { label: "Period", value: reportSubtitle },
        { label: "Purchased Stock", value: String(grandTotal.purchasedStock) },
        { label: "Inventory Cost", value: formatCurrency(grandTotal.inventoryCost) },
        { label: "Avg Margin", value: `${grandTotal.margin.toFixed(1)}%` },
      ],
      sections: [
        {
          title: "Purchasing Report",
          headers: [
            "Category",
            "Size",
            "Purchased Stock",
            "Purchase Cost",
            "Selling Price",
            "Unit Profit",
            "Margin",
            "Inventory Cost",
          ],
          rows: [
            ...filteredRows.map((row) => [
              row.category,
              row.size,
              row.purchasedStock,
              formatCurrency(row.purchaseCost),
              formatCurrency(row.sellingPrice),
              formatCurrency(row.unitProfit),
              `${row.margin.toFixed(1)}%`,
              formatCurrency(row.inventoryCost),
            ]),
            [
              "Grand Total",
              "",
              grandTotal.purchasedStock,
              formatCurrency(grandTotal.purchaseCost),
              formatCurrency(grandTotal.sellingPrice),
              formatCurrency(grandTotal.unitProfit),
              `${grandTotal.margin.toFixed(1)}%`,
              formatCurrency(grandTotal.inventoryCost),
            ],
          ],
          mergeCategoryColumn: true,
        },
      ],
    }),
    [filteredRows, grandTotal, reportSubtitle, dateRange]
  );

  if (loading) return <BeerLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
              Procurement Analytics
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Purchasing Report
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Purchases by category & size — {reportSubtitle}
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
        config={{
          date: true,
          search: true,
          searchPlaceholder: "Category or size...",
          category: true,
          minMargin: true,
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
            Range: {formatReportPeriod(dateRange, filters.datePreset)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Purchased Stock", value: String(grandTotal.purchasedStock) },
          { label: "Inventory Cost", value: formatCurrency(grandTotal.inventoryCost) },
          { label: "Avg Unit Profit", value: formatCurrency(grandTotal.unitProfit) },
          { label: "Avg Margin", value: `${grandTotal.margin.toFixed(1)}%` },
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
                <th className="px-4 py-4 text-right">Purchased Stock</th>
                <th className="px-4 py-4 text-right">Purchase Cost</th>
                <th className="px-4 py-4 text-right">Selling Price</th>
                <th className="px-4 py-4 text-right">Unit Profit</th>
                <th className="px-4 py-4 text-right">Margin</th>
                <th className="px-4 py-4 text-right">Inventory Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No purchase records found for the selected period. Record stock via Purchase Products.
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
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">
                      {row.purchasedStock}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600">
                      {formatCurrency(row.purchaseCost)}
                    </td>
                    <td className="px-4 py-3 text-right text-indigo-600">
                      {formatCurrency(row.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {formatCurrency(row.unitProfit)}
                    </td>
                    <td className="px-4 py-3 text-right">{row.margin.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(row.inventoryCost)}
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
                  <td className="px-4 py-4 text-right text-indigo-700">
                    {grandTotal.purchasedStock}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {formatCurrency(grandTotal.purchaseCost)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {formatCurrency(grandTotal.sellingPrice)}
                  </td>
                  <td className="px-4 py-4 text-right text-emerald-700">
                    {formatCurrency(grandTotal.unitProfit)}
                  </td>
                  <td className="px-4 py-4 text-right">{grandTotal.margin.toFixed(1)}%</td>
                  <td className="px-4 py-4 text-right">
                    {formatCurrency(grandTotal.inventoryCost)}
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
