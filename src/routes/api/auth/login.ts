import { createAPIFileRoute } from "@tanstack/react-start/api";
import { verifyPassword, createSessionToken } from "~/lib/auth";
import { sql } from "~/db";

export const APIRoute = createAPIFileRoute("/api/auth/login")({
  POST: async ({ request }) => {
    try {
      const { email, password } = (await request.json()) as {
        email?: string;
        password?: string;
      };

      if (
        !email ||
        !password ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return Response.json(
          { error: "Email and password are required" },
          { status: 400 },
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find user
      const rows = await sql()`
        SELECT id, email, password_hash, tier, created_at
        FROM users
        WHERE email = ${normalizedEmail}
      `;

      if (rows.length === 0) {
        return Response.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      const user = rows[0] as {
        id: string;
        email: string;
        password_hash: string;
        tier: string;
        created_at: Date;
      };

      // Verify password
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return Response.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Create session
      const token = await createSessionToken({
        userId: user.id,
        email: user.email,
      });

      const isSecure = request.url.startsWith("https://");

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            tier: user.tier,
            created_at: String(user.created_at),
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `session=${token}; HttpOnly; ${isSecure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`,
          },
        },
      );
    } catch (err) {
      console.error("Login error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
