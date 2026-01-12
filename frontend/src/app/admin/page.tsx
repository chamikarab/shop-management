"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  FaBox, FaUsers, FaClipboardList, FaPlus, FaShoppingCart, 
  FaArrowRight, FaChartLine, FaCheckCircle, FaBolt, 
  FaShieldAlt, FaRocket, FaBeer, FaClock, FaCalendarAlt,
  FaExclamationTriangle
} from "react-icons/fa";

type SummaryData = {
  totalProducts: number;
  lowStock: number;
  totalOrders: number;
  totalRevenue: number;
  todaysOrders: number;
  todaysRevenue: number;
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<SummaryData>({
    totalProducts: 0,
    lowStock: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todaysOrders: 0,
    todaysRevenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithRetry = async (url: string) => {
      let res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) throw new Error("Session refresh failed");

        res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Still unauthorized");
      }

      return res.json();
    };

    const extractArray = (data: unknown) => {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) return data.data;
      return [];
    };

    const fetchDashboardData = async () => {
      try {
        await fetchWithRetry("/api/me");

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const [productsRes, usersRes, ordersRes] = await Promise.all([
          fetchWithRetry(`${apiUrl}/products`),
          fetchWithRetry(`${apiUrl}/users`),
          fetchWithRetry(`${apiUrl}/orders`),
        ]);

        const products = extractArray(productsRes);
        const orders = extractArray(ordersRes);

        const lowStockCount = products.filter((p: any) => (p.stock || 0) < 10).length;
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        
        const today = new Date().toISOString().split('T')[0];
        const todaysOrdersList = orders.filter((o: any) => o.createdAt.startsWith(today));
        const todaysOrders = todaysOrdersList.length;
        const todaysRevenue = todaysOrdersList.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

        setSummary({
          totalProducts: products.length,
          lowStock: lowStockCount,
          totalOrders: orders.length,
          totalRevenue,
          todaysOrders,
          todaysRevenue,
        });
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FaBolt className="text-indigo-600 animate-pulse" size={24} />
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-bold tracking-widest uppercase text-xs">Initializing Studio...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-12 animate-in fade-in duration-700">
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-600 font-black tracking-[0.2em] uppercase text-xs sm:text-sm">
            <span className="w-12 h-[2px] bg-indigo-600"></span>
            System Overview
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic break-words">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">Dashboard</span>
            <br /> Insight
          </h1>
          <p className="text-slate-500 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
            Welcome to <span className="text-slate-900 font-bold">Sisila Beer Shop</span>. Monitor your beer shop metrics and manage operations with precision.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <FaCalendarAlt size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Date</p>
              <p className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <FaShieldAlt size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
              <p className="text-slate-900 font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Operational
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
        {/* Total Products */}
        <div className="modern-card group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <FaBox size={24} />
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">Inventory</span>
            </div>
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Total Products</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                  {summary.totalProducts.toLocaleString()}
                </p>
                <span className="text-slate-300 font-bold text-sm uppercase tracking-widest">Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="modern-card group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <FaBolt size={24} />
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Live Now</span>
            </div>
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Today Revenue</p>
              <div className="flex items-baseline gap-1">
                <span className="text-slate-300 font-bold text-2xl">LKR</span>
                <p className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                  {summary.todaysRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="modern-card group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                <FaClock size={24} />
              </div>
              <span className="px-3 py-1 bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full">New Today</span>
            </div>
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Today Orders</p>
              <p className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                {summary.todaysOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="modern-card group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex items-center justify-between">
              <div className={`w-14 h-14 ${summary.lowStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'} rounded-2xl flex items-center justify-center transition-colors duration-500`}>
                <FaExclamationTriangle size={24} />
              </div>
              <span className={`px-3 py-1 ${summary.lowStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'} text-[10px] font-black uppercase tracking-widest rounded-full transition-colors duration-500`}>Alert</span>
            </div>
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Low Stock Items</p>
              <p className={`text-4xl sm:text-5xl font-black ${summary.lowStock > 0 ? 'text-rose-600' : 'text-slate-900'} tracking-tighter tabular-nums transition-colors duration-500`}>
                {summary.lowStock.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- QUICK ACTIONS & OVERVIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Action Hub */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Action Hub</h2>
            <div className="flex-1 h-[1px] bg-slate-100"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Link href="/admin/billing" className="group">
              <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaShoppingCart size={20} />
                  </div>
                  <FaArrowRight className="text-white/40 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-1">POS Terminal</h3>
                <p className="text-white/70 text-sm">Launch a new sales transaction</p>
              </div>
            </Link>

            <Link href="/admin/products/add" className="group">
              <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-slate-900 hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <FaPlus size={20} />
                  </div>
                  <FaArrowRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-1">Add Product</h3>
                <p className="text-slate-500 text-sm">Deploy new items to inventory</p>
              </div>
            </Link>

            <Link href="/admin/orders" className="group">
              <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-slate-900 hover:border-violet-600 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                    <FaClipboardList size={20} />
                  </div>
                  <FaArrowRight className="text-slate-200 group-hover:text-violet-600 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-1">Manage Orders</h3>
                <p className="text-slate-500 text-sm">Review recent sales activity</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Operational Intelligence */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Intel</h2>
            <div className="flex-1 h-[1px] bg-slate-100"></div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[3rem] p-8 sm:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Inventory Engine</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Stock Integrity</h3>
                  <p className="text-slate-500 font-medium">Monitoring {summary.totalProducts} active units across all categories.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${summary.lowStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} rounded-xl flex items-center justify-center transition-colors`}>
                      {summary.lowStock > 0 ? <FaExclamationTriangle size={16} /> : <FaCheckCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-sm">
                        {summary.lowStock > 0 ? `${summary.lowStock} Items Low Stock` : 'All Systems Nominal'}
                      </p>
                      <p className="text-slate-400 text-xs font-medium">
                        {summary.lowStock > 0 ? 'Urgent restocking required' : 'Cloud sync active and encrypted'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <FaBeer size={16} />
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-sm">SKU Optimization</p>
                      <p className="text-slate-400 text-xs font-medium">Performance tracking enabled</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-8 flex flex-col justify-between border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <FaChartLine className="text-slate-400" size={14} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Intel</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1 h-3 bg-indigo-200 rounded-full animate-bounce"></span>
                    <span className="w-1 h-5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-4 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{summary.totalOrders}</p>
                      <p className="text-slate-500 text-sm font-bold">Lifetime Orders</p>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-slate-300 font-bold text-lg">LKR</span>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{summary.totalRevenue.toLocaleString()}</p>
                      </div>
                      <p className="text-slate-500 text-sm font-bold">Lifetime Revenue</p>
                    </div>
                  </div>
                  
                  <Link href="/admin/orders" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-600 transition-colors group">
                    <span className="text-slate-900 font-bold text-sm">Analyze Intelligence Data</span>
                    <FaArrowRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
