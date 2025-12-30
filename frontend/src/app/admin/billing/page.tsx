"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CheckoutModal from "@/components/CheckoutModal";
import Invoice from "@/components/Invoice";
import "../styles/billing.css";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  size?: string;
  packaging?: string;
  category?: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPackaging, setSelectedPackaging] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${apiUrl}/products`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("❌ Failed to fetch products:", res.status);
          return;
        }

        const data = await res.json();
        type ApiProduct = {
          _id: string;
          name: string;
          price: number;
          stock: number;
          size?: string;
          packaging?: string;
          category?: string;
          status?: string;
        };
        const mapped = data
          .filter((p: ApiProduct) => p.status?.toLowerCase() === "available")
          .map((p: ApiProduct) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            size: p.size,
            packaging: p.packaging,
            category: p.category,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setInvoiceDate(new Date().toLocaleString());
    setInvoiceId("000" + Math.floor(Math.random() * 100000));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Get unique categories
  const categories = Array.from(
    new Set(filteredProducts.map((p) => p.category).filter(Boolean))
  ) as string[];

  // Get packaging options for selected category
  const packagingOptions = selectedCategory
    ? Array.from(
        new Set(
          filteredProducts
            .filter((p) => p.category === selectedCategory)
            .map((p) => p.packaging)
            .filter(Boolean)
        )
      )
    : [];

  // Get products for selected category and packaging
  const displayedProducts = selectedCategory && selectedPackaging
    ? filteredProducts.filter(
        (p) =>
          p.category === selectedCategory && p.packaging === selectedPackaging
      )
    : [];

  // Navigation handlers
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedPackaging(null);
  };

  const handlePackagingClick = (packaging: string) => {
    setSelectedPackaging(packaging);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedPackaging(null);
  };

  const handleBackToPackaging = () => {
    setSelectedPackaging(null);
  };

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
      const res = await fetch(`${apiUrl}/orders`, {
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

  const calculateItemTotal = (item: Product): number => {
    if (item.free) return 0;
    const baseTotal = item.price * item.quantity;
    if (item.discount) {
      if (item.discountType === "percentage") {
        return baseTotal - (baseTotal * item.discount) / 100;
      }
      return baseTotal - item.discount * item.quantity;
    }
    return baseTotal;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Products Section */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Point of Sale
          </h1>
          <p className="text-slate-600">Select products to add to cart</p>
        </div>

        {/* Search Bar */}
        <div className="modern-card">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Search Products
          </label>
          <input
            type="text"
            placeholder="Type product name to search..."
            className="modern-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Breadcrumb Navigation */}
        {(selectedCategory || selectedPackaging) && (
          <div className="modern-card">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={handleBackToCategories}
                className="text-purple-600 hover:text-purple-800 font-semibold transition-colors"
              >
                Categories
              </button>
              {selectedCategory && (
                <>
                  <span className="text-slate-400">/</span>
                  {selectedPackaging ? (
                    <>
                      <button
                        onClick={handleBackToPackaging}
                        className="text-purple-600 hover:text-purple-800 font-semibold transition-colors"
                      >
                        {selectedCategory}
                      </button>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-700 font-semibold">
                        {selectedPackaging}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-700 font-semibold">
                      {selectedCategory}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Categories View */}
        {!selectedCategory && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2">
              Categories
            </h2>
            {categories.length === 0 ? (
              <div className="modern-card text-center py-8">
                <p className="text-slate-400">No categories found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="modern-card cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-purple-300 active:scale-95 active:bg-gradient-to-br active:from-purple-50 active:to-pink-50 relative overflow-hidden"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">
                        {category}
                      </h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-xs text-slate-500">
                        Click to view packaging options
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Packaging View */}
        {selectedCategory && !selectedPackaging && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2">
              Packaging Options - {selectedCategory}
            </h2>
            {packagingOptions.length === 0 ? (
              <div className="modern-card text-center py-8">
                <p className="text-slate-400">No packaging options found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {packagingOptions.map((packaging) => (
                  <div
                    key={packaging}
                    className="modern-card cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-purple-300 active:scale-95 active:bg-gradient-to-br active:from-purple-50 active:to-pink-50 relative overflow-hidden"
                    onClick={() => handlePackagingClick(packaging)}
                  >
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">
                        {packaging}
                      </h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-xs text-slate-500">
                        Click to view products
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products View */}
        {selectedCategory && selectedPackaging && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2">
              Products - {selectedCategory} ({selectedPackaging})
            </h2>
            {displayedProducts.length === 0 ? (
              <div className="modern-card text-center py-8">
                <p className="text-slate-400">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`modern-card cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-purple-300 active:scale-95 active:bg-gradient-to-br active:from-purple-50 active:to-pink-50 relative overflow-hidden ${
                      product.stock === 0 ? "opacity-50 pointer-events-none" : ""
                    }`}
                    onClick={() => addToCart(product)}
                  >
                    {product.stock <= 10 && product.stock > 0 && (
                      <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                        Low Stock
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                        Out of Stock
                      </span>
                    )}
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">
                        {product.name}
                      </h3>
                      {product.size && (
                        <p className="text-sm text-slate-600">
                          {product.size}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-2xl font-bold mb-2" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        Rs. {product.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Stock: {product.stock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 xl:w-[420px] space-y-4">
        <div className="modern-card sticky top-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Shopping Cart
            </h2>
            <p className="text-sm text-slate-600">
              {cart.length} {cart.length === 1 ? "item" : "items"} in cart
            </p>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Your cart is empty</p>
                <p className="text-xs text-slate-300 mt-2">Add products to get started</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  {/* Item Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {item.size} - {item.packaging}
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        Rs. {item.price.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded text-xs font-bold hover:shadow-lg transition-all"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="w-8 h-8 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all hover:scale-110"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => increaseQty(item.id)}
                        className="w-8 h-8 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all hover:scale-110"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Discount Controls */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-700 w-20">Discount:</label>
                      <input
                        type="number"
                        value={item.discount || ""}
                        className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                        onChange={(e) =>
                          updateCartItem(item.id, { discount: Number(e.target.value) || 0 })
                        }
                      />
                      <select
                        className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.free || false}
                        onChange={(e) =>
                          updateCartItem(item.id, { free: e.target.checked })
                        }
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">Mark as Free</span>
                    </label>
                  </div>

                  {/* Item Total */}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-600">Item Total:</span>
                    <span className="font-bold text-slate-900">
                      Rs. {calculateItemTotal(item).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
              {/* Bill Discount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bill Discount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Discount amount"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                  <select
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              {/* Total */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-700">Grand Total:</span>
                  <span className="text-2xl font-bold" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Rs. {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                className="modern-btn modern-btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cart.length === 0}
                onClick={() => setShowModal(true)}
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
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

      {/* Invoice (Hidden, for printing) */}
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
