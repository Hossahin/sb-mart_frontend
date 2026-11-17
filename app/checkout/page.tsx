"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useCart } from "@/lib/cart-context";
import { customerApi } from "@/lib/customer-api";
import { formatBDT } from "@/lib/format";

const BANGLADESH_DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  Dhaka: [
    "Dhaka",
    "Gazipur",
    "Narayanganj",
    "Tangail",
    "Kishoreganj",
    "Manikganj",
    "Munshiganj",
    "Narsingdi",
    "Faridpur",
    "Gopalganj",
    "Madaripur",
    "Rajbari",
    "Shariatpur",
  ],
  Chattogram: [
    "Chattogram",
    "Cox's Bazar",
    "Cumilla",
    "Feni",
    "Brahmanbaria",
    "Rangamati",
    "Noakhali",
    "Chandpur",
    "Lakshmipur",
    "Khagrachhari",
    "Bandarban",
  ],
  Rajshahi: [
    "Rajshahi",
    "Bogura",
    "Pabna",
    "Sirajganj",
    "Naogaon",
    "Natore",
    "Chapai Nawabganj",
    "Joypurhat",
  ],
  Khulna: [
    "Khulna",
    "Jashore",
    "Satkhira",
    "Bagerhat",
    "Kushtia",
    "Chuadanga",
    "Meherpur",
    "Jhenaidah",
    "Magura",
    "Narail",
  ],
  Barishal: [
    "Barishal",
    "Patuakhali",
    "Bhola",
    "Pirojpur",
    "Barguna",
    "Jhalakathi",
  ],
  Sylhet: [
    "Sylhet",
    "Moulvibazar",
    "Habiganj",
    "Sunamganj",
  ],
  Rangpur: [
    "Rangpur",
    "Dinajpur",
    "Gaibandha",
    "Kurigram",
    "Lalmonirhat",
    "Nilphamari",
    "Panchagarh",
    "Thakurgaon",
  ],
  Mymensingh: [
    "Mymensingh",
    "Jamalpur",
    "Netrokona",
    "Sherpur",
  ],
};

const DIVISIONS = Object.keys(BANGLADESH_DISTRICTS_BY_DIVISION);

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useCustomerAuth();
  const { cart, subtotal, refreshCart } = useCart();

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [division, setDivision] = useState("Dhaka");
  const [district, setDistrict] = useState("Dhaka");
  const [addressLine, setAddressLine] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When division changes, auto-select first district
  const handleDivisionChange = (newDivision: string) => {
    setDivision(newDivision);
    const districts = BANGLADESH_DISTRICTS_BY_DIVISION[newDivision] || [];
    setDistrict(districts[0] || "");
  };

  const freeShippingThreshold = 2000;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = qualifiesForFreeShipping
    ? 0
    : division.toLowerCase() === "dhaka"
    ? 60
    : 120;
  const grandTotal = subtotal + shippingFee;

  const items = cart?.items || [];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      setError("Please sign in or create an account to place an order.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty. Please add items before checking out.");
      return;
    }

    // Phone validation
    const cleanPhone = phone.trim().replace(/[\s-]/g, "");
    const bdPhoneRegex = /^(?:\+?880|880|0)1[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      setError("Please enter a valid Bangladeshi mobile number (e.g. 01712345678).");
      return;
    }

    if (!addressLine.trim() || addressLine.trim().length < 5) {
      setError("Please provide a detailed delivery address (at least 5 characters).");
      return;
    }

    try {
      setSubmitting(true);
      const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const finalRecipientName = (recipientName || user?.name || "").trim();
      if (!finalRecipientName) {
        setError("Recipient full name is required.");
        return;
      }

      const res = await customerApi.checkout({
        shippingAddress: {
          recipientName: finalRecipientName,
          phone: cleanPhone,
          division,
          district,
          addressLine: addressLine.trim(),
        },
        customerNote: customerNote.trim() || undefined,
        idempotencyKey,
        confirmPriceChange: true,
      });

      if (res.success && res.data?.order) {
        await refreshCart();
        router.push(`/orders/${res.data.order._id}?placed=true`);
      } else {
        throw new Error(res.message || "Failed to place order");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Checkout</h1>
        <p className="text-xs text-slate-400 mb-8">
          Complete your delivery details to confirm your Cash on Delivery order
        </p>

        {/* Authentication Notice if Guest */}
        {!authLoading && !isAuthenticated && (
          <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-amber-300">
              <strong className="block text-sm font-bold text-white mb-0.5">Account Required to Place Order</strong>
              Please sign in to link your delivery address and receive live shipment tracking updates.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login?returnUrl=/checkout"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border border-slate-700"
              >
                Sign In
              </Link>
              <Link
                href="/register?returnUrl=/checkout"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800 p-8 space-y-3">
            <h2 className="text-lg font-bold text-white">Your cart is empty</h2>
            <p className="text-xs text-slate-400">Please add items before proceeding to checkout.</p>
            <Link
              href="/products"
              className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Delivery Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>📍</span> Delivery Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Recipient Name */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Md Tanvir Rahman"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Mobile Number (BD) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-600 focus:border-emerald-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Used for delivery coordination and order tracking
                    </span>
                  </div>

                  {/* Division */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Division *
                    </label>
                    <select
                      value={division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                    >
                      {DIVISIONS.map((div) => (
                        <option key={div} value={div}>
                          {div} Division ({div === "Dhaka" ? "৳60 delivery" : "৳120 delivery"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      District *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                    >
                      {(BANGLADESH_DISTRICTS_BY_DIVISION[division] || []).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Detailed Address Line */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Detailed Street Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="House / Flat no, Road no, Sector, Landmark..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Customer Note */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Special Delivery Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="e.g. Call before arrival, leave with security..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>💵</span> Payment Method
                </h2>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Cash on Delivery (COD)</div>
                    <div className="text-[11px] text-slate-400">
                      Pay with cash when your package is delivered to your doorstep. No prepayment required.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-24">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                Order Review ({items.length} {items.length === 1 ? "item" : "items"})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const productObj = typeof item.product === "object" ? item.product : null;
                  const title = productObj?.title || "Item";
                  const pId = productObj?._id || String(item.product) || String(idx);
                  return (
                    <div key={pId} className="flex justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <span className="text-slate-200 line-clamp-1 font-medium">{title}</span>
                        <span className="text-[11px] text-slate-500">
                          {formatBDT(item.priceSnapshot)} × {item.quantity}
                        </span>
                      </div>
                      <span className="font-bold text-white shrink-0">
                        {formatBDT(item.lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs border-t border-slate-800 pt-4">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{formatBDT(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Shipping Fee ({division})</span>
                  <span className="font-semibold text-white">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase">FREE</span>
                    ) : (
                      formatBDT(shippingFee)
                    )}
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Amount Due</span>
                  <span className="text-xl font-black text-emerald-400">
                    {formatBDT(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="submit"
                disabled={submitting || !isAuthenticated}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Reserving Stock & Placing Order...</span>
                  </>
                ) : (
                  <span>Confirm & Place Order (COD)</span>
                )}
              </button>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                By placing this order, you confirm acceptance of our delivery terms. Stock is reserved atomically in real time.
              </div>
            </div>
          </form>
        )}
      </div>
    </StorefrontShell>
  );
}
