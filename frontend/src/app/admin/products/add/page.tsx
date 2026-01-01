"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
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
    <div className="p-6 w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Add New Product
        </h1>
        <p className="text-slate-600 text-lg">Fill in the details below to add a new product to your inventory</p>
      </div>

      <div className="modern-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              placeholder="Enter product name"
              required
              className="modern-input"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category
            </label>
            <input
              name="category"
              placeholder="Enter category (e.g., Beer, Wine, etc.)"
              className="modern-input"
            />
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
                id="categoryColorPicker"
                defaultValue="#667eea"
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
                id="categoryColorText"
                defaultValue="#667eea"
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

          {/* Price and Stock Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Price (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                className="modern-input"
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
                placeholder="0"
                required
                className="modern-input"
              />
            </div>
          </div>

          {/* Size and Packaging Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Size <span className="text-red-500">*</span>
              </label>
              <select name="size" required className="modern-input">
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
              <select name="packaging" required className="modern-input">
                <option value="">Select Packaging</option>
                <option value="Can">Can</option>
                <option value="Bottle">Bottle</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status
            </label>
            <select name="status" className="modern-input">
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Unavailable">Unavailable</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Note: Status will automatically change to "Out of Stock" if stock is 0</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <Link
              href="/admin/products"
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-center border-2 border-slate-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-black py-4 rounded-2xl hover:from-green-700 hover:to-green-700 shadow-xl shadow-green-100 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner-small"></span>
                  Saving...
                </span>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .loading-spinner-small {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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