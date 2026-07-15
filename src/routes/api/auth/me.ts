import { createAPIFileRoute } from "@tanstack/react-start/api";
import { verifySessionToken } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/me")({
  GET: async ({ request }) => {
    try {
      const cookie = request.headers.get("cookie") || "";
      const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
      const token = match?.[1];

      if (!token) {
        return Response.json({ user: null }, { status: 200 });
      }

      const payload = await verifySessionToken(token);
      if (!payload) {
        return Response.json({ user: null }, { status: 200 });
      }

      return Response.json(
        {
          user: {
            id: payload.userId,
            email: payload.email,
          },
        },
        { status: 200 },
      );
    } catch {
      return Response.json({ user: null }, { status: 200 });
    }
  },
});
