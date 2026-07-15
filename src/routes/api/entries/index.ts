import { createAPIFileRoute } from "@tanstack/react-start/api";
import { verifySessionToken } from "~/lib/auth";
import { sql } from "~/db";

/**
 * GET /api/entries — list entries for the authenticated user's journal
 * POST /api/entries — create a new entry
 */

async function getUserId(request: Request): Promise<string | null> {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
  const token = match?.[1];
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.userId ?? null;
}

/** Ensure the user has a journal; returns the journal id. */
async function ensureJournal(userId: string): Promise<string> {
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

export const APIRoute = createAPIFileRoute("/api/entries")({
  // List entries
  GET: async ({ request }) => {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const journalId = await ensureJournal(userId);
      const entries = await sql()`
        SELECT id, journal_id, content, font, stickers, is_voice, created_at, updated_at
        FROM entries
        WHERE journal_id = ${journalId}
        ORDER BY created_at DESC
      `;

      return Response.json({
        entries: (entries as Array<Record<string, unknown>>).map((e) => ({
          ...e,
          created_at: String(e.created_at),
          updated_at: String(e.updated_at),
        })),
      });
    } catch (err) {
      console.error("List entries error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // Create entry
  POST: async ({ request }) => {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { content, font, stickers, is_voice } = (await request.json()) as {
        content?: string;
        font?: string;
        stickers?: unknown[];
        is_voice?: boolean;
      };

      if (!content || typeof content !== "string") {
        return Response.json({ error: "Content is required" }, { status: 400 });
      }

      const journalId = await ensureJournal(userId);

      const rows = await sql()`
        INSERT INTO entries (journal_id, user_id, content, font, stickers, is_voice)
        VALUES (${journalId}, ${userId}, ${content}, ${font ?? "inter"}, ${JSON.stringify(stickers ?? [])}::jsonb, ${is_voice ?? false})
        RETURNING id, journal_id, content, font, stickers, is_voice, created_at, updated_at
      `;

      const entry = rows[0] as Record<string, unknown>;

      return Response.json(
        {
          entry: {
            ...entry,
            created_at: String(entry.created_at),
            updated_at: String(entry.updated_at),
          },
        },
        { status: 201 },
      );
    } catch (err) {
      console.error("Create entry error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
