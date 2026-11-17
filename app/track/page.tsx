"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { customerApi, CustomerOrder } from "@/lib/customer-api";
import { formatBDT } from "@/lib/format";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);

    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please provide both order number and phone number.");
      return;
    }

    try {
      setLoading(true);
      const res = await customerApi.trackOrder({
        orderNumber: orderNumber.trim(),
        phone: phone.trim(),
      });

      if (res.success && res.data?.order) {
        setOrder(res.data.order);
      } else {
        setError("No order found matching the provided order number and phone.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to locate order. Please check the details."
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: "PENDING", label: "Order Placed" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PROCESSING", label: "Processing" },
    { key: "SHIPPED", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PROCESSING":
        return 2;
      case "SHIPPED":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return -1;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : -1;

  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl mb-1">
            📦
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Track Your Order</h1>
          <p className="text-xs text-slate-400">
            Check live shipment progress without signing in. Enter your order number and the recipient phone number.
          </p>
        </div>

        {/* Tracking Search Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTrack} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Order Number *
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SBM-20261116-A1B2C3D4"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-100 font-mono placeholder-slate-600 focus:border-emerald-500 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Recipient Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01712345678"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-100 font-mono placeholder-slate-600 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Searching Tracking System..." : "Track Order"}
            </button>
          </form>
        </div>

        {/* Order Tracking Progress & Details */}
        {order && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Order Status Found
                </span>
                <h2 className="text-xl font-black font-mono text-white mt-0.5">
                  {order.orderNumber}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total COD Due</span>
                <span className="text-xl font-black text-white">
                  {formatBDT(order.grandTotal)}
                </span>
              </div>
            </div>

            {/* Tracking Progress Timeline */}
            {order.status === "CANCELLED" ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                <span className="text-xl">🚫</span>
                <div>
                  <strong className="block font-bold text-sm">Order Cancelled</strong>
                  This order was cancelled and inventory was returned to the catalog.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-0" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                    style={{
                      width: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%`,
                    }}
                  />

                  {steps.map((st, i) => {
                    const isDone = i <= currentStep;
                    const isCurrent = i === currentStep;

                    return (
                      <div key={st.key} className="flex flex-col items-center gap-2 relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 font-black"
                              : isDone
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 text-slate-500 border border-slate-700"
                          }`}
                        >
                          {isDone ? "✓" : i + 1}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                            isDone ? "text-slate-100" : "text-slate-600"
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800 text-xs">
              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Destination
                </h4>
                <div className="text-slate-300 space-y-1">
                  <div className="font-semibold text-white">{order.shippingAddress.recipientName}</div>
                  <div>{order.shippingAddress.addressLine}</div>
                  <div className="text-slate-400">
                    {order.shippingAddress.district}, {order.shippingAddress.division} Division
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Package Summary ({order.items.length} {order.items.length === 1 ? "item" : "items"})
                </h4>
                <ul className="space-y-1 text-slate-300">
                  {order.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">
                        {it.productName} × {it.quantity}
                      </span>
                      <span className="font-mono text-slate-400">{formatBDT(it.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link
                href="/products"
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                &larr; Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
