"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ProductCard } from "@/components/storefront/product-card";
import { customerApi, CustomerProduct, CustomerCategory } from "@/lib/customer-api";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<CustomerProduct[]>([]);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          customerApi.getProducts({ limit: 8 }),
          customerApi.getCategories(),
        ]);
        if (prodRes.success && prodRes.data) {
          setFeaturedProducts(prodRes.data.products);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data.categories);
        }
      } catch (err) {
        console.error("Failed to load storefront data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <StorefrontShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Authentic Daily Grocery & Staples</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Fast, Reliable Delivery <br className="hidden sm:inline" />
              <span className="text-emerald-400">Across Bangladesh</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Order fresh pantry essentials, rice, oils, and packaged foods. Enjoy guaranteed Cash on Delivery, flat shipping rates, and free delivery on orders ৳2,000+.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Browse All Products
              </Link>
              <Link
                href="/track"
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700 active:scale-[0.98]"
              >
                Track Your Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      {categories.length > 0 && (
        <section className="py-8 border-b border-slate-800/80 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Explore Categories
              </h2>
              <Link href="/products" className="text-xs font-semibold text-emerald-400 hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {categories.slice(0, 10).map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat._id}`}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-300 hover:text-white whitespace-nowrap transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Featured Catalog Items
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative server pricing and real-time inventory reservation
              </p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <span>See Full Catalog</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800 p-8">
              <p className="text-slate-400 text-sm">No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Single-Vendor Guarantee Banner */}
      <section className="py-12 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Single-Vendor Assurance
              </span>
              <h3 className="text-2xl font-black text-white">
                Zero Third-Party Sellers. Guaranteed Authenticity.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Every item is directly inspected, stocked, and packaged at our central warehouse. You get consistent quality, accurate weights, and genuine products every time.
              </p>
            </div>
            <Link
              href="/products"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 shadow-md"
            >
              Shop Catalog Now
            </Link>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
