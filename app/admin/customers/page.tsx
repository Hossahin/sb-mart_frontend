"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  AdminCustomer,
  PaginationMeta,
} from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";
import { ActiveBadge } from "@/components/admin/status-badge";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("");

  // Customer Detail Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);

  // Status Change Confirmation Modal state
  const [customerToToggle, setCustomerToToggle] = useState<AdminCustomer | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCustomers = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: pageToLoad,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (isActiveFilter !== "") params.isActive = isActiveFilter === "true";

        const res = await adminApi.getCustomers(params);
        if (res.success && res.data) {
          setCustomers(res.data.data);
          setPagination(res.data.pagination);
        } else {
          throw new Error(res.message || "Failed to load customer list");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error retrieving customer accounts"
        );
      } finally {
        setLoading(false);
      }
    },
    [search, isActiveFilter, pagination.limit]
  );

  useEffect(() => {
    let isSubscribed = true;
    const loadCustomers = async () => {
      try {
        const params: Record<string, unknown> = {
          page: 1,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (isActiveFilter !== "") params.isActive = isActiveFilter === "true";

        const res = await adminApi.getCustomers(params);
        if (isSubscribed) {
          if (res.success && res.data) {
            setCustomers(res.data.data);
            setPagination(res.data.pagination);
          } else {
            setError(res.message || "Failed to load customer list");
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Error retrieving customer accounts"
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      isSubscribed = false;
    };
  }, [search, isActiveFilter, pagination.limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleConfirmToggleStatus = async () => {
    if (!customerToToggle) return;
    const newStatus = !customerToToggle.isActive;
    try {
      setIsUpdatingStatus(true);
      const res = await adminApi.updateCustomerStatus(
        customerToToggle._id,
        newStatus
      );
      if (res.success) {
        setToastMessage(
          `Customer ${customerToToggle.name} successfully ${
            newStatus ? "activated" : "suspended"
          }.`
        );
        setTimeout(() => setToastMessage(null), 4000);
        // Refresh customer list
        fetchCustomers(pagination.page);
        // If selected customer is currently open in detail modal, update it
        if (selectedCustomer && selectedCustomer._id === customerToToggle._id) {
          setSelectedCustomer({ ...selectedCustomer, isActive: newStatus });
        }
      }
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Failed to update customer status"
      );
    } finally {
      setIsUpdatingStatus(false);
      setCustomerToToggle(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
            Customer Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered customer profiles, authentication access, and order history
          </p>
        </div>
        <button
          onClick={() => fetchCustomers(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto disabled:opacity-50"
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
            placeholder="Search by name, email, or phone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-20 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-slate-500" />
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="">All Account Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading customer directory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchCustomers(1)}
              className="mt-3 px-3 py-1.5 bg-slate-800 text-xs font-semibold rounded hover:bg-slate-700 text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No customers match the given search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 uppercase">
                          {c.name ? c.name[0] : "U"}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{c.name}</div>
                          <div className="text-xs text-slate-400">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-300">
                      {c.phone || "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {c.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <ActiveBadge isActive={c.isActive} />
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(c.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setCustomerToToggle(c)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                            c.isActive
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                          }`}
                        >
                          {c.isActive ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} customers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCustomers(pagination.page - 1)}
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
              onClick={() => fetchCustomers(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Customer Profile</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-slate-400">{selectedCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block">Phone</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {selectedCustomer.phone || "Not specified"}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block">Account Status</span>
                  <div className="mt-1">
                    <ActiveBadge isActive={selectedCustomer.isActive} />
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block">System Role</span>
                  <span className="font-mono text-emerald-400 mt-0.5 block">
                    {selectedCustomer.role}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block">Registration Date</span>
                  <span className="text-slate-300 mt-0.5 block">
                    {formatDateTime(selectedCustomer.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Suspending / Activating */}
      <ConfirmationModal
        isOpen={Boolean(customerToToggle)}
        title={
          customerToToggle?.isActive
            ? "Suspend Customer Account?"
            : "Activate Customer Account?"
        }
        description={`Are you sure you want to ${
          customerToToggle?.isActive ? "suspend" : "reactivate"
        } account "${customerToToggle?.name}" (${customerToToggle?.email})? ${
          customerToToggle?.isActive
            ? "The user will immediately be barred from signing in and placing new orders."
            : "The user will regain immediate access to sign in and checkout."
        }`}
        confirmLabel={
          customerToToggle?.isActive ? "Yes, Suspend Account" : "Yes, Activate Account"
        }
        variant={customerToToggle?.isActive ? "danger" : "primary"}
        isLoading={isUpdatingStatus}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setCustomerToToggle(null)}
      />
    </div>
  );
}
