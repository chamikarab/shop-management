"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaClipboardList, FaBox, FaArrowLeft, FaPrint, FaDownload, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";
import Invoice from "@/components/Invoice";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  packaging?: string;
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

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (!id) return;

    fetch(`${apiUrl}/orders/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setOrder(data.data);
        } else {
          toast.error("Order not found");
          router.push("/admin/orders");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch order", err);
        toast.error("Failed to load order details");
        setLoading(false);
      });
  }, [id, apiUrl, router]);

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
      case "cash": return "bg-green-50 text-green-700 border-green-100";
      case "card": return "bg-blue-50 text-blue-700 border-blue-100";
      case "online": return "bg-purple-50 text-purple-700 border-purple-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-[6px] border-indigo-500 border-t-transparent mb-6"></div>
          <p className="text-slate-500 text-xl font-bold">Loading Order Records...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all border border-slate-200"
            >
              <FaArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                Order Repository
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">Master Record</span>
                <p className="text-slate-400 text-sm font-bold">INV-{order.invoiceId}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all hover:border-indigo-600 hover:text-indigo-600 flex items-center gap-3 shadow-sm"
            >
              <FaPrint size={14} />
              Print Invoice
            </button>
            <button
              className="px-6 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
            >
              <FaDownload size={14} />
              Download Audit
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-inner">
                <FaCheckCircle size={40} className="text-white" />
              </div>
              <div>
                <span className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Current Status</span>
                <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Transaction Finalized</h2>
                <p className="text-indigo-100/80 text-sm font-medium">Record created on {new Date(order.createdAt).toLocaleString("en-LK", {
                  dateStyle: "full",
                  timeStyle: "short"
                })}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Settlement Amount</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl opacity-60 font-black">Rs.</span>
                  <span className="text-5xl font-black tracking-tighter">{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns - Detailed Tables */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Information Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <FaBox size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Customer Entity</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Identified Name</label>
                    <p className="text-slate-900 font-bold text-xl">{order.customerName || "Non-Member / Walk-in"}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Verified Contact</label>
                    <p className="text-slate-900 font-bold text-xl">{order.phoneNumber || "Not registered"}</p>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Financial Protocol</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Settlement Type</label>
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getPaymentBadgeColor(order.paymentType)}`}>
                        {order.paymentType}
                      </span>
                    </div>
                    <div className="text-right">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Audit Score</label>
                      <span className="text-emerald-600 font-black text-sm">100% SECURE</span>
                    </div>
                  </div>
                  {order.paymentType.toLowerCase() === "cash" && (
                    <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tendered</label>
                        <p className="text-slate-900 font-black text-lg">Rs.{order.cashGiven?.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Draw Change</label>
                        <p className="text-emerald-600 font-black text-lg">Rs.{order.balance?.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Line Items Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Order Ledger</h3>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {order.items.length} Entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="px-8 py-5">Description & Logic</th>
                      <th className="px-8 py-5 text-center">Unit Count</th>
                      <th className="px-8 py-5 text-right">Standard Rate</th>
                      <th className="px-8 py-5 text-right">Final Extension</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order.items.map((item, index) => (
                      <tr key={index} className="group hover:bg-slate-50/80 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-base mb-2 group-hover:text-indigo-600 transition-colors">
                              {item.name}
                            </span>
                            <div className="flex gap-2">
                              {item.free && (
                                <span className="text-[9px] font-black uppercase text-white bg-emerald-500 px-2 py-0.5 rounded shadow-sm">Promotional Free</span>
                              )}
                              {item.discount && (
                                <span className="text-[9px] font-black uppercase text-white bg-amber-500 px-2 py-0.5 rounded shadow-sm">
                                  Disc Applied: {item.discount}{item.discountType === "percentage" ? "%" : " Rs."}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 rounded-xl text-sm font-black text-slate-700 border border-slate-100">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-sm font-bold text-slate-400 tracking-wide">Rs.{item.price.toFixed(2)}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-base font-black text-slate-900 tracking-tight">Rs.{calculateItemTotal(item).toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Audit Summary */}
          <div className="space-y-8">
            <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
              
              <div className="relative space-y-10">
                <div>
                  <h3 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.25em] mb-10 border-b border-white/10 pb-4">Audit Summary</h3>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-widest">Gross Ledger</span>
                      <span className="text-sm font-black text-white">
                        Rs.{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-amber-400">
                      <span className="text-xs font-bold uppercase tracking-widest">Total Reductions</span>
                      <span className="text-sm font-black">
                        -Rs.{order.items.reduce((sum, item) => {
                          const base = item.price * item.quantity;
                          return sum + (base - calculateItemTotal(item));
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-white/10">
                  <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.25em] block mb-4 text-center">Net Settlement</span>
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-3xl opacity-30 font-black">Rs.</span>
                    <span className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-slate-400">
                      {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Store Authentication Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Store Integrity</p>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center border-2 border-emerald-100 shadow-inner">
                  <FaCheckCircle size={32} />
                </div>
              </div>
              <h4 className="text-slate-900 font-black text-sm mb-2 uppercase tracking-tight">Sisila Beer Shop - Kandy</h4>
              <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">System Authenticated Transaction</p>
              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-4 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Invoice for Printing */}
      <Invoice
        cart={order.items.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          stock: 0,
          size: item.size,
          packaging: item.packaging,
          discount: item.discount,
          discountType: item.discountType,
          free: item.free
        }))}
        invoiceDate={new Date(order.createdAt).toLocaleString()}
        invoiceId={order.invoiceId}
        grandTotal={order.total}
        cashGiven={order.cashGiven || 0}
        discountValue={order.items.reduce((sum, item) => {
          const base = item.price * item.quantity;
          return sum + (base - calculateItemTotal(item));
        }, 0)}
        balance={order.balance || 0}
        paymentType={order.paymentType}
      />
    </div>
  );
}

