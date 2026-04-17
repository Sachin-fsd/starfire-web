"use client";

import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <label className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
      <input
        type="search"
        placeholder="Search notes, actions, and threads..."
        className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none ring-slate-200 focus:ring"
      />
    </label>
  );
}
