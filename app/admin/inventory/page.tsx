"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import {
  adminApi,
  AdminProduct,
  PaginationMeta,
} from "@/lib/admin-api";
import { StockBadge } from "@/components/admin/status-badge";
import {
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  AlertTriangleIcon,
  CheckIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InventoryIcon,
} from "@/components/admin/icons";

interface InventoryPageProps {
  searchParams?: Promise<{ search?: string; status?: string }>;
}

export default function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const initialSearch = resolvedSearchParams?.search || "";
  const initialFilter = resolvedSearchParams?.status || "";

  const [products, setProducts] = useState<AdminProduct[]>([]);
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
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>(initialFilter);

  // Stock Adjustment Modal
  const [productToAdjust, setProductToAdjust] = useState<AdminProduct | null>(null);
  const [adjustMode, setAdjustMode] = useState<"set" | "delta">("delta");
  const [absoluteStock, setAbsoluteStock] = useState<number>(0);
  const [deltaStock, setDeltaStock] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchInventory = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: pageToLoad,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (inventoryStatusFilter) params.inventoryStatus = inventoryStatusFilter;

        const res = await adminApi.getProducts(params);
        if (res.success && res.data) {
          setProducts(res.data.data);
          setPagination(res.data.pagination);
        } else {
          throw new Error(res.message || "Failed to load inventory");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error retrieving inventory"
        );
      } finally {
        setLoading(false);
      }
    },
    [search, inventoryStatusFilter, pagination.limit]
  );

  useEffect(() => {
    let isSubscribed = true;
    const loadInventory = async () => {
      try {
        const params: Record<string, unknown> = {
          page: 1,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (inventoryStatusFilter) params.inventoryStatus = inventoryStatusFilter;

        const res = await adminApi.getProducts(params);
        if (isSubscribed) {
          if (res.success && res.data) {
            setProducts(res.data.data);
            setPagination(res.data.pagination);
          } else {
            setError(res.message || "Failed to load inventory");
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Error retrieving inventory"
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      isSubscribed = false;
    };
  }, [search, inventoryStatusFilter, pagination.limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const openAdjustmentModal = (p: AdminProduct) => {
    setProductToAdjust(p);
    setAdjustMode("delta");
    setDeltaStock(0);
    setAbsoluteStock(p.stock);
    setAdjustmentReason("");
    setAdjustError(null);
  };

  // Calculate resulting stock for preview
  const resultingStock =
    adjustMode === "set"
      ? absoluteStock
      : (productToAdjust?.stock || 0) + deltaStock;

  const handleConfirmStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToAdjust) return;

    if (resultingStock < 0) {
      setAdjustError("Resulting stock level cannot be negative.");
      return;
    }

    try {
      setAdjusting(true);
      setAdjustError(null);

      const res = await adminApi.updateStock(
        productToAdjust._id,
        resultingStock,
        adjustmentReason.trim() || undefined
      );

      if (res.success) {
        setToastMessage(
          `Stock for ${productToAdjust.title} updated from ${productToAdjust.stock} to ${resultingStock}.`
        );
        setTimeout(() => setToastMessage(null), 4000);
        setProductToAdjust(null);
        fetchInventory(pagination.page);
      }
    } catch (err: unknown) {
      setAdjustError(
        err instanceof Error ? err.message : "Failed to update stock quantity"
      );
    } finally {
      setAdjusting(false);
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
            Inventory & Warehouse Levels
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time physical stock counts, threshold monitoring, and atomic warehouse stock adjustments
          </p>
        </div>
        <button
          onClick={() => fetchInventory(pagination.page)}
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
            placeholder="Search by SKU or product title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-20 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-slate-500" />
          <select
            value={inventoryStatusFilter}
            onChange={(e) => setInventoryStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="">All Inventory Statuses</option>
            <option value="LOW_STOCK">Low Stock Alert (&le; 5 units)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0 units)</option>
            <option value="IN_STOCK">Adequate Stock (&gt; 5 units)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading warehouse inventory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchInventory(1)}
              className="mt-3 px-3 py-1.5 bg-slate-800 text-xs font-semibold rounded hover:bg-slate-700 text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No items matched the given inventory query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Units in Stock</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => {
                  const categoryName =
                    typeof p.categoryId === "object" && p.categoryId !== null
                      ? p.categoryId.name
                      : "General";

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">
                            {p.images && p.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              p.title.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 max-w-xs truncate">
                              {p.title}
                            </div>
                            <div className="text-xs text-slate-500">ID: {p._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-emerald-400">
                        {p.sku}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-300">
                        {categoryName}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-base text-white">
                        {p.stock}
                      </td>
                      <td className="px-6 py-3.5">
                        <StockBadge stock={p.stock} />
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => openAdjustmentModal(p)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <InventoryIcon className="w-3.5 h-3.5" />
                          <span>Adjust Stock</span>
                        </button>
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
            {pagination.total} inventory items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInventory(pagination.page - 1)}
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
              onClick={() => fetchInventory(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Atomic Stock Adjustment Modal */}
      {productToAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Adjust Product Stock</h2>
                <p className="text-xs text-slate-400">
                  Atomic MongoDB update for {productToAdjust.sku}
                </p>
              </div>
              <button
                onClick={() => setProductToAdjust(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 text-red-400" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmStockAdjustment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-medium">Selected Product:</span>
                <p className="font-bold text-slate-100 text-sm">{productToAdjust.title}</p>
                <div className="flex items-center gap-3 pt-1 text-slate-400">
                  <span>
                    Current Stock:{" "}
                    <strong className="text-white font-mono text-sm">
                      {productToAdjust.stock}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span className="font-mono text-emerald-400">{productToAdjust.sku}</span>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Adjustment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("delta")}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs transition-colors ${
                      adjustMode === "delta"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Add / Subtract Units (+/-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode("set")}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs transition-colors ${
                      adjustMode === "set"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Set Fixed Quantity (=)
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              {adjustMode === "delta" ? (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Units to Add or Subtract (+ or -)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={deltaStock}
                    onChange={(e) => setDeltaStock(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. +25 or -10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Use positive numbers to add stock, negative numbers to write off stock.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    New Total Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={absoluteStock}
                    onChange={(e) => setAbsoluteStock(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              )}

              {/* Real-time Result Preview */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  resultingStock < 0
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                }`}
              >
                <span className="font-semibold text-xs">Resulting Warehouse Stock:</span>
                <span className="font-mono font-bold text-base">
                  {resultingStock} units
                </span>
              </div>

              {/* Adjustment Reason */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason / Audit Memo (Optional)
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Restocked batch PO-8824 / damaged item disposal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductToAdjust(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting || resultingStock < 0}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {adjusting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Stock Level</span>
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
