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

  useEffect(() => {
    fetch("http://localhost:3000/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Product List</h1>

      {/* Add Product Form */}
      <form
        className="space-x-2"
        onSubmit={async (e) => {
          e.preventDefault();

          const form = e.target as HTMLFormElement;
          const data = {
            name: form.name.value,
            category: form.category.value,
            price: parseFloat(form.price.value),
            stock: parseInt(form.stock.value),
            status: form.status.value,
          };

          await fetch("http://localhost:3000/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          form.reset();
          // refetch product list
          const res = await fetch("http://localhost:3000/products");
          const updated = await res.json();
          setProducts(updated);
        }}
      >
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
