"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaEdit, FaTrash, FaPlus, FaBox, FaSearch, FaFilter, FaTimes } from "react-icons/fa";
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-white min-h-screen animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            All Products
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your inventory and stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <FaBox className="text-slate-400" size={14} />
            <span className="text-sm font-semibold text-slate-700">{products.length} Products</span>
          </div>
          <Link
            href="/admin/products/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
          >
            <FaPlus size={12} />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FaSearch size={14} />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <FaFilter size={12} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 md:flex-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">Product Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Category</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Size/Pack</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Price</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">Stock</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{product.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {product._id.slice(-6)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product.categoryColor || '#cbd5e1' }}></div>
                        <span className="text-slate-600">{product.category || "General"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-500">{product.size} / {product.packaging}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      Rs. {product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          product.stock > 10 ? 'bg-emerald-100 text-emerald-700' :
                          product.stock > 0 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {product.stock} in stock
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tight font-medium">
                          {product.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setEditing(product)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleIncreaseStock(product)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Add Stock"
                        >
                          <FaPlus size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={14} />
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
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Product</h2>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Product Name</label>
                  <input name="name" defaultValue={editing.name} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                  <input name="category" defaultValue={editing.category} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Category Color</label>
                  <div className="flex gap-2">
                    <input name="categoryColor" type="color" defaultValue={editing.categoryColor || '#667eea'} className="w-10 h-9 p-0.5 border border-slate-200 rounded cursor-pointer" />
                    <input name="categoryColorText" defaultValue={editing.categoryColor || '#667eea'} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Size</label>
                  <select name="size" defaultValue={editing.size} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none">
                    <option value="330ml">330ml</option>
                    <option value="500ml">500ml</option>
                    <option value="750ml">750ml</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Packaging</label>
                  <select name="packaging" defaultValue={editing.packaging} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none">
                    <option value="Can">Can</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Price (LKR)</label>
                  <input name="price" type="number" step="0.01" defaultValue={editing.price} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Stock</label>
                  <input name="stock" type="number" defaultValue={editing.stock} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2 bg-slate-50 text-slate-600 font-semibold rounded-lg border border-slate-200 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm">Save Changes</button>
              </div>
            </form>
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