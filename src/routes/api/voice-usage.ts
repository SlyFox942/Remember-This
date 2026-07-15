import { createAPIFileRoute } from "@tanstack/react-start/api";
import { sql } from "~/db";
import { getUserId } from "~/lib/apiAuth";

const FREE_VOICE_LIMIT = 5;

/** Count voice entries created by the user in the current calendar month. */
async function countVoiceEntriesThisMonth(userId: string): Promise<number> {
  const rows = await sql()`
    SELECT COUNT(*)::int as count
    FROM entries
    WHERE user_id = ${userId}
      AND is_voice = true
      AND created_at >= date_trunc('month', now())
  `;
  return (rows[0] as { count: number }).count;
}

export const APIRoute = createAPIFileRoute("/api/voice-usage")({
  GET: async ({ request }) => {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const used = await countVoiceEntriesThisMonth(userId);
      return Response.json({
        used,
        limit: FREE_VOICE_LIMIT,
        remaining: Math.max(0, FREE_VOICE_LIMIT - used),
      });
    } catch (err) {
      console.error("Voice usage error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
