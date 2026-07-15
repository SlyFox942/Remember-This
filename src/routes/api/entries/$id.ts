import { createAPIFileRoute } from "@tanstack/react-start/api";
import { verifySessionToken } from "~/lib/auth";
import { sql } from "~/db";

async function getUserId(request: Request): Promise<string | null> {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
  const token = match?.[1];
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.userId ?? null;
}

export const APIRoute = createAPIFileRoute("/api/entries/$id")({
  // Get single entry
  GET: async ({ request, params }) => {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = params as { id: string };
      const rows = await sql()`
        SELECT id, journal_id, content, font, stickers, is_voice, created_at, updated_at
        FROM entries
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (rows.length === 0) {
        return Response.json({ error: "Entry not found" }, { status: 404 });
      }

      const entry = rows[0] as Record<string, unknown>;
      return Response.json({
        entry: {
          ...entry,
          created_at: String(entry.created_at),
          updated_at: String(entry.updated_at),
        },
      });
    } catch (err) {
      console.error("Get entry error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // Update entry
  PUT: async ({ request, params }) => {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = params as { id: string };
      const { content, font, stickers, is_voice } = (await request.json()) as {
        content?: string;
        font?: string;
        stickers?: unknown[];
        is_voice?: boolean;
      };

      // Build SET clause dynamically
      const updates: string[] = [];
      const values: unknown[] = [];

      if (content !== undefined) {
        updates.push(`content = $${updates.length + 1}`);
        values.push(content);
      }
      if (font !== undefined) {
        updates.push(`font = $${updates.length + 1}`);
        values.push(font);
      }
      if (stickers !== undefined) {
        updates.push(`stickers = $${updates.length + 1}::jsonb`);
        values.push(JSON.stringify(stickers));
      }
      if (is_voice !== undefined) {
        updates.push(`is_voice = $${updates.length + 1}`);
        values.push(is_voice);
      }

      if (updates.length === 0) {
        return Response.json({ error: "No fields to update" }, { status: 400 });
      }

      updates.push(`updated_at = now()`);
      values.push(id);
      values.push(userId);

      const rows = await sql().unsafe(
        `UPDATE entries SET ${updates.join(", ")} WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING id, journal_id, content, font, stickers, is_voice, created_at, updated_at`,
        values,
      );

      if (rows.length === 0) {
        return Response.json({ error: "Entry not found" }, { status: 404 });
      }

      const entry = rows[0] as Record<string, unknown>;
      return Response.json({
        entry: {
          ...entry,
          created_at: String(entry.created_at),
          updated_at: String(entry.updated_at),
        },
      });
    } catch (err) {
      console.error("Update entry error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // Delete entry
  DELETE: async ({ request, params }) => {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { id } = params as { id: string };
      const rows = await sql()`
        DELETE FROM entries
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;

      if (rows.length === 0) {
        return Response.json({ error: "Entry not found" }, { status: 404 });
      }

      return Response.json({ success: true });
    } catch (err) {
      console.error("Delete entry error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
