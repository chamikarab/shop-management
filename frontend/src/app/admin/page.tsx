"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  FaBox, 
  FaUsers, 
  FaShoppingCart, 
  FaArrowRight, 
  FaPlus, 
  FaChartLine, 
  FaHistory,
  FaArrowUp,
  FaStore,
  FaWallet
} from "react-icons/fa";

type SummaryData = {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  todaysOrders: number;
  todaysRevenue: number;
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<SummaryData>({
    totalProducts: 0,
    totalUsers: 0,
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
      if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) return (data as any).data;
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
        const users = extractArray(usersRes);
        const orders = extractArray(ordersRes);

        const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        const today = new Date().toISOString().split('T')[0];
        const todaysOrdersList = orders.filter((o: any) => o.createdAt?.startsWith(today));
        const todaysOrders = todaysOrdersList.length;
        const todaysRevenue = todaysOrdersList.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

        setSummary({
          totalProducts: products.length,
          totalUsers: users.length,
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
      <div className="flex flex-col justify-center items-center h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Studio Data...</p>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    prefix = "",
    suffix = "",
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    trend?: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <div className="modern-card group relative overflow-hidden border-none shadow-sm hover:shadow-xl">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-500`} style={{ background: color }} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            {prefix}{value}{suffix}
          </h3>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                <FaArrowUp size={8} />
              </span>
              <span className="text-xs font-bold text-emerald-600">{trend}</span>
              <span className="text-[10px] text-slate-400 font-medium italic">vs last month</span>
            </div>
          )}
        </div>
        <div className="p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" style={{ background: `${color}15`, color: color }}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <Link href="/admin" className="hover:text-indigo-600 transition-colors">Studio</Link>
            <span>/</span>
            <span className="text-slate-900">Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 m-0">
            Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Overview</span>
          </h1>
          <p className="text-slate-500 font-medium">Welcome back, Commander. Here&apos;s your studio performance at a glance.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="modern-btn modern-btn-secondary py-3 px-5 text-sm bg-white border border-slate-200">
            <FaHistory size={14} className="text-slate-400" />
            Activity Log
          </button>
          <Link href="/admin/billing" className="modern-btn modern-btn-primary py-3 px-6 text-sm bg-slate-900 text-white shadow-indigo-200">
            <FaShoppingCart size={14} />
            New Sale (POS)
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={summary.totalRevenue.toLocaleString()}
          prefix="LKR "
          icon={FaWallet}
          color="#6366f1"
          trend="+12.5%"
        />
        <StatCard
          title="Total Orders"
          value={summary.totalOrders}
          icon={FaShoppingCart}
          color="#ec4899"
          trend="+8.2%"
        />
        <StatCard
          title="Inventory Assets"
          value={summary.totalProducts}
          icon={FaBox}
          color="#f59e0b"
          trend="+3.1%"
        />
        <StatCard
          title="Client Base"
          value={summary.totalUsers}
          icon={FaUsers}
          color="#10b981"
          trend="+5.4%"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Performance */}
        <div className="lg:col-span-2 space-y-6">
          <div className="modern-card p-0 overflow-hidden border-none shadow-sm h-full hover:transform-none">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 italic tracking-tight">Today&apos;s <span className="text-indigo-600">Performance</span></h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Metrics</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</span>
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FaChartLine size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Revenue</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">LKR {summary.todaysRevenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }} />
                </div>
                <p className="text-[10px] text-slate-400 font-bold italic">65% of daily target reached</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <FaShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Orders</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{summary.todaysOrders} Units</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }} />
                </div>
                <p className="text-[10px] text-slate-400 font-bold italic">42% increase from yesterday</p>
              </div>
            </div>

            <div className="bg-slate-50/50 p-8 border-t border-slate-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden" />
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">+12</div>
                  </div>
                  <p className="text-xs text-slate-500 font-bold italic">Active users in studio now</p>
                </div>
                <Link href="/admin/orders" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                  View Detailed Analytics <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="space-y-6">
          <div className="modern-card p-8 border-none shadow-sm bg-slate-900 text-white relative overflow-hidden h-full hover:transform-none">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xl font-black italic tracking-tight">Quick <span className="text-indigo-400">Actions</span></h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Studio Control Center</p>
              </div>

              <div className="space-y-3">
                <Link href="/admin/products/add" className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <FaPlus size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-black italic tracking-tight">Deploy Product</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.05em]">New Inventory Asset</p>
                    </div>
                  </div>
                  <FaArrowRight size={12} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/admin/users/add" className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FaUsers size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-black italic tracking-tight">Provision User</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.05em]">New Access Credential</p>
                    </div>
                  </div>
                  <FaArrowRight size={12} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/admin/billing" className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <FaStore size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-black italic tracking-tight">Studio POS</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.05em]">Terminal Sale Entry</p>
                    </div>
                  </div>
                  <FaArrowRight size={12} className="text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                      <FaChartLine size={12} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest">System Status</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed"> All studio systems operational. Node connectivity at 99.9% efficiency.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
