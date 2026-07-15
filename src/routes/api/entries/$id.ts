import { createAPIFileRoute } from "@tanstack/react-start/api";
import { sql } from "~/db";
import { getUserId } from "~/lib/apiAuth";

export const APIRoute = createAPIFileRoute("/api/entries/$id")({
  GET: async ({ request, params }) => {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { id } = params as { id: string };
      const rows = await sql()`SELECT id, journal_id, content, font, stickers, is_voice, created_at, updated_at FROM entries WHERE id = ${id} AND user_id = ${userId}`;
      if (rows.length === 0) return Response.json({ error: "Entry not found" }, { status: 404 });
      const entry = rows[0] as Record<string, unknown>;
      return Response.json({ entry: { ...entry, created_at: String(entry.created_at), updated_at: String(entry.updated_at) } });
    } catch (err) {
      console.error("Get entry error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  PUT: async ({ request, params }) => {
    const userId = await getUserId(request);
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { id } = params as { id: string };
      const body = await request.json() as { content?: string; font?: string; stickers?: unknown[]; is_voice?: boolean };
      const content = body.content;
      const font = body.font;
      const stickers = body.stickers;
      const isVoice = body.is_voice;
      const rows = await sql()`
        UPDATE entries SET
          content = COALESCE(${content ?? null}, content),
          font = COALESCE(${font ?? null}, font),
          stickers = COALESCE(${stickers !== undefined ? JSON.stringify(stickers) : null}::jsonb, stickers),
          is_voice = COALESCE(${isVoice ?? null}, is_voice),
          updated_at = now()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, journal_id, content, font, stickers, is_voice, created_at, updated_at`;
      if (rows.length === 0) return Response.json({ error: "Entry not found" }, { status: 404 });
      const entry = rows[0] as Record<string, unknown>;
      return Response.json({ entry: { ...entry, created_at: String(entry.created_at), updated_at: String(entry.updated_at) } });
    } catch (err) {
      console.error("Update entry error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  DELETE: async ({ request, params }) => {
    const userId = await getUserId(request);
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { id } = params as { id: string };
      const rows = await sql()`DELETE FROM entries WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
      if (rows.length === 0) return Response.json({ error: "Entry not found" }, { status: 404 });
      return Response.json({ success: true });
    } catch (err) {
      console.error("Delete entry error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
