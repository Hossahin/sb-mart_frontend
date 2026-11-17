"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import {
  adminApi,
  AdminOrder,
  PaginationMeta,
} from "@/lib/admin-api";
import { formatBDT, formatDateTime } from "@/lib/format";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  PaymentMethodBadge,
} from "@/components/admin/status-badge";
import {
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  AlertTriangleIcon,
  CheckIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/admin/icons";

// Allowed transitions mapping per Phase 07.3.5 / 08.1 state machine
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

interface OrdersPageProps {
  searchParams?: Promise<{ orderNumber?: string }>;
}

export default function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  // Unwrap searchParams if available
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const initialSearch = resolvedSearchParams?.orderNumber || "";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Status Transition Modal
  const [orderToTransition, setOrderToTransition] = useState<AdminOrder | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [cancelReason, setCancelReason] = useState<string>("");
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: pageToLoad,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (statusFilter) params.status = statusFilter;
        if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
        if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;

        const res = await adminApi.getOrders(params);
        if (res.success && res.data) {
          setOrders(res.data.data);
          setPagination(res.data.pagination);
        } else {
          throw new Error(res.message || "Failed to load orders");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error retrieving order list"
        );
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, paymentStatusFilter, paymentMethodFilter, pagination.limit]
  );

  useEffect(() => {
    let isSubscribed = true;
    const loadOrders = async () => {
      try {
        const params: Record<string, unknown> = {
          page: 1,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (statusFilter) params.status = statusFilter;
        if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
        if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;

        const res = await adminApi.getOrders(params);
        if (isSubscribed) {
          if (res.success && res.data) {
            setOrders(res.data.data);
            setPagination(res.data.pagination);
          } else {
            setError(res.message || "Failed to load orders");
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Error retrieving order list"
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isSubscribed = false;
    };
  }, [search, statusFilter, paymentStatusFilter, paymentMethodFilter, pagination.limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const openTransitionModal = (order: AdminOrder) => {
    setOrderToTransition(order);
    const allowed = ALLOWED_TRANSITIONS[order.orderStatus] || [];
    setTargetStatus(allowed[0] || "");
    setCancelReason("");
    setTransitionError(null);
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToTransition || !targetStatus) return;

    if (targetStatus === "CANCELLED" && !cancelReason.trim()) {
      setTransitionError("A cancellation reason is required for administrative audit logs.");
      return;
    }

    try {
      setTransitionLoading(true);
      setTransitionError(null);

      const res = await adminApi.updateOrderStatus(
        orderToTransition._id,
        targetStatus,
        targetStatus === "CANCELLED" ? cancelReason.trim() : undefined
      );

      if (res.success) {
        setToastMessage(
          `Order ${orderToTransition.orderNumber} successfully moved to ${targetStatus}.`
        );
        setTimeout(() => setToastMessage(null), 4000);
        setOrderToTransition(null);
        // Refresh orders list
        fetchOrders(pagination.page);
        // If order detail drawer is open, refresh selectedOrder
        if (selectedOrder && selectedOrder._id === orderToTransition._id && res.data) {
          setSelectedOrder(res.data);
        }
      }
    } catch (err: unknown) {
      setTransitionError(
        err instanceof Error ? err.message : "Failed to execute order status transition"
      );
    } finally {
      setTransitionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-lg shadow-lg font-semibold text-xs flex items-center gap-2 animate-bounce">
          <CheckIcon className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Order Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative order lifecycle pipeline, payment reconciliation, and fulfillment dispatch
          </p>
        </div>
        <button
          onClick={() => fetchOrders(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order #, customer name, or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-20 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Order Status */}
          <div className="flex items-center gap-1.5">
            <FilterIcon className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
            >
              <option value="">All Order Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Payment Status */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="">All Payment Statuses</option>
            <option value="UNPAID">UNPAID</option>
            <option value="PAID">PAID</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>

          {/* Payment Method */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="">All Methods</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="SSLCOMMERZ">SSLCommerz</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading orders pipeline...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchOrders(1)}
              className="mt-3 px-3 py-1.5 bg-slate-800 text-xs font-semibold rounded hover:bg-slate-700 text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Order Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Placed At</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => {
                  const customerName =
                    typeof o.userId === "object" && o.userId !== null
                      ? o.userId.name
                      : o.shippingAddress?.fullName || "Guest Customer";
                  const customerEmail =
                    typeof o.userId === "object" && o.userId !== null
                      ? o.userId.email
                      : "";

                  const allowedTransitions = ALLOWED_TRANSITIONS[o.orderStatus] || [];
                  const isTerminal = allowedTransitions.length === 0;

                  return (
                    <tr
                      key={o._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono font-medium text-emerald-400">
                        {o.orderNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-200">{customerName}</div>
                        {customerEmail && (
                          <div className="text-xs text-slate-400">{customerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(o.createdAt)}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-white whitespace-nowrap">
                        {formatBDT(o.totalAmount)}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <PaymentStatusBadge status={o.paymentStatus} />
                          <PaymentMethodBadge method={o.paymentMethod} />
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <OrderStatusBadge status={o.orderStatus} />
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                          >
                            Details
                          </button>
                          {!isTerminal && (
                            <button
                              onClick={() => openTransitionModal(o)}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors"
                            >
                              Transition
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-200 px-2">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchOrders(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Order {selectedOrder.orderNumber}
                  </h2>
                  <OrderStatusBadge status={selectedOrder.orderStatus} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Shipping Details */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                    Shipping Address
                  </h4>
                  <p className="font-bold text-slate-200">
                    {selectedOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-slate-400">
                    {selectedOrder.shippingAddress?.streetAddress}
                  </p>
                  <p className="text-slate-400">
                    {selectedOrder.shippingAddress?.city},{" "}
                    {selectedOrder.shippingAddress?.postalCode},{" "}
                    {selectedOrder.shippingAddress?.country || "Bangladesh"}
                  </p>
                  <p className="text-emerald-400 font-mono pt-1">
                    Phone: {selectedOrder.shippingAddress?.phoneNumber}
                  </p>
                </div>

                {/* Payment Overview */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                    Payment Status
                  </h4>
                  <div className="flex items-center gap-2 pt-1">
                    <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                    <PaymentMethodBadge method={selectedOrder.paymentMethod} />
                  </div>
                  {selectedOrder.paymentDetails?.paidAt && (
                    <p className="text-slate-400 pt-1">
                      Paid: {formatDateTime(selectedOrder.paymentDetails.paidAt)}
                    </p>
                  )}
                  {selectedOrder.paymentDetails?.transactionId && (
                    <p className="text-slate-400 font-mono text-[11px]">
                      TxID: {selectedOrder.paymentDetails.transactionId}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Item</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5 text-right">Price</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-medium text-slate-200">
                          {item.title}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">
                          {item.sku}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300">
                          {formatBDT(item.price)}
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-white">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-white">
                          {formatBDT(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 max-w-xs ml-auto">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal</span>
                  <span>{formatBDT(selectedOrder.itemsPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping Fee</span>
                  <span>{formatBDT(selectedOrder.shippingPrice)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatBDT(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                {selectedOrder.taxPrice > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax</span>
                    <span>{formatBDT(selectedOrder.taxPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">
                    {formatBDT(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <div>
                {(ALLOWED_TRANSITIONS[selectedOrder.orderStatus] || []).length > 0 && (
                  <button
                    onClick={() => {
                      const o = selectedOrder;
                      setSelectedOrder(null);
                      openTransitionModal(o);
                    }}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Transition Lifecycle Status &rarr;
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Status Transition Modal */}
      {orderToTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Update Order Status</h2>
                <p className="text-xs text-slate-400">
                  Enforce strict state machine for {orderToTransition.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setOrderToTransition(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {transitionError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 text-red-400" />
                <span>{transitionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransition} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Current Status
                </label>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2">
                  <OrderStatusBadge status={orderToTransition.orderStatus} />
                  <span className="text-slate-500 font-mono text-[11px]">&rarr;</span>
                  <span className="text-slate-300 font-semibold">Ready for Next Stage</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Next Status *
                </label>
                <select
                  required
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:border-emerald-500 outline-none"
                >
                  {(ALLOWED_TRANSITIONS[orderToTransition.orderStatus] || []).map(
                    (nextSt) => (
                      <option key={nextSt} value={nextSt}>
                        {nextSt}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Informational notices based on state */}
              {targetStatus === "DELIVERED" && orderToTransition.paymentMethod === "COD" && (
                <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 space-y-1">
                  <p className="font-bold text-[11px]">Notice: COD Delivery Settlement</p>
                  <p className="text-[11px]">
                    Transitioning to DELIVERED automatically marks this Cash on Delivery order
                    as PAID in MongoDB.
                  </p>
                </div>
              )}

              {targetStatus === "CANCELLED" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                    <p className="font-bold text-[11px]">Notice: Automatic Stock Reversion</p>
                    <p className="text-[11px]">
                      Cancelling will release all reserved inventory items back into the live
                      product stock.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Cancellation Reason *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. Customer requested cancellation / unreachable phone..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToTransition(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitionLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {transitionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Confirm Transition</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
