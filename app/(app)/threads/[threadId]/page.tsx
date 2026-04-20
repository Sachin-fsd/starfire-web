"use client";

import { useCallback, useEffect, useState } from "react";
import { NoteCard } from "@/components/NoteCard";

interface PageProps {
  params: { threadId: string };
}

type Thread = { _id: string; name: string; category: string; keywords: string[] };
type Note = { _id: string; content: string; createdAt: string };

export default function ThreadDetailsPage({ params }: PageProps) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");

  const load = useCallback(async () => {
    const [threadRes, notesRes] = await Promise.all([
      fetch(`/api/threads?threadId=${params.threadId}`, { cache: "no-store" }),
      fetch(`/api/notes?threadId=${params.threadId}`, { cache: "no-store" })
    ]);
    if (threadRes.ok) {
      const data = await threadRes.json();
      setThread(Array.isArray(data) ? data[0] ?? null : data);
    }
    if (notesRes.ok) setNotes(await notesRes.json());
  }, [params.threadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, threadId: params.threadId })
    });
    if (res.ok) {
      setContent("");
      await load();
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{thread?.name ?? "Thread"}</h1>
      <p className="text-slate-600">{thread ? `Category: ${thread.category}` : "Loading thread details..."}</p>

      <form onSubmit={addNote} className="flex gap-2">
        <input className="flex-1 rounded border px-3 py-2" placeholder="Add a note to this thread" value={content} onChange={(e) => setContent(e.target.value)} />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Save</button>
      </form>

      <div className="space-y-2">
        {notes.length === 0 ? <p className="text-slate-500">No notes in this thread yet.</p> : notes.map((note) => <NoteCard key={note._id} content={note.content} createdAt={note.createdAt} />)}
      </div>
    </section>
  );
}
