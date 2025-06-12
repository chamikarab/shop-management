// src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    // Replace with real API endpoints
    const fetchData = async () => {
      const [productsRes, usersRes, ordersRes] = await Promise.all([
        fetch("http://localhost:3000/products").then((r) => r.json()),
        fetch("http://localhost:3000/users").then((r) => r.json()),
        fetch("http://localhost:3000/orders").then((r) => r.json()),
      ]);

      setSummary({
        totalProducts: productsRes.length,
        totalUsers: usersRes.length,
        totalOrders: ordersRes.length,
      });
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <h2 className="text-xl font-semibold mb-2">Total Products</h2>
          <p className="text-3xl font-bold text-blue-600">{summary.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <h2 className="text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold text-green-600">{summary.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
          <p className="text-3xl font-bold text-purple-600">{summary.totalOrders}</p>
        </div>
      </div>
    </div>
  );
}