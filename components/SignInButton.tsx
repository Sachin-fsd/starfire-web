"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      Continue with Google
    </button>
  );
}
