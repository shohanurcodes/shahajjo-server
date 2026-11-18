import { clientOrigins } from "../config/env";

/** Returns a canonical origin (scheme + host + port) or null for invalid input. */
export function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Mirrors the CORS allow-list so auth checks never trust an arbitrary Origin header. */
export function isAllowedBrowserOrigin(origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  if (clientOrigins.includes("*")) return true;
  if (clientOrigins.some((allowed) => normalizeOrigin(allowed) === normalized)) {
    return true;
  }
  if (/^https:\/\/.*\.vercel\.app$/.test(normalized)) return true;

  if (process.env.NODE_ENV !== "production") {
    const hostname = new URL(normalized).hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  }

  return false;
}
