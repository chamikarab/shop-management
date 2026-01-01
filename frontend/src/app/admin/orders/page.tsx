"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaClipboardList, FaBox } from "react-icons/fa";
import Link from "next/link";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetch(`${apiUrl}/orders`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const ordersData = data.data || data;

        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
          setFilteredOrders(ordersData);
        } else {
          console.error("Expected array but got:", ordersData);
          toast.error("Invalid data format from server");
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders", err);
        toast.error("Failed to fetch orders");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();

    setFilteredOrders(
      orders.filter((order) => {
        const invoiceId = order.invoiceId;
        const formattedDate = new Date(order.createdAt).toLocaleDateString("en-CA");
        const readableDate = new Date(order.createdAt).toLocaleDateString("en-LK", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const customerName = (order.customerName || "").toLowerCase();
        const phoneNumber = (order.phoneNumber || "").toLowerCase();

        return (
          invoiceId.toLowerCase().includes(lowerSearch) ||
          formattedDate.includes(lowerSearch) ||
          readableDate.toLowerCase().includes(lowerSearch) ||
          customerName.includes(lowerSearch) ||
          phoneNumber.includes(lowerSearch)
        );
      })
    );
  }, [search, orders]);

  const calculateItemTotal = (item: OrderItem): number => {
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

  const getPaymentBadgeColor = (paymentType: string) => {
    switch (paymentType.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-700";
      case "card":
        return "bg-blue-100 text-blue-700";
      case "online":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Order Management
          </h1>
          <p className="text-slate-600 font-medium">View and manage all sales orders</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-100 text-right">
          <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {filteredOrders.length}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Orders</div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 max-w-2xl">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">
              Search Order Repository
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by ID, Date, Customer or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-400 shadow-inner"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-6 md:pt-0">
            <div className="h-12 w-[2px] bg-slate-100 hidden md:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Displaying</span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {filteredOrders.length} <span className="text-slate-400 font-bold text-sm">Results</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-20 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-[6px] border-indigo-500 border-t-transparent mb-6 shadow-inner"></div>
          <p className="text-slate-500 text-xl font-bold tracking-tight">Fetching orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-20 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <FaClipboardList size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-500 text-xl font-bold tracking-tight">No orders found</p>
          <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">
            {search
              ? "We couldn't find any orders matching your search criteria."
              : "Start making sales in the POS section to see your orders here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700">Invoice ID</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700">Date & Time</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700">Customer</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700 text-center">Items</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700">Payment</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700 text-right">Total</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const invoiceId = order.invoiceId;
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="font-black text-slate-900 tracking-tight">{invoiceId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            {new Date(order.createdAt).toLocaleDateString("en-LK", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(order.createdAt).toLocaleTimeString("en-LK", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">
                            {order.customerName || <span className="text-slate-300 font-medium">Walk-in Customer</span>}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {order.phoneNumber || "No Phone"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-100 shadow-sm">
                          {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border border-transparent ${getPaymentBadgeColor(order.paymentType)}`}>
                          {order.paymentType}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-base font-black text-slate-900 tracking-tight">
                          Rs.{order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <Link
                            href={`/admin/orders/${order.invoiceId}`}
                            className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:border-indigo-500 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                            title="View Details"
                          >
                            <FaClipboardList size={14} />
                            View Record
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-md z-50 p-2 sm:p-4 lg:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[96vh] overflow-hidden rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30 text-white">
                    <FaClipboardList size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                      Order Details
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1.5 font-medium opacity-90">
                      Invoice: <span className="font-bold">{selectedOrder.invoiceId}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-11 h-11 bg-white/10 hover:bg-white/25 rounded-xl flex items-center justify-center transition-all duration-300 hover:rotate-90 group border border-white/20"
                >
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Body - Two Column */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-slate-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                
                {/* Left Column: Information Cards */}
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                  
                  {/* Info Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer & Contact Info */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                          <FaBox size={18} />
                        </div>
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Customer Details</h3>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Full Name</span>
                          <p className="text-slate-900 font-bold text-lg">{selectedOrder.customerName || "Walk-in Customer"}</p>
                        </div>
                        <div className="flex flex-col pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Contact Phone</span>
                          <p className="text-slate-900 font-bold text-lg">{selectedOrder.phoneNumber || "No phone provided"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Payment Info</h3>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Method</span>
                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPaymentBadgeColor(selectedOrder.paymentType)}`}>
                              {selectedOrder.paymentType}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Sale Date</span>
                            <p className="text-slate-900 font-bold">
                              {new Date(selectedOrder.createdAt).toLocaleDateString("en-LK", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Transaction ID</span>
                            <p className="text-slate-500 font-mono text-[10px]">{selectedOrder._id}</p>
                          </div>
                          <span className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded tracking-widest">Successful</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Table Style */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Line Items</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedOrder.items.length} items total</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-center">Qty</th>
                            <th className="px-6 py-4 text-right">Unit Price</th>
                            <th className="px-6 py-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                                  <div className="flex gap-2">
                                    {item.free && (
                                      <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Free</span>
                                    )}
                                    {item.discount && (
                                      <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                        Disc: {item.discount}{item.discountType === "percentage" ? "%" : " Rs."}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-sm font-bold text-slate-600">x{item.quantity}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-bold text-slate-600">Rs.{item.price.toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-black text-slate-900">Rs.{calculateItemTotal(item).toFixed(2)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column: Financial Summary */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                    
                    <div className="relative">
                      <div className="mb-10">
                        <h3 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Financial Summary</h3>
                        
                        <div className="space-y-5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raw Subtotal</span>
                            <span className="text-sm font-black text-white">
                              Rs.{selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-amber-400">
                            <span className="text-xs font-bold uppercase tracking-widest">Applied Savings</span>
                            <span className="text-sm font-black">
                              -Rs.{selectedOrder.items.reduce((sum, item) => {
                                const base = item.price * item.quantity;
                                return sum + (base - calculateItemTotal(item));
                              }, 0).toFixed(2)}
                            </span>
                          </div>
                          
                          {selectedOrder.paymentType.toLowerCase() === "cash" && (
                            <div className="pt-5 mt-5 border-t border-white/5 space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Received</span>
                                <span className="text-sm font-black text-white">Rs.{selectedOrder.cashGiven?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-400">
                                <span className="text-xs font-bold uppercase tracking-widest">Change</span>
                                <span className="text-sm font-black">Rs.{selectedOrder.balance?.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative pt-8 border-t border-white/10 mt-auto">
                      <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 text-center">Final Amount Paid</span>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-2xl opacity-40 font-black">Rs.</span>
                        <span className="text-5xl font-black tracking-tighter text-white">
                          {selectedOrder.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Footer Info */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Store Verification</p>
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-slate-900 font-bold text-xs">Digitally Signed Transaction</p>
                    <p className="text-slate-400 font-medium text-[10px] mt-1">Ready for audit & reporting</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95"
              >
                Close Record
              </button>
              
              <button
                onClick={() => window.print()}
                className="w-full sm:flex-1 px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all hover:border-indigo-600 hover:text-indigo-600 flex items-center justify-center gap-3 active:scale-95 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>

              <button
                className="w-full sm:flex-[1.5] px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}