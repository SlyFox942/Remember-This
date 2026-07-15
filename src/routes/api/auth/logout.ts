import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/logout")({
  POST: async ({ request }) => {
    const isSecure = request.url.startsWith("https://");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Clear the session cookie by setting Max-Age=0
        "Set-Cookie": `session=; HttpOnly; ${isSecure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=0`,
      },
    });
  },
});
