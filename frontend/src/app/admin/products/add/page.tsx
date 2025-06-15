"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = {
      name: form.name.value.trim(),
      category: form.category.value.trim(),
      price: parseFloat(form.price.value),
      stock: parseInt(form.stock.value),
      status: form.status.value,
      size: form.size.value,
      packaging: form.packaging.value,
    };

    if (!data.name || isNaN(data.price) || isNaN(data.stock)) {
      toast.warning("Please fill out all fields correctly.");
      setLoading(false);
      return;
    }

    if (data.stock === 0) data.status = "Out of Stock";

    try {
      const res = await fetch("http://localhost:3000/products", {
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
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Name"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="category"
          placeholder="Category"
          className="w-full p-2 border rounded"
        />
        <input
          name="price"
          type="number"
          placeholder="Price"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="stock"
          type="number"
          placeholder="Stock"
          required
          className="w-full p-2 border rounded"
        />
        <select name="size" required className="w-full p-2 border rounded">
          <option value="">Select Size</option>
          <option value="330ml">330ml</option>
          <option value="500ml">500ml</option>
          <option value="750ml">750ml</option>
        </select>
        <select name="packaging" required className="w-full p-2 border rounded">
          <option value="">Select Packaging</option>
          <option value="Can">Can</option>
          <option value="Bottle">Bottle</option>
        </select>
        <select name="status" className="w-full p-2 border rounded">
          <option value="Available">Available</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Unavailable">Unavailable</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}