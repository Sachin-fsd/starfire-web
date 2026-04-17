"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">FlowMind AI</h1>
      <p className="max-w-xl text-slate-600">
        Continue with Google once and immediately unlock voice capture, notes, tasks, calendar actions, and smart search.
      </p>
      <button
        className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Continue with Google
      </button>
    </main>
  );
}
