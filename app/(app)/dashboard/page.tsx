"use client";

import { useEffect, useState } from "react";
import { NoteCard } from "@/components/NoteCard";

type Note = { _id: string; content: string; createdAt: string };

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");

  async function loadNotes() {
    const res = await fetch("/api/notes", { cache: "no-store" });
    if (res.ok) setNotes(await res.json());
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function addQuickNote(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input })
    });
    if (res.ok) {
      setInput("");
      await loadNotes();
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <form onSubmit={addQuickNote} className="flex gap-2">
        <input className="flex-1 rounded border px-3 py-2" placeholder="Quick capture a note" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Save</button>
      </form>
      {notes.length === 0 ? <p className="text-slate-500">No notes yet. Use quick capture or the mic.</p> : notes.map((note) => <NoteCard key={note._id} content={note.content} createdAt={note.createdAt} />)}
    </section>
  );
}
