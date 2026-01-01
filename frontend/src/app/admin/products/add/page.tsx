"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaArrowLeft, FaLayerGroup, FaCheckCircle } from "react-icons/fa";
import WithPermission from "@/components/WithPermission";

function AddProductPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      name: (formData.get('name') as string)?.trim() || '',
      category: (formData.get('category') as string)?.trim() || '',
      categoryColor: (formData.get('categoryColorText') as string) || (formData.get('categoryColor') as string) || '#667eea',
      price: parseFloat((formData.get('price') as string) || '0'),
      stock: parseInt((formData.get('stock') as string) || '0'),
      status: (formData.get('status') as string) || 'Available',
      size: (formData.get('size') as string) || '',
      packaging: (formData.get('packaging') as string) || '',
    };

    if (!data.name || isNaN(data.price) || isNaN(data.stock)) {
      toast.error("Please fill out all fields correctly.");
      setLoading(false);
      return;
    }

    if (data.stock === 0) data.status = "Out of Stock";

    try {
      const res = await fetch(`${apiUrl}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Product added successfully!");
        router.push("/admin/products");
      } else {
        toast.error("Failed to add product.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/30 min-h-screen animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all border border-slate-200 group active:scale-95"
            title="Return to Inventory"
          >
            <FaArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Add New Product
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest border border-indigo-200">SKU Creation</span>
              <p className="text-slate-500 font-medium">Register a new product to your inventory system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identification Section */}
          <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <FaLayerGroup size={18} />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Master Identity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Title <span className="text-rose-500">*</span></label>
                <input
                  name="name"
                  placeholder="Enter product name"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categorization</label>
                <input
                  name="category"
                  placeholder="e.g., Beer, Wine, etc."
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Signature Color</label>
              <div className="flex items-center gap-4">
                <input
                  name="categoryColor"
                  type="color"
                  id="categoryColorPicker"
                  defaultValue="#667eea"
                  className="w-20 h-14 rounded-2xl border-4 border-slate-50 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                  onChange={(e) => {
                    const textInput = e.target.form?.querySelector('input[name="categoryColorText"]') as HTMLInputElement;
                    if (textInput) textInput.value = e.target.value;
                  }}
                />
                <input
                  type="text"
                  name="categoryColorText"
                  id="categoryColorText"
                  defaultValue="#667eea"
                  placeholder="#RRGGBB"
                  className="flex-1 px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-mono font-bold placeholder-slate-300"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  onChange={(e) => {
                    const colorInput = e.target.form?.querySelector('input[name="categoryColor"]') as HTMLInputElement;
                    if (colorInput && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value)) {
                      colorInput.value = e.target.value;
                    }
                  }}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 uppercase tracking-widest">Color code used for POS display categorization</p>
            </div>
          </section>

          {/* Metrics Section */}
          <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Core Metrics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Market Rate (LKR) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">Rs.</span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-black text-lg placeholder-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Audit Quantity <span className="text-rose-500">*</span></label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-black text-lg placeholder-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calibration/Size <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <select
                    name="size"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Select Size</option>
                    <option value="330ml">330ml Standard</option>
                    <option value="500ml">500ml Medium</option>
                    <option value="750ml">750ml Premium</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Containment Format <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <select
                    name="packaging"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Select Packaging</option>
                    <option value="Can">Aluminum Can</option>
                    <option value="Bottle">Glass Bottle</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Status</label>
              <div className="relative group">
                <select
                  name="status"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                >
                  <option value="Available">Inventory: Active</option>
                  <option value="Out of Stock">Inventory: Depleted</option>
                  <option value="Unavailable">Inventory: Hidden</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 uppercase tracking-widest">Note: Auto-switches to &quot;Depleted&quot; if quantity is 0</p>
            </div>
          </section>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Link
              href="/admin/products"
              className="flex-1 px-8 py-5 bg-white border-2 border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-[2rem] transition-all hover:bg-slate-50 active:scale-95 text-center flex items-center justify-center"
            >
              Abort Registration
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black uppercase tracking-widest text-[10px] py-5 rounded-[2.5rem] hover:shadow-2xl shadow-emerald-100 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle size={14} />
                  <span>Execute SKU Registration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddProductPage() {
  return (
    <WithPermission required="products:add">
      <AddProductPageContent />
    </WithPermission>
  );
}