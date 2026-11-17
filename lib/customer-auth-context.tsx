"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { apiFetch } from "./api";
import type { CustomerUser } from "./customer-api";

interface CustomerAuthContextType {
  user: CustomerUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, turnstileToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
  undefined
);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: CustomerUser }>("/auth/me");
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const fetchUser = async () => {
      try {
        const res = await apiFetch<{ user: CustomerUser }>("/auth/me");
        if (isSubscribed) {
          if (res.data?.user) {
            setUser(res.data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isSubscribed) {
          setUser(null);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    turnstileToken: string = "dummy-turnstile-token"
  ): Promise<boolean> => {
    setError(null);
    try {
      const res = await apiFetch<{ user: CustomerUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      if (res.data?.user) {
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      throw err;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    turnstileToken: string = "dummy-turnstile-token"
  ): Promise<boolean> => {
    setError(null);
    try {
      const res = await apiFetch<{ user: CustomerUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, turnstileToken }),
      });

      if (res.data?.user) {
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiFetch("/auth/logout", { method: "POST" });
      setUser(null);
      setError(null);
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

  const logoutAll = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiFetch("/auth/logout-all", { method: "POST" });
      setUser(null);
      setError(null);
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
    <CustomerAuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        logoutAll,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextType {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error(
      "useCustomerAuth must be used within a CustomerAuthProvider"
    );
  }
  return context;
}
