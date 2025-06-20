"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CheckoutModal from "@/components/CheckoutModal";
import Invoice from "@/components/Invoice";
import "../styles/billing.css";
import { Plus, Minus } from "lucide-react";

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
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceId, setInvoiceId] = useState<string>("");

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

  useEffect(() => {
    setInvoiceDate(new Date().toLocaleString());
    setInvoiceId("000" + Math.floor(Math.random() * 100000));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const categorized = ["750ml", "500ml", "330ml"].map((size) => ({
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
      prev.map((p) => (p.id === product.id ? { ...p, stock: p.stock - 1 } : p))
    );
  };

  const increaseQty = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product || product.stock <= 0) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: p.stock - 1 } : p))
    );
  };

  const decreaseQty = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    if (item.quantity === 1) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: p.stock + 1 } : p))
      );
      setCart((prev) => prev.filter((i) => i.id !== id));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: p.stock + 1 } : p))
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
        }, 500);
      }, 200);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Checkout failed");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 min-h-screen bg-white text-black">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">🧾 Billing System (POS)</h1>
        <input
          type="text"
          placeholder="Search product..."
          className="border p-2 rounded w-full mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {categorized.map(({ size, items }) => (
          <div key={size} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{size} Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded p-4 shadow cursor-pointer relative transition hover:bg-gray-100 ${
                    product.stock === 0 ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <h2 className="font-semibold">{product.name}</h2>
                  <p>
                    {product.size} - {product.packaging}
                  </p>
                  <p>Rs. {product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </p>
                  {product.stock <= 10 && product.stock > 0 && (
                    <span className="absolute top-2 right-2 bg-yellow-400 text-xs text-black px-2 py-1 rounded">
                      Low
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-xs text-white px-2 py-1 rounded">
                      Out
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full md:w-96 border p-4 mt-12 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">🛒 Cart</h2>
        {cart.map((item) => (
          <div key={item.id} className="mb-2 border-b pb-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-600">
                  {item.size} - {item.packaging}
                </p>
                <p className="text-sm">Rs. {item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="border p-1 rounded"
                  onClick={() => decreaseQty(item.id)}
                >
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button
                  className="border p-1 rounded"
                  onClick={() => increaseQty(item.id)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-sm">Discount:</label>
              <input
                type="number"
                value={item.discount || ""}
                className="border p-1 w-16"
                onChange={(e) =>
                  updateCartItem(item.id, { discount: Number(e.target.value) })
                }
              />
              <select
                className="border p-1"
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
              <label className="text-sm ml-auto flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={item.free || false}
                  onChange={(e) =>
                    updateCartItem(item.id, { free: e.target.checked })
                  }
                />
                Free
              </label>
              <button
                className="text-red-500 text-xs ml-2"
                onClick={() => removeFromCart(item.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <div className="mt-4 border-t pt-4">
          <div className="mb-2">
            <label className="text-sm">Bill Discount:</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                className="border p-1 w-24"
                placeholder="Discount"
                value={discount}
                onChange={(e) =>
                  setDiscount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <select
                className="border p-1"
                value={isPercentage ? "percentage" : "flat"}
                onChange={(e) =>
                  setIsPercentage(e.target.value === "percentage")
                }
              >
                <option value="flat">Rs.</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>
          <p className="font-semibold">Total: Rs. {grandTotal.toFixed(2)}</p>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mt-2 w-full"
            disabled={cart.length === 0}
            onClick={() => setShowModal(true)}
          >
            Checkout
          </button>
        </div>
      </div>

      {showModal && (
        <CheckoutModal
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          cashGiven={cashGiven}
          setCashGiven={setCashGiven}
          balance={balance}
          onCancel={() => setShowModal(false)}
          onConfirm={confirmOrder}
        />
      )}

      <Invoice
        cart={cart}
        invoiceDate={invoiceDate}
        invoiceId={invoiceId}
        grandTotal={grandTotal}
        cashGiven={cashGiven}
        discountValue={discountValue}
        balance={balance}
        paymentType={paymentType}
      />
    </div>
  );
}
