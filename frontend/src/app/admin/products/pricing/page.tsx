"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FaDollarSign,
  FaBox,
  FaSearch,
  FaFilter,
  FaArrowUp,
  FaArrowDown,
  FaTags,
  FaPercentage,
  FaCoins,
} from "react-icons/fa";

import WithPermission from "@/components/WithPermission";
import BeerLoader from "@/components/BeerLoader";

type Product = {
  _id: string;
  name: string;
  category?: string;
  categoryColor?: string;
  size?: string;
  packaging?: string;
  price: number; // selling price
  stock: number;
  status?: string;
  purchasePriceWithoutVat?: number;
  vatPercentage?: number;
  purchasePriceWithVat?: number;
};

type SortKey = "name" | "category" | "price" | "purchasePriceWithoutVat";

function PurchasingPricePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchProducts = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/products`, { cache: "no-store" });
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products for pricing");
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = 1500 - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const list = products.filter((p) => {
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term) ||
        (p.size || "").toLowerCase().includes(term)
      );
    });

    return list.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? "";
      const bVal = (b as any)[sortBy] ?? "";
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, sortBy, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const handleFieldChange = (
    id: string,
    field:
      | "purchasePriceWithoutVat"
      | "vatPercentage"
      | "purchasePriceWithVat"
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = raw === "" ? undefined : Number(raw);

    setProducts((prev) =>
      prev.map((p) => {
        if (p._id !== id) return p;

        let base = p.purchasePriceWithoutVat;
        let vat = p.vatPercentage;
        let withVat = p.purchasePriceWithVat;

        if (field === "purchasePriceWithoutVat") {
          base = numeric;
          if (base != null && vat != null) {
            withVat =
              Math.round((base + base * (vat / 100)) * 100) / 100;
          } else if (base != null && withVat != null && base > 0) {
            vat = ((withVat - base) / base) * 100;
          }
        } else if (field === "vatPercentage") {
          vat = numeric;
          if (base != null && vat != null) {
            withVat =
              Math.round((base + base * (vat / 100)) * 100) / 100;
          }
        } else if (field === "purchasePriceWithVat") {
          withVat = numeric;
          if (base != null && withVat != null && base > 0) {
            vat = ((withVat - base) / base) * 100;
          }
        }

        return {
          ...p,
          purchasePriceWithoutVat: base,
          vatPercentage: vat,
          purchasePriceWithVat: withVat,
        };
      })
    );
  };

  const handleSaveRow = async (product: Product) => {
    if (!product._id) return;

    const base = product.purchasePriceWithoutVat;
    const vat = product.vatPercentage;

    if (base == null || isNaN(base)) {
      toast.error("Enter base purchasing price (without VAT)");
      return;
    }
    if (vat == null || isNaN(vat)) {
      toast.error("Enter VAT percentage");
      return;
    }

    try {
      setSavingIds((prev) => [...prev, product._id]);

      const payload = {
        purchasePriceWithoutVat: base,
        vatPercentage: vat,
        purchasePriceWithVat:
          product.purchasePriceWithVat ??
          Math.round((base + base * (vat / 100)) * 100) / 100,
      };

      const res = await fetch(`${apiUrl}/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update purchasing price");
      }

      toast.success(`Updated purchasing price for "${product.name}"`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save purchasing price");
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== product._id));
    }
  };

  const totalPurchaseValue = useMemo(
    () =>
      filteredProducts.reduce((sum, p) => {
        const base = p.purchasePriceWithoutVat ?? 0;
        return sum + base * p.stock;
      }, 0),
    [filteredProducts]
  );

  const totalPurchaseValueWithVat = useMemo(
    () =>
      filteredProducts.reduce((sum, p) => {
        const withVat = p.purchasePriceWithVat ?? 0;
        return sum + withVat * p.stock;
      }, 0),
    [filteredProducts]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 bg-[#f8fafc] min-h-screen">
      {loading && <BeerLoader />}

      {/* 2026 Ultra-Modern Studio Header */}
      <div className="relative mb-10 pt-0">
        <div className="absolute top-0 right-0 w-[60%] h-[600px] bg-gradient-to-bl from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent blur-[120px] -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
          <div className="flex items-start gap-12">
            <div className="space-y-4 lg:space-y-8">
              {/* Futuristic Breadcrumb */}
              <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
                <Link href="/admin" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Overview</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <Link href="/admin/products" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Products</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Purchase Pricing</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic break-words uppercase">
                  Pricing <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">Matrix</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg md:text-2xl leading-relaxed max-w-2xl">
                  Define base costs, VAT, and landed prices for your entire SKU catalog.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-indigo-700 border border-slate-100 shadow-xl shadow-slate-200/50">
              <FaDollarSign size={16} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Purchasing Master Control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="modern-card group flex items-center gap-6 border-l-4 border-slate-900 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
            <FaTags size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Editing Catalog</p>
            <p className="text-3xl font-black text-slate-900">{filteredProducts.length} <span className="text-sm opacity-30 uppercase ml-1">SKUs</span></p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <FaCoins size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Inventory Value (Ex. VAT)</p>
            <p className="text-3xl font-black text-slate-900">Rs. {totalPurchaseValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-emerald-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
            <FaPercentage size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Inventory Value (Inc. VAT)</p>
            <p className="text-3xl font-black text-slate-900 text-emerald-600 group-hover:text-white">Rs. {totalPurchaseValueWithVat.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="relative w-full lg:max-w-xl group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors duration-300">
            <FaSearch size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by name, category or size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-input !pl-16 !py-4 !rounded-2xl text-lg font-medium bg-slate-50/50 focus:bg-white transition-all duration-300"
          />
        </div>
        
        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">
          <FaFilter className="text-slate-300" />
          <span>Refining Matrix</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="modern-table shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">
                <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-3">
                    Asset Info
                    {sortBy === "name" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                  </div>
                </th>
                <th className="px-8 py-6">Classification</th>
                <th className="px-8 py-6 text-right">Retail Price</th>
                <th className="px-8 py-6 text-right cursor-pointer" onClick={() => toggleSort("purchasePriceWithoutVat")}>
                  <div className="flex items-center justify-end gap-3">
                    Base Cost (Ex. VAT)
                    {sortBy === "purchasePriceWithoutVat" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                  </div>
                </th>
                <th className="px-8 py-6 text-right">VAT Rate</th>
                <th className="px-8 py-6 text-right">Landed Cost (Inc. VAT)</th>
                <th className="px-8 py-6 text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => {
                const isSaving = savingIds.includes(product._id);

                return (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition-colors duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                          <FaBox size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-base tracking-tight">{product.name}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">SKU_{product._id.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm w-fit">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product.categoryColor || '#cbd5e1' }}></div>
                          <span className="text-slate-700 font-black text-[9px] uppercase tracking-widest">{product.category || "General"}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 italic pl-1">{product.size} · {product.packaging}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-slate-900 text-base tracking-tighter">Rs. {product.price.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="relative inline-block w-40">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black">Rs.</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={product.purchasePriceWithoutVat ?? ""}
                          onChange={handleFieldChange(product._id, "purchasePriceWithoutVat")}
                          className="modern-input !py-3 !pl-10 !pr-4 !rounded-xl text-right text-sm font-black tracking-tighter !bg-slate-50 focus:!bg-white border-transparent focus:border-indigo-500 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="relative inline-block w-24">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black">%</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={product.vatPercentage ?? ""}
                          onChange={handleFieldChange(product._id, "vatPercentage")}
                          className="modern-input !py-3 !pl-4 !pr-8 !rounded-xl text-right text-sm font-black tracking-tighter !bg-slate-50 focus:!bg-white border-transparent focus:border-indigo-500 transition-all"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="relative inline-block w-40">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-black">Rs.</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={product.purchasePriceWithVat ?? ""}
                          onChange={handleFieldChange(product._id, "purchasePriceWithVat")}
                          className="modern-input !py-3 !pl-10 !pr-4 !rounded-xl text-right text-sm font-black tracking-tighter text-emerald-600 !bg-emerald-50/30 focus:!bg-white border-transparent focus:border-emerald-500 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveRow(product)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.25em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? "Syncing..." : "Commit"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedPurchasingPricePage() {
  return (
    <WithPermission required="products:purchasing">
      <PurchasingPricePage />
    </WithPermission>
  );
}
