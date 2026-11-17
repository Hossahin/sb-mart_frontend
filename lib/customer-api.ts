/**
 * Public Customer Storefront API Client for SB-Mart
 * Communicates with backend endpoints for catalog browsing, cart operations,
 * atomic checkout pipeline, customer orders, and tracking.
 */

import { apiFetch, ApiResponse } from "./api";

// ============================================================================
// DATA MODELS
// ============================================================================

export interface ProductImage {
  url: string;
  key?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface CustomerProduct {
  _id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  price: number; // Integer BDT
  discountPrice?: number | null; // Integer BDT
  stock: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  images: Array<ProductImage | string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: {
    _id: string;
    name: string;
    slug: string;
  } | string | null;
  isActive: boolean;
  order?: number;
  image?: string;
}

export interface CategoryTreeNode extends CustomerCategory {
  children?: CategoryTreeNode[];
}

export interface CustomerCartItem {
  productId?: string;
  product?: {
    _id: string;
    title: string;
    slug: string;
    sku?: string;
    price: number;
    discountPrice?: number | null;
    images?: Array<{ url: string } | string>;
    stock: number;
  } | string;
  title?: string;
  slug?: string;
  image?: string;
  quantity: number;
  priceSnapshot?: number;
  unitPrice?: number;
  lineTotal?: number;
  itemSubtotal?: number;
}

export interface CustomerCart {
  _id: string;
  items: CustomerCartItem[];
  subtotal: number;
  status: string;
  user?: string;
  guestSessionId?: string;
  expiresAt?: string;
}

export interface CustomerShippingAddress {
  recipientName: string;
  phone: string;
  division: string;
  district: string;
  addressLine: string;
}

export interface CustomerOrderItem {
  product: string;
  productName: string;
  productSlug?: string;
  sku?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  customer?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  items: CustomerOrderItem[];
  shippingAddress: CustomerShippingAddress;
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  paymentMethod: "COD";
  stockRestored?: boolean;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  isActive: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

// ============================================================================
// API CLIENT METHODS
// ============================================================================

export const customerApi = {
  // 1. Catalog Products
  getProducts: async (
    params: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      minPrice?: number;
      maxPrice?: number;
    } = {}
  ): Promise<ApiResponse<{ products: CustomerProduct[]; pagination: PaginationMeta }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });

    const raw = await apiFetch<{
      products?: CustomerProduct[];
      data?: CustomerProduct[];
      pagination?: PaginationMeta;
    }>(`/products?${query.toString()}`);

    const products = raw.data?.products || raw.data?.data || [];
    const pagination = raw.data?.pagination || {
      total: products.length,
      page: 1,
      limit: 12,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };

    return {
      success: raw.success,
      message: raw.message,
      data: { products, pagination },
    };
  },

  getProductByIdOrSlug: async (
    identifier: string
  ): Promise<ApiResponse<{ product: CustomerProduct }>> => {
    return apiFetch<{ product: CustomerProduct }>(`/products/${encodeURIComponent(identifier)}`);
  },

  // 2. Categories
  getCategories: async (): Promise<ApiResponse<{ categories: CustomerCategory[] }>> => {
    const raw = await apiFetch<{ categories?: CustomerCategory[]; data?: CustomerCategory[] }>(
      "/categories"
    );
    const categories = raw.data?.categories || raw.data?.data || [];
    return {
      success: raw.success,
      message: raw.message,
      data: { categories },
    };
  },

  getCategoryTree: async (): Promise<ApiResponse<{ categories: CategoryTreeNode[] }>> => {
    const raw = await apiFetch<{ categories?: CategoryTreeNode[]; data?: CategoryTreeNode[] }>(
      "/categories/tree"
    );
    const categories = raw.data?.categories || raw.data?.data || [];
    return {
      success: raw.success,
      message: raw.message,
      data: { categories },
    };
  },

  // 3. Cart Operations
  getCart: async (): Promise<ApiResponse<{ cart: CustomerCart }>> => {
    const raw = await apiFetch<{ cart?: CustomerCart } | CustomerCart>("/cart");
    const cart =
      raw.data && "cart" in raw.data && raw.data.cart
        ? raw.data.cart
        : (raw.data as CustomerCart);
    return {
      success: raw.success,
      message: raw.message,
      data: { cart },
    };
  },

  addToCart: async (
    productId: string,
    quantity: number = 1
  ): Promise<ApiResponse<{ cart: CustomerCart }>> => {
    const raw = await apiFetch<{ cart?: CustomerCart } | CustomerCart>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
    const cart =
      raw.data && "cart" in raw.data && raw.data.cart
        ? raw.data.cart
        : (raw.data as CustomerCart);
    return {
      success: raw.success,
      message: raw.message,
      data: { cart },
    };
  },

  updateCartItem: async (
    productId: string,
    quantity: number
  ): Promise<ApiResponse<{ cart: CustomerCart }>> => {
    const raw = await apiFetch<{ cart?: CustomerCart } | CustomerCart>(
      `/cart/items/${encodeURIComponent(productId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }
    );
    const cart =
      raw.data && "cart" in raw.data && raw.data.cart
        ? raw.data.cart
        : (raw.data as CustomerCart);
    return {
      success: raw.success,
      message: raw.message,
      data: { cart },
    };
  },

  removeFromCart: async (
    productId: string
  ): Promise<ApiResponse<{ cart: CustomerCart }>> => {
    const raw = await apiFetch<{ cart?: CustomerCart } | CustomerCart>(
      `/cart/items/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
      }
    );
    const cart =
      raw.data && "cart" in raw.data && raw.data.cart
        ? raw.data.cart
        : (raw.data as CustomerCart);
    return {
      success: raw.success,
      message: raw.message,
      data: { cart },
    };
  },

  clearCart: async (): Promise<ApiResponse<{ cart: CustomerCart }>> => {
    const raw = await apiFetch<{ cart?: CustomerCart } | CustomerCart>("/cart", {
      method: "DELETE",
    });
    const cart =
      raw.data && "cart" in raw.data && raw.data.cart
        ? raw.data.cart
        : (raw.data as CustomerCart);
    return {
      success: raw.success,
      message: raw.message,
      data: { cart },
    };
  },

  // 4. Checkout Pipeline
  checkout: async (payload: {
    shippingAddress: CustomerShippingAddress;
    customerNote?: string;
    idempotencyKey?: string;
    confirmPriceChange?: boolean;
  }): Promise<ApiResponse<{ order: CustomerOrder; isIdempotentReplay?: boolean }>> => {
    return apiFetch<{ order: CustomerOrder; isIdempotentReplay?: boolean }>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 5. Customer Orders
  getCustomerOrders: async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<ApiResponse<{ orders: CustomerOrder[]; pagination: PaginationMeta }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    });

    const raw = await apiFetch<{
      orders?: CustomerOrder[];
      pagination?: PaginationMeta;
    }>(`/orders?${query.toString()}`);

    const orders = raw.data?.orders || [];
    const pagination = raw.data?.pagination || {
      total: orders.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };

    return {
      success: raw.success,
      message: raw.message,
      data: { orders, pagination },
    };
  },

  getCustomerOrderById: async (
    orderId: string
  ): Promise<ApiResponse<{ order: CustomerOrder }>> => {
    return apiFetch<{ order: CustomerOrder }>(`/orders/${encodeURIComponent(orderId)}`);
  },

  cancelCustomerOrder: async (
    orderId: string
  ): Promise<ApiResponse<{ order: CustomerOrder }>> => {
    return apiFetch<{ order: CustomerOrder }>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "PATCH",
    });
  },

  // 6. Public Order Tracking
  trackOrder: async (payload: {
    orderNumber: string;
    phone: string;
  }): Promise<ApiResponse<{ order: CustomerOrder }>> => {
    return apiFetch<{ order: CustomerOrder }>("/orders/track", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 7. Customer Auth
  getMe: async (): Promise<ApiResponse<{ user: CustomerUser }>> => {
    return apiFetch<{ user: CustomerUser }>("/auth/me");
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return apiFetch<null>("/auth/logout", {
      method: "POST",
    });
  },
};

export default customerApi;
