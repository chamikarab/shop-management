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

    const extractArray = (data: unknown) => {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) return data.data;
      return [];
    };

    const fetchDashboardData = async () => {
      try {
        await fetchWithRetry("/api/me");

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const [productsRes, usersRes, ordersRes] = await Promise.all([
          fetchWithRetry(`${apiUrl}/products`),
          fetchWithRetry(`${apiUrl}/users`),
          fetchWithRetry(`${apiUrl}/orders`),
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon,
    gradient,
    delay,
  }: {
    title: string;
    value: number;
    icon: string;
    gradient: string;
    delay: number;
  }) => (
    <div
      className="modern-card group cursor-pointer"
      style={{
        animation: `slideUp 0.6s ease-out ${delay}s both`,
        background: `linear-gradient(135deg, ${gradient})`,
        color: 'white',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl opacity-80">{icon}</div>
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <h3 className="text-sm font-medium opacity-90 mb-2 uppercase tracking-wider">{title}</h3>
      <p className="text-4xl font-bold">{value.toLocaleString()}</p>
      <div className="mt-4 pt-4 border-t border-white/20">
        <span className="text-sm opacity-75">View details →</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Dashboard Overview
        </h1>
        <p className="text-slate-600 text-lg">Welcome back! Here&apos;s what&apos;s happening with your beer shop today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Products"
          value={summary.totalProducts}
          icon="🍺"
          gradient="#667eea 0%, #764ba2 100%"
          delay={0.1}
        />
        <StatCard
          title="Total Users"
          value={summary.totalUsers}
          icon="👥"
          gradient="#f093fb 0%, #f5576c 100%"
          delay={0.2}
        />
        <StatCard
          title="Total Orders"
          value={summary.totalOrders}
          icon="📦"
          gradient="#4facfe 0%, #00f2fe 100%"
          delay={0.3}
        />
      </div>

      <div className="modern-card">
        <h2 className="text-2xl font-bold mb-4" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/products/add"
            className="modern-btn modern-btn-primary text-center block"
          >
            ➕ Add New Product
          </a>
          <a
            href="/admin/billing"
            className="modern-btn modern-btn-secondary text-center block"
          >
            🛒 New Sale
          </a>
          <a
            href="/admin/orders"
            className="modern-btn modern-btn-primary text-center block"
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
            }}
          >
            📋 View Orders
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}