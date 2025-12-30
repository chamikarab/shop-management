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
            .filter((p) => p.category === selectedCategory && p.packaging)
            .map((p) => p.packaging as string)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
        <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Point of Sale
          </h1>
              <p className="text-sm text-slate-500 mt-0.5">Select products to add to cart</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500">Cart Items</p>
                <p className="text-lg font-bold text-slate-900">{cart.length}</p>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    cart.forEach((item) => {
                      setProducts((prev) =>
                        prev.map((p) =>
                          p.id === item.id
                            ? { ...p, stock: p.stock + item.quantity }
                            : p
                        )
                      );
                    });
                    setCart([]);
                    toast.success("Cart cleared");
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Products Section */}
          <div className="flex-1 space-y-6">
        {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
          <input
            type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            {(selectedCategory || selectedPackaging) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={handleBackToCategories}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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
                            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Categories</h2>
                  <span className="text-sm text-slate-500">{categories.length} categories</span>
                </div>
                {categories.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-400">No categories found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5"
                        onClick={() => handleCategoryClick(category)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {category}
                          </h3>
                          <svg
                            className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-slate-500">Click to view packaging options</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Packaging View */}
            {selectedCategory && !selectedPackaging && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    Packaging Options
            </h2>
                  <span className="text-sm text-slate-500">{packagingOptions.length} options</span>
                </div>
                {packagingOptions.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-400">No packaging options found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packagingOptions.map((packaging) => (
                      <div
                        key={packaging}
                        className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5"
                        onClick={() => handlePackagingClick(packaging)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {packaging}
                          </h3>
                          <svg
                            className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-slate-500">Click to view products</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Products View */}
            {selectedCategory && selectedPackaging && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    Products
                  </h2>
                  <span className="text-sm text-slate-500">{displayedProducts.length} products</span>
                </div>
                {displayedProducts.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-400">No products found</p>
              </div>
            ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                        className={`group bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 relative ${
                          product.stock === 0 ? "opacity-60 pointer-events-none" : ""
                    }`}
                    onClick={() => addToCart(product)}
                  >
                    {product.stock <= 10 && product.stock > 0 && (
                          <span className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Low Stock
                      </span>
                    )}
                    {product.stock === 0 && (
                          <span className="absolute top-3 right-3 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Out of Stock
                      </span>
                    )}
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                          {product.size && (
                            <p className="text-sm text-slate-500">{product.size}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div>
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              Rs. {product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Stock: {product.stock}
                      </p>
                    </div>
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <svg
                              className="w-5 h-5 text-indigo-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
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
          <div className="w-full lg:w-[520px] xl:w-[580px]">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-24">
              {/* Cart Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">Shopping Cart</h2>
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </span>
                </div>
          </div>

          {/* Cart Items */}
              <div className="p-6">
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      </div>
                      <p className="text-slate-500 font-medium">Your cart is empty</p>
                      <p className="text-sm text-slate-400 mt-1">Add products to get started</p>
              </div>
            ) : (
              cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2.5"
                      >
                  {/* Item Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-slate-900 truncate">
                                {item.name}
                              </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
                      title="Remove"
                    >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                    </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              {item.size && <span>{item.size}</span>}
                              {item.size && item.packaging && <span>•</span>}
                              {item.packaging && <span>{item.packaging}</span>}
                              {(item.size || item.packaging) && <span>•</span>}
                              <span className="font-medium">Rs. {item.price.toFixed(2)}</span>
                            </div>
                          </div>
                  </div>

                        {/* Quantity and Discount Controls */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                          <label className="text-xs font-medium text-slate-700 whitespace-nowrap">Qty:</label>
                          <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => decreaseQty(item.id)}
                              className="w-7 h-7 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-sm font-semibold transition-colors"
                      >
                        −
                      </button>
                            <span className="w-10 text-center text-sm font-bold text-slate-900">
                              {item.quantity}
                            </span>
                      <button
                        onClick={() => increaseQty(item.id)}
                              className="w-7 h-7 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-sm font-semibold transition-colors"
                      >
                        +
                      </button>
                    </div>
                          <div className="flex-1 flex items-center gap-1.5 ml-2">
                            <label className="text-xs font-medium text-slate-700 whitespace-nowrap">Disc:</label>
                      <input
                        type="number"
                        value={item.discount || ""}
                              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        placeholder="0"
                        onChange={(e) =>
                          updateCartItem(item.id, { discount: Number(e.target.value) || 0 })
                        }
                      />
                      <select
                              className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
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
                        </div>

                        {/* Free Checkbox and Item Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.free || false}
                        onChange={(e) =>
                          updateCartItem(item.id, { free: e.target.checked })
                        }
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                            <span className="text-xs font-medium text-slate-700">Free</span>
                    </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Total:</span>
                            <span className="text-sm font-bold text-slate-900">
                      Rs. {calculateItemTotal(item).toFixed(2)}
                    </span>
                          </div>
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
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    placeholder="Discount amount"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                  <select
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-700">Grand Total:</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Rs. {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cart.length === 0}
                onClick={() => setShowModal(true)}
              >
                Proceed to Checkout
              </button>
            </div>
          )}
              </div>
            </div>
          </div>
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
