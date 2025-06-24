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
    const fetchWithRetry = async (url: string) => {
      let res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        // Try refresh token
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) throw new Error("Session refresh failed");

        res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Still unauthorized");
      }

      return res.json();
    };

    const extractArray = (data: any) => {
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    };

    const fetchDashboardData = async () => {
      try {
        await fetchWithRetry("/api/me");

        const [productsRes, usersRes, ordersRes] = await Promise.all([
          fetchWithRetry("http://localhost:3000/products"),
          fetchWithRetry("http://localhost:3000/users"),
          fetchWithRetry("http://localhost:3000/orders"),
        ]);

        const products = extractArray(productsRes);
        const users = extractArray(usersRes);
        const orders = extractArray(ordersRes);

        setSummary({
          totalProducts: products.length,
          totalUsers: users.length,
          totalOrders: orders.length,
        });
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4">Loading dashboard...</span>
      </div>
    );
  }

  const Card = ({
    title,
    count,
    color,
  }: {
    title: string;
    count: number;
    color: string;
  }) => (
    <div className="bg-white p-6 rounded-lg shadow text-center border">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className={`text-3xl font-bold ${color}`}>{count}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card title="Total Products" count={summary.totalProducts} color="text-blue-600" />
        <Card title="Total Users" count={summary.totalUsers} color="text-green-600" />
        <Card title="Total Orders" count={summary.totalOrders} color="text-purple-600" />
      </div>
    </div>
  );
}