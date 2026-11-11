import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";

const COOKIE_NAME = "admin_token";
// HMAC secret - in production set via env var. Fallback for dev only.
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || "activities-system-dev-secret-key-change-in-production-2026";

/**
 * Generate a signed admin token (HMAC).
 * Format: adminId:expiry:signature
 * - signature = HMAC-SHA256(secret, adminId:expiry)
 */
export function generateAdminToken(adminId: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${adminId}:${expiry}`;
  const signature = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
  // Use base64url (no +, /, =) for URL safety
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

/**
 * Verify and decode a signed admin token.
 * Returns adminId if valid (signature matches + not expired), null otherwise.
 * Supports both new signed tokens and legacy unsigned tokens (for backward compat, but legacy tokens get rejected in production).
 */
function verifyAdminToken(token: string): string | null {
  if (!token) return null;

  // Try signed token format (base64url)
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length === 3) {
      const [adminId, expiryStr, signature] = parts;
      const expiry = parseInt(expiryStr, 10);

      // Check expiry
      if (isNaN(expiry) || Date.now() > expiry) {
        return null;
      }

      // Verify signature
      const expectedSig = createHmac("sha256", TOKEN_SECRET).update(`${adminId}:${expiry}`).digest("hex");
      if (signature.length !== expectedSig.length) {
        return null;
      }
      // Timing-safe comparison to prevent timing attacks
      try {
        if (timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSig, "hex"))) {
          return adminId;
        }
      } catch {
        return null;
      }
    }
  } catch {}

  // Reject legacy unsigned tokens in production (security hardening)
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  // In development, allow legacy tokens for backward compat
  try {
    const decoded = Buffer.from(token, "hex").toString("utf-8");
    if (decoded.includes(":")) {
      const adminId = decoded.split(":")[0];
      if (adminId) return adminId;
    }
  } catch {}

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    if (decoded.includes(":")) {
      return decoded.split(":")[0] || null;
    }
  } catch {}

  return null;
}

/**
 * Get the admin ID from the cookie. Returns null if not authenticated.
 */
export async function getAdminId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

/**
 * Check if the current request is from an authenticated admin.
 */
export async function checkAdmin(): Promise<boolean> {
  const adminId = await getAdminId();
  if (!adminId) return false;

  try {
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    return !!admin;
  } catch {
    return false;
  }
}
