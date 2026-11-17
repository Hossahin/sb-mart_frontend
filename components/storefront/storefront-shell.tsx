"use client";

import React, { ReactNode } from "react";
import { StorefrontNavbar } from "./navbar";
import { StorefrontFooter } from "./footer";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden w-full max-w-full">
      <StorefrontNavbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      <StorefrontFooter />
    </div>
  );
}

export default StorefrontShell;
