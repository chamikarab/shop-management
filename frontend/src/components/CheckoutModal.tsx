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
  return (
    <div className="custom-modal">
      <div className="modal-content">
        <h2 className="text-xl font-bold mb-4">Checkout</h2>

        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Customer Name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Phone Number (optional)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <select
          className="border p-2 rounded w-full mb-2"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option>Cash</option>
          <option>Card</option>
          <option>Online</option>
        </select>

        <input
          type="text"
          inputMode="decimal"
          className="border p-2 rounded w-full mb-2"
          placeholder="Cash Given"
          value={cashGiven}
          onChange={(e) => setCashGiven(Number(e.target.value))}
        />

        <p className="mb-4">
          Balance:{" "}
          <span className={balance < 0 ? "text-red-600 font-bold" : ""}>
            Rs. {balance.toFixed(2)}
          </span>
        </p>

        <div className="mb-4 max-h-40 overflow-y-auto text-sm bg-gray-50 p-2 rounded border">
          <h3 className="font-semibold mb-2">Products:</h3>
          <ul>
            {cart.map((item) => (
              <li key={item.id} className="mb-1">
                {item.quantity}x {item.name} - {item.size} ({item.packaging}) - Rs.{" "}
                {item.price.toFixed(2)}
                {item.free && (
                  <span className="ml-2 text-green-600 font-medium">(Free)</span>
                )}
                {item.discount ? (
                  <span className="ml-2 text-yellow-600 text-xs">
                    - {item.discount}
                    {item.discountType === "percentage" ? "%" : " Rs."} discount
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${
              cashGiven >= 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
            }`}
            disabled={cashGiven < 0}
          >
            Confirm Order
          </button>
          <button onClick={() => window.print()}>🖨 Print Invoice</button>
        </div>
      </div>
    </div>
  );
}