"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminApi, AdminCategory } from "@/lib/admin-api";
import { ActiveBadge } from "@/components/admin/status-badge";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";
import {
  SearchIcon,
  RefreshIcon,
  AlertTriangleIcon,
  CheckIcon,
  CloseIcon,
  PlusIcon,
  CategoriesIcon,
} from "@/components/admin/icons";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");

  // Create Category Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    parentId: "",
    description: "",
    isActive: true,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Category Modal
  const [categoryToEdit, setCategoryToEdit] = useState<AdminCategory | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    parentId: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Category Modal
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Toggle Active State
  const [categoryToToggle, setCategoryToToggle] = useState<AdminCategory | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        throw new Error(res.message || "Failed to load categories");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error retrieving categories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const loadCategories = async () => {
      try {
        const res = await adminApi.getCategories();
        if (isSubscribed) {
          if (res.success && res.data) {
            setCategories(res.data);
          } else {
            setError(res.message || "Failed to load categories");
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Error retrieving categories"
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleNameChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setCreateForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug === slugified ? slugified : prev.slug,
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.name.trim()) {
      setCreateError("Category name is required.");
      return;
    }

    try {
      setCreateSubmitting(true);
      const res = await adminApi.createCategory({
        name: createForm.name.trim(),
        parentCategory: createForm.parentId || undefined,
        description: createForm.description.trim() || undefined,
        isActive: createForm.isActive,
      });

      if (res.success) {
        setIsCreateOpen(false);
        setToastMessage(`Category "${createForm.name}" created successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
        // Reset form
        setCreateForm({
          name: "",
          slug: "",
          parentId: "",
          description: "",
          isActive: true,
        });
        fetchCategories();
      }
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenEdit = (c: AdminCategory) => {
    setCategoryToEdit(c);
    setEditError(null);
    const parentIdVal =
      c.parentCategory && typeof c.parentCategory === "object"
        ? c.parentCategory._id
        : (c.parentCategory as string) ||
          (c.parentId && typeof c.parentId === "object" ? c.parentId._id : (c.parentId as string) || "");

    setEditForm({
      name: c.name,
      description: c.description || "",
      parentId: parentIdVal,
    });
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToEdit) return;
    setEditError(null);

    try {
      setEditSubmitting(true);
      const res = await adminApi.updateCategory(categoryToEdit._id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        parentCategory: editForm.parentId || null,
      });

      if (res.success) {
        setCategoryToEdit(null);
        setToastMessage(`Category "${editForm.name}" updated successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchCategories();
      }
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleteSubmitting(true);
      const res = await adminApi.deleteCategory(categoryToDelete._id);
      if (res.success) {
        setToastMessage(`Category "${categoryToDelete.name}" deleted successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
        setCategoryToDelete(null);
        fetchCategories();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!categoryToToggle) return;
    const newActiveState = !categoryToToggle.isActive;
    try {
      setIsToggling(true);
      const res = await adminApi.updateCategory(categoryToToggle._id, {
        isActive: newActiveState,
      });
      if (res.success) {
        setToastMessage(
          `Category ${categoryToToggle.name} is now ${
            newActiveState ? "active" : "inactive"
          }.`
        );
        setTimeout(() => setToastMessage(null), 4000);
        fetchCategories();
      }
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Failed to update category status"
      );
    } finally {
      setIsToggling(false);
      setCategoryToToggle(null);
    }
  };

  // Group categories into Root and Subcategories
  const rootCategories = categories.filter((c) => !c.parentId);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => {
      const pid =
        typeof c.parentId === "object" && c.parentId !== null
          ? c.parentId._id
          : c.parentId;
      return pid === parentId;
    });

  // Filtered list
  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

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
            Category Hierarchy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize the storefront taxonomy, parent-child taxonomy trees, and category navigation
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCategories()}
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
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Categories Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading taxonomy tree...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchCategories()}
              className="mt-3 px-3 py-1.5 bg-slate-800 text-xs font-semibold rounded hover:bg-slate-700 text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No categories defined yet. Click &quot;Add Category&quot; to build the taxonomy.
          </div>
        ) : search.trim() ? (
          // Flat list when searching
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Parent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCategories.map((c) => {
                  const parentName =
                    typeof c.parentId === "object" && c.parentId !== null
                      ? c.parentId.name
                      : categories.find((cat) => cat._id === c.parentId)?.name ||
                        "— Root —";
                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-semibold text-slate-200">
                        {c.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-emerald-400">
                        /{c.slug}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">
                        {parentName}
                      </td>
                      <td className="px-6 py-3.5">
                        <ActiveBadge isActive={c.isActive} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="px-2 py-1 text-xs font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setCategoryToToggle(c)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                              c.isActive
                                ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                            }`}
                          >
                            {c.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setCategoryToDelete(c)}
                            className="px-2 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded transition-colors"
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
        ) : (
          // Hierarchical Tree View
          <div className="divide-y divide-slate-800/80">
            {rootCategories.map((root) => {
              const subs = getSubcategories(root._id);
              return (
                <div key={root._id} className="p-4 sm:p-5 hover:bg-slate-800/20 transition-colors">
                  {/* Root Category Row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CategoriesIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{root.name}</span>
                          <span className="text-[11px] font-mono text-emerald-400">
                            /{root.slug}
                          </span>
                        </div>
                        {root.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{root.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 mr-1">
                        {subs.length} subcategories
                      </span>
                      <ActiveBadge isActive={root.isActive} />
                      <button
                        onClick={() => handleOpenEdit(root)}
                        className="px-2 py-1 text-xs font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setCategoryToToggle(root)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                          root.isActive
                            ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                        }`}
                      >
                        {root.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(root)}
                        className="px-2 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Nested Subcategories */}
                  {subs.length > 0 && (
                    <div className="mt-3 pl-8 sm:pl-11 space-y-2 border-l-2 border-slate-800 ml-4">
                      {subs.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-mono text-xs">&rarr;</span>
                            <span className="font-medium text-slate-300 text-xs">
                              {sub.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              /{sub.slug}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ActiveBadge isActive={sub.isActive} />
                            <button
                              onClick={() => handleOpenEdit(sub)}
                              className="px-2 py-0.5 text-[11px] font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setCategoryToToggle(sub)}
                              className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                                sub.isActive
                                  ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                              }`}
                            >
                              {sub.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => setCategoryToDelete(sub)}
                              className="px-2 py-0.5 text-[11px] font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Create Category</h2>
                <p className="text-xs text-slate-400">Add a new taxonomy node</p>
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

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Grocery & Staples"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

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
                  placeholder="grocery-staples"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={createForm.parentId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, parentId: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                >
                  <option value="">None (Top-Level Root Category)</option>
                  {rootCategories.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  placeholder="Short description for SEO and category page..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={createForm.isActive}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="catActive" className="text-slate-300 font-medium cursor-pointer">
                  Activate in customer navigation
                </label>
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
                    <span>Create Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(categoryToToggle)}
        title={
          categoryToToggle?.isActive
            ? "Deactivate Category?"
            : "Activate Category?"
        }
        description={`Are you sure you want to ${
          categoryToToggle?.isActive ? "deactivate" : "activate"
        } category "${categoryToToggle?.name}"? ${
          categoryToToggle?.isActive
            ? "Products in this category will remain, but the category may be hidden from storefront navigation menus."
            : "The category will become visible in navigation menus."
        }`}
        confirmLabel={
          categoryToToggle?.isActive ? "Yes, Deactivate" : "Yes, Activate"
        }
        variant={categoryToToggle?.isActive ? "danger" : "primary"}
        isLoading={isToggling}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setCategoryToToggle(null)}
      />

      {/* Edit Category Modal */}
      {categoryToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Category</h3>
                <p className="text-xs text-slate-400">
                  Update category name, description, and parent hierarchy
                </p>
              </div>
              <button
                onClick={() => setCategoryToEdit(null)}
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

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Parent Category (Leave empty for root)
                  </label>
                  <select
                    value={editForm.parentId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, parentId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      .filter((c) => c._id !== categoryToEdit._id)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
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
                  onClick={() => setCategoryToEdit(null)}
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
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category?"
        description={`Are you sure you want to permanently delete category "${categoryToDelete?.name}"?`}
        confirmLabel="Yes, Delete Category"
        variant="danger"
        isLoading={deleteSubmitting}
        onConfirm={handleDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
