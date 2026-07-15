/**
 * Auth utilities — password hashing and JWT session tokens.
 * Uses bcryptjs (portable, no native deps) and jose (modern JWT).
 */
import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const BCRYPT_ROUNDS = 10;

/** Secret for signing session tokens. Must be set in production. */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me-in-production";
  return new TextEncoder().encode(secret);
}

/** Session token payload */
export interface SessionPayload {
  userId: string;
  email: string;
}

// ---- Password ----

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}

// ---- JWT Tokens ----

const SESSION_EXPIRY = "7d";

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    // Validate shape
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string"
    ) {
      return { userId: payload.userId, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}
