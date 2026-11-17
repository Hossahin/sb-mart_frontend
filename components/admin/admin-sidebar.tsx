"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  OrdersIcon,
  ProductsIcon,
  CategoriesIcon,
  CustomersIcon,
  InventoryIcon,
  AuditLogIcon,
  LogoutIcon,
  CloseIcon,
} from "./icons";
import { useAdminAuth } from "@/lib/auth-context";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { name: "Overview", href: "/admin", icon: DashboardIcon, exact: true },
  { name: "Orders", href: "/admin/orders", icon: OrdersIcon },
  { name: "Products", href: "/admin/products", icon: ProductsIcon },
  { name: "Categories", href: "/admin/categories", icon: CategoriesIcon },
  { name: "Customers", href: "/admin/customers", icon: CustomersIcon },
  { name: "Inventory", href: "/admin/inventory", icon: InventoryIcon },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: AuditLogIcon },
];

export function AdminSidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight"
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20">
              SB
            </span>
            <div className="flex flex-col">
              <span className="leading-tight">SB-Mart</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Admin Center
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.name}</span>
                {item.name === "Inventory" && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Live
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || "Administrator"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              type="button"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
