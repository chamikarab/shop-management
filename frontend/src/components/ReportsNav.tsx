"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaChartLine,
  FaBoxes,
  FaShoppingCart,
  FaReceipt,
  FaTrophy,
  FaChartBar,
  FaCalendarDay,
} from "react-icons/fa";

const tabs = [
  { href: "/admin/reports", label: "Overview", icon: FaChartBar, exact: true },
  { href: "/admin/reports/daily-sales-summary", label: "Daily Sales", icon: FaCalendarDay },
  { href: "/admin/reports/pnl", label: "P&L", icon: FaChartLine },
  { href: "/admin/reports/stock-balance", label: "Daily Stock", icon: FaBoxes },
  { href: "/admin/reports/purchasing", label: "Purchasing", icon: FaShoppingCart },
  { href: "/admin/reports/sales", label: "Sales", icon: FaReceipt },
  { href: "/admin/reports/top-products", label: "Top Products", icon: FaTrophy },
];

export default function ReportsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              active
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
            }`}
          >
            <Icon size={12} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
