"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "./api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
  isActive: boolean;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Verifies authoritative administrative identity against the backend.
   * Calls GET /api/v1/auth/admin-check which validates the HTTP-only cookie
   * and verifies user.role === "admin".
   */
  const refreshAuth = useCallback(async () => {
    try {
      const res = await apiFetch<{
        user: { id: string; name: string; email: string; role: string; isActive: boolean };
      }>("/auth/admin-check");

      if (res.data?.user && res.data.user.role === "admin") {
        setUser(res.data.user as AdminUser);
      } else {
        setUser(null);
      }
    } catch (err: unknown) {
      setUser(null);
      // Only set error if not on login page
      if (!pathname?.includes("/admin/login")) {
        const msg = err instanceof Error ? err.message : "Failed to verify administrator authentication.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    let isSubscribed = true;
    const verifyAuth = async () => {
      try {
        const res = await apiFetch<{
          user: { id: string; name: string; email: string; role: string; isActive: boolean };
        }>("/auth/admin-check");

        if (isSubscribed) {
          if (res.data?.user && res.data.user.role === "admin") {
            setUser(res.data.user as AdminUser);
          } else {
            setUser(null);
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setUser(null);
          if (!pathname?.includes("/admin/login")) {
            const msg =
              err instanceof Error
                ? err.message
                : "Failed to verify administrator authentication.";
            setError(msg);
          }
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isSubscribed = false;
    };
  }, [pathname]);

  /**
   * Admin Login Handler
   * Issues POST /api/v1/auth/login with credentials: include, receiving HTTP-only session cookie.
   */
  const login = async (
    email: string,
    password: string,
    turnstileToken?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Attempt login
      const payload: Record<string, string> = { email, password };
      if (turnstileToken) {
        payload.turnstileToken = turnstileToken;
      }

      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Verify admin role
      const checkRes = await apiFetch<{ user: AdminUser }>("/auth/admin-check");
      if (checkRes.data?.user && checkRes.data.user.role === "admin") {
        setUser(checkRes.data.user);
        router.push("/admin");
        return true;
      } else {
        // Logged in as customer, not admin
        await apiFetch("/auth/logout", { method: "POST" });
        setUser(null);
        setError("Access Denied: This account does not possess administrator privileges.");
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please verify credentials.";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin Logout Handler
   * Calls POST /api/v1/auth/logout to invalidate server-side session, clear the HTTP-only cookie, and redirect to login.
   * If server-side revocation fails, displays error and preserves error state.
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiFetch("/auth/logout", { method: "POST" });
      setUser(null);
      setError(null);
      router.push("/admin/login");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to invalidate session on server. Please try again.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin Global Logout Handler (All Devices)
   */
  const logoutAll = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiFetch("/auth/logout-all", { method: "POST" });
      setUser(null);
      setError(null);
      router.push("/admin/login");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to invalidate all sessions on server. Please try again.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin Password Change Handler
   */
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      setLoading(true);
      await apiFetch("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setUser(null);
      setError(null);
      router.push("/admin/login");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to change password.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: Boolean(user && user.role === "admin"),
        login,
        logout,
        logoutAll,
        changePassword,
        refreshAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

export default AdminAuthProvider;
