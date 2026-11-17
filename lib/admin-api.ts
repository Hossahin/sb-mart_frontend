import { apiFetch, ApiResponse } from "./api";

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export type OrderStatusType =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatusType = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  activeProducts: number;
  totalProducts: number;
  lowStockCount: number;
  activeCategories: number;
  totalCategories: number;
  statusBreakdown: Array<{ _id: string; count: number }>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    userId?: { name: string; email: string } | null;
    customer?: { name: string; email: string } | null;
    shippingAddress?: { fullName: string; phoneNumber?: string };
    totalAmount: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export interface AdminCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PRODUCT & CATEGORY TYPES
// ============================================================================

export interface AdminProduct {
  _id: string;
  title: string;
  slug: string;
  sku: string;
  categoryId?: string | { _id: string; name: string } | null;
  category?: { _id: string; name: string } | null;
  price: number;
  comparePrice?: number;
  discountPrice?: number;
  stock: number;
  images?: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | { _id: string; name: string } | null;
  parentCategory?: string | { _id: string; name: string } | null;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface AdminOrderItem {
  productId?: string;
  title: string;
  productName?: string;
  sku: string;
  price: number;
  unitPrice?: number;
  quantity: number;
  subtotal: number;
  lineTotal?: number;
}

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  userId?: { _id: string; name: string; email: string } | null;
  customer?: { _id: string; name: string; email: string } | null;
  shippingAddress: {
    fullName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    postalCode: string;
    country?: string;
  };
  items: AdminOrderItem[];
  itemsPrice: number;
  shippingPrice: number;
  discountAmount: number;
  taxPrice: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentDetails?: {
    paidAt?: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AdminAuditLog {
  _id: string;
  adminId?: string;
  actorId?: string;
  adminEmail?: string;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceType?: string;
  resourceId?: string;
  previousState?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// INTERNAL BACKEND DTO TYPES
// ============================================================================

interface RawRecentOrder {
  _id: string;
  orderNumber: string;
  customer?: { name: string; email: string } | null;
  userId?: { name: string; email: string } | null;
  shippingAddress?: { fullName: string; phoneNumber?: string };
  grandTotal?: number;
  totalAmount?: number;
  status?: string;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt: string | Date;
}

interface RawDashboardData {
  totalRevenue?: number;
  totalOrders?: number;
  totalCustomers?: number;
  totalActiveProducts?: number;
  activeProducts?: number;
  totalProducts?: number;
  lowStockProductCount?: number;
  lowStockCount?: number;
  totalActiveCategories?: number;
  activeCategories?: number;
  totalCategories?: number;
  orderStatusBreakdown?: Record<string, number>;
  statusBreakdown?: Array<{ _id: string; count: number }>;
  recentOrders?: RawRecentOrder[];
}

interface RawOrderItem {
  productId?: string;
  product?: string;
  title?: string;
  productName?: string;
  sku?: string;
  price?: number;
  unitPrice?: number;
  quantity?: number;
  subtotal?: number;
  lineTotal?: number;
}

interface RawOrder {
  _id: string;
  orderNumber: string;
  userId?: { _id: string; name: string; email: string } | null;
  customer?: { _id: string; name: string; email: string } | null;
  shippingAddress?: {
    fullName?: string;
    recipientName?: string;
    phoneNumber?: string;
    phone?: string;
    streetAddress?: string;
    addressLine?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country?: string;
  };
  items?: RawOrderItem[];
  itemsPrice?: number;
  subtotal?: number;
  shippingPrice?: number;
  shippingFee?: number;
  discountAmount?: number;
  taxPrice?: number;
  totalAmount?: number;
  grandTotal?: number;
  orderStatus?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentDetails?: {
    paidAt?: string;
    transactionId?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface RawAuditLog {
  _id: string;
  actorId?: string;
  adminId?: string;
  actorEmail?: string;
  adminEmail?: string;
  action: string;
  resource?: string;
  resourceType?: string;
  resourceId?: string;
  before?: Record<string, unknown> | null;
  previousState?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string | Date;
}

// ============================================================================
// ADMIN API CLIENT
// ============================================================================

export const adminApi = {
  // 1. Dashboard
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const raw = await apiFetch<RawDashboardData>("/admin/dashboard/stats");
    const d = raw.data || {};

    let breakdown: Array<{ _id: string; count: number }> = [];
    if (d.orderStatusBreakdown && typeof d.orderStatusBreakdown === "object") {
      breakdown = Object.entries(d.orderStatusBreakdown).map(([k, v]) => ({
        _id: k,
        count: Number(v) || 0,
      }));
    } else if (Array.isArray(d.statusBreakdown)) {
      breakdown = d.statusBreakdown;
    }

    const recentOrders = (d.recentOrders || []).map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      userId: o.customer ? { name: o.customer.name, email: o.customer.email } : o.userId,
      customer: o.customer,
      shippingAddress: o.shippingAddress,
      totalAmount: o.grandTotal ?? o.totalAmount ?? 0,
      orderStatus: o.status ?? o.orderStatus ?? "PENDING",
      paymentStatus: o.paymentStatus ?? "UNPAID",
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date(o.createdAt).toISOString(),
    }));

    const normalizedStats: DashboardStats = {
      totalRevenue: d.totalRevenue ?? 0,
      totalOrders: d.totalOrders ?? 0,
      totalCustomers: d.totalCustomers ?? 0,
      activeProducts: d.totalActiveProducts ?? d.activeProducts ?? 0,
      totalProducts: d.totalProducts ?? d.totalActiveProducts ?? 0,
      lowStockCount: d.lowStockProductCount ?? d.lowStockCount ?? 0,
      activeCategories: d.totalActiveCategories ?? d.activeCategories ?? 0,
      totalCategories: d.totalCategories ?? d.totalActiveCategories ?? 0,
      statusBreakdown: breakdown,
      recentOrders,
    };

    return {
      success: raw.success,
      message: raw.message,
      data: normalizedStats,
    };
  },

  // 2. Customers
  getCustomers: async (
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<{ data: AdminCustomer[]; pagination: PaginationMeta }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });

