"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FaShoppingCart,
  FaTruck,
  FaPlus,
  FaTrash,
  FaBox,
  FaDollarSign,
  FaReceipt,
  FaWarehouse,
  FaArrowRight,
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
  price: number;
  stock: number;
  status?: string;
  purchasePriceWithoutVat?: number;
  purchasePriceWithVat?: number;
};

type PurchaseItem = {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
};

function PurchasingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: "row-1", productId: "", quantity: 0, unitCost: 0 },
  ]);
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch products (for selection)
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/products`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await res.json();
        if (isMounted) {
          setProducts(data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load products for purchasing");
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = 1500 - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            if (isMounted) setLoading(false);
          }, remaining);
        } else {
          if (isMounted) setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  // Totals
  const { grandTotalWithoutVat, grandTotalWithVat } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (!item.productId || item.quantity <= 0) {
          return acc;
        }
        const product = products.find((p) => p._id === item.productId);
        if (!product) return acc;

        const unitWithoutVat = product.purchasePriceWithoutVat ?? 0;
        const unitWithVat =
          product.purchasePriceWithVat ??
          product.purchasePriceWithoutVat ??
          0;

        acc.grandTotalWithoutVat += unitWithoutVat * item.quantity;
        acc.grandTotalWithVat += unitWithVat * item.quantity;
        return acc;
      },
      { grandTotalWithoutVat: 0, grandTotalWithVat: 0 }
    );
  }, [items, products]);

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [items]
  );

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `row-${prev.length + 1}-${Date.now()}`,
        productId: "",
        quantity: 0,
        unitCost: 0,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setItems((prev) => {
      if (prev.length === 1) return prev; // keep at least one row
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleProductSelect = (rowId: string, productId: string) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const product = products.find((p) => p._id === productId);
        const autoCost =
          product?.purchasePriceWithVat ??
          product?.purchasePriceWithoutVat ??
          0;
        return {
          ...row,
          productId,
          unitCost: autoCost || 0,
        };
      })
    );
  };

  const updateItemField = (
    id: string,
    field: keyof PurchaseItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "quantity" || field === "unitCost") {
          const numeric = parseFloat(value || "0");
          return { ...item, [field]: isNaN(numeric) ? 0 : numeric };
        }

        return { ...item, [field]: value as any };
      })
    );
  };

  const resetForm = () => {
    setItems([{ id: "row-1", productId: "", quantity: 0, unitCost: 0 }]);
    setSupplierName("");
    setInvoiceNumber("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(
      (i) => i.productId && i.quantity > 0
    );

    if (!supplierName.trim()) {
      toast.error("Please enter supplier name");
      return;
    }

    if (validItems.length === 0) {
      toast.error("Add at least one valid product row");
      return;
    }

    const startTime = Date.now();
    setSaving(true);

    try {
      // Each row increments stock of selected product.
      for (const row of validItems) {
        const product = products.find((p) => p._id === row.productId);
        if (!product) continue;

        const updated: Partial<Product> = {
          stock: product.stock + row.quantity,
          status: product.stock + row.quantity > 0 ? "Available" : "Out of Stock",
        };

        const res = await fetch(`${apiUrl}/products/${product._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });

        if (!res.ok) {
          throw new Error(`Failed to update stock for ${product.name}`);
        }
      }

      const elapsed = Date.now() - startTime;
      const remaining = 1500 - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      toast.success("Purchase intake complete. Inventory synchronized.");
      resetForm();

      // Refresh product list
      const res = await fetch(`${apiUrl}/products`, { cache: "no-store" });
      const data = await res.json();
      setProducts(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to record purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 bg-[#f8fafc] min-h-screen">
      {(loading || saving) && <BeerLoader />}

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
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Purchase Console</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic break-words uppercase">
                   
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">Purchase Console</span>
          </h1>
                <p className="text-slate-400 font-medium text-lg md:text-2xl leading-relaxed max-w-2xl">
                  Record batch arrivals and synchronize your global stock levels with zero latency.
                </p>
              </div>
        </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-indigo-700 border border-slate-100 shadow-xl shadow-slate-200/50">
              <FaShoppingCart size={16} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Purchasing Master Control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="modern-card group flex items-center gap-6 border-l-4 border-slate-900 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
            <FaBox size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Unique SKUs</p>
            <p className="text-3xl font-black text-slate-900">{items.filter(i => i.productId).length}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <FaTruck size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Units</p>
            <p className="text-3xl font-black text-slate-900">{totalUnits}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-emerald-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
            <FaDollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ex. VAT Value</p>
            <p className="text-3xl font-black text-slate-900">Rs. {grandTotalWithoutVat.toLocaleString()}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-violet-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-violet-50 rounded-2xl text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-500">
            <FaReceipt size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Inc. VAT Value</p>
            <p className="text-3xl font-black text-slate-900">Rs. {grandTotalWithVat.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <form onSubmit={handleSubmit} className="space-y-10">
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* --- SOURCE DETAILS --- */}
          <div className="xl:col-span-2 space-y-8">
            <div className="modern-card p-8 space-y-8 border border-slate-200/60 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem]">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <FaWarehouse size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Source Context</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Supplier Entity</label>
                  <div className="relative group">
                    <input
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Enter supplier name..."
                      className="modern-input !py-3 !rounded-xl !bg-slate-50/50 focus:!bg-white border-transparent focus:border-indigo-500 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reference ID</label>
                  <input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-0000"
                    className="modern-input !py-3 !rounded-xl !bg-slate-50/50 focus:!bg-white border-transparent focus:border-indigo-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Intake Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="modern-input !py-3 !rounded-xl !bg-slate-50/50 focus:!bg-white border-transparent focus:border-indigo-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Observations</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief notes..."
                    className="modern-input !py-3 !rounded-xl !bg-slate-50/50 focus:!bg-white border-transparent focus:border-indigo-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTION PANEL */}
          <div className="xl:col-span-1">
            <div className="modern-card p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-900/30 h-full flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
              
              <div className="relative space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Global Valuation</p>
                  <p className="text-4xl font-black tracking-tighter text-emerald-400">Rs. {grandTotalWithVat.toLocaleString()}</p>
                </div>
                <p className="text-slate-500 text-xs font-medium leading-relaxed italic">
                  Verify SKU mappings and quantities before committing. This action updates global inventory instantly.
                </p>
              </div>

              <div className="relative pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {saving ? (
                    <span className="animate-pulse">Syncing...</span>
                  ) : (
                    <>
                      <span>Commit Intake</span>
                      <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- PURCHASE INVENTORY TABLE --- */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-slate-100 text-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <FaBox size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Line Items</h2>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg group"
            >
              <FaPlus size={10} className="group-hover:rotate-90 transition-transform duration-500" />
              Add Item
            </button>
          </div>

          <div className="modern-table shadow-2xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">
                    <th className="px-8 py-6">Catalog Asset</th>
                    <th className="px-8 py-6 text-center">Hub Stock</th>
                    <th className="px-8 py-6 text-center w-[180px]">Intake Qty</th>
                    <th className="px-8 py-6 text-right">Net Total</th>
                    <th className="px-8 py-6 text-right">Landed Total</th>
                    <th className="px-8 py-6 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((row) => {
                    const product = products.find((p) => p._id === row.productId);
                    const unitWithoutVat = product?.purchasePriceWithoutVat ?? 0;
                    const unitWithVat = product?.purchasePriceWithVat ?? product?.purchasePriceWithoutVat ?? 0;
                    const lineTotalWithoutVat = (row.quantity || 0) * (unitWithoutVat || 0);
                    const lineTotalWithVat = (row.quantity || 0) * (unitWithVat || 0);

                    return (
                      <tr key={row.id} className="group hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2 min-w-[250px]">
                            <select
                              value={row.productId}
                              onChange={(e) => handleProductSelect(row.id, e.target.value)}
                              className="modern-input !py-2 !px-4 !rounded-xl !text-sm !bg-slate-50/50 border-transparent focus:border-indigo-500 font-black tracking-tight cursor-pointer"
                            >
                              <option value="">Select Asset...</option>
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} ({p.size})
                                </option>
                              ))}
                            </select>
                            {product && (
                              <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: product.categoryColor || '#cbd5e1' }} />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.category}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-8 py-6 text-center">
                          {product ? (
                            <span className="text-base font-black text-slate-900 tracking-tighter">{product.stock} <span className="text-[10px] text-slate-300 ml-1">Units</span></span>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>

                        <td className="px-8 py-6">
                          <input
                            type="number"
                            min={0}
                            value={row.quantity || ""}
                            onChange={(e) => updateItemField(row.id, "quantity", e.target.value)}
                            placeholder="0"
                            className="modern-input !py-2 !rounded-xl text-center font-black text-base tracking-tighter border-slate-200 focus:border-emerald-500 !bg-slate-50/30"
                          />
                        </td>

                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-slate-900 tracking-tighter">
                              Rs. {lineTotalWithoutVat.toLocaleString()}
                            </span>
                            {row.quantity > 0 && product && (
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                @ Rs. {unitWithoutVat.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-emerald-600 tracking-tighter">
                              Rs. {lineTotalWithVat.toLocaleString()}
                            </span>
                            {row.quantity > 0 && product && (
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                @ Rs. {unitWithVat.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <FaTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div className="py-20 text-center bg-slate-50/30">
                <p className="text-slate-400 text-sm font-bold italic mb-6">Matrix is empty.</p>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  Inject Line
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default function ProtectedPurchasingPage() {
  return (
    <WithPermission required="products:purchasing">
      <PurchasingPage />
    </WithPermission>
  );
}
