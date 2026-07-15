import { createAPIFileRoute } from "@tanstack/react-start/api";
import { sql } from "~/db";
import { getUserId, ensureJournal } from "~/lib/apiAuth";

export const APIRoute = createAPIFileRoute("/api/entries")({
  // List entries — newest first
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
