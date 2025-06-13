"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type SummaryData = {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<SummaryData>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let res = await fetch("/api/me", { credentials: "include" });

        if (!res.ok) {
          // Attempt to refresh if access token is expired
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (!refreshRes.ok) throw new Error("Refresh failed");

          res = await fetch("/api/me", { credentials: "include" });
          if (!res.ok) throw new Error("Still unauthorized");
        }

        // Fetch data in parallel
        const [productsRes, usersRes, ordersRes] = await Promise.all([
          fetch("http://localhost:3000/products", {
            credentials: "include",
          }).then((r) => r.json()),
          fetch("http://localhost:3000/users", {
            credentials: "include",
          }).then((r) => r.json()),
          fetch("http://localhost:3000/orders", {
            credentials: "include",
          }).then((r) => r.json()),
        ]);

        setSummary({
          totalProducts: productsRes.length || 0,
          totalUsers: usersRes.length || 0,
          totalOrders: ordersRes.length || 0,
        });
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <h2 className="text-xl font-semibold mb-2">Total Products</h2>
          <p className="text-3xl font-bold text-blue-600">
            {summary.totalProducts}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <h2 className="text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold text-green-600">
            {summary.totalUsers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
          <p className="text-3xl font-bold text-purple-600">
            {summary.totalOrders}
          </p>
        </div>
      </div>
    </div>
  );
}