import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { VoiceMic } from "@/components/VoiceMic";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Profile } from "@/models/Profile";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Threads", "/threads"],
  ["Notes", "/notes"],
  ["Search", "/search"],
  ["Analytics", "/analytics"],
  ["Settings", "/settings"]
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.error === "RefreshAccessTokenError") {
    redirect("/login");
  }

  // Ensure profile exists
  await connectMongo();
  const existingProfile = await Profile.findOne({ userId: session.user.email });
  if (!existingProfile) {
    await Profile.create({
      userId: session.user.email,
      name: session.user.name,
      email: session.user.email,
      avatarUrl: session.user.image
    });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 p-3">
          <span className="font-semibold">FlowMind AI</span>
          <SearchBar />
          <span className="ml-auto inline-flex h-3 w-3 rounded-full bg-emerald-500" title="Sync healthy" />
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border bg-white p-3">
          <nav className="space-y-1">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded px-3 py-2 hover:bg-slate-100">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
      <VoiceMic />
    </div>
  );
}
