"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { customerApi, CustomerOrder } from "@/lib/customer-api";
import { formatBDT } from "@/lib/format";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useCustomerAuth();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?returnUrl=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadRecentOrders() {
      if (!isAuthenticated) return;
      try {
        const res = await customerApi.getCustomerOrders({ limit: 5 });
        if (res.success && res.data) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error("Failed to load recent orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadRecentOrders();
  }, [isAuthenticated]);

  if (authLoading || !user) {
    return (
      <StorefrontShell>
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading customer profile...</p>
        </div>
      </StorefrontShell>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Pending</span>;
      case "CONFIRMED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">Confirmed</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">Processing</span>;
      case "SHIPPED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Shipped</span>;
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Delivered</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              <div className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 font-bold">
                Role: {user.role.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              All Orders
            </Link>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Orders</h2>
            <Link href="/orders" className="text-xs font-semibold text-emerald-400 hover:underline">
              View All Orders &rarr;
            </Link>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
              <div className="text-3xl">📦</div>
              <h3 className="font-bold text-white text-sm">No orders yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You haven&apos;t placed any orders yet. Check out our fresh grocery items!
              </p>
              <Link
                href="/products"
                className="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80 overflow-hidden">
              {orders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-white">
                        {ord.orderNumber}
                      </span>
                      {getStatusBadge(ord.status)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Placed on {new Date(ord.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} • {ord.items.length} {ord.items.length === 1 ? "item" : "items"}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-base font-black text-white">
                      {formatBDT(ord.grandTotal)}
                    </span>
                    <Link
                      href={`/orders/${ord._id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StorefrontShell>
  );
}
