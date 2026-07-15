import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "~/lib/requireAuth";
import { useAuth } from "~/lib/useAuth";
import { useSpeechRecognition } from "~/lib/useSpeechRecognition";
import { useEffect, useState, useCallback, type FormEvent } from "react";

// ---- Types ----

interface Entry {
  id: string;
  journal_id: string;
  content: string;
  font: string;
  stickers: unknown[];
  is_voice: boolean;
  created_at: string;
  updated_at: string;
}

interface VoiceUsage {
  used: number;
  limit: number;
  remaining: number;
}

// ---- Route ----

export const Route = createFileRoute("/journal")({
  beforeLoad: () => requireAuth(),
  component: JournalPage,
});

// ---- Constants ----

const FONTS = ["inter", "serif", "mono", "cursive"] as const;

function fontClass(font: string): string {
  switch (font) {
    case "serif": return "font-serif";
    case "mono": return "font-mono";
    case "cursive": return "font-[cursive]";
    default: return "font-sans";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---- Mic Button ----

function MicButton({
  isListening, isSupported, onToggle, disabled, voiceRemaining,
}: {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  disabled: boolean;
  voiceRemaining: number;
}) {
  if (!isSupported) {
    return (
      <span className="text-xs text-gray-400" title="Speech recognition not supported in this browser">
        🎤 Unavailable
      </span>
    );
  }

  if (disabled && !isListening) {
    return (
      <span className="text-xs text-amber-600" title="Free tier limit reached">
        🎤 {voiceRemaining} left
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !isListening}
      className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        isListening
          ? "bg-red-100 text-red-700 animate-pulse dark:bg-red-950 dark:text-red-300"
          : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300"
      } disabled:opacity-50`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${isListening ? "bg-red-500" : "bg-purple-500"}`} />
      {isListening ? "Recording..." : "Speak"}
    </button>
  );
}

// ---- Component ----

function JournalPage() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New entry form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newFont, setNewFont] = useState("inter");
  const [newIsVoice, setNewIsVoice] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editFont, setEditFont] = useState("inter");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Voice
  const [voiceUsage, setVoiceUsage] = useState<VoiceUsage>({ used: 0, limit: 5, remaining: 5 });

  const speech = useSpeechRecognition({
    onResult: (transcript) => {
      setNewContent((prev) => {
        const trimmed = prev.trimEnd();
        return (trimmed ? trimmed + " " : "") + transcript;
      });
    },
    onStart: () => setNewIsVoice(true),
    onError: (msg) => { if (msg) setError(msg); },
  });

  // ---- Data fetching ----

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("Failed to load entries");
      const data = (await res.json()) as { entries: Entry[] };
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVoiceUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/voice-usage");
      if (res.ok) {
        const data = (await res.json()) as VoiceUsage;
        setVoiceUsage(data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchVoiceUsage();
  }, [fetchEntries, fetchVoiceUsage]);

  // ---- Create ----

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          font: newFont,
          is_voice: newIsVoice,
          stickers: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setNewContent("");
      setNewFont("inter");
      setNewIsVoice(false);
      setShowNewForm(false);
      await fetchEntries();
      await fetchVoiceUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleMicToggle() {
    if (speech.isListening) {
      speech.stop();
    } else {
      speech.start();
    }
  }

  // ---- Update ----

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditFont(entry.font);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
    setEditFont("inter");
  }

  async function handleUpdate(entryId: string) {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim(), font: editFont }),
      });
      if (!res.ok) throw new Error("Failed to update");
      cancelEdit();
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  // ---- Delete ----

  async function handleDelete(entryId: string) {
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeletingId(null);
      await fetchEntries();
      await fetchVoiceUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const voiceDisabled = voiceUsage.remaining <= 0 && !speech.isListening;

  // ---- Render ----

  return (
    <div className="min-h-dvh bg-amber-50/50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-amber-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">My Journal</h1>
            {speech.isSupported && (
              <span className="text-xs text-gray-400">
                🎤 {voiceUsage.remaining}/{voiceUsage.limit}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* New Entry Button */}
        {!showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            className="mb-6 w-full rounded-xl border-2 border-dashed border-amber-300 p-4 text-center text-amber-600 transition hover:border-amber-400 hover:bg-amber-50 dark:border-gray-700 dark:text-amber-400 dark:hover:bg-gray-900"
          >
            + New Entry
          </button>
        )}

        {/* New Entry Form */}
        {showNewForm && (
          <form
            onSubmit={handleCreate}
            className="mb-6 rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What's on your mind today?"
              rows={6}
              autoFocus
              className={`${fontClass(newFont)} w-full resize-none rounded-lg border border-gray-200 bg-transparent p-3 text-lg focus:border-amber-400 focus:outline-none dark:border-gray-700 dark:focus:border-amber-500`}
            />

            {speech.error && (
              <p className="mt-1 text-xs text-red-500">{speech.error}</p>
            )}

            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {/* Font selector */}
              <select
                value={newFont}
                onChange={(e) => setNewFont(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>

              {/* Mic button */}
              <MicButton
                isListening={speech.isListening}
                isSupported={speech.isSupported}
                onToggle={handleMicToggle}
                disabled={voiceDisabled}
                voiceRemaining={voiceUsage.remaining}
              />

              {newIsVoice && (
                <span className="text-xs text-purple-600">🎤 Voice entry</span>
              )}

              <div className="flex-1" />

              <button
                type="button"
                onClick={() => { speech.stop(); setShowNewForm(false); }}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newContent.trim()}
                className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
            <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-gray-400">Loading entries...</div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-4xl">📝</p>
            <p className="mt-3 text-gray-500">No entries yet. Start writing!</p>
          </div>
        )}

        {/* Entry List */}
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              {editingId === entry.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    autoFocus
                    className={`${fontClass(editFont)} w-full resize-none rounded-lg border border-gray-200 bg-transparent p-3 text-lg focus:border-amber-400 focus:outline-none dark:border-gray-700`}
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <select
                      value={editFont}
                      onChange={(e) => setEditFont(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                    <div className="flex-1" />
                    <button onClick={cancelEdit} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                    <button onClick={() => handleUpdate(entry.id)} disabled={saving} className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatDate(entry.created_at)}</span>
                    {entry.is_voice && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 dark:bg-purple-950 dark:text-purple-300">🎤 Voice</span>
                    )}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{entry.font}</span>
                    {entry.updated_at !== entry.created_at && <span className="italic">(edited)</span>}
                  </div>
                  <p className={`${fontClass(entry.font)} whitespace-pre-wrap text-lg leading-relaxed`}>{entry.content}</p>
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    <button onClick={() => startEdit(entry)} className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">Edit</button>
                    {deletingId === entry.id ? (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        Delete?
                        <button onClick={() => handleDelete(entry.id)} className="rounded px-2 py-0.5 font-semibold hover:bg-red-50">Yes</button>
                        <button onClick={() => setDeletingId(null)} className="rounded px-2 py-0.5 text-gray-500 hover:bg-gray-100">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(entry.id)} className="rounded-lg px-3 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950">Delete</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
