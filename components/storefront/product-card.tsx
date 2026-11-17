"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import type { CustomerProduct } from "@/lib/customer-api";

interface ProductCardProps {
  product: CustomerProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const primaryImage =
    product.images && product.images.length > 0
      ? typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0].url
      : null;

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : "General";

  const effectivePrice =
    product.discountPrice !== undefined && product.discountPrice !== null && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  const hasDiscount = effectivePrice < product.price;

  const isOutOfStock = product.stock <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || adding) return;

    try {
      setAdding(true);
      await addToCart(product._id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add item to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-xl hover:shadow-emerald-500/5">
      {/* Product Image */}
      <Link href={`/products/${product._id}`} className="relative block aspect-square bg-slate-950 overflow-hidden">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
            <svg className="w-12 h-12 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-slate-500 font-medium mt-1">No Image</span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
            SALE
          </div>
        )}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
            Out of Stock
          </div>
        ) : product.stock <= 5 ? (
          <div className="absolute top-2 right-2 bg-amber-500/20 backdrop-blur text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
            Only {product.stock} left
          </div>
        ) : null}
      </Link>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="text-[11px] font-medium text-slate-400 mb-1">
            {categoryName}
          </div>
          <Link
            href={`/products/${product._id}`}
            className="font-bold text-slate-100 text-sm hover:text-emerald-400 line-clamp-2 transition-colors"
          >
            {product.title}
          </Link>
        </div>

        <div>
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-black text-white">
              {formatBDT(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-500 line-through">
                {formatBDT(product.price)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock || adding}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isOutOfStock
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : added
                ? "bg-emerald-500 text-slate-950"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-[0.98]"
            }`}
          >
            {adding ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : added ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Added to Cart</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
