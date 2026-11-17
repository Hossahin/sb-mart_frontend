"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Script from "next/script";

// Extend global Window interface for Cloudflare Turnstile API
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          cData?: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
          "error-callback"?: (error?: string) => void;
          "expired-callback"?: () => void;
          "timeout-callback"?: () => void;
          tabindex?: number;
          [key: string]: unknown;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
      ready: (callback: () => void) => void;
    };
  }
}

export interface TurnstileWidgetRef {
  /** Resets the Turnstile challenge */
  reset: () => void;
  /** Completely removes the rendered Turnstile widget */
  remove: () => void;
  /** Returns the current Turnstile response token if available */
  getResponse: () => string | undefined;
}

export interface TurnstileWidgetProps {
  /** Callback invoked when the user passes the challenge with a valid token */
  onSuccess: (token: string) => void;
  /** Callback invoked if Turnstile encounters an error */
  onError?: (error?: string) => void;
  /** Callback invoked when the issued challenge token expires */
  onExpire?: () => void;
  /** Callback invoked when the widget challenge is reset or removed */
  onReset?: () => void;
  /** Cloudflare action identifier (e.g. 'login', 'register', 'auth') */
  action?: string;
  /** Widget color theme */
  theme?: "light" | "dark" | "auto";
  /** Widget display size */
  size?: "normal" | "compact" | "flexible";
  /** Optional custom site key override; defaults to NEXT_PUBLIC_TURNSTILE_SITE_KEY */
  siteKey?: string;
  /** Optional CSS class name for container */
  className?: string;
}

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Reusable Cloudflare Turnstile bot protection widget.
 * Features:
 * - Next.js Script async loading with explicit render
 * - Full SSR safety (guards against window access during server rendering)
 * - Imperative reset / remove / getResponse ref handle
 * - Dynamic theme & action configuration
 * - Automatic widget cleanup on unmount
 * - Development fallback when site key is not configured
 */
export const TurnstileWidget = forwardRef<
  TurnstileWidgetRef,
  TurnstileWidgetProps
>(function TurnstileWidget(
  {
    onSuccess,
    onError,
    onExpire,
    onReset,
    action,
    theme = "auto",
    size = "normal",
    siteKey,
    className = "",
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const resolvedSiteKey =
    siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  // Render the Turnstile widget into the container
  const renderWidget = useCallback(() => {
    if (typeof window === "undefined" || !window.turnstile) {
      return;
    }

    if (!containerRef.current || !resolvedSiteKey) {
      return;
    }

    // Clean up any existing widget before re-rendering
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore removal error
      }
      widgetIdRef.current = null;
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: resolvedSiteKey,
        action,
        theme,
        size,
        callback: (token: string) => {
          onSuccess(token);
        },
        "error-callback": (err?: string) => {
          onError?.(err);
        },
        "expired-callback": () => {
          onExpire?.();
        },
        "timeout-callback": () => {
          onExpire?.();
        },
      });

      widgetIdRef.current = id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to render Turnstile widget";
      console.error("[Turnstile] Render error:", message);
      onError?.(message);
    }
  }, [resolvedSiteKey, action, theme, size, onSuccess, onError, onExpire]);

  // Imperative handle for parent components
  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        if (
          typeof window !== "undefined" &&
          window.turnstile &&
          widgetIdRef.current
        ) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (err) {
            console.error("[Turnstile] Reset failed:", err);
          }
        }
        onReset?.();
      },
      remove: () => {
        if (
          typeof window !== "undefined" &&
          window.turnstile &&
          widgetIdRef.current
        ) {
          try {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          } catch (err) {
            console.error("[Turnstile] Remove failed:", err);
          }
        }
        onReset?.();
      },
      getResponse: () => {
        if (
          typeof window !== "undefined" &&
          window.turnstile &&
          widgetIdRef.current
        ) {
          try {
            return window.turnstile.getResponse(widgetIdRef.current);
          } catch {
            return undefined;
          }
        }
        return undefined;
      },
    }),
    [onReset]
  );

  // Re-render when script becomes ready or parameters change
  useEffect(() => {
    if (isScriptReady || (typeof window !== "undefined" && window.turnstile)) {
      renderWidget();
    }
  }, [isScriptReady, renderWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        window.turnstile &&
        widgetIdRef.current
      ) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors on unmount
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  // When site key is missing, render an informative developer placeholder
  if (!resolvedSiteKey) {
    return (
      <div
        className={`rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 ${className}`}
        role="alert"
      >
        <span className="font-semibold">Security Notice:</span> Cloudflare
        Turnstile site key is missing. Set{" "}
        <code className="font-mono font-bold">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>{" "}
        in your frontend environment.
      </div>
    );
  }

  return (
    <>
      <Script
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
        onReady={() => setIsScriptReady(true)}
      />
      <div
        ref={containerRef}
        className={`turnstile-container inline-block min-h-[65px] ${className}`}
        aria-label="Cloudflare Turnstile Verification"
      />
    </>
  );
});

TurnstileWidget.displayName = "TurnstileWidget";
export default TurnstileWidget;