    const raw = await apiFetch<{
      customers?: AdminCustomer[];
      data?: AdminCustomer[];
      pagination?: PaginationMeta;
    }>(`/admin/customers?${query.toString()}`);

    const customers = raw.data?.customers || raw.data?.data || [];
    const pagination = raw.data?.pagination || {
      total: customers.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };

    return {
      success: raw.success,
      message: raw.message,
      data: {
        data: customers,
        pagination,
      },
    };
  },

  updateCustomerStatus: async (
    customerId: string,
    isActive: boolean
  ): Promise<ApiResponse<AdminCustomer>> => {
    const raw = await apiFetch<{ customer?: AdminCustomer } | AdminCustomer>(
      `/admin/customers/${customerId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }
    );
    const data =
      raw.data && "customer" in raw.data && raw.data.customer
        ? raw.data.customer
        : (raw.data as AdminCustomer);

    return {
      success: raw.success,
      message: raw.message,
      data,
    };
  },

  // 3. Products
  getProducts: async (
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<{ data: AdminProduct[]; pagination: PaginationMeta }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });

    const raw = await apiFetch<{
      products?: AdminProduct[];
      data?: AdminProduct[];
      pagination?: PaginationMeta;
    }>(`/admin/products?${query.toString()}`);

    const products = raw.data?.products || raw.data?.data || [];
    const pagination = raw.data?.pagination || {
      total: products.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };

    return {
      success: raw.success,
      message: raw.message,
      data: {
        data: products,
        pagination,
      },
    };
  },

  createProduct: async (
    payload: Record<string, unknown>
  ): Promise<ApiResponse<AdminProduct>> => {
    const body: Record<string, unknown> = { ...payload };
    if ("categoryId" in body && !("category" in body)) {
      body.category = body.categoryId;
      delete body.categoryId;
    }
    delete body.slug;
    delete body.sku;
    if ("comparePrice" in body) {
      if (body.comparePrice) {
        body.discountPrice = Number(body.comparePrice);
      }
      delete body.comparePrice;
    }
    if (typeof body.price === "number") {
      body.price = Math.round(body.price);
    }
    if (typeof body.discountPrice === "number") {
      body.discountPrice = Math.round(body.discountPrice);
    }
    if (typeof body.stock === "number") {
      body.stock = Math.round(body.stock);
    }
    if (!body.description || String(body.description).length < 10) {
      body.description = String(body.description || body.title || "Product") + " - Premium authentic SB-Mart product.";
    }

    const raw = await apiFetch<{ product?: AdminProduct } | AdminProduct>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    const data =
      raw.data && "product" in raw.data && raw.data.product
        ? raw.data.product
        : (raw.data as AdminProduct);

    return {
      success: raw.success,
      message: raw.message,
      data,
    };
  },

  updateProduct: async (
    productId: string,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<AdminProduct>> => {
    const body: Record<string, unknown> = { ...payload };
    if ("categoryId" in body && !("category" in body)) {
      body.category = body.categoryId;
      delete body.categoryId;
    }
    delete body.slug;
    delete body.sku;
    if ("comparePrice" in body) {
      if (body.comparePrice) {
        body.discountPrice = Number(body.comparePrice);
      }
      delete body.comparePrice;
    }
    if (typeof body.price === "number") {
      body.price = Math.round(body.price);
    }
    if (typeof body.discountPrice === "number") {
      body.discountPrice = Math.round(body.discountPrice);
    }
    if (typeof body.stock === "number") {
      body.stock = Math.round(body.stock);
    }

    const raw = await apiFetch<{ product?: AdminProduct } | AdminProduct>(
      `/products/${productId}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );
    const data =
      raw.data && "product" in raw.data && raw.data.product
        ? raw.data.product
        : (raw.data as AdminProduct);

    return {
      success: raw.success,
      message: raw.message,
      data,
    };
  },

  deleteProduct: async (productId: string): Promise<ApiResponse<{ id: string }>> => {
    return apiFetch<{ id: string }>(`/products/${productId}`, {
      method: "DELETE",
    });
  },

  updateProductStatus: async (
    productId: string,
    isActive: boolean
  ): Promise<ApiResponse<AdminProduct>> => {
    const raw = await apiFetch<{ product?: AdminProduct } | AdminProduct>(
      `/admin/products/${productId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }
    );
    const data =
      raw.data && "product" in raw.data && raw.data.product
        ? raw.data.product
        : (raw.data as AdminProduct);

    return {
      success: raw.success,
      message: raw.message,
      data,
    };
  },

  updateStock: async (
    productId: string,
    stock: number,
    note?: string
  ): Promise<ApiResponse<AdminProduct>> => {
    const raw = await apiFetch<{ product?: AdminProduct } | AdminProduct>(
      `/admin/products/${productId}/stock`,
      {
        method: "PATCH",
        body: JSON.stringify({ stock, note }),
      }
    );
    const data =
      raw.data && "product" in raw.data && raw.data.product
        ? raw.data.product
        : (raw.data as AdminProduct);

    return {
      success: raw.success,
      message: raw.message,
      data,
    };
  },

  // 4. Categories
  getCategories: async (
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<AdminCategory[]>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });

    const raw = await apiFetch<{
      categories?: AdminCategory[];
      data?: AdminCategory[];
    } | AdminCategory[]>(`/admin/categories?${query.toString()}`);

    let list: AdminCategory[] = [];
    if (Array.isArray(raw.data)) {
      list = raw.data;
    } else if (raw.data && "categories" in raw.data && Array.isArray(raw.data.categories)) {
      list = raw.data.categories;
    } else if (raw.data && "data" in raw.data && Array.isArray(raw.data.data)) {
      list = raw.data.data;
    }

    return {
      success: raw.success,
      message: raw.message,
      data: list,
    };
  },

  createCategory: async (
    payload: Record<string, unknown>
  ): Promise<ApiResponse<AdminCategory>> => {
    const body: Record<string, unknown> = { ...payload };
    if ("parentId" in body && !("parentCategory" in body)) {
      body.parentCategory = body.parentId || null;
      delete body.parentId;
    }
    delete body.slug;

    const raw = await apiFetch<{ category?: AdminCategory } | AdminCategory>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    const data =
      raw.data && "category" in raw.data && raw.data.category
        ? raw.data.category
        : (raw.data as AdminCategory);

    return {
      success: raw.success,
      message: raw.message,
      data,
    };
  },

  updateCategory: async (
    categoryId: string,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<AdminCategory>> => {
    const body: Record<string, unknown> = { ...payload };
    if ("parentId" in body && !("parentCategory" in body)) {
      body.parentCategory = body.parentId || null;
      delete body.parentId;
    }
    delete body.slug;

    let endpoint = `/categories/${categoryId}`;
    if (body.isActive !== undefined && Object.keys(body).length === 1) {
      endpoint = `/admin/categories/${categoryId}/status`;
    }

    const raw = await apiFetch<{ category?: AdminCategory } | AdminCategory>(
      endpoint,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );
    const data =
      raw.data && "category" in raw.data && raw.data.category
        ? raw.data.category
        : (raw.data as AdminCategory);

    return {
      success: raw.success,
      message: raw.message,
      data,
    };
  },

  deleteCategory: async (categoryId: string): Promise<ApiResponse<{ id: string }>> => {
    return apiFetch<{ id: string }>(`/categories/${categoryId}`, {
      method: "DELETE",
    });
  },

  // File Uploads
  presignUpload: async (payload: {
    contentType: string;
    filename?: string;
    fileSize?: number;
  }): Promise<ApiResponse<{ uploadUrl: string; key: string; publicUrl: string; expiresIn: number }>> => {
    return apiFetch<{ uploadUrl: string; key: string; publicUrl: string; expiresIn: number }>(
      "/uploads/presign",
      {
        method: "POST",
        body: JSON.stringify({ contentType: payload.contentType }),
      }
    );
  },

  verifyUpload: async (payload: {
    key: string;
  }): Promise<ApiResponse<{ key: string; publicUrl: string; verified: boolean }>> => {
    return apiFetch<{ key: string; publicUrl: string; verified: boolean }>(
      "/uploads/verify",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  // 5. Orders
  getOrders: async (
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<{ data: AdminOrder[]; pagination: PaginationMeta }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });

    const raw = await apiFetch<{
      orders?: RawOrder[];
      data?: RawOrder[];
      pagination?: PaginationMeta;
    }>(`/admin/orders?${query.toString()}`);

    const rawOrders: RawOrder[] = raw.data?.orders || raw.data?.data || [];
    const pagination = raw.data?.pagination || {
      total: rawOrders.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };

    const orders: AdminOrder[] = rawOrders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      userId: o.userId || (o.customer ? { _id: o.customer._id, name: o.customer.name, email: o.customer.email } : null),
      customer: o.customer,
      shippingAddress: {
        fullName: o.shippingAddress?.fullName || o.shippingAddress?.recipientName || "Guest",
        phoneNumber: o.shippingAddress?.phoneNumber || o.shippingAddress?.phone || "",
        streetAddress: o.shippingAddress?.streetAddress || o.shippingAddress?.addressLine || "",
        city: o.shippingAddress?.city || o.shippingAddress?.district || "",
        postalCode: o.shippingAddress?.postalCode || "",
        country: o.shippingAddress?.country || "Bangladesh",
      },
      items: (o.items || []).map((item) => ({
        productId: item.productId || item.product,
        title: item.title || item.productName || "Product",
        sku: item.sku || "N/A",
        price: item.price ?? item.unitPrice ?? 0,
        quantity: item.quantity ?? 1,
        subtotal: item.subtotal ?? item.lineTotal ?? ((item.price ?? 0) * (item.quantity ?? 1)),
      })),
      itemsPrice: o.itemsPrice ?? o.subtotal ?? 0,
      shippingPrice: o.shippingPrice ?? o.shippingFee ?? 0,
      discountAmount: o.discountAmount ?? 0,
      taxPrice: o.taxPrice ?? 0,
      totalAmount: o.totalAmount ?? o.grandTotal ?? 0,
      orderStatus: o.orderStatus ?? o.status ?? "PENDING",
      paymentStatus: o.paymentStatus ?? "UNPAID",
      paymentMethod: o.paymentMethod ?? "COD",
      paymentDetails: o.paymentDetails,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date(o.createdAt).toISOString(),
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date(o.updatedAt).toISOString(),
    }));

    return {
      success: raw.success,
      message: raw.message,
      data: {
        data: orders,
        pagination,
      },
    };
  },

  getOrderById: async (orderId: string): Promise<ApiResponse<AdminOrder>> => {
    const raw = await apiFetch<{ order?: RawOrder } | RawOrder>(`/admin/orders/${orderId}`);
    const o: RawOrder =
      raw.data && "order" in raw.data && raw.data.order
        ? raw.data.order
        : (raw.data as RawOrder);

    const order: AdminOrder = {
      _id: o._id,
      orderNumber: o.orderNumber,
      userId: o.userId || (o.customer ? { _id: o.customer._id, name: o.customer.name, email: o.customer.email } : null),
      customer: o.customer,
      shippingAddress: {
        fullName: o.shippingAddress?.fullName || o.shippingAddress?.recipientName || "Guest",
        phoneNumber: o.shippingAddress?.phoneNumber || o.shippingAddress?.phone || "",
        streetAddress: o.shippingAddress?.streetAddress || o.shippingAddress?.addressLine || "",
        city: o.shippingAddress?.city || o.shippingAddress?.district || "",
        postalCode: o.shippingAddress?.postalCode || "",
        country: o.shippingAddress?.country || "Bangladesh",
      },
      items: (o.items || []).map((item) => ({
        productId: item.productId || item.product,
        title: item.title || item.productName || "Product",
        sku: item.sku || "N/A",
        price: item.price ?? item.unitPrice ?? 0,
        quantity: item.quantity ?? 1,
        subtotal: item.subtotal ?? item.lineTotal ?? ((item.price ?? 0) * (item.quantity ?? 1)),
      })),
      itemsPrice: o.itemsPrice ?? o.subtotal ?? 0,
      shippingPrice: o.shippingPrice ?? o.shippingFee ?? 0,
      discountAmount: o.discountAmount ?? 0,
      taxPrice: o.taxPrice ?? 0,
      totalAmount: o.totalAmount ?? o.grandTotal ?? 0,
      orderStatus: o.orderStatus ?? o.status ?? "PENDING",
      paymentStatus: o.paymentStatus ?? "UNPAID",
      paymentMethod: o.paymentMethod ?? "COD",
      paymentDetails: o.paymentDetails,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date(o.createdAt).toISOString(),
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date(o.updatedAt).toISOString(),
    };

    return {
      success: raw.success,
      message: raw.message,
      data: order,
    };
  },

  updateOrderStatus: async (
    orderId: string,
    status: string,
    reason?: string
  ): Promise<ApiResponse<AdminOrder>> => {
    const raw = await apiFetch<{ order?: RawOrder } | RawOrder>(
      `/admin/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, reason, note: reason }),
      }
    );
    const o: RawOrder =
      raw.data && "order" in raw.data && raw.data.order
        ? raw.data.order
        : (raw.data as RawOrder);

    const order: AdminOrder = {
      _id: o._id,
      orderNumber: o.orderNumber,
      userId: o.userId || (o.customer ? { _id: o.customer._id, name: o.customer.name, email: o.customer.email } : null),
      customer: o.customer,
      shippingAddress: {
        fullName: o.shippingAddress?.fullName || o.shippingAddress?.recipientName || "Guest",
        phoneNumber: o.shippingAddress?.phoneNumber || o.shippingAddress?.phone || "",
        streetAddress: o.shippingAddress?.streetAddress || o.shippingAddress?.addressLine || "",
        city: o.shippingAddress?.city || o.shippingAddress?.district || "",
        postalCode: o.shippingAddress?.postalCode || "",
        country: o.shippingAddress?.country || "Bangladesh",
      },
      items: (o.items || []).map((item) => ({
        productId: item.productId || item.product,
        title: item.title || item.productName || "Product",
        sku: item.sku || "N/A",
        price: item.price ?? item.unitPrice ?? 0,
        quantity: item.quantity ?? 1,
        subtotal: item.subtotal ?? item.lineTotal ?? ((item.price ?? 0) * (item.quantity ?? 1)),
      })),
      itemsPrice: o.itemsPrice ?? o.subtotal ?? 0,
      shippingPrice: o.shippingPrice ?? o.shippingFee ?? 0,
      discountAmount: o.discountAmount ?? 0,
      taxPrice: o.taxPrice ?? 0,
      totalAmount: o.totalAmount ?? o.grandTotal ?? 0,
      orderStatus: o.orderStatus ?? o.status ?? "PENDING",
      paymentStatus: o.paymentStatus ?? "UNPAID",
      paymentMethod: o.paymentMethod ?? "COD",
      paymentDetails: o.paymentDetails,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date(o.createdAt).toISOString(),
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date(o.updatedAt).toISOString(),
    };

    return {
      success: raw.success,
      message: raw.message,
      data: order,
    };
  },

  // 6. Audit Logs
  getAuditLogs: async (
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<{ data: AdminAuditLog[]; pagination: PaginationMeta }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });

    const raw = await apiFetch<{
      logs?: RawAuditLog[];
      data?: RawAuditLog[];
      pagination?: PaginationMeta;
    }>(`/admin/audit-logs?${query.toString()}`);

    const rawLogs: RawAuditLog[] = raw.data?.logs || raw.data?.data || [];
    const pagination = raw.data?.pagination || {
      total: rawLogs.length,
      page: 1,
      limit: 15,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };

    const logs: AdminAuditLog[] = rawLogs.map((l) => ({
      _id: l._id,
      adminId: l.actorId || l.adminId,
      actorId: l.actorId || l.adminId,
      adminEmail: l.actorEmail || l.adminEmail,
      actorEmail: l.actorEmail || l.adminEmail,
      action: l.action,
      resource: l.resourceType || l.resource || "SYSTEM",
      resourceType: l.resourceType || l.resource || "SYSTEM",
      resourceId: l.resourceId,
      previousState: l.before || l.previousState,
      before: l.before || l.previousState,
      newState: l.after || l.newState,
      after: l.after || l.newState,
      metadata: l.metadata,
      correlationId: l.correlationId,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: typeof l.createdAt === "string" ? l.createdAt : new Date(l.createdAt).toISOString(),
    }));

    return {
      success: raw.success,
      message: raw.message,
      data: {
        data: logs,
        pagination,
      },
    };
  },
};

export const AdminApi = adminApi;
export default adminApi;
