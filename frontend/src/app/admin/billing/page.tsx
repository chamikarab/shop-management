"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import CheckoutModal from "@/components/CheckoutModal";
import Invoice from "@/components/Invoice";
import { 
  FaSearch, FaTags, FaBox, FaTrash, FaPlus, FaMinus, 
  FaShoppingCart, FaBeer, FaWineBottle, FaChevronRight, 
  FaHistory, FaTimes, FaLayerGroup, FaArrowLeft
} from "react-icons/fa";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

    // Trigger pop-up effect
    setAnimatingId(product.id);
    setTimeout(() => setAnimatingId(null), 300);

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
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* --- HIGH-IMPACT HEADER SECTION --- */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 sm:gap-8 border-b border-slate-100 pb-6 sm:pb-8">
        <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 text-indigo-600 font-black tracking-[0.2em] uppercase text-[10px] sm:text-xs">
            <span className="w-8 lg:w-12 h-[2px] bg-indigo-600"></span>
            Retail Operations
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic break-words">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">Point </span>
              Of Sale
          </h1>
          <p className="text-slate-500 text-sm sm:text-base lg:text-lg font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed px-4 lg:px-0">
            Create and manage <span className="text-slate-900 font-bold">walk-in customer</span> orders with real-time inventory synchronization.
          </p>
        </div>
        
        <div className="flex flex-col items-center lg:items-end gap-4 px-4 lg:px-0">
          {/* Time & Date Module */}
          <div className="bg-white border border-slate-100 rounded-2xl px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start">
            <div className="text-right border-r border-slate-100 pr-4 sm:pr-6 shrink-0">
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Current Date</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 leading-none whitespace-nowrap">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="shrink-0">
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Live Time</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 tabular-nums leading-none whitespace-nowrap">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
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
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-red-100 rounded-2xl text-red-600 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 shadow-sm whitespace-nowrap"
              >
                <FaTrash className="text-[10px] sm:text-xs" />
                <span>Clear Cart</span>
              </button>
            )}
            <Link 
              href="/admin/orders" 
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 hover:border-indigo-600 hover:text-indigo-600 transition-all duration-300 shadow-sm whitespace-nowrap"
            >
              <FaHistory className="text-[10px] sm:text-xs" />
              <span>History</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Products Section */}
        <div className="flex-1 space-y-4">
          {/* Modern Search & Filter */}
          <div className="modern-card p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex-1 relative group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="    Search products by name or SKU..."
                  className="modern-input pl-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-6 font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Navigation Breadcrumbs for Categories */}
          {(selectedCategory || selectedPackaging) && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={handleBackToCategories}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all whitespace-nowrap shadow-sm"
              >
                <FaLayerGroup className="text-xs" />
                Categories
              </button>
              {selectedCategory && (
                <>
                  <FaChevronRight className="text-[10px] text-slate-400 flex-shrink-0" />
                  <button
                    onClick={handleBackToPackaging}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm ${
                      !selectedPackaging 
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
                    }`}
                  >
                    <FaBox className="text-xs" />
                    {selectedCategory}
                  </button>
                </>
              )}
              {selectedPackaging && (
                <>
                  <FaChevronRight className="text-[10px] text-slate-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-600 rounded-full text-sm font-bold text-white shadow-md whitespace-nowrap">
                    <FaWineBottle className="text-xs" />
                    {selectedPackaging}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dynamic Views */}
          <div className="min-h-[300px] sm:min-h-[400px]">
            {/* Categories View */}
            {!selectedCategory && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {categories.length === 0 ? (
                  <div className="col-span-full modern-card p-12 text-center bg-slate-50/50 border-dashed border-2">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FaBox className="text-2xl text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Products Found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  categories.map((category) => {
                    const categoryColor = categoryMap.get(category) || '#6366f1';
                    return (
                      <div
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className="modern-card p-6 cursor-pointer group hover:border-slate-900 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 overflow-hidden relative active:scale-95 bg-white"
                      >
                        <div 
                          className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500"
                          style={{ backgroundColor: categoryColor }}
                        ></div>
                        <div className="flex items-start justify-between mb-8">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                            style={{ backgroundColor: categoryColor }}
                          >
                            <FaLayerGroup className="text-xl" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 transition-colors">Explore</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{category}</h3>
                        <p className="text-slate-500 text-sm font-medium">View packaging options for this category.</p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Packaging View */}
            {selectedCategory && !selectedPackaging && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Back Button Card */}
                <div
                  onClick={handleBackToCategories}
                  className="modern-card p-6 cursor-pointer group hover:border-slate-900 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 overflow-hidden relative border-dashed border-2 bg-slate-50/30 active:scale-95"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-200 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <FaArrowLeft className="text-xl" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-900 transition-colors">Go Back</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Back to Categories</h3>
                  <p className="text-slate-500 text-sm font-medium">Return to category selection screen.</p>
                </div>

                {packagingOptions.map((packaging) => {
                  const categoryColor = categoryMap.get(selectedCategory || '') || '#6366f1';
                  return (
                    <div
                      key={packaging}
                      onClick={() => handlePackagingClick(packaging)}
                      className="modern-card p-6 cursor-pointer group hover:border-slate-900 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 overflow-hidden relative active:scale-95 bg-white"
                    >
                      <div 
                        className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500"
                        style={{ backgroundColor: categoryColor }}
                      ></div>
                      <div className="flex items-start justify-between mb-8">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                          style={{ backgroundColor: categoryColor }}
                        >
                          <FaBox className="text-xl" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 transition-colors">Select</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">{packaging}</h3>
                      <p className="text-slate-500 text-sm font-medium">View products in {packaging} packaging.</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Products View */}
            {selectedCategory && selectedPackaging && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Back Button Card */}
                <div
                  onClick={handleBackToPackaging}
                  className="modern-card p-5 group cursor-pointer relative overflow-hidden flex flex-col border-dashed border-2 bg-slate-50/30 hover:border-slate-900 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 active:scale-95"
                >
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <FaArrowLeft className="text-xl text-slate-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-slate-600 transition-colors mb-1">Back to Packaging</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Go Back</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Return to packaging selection</span>
                  </div>
                </div>

                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`modern-card p-5 group cursor-pointer relative overflow-hidden flex flex-col transition-all duration-500 bg-white ${
                      animatingId === product.id 
                        ? "scale-105 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-slate-900 z-10" 
                        : "hover:border-slate-900 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95"
                    } ${
                      product.stock === 0 ? "opacity-60 grayscale cursor-not-allowed" : ""
                    }`}
                  >
                    {/* Stock Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      {product.stock === 0 ? (
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider">Out of Stock</span>
                      ) : product.stock <= 10 ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">Low Stock: {product.stock}</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">Stock: {product.stock}</span>
                      )}
                    </div>

                    <div className="mb-6">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                        <FaBeer className="text-xl text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors mb-1">{product.name}</h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        {product.size && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">{product.size}</span>
                        )}
                        <span>•</span>
                        <span>{product.packaging}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-2xl font-black text-slate-900">
                        <span className="text-sm font-bold text-slate-400 mr-1">Rs.</span>
                        {product.price.toFixed(2)}
                      </div>
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all">
                        <FaPlus className="text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
          <div className="modern-card p-0 sticky top-4 lg:top-10 overflow-hidden border-2 border-slate-900/5 shadow-2xl flex flex-col h-auto lg:h-[calc(100vh-80px)] bg-white">
            {/* High-Impact Cart Header */}
            <div className="bg-slate-900 p-5 shrink-0 relative overflow-hidden rounded-b-[1rem] rounded-t-[1rem]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex items-center justify-between mb-1 relative z-10">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                    <FaShoppingCart className="text-indigo-400 text-sm" />
                  </div>
                  Cart
                </h2>
                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-indigo-300 uppercase tracking-widest border border-white/10">
                  {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                </div>
              </div>
              <p className="text-slate-400 text-[11px] font-medium opacity-70 relative z-10 uppercase tracking-tight">Current Transaction</p>
            </div>

            {/* Cart Items Area - Optimized for Space */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 animate-pulse">
                    <FaBox className="text-2xl text-slate-200" />
                  </div>
                  <h3 className="text-slate-900 font-black text-base mb-1 uppercase tracking-tight">Empty Cart</h3>
                  <p className="text-slate-400 text-[11px] font-medium">Add products to begin.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="group bg-white rounded-2xl border border-slate-200/60 p-3 hover:border-indigo-400 transition-all duration-300 shadow-sm relative overflow-hidden">
                    {item.free && (
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-green-500 text-white text-[7px] font-black uppercase tracking-widest rounded-bl-lg shadow-sm z-10">
                        Free
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-sm group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                          <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{item.size || 'Std'}</span>
                          <span className="text-indigo-500/60 font-bold">Rs.{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 gap-3">
                      {/* Slim Qty Controls */}
                      <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                        <button 
                          onClick={() => decreaseQty(item.id)}
                          className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90"
                        >
                          <FaMinus className="text-[8px]" />
                        </button>
                        <span className="w-7 text-[11px] font-black text-slate-900 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => increaseQty(item.id)}
                          className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90"
                        >
                          <FaPlus className="text-[8px]" />
                        </button>
                      </div>

                      {/* Compact Discount & Free Toggle */}
                      <div className="flex-1 flex items-center gap-1.5">
                        <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                          <input
                            type="number"
                            value={item.discount || ""}
                            onChange={(e) => updateCartItem(item.id, { discount: Number(e.target.value) || 0 })}
                            className="w-full bg-transparent border-none p-0 text-[10px] font-black text-slate-900 focus:ring-0 placeholder-slate-300"
                            placeholder="Disc"
                          />
                          <button
                            onClick={() => updateCartItem(item.id, { 
                              discountType: item.discountType === "percentage" ? "flat" : "percentage" 
                            })}
                            className={`text-[8px] font-black px-1 rounded transition-all ${
                              item.discountType === "percentage" ? "text-indigo-600" : "text-slate-400"
                            }`}
                          >
                            {item.discountType === "percentage" ? "%" : "Rs."}
                          </button>
                        </div>
                        <button
                          onClick={() => updateCartItem(item.id, { free: !item.free })}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                            item.free 
                              ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-200" 
                              : "bg-slate-50 border-slate-100 text-slate-300 hover:border-green-400 hover:text-green-500"
                          }`}
                          title="Mark as Free"
                        >
                          <span className="text-[7px] font-black uppercase">Free</span>
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-[70px]">
                        <div className={`text-sm font-black tracking-tight ${item.free ? 'text-green-500 line-through opacity-50' : 'text-slate-900'}`}>
                          <span className="text-[9px] mr-0.5">Rs.</span>
                          {calculateItemTotal(item).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Slim Summary Footer */}
            <div className="p-4 bg-white border-t-2 border-slate-100 shrink-0 shadow-[0_-15px_30px_-10px_rgba(0,0,0,0.05)] relative z-20">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Discount Box */}
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <FaTags className="text-indigo-500 text-[8px]" />
                    Bill Discount
                  </span>
                  <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-indigo-400 transition-all p-1">
                    <input
                      type="number"
                      className="w-full bg-transparent border-none pl-2 pr-8 py-1.5 text-xs font-black text-slate-900 focus:ring-0 placeholder-slate-300"
                      placeholder="0.00"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                    <button
                      onClick={() => setIsPercentage(!isPercentage)}
                      className="absolute right-1 w-7 h-7 flex items-center justify-center bg-white shadow-sm rounded-lg text-[9px] font-black text-indigo-600 border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      {isPercentage ? '%' : 'Rs.'}
                    </button>
                  </div>
                </div>

                {/* Subtotal Box */}
                <div className="space-y-1.5 text-right px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Subtotal</span>
                  <p className="text-base font-black text-slate-900 tracking-tight">Rs. {totalBeforeDiscount.toFixed(2)}</p>
                  {discountValue > 0 && (
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-tight animate-in slide-in-from-right-2">
                      -Rs. {discountValue.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* High-Impact Total & Action */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-900 rounded-2xl p-3 px-4 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                  <span className="text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] block mb-0.5">Grand Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs opacity-50 font-black">Rs.</span>
                    <span className="text-2xl font-black tracking-tighter tabular-nums">{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <button
                  disabled={cart.length === 0}
                  onClick={() => setShowModal(true)}
                  className="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-600/20 flex flex-col items-center justify-center gap-1 group active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <FaChevronRight className="text-xl group-hover:translate-x-1 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Pay</span>
                </button>
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
