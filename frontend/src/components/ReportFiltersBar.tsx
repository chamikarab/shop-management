"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp, FaFilter, FaTimes } from "react-icons/fa";
import {
  DEFAULT_REPORT_FILTERS,
  type DatePreset,
  type Product,
  type Order,
  type ReportFiltersState,
  type StockStatusFilter,
  countActiveFilters,
  getDatePresetRange,
  getUniqueCategories,
  getUniquePackaging,
  getUniquePaymentTypes,
} from "@/lib/reports";

export type ReportFilterConfig = {
  date?: boolean;
  search?: boolean;
  searchPlaceholder?: string;
  category?: boolean;
  packaging?: boolean;
  paymentType?: boolean;
  stockStatus?: boolean;
  minMaxTotal?: boolean;
  minMargin?: boolean;
  hasCostData?: boolean;
  topLimit?: boolean;
  sortBy?: { value: string; label: string }[];
};

type Props = {
  filters: ReportFiltersState;
  onChange: (filters: ReportFiltersState) => void;
  config: ReportFilterConfig;
  products?: Product[];
  orders?: Order[];
  defaultFilters?: ReportFiltersState;
};

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "7 Days" },
  { value: "last30", label: "30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

const STOCK_OPTIONS: { value: StockStatusFilter; label: string }[] = [
  { value: "all", label: "All Stock Levels" },
  { value: "in_stock", label: "In Stock (10+)" },
  { value: "low_stock", label: "Low Stock (<10)" },
  { value: "out_of_stock", label: "Out of Stock" },
];

const TOP_LIMIT_OPTIONS = [
  { value: "all", label: "Show All" },
  { value: "5", label: "Top 5" },
  { value: "10", label: "Top 10" },
  { value: "20", label: "Top 20" },
  { value: "50", label: "Top 50" },
];

const inputClass =
  "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors";

const labelClass =
  "text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-2";

function FilterField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
      {children}
    </p>
  );
}

