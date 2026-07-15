import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import { useAuth } from "~/lib/useAuth";

// Read the (optional) business name at request time so the placeholder can be
// personalized by writing site.json — no rebuild needed.
const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

function Home() {
  const businessName = Route.useLoaderData();
  const { user, loading, logout } = useAuth();

  const displayName = businessName || "Remember This";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      {/* Auth nav */}
      <nav className="absolute top-0 right-0 p-4 flex gap-3 items-center">
        {loading ? (
          <span className="h-8 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        ) : user ? (
          <>
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <a
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Sign up
            </a>
          </>
        )}
      </nav>

      {user ? (
        <>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            Welcome back
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            Your Journal Awaits
          </h1>
          <p className="max-w-md text-lg text-gray-600 dark:text-gray-400">
            Start writing, speaking, and decorating your memories with{" "}
            {displayName}.
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="#"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              New Entry
            </a>
            <a
              href="#"
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              My Journal
            </a>
          </div>
        </>
      ) : (
        <>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Your personal journal
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            {displayName}
          </h1>
          <p className="max-w-md text-lg text-gray-600 dark:text-gray-400">
            A digital journal that makes capturing thoughts effortless. Write or
            speak your entries, then personalize them with custom fonts and
            stickers.
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="/signup"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Get started
            </a>
            <a
              href="/login"
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Log in
            </a>
          </div>
        </>
      )}

      <footer className="absolute bottom-6 text-sm text-gray-400 dark:text-gray-600">
        Built with{" "}
        <a
          href="https://cto.new"
          className="underline hover:text-gray-600 dark:hover:text-gray-400"
        >
          cto.new
        </a>
      </footer>
    </main>
  );
}
