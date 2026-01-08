"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { 
  FaClipboardList, FaBox, FaFilter, FaTimes, FaSearch, 
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaCreditCard, 
  FaMoneyBillWave, FaGlobe, FaArrowRight
} from "react-icons/fa";
import Link from "next/link";
import WithPermission from "@/components/WithPermission";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  discountType?: "flat" | "percentage";
  free?: boolean;
}

interface Order {
  _id: string;
  invoiceId: string;
  items: OrderItem[];
  total: number;
  customerName?: string;
  phoneNumber?: string;
  paymentType: string;
  cashGiven?: number;
  balance?: number;
  createdAt: string;
  updatedAt: string;
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPaymentType, setFilterPaymentType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<keyof Order>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/orders`, { credentials: "include" });
      const data = await res.json();
        const ordersData = data.data || data;

        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        } else {
          console.error("Expected array but got:", ordersData);
          toast.error("Invalid data format from server");
        }
    } catch (err) {
        console.error("Failed to fetch orders", err);
        toast.error("Failed to fetch orders");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const today = new Date().toISOString().split('T')[0];
    const todaysOrdersList = orders.filter(o => o.createdAt.startsWith(today));
    const todaysOrders = todaysOrdersList.length;
    const todaysRevenue = todaysOrdersList.reduce((sum, order) => sum + order.total, 0);
    
    return { totalOrders, totalRevenue, todaysOrders, todaysRevenue };
  }, [orders]);

  const filteredAndSortedOrders = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return orders
      .filter((order) => {
        const invoiceId = order.invoiceId;
        const formattedDate = new Date(order.createdAt).toLocaleDateString("en-CA");
        const readableDate = new Date(order.createdAt).toLocaleDateString("en-LK", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const customerName = (order.customerName || "").toLowerCase();
        const phoneNumber = (order.phoneNumber || "").toLowerCase();

        const matchesSearch = !search || (
          invoiceId.toLowerCase().includes(lowerSearch) ||
          formattedDate.includes(lowerSearch) ||
          readableDate.toLowerCase().includes(lowerSearch) ||
          customerName.includes(lowerSearch) ||
          phoneNumber.includes(lowerSearch)
        );

        const matchesPaymentType = filterPaymentType === "all" || 
          order.paymentType.toLowerCase() === filterPaymentType.toLowerCase();

        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);

        let matchesDateRange = true;
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) matchesDateRange = false;
        }
        if (endDate && matchesDateRange) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) matchesDateRange = false;
        }

        return matchesSearch && matchesPaymentType && matchesDateRange;
      })
      .sort((a, b) => {
        let valA: string | number = a[sortBy] as string | number || "";
        let valB: string | number = b[sortBy] as string | number || "";
        
        if (sortBy === "createdAt") {
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [search, filterPaymentType, startDate, endDate, orders, sortBy, sortOrder]);

  const toggleSort = (key: keyof Order) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const getPaymentIcon = (paymentType: string) => {
    switch (paymentType.toLowerCase()) {
      case "cash": return <FaMoneyBillWave size={12} />;
      case "card": return <FaCreditCard size={12} />;
      case "online": return <FaGlobe size={12} />;
      default: return <FaBox size={12} />;
    }
  };

  const getPaymentColor = (paymentType: string) => {
    switch (paymentType.toLowerCase()) {
      case "cash": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "card": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "online": return "bg-purple-50 text-purple-600 border-purple-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 min-h-screen bg-[#f8fafc]">
      {/* 2026 Ultra-Modern Studio Header */}
      <div className="relative mb-10 pt-0">
        <div className="absolute top-0 right-0 w-[60%] h-[600px] bg-gradient-to-bl from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent blur-[120px] -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="flex items-start gap-12">
            <div className="space-y-8">
              {/* Futuristic Breadcrumb */}
              <nav className="flex items-center gap-4">
                <Link href="/admin" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Overview</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">All Orders</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-7xl md:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic">
                   
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">All Orders</span>
          </h1>
                <p className="text-slate-400 font-medium text-xl md:text-2xl leading-relaxed">
                  Real-time synchronization and analysis of your global transaction mesh.
                </p>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="modern-card group flex items-center gap-6 border-l-4 border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <FaClipboardList size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Orders</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-emerald-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
            <FaMoneyBillWave size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Revenue</p>
            <p className="text-3xl font-black text-slate-900">Rs. {stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-amber-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
            <FaCalendarAlt size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Today&apos;s Orders</p>
            <p className="text-3xl font-black text-slate-900">{stats.todaysOrders}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-purple-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500">
            <FaMoneyBillWave size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Today Revenue</p>
            <p className="text-3xl font-black text-slate-900">Rs. {stats.todaysRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="relative w-full lg:max-w-xl group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors duration-300">
            <FaSearch size={18} />
              </div>
              <input
                type="text"
            placeholder="Search by ID, Customer, or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            className="modern-input !pl-16 !py-4 !rounded-2xl text-lg font-medium bg-slate-50/50 focus:bg-white transition-all duration-300"
              />
          </div>

        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-slate-50/50 px-6 py-2 rounded-2xl border border-slate-100 flex-1 lg:flex-none">
            <FaFilter size={14} className="text-slate-400" />
                <select
                  value={filterPaymentType}
                  onChange={(e) => setFilterPaymentType(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-black text-slate-600 uppercase tracking-widest cursor-pointer min-w-[140px]"
                >
                  <option value="all">All Payments</option>
              <option value="cash">Cash Only</option>
              <option value="card">Card Only</option>
              <option value="online">Online Only</option>
                </select>
              </div>

          <div className="flex items-center gap-3 bg-slate-50/50 px-4 py-2 rounded-2xl border border-slate-100">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer"
                />
            <span className="text-slate-300 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer"
                />
              </div>

              {(filterPaymentType !== "all" || startDate || endDate) && (
                <button
                  onClick={() => {
                    setFilterPaymentType("all");
                    setStartDate("");
                    setEndDate("");
                  }}
              className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300"
              title="Clear Filters"
                >
              <FaTimes size={16} />
                </button>
              )}
            </div>
          </div>

      {/* Orders Table Display */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="modern-card animate-pulse flex items-center justify-between rounded-[2rem] h-24 bg-white/50 border-slate-100">
              <div className="flex gap-4 items-center ml-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-32"></div>
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
            </div>
          </div>
              <div className="h-4 bg-slate-100 rounded w-24 mr-8"></div>
        </div>
          ))}
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="modern-card py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-transparent shadow-none">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 text-slate-200 mb-8">
            <FaClipboardList size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">No transactions logged</h3>
          <p className="text-slate-400 max-w-sm mx-auto font-medium">No order data satisfies the current filter parameters or the repository is empty.</p>
          <button 
            onClick={() => {setSearch(""); setFilterPaymentType("all"); setStartDate(""); setEndDate("");}}
            className="mt-10 px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-600 transition-all duration-300"
          >
            Reset Data View
          </button>
        </div>
      ) : (
        <div className="modern-table shadow-2xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("invoiceId")}>
                    <div className="flex items-center gap-3">
                      Invoice ID
                      {sortBy === "invoiceId" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("createdAt")}>
                    <div className="flex items-center gap-3">
                      Timestamp
                      {sortBy === "createdAt" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6">Customer Entity</th>
                  <th className="px-8 py-6 text-center">Item Density</th>
                  <th className="px-8 py-6 text-center">Payment Mesh</th>
                  <th className="px-8 py-6 text-right cursor-pointer group" onClick={() => toggleSort("total")}>
                    <div className="flex items-center justify-end gap-3">
                      Total Value
                      {sortBy === "total" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6 text-center">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/80 transition-colors duration-300 group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{order.invoiceId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-bold text-sm tracking-tight">
                            {new Date(order.createdAt).toLocaleDateString("en-LK", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            {new Date(order.createdAt).toLocaleTimeString("en-LK", {
                            hour: "2-digit", minute: "2-digit"
                          })}
                          </span>
                        </div>
                      </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm uppercase tracking-wider">
                          {order.customerName || "Walk-in Customer"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest">
                          {order.phoneNumber || "No contact"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="inline-flex items-center justify-center px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                        {order.items.length} Units
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getPaymentColor(order.paymentType)}`}>
                        {getPaymentIcon(order.paymentType)}
                        {order.paymentType}
                      </div>
                      </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-900 text-lg tracking-tighter">Rs. {order.total.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <Link
                            href={`/admin/orders/${order.invoiceId}`}
                          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 hover:shadow-xl transition-all duration-300 active:scale-95 group/btn"
                        >
                          <span>Open Invoice</span>
                          <FaArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedOrdersPage() {
  return (
    <WithPermission required="orders:view">
      <OrdersPage />
    </WithPermission>
  );
}
