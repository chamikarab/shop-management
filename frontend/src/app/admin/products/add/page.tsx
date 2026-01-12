"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  FaTag, FaBarcode, FaImage, 
  FaCubes, FaShieldAlt, FaRocket,
  FaLayerGroup, FaMoneyBillWave, FaBoxOpen, FaRulerCombined, FaWineBottle
} from "react-icons/fa";
import WithPermission from "@/components/WithPermission";

function AddProductPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Form state for preview
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    categoryColor: "#667eea",
    price: 0,
    stock: 0,
    status: "Available",
    size: "",
    packaging: "",
  });

  const getCategoryGradient = (color: string) => {
    return `from-[${color}]/20 via-[${color}]/10 to-transparent`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      name: formData.name.trim(),
      category: formData.category.trim(),
    };

    if (!data.name || isNaN(data.price) || isNaN(data.stock)) {
      toast.error("Please ensure all required fields are filled correctly.");
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
        toast.success("Product successfully deployed to catalog!");
        router.push("/admin/products");
      } else {
        toast.error("Failed to register product.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during deployment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 min-h-screen bg-[#f8fafc]">
      {/* 2026 Ultra-Modern Studio Header */}
      <div className="relative mb-10 pt-0">
        <div className="absolute top-0 right-0 w-[60%] h-[600px] bg-gradient-to-bl from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent blur-[120px] -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="flex items-start gap-12">
            <div className="space-y-4 lg:space-y-8">
              {/* Futuristic Breadcrumb */}
              <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
                <Link href="/admin" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Overview</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <Link href="/admin/products" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">All Products</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Add New Product</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic break-words">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">Add New Product</span>
            </h1>
                <p className="text-slate-400 font-medium text-lg md:text-2xl leading-relaxed max-w-2xl">
                  Architecting next-generation SKU metadata for your global retail ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Configuration Area */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Identity & Branding */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-50/50 transition-colors duration-700" />
            
              <div className="flex items-center gap-4 mb-10 relative">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <FaTag size={20} />
              </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Identity & Branding</h2>
                  <p className="text-sm text-slate-400 font-medium">Core descriptive attributes for the system.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Product Title <span className="text-rose-500">*</span></label>
                <input
                  name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Premium Crafted Lager"
                  required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                />
              </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Market Category</label>
                  <div className="relative">
                <input
                  name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g. Beverages"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                      <FaLayerGroup size={16} />
                    </div>
                  </div>
              </div>
            </div>

              <div className="mt-8 space-y-3 relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">POS Interface Color</label>
                <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 border-dashed">
                  <div className="relative group">
                <input
                  name="categoryColor"
                  type="color"
                      value={formData.categoryColor}
                      onChange={handleInputChange}
                      className="w-20 h-20 p-1.5 bg-white border-4 border-white rounded-[1.5rem] cursor-pointer shadow-xl ring-1 ring-slate-200 group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300">#</span>
                <input
                  type="text"
                        name="categoryColor"
                        value={formData.categoryColor}
                        onChange={handleInputChange}
                        className="bg-transparent border-none text-xl font-mono font-black text-slate-800 focus:ring-0 w-32 p-0 uppercase"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-xs">
                      Color identifier used for quick-access buttons in the POS terminal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financials & Stock */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-emerald-50/50 transition-colors duration-700" />
              
              <div className="flex items-center gap-4 mb-10 relative">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <FaBarcode size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Financials & Inventory</h2>
                  <p className="text-sm text-slate-400 font-medium">Price points and initial audit quantities.</p>
                </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Unit Retail Price (LKR) *</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg group-focus-within:text-indigo-500 transition-colors">Rs.</span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                      value={formData.price || ""}
                      onChange={handleInputChange}
                    placeholder="0.00"
                    required
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900 font-black text-2xl tracking-tighter"
                  />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none">
                      <FaMoneyBillWave size={20} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Initial Stock Audit *</label>
                  <div className="relative">
                <input
                  name="stock"
                  type="number"
                  min="0"
                      value={formData.stock || ""}
                      onChange={handleInputChange}
                  placeholder="0"
                  required
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900 font-black text-2xl tracking-tighter"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Units</span>
                      <FaBoxOpen size={18} className="text-slate-200" />
                    </div>
                  </div>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 relative">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Volume Metric *</label>
                  <div className="relative">
                  <select
                    name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                    required
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                  >
                      <option value="">Select Calibration</option>
                    <option value="330ml">330ml Standard</option>
                    <option value="500ml">500ml Medium</option>
                    <option value="750ml">750ml Premium</option>
                      <option value="1L">1 Litre Elite</option>
                  </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-3">
                      <FaRulerCombined size={14} className="text-slate-300" />
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Packaging Format *</label>
                  <div className="relative">
                  <select
                    name="packaging"
                      value={formData.packaging}
                      onChange={handleInputChange}
                    required
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                  >
                      <option value="">Select Containment</option>
                    <option value="Can">Aluminum Can</option>
                    <option value="Bottle">Glass Bottle</option>
                      <option value="Box">Bulk Carton</option>
                  </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-3">
                      <FaWineBottle size={14} className="text-slate-300" />
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Action */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <Link
              href="/admin/products"
                className="flex-1 px-8 py-5 bg-white border-2 border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[14px] rounded-[2rem] transition-all hover:bg-slate-50 active:scale-95 text-center flex items-center justify-center"
            >
                Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
                className="flex-[2] bg-slate-900 text-white font-black uppercase tracking-widest text-[14px] py-6 rounded-[2.5rem] hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-xl shadow-slate-200"
            >
              {loading ? (
                <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing SKU...</span>
                </>
              ) : (
                <>
                    <FaRocket size={18} />
                    <span>Deploy Product</span>
                </>
              )}
            </button>
          </div>
        </form>
        </div>

        {/* Dynamic Sidebar: Preview & Security */}
        <div className="lg:col-span-4">
          <div className="sticky top-0 space-y-10">
            {/* Futuristic Product Card Preview */}
            <div className="bg-white rounded-[3rem] p-0 overflow-hidden border border-slate-200 shadow-2xl group transition-all duration-500 hover:-translate-y-2 ring-1 ring-slate-200/50 relative">
              {/* Simulation Tag Overlay */}
              <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
                <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-indigo-400">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Live Simulation
                </div>
              </div>

              <div className="h-64 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                {/* Dynamic Background Mesh */}
                <div 
                  className="absolute inset-0 opacity-40 transition-all duration-700" 
                  style={{ background: `radial-gradient(circle at 50% 50%, ${formData.categoryColor} 0%, transparent 70%)` }} 
                />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border-8 border-white ring-1 ring-slate-200">
                    <FaImage size={48} className="text-slate-200" />
                  </div>
                  <div className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-xl ring-1 ring-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-inner animate-pulse" style={{ backgroundColor: formData.categoryColor }}></div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{formData.category || "General SKU"}</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/50 backdrop-blur-md ${
                    formData.status === 'Available' ? 'bg-emerald-500 text-white' : 
                    formData.status === 'Out of Stock' ? 'bg-rose-500 text-white' : 
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {formData.status}
                  </span>
                </div>
              </div>

              <div className="p-10 space-y-10 bg-white relative">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter line-clamp-1 mb-2 group-hover:text-indigo-600 transition-colors">
                    {formData.name || "Untitled Asset"}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                    <FaCubes size={12} className="text-indigo-500" />
                    {formData.size || "---"} <span className="opacity-30">•</span> {formData.packaging || "---"}
                  </div>
                </div>

                <div className="space-y-8 pt-8 border-t border-slate-100">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pricing Strategy</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">
                        <span className="text-base font-bold text-slate-400 mr-1.5">Rs.</span>
                        {formData.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Inventory</p>
                      <p className={`text-2xl font-black ${
                        formData.stock > 10 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formData.stock} <span className="text-xs font-black uppercase ml-1 opacity-40">Units</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Asset Integrity</p>
                    <div className="flex gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-1000" 
                          style={{ width: formData.name ? '100%' : '20%' }}
                        />
                      </div>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: formData.price > 0 ? '100%' : '0%' }}
                        />
                      </div>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-1000" 
                          style={{ width: formData.size ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deployment Security Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-slate-800">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-700" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700" />
              
              <div className="flex items-center gap-6 mb-10 relative">
                <div className="p-4 bg-white/5 rounded-2xl text-emerald-400 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <FaShieldAlt size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">Deployment Guard</h4>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">SKU Validation v2.6</p>
                </div>
              </div>

              <div className="space-y-6 relative">
                {[
                  { id: "01", text: "Automated SKU generation and POS node synchronization." },
                  { id: "02", text: "Inventory locking until successful database commitment." },
                  { id: "03", text: "Integrated stock health monitoring with alert threshold (10 units)." }
                ].map((item) => (
                  <div key={item.id} className="flex gap-4 group/item">
                    <span className="text-emerald-500 font-black text-xs pt-0.5 group-hover/item:scale-125 transition-transform">{item.id}.</span>
                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed group-hover/item:text-slate-300 transition-colors">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Registry Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
