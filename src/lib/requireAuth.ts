import { redirect } from "@tanstack/react-router";

/**
 * beforeLoad helper for protected routes.
 * Fetches /api/auth/me to check the session cookie.
 * Redirects to /login if not authenticated.
 *
 * Usage:
 *   export const Route = createFileRoute("/journal")({
 *     beforeLoad: () => requireAuth(),
 *     component: JournalPage,
 *   });
 */
export async function requireAuth() {
  try {
    // Fetch the auth endpoint. On the server, TanStack Start's fetch
    // will route internally; on the client, it's a regular fetch.
    const res = await fetch("/api/auth/me");
    const data = (await res.json()) as { user: { id: string; email: string } | null };

    if (!data.user) {
      throw redirect({ to: "/login" });
    }

    return { user: data.user };
  } catch (err) {
    if (err && typeof err === "object" && "redirect" in err) {
      throw err;
    }
    throw redirect({ to: "/login" });
  }
}
