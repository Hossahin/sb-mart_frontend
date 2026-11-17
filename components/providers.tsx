"use client";

import React, { ReactNode } from "react";
import { CustomerAuthProvider } from "@/lib/customer-auth-context";
import { CartProvider } from "@/lib/cart-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthProvider>
      <CartProvider>{children}</CartProvider>
    </CustomerAuthProvider>
  );
}

export default Providers;
