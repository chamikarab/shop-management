"use client";

import React, { useState } from "react";

interface Item {
  id: string;
  name: string;
  size?: string;
  packaging?: string;
  quantity: number;
  price: number;
  discount?: number;
  discountType?: string;
  free?: boolean;
}

interface Props {
  cart: Item[];
  customerName: string;
  phoneNumber: string;
  paymentType: string;
  cashGiven: number;
  balance: number;
  setCustomerName: (val: string) => void;
  setPhoneNumber: (val: string) => void;
  setPaymentType: (val: string) => void;
  setCashGiven: (val: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function CheckoutModal({
  cart,
  customerName,
  phoneNumber,
  paymentType,
  cashGiven,
  balance,
  setCustomerName,
  setPhoneNumber,
  setPaymentType,
  setCashGiven,
  onCancel,
  onConfirm,
}: Props) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  const calculateItemTotal = (item: Item): number => {
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

  const grandTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const paymentMethods = [
    { id: "Cash", label: "Cash", icon: "💵" },
    { id: "Card", label: "Card", icon: "💳" },
    { id: "Online", label: "Online", icon: "🌐" },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-md z-50 p-2 sm:p-4 lg:p-8 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl max-h-[96vh] overflow-hidden rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">Checkout</h2>
                <p className="text-indigo-100 text-sm mt-1.5 font-medium opacity-90">Review and complete your transaction</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-11 h-11 bg-white/10 hover:bg-white/25 rounded-xl flex items-center justify-center transition-all duration-300 hover:rotate-90 group border border-white/20"
            >
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Body - Two Column */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            
            {/* Left Column: Information Forms */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              
              {/* Customer Info Card */}
              <section className="bg-slate-50/50 rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Customer Details</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Customer Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 placeholder-slate-400 font-medium"
                        placeholder="Name (Optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 placeholder-slate-400 font-medium"
                        placeholder="Phone (Optional)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Info Card */}
              <section className="bg-slate-50/50 rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Payment Method</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentType(method.id)}
                      onMouseEnter={() => setHoveredMethod(method.id)}
                      onMouseLeave={() => setHoveredMethod(null)}
                      className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group ${
                        paymentType === method.id
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md scale-105"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`text-4xl transition-transform duration-300 ${hoveredMethod === method.id ? "scale-125" : ""}`}>
                        {method.icon}
                      </span>
                      <span className={`font-bold transition-colors ${paymentType === method.id ? "text-indigo-700" : "text-slate-600"}`}>
                        {method.label}
                      </span>
                      {paymentType === method.id && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg animate-in zoom-in duration-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {paymentType === "Cash" && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Cash Received</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <span className="text-xl font-bold text-slate-400 group-focus-within:text-emerald-600 transition-colors">Rs.</span>
                        </div>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="w-full pl-16 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all text-2xl font-black text-slate-800 placeholder-slate-300"
                          placeholder="0.00"
                          value={cashGiven || ""}
                          onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-xl shadow-emerald-100 flex justify-between items-center text-white relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="relative">
                        <span className="text-emerald-100 text-sm font-bold uppercase tracking-wider block mb-1">Change to return</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg opacity-80 font-bold">Rs.</span>
                          <span className="text-4xl font-black tracking-tight">{balance.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Order Summary (Sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-0 bg-slate-50 border border-slate-200/60 rounded-[2.5rem] p-6 sm:p-8 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Order Summary</h3>
                </div>

                {/* Items List */}
                <div className="flex-1 space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2">{item.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            {item.quantity} × Rs.{item.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-sm font-black text-slate-900 ml-3">
                          Rs.{calculateItemTotal(item).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.size && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold uppercase">{item.size}</span>
                        )}
                        {item.packaging && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold uppercase">{item.packaging}</span>
                        )}
                        {item.free && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[9px] font-bold uppercase">Free</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Section */}
                <div className="space-y-4 pt-6 border-t-2 border-slate-200 border-dashed">
                  <div className="flex justify-between items-center text-slate-500 font-bold px-2">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">Rs.{grandTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                    <div className="relative">
                      <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] block mb-2">Final Amount</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl opacity-60 font-black">Rs.</span>
                        <span className="text-4xl font-black tracking-tighter">{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all duration-300 active:scale-95"
          >
            Go Back
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex-1 px-8 py-4 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 group shadow-sm"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>

          <button
            onClick={onConfirm}
            disabled={(paymentType === "Cash" && cashGiven < grandTotal) || cart.length === 0}
            className={`flex-[1.5] px-8 py-4 rounded-2xl font-black text-white transition-all duration-300 shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${
              (paymentType === "Cash" && cashGiven < grandTotal) || cart.length === 0
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 shadow-indigo-200 scale-[1.02] hover:scale-[1.04]"
            }`}
          >
            <span>Complete Order</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
