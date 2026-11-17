"use client";

import React, { useEffect } from "react";
import { AlertTriangleIcon, CloseIcon } from "./icons";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const displayText = description || message || "";
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  let btnColor = "bg-zinc-900 hover:bg-zinc-800 text-white";
  if (variant === "danger") {
    btnColor = "bg-rose-600 hover:bg-rose-700 text-white";
  } else if (variant === "warning") {
    btnColor = "bg-amber-600 hover:bg-amber-700 text-white";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden transform transition-all scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {variant === "danger" || variant === "warning" ? (
                <div
                  className={`p-2.5 rounded-full ${
                    variant === "danger"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  <AlertTriangleIcon className="w-5 h-5" />
                </div>
              ) : null}
              <h3
                id="modal-title"
                className="text-lg font-semibold text-zinc-900 leading-6"
              >
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-lg"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            {displayText}
          </p>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-xs flex items-center space-x-2 disabled:opacity-50 ${btnColor}`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmLabel}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
