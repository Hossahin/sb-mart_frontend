"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, DashboardStats } from "@/lib/admin-api";
import { formatBDT, formatDateTime } from "@/lib/format";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/status-badge";
import {
  OrdersIcon,
  ProductsIcon,
  CustomersIcon,
  InventoryIcon,
  CategoriesIcon,
  RefreshIcon,
  AlertTriangleIcon,
} from "@/components/admin/icons";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError(null);
    }
    try {
      const res = await adminApi.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
        setError(null);
      } else {
        throw new Error(res.message || "Failed to load dashboard metrics");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error connecting to admin analytics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const loadStats = async () => {
      try {
        const res = await adminApi.getDashboardStats();
        if (isSubscribed) {
          if (res.success && res.data) {
            setStats(res.data);
            setError(null);
          } else {
            setError(res.message || "Failed to load dashboard metrics");
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Error connecting to admin analytics"
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isSubscribed = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-md w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-900 border border-slate-800 rounded-xl"></div>
          <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 bg-slate-900 border border-red-500/20 rounded-2xl text-center max-w-lg mx-auto mt-12">
        <AlertTriangleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Metrics Load Error</h3>
        <p className="text-sm text-slate-400 mb-6">{error || "Unable to retrieve dashboard stats"}</p>
        <button
          onClick={() => fetchStats(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Operational Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics and inventory status from MongoDB authoritative pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Revenue</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs">
              BDT
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white tracking-tight truncate">
              {formatBDT(stats.totalRevenue)}
            </div>
            <p className="text-[11px] text-emerald-400 mt-0.5">Authoritative Orders</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Orders</span>
            <OrdersIcon className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white tracking-tight">
              {stats.totalOrders.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Lifetime checkouts</p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Customers</span>
            <CustomersIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white tracking-tight">
              {stats.totalCustomers.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered accounts</p>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Catalog</span>
            <ProductsIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white tracking-tight">
              {stats.activeProducts}{" "}
              <span className="text-xs text-slate-500 font-normal">/ {stats.totalProducts}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active / Total products</p>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Categories</span>
            <CategoriesIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white tracking-tight">
              {stats.activeCategories}{" "}
              <span className="text-xs text-slate-500 font-normal">/ {stats.totalCategories}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active / Total categories</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <Link
          href="/admin/inventory"
          className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-colors ${
            stats.lowStockCount > 0
              ? "border-amber-500/40 hover:border-amber-500 bg-amber-500/5"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Low Stock</span>
            <InventoryIcon
              className={`w-4 h-4 ${
                stats.lowStockCount > 0 ? "text-amber-400" : "text-slate-500"
              }`}
            />
          </div>
          <div className="mt-3">
            <div
              className={`text-xl font-bold tracking-tight ${
                stats.lowStockCount > 0 ? "text-amber-400" : "text-white"
              }`}
            >
              {stats.lowStockCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">&le; 5 units remaining &rarr;</p>
          </div>
        </Link>
      </div>

      {/* Status Breakdown & Lifecycle Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Order Pipeline Lifecycle Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: "PENDING", label: "Pending", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
            { key: "CONFIRMED", label: "Confirmed", bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-400" },
            { key: "PROCESSING", label: "Processing", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
            { key: "SHIPPED", label: "Shipped", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
            { key: "DELIVERED", label: "Delivered", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
            { key: "CANCELLED", label: "Cancelled", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
          ].map((item) => {
            const match = stats.statusBreakdown?.find((s) => s._id === item.key);
            const count = match ? match.count : 0;
            return (
              <div
                key={item.key}
                className={`p-3.5 rounded-lg border ${item.bg} ${item.border} flex flex-col`}
              >
                <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                <span className={`text-xl font-bold mt-1 ${item.text}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Orders</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest transactions placed across the platform
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View All Orders &rarr;
          </Link>
        </div>

        {stats.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Order Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Placed At</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Order Status</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recentOrders.map((order) => {
                  const customerName =
                    typeof order.userId === "object" && order.userId !== null
                      ? order.userId.name
                      : order.shippingAddress?.fullName || "Guest Customer";
                  const customerEmail =
                    typeof order.userId === "object" && order.userId !== null
                      ? order.userId.email
                      : "";

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono font-medium text-emerald-400">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-200">{customerName}</div>
                        {customerEmail && (
                          <div className="text-xs text-slate-400">{customerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-white whitespace-nowrap">
                        {formatBDT(order.totalAmount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>
                      <td className="px-6 py-3.5">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/admin/orders?orderNumber=${encodeURIComponent(
                            order.orderNumber
                          )}`}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            No orders have been recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
