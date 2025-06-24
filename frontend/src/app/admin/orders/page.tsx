"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/orders", { credentials: "include" })
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
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();

    setFilteredOrders(
      orders.filter((order) => {
        const invoiceId = `INV-${order._id.slice(-6).toUpperCase()}`;
        const formattedDate = new Date(order.createdAt).toLocaleDateString("en-CA"); // YYYY-MM-DD
        const readableDate = new Date(order.createdAt).toLocaleDateString("en-LK", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          invoiceId.toLowerCase().includes(lowerSearch) ||
          formattedDate.includes(lowerSearch) ||
          readableDate.toLowerCase().includes(lowerSearch)
        );
      })
    );
  }, [search, orders]);

  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4">All Orders</h1>

      <input
        type="text"
        placeholder="Search by Invoice ID or Date (e.g., 2025-06-24)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 border border-gray-300 rounded w-full sm:w-1/2"
      />

      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-5 w-5 border-t-2 border-blue-600 rounded-full"></div>
          <span>Loading orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Invoice ID</th>
                <th className="border px-4 py-2 text-left">Date</th>
                <th className="border px-4 py-2 text-left">Customer</th>
                <th className="border px-4 py-2 text-left">Phone</th>
                <th className="border px-4 py-2 text-left">Payment</th>
                <th className="border px-4 py-2 text-right">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, i) => (
                <tr key={order._id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                  <td className="border px-4 py-2">
                    INV-{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(order.createdAt).toLocaleString("en-LK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="border px-4 py-2">{order.customerName || "-"}</td>
                  <td className="border px-4 py-2">{order.phoneNumber || "-"}</td>
                  <td className="border px-4 py-2">{order.paymentType}</td>
                  <td className="border px-4 py-2 text-right">
                    {order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}