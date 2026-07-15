import { verifySessionToken } from "~/lib/auth";
import { sql } from "~/db";

/** Extract and verify the user ID from the session cookie. */
export async function getUserId(request: Request): Promise<string | null> {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
  const token = match?.[1];
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.userId ?? null;
}

/** Ensure the user has a journal; returns the journal id. */
export async function ensureJournal(userId: string): Promise<string> {
  const journals = await sql()`
    SELECT id FROM journals WHERE user_id = ${userId} ORDER BY created_at LIMIT 1
  `;
  if (journals.length > 0) return (journals[0] as { id: string }).id;

  const created = await sql()`
    INSERT INTO journals (user_id, title)
    VALUES (${userId}, 'My Journal')
    RETURNING id
  `;
  return (created[0] as { id: string }).id;
}
