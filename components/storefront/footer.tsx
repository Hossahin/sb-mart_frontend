import React from "react";
import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs mt-auto">
      {/* Trust Badges */}
      <div className="border-b border-slate-800/60 py-8 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-slate-100">Cash on Delivery</div>
              <div className="text-[11px] text-slate-500">Pay safely when you receive your order</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-slate-100">Fast Express Delivery</div>
              <div className="text-[11px] text-slate-500">Dhaka ৳60 • Nationwide ৳120</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-slate-100">100% Genuine Items</div>
              <div className="text-[11px] text-slate-500">Directly sourced authentic quality</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-slate-100">Free Delivery ৳2,000+</div>
              <div className="text-[11px] text-slate-500">Auto applied during checkout</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center">
              SB
            </div>
            <span className="text-base font-black text-white">SB-Mart E-Commerce</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your trusted single-vendor destination for groceries, household staples, and daily essentials across Bangladesh.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Shop</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/products" className="hover:text-emerald-400 transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-emerald-400 transition-colors">
                Shopping Cart
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:text-emerald-400 transition-colors">
                Checkout
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Customer Care</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/track" className="hover:text-emerald-400 transition-colors">
                Track Order Live
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-emerald-400 transition-colors">
                Order History
              </Link>
            </li>
          </ul>
        </div>

        {/* Operational Policies */}
        <div>
          <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Shipping & COD</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            We deliver exclusively within Bangladesh using authoritative Cash on Delivery. Flat shipping rates: ৳60 for Dhaka division, ৳120 nationwide.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800/80 py-4 text-center text-slate-500 text-[11px]">
        &copy; 2026 SB-Mart E-Commerce. All rights reserved. Single-Vendor Production Architecture.
      </div>
    </footer>
  );
}

export default StorefrontFooter;
