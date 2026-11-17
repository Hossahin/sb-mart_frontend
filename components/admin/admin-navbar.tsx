"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/auth-context";
import { LogoutIcon } from "./icons";

interface AdminNavbarProps {
  onOpenMobile: () => void;
}

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/orders": "Order Management",
  "/admin/products": "Product Catalog",
  "/admin/categories": "Category Hierarchy",
  "/admin/customers": "Customer Accounts",
  "/admin/inventory": "Inventory & Stock Levels",
  "/admin/audit-logs": "Security & Audit Logs",
};

export function AdminNavbar({ onOpenMobile }: AdminNavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const currentTitle = breadcrumbMap[pathname] || "Administration";

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Open sidebar navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin" className="text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline">
            Admin
          </Link>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="font-semibold text-slate-100">{currentTitle}</span>
        </div>
      </div>

      {/* Right: Actions & Admin Profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/60"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>View Storefront</span>
        </Link>

        {/* Live Admin Role Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 leading-tight">
              {user?.name || "Admin"}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">
              SUPER_ADMIN
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-1"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
