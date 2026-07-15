import { createAPIFileRoute } from "@tanstack/react-start/api";
import { hashPassword, createSessionToken } from "~/lib/auth";
import { sql } from "~/db";

export const APIRoute = createAPIFileRoute("/api/auth/signup")({
  POST: async ({ request }) => {
    try {
      const { email, password } = (await request.json()) as {
        email?: string;
        password?: string;
      };

      // Validate
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

      if (password.length < 6) {
        return Response.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 },
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check existing user
      const existing = await sql()`
        SELECT id FROM users WHERE email = ${normalizedEmail}
      `;

      if (existing.length > 0) {
        return Response.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }

      // Create user
      const passwordHash = await hashPassword(password);
      const rows = await sql()`
        INSERT INTO users (email, password_hash)
        VALUES (${normalizedEmail}, ${passwordHash})
        RETURNING id, email, tier, created_at
      `;

      const user = rows[0] as {
        id: string;
        email: string;
        tier: string;
        created_at: Date;
      };

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
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `session=${token}; HttpOnly; ${isSecure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`,
          },
        },
      );
    } catch (err) {
      console.error("Signup error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
