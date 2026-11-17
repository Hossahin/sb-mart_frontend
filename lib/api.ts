/**
 * Core API Client for SB-Mart Frontend Subsystems
 * Enforces secure credentials transmission (HTTP-only cookies), centralized error unwrapping,
 * automatic CSRF token management, and seamless short-lived access token renewal (refresh token rotation).
 */

export class ApiClientError extends Error {
  public status: number;
  public errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  errors?: unknown;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// In-memory cache for CSRF token to prevent redundant network requests
let cachedCsrfToken: string | null = null;
let csrfFetchPromise: Promise<string | null> | null = null;

/**
 * Retrieves a cryptographically signed CSRF token from the server, with caching and deduplication.
 */
export async function fetchCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }

  csrfFetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        cachedCsrfToken = data.data?.csrfToken || null;
        return cachedCsrfToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
}

export function clearCachedCsrfToken(): void {
  cachedCsrfToken = null;
}

// Single-flight coordination promise for concurrent 401 refresh calls
let activeRefreshPromise: Promise<boolean> | null = null;

interface ExtendedRequestInit extends RequestInit {
  _isRetry?: boolean;
}

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Universal JSON Fetch Wrapper with automatic HTTP-only cookie inclusion,
 * automated CSRF header attachment, and single-flight token refresh retry.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ExtendedRequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach CSRF token on state-mutating requests
  if (MUTATION_METHODS.has(method) && !headers.has("x-csrf-token")) {
    const csrfToken = await fetchCsrfToken();
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  // Preserve credentials for session cookies
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  try {
    const res = await fetch(url, fetchOptions);
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const payload = isJson ? await res.json() : null;

    // Handle CSRF token expiration or invalidation (HTTP 403 with CSRF error)
    if (res.status === 403 && payload?.message?.toLowerCase().includes("csrf") && !options._isRetry) {
      clearCachedCsrfToken();
      const freshCsrf = await fetchCsrfToken();
      if (freshCsrf) {
        headers.set("x-csrf-token", freshCsrf);
        return apiFetch<T>(endpoint, { ...options, headers, _isRetry: true });
      }
    }

    // Handle Access Token Expiration (HTTP 401) with automatic controlled refresh
    const isAuthRoute =
      endpoint.includes("/auth/login") ||
      endpoint.includes("/auth/register") ||
      endpoint.includes("/auth/refresh") ||
      endpoint.includes("/auth/logout") ||
      endpoint.includes("/auth/csrf");

    if (res.status === 401 && !isAuthRoute && !options._isRetry) {
      if (!activeRefreshPromise) {
        activeRefreshPromise = (async () => {
          try {
            const csrf = await fetchCsrfToken();
            const refreshHeaders: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (csrf) {
              refreshHeaders["x-csrf-token"] = csrf;
            }

            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              credentials: "include",
              headers: refreshHeaders,
            });

            return refreshRes.ok;
          } catch {
            return false;
          } finally {
            activeRefreshPromise = null;
          }
        })();
      }

      const refreshSuccess = await activeRefreshPromise;
      if (refreshSuccess) {
        // Retry the original request once with new cookies
        return apiFetch<T>(endpoint, { ...options, _isRetry: true });
      }
    }

    if (!res.ok) {
      const errorMessage =
        payload?.message ||
        `HTTP Request failed with status ${res.status}: ${res.statusText}`;
      throw new ApiClientError(errorMessage, res.status, payload?.errors);
    }

    return payload as ApiResponse<T>;
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    const message =
      error instanceof Error
        ? error.message
        : "Network connection error. Please verify backend service availability.";
    throw new ApiClientError(message, 0);
  }
}

export default apiFetch;
