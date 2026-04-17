import { NoteCard } from "@/components/NoteCard";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Daily Digest</h1>
      <article className="rounded-lg border bg-white p-4">
        <p className="text-slate-700">You had 3 actions yesterday across Work, Family, and Fitness. Two tasks remain open today.</p>
      </article>
      <NoteCard content="Welcome to FlowMind AI. Start with a voice command from the floating mic." createdAt={new Date().toISOString()} />
    </section>
  );
}
