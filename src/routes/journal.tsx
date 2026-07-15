import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "~/lib/requireAuth";
import { useAuth } from "~/lib/useAuth";

export const Route = createFileRoute("/journal")({
  beforeLoad: () => requireAuth(),
  component: JournalPage,
});

function JournalPage() {
  const { user, logout } = useAuth();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <nav className="absolute top-0 right-0 p-4 flex gap-3 items-center">
        <span className="text-sm text-gray-500">{user?.email}</span>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Log out
        </button>
      </nav>

      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
        Protected route ✓
      </span>
      <h1 className="text-4xl font-bold tracking-tight">My Journal</h1>
      <p className="max-w-md text-lg text-gray-600 dark:text-gray-400">
        This is your journal. Entries will appear here once the CRUD features
        are built.
      </p>
      <a
        href="/"
        className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Back home
      </a>
    </main>
  );
}
