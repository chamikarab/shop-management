"use client";

import React from "react";

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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4">
      <div className="modern-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          Checkout
          </h2>
          <p className="text-slate-600">Complete the order details below</p>
        </div>

        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Customer Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Customer Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  className="modern-input"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Payment Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  className="modern-input"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              {paymentType === "Cash" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Cash Given <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="modern-input"
                    placeholder="Enter cash amount"
                    value={cashGiven || ""}
                    onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                  />
                </div>
              )}
              {paymentType === "Cash" && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Balance:</span>
                    <span className={`text-lg font-bold ${balance < 0 ? "text-red-600" : "text-green-600"}`}>
                      Rs. {balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Order Summary</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{item.quantity}x {item.name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {item.size} ({item.packaging}) - Rs. {item.price.toFixed(2)} each
                      </div>
                      {item.free && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          Free Item
                        </span>
                      )}
                      {item.discount && (
                        <div className="mt-1 text-xs text-amber-700">
                          Discount: {item.discount}
                          {item.discountType === "percentage" ? "%" : " Rs."}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        Rs. {calculateItemTotal(item).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-700">Grand Total:</span>
                <span className="text-2xl font-bold" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Rs. {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Print Invoice
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                cashGiven >= 0 && paymentType === "Cash"
                  ? "modern-btn modern-btn-primary"
                  : paymentType !== "Cash"
                  ? "modern-btn modern-btn-primary"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
              disabled={paymentType === "Cash" && cashGiven < 0}
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}