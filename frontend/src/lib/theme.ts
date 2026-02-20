/**
 * Read a CSS variable from the document (supports light/dark).
 * Use for Leaflet and other non-React styling that should follow theme.
 */
export function getThemeColor(name: string): string {
  if (typeof document === "undefined") return "";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  return value || "";
}
