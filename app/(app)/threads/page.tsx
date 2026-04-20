"use client";

import { useEffect, useState } from "react";
import { ThreadCard } from "@/components/ThreadCard";

type Thread = {
  _id: string;
  name: string;
  category: string;
  keywords: string[];
};

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/threads", { cache: "no-store" });
    if (res.ok) {
      setThreads(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name,
      category,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    };
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setName("");
      setKeywords("");
      await load();
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Threads</h1>

      <form onSubmit={createThread} className="grid gap-2 rounded-lg border bg-white p-4 md:grid-cols-4">
        <input className="rounded border px-3 py-2" placeholder="Thread name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="rounded border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="work">work</option>
          <option value="personal">personal</option>
          <option value="education">education</option>
          <option value="health">health</option>
          <option value="creative">creative</option>
          <option value="other">other</option>
        </select>
        <input
          className="rounded border px-3 py-2"
          placeholder="keywords: uni, thesis"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Create thread</button>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : threads.length === 0 ? (
        <p className="text-slate-500">No threads yet. Create your first thread above.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {threads.map((thread) => (
            <ThreadCard key={thread._id} id={thread._id} name={thread.name} category={thread.category} keywords={thread.keywords ?? []} />
          ))}
        </div>
      )}
    </section>
  );
}
