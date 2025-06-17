"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "../styles/billing.css";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  size?: string;
  packaging?: string;
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

  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [cashGiven, setCashGiven] = useState<number>(0);

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
        const mapped = data
          .filter((p: any) => p.status?.toLowerCase() === "available")
          .map((p: any) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            size: p.size,
            packaging: p.packaging,
            quantity: 1,
            discount: 0,
            discountType: "flat",
            free: false,
          }));

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

    const groupedBySize = ["750ml", "500ml", "330ml"].map((size) => ({
    size,
    items: filteredProducts.filter((p) => p.size === size),
  }));

    const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    const exists = cart.find((item) => item.id === product.id);
    if (exists) {
        setCart((prev) =>
        prev.map((item) =>
            item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        );
    } else {
        setCart((prev) => [...prev, { ...product, quantity: 1 }]);
    }

    setProducts((prev) =>
        prev.map((p) =>
        p.id === product.id ? { ...p, stock: p.stock - 1 } : p
        )
    );
    };

    const increaseQty = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product || product.stock <= 0) return;

    setCart((prevCart) =>
        prevCart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        )
    );

    setProducts((prevProducts) =>
        prevProducts.map((p) =>
        p.id === id ? { ...p, stock: p.stock - 1 } : p
        )
    );
    };

    const decreaseQty = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    if (item.quantity === 1) {
        // Restore 1 to stock before removing from cart
        setProducts((prev) =>
        prev.map((p) =>
            p.id === id ? { ...p, stock: p.stock + 1 } : p
        )
        );
        setCart((prev) => prev.filter((i) => i.id !== id));
    } else {
        // Restore 1 to stock for decrement
        setCart((prev) =>
        prev.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        );
        setProducts((prev) =>
        prev.map((p) =>
            p.id === id ? { ...p, stock: p.stock + 1 } : p
        )
        );
    }
    };

    const updateCartItem = (id: string, updates: Partial<Product>) => {
    setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    };

    const removeFromCart = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (item) {
        setProducts((prev) =>
        prev.map((p) =>
            p.id === id ? { ...p, stock: p.stock + item.quantity } : p
        )
        );
    }
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
  const balance = cashGiven - grandTotal;

  const confirmOrder = async () => {
  try {
    const res = await fetch("http://localhost:3000/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: cart,
        total: grandTotal,
        customerName,
        phoneNumber,
        paymentType,
        cashGiven,
        balance,
      }),
    });

    if (!res.ok) throw new Error("Failed to place order");

    toast.success("Order placed successfully!");

    // ✅ Print first, then clear cart after small delay
    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setCart([]);
        setDiscount("");
        setIsPercentage(false);
        setShowModal(false);
        setCustomerName("");
        setPhoneNumber("");
        setCashGiven(0);
      }, 500); // give time for print to complete
    }, 200); // slight delay ensures UI re-renders before print
  } catch (err) {
    console.error("Checkout error:", err);
    toast.error("Checkout failed");
  }
};

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧾 Billing System (POS)</h1>

      <input
        type="text"
        placeholder="Search or scan product..."
        className="border p-2 rounded w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {groupedBySize.map(({ size, items }) => (
        <div key={size} className="mb-8">
          <h2 className="text-lg font-semibold mb-2">{size} Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {items.map((product) => (
              <div
                key={product.id}
                className={`border rounded p-4 shadow cursor-pointer relative ${
                  product.stock === 0
                    ? "opacity-50 pointer-events-none"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => addToCart(product)}
              >
                <h2 className="font-semibold">{product.name}</h2>
                <p className="font-semibold">
                  {product.size} - {product.packaging}
                </p>
                <p>Rs. {product.price.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                {product.stock <= 10 && product.stock > 0 && (
                  <span className="absolute top-2 right-2 bg-yellow-400 text-xs text-black px-2 py-1 rounded">
                    Low Stock
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-xs text-white px-2 py-1 rounded">
                    Out of Stock
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <h2 className="text-xl font-semibold mb-2">🛒 Cart</h2>
      <table className="w-full text-left border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Product</th>
            <th className="p-2">Size</th>
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
            const discountAmount =
              item.free
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
                <td className="p-2">{item.size} - {item.packaging}</td>
                <td className="p-2">
                  <div className="qty-controls">
                    <button onClick={() => decreaseQty(item.id)}>-</button>
                    <span className="mx-2">{item.quantity}</span>
                    <button onClick={() => increaseQty(item.id)}>+</button>
                  </div>
                </td>
                <td className="p-2">Rs. {item.price.toFixed(2)}</td>
                <td className="p-2">
                  <input
                    type="number"
                    className="border p-1 rounded w-16"
                    value={item.discount || ""}
                    onChange={(e) =>
                      updateCartItem(item.id, {
                        discount: Number(e.target.value),
                      })
                    }
                  />
                  <select
                    className="ml-1 border p-1 rounded"
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
            onChange={(e) =>
              setDiscount(e.target.value === "" ? "" : Number(e.target.value))
            }
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
        <button
        onClick={() => setShowModal(true)}
        disabled={cart.length === 0}
        className={`mt-2 px-4 py-2 rounded text-white ${
            cart.length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        >
        Checkout
        </button>
      </div>

        {showModal && (
        <div className="custom-modal">
            <div className="modal-content">
            <h2 className="text-xl font-bold mb-4">Checkout</h2>
            <input
                className="border p-2 rounded w-full mb-2"
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
                className="border p-2 rounded w-full mb-2"
                placeholder="Phone Number (optional)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <select
                className="border p-2 rounded w-full mb-2"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
            >
                <option>Cash</option>
                <option>Card</option>
                <option>Online</option>
            </select>
                <input
                type="text"
                inputMode="decimal"
                className="border p-2 rounded w-full mb-2"
                placeholder="Cash Given"
                value={cashGiven}
                onChange={(e) => setCashGiven(Number(e.target.value))}
                />
            <p className="mb-4">
                Balance:{" "}
                <span className={balance < 0 ? "text-red-600 font-bold" : ""}>
                Rs. {balance.toFixed(2)}
                </span>
            </p>

            {/* ✅ Added product list in modal */}
            <div className="mb-4 max-h-40 overflow-y-auto text-sm bg-gray-50 p-2 rounded border">
                <h3 className="font-semibold mb-2">Products:</h3>
                <ul>
                {cart.map((item) => (
                    <li key={item.id} className="mb-1">
                    {item.quantity}x {item.name} - {item.size} ({item.packaging}) - Rs. {item.price.toFixed(2)}
                    {item.free && (
                        <span className="ml-2 text-green-600 font-medium">(Free)</span>
                    )}
                    {item.discount ? (
                        <span className="ml-2 text-yellow-600 text-xs">
                        - {item.discount}
                        {item.discountType === "percentage" ? "%" : " Rs."} discount
                        </span>
                    ) : null}
                    </li>
                ))}
                </ul>
            </div>

            <div className="flex justify-end gap-2">
                <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
                >
                Cancel
                </button>
                <button
                onClick={confirmOrder}
                className={`px-4 py-2 rounded text-white ${
                    cashGiven >= grandTotal
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={cashGiven < grandTotal}
                >
                Confirm Order
                </button>
                <button onClick={() => window.print()}>
                🖨 Print Invoice
                </button>
            </div>
            </div>
        </div>
        )}
       <div id="print-invoice" className="hidden print:block text-sm leading-4">
            <div className="text-center">
                <p>************************</p>
                <p><strong>SISILA BEER SHOP</strong></p>
                <p>Ankelipitiya, Thalathuoya Rd, Kandy</p>
                <p>📞 0779574545</p>
                <p>************************</p>
            </div>

            <p>Date: {new Date().toLocaleString()}</p>
            <p>Invoice #: 000{Math.floor(Math.random() * 100000)}</p>
            <p>Cashier: Admin</p>
            <hr />

            {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                <div>
                    <p>{item.name}</p>
                    <p className="text-xs">
                    {item.size} / {item.packaging} × {item.quantity}
                    </p>
                </div>
                <div>
                    <p>Rs. {(item.price * item.quantity).toFixed(2)}</p>
                </div>
                </div>
            ))}

            <hr />
            <p>Total: Rs. {grandTotal.toFixed(2)}</p>
            <p>Cash: Rs. {cashGiven.toFixed(2)}</p>
            <p>Discount: Rs. {discountValue.toFixed(2)}</p>
            <p>Balance: Rs. {balance.toFixed(2)}</p>
            <p>Payment: {paymentType}</p>

            <hr />
            <div className="text-center">
                <p>**** THANK YOU ****</p>
            </div>
        </div>
    </div>
  );
}