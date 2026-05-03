// lib/auth/session.ts
//
// Session = JWT signed with HS256, stored in an httpOnly Secure cookie.
// Server-side helpers to read/write it. No NextAuth required.
//
// Why JWT instead of DB sessions: this app is small, you don't have logout-
// everywhere or session revocation requirements, and JWT means zero DB hits
// for auth on every request. If you add "force logout all devices" later,
// add a `token_version` column to Users and include it in the payload.

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";

const COOKIE_NAME = "session";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEV_FALLBACK_SECRET = "local-dev-auth-secret";

export interface SessionPayload {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

function getSecret() {
  const configuredSecret = process.env.AUTH_SECRET;
  if (configuredSecret) {
    return new TextEncoder().encode(configuredSecret);
  }

  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }

  throw new Error("AUTH_SECRET env var is required");
}

// ─── token helpers ──────────────────────────────────────────────────────────

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    // jose returns `unknown`; narrow it.
    if (
      typeof payload.user_id === "number" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      typeof payload.is_admin === "boolean"
    ) {
      return {
        user_id: payload.user_id,
        email: payload.email,
        name: payload.name,
        is_admin: payload.is_admin,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── cookie helpers (server-side) ───────────────────────────────────────────

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Read the current session from cookies. Use in API routes and server
 * components. Returns null if not signed in or token is invalid/expired.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Throws-style helpers for API routes. Call at the top of any handler that
 * requires auth. Throwing keeps the call site one line.
 */
export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError(401, "Sign in required");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (!session.is_admin) throw new AuthError(403, "Admin access required");
  return session;
}

// ─── password helpers ───────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Detects whether a stored password is a bcrypt hash (starts with $2a/$2b/$2y).
 * Lets you support a smooth migration: if the stored value is plaintext (legacy
 * seed data), accept the login, hash on the fly, and update the row.
 */
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}
