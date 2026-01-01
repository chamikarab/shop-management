"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaEdit, FaTrash, FaPlus, FaBox, FaSearch, FaFilter, FaTimes, FaLayerGroup } from "react-icons/fa";
import WithPermission from "@/components/WithPermission";

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
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchProducts = async () => {
    const res = await fetch(`${apiUrl}/products`);
    const data = await res.json();
    setProducts(data);
  };

  // Filter products based on search and status
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const updatedStock = parseInt((formData.get('stock') as string) || '0');
    const updatedStatus =
      updatedStock === 0 ? "Out of Stock" : (formData.get('status') as string) || 'Available';

    const updatedProduct = {
      name: (formData.get('name') as string) || '',
      category: (formData.get('category') as string) || '',
      categoryColor: (formData.get('categoryColorText') as string) || (formData.get('categoryColor') as string) || '#667eea',
      size: (formData.get('size') as string) || '',
      packaging: (formData.get('packaging') as string) || '',
      price: parseFloat((formData.get('price') as string) || '0'),
      stock: updatedStock,
      status: updatedStatus,
    };

    await fetch(`${apiUrl}/products/${editing._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    });

    toast.success(`Product "${updatedProduct.name}" updated`);
    setEditing(null);
    fetchProducts();
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      await fetch(`${apiUrl}/products/${product._id}`, {
        method: "DELETE",
      });
      toast.success(`Product "${product.name}" deleted`);
      fetchProducts();
    }
  };

  const handleIncreaseStock = async (product: Product) => {
    const amountStr = prompt(`Enter stock to add to "${product.name}"`);
    const amount = parseInt(amountStr || "0");
    if (!isNaN(amount) && amount > 0) {
      await fetch(`${apiUrl}/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          stock: product.stock + amount,
          status: product.stock + amount > 0 ? "Available" : product.status,
        }),
      });
      toast.success(`Stock increased by ${amount} for "${product.name}"`);
      fetchProducts();
    } else {
      toast.error("Invalid stock value.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/30 min-h-screen animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Inventory Management
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest border border-indigo-200">System Core</span>
            <p className="text-slate-500 font-medium">Control and monitor your product stock levels</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <FaBox size={18} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 leading-none">
                {products.length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total SKUs</div>
            </div>
          </div>
          <Link
            href="/admin/products/add"
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black px-8 py-4 rounded-2xl hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 active:scale-95"
          >
            <FaPlus size={14} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="lg:col-span-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">
              Live Search Catalog
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <FaSearch size={18} />
              </div>
              <input
                type="text"
                placeholder="Find products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">
              Inventory Status
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <FaFilter size={16} />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-14 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
              >
                <option value="all">All Inventory Records</option>
                <option value="Available">Available Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Unavailable">Discontinued</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 px-1 text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            Showing {filteredProducts.length} filtered results
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">Product Identification</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">Category</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">Parameters</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800 text-right">Price (LKR)</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800 text-center">Stock Audit</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FaBox size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-xl font-bold tracking-tight">No products detected</p>
                    <p className="text-slate-400 font-medium mt-2">Adjust filters or create a new SKU record</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-10 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-lg tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{product.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">ID: {product._id.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: product.categoryColor || '#667eea' }}></div>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{product.category || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">{product.size || "N/A"}</span>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">{product.packaging || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-lg font-black text-slate-900 tracking-tight">Rs. {product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                          product.stock > 10 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : product.stock > 0 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-rose-50 text-red-700 border-rose-100'
                        }`}>
                          {product.stock} Units
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${
                          product.status === 'Available' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setEditing(product)}
                          className="w-10 h-10 bg-white border-2 border-slate-200 text-slate-400 rounded-xl hover:border-amber-500 hover:text-amber-600 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center"
                          title="Modify Record"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleIncreaseStock(product)}
                          className="w-10 h-10 bg-white border-2 border-slate-200 text-slate-400 rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center"
                          title="Audit Adjustment"
                        >
                          <FaPlus size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="w-10 h-10 bg-white border-2 border-slate-200 text-slate-400 rounded-xl hover:border-rose-500 hover:text-rose-600 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center"
                          title="Purge SKU"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-md z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white shadow-inner">
                    <FaEdit size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-2">Edit Product</h2>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.1em]">SKU Revision Protocol</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="w-11 h-11 bg-white/5 hover:bg-white/15 rounded-xl flex items-center justify-center transition-all duration-300 hover:rotate-90 group border border-white/10"
                >
                  <FaTimes size={20} className="text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar bg-slate-50/30">
              <form onSubmit={handleUpdateProduct} className="space-y-8">
                {/* Identification Section */}
                <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <FaLayerGroup size={14} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Master Identity</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Title</label>
                      <input
                        name="name"
                        defaultValue={editing.name}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categorization</label>
                      <input
                        name="category"
                        defaultValue={editing.category}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Signature Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        name="categoryColor"
                        type="color"
                        defaultValue={editing.categoryColor || '#667eea'}
                        className="w-20 h-14 rounded-2xl border-4 border-slate-50 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                        onChange={(e) => {
                          const textInput = e.target.form?.querySelector('input[name="categoryColorText"]') as HTMLInputElement;
                          if (textInput) textInput.value = e.target.value;
                        }}
                      />
                      <input
                        type="text"
                        name="categoryColorText"
                        defaultValue={editing.categoryColor || '#667eea'}
                        placeholder="#RRGGBB"
                        className="flex-1 px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-mono font-bold"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        onChange={(e) => {
                          const colorInput = e.target.form?.querySelector('input[name="categoryColor"]') as HTMLInputElement;
                          if (colorInput && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value)) {
                            colorInput.value = e.target.value;
                          }
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* Metrics Section */}
                <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Core Metrics</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Volume/Size</label>
                      <select
                        name="size"
                        defaultValue={editing.size}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select Calibration</option>
                        <option value="330ml">330ml Standard</option>
                        <option value="500ml">500ml Medium</option>
                        <option value="750ml">750ml Premium</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Containment</label>
                      <select
                        name="packaging"
                        defaultValue={editing.packaging}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select Format</option>
                        <option value="Can">Aluminum Can</option>
                        <option value="Bottle">Glass Bottle</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Market Rate (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">Rs.</span>
                        <input
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={editing.price}
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-black text-lg"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Audit Quantity</label>
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        defaultValue={editing.stock}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-black text-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Status</label>
                    <select
                      name="status"
                      defaultValue={editing.status}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                    >
                      <option value="Available">Inventory: Active</option>
                      <option value="Out of Stock">Inventory: Depleted</option>
                      <option value="Unavailable">Inventory: Hidden</option>
                    </select>
                  </div>
                </section>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95"
                  >
                    Abort Changes
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply SKU Revision
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedProductsPage() {
  return (
    <WithPermission required="products:view">
      <ProductsPage />
    </WithPermission>
  );
}