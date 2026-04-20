import { redirect } from "next/navigation";
import { SignInButton } from "@/components/SignInButton";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">FlowMind AI</h1>
      <p className="max-w-xl text-slate-600">
        Continue with Google once and immediately unlock voice capture, notes, tasks, calendar actions, and smart search.
      </p>
      <SignInButton />
    </main>
  );
}
