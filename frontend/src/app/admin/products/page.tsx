"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
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
      toast.warning("Invalid stock value.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Product Management
          </h1>
          <p className="text-slate-600 font-medium">Manage your product inventory and stock levels</p>
        </div>
        <Link
          href="/admin/products/add"
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 shadow-lg text-center"
        >
          Add New Product
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="modern-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="modern-input"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="modern-card text-center py-12">
          <p className="text-slate-500 text-lg">No products found</p>
          <p className="text-slate-400 text-sm mt-2">
            {searchTerm || filterStatus !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first product"}
          </p>
        </div>
      ) : (
        <div className="modern-table">
          <table className="w-full">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Packaging</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="font-semibold text-slate-900">{product.name}</div>
                  </td>
                  <td>
                    <span className="text-slate-600">{product.category || "-"}</span>
                  </td>
                  <td>
                    <span className="text-slate-600">{product.size || "-"}</span>
                  </td>
                  <td>
                    <span className="text-slate-600">{product.packaging || "-"}</span>
                  </td>
                  <td>
                    <span className="font-bold text-green-600">Rs. {product.price.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      product.stock > 10 
                        ? 'bg-green-100 text-green-700' 
                        : product.stock > 0 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      product.status === 'Available' 
                        ? 'bg-green-100 text-green-700' 
                        : product.status === 'Out of Stock' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(product)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                        title="Edit Product"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleIncreaseStock(product)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                        title="Increase Stock"
                      >
                        Add Stock
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                        title="Delete Product"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4">
          <div className="modern-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Edit Product
              </h2>
              <p className="text-slate-600">Update product information below</p>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    defaultValue={editing.name}
                    className="modern-input"
                    placeholder="Product Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Category
                  </label>
                  <input
                    name="category"
                    defaultValue={editing.category}
                    className="modern-input"
                    placeholder="Category"
                  />
                </div>
              </div>

              {/* Category Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    name="categoryColor"
                    type="color"
                    defaultValue={editing.categoryColor || '#667eea'}
                    className="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                    onChange={(e) => {
                      const textInput = e.target.form?.querySelector('input[name="categoryColorText"]') as HTMLInputElement;
                      if (textInput) {
                        textInput.value = e.target.value;
                      }
                    }}
                  />
                  <input
                    type="text"
                    name="categoryColorText"
                    defaultValue={editing.categoryColor || '#667eea'}
                    placeholder="#667eea"
                    className="flex-1 modern-input"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    onChange={(e) => {
                      const colorInput = e.target.form?.querySelector('input[name="categoryColor"]') as HTMLInputElement;
                      if (colorInput && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value)) {
                        colorInput.value = e.target.value;
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Choose a color for this category (used in POS display)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="size"
                    defaultValue={editing.size}
                    className="modern-input"
                    required
                  >
                    <option value="">Select Size</option>
                    <option value="330ml">330ml</option>
                    <option value="500ml">500ml</option>
                    <option value="750ml">750ml</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Packaging <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="packaging"
                    defaultValue={editing.packaging}
                    className="modern-input"
                    required
                  >
                    <option value="">Select Packaging</option>
                    <option value="Can">Can</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Price (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing.price}
                    className="modern-input"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={editing.stock}
                    className="modern-input"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editing.status}
                  className="modern-input"
                >
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modern-btn modern-btn-primary"
                >
                  Update Product
                </button>
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