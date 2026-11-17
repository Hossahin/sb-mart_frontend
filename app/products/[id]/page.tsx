"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { customerApi, CustomerProduct } from "@/lib/customer-api";
import { formatBDT } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

interface PageProps {
  params: Promise<{ id: string }>;
}

function ProductDetailContent({ params }: PageProps) {
  const { id } = use(params);

  const { addToCart } = useCart();
  const [product, setProduct] = useState<CustomerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await customerApi.getProductByIdOrSlug(id);
        if (res.success && res.data?.product) {
          setProduct(res.data.product);
          const firstImg = res.data.product.images?.[0];
          if (firstImg) {
            setSelectedImage(typeof firstImg === "string" ? firstImg : firstImg.url);
          }
        } else {
          setError("Product not found");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <StorefrontShell>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs">Loading product details...</p>
        </div>
      </StorefrontShell>
    );
  }

  if (error || !product) {
    return (
      <StorefrontShell>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Product Not Found</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {error || "The requested item is unavailable or does not exist."}
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
          >
            Back to Catalog
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : "General";

  const effectivePrice =
    product.discountPrice !== undefined &&
    product.discountPrice !== null &&
    product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  const hasDiscount = effectivePrice < product.price;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock || adding) return;
    try {
      setAdding(true);
      await addToCart(product._id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add item to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
          <Link href="/" className="hover:text-emerald-400">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-emerald-400">
            Products
          </Link>
          <span>/</span>
          <span className="text-slate-200 truncate max-w-xs">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center">
              {selectedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-600">
                  <div className="text-5xl mb-2">📦</div>
                  <span className="text-xs font-medium">No Image Available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, i) => {
                  const url = typeof img === "string" ? img : img.url;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(url)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImage === url
                          ? "border-emerald-500 scale-105"
                          : "border-slate-800 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Product Info & Actions */}
          <div className="space-y-6">
            <div>
              <div className="inline-block px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 mb-2">
                {categoryName}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-400">
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span className="text-slate-500">Verified Authentic</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                {formatBDT(effectivePrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-500 line-through">
                    {formatBDT(product.price)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[11px] font-bold">
                    Save {Math.round(((product.price - effectivePrice) / product.price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-300">Availability:</span>
              {isOutOfStock ? (
                <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                  Out of Stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  Low Stock — Only {product.stock} units remaining
                </span>
              ) : (
                <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  In Stock ({product.stock} available)
                </span>
              )}
            </div>

            {/* Quantity Selector & Add to Cart */}
            {!isOutOfStock && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-800 rounded-lg bg-slate-950">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-3.5 py-2 text-slate-400 hover:text-white disabled:opacity-30 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-mono font-bold text-white text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="px-3.5 py-2 text-slate-400 hover:text-white disabled:opacity-30 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      added
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                    }`}
                  >
                    {adding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : added ? (
                      <>
                        <span>✓ Added to Cart ({quantity})</span>
                      </>
                    ) : (
                      <>
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Shipping & COD Specs */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <span>🚚 Shipping Details & COD Guarantee:</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 pl-4 list-disc">
                <li>Payment: Authoritative <strong>Cash on Delivery (COD)</strong> at your doorstep.</li>
                <li>Delivery Fee: <strong>৳60</strong> for Dhaka, <strong>৳120</strong> nationwide.</li>
                <li>Orders of <strong>৳2,000 or more qualify for FREE delivery</strong>.</li>
              </ul>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h3 className="font-bold text-white text-sm">Product Description</h3>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <StorefrontShell>
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
            <p>Loading product details...</p>
          </div>
        </StorefrontShell>
      }
    >
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
