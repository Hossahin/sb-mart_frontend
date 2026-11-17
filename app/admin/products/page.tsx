"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  adminApi,
  AdminProduct,
  AdminCategory,
  PaginationMeta,
} from "@/lib/admin-api";
import { formatBDT } from "@/lib/format";
import { ActiveBadge, StockBadge } from "@/components/admin/status-badge";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";
import {
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  AlertTriangleIcon,
  CheckIcon,
  CloseIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/admin/icons";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("");

  // Create Product Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    slug: "",
    sku: "",
    categoryId: "",
    price: 0,
    comparePrice: 0,
    stock: 10,
    imageUrl: "",
    description: "",
    isActive: true,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Product Modal
  const [productToEdit, setProductToEdit] = useState<AdminProduct | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    categoryId: "",
    price: 0,
    comparePrice: 0,
    stock: 0,
    imageUrl: "",
    description: "",
    isActive: true,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Product Modal
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Toggle Active State
  const [productToToggle, setProductToToggle] = useState<AdminProduct | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      const err = "Unsupported file type. Only JPEG, PNG, and WebP are allowed.";
      if (isEdit) setEditError(err);
      else setCreateError(err);
      return;
    }

    try {
      setUploadingImage(true);
      if (isEdit) setEditError(null);
      else setCreateError(null);

      const presignRes = await adminApi.presignUpload({
        contentType: file.type,
      });

      if (!presignRes.success || !presignRes.data?.uploadUrl) {
        throw new Error(presignRes.message || "Failed to obtain upload URL");
      }

      const uploadRes = await fetch(presignRes.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }

      await adminApi.verifyUpload({ key: presignRes.data.key });

      if (isEdit) {
        setEditForm((prev) => ({ ...prev, imageUrl: presignRes.data.publicUrl }));
      } else {
        setCreateForm((prev) => ({ ...prev, imageUrl: presignRes.data.publicUrl }));
      }
      setToastMessage("Image uploaded successfully to Cloudflare R2!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      if (isEdit) setEditError(msg);
      else setCreateError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Load categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await adminApi.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (e) {
        console.error("Failed to load categories for filter", e);
      }
    }
    loadCategories();
  }, []);

  const fetchProducts = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: pageToLoad,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (selectedCategory) params.category = selectedCategory;
        if (isActiveFilter !== "") params.isActive = isActiveFilter === "true";

        const res = await adminApi.getProducts(params);
        if (res.success && res.data) {
          setProducts(res.data.data);
          setPagination(res.data.pagination);
        } else {
          throw new Error(res.message || "Failed to load product list");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error retrieving products"
        );
      } finally {
        setLoading(false);
      }
    },
    [search, selectedCategory, isActiveFilter, pagination.limit]
  );

  useEffect(() => {
    let isSubscribed = true;
    const loadProducts = async () => {
      try {
        const params: Record<string, unknown> = {
          page: 1,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (selectedCategory) params.category = selectedCategory;
        if (isActiveFilter !== "") params.isActive = isActiveFilter === "true";

        const res = await adminApi.getProducts(params);
        if (isSubscribed) {
          if (res.success && res.data) {
            setProducts(res.data.data);
            setPagination(res.data.pagination);
          } else {
            setError(res.message || "Failed to load product list");
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Error retrieving products"
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isSubscribed = false;
    };
  }, [search, selectedCategory, isActiveFilter, pagination.limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleTitleChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setCreateForm((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === "" || prev.slug === slugified ? slugified : prev.slug,
    }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.title.trim() || !createForm.categoryId) {
      setCreateError("Title and category are required.");
      return;
    }
    if (createForm.price < 0 || createForm.stock < 0) {
      setCreateError("Price and stock cannot be negative.");
      return;
    }

    try {
      setCreateSubmitting(true);
      const desc = createForm.description.trim().length >= 10
        ? createForm.description.trim()
        : `${createForm.title.trim()} - Premium authentic SB-Mart product.`;

      const res = await adminApi.createProduct({
        title: createForm.title.trim(),
        category: createForm.categoryId,
        price: Math.round(Number(createForm.price)),
        comparePrice: createForm.comparePrice ? Math.round(Number(createForm.comparePrice)) : undefined,
        stock: Math.round(Number(createForm.stock)),
        description: desc,
        isActive: createForm.isActive,
        images: createForm.imageUrl.trim() ? [{ url: createForm.imageUrl.trim(), isPrimary: true }] : [],
      });

      if (res.success) {
        setIsCreateOpen(false);
        setToastMessage(`Product "${createForm.title}" created successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
        // Reset form
        setCreateForm({
          title: "",
          slug: "",
          sku: "",
          categoryId: "",
          price: 0,
          comparePrice: 0,
          stock: 10,
          imageUrl: "",
          description: "",
          isActive: true,
        });
        fetchProducts(1);
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenEdit = (p: AdminProduct) => {
    setProductToEdit(p);
    setEditError(null);
    const catId = typeof p.categoryId === "object" && p.categoryId !== null ? p.categoryId._id : (p.categoryId || "");
    setEditForm({
      title: p.title,
      categoryId: catId,
      price: p.price,
      comparePrice: p.discountPrice || 0,
      stock: p.stock,
      imageUrl: p.images && p.images[0] ? p.images[0] : "",
      description: p.description || "",
      isActive: p.isActive,
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit) return;
    setEditError(null);

    try {
      setEditSubmitting(true);
      const desc = editForm.description.trim().length >= 10
        ? editForm.description.trim()
        : `${editForm.title.trim()} - Premium authentic SB-Mart product.`;

      const res = await adminApi.updateProduct(productToEdit._id, {
        title: editForm.title.trim(),
        category: editForm.categoryId || undefined,
        price: Math.round(Number(editForm.price)),
        comparePrice: editForm.comparePrice ? Math.round(Number(editForm.comparePrice)) : undefined,
        description: desc,
        images: editForm.imageUrl.trim() ? [{ url: editForm.imageUrl.trim(), isPrimary: true }] : undefined,
      });

      if (res.success) {
        setProductToEdit(null);
        setToastMessage(`Product "${editForm.title}" updated successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchProducts(pagination.page);
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setDeleteSubmitting(true);
      const res = await adminApi.deleteProduct(productToDelete._id);
      if (res.success) {
        setToastMessage(`Product "${productToDelete.title}" deleted successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
        setProductToDelete(null);
        fetchProducts(pagination.page);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!productToToggle) return;
    const newActiveState = !productToToggle.isActive;
    try {
      setIsToggling(true);
      const res = await adminApi.updateProductStatus(productToToggle._id, newActiveState);
      if (res.success) {
        setToastMessage(
          `Product ${productToToggle.title} is now ${
            newActiveState ? "active in catalog" : "hidden/inactive"
          }.`
        );
        setTimeout(() => setToastMessage(null), 4000);
        fetchProducts(pagination.page);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update product active state");
    } finally {
      setIsToggling(false);
      setProductToToggle(null);
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
            Product Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain product definitions, SKUs, category links, pricing, and catalog visibility
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchProducts(pagination.page)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
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
            placeholder="Search by title, SKU, or slug..."
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
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <FilterIcon className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status Filter */}
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="">All Visibility</option>
            <option value="true">Active Only</option>
            <option value="false">Hidden / Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading product catalog...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchProducts(1)}
              className="mt-3 px-3 py-1.5 bg-slate-800 text-xs font-semibold rounded hover:bg-slate-700 text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No products match the given criteria. Click &quot;Add Product&quot; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Visibility</th>
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
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">
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
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate max-w-xs">
                              {p.title}
                            </div>
                            <div className="text-xs text-slate-500 truncate font-mono">
                              /{p.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-emerald-400">
                        {p.sku}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-white whitespace-nowrap">
                        <div>{formatBDT(p.price)}</div>
                        {p.comparePrice && p.comparePrice > p.price && (
                          <div className="text-[11px] text-slate-500 line-through">
                            {formatBDT(p.comparePrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <StockBadge stock={p.stock} />
                      </td>
                      <td className="px-6 py-3.5">
                        <ActiveBadge isActive={p.isActive} />
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/inventory?search=${encodeURIComponent(
                              p.sku
                            )}`}
                            className="px-2 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                            title="Adjust inventory"
                          >
                            Stock
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2 py-1 text-xs font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 rounded transition-colors"
                            title="Edit product"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setProductToToggle(p)}
                            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                              p.isActive
                                ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                            }`}
                          >
                            {p.isActive ? "Hide" : "Show"}
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="px-2 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded transition-colors"
                            title="Delete product"
                          >
                            Delete
                          </button>
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
            {pagination.total} products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProducts(pagination.page - 1)}
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
              onClick={() => fetchProducts(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Create New Product</h2>
                <p className="text-xs text-slate-400">Add an SKU to the SB-Mart inventory</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 text-red-400" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Premium Basmati Rice 5kg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.slug}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, slug: e.target.value })
                    }
                    placeholder="premium-basmati-rice-5kg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.sku}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, sku: e.target.value.toUpperCase() })
                    }
                    placeholder="RICE-BAS-005"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Category */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={createForm.categoryId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, categoryId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Selling Price (BDT) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, price: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Compare Price */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Compare Price (Optional strike-through)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={createForm.comparePrice || ""}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        comparePrice: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    placeholder="e.g. 550"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Initial Stock Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={createForm.stock}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Image URL & File Upload */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-300 font-medium">
                      Product Image (URL or Direct Upload)
                    </label>
                    <label className="cursor-pointer text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                      {uploadingImage ? "Uploading to R2..." : "📁 Upload Image File"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingImage}
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={createForm.imageUrl}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, imageUrl: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/... or uploaded Cloudflare R2 URL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none text-xs font-mono"
                  />
                  {createForm.imageUrl && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Preview URL:</span>
                      <span className="truncate text-emerald-400 font-mono">{createForm.imageUrl}</span>
                    </div>
                  )}
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={createForm.isActive}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-slate-300 font-medium cursor-pointer">
                    Publish actively in storefront
                  </label>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                    placeholder="Enter full product details, specifications..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(productToToggle)}
        title={
          productToToggle?.isActive
            ? "Hide Product from Catalog?"
            : "Activate Product in Catalog?"
        }
        description={`Are you sure you want to ${
          productToToggle?.isActive ? "hide" : "publish"
        } product "${productToToggle?.title}"? ${
          productToToggle?.isActive
            ? "Customers will no longer be able to discover or purchase this item."
            : "The product will become immediately visible in the active storefront catalog."
        }`}
        confirmLabel={
          productToToggle?.isActive ? "Yes, Hide Product" : "Yes, Activate Product"
        }
        variant={productToToggle?.isActive ? "danger" : "primary"}
        isLoading={isToggling}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setProductToToggle(null)}
      />

      {/* Edit Product Modal */}
      {productToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Product</h3>
                <p className="text-xs text-slate-400">
                  Update product details, pricing, and catalog categorization
                </p>
              </div>
              <button
                onClick={() => setProductToEdit(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, categoryId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Selling Price (BDT) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Compare Price (Optional discount)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.comparePrice || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        comparePrice: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-300 font-medium">
                      Product Image (URL or Direct Upload)
                    </label>
                    <label className="cursor-pointer text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                      {uploadingImage ? "Uploading to R2..." : "📁 Replace with Image File"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingImage}
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={editForm.imageUrl}
                    onChange={(e) =>
                      setEditForm({ ...editForm, imageUrl: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/... or uploaded Cloudflare R2 URL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none text-xs font-mono"
                  />
                  {editForm.imageUrl && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Current URL:</span>
                      <span className="truncate text-emerald-400 font-mono">{editForm.imageUrl}</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductToEdit(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {editSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(productToDelete)}
        title="Delete Product?"
        description={`Are you sure you want to permanently delete "${productToDelete?.title}" (SKU: ${productToDelete?.sku})? This action cannot be undone.`}
        confirmLabel="Yes, Delete Product"
        variant="danger"
        isLoading={deleteSubmitting}
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
