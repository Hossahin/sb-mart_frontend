"use client";

import React from "react";

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        isActive
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-slate-800 text-slate-400 border-slate-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
          isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  let color = "bg-slate-800 text-slate-300 border-slate-700";

  switch (s) {
    case "PENDING":
      color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      break;
    case "CONFIRMED":
      color = "bg-sky-500/10 text-sky-400 border-sky-500/20";
      break;
    case "PROCESSING":
      color = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      break;
    case "SHIPPED":
      color = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      break;
    case "DELIVERED":
      color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      break;
    case "CANCELLED":
      color = "bg-red-500/10 text-red-400 border-red-500/20";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      {s}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  let color = "bg-slate-800 text-slate-400 border-slate-700";

  switch (s) {
    case "PAID":
      color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      break;
    case "UNPAID":
      color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      break;
    case "REFUNDED":
      color = "bg-purple-500/10 text-purple-400 border-purple-500/20";
      break;
    case "FAILED":
      color = "bg-red-500/10 text-red-400 border-red-500/20";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${color}`}
    >
      {s}
    </span>
  );
}

export function PaymentMethodBadge({ method }: { method?: string }) {
  const m = (method || "").toUpperCase();
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
      {m || "COD"}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const num = Number(stock) || 0;
  if (num <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
        Out of Stock (0)
      </span>
    );
  }
  if (num <= 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        Low Stock ({num})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      In Stock ({num})
    </span>
  );
}

export function StatusBadge({
  status,
  type = "order",
}: {
  status: boolean | string | number;
  type?: "order" | "payment" | "active" | "stock";
}) {
  if (type === "active" || typeof status === "boolean") {
    return <ActiveBadge isActive={Boolean(status)} />;
  }
  if (type === "payment") {
    return <PaymentStatusBadge status={String(status)} />;
  }
  if (type === "stock") {
    return <StockBadge stock={Number(status)} />;
  }
  return <OrderStatusBadge status={String(status)} />;
}

export default StatusBadge;
