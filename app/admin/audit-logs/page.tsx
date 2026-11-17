"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  AdminAuditLog,
  PaginationMeta,
} from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";
import {
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  AlertTriangleIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AuditLogIcon,
} from "@/components/admin/icons";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("");
  const [resourceFilter, setResourceFilter] = useState<string>("");
  const [correlationIdInput, setCorrelationIdInput] = useState<string>("");
  const [correlationId, setCorrelationId] = useState<string>("");

  // Inspect Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchLogs = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: pageToLoad,
          limit: pagination.limit,
        };

        if (actionFilter) params.action = actionFilter;
        if (resourceFilter) params.resource = resourceFilter;
        if (correlationId.trim()) params.correlationId = correlationId.trim();

        const res = await adminApi.getAuditLogs(params);
        if (res.success && res.data) {
          setLogs(res.data.data);
          setPagination(res.data.pagination);
        } else {
          throw new Error(res.message || "Failed to load audit logs");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error retrieving security logs"
        );
      } finally {
        setLoading(false);
      }
    },
    [actionFilter, resourceFilter, correlationId, pagination.limit]
  );

  useEffect(() => {
    let isSubscribed = true;
    const loadInitialLogs = async () => {
      try {
        const params: Record<string, unknown> = {
          page: 1,
          limit: pagination.limit,
        };

        if (actionFilter) params.action = actionFilter;
        if (resourceFilter) params.resource = resourceFilter;
        if (correlationId.trim()) params.correlationId = correlationId.trim();

        const res = await adminApi.getAuditLogs(params);
        if (isSubscribed) {
          if (res.success && res.data) {
            setLogs(res.data.data);
            setPagination(res.data.pagination);
          } else {
            setError(res.message || "Failed to load audit logs");
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Error retrieving security logs"
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadInitialLogs();

    return () => {
      isSubscribed = false;
    };
  }, [actionFilter, resourceFilter, correlationId, pagination.limit]);

  const handleCorrelationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrelationId(correlationIdInput);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Security & Audit Logs
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Append-Only Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-resistant audit trail recording all administrative mutations, status changes, and inventory actions
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Correlation ID Search */}
        <form onSubmit={handleCorrelationSubmit} className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={correlationIdInput}
            onChange={(e) => setCorrelationIdInput(e.target.value)}
            placeholder="Filter by Correlation ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-20 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none font-mono"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <FilterIcon className="w-4 h-4 text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
            >
              <option value="">All Action Types</option>
              <option value="ORDER_STATUS_UPDATE">ORDER_STATUS_UPDATE</option>
              <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
              <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
              <option value="PRODUCT_UPDATE">PRODUCT_UPDATE</option>
              <option value="CATEGORY_CREATE">CATEGORY_CREATE</option>
              <option value="CATEGORY_UPDATE">CATEGORY_UPDATE</option>
              <option value="CUSTOMER_STATUS_UPDATE">CUSTOMER_STATUS_UPDATE</option>
            </select>
          </div>

          {/* Resource Filter */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="">All Resources</option>
            <option value="ORDER">ORDER</option>
            <option value="PRODUCT">PRODUCT</option>
            <option value="CATEGORY">CATEGORY</option>
            <option value="USER">USER</option>
            <option value="INVENTORY">INVENTORY</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Querying audit log ledger...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchLogs(1)}
              className="mt-3 px-3 py-1.5 bg-slate-800 text-xs font-semibold rounded hover:bg-slate-700 text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No audit log entries found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-6 py-3">Resource ID</th>
                  <th className="px-6 py-3">Actor Email</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap font-sans">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                        {log.resource}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {log.resourceId ? log.resourceId.slice(-8) : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-slate-200 font-sans">
                      {log.adminEmail || "admin@system"}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {log.ipAddress || "::1"}
                    </td>
                    <td className="px-6 py-3.5 text-right font-sans whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <AuditLogIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Diff</span>
                      </button>
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
            {pagination.total} audit entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-200 px-2 font-sans">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect State Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Audit Entry Diff</h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {selectedLog.action}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged at {formatDateTime(selectedLog.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Actor</span>
                  <span className="text-slate-200 truncate block mt-0.5 font-sans">
                    {selectedLog.adminEmail || "admin@system"}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Resource ID</span>
                  <span className="text-emerald-400 truncate block mt-0.5">
                    {selectedLog.resourceId || "N/A"}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Client IP</span>
                  <span className="text-slate-300 truncate block mt-0.5">
                    {selectedLog.ipAddress || "::1"}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Correlation</span>
                  <span className="text-slate-300 truncate block mt-0.5">
                    {selectedLog.correlationId || "N/A"}
                  </span>
                </div>
              </div>

              {/* Before and After Diffs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold text-slate-400 mb-1">
                    Previous State
                  </h4>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56">
                    {selectedLog.previousState
                      ? JSON.stringify(selectedLog.previousState, null, 2)
                      : "null (No prior state recorded)"}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-1">
                    New State
                  </h4>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-56">
                    {selectedLog.newState
                      ? JSON.stringify(selectedLog.newState, null, 2)
                      : "null (No new state recorded)"}
                  </pre>
                </div>
              </div>

              {/* Additional Context Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-400 mb-1">
                    Execution Metadata
                  </h4>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 overflow-x-auto max-h-36">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
