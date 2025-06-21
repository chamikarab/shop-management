"use client";

import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/orders", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4">All Orders</h1>
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="border px-4 py-2 text-left">Invoice ID</th>
                <th className="border px-4 py-2 text-left">Date</th>
                <th className="border px-4 py-2 text-left">Customer</th>
                <th className="border px-4 py-2 text-left">Phone</th>
                <th className="border px-4 py-2 text-left">Payment</th>
                <th className="border px-4 py-2 text-right">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="border px-4 py-2">INV-{order._id.slice(-6).toUpperCase()}</td>
                  <td className="border px-4 py-2">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                    {order.customerName || "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {order.phoneNumber || "-"}
                  </td>
                  <td className="border px-4 py-2">{order.paymentType}</td>
                  <td className="border px-4 py-2 text-right">{order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}