export default function ReportFiltersBar({
  filters,
  onChange,
  config,
  products = [],
  orders = [],
  defaultFilters = DEFAULT_REPORT_FILTERS,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = getUniqueCategories(products);
  const packagingOptions = getUniquePackaging(products);
  const paymentTypes = getUniquePaymentTypes(orders);

  const activeCount = countActiveFilters(filters, config, defaultFilters);

  const hasAdvanced = Boolean(config.minMaxTotal || config.minMargin || config.hasCostData);

  const activeChips = useMemo(() => {
    const chips: string[] = [];
    if (config.date && filters.datePreset !== defaultFilters.datePreset) {
      chips.push(DATE_PRESETS.find((p) => p.value === filters.datePreset)?.label || filters.datePreset);
    }
    if (config.search && filters.search.trim()) chips.push(`Search: "${filters.search.trim()}"`);
    if (config.category && filters.category !== "all") chips.push(filters.category);
    if (config.packaging && filters.packaging !== "all") chips.push(filters.packaging);
    if (config.paymentType && filters.paymentType !== "all") chips.push(filters.paymentType);
    if (config.stockStatus && filters.stockStatus !== "all") {
      chips.push(STOCK_OPTIONS.find((o) => o.value === filters.stockStatus)?.label || filters.stockStatus);
    }
    if (config.minMaxTotal && filters.minTotal) chips.push(`Min: ${filters.minTotal}`);
    if (config.minMaxTotal && filters.maxTotal) chips.push(`Max: ${filters.maxTotal}`);
    if (config.hasCostData && filters.hasCostData) chips.push("With cost data");
    if (config.topLimit && filters.topLimit !== "all") chips.push(`Top ${filters.topLimit}`);
    return chips;
  }, [filters, config, defaultFilters]);

  const update = (patch: Partial<ReportFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  const setDatePreset = (preset: DatePreset) => {
    if (preset === "custom") {
      update({ datePreset: preset });
      return;
    }
    if (preset === "all") {
      update({ datePreset: preset, startDate: "", endDate: "" });
      return;
    }
    const range = getDatePresetRange(preset);
    update({
      datePreset: preset,
      startDate: range.start,
      endDate: range.end,
    });
  };

  const reset = () => onChange({ ...defaultFilters });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <FaFilter className="text-indigo-600" size={12} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Report Filters</p>
            <p className="text-[10px] font-medium text-slate-400">
              {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? "s" : ""} applied` : "Showing default view"}
            </p>
          </div>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <FaTimes size={10} />
            Clear All
          </button>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Date presets as quick chips */}
        {config.date && (
          <div>
            <SectionTitle>Time Range</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDatePreset(preset.value)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all ${
                    filters.datePreset === preset.value
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {filters.datePreset === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <FilterField label="From Date">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => update({ startDate: e.target.value })}
                    className={inputClass}
                  />
                </FilterField>
                <FilterField label="To Date">
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => update({ endDate: e.target.value })}
                    className={inputClass}
                  />
                </FilterField>
              </div>
            )}
          </div>
        )}

        {/* Primary filters grid */}
        {(config.search ||
          config.category ||
          config.packaging ||
          config.paymentType ||
          config.stockStatus ||
          config.topLimit ||
          config.sortBy) && (
          <div>
            <SectionTitle>Filter By</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {config.search && (
                <FilterField label="Search" className="sm:col-span-2 lg:col-span-2">
                  <input
                    type="text"
                    placeholder={config.searchPlaceholder || "Search..."}
                    value={filters.search}
                    onChange={(e) => update({ search: e.target.value })}
                    className={inputClass}
                  />
                </FilterField>
              )}

              {config.category && (
                <FilterField label="Category">
                  <select
                    value={filters.category}
                    onChange={(e) => update({ category: e.target.value })}
                    className={inputClass}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FilterField>
              )}

              {config.packaging && (
                <FilterField label="Packaging">
                  <select
                    value={filters.packaging}
                    onChange={(e) => update({ packaging: e.target.value })}
                    className={inputClass}
                  >
                    <option value="all">All Packaging</option>
                    {packagingOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FilterField>
              )}

              {config.paymentType && (
                <FilterField label="Payment Method">
                  <select
                    value={filters.paymentType}
                    onChange={(e) => update({ paymentType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="all">All Methods</option>
                    {paymentTypes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FilterField>
              )}

              {config.stockStatus && (
                <FilterField label="Stock Status">
                  <select
                    value={filters.stockStatus}
                    onChange={(e) =>
                      update({ stockStatus: e.target.value as StockStatusFilter })
                    }
                    className={inputClass}
                  >
                    {STOCK_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FilterField>
              )}

              {config.topLimit && (
                <FilterField label="Results Limit">
                  <select
                    value={filters.topLimit}
                    onChange={(e) => update({ topLimit: e.target.value })}
                    className={inputClass}
                  >
                    {TOP_LIMIT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FilterField>
              )}

              {config.sortBy && (
                <FilterField label="Sort By">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => update({ sortBy: e.target.value })}
                    className={inputClass}
                  >
                    {config.sortBy.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FilterField>
              )}
            </div>
          </div>
        )}

        {/* Advanced options */}
        {hasAdvanced && (
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 mb-3"
            >
              {showAdvanced ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                {config.minMaxTotal && (
                  <>
                    <FilterField label="Min Order Total (Rs.)">
                      <input
                        type="number"
                        min="0"
                        placeholder="No minimum"
                        value={filters.minTotal}
                        onChange={(e) => update({ minTotal: e.target.value })}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      />
                    </FilterField>
                    <FilterField label="Max Order Total (Rs.)">
                      <input
                        type="number"
                        min="0"
                        placeholder="No maximum"
                        value={filters.maxTotal}
                        onChange={(e) => update({ maxTotal: e.target.value })}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      />
                    </FilterField>
                  </>
                )}

                {config.minMargin && (
                  <FilterField label="Min Margin %">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Any margin"
                      value={filters.minMargin}
                      onChange={(e) => update({ minMargin: e.target.value })}
                      className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                  </FilterField>
                )}

                {config.hasCostData && (
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 w-full h-10 px-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.hasCostData}
                        onChange={(e) => update({ hasCostData: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Purchase cost only
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {activeChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wide"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
