"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth-context";
import { TurnstileWidget, TurnstileWidgetRef } from "@/components/security/turnstile-widget";
import { AlertTriangleIcon, CheckIcon } from "@/components/admin/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, login, loading: authLoading } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // If already authenticated as admin, redirect to /admin immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the security challenge before authorizing.");
      return;
    }

    const tokenToSubmit = turnstileToken;
    // Invalidate state immediately upon submission to prevent reuse
    setTurnstileToken(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password, tokenToSubmit);
      turnstileRef.current?.reset();
      router.push("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed. Please verify credentials.";
      setError(message);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/25">
            SB
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          SB-Mart Admin Center
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Single-Vendor E-Commerce Administrative Gateway
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 flex items-start gap-3">
                <AlertTriangleIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-300 leading-relaxed">{error}</div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                Admin Email
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sb-mart.com"
                  className="block w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Cloudflare Turnstile Verification */}
            <div className="pt-1">
              <TurnstileWidget
                ref={turnstileRef}
                action="admin_login"
                theme="dark"
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                onReset={() => setTurnstileToken(null)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !turnstileToken}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : !turnstileToken ? (
                  <span>Complete Security Challenge</span>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span>Authorize Admin Session</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <Link
              href="/"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              &larr; Back to Storefront
            </Link>
            <span className="text-slate-600 font-mono">Role: admin only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
