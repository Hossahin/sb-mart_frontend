"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { customerApi, CustomerOrder } from "@/lib/customer-api";
import { formatBDT } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

function OrderDetailContent({ params }: PageProps) {
  const { id } = use(params);

  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "true";

  const { isAuthenticated, loading: authLoading } = useCustomerAuth();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await customerApi.getCustomerOrderById(id);
        if (res.success && res.data?.order) {
          setOrder(res.data.order);
        } else {
          setError("Order not found or unauthorized access.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && isAuthenticated) {
      loadOrder();
    }
  }, [id, authLoading, isAuthenticated]);

  const handleCancelOrder = async () => {
    if (!order || order.status !== "PENDING") return;
    try {
      setCancelling(true);
      const res = await customerApi.cancelCustomerOrder(order._id);
      if (res.success && res.data?.order) {
        setOrder(res.data.order);
        setCancelMessage("Your order has been cancelled and reserved inventory was restored.");
        setIsCancelModalOpen(false);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Pending</span>;
      case "CONFIRMED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">Confirmed</span>;
      case "PROCESSING":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">Processing</span>;
      case "SHIPPED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Shipped</span>;
      case "DELIVERED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Delivered</span>;
      case "CANCELLED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  if (loading) {
    return (
      <StorefrontShell>
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading order details...</p>
        </div>
      </StorefrontShell>
    );
  }

  if (error || !order) {
    return (
      <StorefrontShell>
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Order Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || "Unable to locate this order. It may belong to another account or does not exist."}
          </p>
          <Link
            href="/orders"
            className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        {/* Success Alert if just placed */}
        {justPlaced && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
              ✓
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Thank you! Your order has been placed successfully.
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                We have received your Cash on Delivery request. Our central warehouse team is preparing your package for dispatch.
              </p>
            </div>
          </div>
        )}

        {cancelMessage && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span>ℹ️</span>
            <span>{cancelMessage}</span>
          </div>
        )}

        {/* Order Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black font-mono text-white">
                {order.orderNumber}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {/* Cancel Order Action if PENDING */}
          {order.status === "PENDING" && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>📍</span> Delivery Information
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="font-bold text-white text-sm">
                {order.shippingAddress.recipientName}
              </div>
              <div className="font-mono text-emerald-400">
                {order.shippingAddress.phone}
              </div>
              <div>{order.shippingAddress.addressLine}</div>
              <div className="text-slate-400">
                {order.shippingAddress.district}, {order.shippingAddress.division} Division
              </div>
              {order.customerNote && (
                <div className="pt-2 text-slate-400 italic">
                  Note: &quot;{order.customerNote}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>💵</span> Payment Details
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Method</span>
                <span className="font-bold text-white">Cash on Delivery (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status</span>
                <span className={`font-bold ${order.paymentStatus === "PAID" ? "text-emerald-400" : "text-amber-400"}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 mt-2">
                {order.paymentStatus === "PAID"
                  ? "This order has been paid upon delivery."
                  : "Please keep exact cash ready upon delivery to the courier."}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Order Items ({order.items.length})
          </h2>

          <div className="divide-y divide-slate-800/80">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {item.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-base">📦</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate max-w-sm">
                      {item.productName}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {formatBDT(item.unitPrice)} × {item.quantity}
                    </div>
                  </div>
                </div>

                <div className="font-bold text-white text-sm shrink-0">
                  {formatBDT(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Financial Calculation */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-white">{formatBDT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping Fee</span>
              <span className="font-semibold text-white">
                {order.shippingFee === 0 ? "FREE" : formatBDT(order.shippingFee)}
              </span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline text-sm font-bold text-white">
              <span>Grand Total</span>
              <span className="text-xl font-black text-emerald-400">
                {formatBDT(order.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="flex justify-between items-center pt-4">
          <Link
            href="/orders"
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            &larr; Back to Order History
          </Link>
          <Link
            href="/products"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Cancel Order?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? The reserved inventory will be immediately released and returned to the catalog for other customers.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </StorefrontShell>
  );
}

export default function OrderDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <StorefrontShell>
          <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
            <p>Loading order details...</p>
          </div>
        </StorefrontShell>
      }
    >
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
