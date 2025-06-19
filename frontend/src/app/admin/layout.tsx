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
        className={`bg-gray-900 text-white p-4 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white mb-6 focus:outline-none"
            title="Toggle Sidebar"
          >
            <FaBars size={20} />
          </button>

          <nav className="space-y-2">
            <Link
              href="/admin"
              className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
            >
              <FaBox className="inline-block mr-2" />
              {!collapsed && "Dashboard"}
            </Link>

            {user.permissions?.some((p) => p.startsWith("products:")) && (
              <div className="mt-4">
                <span className="text-gray-400 uppercase text-xs pl-2">
                  {!collapsed && "Products"}
                </span>
                <div className="ml-4 space-y-2 mt-2">
                  {user.permissions.includes("products:add") && (
                    <Link
                      href="/admin/products/add"
                      className={`sidebar-link ${
                        pathname === "/admin/products/add" ? "active" : ""
                      }`}
                    >
                      <FaUserPlus className="inline-block mr-2" />
                      {!collapsed && "Add Product"}
                    </Link>
                  )}
                  {user.permissions.includes("products:view") && (
                    <Link
                      href="/admin/products"
                      className={`sidebar-link ${
                        pathname === "/admin/products" ? "active" : ""
                      }`}
                    >
                      <FaListUl className="inline-block mr-2" />
                      {!collapsed && "All Products"}
                    </Link>
                  )}
                  {user.permissions.includes("products:purchasing") && (
                    <Link
                      href="/admin/products/purchasing"
                      className={`sidebar-link ${
                        pathname === "/admin/products/purchasing" ? "active" : ""
                      }`}
                    >
                      <FaShoppingCart className="inline-block mr-2" />
                      {!collapsed && "Purchasing"}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {user.permissions?.some((p) => p.startsWith("users:")) && (
              <div className="mt-4">
                <span className="text-gray-400 uppercase text-xs pl-2">
                  {!collapsed && "Users"}
                </span>
                <div className="ml-4 space-y-2 mt-2">
                  {user.permissions.includes("users:add") && (
                    <Link
                      href="/admin/users/add"
                      className={`sidebar-link ${
                        pathname === "/admin/users/add" ? "active" : ""
                      }`}
                    >
                      <FaUserPlus className="inline-block mr-2" />
                      {!collapsed && "Add User"}
                    </Link>
                  )}
                  {user.permissions.includes("users:view") && (
                    <Link
                      href="/admin/users"
                      className={`sidebar-link ${
                        pathname === "/admin/users" ? "active" : ""
                      }`}
                    >
                      <FaListUl className="inline-block mr-2" />
                      {!collapsed && "All Users"}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {user.permissions?.includes("orders:view") && (
              <Link
                href="/admin/orders"
                className={`sidebar-link ${
                  pathname === "/admin/orders" ? "active" : ""
                }`}
              >
                <FaClipboardList className="inline-block mr-2" />
                {!collapsed && "Orders"}
              </Link>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-8">
          <div className="border-t border-gray-700 pt-4 flex items-center gap-2 sidebar-link">
            <FaSignOutAlt />
            {!collapsed && (
              <button className="hover:text-yellow-400" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 text-black bg-white">
        {children}
      </main>
    </div>
  );
}