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
  categoryColor?: string;
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
          categoryColor?: string;
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
            categoryColor: p.categoryColor,
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

  // Get unique categories with their colors
  const categoryMap = new Map<string, string>();
  filteredProducts.forEach((p) => {
    if (p.category && !categoryMap.has(p.category)) {
      categoryMap.set(p.category, p.categoryColor || '#667eea');
    }
  });
  const categories = Array.from(categoryMap.keys());

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="w-full mx-auto px-1 sm:px-2 lg:px-3 py-2 sm:py-3 lg:py-4">
        {/* White Background Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
            Point of Sale
          </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Select products to add to your cart</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full sm:w-auto">
                
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
                    className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 border-2 border-red-200 hover:border-red-600 shadow-sm hover:shadow-md whitespace-nowrap"
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            </div>
        </div>

          {/* Main Content */}
          <div className="px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 lg:pt-4 pb-4 sm:pb-6 lg:pb-8">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Products Section */}
          <div className="flex-1 space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Modern Search Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/60 p-3 sm:p-4 lg:p-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="flex-1 relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
          <input
            type="text"
                    placeholder="Search products..."
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm sm:text-base text-slate-700 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-white hover:bg-slate-600 rounded-lg sm:rounded-xl transition-all duration-200 border-2 border-slate-300 hover:border-slate-600 whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            {(selectedCategory || selectedPackaging) && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/60 p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
                  <button
                    onClick={handleBackToCategories}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-indigo-50"
                  >
                    Categories
                  </button>
                  {selectedCategory && (
                    <>
                      <span className="text-slate-300">/</span>
                      {selectedPackaging ? (
                        <>
                          <button
                            onClick={handleBackToPackaging}
                            className="text-indigo-600 hover:text-indigo-700 transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-indigo-50"
                          >
                            {selectedCategory}
                          </button>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-700 font-semibold px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-50 rounded-lg">
                            {selectedPackaging}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-700 font-semibold px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-50 rounded-lg">
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
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Product Categories</h2>
                  <span className="text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    {categories.length} categories
                  </span>
                </div>
                {categories.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/60 p-8 sm:p-12 lg:p-16 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">No categories found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                    {categories.map((category) => {
                      const categoryColor = categoryMap.get(category) || '#667eea';
                      return (
                        <div
                          key={category}
                          className="group bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-slate-200 hover:border-transparent p-4 sm:p-5 lg:p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, #ffffff 0%, ${categoryColor}08 100%)`,
                          }}
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(90deg, ${categoryColor} 0%, ${categoryColor}dd 100%)` }}></div>
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 
                              className="text-base sm:text-lg lg:text-xl font-bold transition-colors"
                              style={{ color: categoryColor }}
                            >
                              {category}
                            </h3>
                            <div 
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                              style={{ 
                                backgroundColor: categoryColor + '15',
                              }}
                            >
                              <svg
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                style={{ color: categoryColor }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs font-medium text-slate-500">Click to view packaging options</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Packaging View */}
            {selectedCategory && !selectedPackaging && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Packaging Options</h2>
                  <span className="text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    {packagingOptions.length} options
                  </span>
                </div>
                {packagingOptions.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/60 p-8 sm:p-12 lg:p-16 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">No packaging options found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                    {packagingOptions.map((packaging) => {
                      const categoryColor = categoryMap.get(selectedCategory || '') || '#667eea';
                      return (
                        <div
                          key={packaging}
                          className="group bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-slate-200 hover:border-transparent p-4 sm:p-5 lg:p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, #ffffff 0%, ${categoryColor}08 100%)`,
                          }}
                          onClick={() => handlePackagingClick(packaging)}
                        >
                          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(90deg, ${categoryColor} 0%, ${categoryColor}dd 100%)` }}></div>
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 
                              className="text-base sm:text-lg lg:text-xl font-bold transition-colors"
                              style={{ color: categoryColor }}
                            >
                              {packaging}
                            </h3>
                            <div 
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                              style={{ 
                                backgroundColor: categoryColor + '15',
                              }}
                            >
                              <svg
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                style={{ color: categoryColor }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs font-medium text-slate-500">Click to view products</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Products View */}
            {selectedCategory && selectedPackaging && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Products</h2>
                  <span className="text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    {displayedProducts.length} products
                  </span>
                </div>
                {displayedProducts.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/60 p-8 sm:p-12 lg:p-16 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">No products found</p>
              </div>
            ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                    {displayedProducts.map((product) => {
                      const categoryColor = categoryMap.get(selectedCategory || '') || '#667eea';
                      return (
                  <div
                    key={product.id}
                          className={`group bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-slate-200 hover:border-transparent p-4 sm:p-5 lg:p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${
                            product.stock === 0 ? "opacity-60 pointer-events-none" : ""
                    }`}
                          style={{
                            background: `linear-gradient(135deg, #ffffff 0%, ${categoryColor}08 100%)`,
                          }}
                    onClick={() => addToCart(product)}
                  >
                          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(90deg, ${categoryColor} 0%, ${categoryColor}dd 100%)` }}></div>
                    {product.stock <= 10 && product.stock > 0 && (
                            <span className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
                        Low Stock
                      </span>
                    )}
                    {product.stock === 0 && (
                            <span className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
                        Out of Stock
                      </span>
                    )}
                          <div className="mb-3 sm:mb-4 lg:mb-5">
                            <h3 
                              className="text-base sm:text-lg font-bold mb-1 sm:mb-2 transition-colors"
                              style={{ color: categoryColor }}
                            >
                        {product.name}
                      </h3>
                            {product.size && (
                              <p className="text-xs sm:text-sm font-medium text-slate-600">{product.size}</p>
                            )}
                    </div>
                          <div className="flex items-center justify-between pt-3 sm:pt-4 lg:pt-5 border-t-2 border-slate-100">
                            <div>
                              <p 
                                className="text-base sm:text-lg lg:text-xl font-extrabold mb-0.5 sm:mb-1"
                                style={{ 
                                  background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                                }}
                              >
                        Rs. {product.price.toFixed(2)}
                              </p>
                              <p className="text-[10px] sm:text-xs font-semibold text-slate-500">
                                Stock: <span className="text-slate-700">{product.stock}</span>
                              </p>
                            </div>
                            <div 
                              className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-90 shadow-md"
                              style={{ 
                                background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
                              }}
                            >
                              <svg
                                className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                      </div>
                      </div>
                    </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modern Cart Section */}
          <div className="w-full lg:w-[400px] xl:w-[480px] 2xl:w-[540px]">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border-2 border-slate-200/60 sticky top-20 sm:top-24 lg:top-28">
              {/* Cart Header */}
              <div className="p-4 sm:p-5 lg:p-6 border-b-2 border-slate-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-t-xl sm:rounded-t-2xl">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800">Shopping Cart</h2>
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 bg-white px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full shadow-sm border border-indigo-200">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </span>
      </div>
          </div>

          {/* Cart Items */}
              <div className="p-2 sm:p-3 lg:p-4">
                <div className="space-y-2 sm:space-y-2.5 max-h-[400px] sm:max-h-[480px] lg:max-h-[520px] overflow-y-auto pr-2 sm:pr-3 custom-scrollbar">
            {cart.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 lg:py-16">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-5 shadow-lg">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <p className="text-slate-600 font-bold text-sm sm:text-base mb-1 sm:mb-2">Your cart is empty</p>
                      <p className="text-xs sm:text-sm text-slate-400">Add products to get started</p>
              </div>
            ) : (
              cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-lg sm:rounded-xl border border-slate-200 p-2 sm:p-2.5 space-y-1.5 sm:space-y-2 shadow-sm"
                      >
                  {/* Item Header */}
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {item.name}
                              </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0 p-0.5 hover:bg-red-50 rounded"
                      title="Remove"
                    >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                    </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-semibold text-slate-600">
                              {item.size && <span className="bg-white px-1.5 sm:px-2 py-0.5 rounded">{item.size}</span>}
                              {item.size && item.packaging && <span>•</span>}
                              {item.packaging && <span className="bg-white px-1.5 sm:px-2 py-0.5 rounded">{item.packaging}</span>}
                              <span className="bg-white px-1.5 sm:px-2 py-0.5 rounded">Rs. {item.price.toFixed(2)}</span>
                            </div>
                          </div>
                  </div>

                        {/* Quantity and Discount Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-white">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                            <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 whitespace-nowrap">Qty:</label>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        onClick={() => decreaseQty(item.id)}
                              className="w-6 h-6 sm:w-7 sm:h-7 bg-white border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded text-[10px] sm:text-xs font-bold transition-all"
                      >
                        −
                      </button>
                            <span className="w-8 sm:w-10 text-center text-[10px] sm:text-xs font-bold text-slate-900 bg-white px-1 py-0.5 sm:py-1 rounded border border-slate-200">
                              {item.quantity}
                            </span>
                      <button
                        onClick={() => increaseQty(item.id)}
                              className="w-6 h-6 sm:w-7 sm:h-7 bg-white border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded text-[10px] sm:text-xs font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                          <div className="flex-1 flex items-center gap-1 sm:gap-1.5">
                            <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 whitespace-nowrap">Disc:</label>
                      <input
                        type="number"
                        value={item.discount || ""}
                              className="flex-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold"
                        placeholder="0"
                        onChange={(e) =>
                          updateCartItem(item.id, { discount: Number(e.target.value) || 0 })
                        }
                      />
                      <select
                              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold"
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 pt-1.5 sm:pt-2 border-t border-white">
                    <label className="flex items-center gap-1 sm:gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.free || false}
                        onChange={(e) =>
                          updateCartItem(item.id, { free: e.target.checked })
                        }
                              className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border border-slate-300"
                      />
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-700">Mark as Free</span>
                    </label>
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">Total:</span>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
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
                  <div className="mt-4 sm:mt-5 lg:mt-6 pt-4 sm:pt-5 lg:pt-6 border-t-2 border-slate-200 space-y-3 sm:space-y-4 lg:space-y-5 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
              {/* Bill Discount */}
              <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3">
                  Bill Discount
                </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="number"
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border-2 border-slate-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold shadow-sm text-sm sm:text-base"
                    placeholder="Discount amount"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                  <select
                          className="px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border-2 border-slate-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold shadow-sm text-sm sm:text-base"
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
                    <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl sm:rounded-2xl border-2 border-red-400 p-4 sm:p-5 lg:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                        <span className="text-base sm:text-lg lg:text-xl font-bold text-white">Grand Total:</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    Rs. {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                      className="w-full bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-bold py-3 sm:py-3.5 lg:py-4 rounded-lg sm:rounded-xl hover:from-green-700 hover:via-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base lg:text-lg"
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
