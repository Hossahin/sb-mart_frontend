"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useCart } from "@/lib/cart-context";

export function StorefrontNavbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useCustomerAuth();
  const { itemCount } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      {/* Top Banner */}
      <div className="bg-emerald-500 text-slate-950 text-xs py-1.5 px-4 font-semibold text-center flex items-center justify-center gap-3">
        <span>🇧🇩 Cash on Delivery All Over Bangladesh</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">🚀 Free Delivery on Orders ৳2,000+</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">Dhaka: ৳60 | Outside: ৳120</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
              SB
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">SB-Mart</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block -mt-1">
                E-Commerce
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search authentic grocery, food, essentials..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-full pl-4 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-emerald-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 1114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/products" className="hover:text-emerald-400 transition-colors">
              All Products
            </Link>
            <Link href="/track" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <span>Track Order</span>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors">
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Actions: Cart & Auth */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-xs font-bold hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-black bg-emerald-500 text-slate-950 ml-1">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Dropdown / Buttons */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  <span className="hidden sm:inline">Hello, </span>
                  <span className="text-emerald-400 font-bold">{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                  title="Sign out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-3">
            <form onSubmit={handleSearch} className="w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
              />
            </form>
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-300 pt-2">
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                All Products
              </Link>
              <Link
                href="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                Track Order
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg"
                  >
                    My Account & Orders
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg"
                  >
                    Order History
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default StorefrontNavbar;
