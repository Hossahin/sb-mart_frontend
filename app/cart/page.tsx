"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { useCart } from "@/lib/cart-context";
import { formatBDT } from "@/lib/format";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const [selectedDivision, setSelectedDivision] = useState("Dhaka");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const freeShippingThreshold = 2000;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const shippingFee = qualifiesForFreeShipping
    ? 0
    : selectedDivision.toLowerCase() === "dhaka"
    ? 60
    : 120;

  const grandTotal = subtotal + shippingFee;

  const handleUpdate = async (productId: string, newQty: number) => {
    try {
      setUpdatingId(productId);
      if (newQty <= 0) {
        await removeFromCart(productId);
      } else {
        await updateQuantity(productId, newQty);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      setUpdatingId(productId);
      await removeFromCart(productId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  const items = cart?.items || [];

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Shopping Cart</h1>
        <p className="text-xs text-slate-400 mb-8">
          Review your selected items and verify your server-authoritative totals
        </p>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading your cart items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-4">
            <div className="text-5xl">🛒</div>
            <h2 className="text-xl font-bold text-white">Your Shopping Cart is Empty</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t added any items to your cart yet. Explore our fresh inventory and authentic staples!
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free Shipping Alert Banner */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  {qualifiesForFreeShipping ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span>🎉</span> You unlocked FREE shipping nationwide!
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      Add <strong className="text-emerald-400">{formatBDT(amountNeededForFreeShipping)}</strong> more to get <strong>FREE delivery</strong>
                    </span>
                  )}
                  <span className="text-slate-400">{freeShippingProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
                {items.map((item) => {
                  const productObj = typeof item.product === "object" ? item.product : null;
                  const productId = item.productId || productObj?._id || (item.product as string);
                  const title = item.title || productObj?.title || "Product Item";
                  const image = item.image || (productObj?.images?.[0]
                    ? typeof productObj.images[0] === "string"
                      ? productObj.images[0]
                      : productObj.images[0].url
                    : null);
                  const unitPrice = item.unitPrice ?? item.priceSnapshot ?? 0;
                  const lineTotal = item.itemSubtotal ?? item.lineTotal ?? 0;
                  const isBusy = updatingId === productId;

                  return (
                    <div
                      key={productId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">📦</span>
                          )}
                        </div>

                        {/* Title & Unit Price */}
                        <div className="min-w-0">
                          <Link
                            href={`/products/${productId}`}
                            className="font-bold text-white text-sm hover:text-emerald-400 line-clamp-1 transition-colors"
                          >
                            {title}
                          </Link>
                          <div className="text-xs text-slate-400 mt-1">
                            {formatBDT(unitPrice)} each
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-slate-800 rounded-lg bg-slate-950">
                          <button
                            onClick={() => handleUpdate(productId, item.quantity - 1)}
                            disabled={isBusy}
                            className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-mono font-bold text-white text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdate(productId, item.quantity + 1)}
                            disabled={isBusy}
                            className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="font-bold text-white text-sm text-right min-w-[80px]">
                          {formatBDT(lineTotal)}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(productId)}
                          disabled={isBusy}
                          className="text-slate-500 hover:text-rose-400 p-1 text-xs transition-colors"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear Cart Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => clearCart()}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-semibold"
                >
                  Clear Entire Cart
                </button>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-24">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                Order Summary
              </h2>

              {/* Estimate Shipping by Division */}
              <div className="space-y-2 text-xs">
                <label className="block text-slate-300 font-semibold">
                  Delivery Destination
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="Dhaka">Dhaka Division (৳60 delivery)</option>
                  <option value="Chattogram">Chattogram Division (৳120 delivery)</option>
                  <option value="Rajshahi">Rajshahi Division (৳120 delivery)</option>
                  <option value="Khulna">Khulna Division (৳120 delivery)</option>
                  <option value="Barishal">Barishal Division (৳120 delivery)</option>
                  <option value="Sylhet">Sylhet Division (৳120 delivery)</option>
                  <option value="Rangpur">Rangpur Division (৳120 delivery)</option>
                  <option value="Mymensingh">Mymensingh Division (৳120 delivery)</option>
                </select>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs border-t border-slate-800 pt-4">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{formatBDT(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-white">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase">FREE</span>
                    ) : (
                      formatBDT(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Payment Method</span>
                  <span className="font-semibold text-emerald-400">Cash on Delivery (COD)</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Grand Total</span>
                  <span className="text-xl font-black text-emerald-400">
                    {formatBDT(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <span>&rarr;</span>
              </Link>

              <div className="text-[11px] text-slate-500 text-center">
                🔒 Protected by SB-Mart Atomic Concurrency Reservation
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
