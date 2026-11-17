"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ProductCard } from "@/components/storefront/product-card";
import { customerApi, CustomerProduct, CustomerCategory, PaginationMeta } from "@/lib/customer-api";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  // Load categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await customerApi.getCategories();
        if (res.success && res.data) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  const fetchProducts = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const res = await customerApi.getProducts({
          page: pageToLoad,
          limit: pagination.limit,
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
          sortBy,
          sortOrder,
        });

        if (res.success && res.data) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, selectedCategory, sortBy, sortOrder, pagination.limit]
  );

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await customerApi.getProducts({
          page: 1,
          limit: pagination.limit,
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
          sortBy,
          sortOrder,
        });

        if (isSubscribed && res.success && res.data) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
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
  }, [search, selectedCategory, sortBy, sortOrder, pagination.limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Product Catalog</h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore all grocery items and daily essentials with verified inventory
        </p>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, brand, or SKU..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 text-xs"
            >
              🔍
            </button>
          </div>
        </form>

        {/* Category & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              router.replace(
                e.target.value
                  ? `/products?category=${e.target.value}`
                  : "/products"
              );
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "price_asc") {
                setSortBy("price");
                setSortOrder("asc");
              } else if (val === "price_desc") {
                setSortBy("price");
                setSortOrder("desc");
              } else {
                setSortBy("createdAt");
                setSortOrder("desc");
              }
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-slate-900 rounded-xl animate-pulse border border-slate-800"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-xl border border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
            📦
          </div>
          <h3 className="font-bold text-white text-base">No products match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
              setSortBy("createdAt");
              setSortOrder("desc");
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
              >
                &larr; Previous
              </button>
              <span className="text-xs font-semibold text-slate-400 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading catalog...</div>}>
        <ProductsContent />
      </Suspense>
    </StorefrontShell>
  );
}
