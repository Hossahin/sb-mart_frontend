"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { customerApi, CustomerOrder, PaginationMeta } from "@/lib/customer-api";
import { formatBDT } from "@/lib/format";

function OrdersContent() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useCustomerAuth();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?returnUrl=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchOrders = useCallback(
    async (pageToLoad = 1) => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const res = await customerApi.getCustomerOrders({
          page: pageToLoad,
          limit: pagination.limit,
          status: statusFilter || undefined,
        });
        if (res.success && res.data) {
          setOrders(res.data.orders);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, statusFilter, pagination.limit]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    let isSubscribed = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await customerApi.getCustomerOrders({
          page: 1,
          limit: pagination.limit,
          status: statusFilter || undefined,
        });
        if (isSubscribed && res.success && res.data) {
          setOrders(res.data.orders);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated, statusFilter, pagination.limit]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Order History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and view receipts for all your past and current purchases
          </p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-4">
          <div className="text-5xl">📋</div>
          <h2 className="text-lg font-bold text-white">No Orders Found</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter
              ? `You don't have any orders with status "${statusFilter}".`
              : "You have not placed any orders yet."}
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            {orders.map((ord) => (
              <div
                key={ord._id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">
                      {ord.orderNumber}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Ordered on {new Date(ord.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">
                    Items: {ord.items.map((i) => `${i.productName} (${i.quantity})`).join(", ")}
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-black text-white">
                      {formatBDT(ord.grandTotal)}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold">
                      Cash on Delivery
                    </div>
                  </div>
                  <Link
                    href={`/orders/${ord._id}`}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
              >
                &larr; Previous
              </button>
              <span className="text-xs font-semibold text-slate-400 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading orders...</div>}>
        <OrdersContent />
      </Suspense>
    </StorefrontShell>
  );
}
