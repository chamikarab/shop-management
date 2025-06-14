"use client";

import { useEffect, useState } from "react";
import "../styles/billing.css";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  discount?: number;
  discountType?: "flat" | "percentage";
  free?: boolean;
}

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discount, setDiscount] = useState<number | "">("");
  const [isPercentage, setIsPercentage] = useState<boolean>(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:3000/products", {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("❌ Failed to fetch products:", res.status);
          return;
        }

        const data = await res.json();
        console.log("✅ Raw products:", data);

        const mapped = data
          .filter((p: any) => p.status?.toLowerCase() === "available")
          .map((p: any) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            quantity: 1,
            discount: 0,
            discountType: "flat",
            free: false,
          }));

        console.log("✅ Mapped available products:", mapped);
        setProducts(mapped);
      } catch (err) {
        console.error("❌ Error loading products:", err);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        if (exists.quantity < product.stock) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return prev;
        }
      }
      return [...prev, { ...product }];
    });
  };

  const updateCartItem = (id: string, updates: Partial<Product>) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const increaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalBeforeDiscount = cart.reduce((sum, item) => {
    if (item.free) return sum;
    const discountAmount =
      item.discountType === "percentage"
        ? ((item.discount || 0) / 100) * item.price * item.quantity
        : (item.discount || 0) * item.quantity;
    return sum + item.price * item.quantity - discountAmount;
  }, 0);

  const discountValue =
    isPercentage && discount !== ""
      ? ((Number(discount) || 0) / 100) * totalBeforeDiscount
      : Number(discount) || 0;

  const grandTotal = totalBeforeDiscount - discountValue;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧾 Billing System (POS)</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search or scan product..."
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {filteredProducts.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-3">
            No products found or available.
          </p>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded p-4 shadow hover:bg-gray-100 cursor-pointer"
              onClick={() => addToCart(product)}
            >
              <h2 className="font-semibold">{product.name}</h2>
              <p>Rs. {product.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
            </div>
          ))
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">🛒 Cart</h2>
      <table className="w-full text-left border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Product</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Price</th>
            <th className="p-2">Discount</th>
            <th className="p-2">Free</th>
            <th className="p-2">Subtotal</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item) => {
            const discountAmount = item.free
              ? 0
              : item.discountType === "percentage"
              ? ((item.discount || 0) / 100) * item.price * item.quantity
              : (item.discount || 0) * item.quantity;

            const subtotal = item.free
              ? 0
              : item.price * item.quantity - discountAmount;

            return (
              <tr key={item.id}>
                <td className="p-2">{item.name}</td>
                <td className="p-2">
                  <div className="qty-controls">
                    <button onClick={() => decreaseQty(item.id)}>-</button>
                    <span className="mx-2">{item.quantity}</span>
                    <button onClick={() => increaseQty(item.id)}>+</button>
                  </div>
                </td>
                <td className="p-2">Rs. {item.price.toFixed(2)}</td>
                <td className="p-2 flex items-center gap-1">
                  <input
                    type="number"
                    className="border p-1 rounded w-16"
                    placeholder="0"
                    value={item.discount === 0 ? "" : item.discount ?? ""}
                    onChange={(e) =>
                      updateCartItem(item.id, {
                        discount: Number(e.target.value),
                      })
                    }
                  />
                  <select
                    className="border p-1 rounded"
                    value={item.discountType}
                    onChange={(e) =>
                      updateCartItem(item.id, {
                        discountType: e.target.value as "flat" | "percentage",
                      })
                    }
                  >
                    <option value="flat">Rs.</option>
                    <option value="percentage">%</option>
                  </select>
                </td>
                <td className="p-2 text-center">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={item.free || false}
                      onChange={(e) =>
                        updateCartItem(item.id, { free: e.target.checked })
                      }
                    />
                    <span className="slider round"></span>
                  </label>
                </td>
                <td className="p-2">Rs. {subtotal.toFixed(2)}</td>
                <td className="p-2">
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-6 text-right">
        <div className="mb-4 flex justify-end items-center gap-2">
          <input
            type="number"
            className="border p-2 rounded w-32"
            placeholder="Discount"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={isPercentage ? "percentage" : "flat"}
            onChange={(e) => setIsPercentage(e.target.value === "percentage")}
          >
            <option value="flat">Rs.</option>
            <option value="percentage">%</option>
          </select>
        </div>

        <h3 className="text-lg font-semibold">
          Grand Total: Rs. {grandTotal.toFixed(2)}
        </h3>
        <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Checkout
        </button>
      </div>
    </div>
  );
}
