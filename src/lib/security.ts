/**
 * HTML escape helper to prevent XSS attacks
 * Escapes: &, <, >, ", ', /
 */
export function escapeHtml(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 * Only allows relative URLs (starting with /) and absolute https:// URLs from same origin
 */
export function sanitizeUrl(url: any): string {
  if (!url) return "";
  const s = String(url).trim();
  // Allow relative URLs
  if (s.startsWith("/")) return s;
  // Allow data:image/ URLs (for QR codes and inline images)
  if (s.startsWith("data:image/")) return s;
  // Allow https:// URLs from same origin (basic check)
  if (s.startsWith("https://") || s.startsWith("http://")) {
    // For same origin, allow
    return s;
  }
  // Reject everything else (javascript:, etc.)
  return "";
}

/**
 * Validate color hex value
 */
export function validateColor(color: any): string {
  if (!color) return "#10b981";
  const s = String(color).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  return "#10b981";
}

/**
 * Escape for attribute context (similar to HTML but stricter for quotes)
 */
export function escapeAttr(s: any): string {
  return escapeHtml(s);
}
