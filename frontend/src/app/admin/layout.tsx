"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  FaBox,
  FaClipboardList,
  FaBars,
  FaSignOutAlt,
  FaUserPlus,
  FaListUl,
  FaShoppingCart,
} from "react-icons/fa";
import "./styles/admin.css";

type User = {
  permissions: string[];
  // Add other properties like id, email if needed
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store", // 🔥 force fresh data
        });

        if (!res.ok) {
          console.warn("⚠️ /api/me returned error, trying refresh...");
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (!refreshRes.ok) {
            console.warn("🔁 Token refresh failed.");
            router.push("/login");
            return;
          }

          const retry = await fetch("/api/me", {
            credentials: "include",
            cache: "no-store", // 🔥 again force fresh
          });

          if (!retry.ok) {
            console.warn("❌ Retry failed after refresh.");
            router.push("/login");
            return;
          }

          const retryData = await retry.json();
          console.log("✅ Logged in (after refresh):", retryData.user);
          setUser(retryData.user);
        } else {
          const data = await res.json();
          console.log("✅ Logged in:", data.user);
          setUser(data.user);
        }
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    // Always run fresh fetch
    fetchUser();

    // Optional: also listen for storage event (cross-tab updates)
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "forcePermissionReload") {
        console.log("🔁 Detected permission change from another tab");
        fetchUser();
      }
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Loading Admin Panel...
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      console.log("🚪 User logged out, tokens cleared");
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="admin-layout flex min-h-screen text-black bg-white">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white p-6 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between mb-8">
            {!collapsed && (
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🍺 Beer Shop POS
                </h2>
                <p className="text-xs text-gray-400 mt-1">Management System</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-white hover:text-purple-300 focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-all"
              title="Toggle Sidebar"
            >
              <FaBars size={20} />
            </button>
          </div>

          <nav className="space-y-6">
            <div>
              <span className="text-gray-400 uppercase text-xs font-semibold tracking-wider pl-2 block mb-3">
                {!collapsed && "Dashboard"}
              </span>
              <div className="space-y-1">
                <Link
                  href="/admin"
                  className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
                >
                  <FaBox />
                  {!collapsed && <span>Overview</span>}
                </Link>
              </div>
            </div>

            {user.permissions?.some((p) => p.startsWith("products:")) && (
              <div>
                <span className="text-gray-400 uppercase text-xs font-semibold tracking-wider pl-2 block mb-3">
                  {!collapsed && "Products"}
                </span>
                <div className="space-y-1">
                  {user.permissions.includes("products:add") && (
                    <Link
                      href="/admin/products/add"
                      className={`sidebar-link ${
                        pathname === "/admin/products/add" ? "active" : ""
                      }`}
                    >
                      <FaUserPlus />
                      {!collapsed && <span>Add Product</span>}
                    </Link>
                  )}
                  {user.permissions.includes("products:view") && (
                    <Link
                      href="/admin/products"
                      className={`sidebar-link ${
                        pathname === "/admin/products" ? "active" : ""
                      }`}
                    >
                      <FaListUl />
                      {!collapsed && <span>All Products</span>}
                    </Link>
                  )}
                  {user.permissions.includes("products:purchasing") && (
                    <Link
                      href="/admin/products/purchasing"
                      className={`sidebar-link ${
                        pathname === "/admin/products/purchasing" ? "active" : ""
                      }`}
                    >
                      <FaShoppingCart />
                      {!collapsed && <span>Purchasing</span>}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {user.permissions?.some((p) => p.startsWith("users:")) && (
              <div>
                <span className="text-gray-400 uppercase text-xs font-semibold tracking-wider pl-2 block mb-3">
                  {!collapsed && "Users"}
                </span>
                <div className="space-y-1">
                  {user.permissions.includes("users:add") && (
                    <Link
                      href="/admin/users/add"
                      className={`sidebar-link ${
                        pathname === "/admin/users/add" ? "active" : ""
                      }`}
                    >
                      <FaUserPlus />
                      {!collapsed && <span>Add User</span>}
                    </Link>
                  )}
                  {user.permissions.includes("users:view") && (
                    <Link
                      href="/admin/users"
                      className={`sidebar-link ${
                        pathname === "/admin/users" ? "active" : ""
                      }`}
                    >
                      <FaListUl />
                      {!collapsed && <span>All Users</span>}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {user.permissions?.some((p) => p.startsWith("orders:")) && (
              <div>
                <span className="text-gray-400 uppercase text-xs font-semibold tracking-wider pl-2 block mb-3">
                  {!collapsed && "Orders"}
                </span>
                <div className="space-y-1">
                  {user.permissions.includes("orders:view") && (
                    <Link
                      href="/admin/orders"
                      className={`sidebar-link ${
                        pathname === "/admin/orders" ? "active" : ""
                      }`}
                    >
                      <FaClipboardList />
                      {!collapsed && <span>All Orders</span>}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-auto pt-6 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <FaSignOutAlt />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 text-black bg-white">
        {children}
      </main>
    </div>
  );
}