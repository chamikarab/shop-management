"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import BeerLoader from "@/components/BeerLoader";
import {
  FaBox,
  FaClipboardList,
  FaBars,
  FaSignOutAlt,
  FaUserPlus,
  FaListUl,
  FaShoppingCart,
  FaCashRegister,
  FaHome,
  FaChartPie,
  FaCog,
  FaUsers,
  FaBeer,
  FaPlus,
  FaDollarSign,
} from "react-icons/fa";
import "./styles/admin.css";

type User = {
  name?: string;
  role?: string;
  permissions: string[];
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        // Ensure loader stays for at least 1.5 seconds
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
          setTimeout(() => setLoading(false), 1500 - elapsed);
        } else {
        setLoading(false);
        }
      }
    };

    const startTime = Date.now();
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
    <div className={`admin-layout flex h-screen overflow-hidden ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "mobile-sidebar-open" : ""}`}>
      {/* Global Admin Loader Overlay */}
      {loading && <BeerLoader />}
      
      {!user ? (
        !loading && (
          <div className="fixed inset-0 z-[10000] bg-slate-950 flex items-center justify-center">
            <div className="text-white font-black uppercase tracking-widest animate-pulse">
              Security Verification...
            </div>
          </div>
        )
      ) : (
        <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-6 left-6 z-[100] p-3 bg-slate-900 text-white rounded-xl lg:hidden shadow-xl border border-slate-800"
      >
        <FaBars size={20} />
      </button>

      {/* Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`text-white flex flex-col justify-between transition-all duration-500 ease-in-out z-50 h-screen sticky top-0 ${
          collapsed ? "w-24" : "w-80"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Area */}
          <div className="sidebar-brand">
            <div className="flex items-center gap-4">
              <div className="sidebar-brand-icon">
                <FaBeer />
              </div>
              {!collapsed && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden">
                  <h2 className="text-xl font-black tracking-tighter text-white whitespace-nowrap">
                    SISILA<span className="text-indigo-400"> BEER SHOP</span>
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
                    V2.6 Management
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-4 top-24 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center border-4 border-white hover:bg-indigo-500 hover:scale-110 transition-all shadow-xl z-[100] cursor-pointer"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <div className={`transition-transform duration-500 ${collapsed ? "rotate-180" : ""}`}>
                <FaBars size={10} />
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            {/* Sales Section */}
            <div className="sidebar-nav-section">
              <span className="sidebar-nav-label">Core Operations</span>
              <Link
                href="/admin/billing"
                className={`sidebar-link ${pathname === "/admin/billing" ? "active" : ""}`}
              >
                <FaCashRegister />
                <span>Point of Sale</span>
              </Link>
              <Link
                href="/admin"
                className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
              >
                <FaChartPie />
                <span>Overview</span>
              </Link>
            </div>

            {/* Inventory Section */}
            {user.permissions?.some((p) => p.startsWith("products:")) && (
              <div className="sidebar-nav-section">
                <span className="sidebar-nav-label">Inventory Mesh</span>
                {user.permissions.includes("products:view") && (
                  <Link
                    href="/admin/products"
                    className={`sidebar-link ${pathname === "/admin/products" ? "active" : ""}`}
                  >
                    <FaBox />
                    <span>All Products</span>
                  </Link>
                )}
                {user.permissions.includes("products:add") && (
                  <Link
                    href="/admin/products/add"
                    className={`sidebar-link ${pathname === "/admin/products/add" ? "active" : ""}`}
                  >
                    <FaPlus />
                    <span>Add Product</span>
                  </Link>
                )}
                {user.permissions.includes("products:purchasing") && (
                  <Link
                    href="/admin/products/purchasing"
                    className={`sidebar-link ${pathname === "/admin/products/purchasing" ? "active" : ""}`}
                  >
                    <FaShoppingCart />
                    <span>Purchase Products</span>
                  </Link>
                )}
                {user.permissions.includes("products:purchasing") && (
                  <Link
                    href="/admin/products/pricing"
                    className={`sidebar-link ${pathname === "/admin/products/pricing" ? "active" : ""}`}
                  >
                    <FaDollarSign />
                    <span>Purchase Pricing</span>
                  </Link>
                )}
              </div>
            )}

            {/* Orders Section */}
            {user.permissions?.some((p) => p.startsWith("orders:")) && (
              <div className="sidebar-nav-section">
                <span className="sidebar-nav-label">Transaction Feed</span>
                <Link
                  href="/admin/orders"
                  className={`sidebar-link ${pathname === "/admin/orders" ? "active" : ""}`}
                >
                  <FaClipboardList />
                  <span>All Orders</span>
                </Link>
              </div>
            )}

            {/* Users Section */}
            {user.permissions?.some((p) => p.startsWith("users:")) && (
              <div className="sidebar-nav-section">
                <span className="sidebar-nav-label">Access Control</span>
                {user.permissions.includes("users:view") && (
                  <Link
                    href="/admin/users"
                    className={`sidebar-link ${pathname === "/admin/users" ? "active" : ""}`}
                  >
                    <FaUsers />
                    <span>All Users</span>
                  </Link>
                )}
                {user.permissions.includes("users:add") && (
                  <Link
                    href="/admin/users/add"
                    className={`sidebar-link ${pathname === "/admin/users/add" ? "active" : ""}`}
                  >
                    <FaUserPlus />
                    <span>Add Users</span>
                  </Link>
                )}
              </div>
            )}
          </nav>

          {/* Footer Area */}
          <div className="sidebar-footer">
            {!collapsed && (
              <div className="user-profile-mini mb-4 animate-in fade-in zoom-in duration-500 overflow-hidden">
                <div className="user-avatar flex-shrink-0">
                  {user.name?.[0] || "A"}
                </div>
                <div className="user-info overflow-hidden">
                  <p className="text-xs font-black text-white truncate w-32 whitespace-nowrap">
                    {user.name || "Administrator"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {user.role || "Super Admin"}
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
        </>
      )}
    </div>
  );
}