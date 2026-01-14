"use client";

import React, { useState, useEffect } from "react";
import { 
  FaUser, FaPhone, FaWallet, FaCheck, FaTimes, 
  FaPrint, FaShoppingCart, FaCreditCard, FaGlobe,
  FaMoneyBillWave, FaArrowRight, FaReceipt
} from "react-icons/fa";

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    { id: "Cash", label: "Cash", icon: <FaMoneyBillWave size={24} />, color: "emerald" },
    { id: "Card", label: "Card", icon: <FaCreditCard size={24} />, color: "indigo" },
    { id: "Online", label: "Online", icon: <FaGlobe size={24} />, color: "violet" },
  ];

  return (
    <>
      {/* Backdrop Overlay - Full Screen Coverage */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[99]"
        onClick={onCancel}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh'
        }}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 sm:p-6 pointer-events-none overflow-y-auto">
        <div 
          className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col relative pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/50 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none"></div>

        {/* --- HEADER --- */}
        <header className="px-8 py-8 sm:px-12 flex items-center justify-between border-b border-slate-100 relative z-10 rounded-t-[3rem] bg-white">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white transform rotate-3">
              <FaShoppingCart size={28} />
              </div>
              <div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-[-0.04em]">
                Finalize <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Order</span>
              </h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Review items and process payment</p>
              </div>
            </div>
            <button
              onClick={onCancel}
            className="w-12 h-12 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
            >
            <FaTimes size={20} />
            </button>
        </header>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-6 sm:py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12">
            
            {/* LEFT: Customer & Summary */}
            <div className="lg:col-span-6 space-y-8 sm:space-y-12">
              
              {/* Section: Customer */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <FaUser size={14} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Customer Intelligence</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group relative">
                    <label className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                      <FaUser size={16} />
                    </label>
                      <input
                        type="text"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                      placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                  </div>
                  <div className="group relative">
                    <label className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                      <FaPhone size={16} />
                    </label>
                      <input
                        type="tel"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                      placeholder="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                  </div>
                </div>
              </section>

              {/* Section: Summary */}
              <section className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col shadow-inner">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center">
                      <FaReceipt size={14} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Summary</h3>
                  </div>
                  <span className="px-3 py-1 bg-white border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {cart.length} Items
                  </span>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar mb-6 sm:mb-8">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-sm font-bold">No items in cart</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 flex justify-between items-center group transition-all hover:shadow-md border border-transparent hover:border-slate-100">
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 text-sm leading-tight line-clamp-1">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{item.quantity} × Rs. {item.price.toFixed(2)}</span>
                          {item.free && <span className="text-[9px] font-black text-emerald-500 uppercase px-1.5 py-0.5 bg-emerald-50 rounded">Free</span>}
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-sm tabular-nums">
                        Rs. {calculateItemTotal(item).toFixed(2)}
                      </span>
                    </div>
                    ))
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200 border-dashed">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Subtotal</span>
                    <span className="text-slate-500 font-black text-sm">Rs. {grandTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12"></div>
                    <div className="relative">
                      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Grand Total</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-indigo-300 font-black text-2xl">Rs.</span>
                        <span className="text-5xl font-black text-slate-900 tracking-[-0.05em] tabular-nums">
                          {grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT: Payment Strategy */}
            <div className="lg:col-span-6 space-y-8 sm:space-y-12">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <FaWallet size={14} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Strategy</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentType(method.id)}
                      onMouseEnter={() => setHoveredMethod(method.id)}
                      onMouseLeave={() => setHoveredMethod(null)}
                      className={`relative p-4 sm:p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-3 sm:gap-4 group ${
                        paymentType === method.id
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className={`transition-transform duration-500 ${hoveredMethod === method.id ? "scale-125 rotate-6" : ""}`}>
                        {method.icon}
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">{method.label}</span>
                      {paymentType === method.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <FaCheck size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {paymentType === "Cash" && (
                  <div className="pt-8">
                      <div className="relative group">
                      {/* Modern Glassmorphic Container */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 rounded-[3rem] blur-2xl group-hover:scale-110 transition-transform duration-700 opacity-50"></div>
                      
                      <div className="relative bg-slate-900 rounded-[3rem] border border-slate-800 p-1 shadow-2xl overflow-hidden">
                        {/* Interactive Input Zone */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.8rem] p-6 sm:p-10 space-y-6 sm:space-y-10">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] italic">Cash Intake</p>
                              <h4 className="text-white font-black text-2xl tracking-tight">Amount Received</h4>
                            </div>
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner">
                              <FaMoneyBillWave size={24} />
                            </div>
                        </div>

                          <div className="relative group/input">
                            <div className="absolute -inset-4 bg-white/5 rounded-[2rem] scale-95 opacity-0 group-focus-within/input:scale-100 group-focus-within/input:opacity-100 transition-all duration-500"></div>
                            <div className="relative flex items-center gap-4">
                              <span className="text-3xl font-black text-slate-600 group-focus-within/input:text-emerald-500 transition-colors">Rs.</span>
                        <input
                          type="number"
                          inputMode="decimal"
                                min="0"
                                step="0.01"
                                className="bg-transparent border-none focus:ring-0 p-0 text-4xl sm:text-6xl lg:text-7xl font-black text-white w-full placeholder-slate-800 tabular-nums tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                          value={cashGiven || ""}
                          onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                          autoFocus
                        />
                      </div>
                    </div>
                        </div>

                        {/* Surplus/Change Display */}
                        <div className="px-6 sm:px-10 py-6 sm:py-8 bg-black/40 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 border-t border-white/5">
                          <div className="space-y-1">
                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Surplus Return</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-slate-600 font-black text-lg sm:text-xl italic">Rs.</span>
                              <span className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter tabular-nums transition-all duration-500 ${balance > 0 ? 'text-emerald-400' : 'text-slate-700'}`}>
                                {balance.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {balance > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] rotate-3">
                                <FaCheck size={28} />
                              </div>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ready</span>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-slate-800 text-slate-600 rounded-[1.5rem] flex items-center justify-center">
                              <FaTimes size={24} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <footer className="px-4 sm:px-8 py-6 sm:py-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-10 rounded-b-[3rem]">
          <button
            onClick={onCancel}
            className="flex-1 px-8 py-5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-300 active:scale-95"
          >
            Modify Cart
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-8 py-5 bg-white border-2 border-slate-100 hover:border-indigo-600 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 group shadow-sm"
          >
            <FaPrint size={18} />
            <span className="font-black uppercase tracking-widest text-xs">Print</span>
          </button>

          <button
            onClick={onConfirm}
            disabled={(paymentType === "Cash" && cashGiven < grandTotal) || cart.length === 0}
            className={`flex-[1.5] px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm text-white transition-all duration-300 shadow-xl flex items-center justify-center gap-4 active:scale-[0.98] relative overflow-hidden group ${
              (paymentType === "Cash" && cashGiven < grandTotal) || cart.length === 0
                ? "bg-slate-200 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 transform hover:-translate-y-1"
            }`}
          >
            <span className="relative z-10">Complete Transaction</span>
            <FaArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </footer>
        </div>
      </div>
    </>
  );
}
