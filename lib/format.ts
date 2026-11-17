/**
 * Bangladeshi Taka Currency and Date/Time Formatting Utilities
 */

/**
 * Formats an integer BDT amount into localized currency representation (e.g. ৳1,500).
 */
export function formatBDT(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "৳0";
  }
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("BDT", "৳").trim();
}

/**
 * Formats a Date object or ISO string into a human-readable Bangladesh standard date and time.
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formats a date into a short date string (e.g. 16 Nov 2026).
 */
export function formatDateOnly(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
