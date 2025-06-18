"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import WithPermission from "@/components/WithPermission";

type Product = {
  _id: string;
  name: string;
  category?: string;
  size?: string;
  packaging?: string;
  price: number;
  stock: number;
  status?: string;
};

function ProductsPage() {
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

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = form.name.value.trim();
    const stockToAdd = parseInt(form.stock.value);

    const existing = products.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    const calculatedStatus =
      stockToAdd === 0 ? "Out of Stock" : form.status.value;

    if (existing) {
      await fetch(`http://localhost:3000/products/${existing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...existing,
          stock: existing.stock + stockToAdd,
        }),
      });
      toast.success(`Stock increased for "${existing.name}"`);
    } else {
      const data = {
        name,
        category: form.category.value,
        size: form.size.value,
        packaging: form.packaging.value,
        price: parseFloat(form.price.value),
        stock: stockToAdd,
        status: calculatedStatus,
      };

      await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success(`Product "${data.name}" added`);
    }

    form.reset();
    fetchProducts();
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    const form = e.target as HTMLFormElement;
    const updatedStock = parseInt(form.stock.value);
    const updatedStatus =
      updatedStock === 0 ? "Out of Stock" : form.status.value;

    const updatedProduct = {
      name: form.name.value,
      category: form.category.value,
      size: form.size.value,
      packaging: form.packaging.value,
      price: parseFloat(form.price.value),
      stock: updatedStock,
      status: updatedStatus,
    };

    await fetch(`http://localhost:3000/products/${editing._id}`, {
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
      await fetch(`http://localhost:3000/products/${product._id}`, {
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
      await fetch(`http://localhost:3000/products/${product._id}`, {
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
      <h1 className="text-2xl font-bold">Product List</h1>

      {/* Add Product Form */}
      <form className="space-x-2" onSubmit={handleAddProduct}>
        <input name="name" placeholder="Name" required className="p-2 border" />
        <input name="category" placeholder="Category" className="p-2 border" />
        <select name="size" className="p-2 border" required>
          <option value="">Size</option>
          <option value="500ml">500ml</option>
          <option value="330ml">330ml</option>
          <option value="750ml">750ml</option>
        </select>
        <select name="packaging" className="p-2 border" required>
          <option value="">Packaging</option>
          <option value="Can">Can</option>
          <option value="Bottle">Bottle</option>
        </select>
        <input name="price" type="number" placeholder="Price" required className="p-2 border" />
        <input name="stock" type="number" placeholder="Stock" required className="p-2 border" />
        <select name="status" className="p-2 border">
          <option value="Available">Available</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Unavailable">Unavailable</option>
        </select>
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          Add Product
        </button>
      </form>

      {/* Product Table */}
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-center">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Size</th>
            <th className="p-2 border">Packaging</th>
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
              <td className="p-2 border">{product.size || "-"}</td>
              <td className="p-2 border">{product.packaging || "-"}</td>
              <td className="p-2 border">Rs. {product.price}</td>
              <td className="p-2 border">{product.stock}</td>
              <td className="p-2 border">{product.status}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => setEditing(product)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleIncreaseStock(product)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
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
          <select
            name="size"
            defaultValue={editing.size}
            className="p-2 border w-full text-black bg-white"
            required
          >
            <option value="">Select Size</option>
            <option value="500ml">500ml</option>
            <option value="330ml">330ml</option>
            <option value="750ml">750ml</option>
          </select>
          <select
            name="packaging"
            defaultValue={editing.packaging}
            className="p-2 border w-full text-black bg-white"
            required
          >
            <option value="">Select Packaging</option>
            <option value="Can">Can</option>
            <option value="Bottle">Bottle</option>
          </select>
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
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
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
  export default function ProtectedProductsPage() {
    return (
      <WithPermission required="products:view">
        <ProductsPage />
      </WithPermission>
    );
}