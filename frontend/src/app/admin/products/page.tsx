"use client";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  FaEdit, FaTrash, FaPlus, FaBox, FaSearch, FaFilter, 
  FaThLarge, FaList, FaArrowUp, FaArrowDown,
  FaCubes, FaExclamationTriangle, FaDollarSign, FaImage
} from "react-icons/fa";
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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [restocking, setRestocking] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<keyof Product>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchProducts = async () => {
    try {
      setLoading(true);
    const res = await fetch(`${apiUrl}/products`);
    const data = await res.json();
    setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    
    return { total, lowStock, outOfStock, totalValue };
  }, [products]);

  // Filter and Sort products
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortBy] || "";
        const valB = b[sortBy] || "";
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, searchTerm, filterStatus, sortBy, sortOrder]);

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

    try {
      const res = await fetch(`${apiUrl}/products/${editing._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    });

      if (res.ok) {
    toast.success(`Product "${updatedProduct.name}" updated`);
    setEditing(null);
    fetchProducts();
      } else {
        toast.error("Failed to update product");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = (product: Product) => {
    setDeleting(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`${apiUrl}/products/${deleting._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Product "${deleting.name}" deleted`);
        setDeleting(null);
      fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const handleIncreaseStock = (product: Product) => {
    setRestocking(product);
    setRestockAmount("");
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restocking) return;

    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid stock quantity.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/products/${restocking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...restocking,
          stock: restocking.stock + amount,
          status: restocking.stock + amount > 0 ? "Available" : restocking.status,
        }),
      });

      if (res.ok) {
        toast.success(`Stock increased by ${amount} for "${restocking.name}"`);
        setRestocking(null);
      fetchProducts();
      } else {
        toast.error("Failed to update stock");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const toggleSort = (key: keyof Product) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 min-h-screen bg-[#f8fafc]">
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
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">All Products</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic break-words">
                   
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">All Products</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg md:text-2xl leading-relaxed max-w-2xl">
                  Managing and optimizing your high-performance retail inventory.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-6">
          <Link
            href="/admin/products/add"
              className="flex items-center gap-3 group bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 lg:mr-8"
            >
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <FaPlus size={14} />
              </div>
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Register New SKU</span>
          </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="modern-card group flex items-center gap-6 border-l-4 border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <FaCubes size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Products</p>
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-amber-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
            <FaExclamationTriangle size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Low Stock</p>
            <p className="text-3xl font-black text-slate-900">{stats.lowStock}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-rose-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
            <FaBox size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Out of Stock</p>
            <p className="text-3xl font-black text-slate-900">{stats.outOfStock}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-emerald-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
            <FaDollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Inventory Value</p>
            <p className="text-3xl font-black text-slate-900">Rs. {stats.totalValue.toLocaleString()}</p>
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
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-input !pl-16 !py-4 !rounded-2xl text-lg font-medium bg-slate-50/50 focus:bg-white transition-all duration-300"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-slate-50/50 px-6 py-2 rounded-2xl border border-slate-100 flex-1 lg:flex-none">
            <FaFilter size={14} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-black text-slate-600 uppercase tracking-widest cursor-pointer min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Unavailable">Unavailable</option>
          </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-[1.5rem]">
            <button
              onClick={() => setViewMode("table")}
              className={`p-3 rounded-xl transition-all duration-500 ${viewMode === "table" ? "bg-white text-indigo-600 shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
              title="Table View"
            >
              <FaList size={20} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-xl transition-all duration-500 ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
              title="Grid View"
            >
              <FaThLarge size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="modern-card animate-pulse !p-0 overflow-hidden rounded-[2.5rem]">
              <div className="h-56 bg-slate-100 mb-6"></div>
              <div className="px-8 pb-8 space-y-4">
                <div className="h-8 bg-slate-100 rounded-xl w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
                <div className="pt-4 flex justify-between">
                  <div className="h-10 bg-slate-100 rounded-xl w-1/3"></div>
                  <div className="h-10 bg-slate-100 rounded-xl w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="modern-card py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-transparent shadow-none">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 text-slate-200 mb-8">
            <FaBox size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">No products found</h3>
          <p className="text-slate-400 max-w-sm mx-auto font-medium">We couldn&apos;t find any products matching your current filters or search terms.</p>
          <button 
            onClick={() => {setSearchTerm(""); setFilterStatus("all");}}
            className="mt-10 px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-600 transition-all duration-300"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === "table" ? (
        <div className="modern-table shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr>
                  <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-3">
                      Product
                      {sortBy === "name" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("category")}>
                    <div className="flex items-center gap-3">
                      Category
                      {sortBy === "category" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6">Volume / Pack</th>
                  <th className="px-8 py-6 text-right cursor-pointer group" onClick={() => toggleSort("price")}>
                    <div className="flex items-center justify-end gap-3">
                      Price
                      {sortBy === "price" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6 text-center cursor-pointer group" onClick={() => toggleSort("stock")}>
                    <div className="flex items-center justify-center gap-3">
                      Stock Hub
                      {sortBy === "stock" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredAndSortedProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/80 transition-colors duration-300">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg tracking-tight">{product.name}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">SKU_{product._id.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: product.categoryColor || '#cbd5e1' }}></div>
                        <span className="text-slate-700 font-black text-[10px] uppercase tracking-widest">{product.category || "General"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-slate-500 font-bold text-sm tracking-tight italic">{product.size} · {product.packaging}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-slate-900 text-lg tracking-tighter">Rs. {product.price.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                          product.stock > 15 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          product.stock > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {product.stock} Units
                        </span>
                        <span className={`text-[8px] uppercase tracking-[0.2em] font-black ${
                          product.status === 'Available' ? 'text-emerald-500' : 
                          product.status === 'Out of Stock' ? 'text-rose-500' : 'text-slate-300'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => setEditing(product)}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all duration-300 active:scale-95"
                          title="Edit Product"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleIncreaseStock(product)}
                          className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all duration-300 active:scale-95"
                          title="Restock"
                        >
                          <FaPlus size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all duration-300 active:scale-95"
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAndSortedProducts.map((product) => (
            <div key={product._id} className="modern-card !p-0 flex flex-col group relative overflow-hidden rounded-[2.5rem] hover:-translate-y-2 transition-all duration-500 border-slate-200/60 shadow-2xl shadow-slate-200/30">
              <div className="h-56 bg-slate-50 flex items-center justify-center relative overflow-hidden border-b border-slate-100">
                {/* Dynamic Background Mesh */}
                <div 
                  className="absolute inset-0 opacity-20 transition-opacity duration-700" 
                  style={{ background: `radial-gradient(circle at 50% 50%, ${product.categoryColor} 0%, transparent 70%)` }} 
                />
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-[1.8rem] shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <FaImage size={32} className="text-slate-200" />
                  </div>
                  <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-xl border border-white shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product.categoryColor }}></div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{product.category || "General"}</span>
                    </div>
                  </div>
            </div>
            
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col gap-2 z-20">
                  <button onClick={() => setEditing(product)} className="p-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"><FaEdit size={14}/></button>
                  <button onClick={() => handleDelete(product)} className="p-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300"><FaTrash size={14}/></button>
                </div>

                <div className="absolute bottom-4 left-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/50 backdrop-blur-md ${
                    product.status === 'Available' ? 'bg-emerald-500 text-white' : 
                    product.status === 'Out of Stock' ? 'bg-rose-500 text-white' : 
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors duration-300">{product.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">{product.size} · {product.packaging}</p>
      </div>

                <div className="flex items-end justify-between mt-auto pt-6 border-t border-slate-50">
                  <div>
                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mb-1.5">Asset Value</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                      <span className="text-sm font-bold text-slate-400 mr-1">Rs.</span>
                      {product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mb-1.5">Stock</p>
                    <p className={`text-lg font-black ${
                      product.stock > 10 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>{product.stock} <span className="text-[10px] opacity-40 ml-0.5">Units</span></p>
                  </div>
                </div>

                <button 
                  onClick={() => handleIncreaseStock(product)}
                  className="mt-8 w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.5rem] shadow-xl hover:bg-indigo-600 hover:shadow-indigo-200 transition-all duration-500 flex items-center justify-center gap-3"
                >
                  <FaPlus size={10} />
                  <span>Restock Asset</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100/50">
                <FaEdit size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Product</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Modifying attributes for <span className="text-slate-900 font-bold">&quot;{editing.name}&quot;</span>. 
                </p>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="w-full space-y-6 text-left">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Title</label>
                    <input name="name" defaultValue={editing.name} required className="modern-input !py-3 !rounded-xl" placeholder="e.g. Premium Lager" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <input name="category" defaultValue={editing.category} className="modern-input !py-3 !rounded-xl" placeholder="e.g. Beverages" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Color</label>
                    <div className="flex gap-2">
                      <input name="categoryColor" type="color" defaultValue={editing.categoryColor || '#667eea'} className="w-12 h-11 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer" />
                      <input name="categoryColorText" defaultValue={editing.categoryColor || '#667eea'} className="flex-1 modern-input !py-3 !rounded-xl font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Size</label>
                    <select name="size" defaultValue={editing.size} className="modern-input !py-3 !rounded-xl appearance-none cursor-pointer">
                    <option value="330ml">330ml</option>
                    <option value="500ml">500ml</option>
                    <option value="750ml">750ml</option>
                      <option value="1L">1 Litre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Format</label>
                    <select name="packaging" defaultValue={editing.packaging} className="modern-input !py-3 !rounded-xl appearance-none cursor-pointer">
                      <option value="Can">Aluminum Can</option>
                      <option value="Bottle">Glass Bottle</option>
                      <option value="Box">Cardboard Box</option>
                  </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (LKR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rs.</span>
                      <input name="price" type="number" step="0.01" defaultValue={editing.price} className="modern-input !pl-10 !py-3 !rounded-xl font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Level</label>
                    <input name="stock" type="number" defaultValue={editing.stock} className="modern-input !py-3 !rounded-xl font-bold" />
                  </div>
                </div>
                
                <div className="flex flex-col w-full gap-3 pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[12px] rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100/50 active:scale-95"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditing(null)}
                    className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Simple Restock Modal */}
      {restocking && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-8 py-10 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100/50">
                <FaPlus size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Restock Asset</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Incrementing inventory for <span className="text-slate-900 font-bold">&quot;{restocking.name}&quot;</span>. 
                  <br />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center block mt-1">Current Level: {restocking.stock} Units</span>
                </p>
              </div>

              <form onSubmit={handleRestockSubmit} className="w-full space-y-8">
                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quantity to Inject</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      autoFocus
                      placeholder="0"
                      value={restockAmount}
                      onChange={(e) => setRestockAmount(e.target.value)}
                      className="w-full px-8 py-4 bg-slate-50 border-1 border-transparent rounded-[2rem] focus:bg-white focus:border-emerald-500 focus:ring-[2px] focus:ring-emerald-50 transition-all text-slate-900 font-black text-2xl tracking-tighter"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black uppercase text-[10px] tracking-widest">Units</div>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-3 pt-2">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[12px] rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center gap-3"
                  >
                  
                    Confirm Restock
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRestocking(null)}
                    className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Simple Delete Modal */}
      {deleting && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-[70] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-8 py-8 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-100/50">
                <FaTrash size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Product?</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  You are about to permanently remove <span className="text-slate-900 font-bold">&quot;{deleting.name}&quot;</span> from the catalog. This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 pt-2">
                <button 
                  onClick={handleConfirmDelete}
                  className="w-full py-4 bg-rose-500 text-white font-black uppercase tracking-widest text-[12px] rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95"
                >
                  Confirm Deletion
                </button>
                <button 
                  onClick={() => setDeleting(null)}
                  className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  Keep Product
                </button>
              </div>
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
