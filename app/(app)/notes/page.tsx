"use client";
import { useEffect, useState } from "react";
type Note = { _id: string; content: string; createdAt: string };
import { NoteCard } from "@/components/NoteCard";
export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);

  async function loadNotes() {
    const res = await fetch("/api/notes", { cache: "no-store" });
    if (res.ok) setNotes(await res.json());
  }
  useEffect(() => {
    loadNotes();
  }, []);
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Notes</h1>
      <p className="text-slate-600">Local-first notes feed with optional Google Tasks sync.</p>
        {notes.length === 0 ? <p className="text-slate-500">No notes yet. Use quick capture or the mic.</p> : notes.map((note) => <NoteCard key={note._id} content={note.content} createdAt={note.createdAt} />)}
    </section>
  );
}
