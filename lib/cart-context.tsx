"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { customerApi, CustomerCart } from "./customer-api";

interface CartContextType {
  cart: CustomerCart | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  calculateShippingFee: (division: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const res = await customerApi.getCart();
      if (res.success && res.data?.cart) {
        setCart(res.data.cart);
      }
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const loadCart = async () => {
      try {
        const res = await customerApi.getCart();
        if (isSubscribed && res.success && res.data?.cart) {
          setCart(res.data.cart);
        }
      } catch {
        if (isSubscribed) {
          setCart(null);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const addToCart = async (productId: string, quantity: number = 1): Promise<void> => {
    setError(null);
    try {
      const res = await customerApi.addToCart(productId, quantity);
      if (res.success && res.data?.cart) {
        setCart(res.data.cart);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add item to cart";
      setError(msg);
      throw err;
    }
  };

  const updateQuantity = async (productId: string, quantity: number): Promise<void> => {
    setError(null);
    try {
      const res = await customerApi.updateCartItem(productId, quantity);
      if (res.success && res.data?.cart) {
        setCart(res.data.cart);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update item quantity";
      setError(msg);
      throw err;
    }
  };

  const removeFromCart = async (productId: string): Promise<void> => {
    setError(null);
    try {
      const res = await customerApi.removeFromCart(productId);
      if (res.success && res.data?.cart) {
        setCart(res.data.cart);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove item from cart";
      setError(msg);
      throw err;
    }
  };

  const clearCart = async (): Promise<void> => {
    setError(null);
    try {
      const res = await customerApi.clearCart();
      if (res.success && res.data?.cart) {
        setCart(res.data.cart);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to clear cart";
      setError(msg);
      throw err;
    }
  };

  const itemCount = cart?.items
    ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  const subtotal = cart?.subtotal || 0;

  const calculateShippingFee = (division: string): number => {
    if (subtotal >= 2000) return 0; // Free shipping threshold in BDT
    if (!division) return 60;
    const clean = division.trim().toLowerCase();
    if (clean === "dhaka") return 60;
    return 120;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        calculateShippingFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
