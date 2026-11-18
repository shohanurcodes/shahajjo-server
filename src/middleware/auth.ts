import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { clientOrigins, env } from "../config/env";
import { isAllowedBrowserOrigin, normalizeOrigin } from "../lib/origins";
import type { AuthUser } from "../types";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(urlStr: string) {
  let set = jwksCache.get(urlStr);
  if (!set) {
    set = createRemoteJWKSet(new URL(urlStr), {
      cacheMaxAge: 10 * 60 * 1000,
      cooldownDuration: 30 * 1000,
      timeoutDuration: 5000,
    });
    jwksCache.set(urlStr, set);
  }
  return set;
}

function getCandidateJwksUrls(originHeader?: string): string[] {
  const list = [env.BETTER_AUTH_JWKS_URL];
  const origin = originHeader ? normalizeOrigin(originHeader) : null;

  if (origin && isAllowedBrowserOrigin(origin)) {
    list.push(`${origin}/api/auth/jwks`);
  }

  for (const configuredOrigin of clientOrigins) {
    const normalized = normalizeOrigin(configuredOrigin);
    if (normalized) list.push(`${normalized}/api/auth/jwks`);
  }

  list.push("https://shahajjo-client.vercel.app/api/auth/jwks");
  list.push("http://localhost:3000/api/auth/jwks");

  return Array.from(new Set(list));
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

async function verifyToken(token: string, originHeader?: string): Promise<AuthUser> {
  const candidateUrls = getCandidateJwksUrls(originHeader);
  let lastError: unknown = null;

  for (const jwksUrl of candidateUrls) {
    try {
      const jwks = getJwks(jwksUrl);
      const { payload } = await jwtVerify(token, jwks, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      });

      const id =
        typeof payload.id === "string"
          ? payload.id
          : typeof payload.sub === "string"
            ? payload.sub
            : undefined;
      const email = typeof payload.email === "string" ? payload.email : undefined;

      if (!id || !email) {
        throw new Error("Token is missing required identity claims.");
      }

      return {
        id,
        email,
        name: typeof payload.name === "string" ? payload.name : undefined,
        image: typeof payload.image === "string" ? payload.image : undefined,
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("Invalid token");
}

/** Requires a valid Bearer JWT, otherwise responds with 401. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = readBearerToken(req);

  if (!token) {
    res.status(401).json({ message: "Please sign in to continue." });
    return;
  }

  try {
    const origin =
      req.headers.origin ??
      (typeof req.headers.referer === "string"
        ? normalizeOrigin(req.headers.referer) ?? undefined
        : undefined);
    req.user = await verifyToken(token, origin);
    next();
  } catch {
    res.status(401).json({ message: "Your session expired. Please sign in again." });
  }
}

/** Attaches the user when a valid token is sent, but never blocks public routes. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const origin =
      req.headers.origin ??
      (typeof req.headers.referer === "string"
        ? normalizeOrigin(req.headers.referer) ?? undefined
        : undefined);
    req.user = await verifyToken(token, origin);
  } catch {
    req.user = undefined;
  }
  next();
}
