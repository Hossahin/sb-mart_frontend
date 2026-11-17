"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { TurnstileWidget, TurnstileWidgetRef } from "@/components/security/turnstile-widget";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const { isAuthenticated, login, loading: authLoading } = useCustomerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(returnUrl);
    }
  }, [authLoading, isAuthenticated, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the security challenge before signing in.");
      return;
    }

    const tokenToSubmit = turnstileToken;
    // Invalidate state immediately upon submission to prevent reuse
    setTurnstileToken(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password, tokenToSubmit);
      turnstileRef.current?.reset();
      router.push(returnUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please check credentials.";
      setError(msg);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            SB
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Customer Login</h1>
          <p className="text-xs text-slate-400">
            Sign in to manage your orders and track active deliveries
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Turnstile Security Challenge */}
          <div className="pt-2">
            <TurnstileWidget
              ref={turnstileRef}
              action="customer_login"
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
              onReset={() => setTurnstileToken(null)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !turnstileToken}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {submitting ? "Signing in..." : !turnstileToken ? "Complete Security Challenge" : "Sign In"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          Don&apos;t have an account yet?{" "}
          <Link
            href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="text-emerald-400 font-bold hover:underline"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </StorefrontShell>
  );
}
