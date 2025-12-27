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
        const invoiceId = `INV-${order._id.slice(-6).toUpperCase()}`;
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
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Order Management
          </h1>
          <p className="text-slate-600">View and manage all sales orders</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {filteredOrders.length}
          </div>
          <div className="text-sm text-slate-500">Total Orders</div>
        </div>
      </div>

      {/* Search Section */}
      <div className="modern-card">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Search Orders
        </label>
        <input
          type="text"
          placeholder="Search by Invoice ID, Date, Customer Name, or Phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="modern-input"
        />
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="modern-card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 text-lg">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="modern-card text-center py-12">
          <p className="text-slate-500 text-lg">No orders found</p>
          <p className="text-slate-400 text-sm mt-2">
            {search
              ? "Try adjusting your search criteria"
              : "Orders will appear here once sales are made"}
          </p>
        </div>
      ) : (
        <div className="modern-table">
          <table className="w-full">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const invoiceId = `INV-${order._id.slice(-6).toUpperCase()}`;
                return (
                  <tr key={order._id}>
                    <td>
                      <div className="font-semibold text-slate-900">{invoiceId}</div>
                    </td>
                    <td>
                      <div className="text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString("en-LK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString("en-LK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-700">
                        {order.customerName || <span className="text-slate-400">-</span>}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600">
                        {order.phoneNumber || <span className="text-slate-400">-</span>}
                      </span>
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getPaymentBadgeColor(order.paymentType)}`}>
                        {order.paymentType}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">
                        Rs. {order.total.toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                        title="View Details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4">
          <div className="modern-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Order Details
              </h2>
              <p className="text-slate-600">
                Invoice: INV-{selectedOrder._id.slice(-6).toUpperCase()}
              </p>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Date:</span>
                    <p className="font-semibold text-slate-900">
                      {new Date(selectedOrder.createdAt).toLocaleString("en-LK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Customer:</span>
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.customerName || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span>
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.phoneNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment:</span>
                    <p className="font-semibold text-slate-900 capitalize">
                      {selectedOrder.paymentType}
                    </p>
                  </div>
                  {selectedOrder.cashGiven && (
                    <div>
                      <span className="text-slate-500">Cash Given:</span>
                      <p className="font-semibold text-slate-900">
                        Rs. {selectedOrder.cashGiven.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {selectedOrder.balance !== undefined && (
                    <div>
                      <span className="text-slate-500">Balance:</span>
                      <p className={`font-semibold ${selectedOrder.balance < 0 ? "text-red-600" : "text-slate-900"}`}>
                        Rs. {selectedOrder.balance.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            Quantity: {item.quantity} × Rs. {item.price.toFixed(2)}
                          </div>
                          {item.free && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                              Free Item
                            </span>
                          )}
                          {item.discount && (
                            <div className="mt-2 text-xs text-amber-700">
                              Discount: {item.discount}
                              {item.discountType === "percentage" ? "%" : " Rs."}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-lg">
                            Rs. {calculateItemTotal(item).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-700">Total Amount:</span>
                  <span className="text-2xl font-bold" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Rs. {selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="modern-btn modern-btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}