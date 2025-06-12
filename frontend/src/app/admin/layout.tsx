"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  FaBox,
  FaUserFriends,
  FaClipboardList,
  FaBars,
  FaSignOutAlt,
  FaUserPlus,
  FaListUl,
  FaShoppingCart,
} from "react-icons/fa";
import "./styles/admin.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout flex min-h-screen text-black bg-white">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white p-4 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          {/* Toggle Button */}
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
              className={`sidebar-link ${
                pathname === "/admin" ? "active" : ""
              }`}
            >
              <FaBox className="inline-block mr-2" />
              {!collapsed && "Dashboard"}
            </Link>

            {/* Products Section */}
            <div className="mt-4">
              <span className="text-gray-400 uppercase text-xs pl-2">
                {!collapsed && "Products"}
              </span>
              <div className="ml-4 space-y-2 mt-2">
                <Link
                  href="/admin/products/add"
                  className={`sidebar-link ${
                    pathname === "/admin/products/add" ? "active" : ""
                  }`}
                >
                  <FaUserPlus className="inline-block mr-2" />
                  {!collapsed && "Add Product"}
                </Link>
                <Link
                  href="/admin/products"
                  className={`sidebar-link ${
                    pathname === "/admin/products" ? "active" : ""
                  }`}
                >
                  <FaListUl className="inline-block mr-2" />
                  {!collapsed && "All Products"}
                </Link>
                <Link
                  href="/admin/products/purchasing"
                  className={`sidebar-link ${
                    pathname === "/admin/products/purchasing" ? "active" : ""
                  }`}
                >
                  <FaShoppingCart className="inline-block mr-2" />
                  {!collapsed && "Purchasing"}
                </Link>
              </div>
            </div>

            {/* Users Section */}
            <div className="mt-4">
              <span className="text-gray-400 uppercase text-xs pl-2">
                {!collapsed && "Users"}
              </span>
              <div className="ml-4 space-y-2 mt-2">
                <Link
                  href="/admin/users/add"
                  className={`sidebar-link ${
                    pathname === "/admin/users/add" ? "active" : ""
                  }`}
                >
                  <FaUserPlus className="inline-block mr-2" />
                  {!collapsed && "Add User"}
                </Link>
                <Link
                  href="/admin/users"
                  className={`sidebar-link ${
                    pathname === "/admin/users" ? "active" : ""
                  }`}
                >
                  <FaListUl className="inline-block mr-2" />
                  {!collapsed && "All Users"}
                </Link>
              </div>
            </div>

            <Link
              href="/admin/orders"
              className={`sidebar-link ${
                pathname === "/admin/orders" ? "active" : ""
              }`}
            >
              <FaClipboardList className="inline-block mr-2" />
              {!collapsed && "Orders"}
            </Link>
          </nav>
        </div>

        {/* Footer/Profile Section */}
        <div className="mt-8">
          <div className="border-t border-gray-700 pt-4 flex items-center gap-2 sidebar-link">
            <FaSignOutAlt />
            {!collapsed && (
              <button className="hover:text-yellow-400">Logout</button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 text-black bg-white">
        {children}
      </main>
    </div>
  );
}