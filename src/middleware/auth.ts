import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";
import type { AuthUser } from "../types";

const jwks = createRemoteJWKSet(new URL(env.BETTER_AUTH_JWKS_URL), {
  cacheMaxAge: 10 * 60 * 1000,
  cooldownDuration: 30 * 1000,
  timeoutDuration: 5000,
});

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  const id =
    typeof payload.id === "string" ? payload.id : typeof payload.sub === "string" ? payload.sub : undefined;
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
}

/** Requires a valid Bearer JWT, otherwise responds with 401. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = readBearerToken(req);

  if (!token) {
    res.status(401).json({ message: "Please sign in to continue." });
    return;
  }

  try {
    req.user = await verifyToken(token);
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
    req.user = await verifyToken(token);
  } catch {
    req.user = undefined;
  }
  next();
}
