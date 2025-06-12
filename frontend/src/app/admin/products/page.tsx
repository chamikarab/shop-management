"use client";
import { useEffect, useState } from "react";

type Product = {
  _id: string;
  name: string;
  category?: string;
  price: number;
  stock: number;
  status?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);

  const fetchProducts = async () => {
    const res = await fetch("http://localhost:3000/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ ADD PRODUCT FORM
  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = form.name.value.trim();
    const stockToAdd = parseInt(form.stock.value);

    const existing = products.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      // Increase stock
      await fetch(`http://localhost:3000/products/${existing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...existing,
          stock: existing.stock + stockToAdd,
        }),
      });
    } else {
      // Create new
      const data = {
        name,
        category: form.category.value,
        price: parseFloat(form.price.value),
        stock: stockToAdd,
        status: form.status.value,
      };

      await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    form.reset();
    fetchProducts();
  };

  // ✅ UPDATE PRODUCT FORM
  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    const form = e.target as HTMLFormElement;
    const updatedProduct = {
      name: form.name.value,
      category: form.category.value,
      price: parseFloat(form.price.value),
      stock: parseInt(form.stock.value),
      status: form.status.value,
    };

    await fetch(`http://localhost:3000/products/${editing._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    });

    setEditing(null);
    fetchProducts();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Product List</h1>

      {/* Add Product Form */}
      <form className="space-x-2" onSubmit={handleAddProduct}>
        <input name="name" placeholder="Name" required className="p-2 border" />
        <input name="category" placeholder="Category" className="p-2 border" />
        <input
          name="price"
          type="number"
          placeholder="Price"
          required
          className="p-2 border"
        />
        <input
          name="stock"
          type="number"
          placeholder="Stock"
          required
          className="p-2 border"
        />
        <select name="status" className="p-2 border">
          <option value="Available">Available</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Unavailable">Unavailable</option>
        </select>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Product
        </button>
      </form>

      {/* Product Table */}
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-center">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Stock</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="text-center">
                <td className="p-2 border">{product.name}</td>
                <td className="p-2 border">{product.category || "-"}</td>
                <td className="p-2 border">Rs. {product.price}</td>
                <td className="p-2 border">{product.stock}</td>
                <td className="p-2 border">{product.status}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => setEditing(product)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete "${product.name}"?`)) {
                        await fetch(`http://localhost:3000/products/${product._id}`, {
                          method: "DELETE",
                        });
                        fetchProducts(); // Refresh the list
                      }
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                  <button
                    onClick={async () => {
                      const amountStr = prompt(`Enter stock to add to "${product.name}"`);
                      const amount = parseInt(amountStr || "0");
                      if (!isNaN(amount) && amount > 0) {
                        await fetch(`http://localhost:3000/products/${product._id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ...product,
                            stock: product.stock + amount,
                          }),
                        });
                        fetchProducts(); // refresh
                      }
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    + Stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
      </table>

      {/* Edit Product Form */}
      {editing && (
        <form
          className="space-y-2 mt-6 bg-gray-100 p-4 rounded"
          onSubmit={handleUpdateProduct}
        >
          <h2 className="text-lg font-bold">Edit Product</h2>
          <input
            name="name"
            defaultValue={editing.name}
            className="p-2 border w-full text-black bg-white"
            required
          />
          <input
            name="category"
            defaultValue={editing.category}
            className="p-2 border w-full text-black bg-white"
          />
          <input
            name="price"
            type="number"
            defaultValue={editing.price}
            className="p-2 border w-full text-black bg-white"
            required
          />
          <input
            name="stock"
            type="number"
            defaultValue={editing.stock}
            className="p-2 border w-full text-black bg-white"
            required
          />
          <select
            name="status"
            defaultValue={editing.status}
            className="p-2 border w-full text-black bg-white"
          >
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Unavailable">Unavailable</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}