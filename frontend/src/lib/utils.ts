import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shared container class for map toolbars (position/gap applied by component) */
export const mapToolbarClassName =
  "z-[1000] flex flex-col gap-0 rounded-lg overflow-hidden border border-border/50 bg-background shadow-md";

/** Shared input style for all text/number/select inputs */
export const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/** Normalize React Query error to a user-facing message string or null */
export function queryErrorToMessage(
  error: unknown,
  fallback: string
): string | null {
  if (error instanceof Error) return error.message;
  if (error) return fallback;
  return null;
}
