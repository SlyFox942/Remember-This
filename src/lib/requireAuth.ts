import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { verifySessionToken } from "~/lib/auth";

/**
 * Server function that checks if the user is authenticated.
 * Used in beforeLoad for protected routes.
 */
const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  // Read session cookie from the incoming request
  const { getWebRequest } = await import("@tanstack/react-start/server");
  const req = getWebRequest();
  const cookie = req?.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
  const token = match?.[1];

  if (!token) return null;

  return verifySessionToken(token);
});

/**
 * beforeLoad helper for protected routes.
 * Redirects to /login if not authenticated.
 *
 * Usage:
 *   export const Route = createFileRoute("/journal")({
 *     beforeLoad: () => requireAuth(),
 *     component: JournalPage,
 *   });
 */
export async function requireAuth() {
  const user = await checkAuth();
  if (!user) throw redirect({ to: "/login" });
  return { user };
}
