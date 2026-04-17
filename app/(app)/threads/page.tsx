import { ThreadCard } from "@/components/ThreadCard";

export default function ThreadsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Threads</h1>
      <ThreadCard name="Work — Acme" category="work" keywords={["acme", "roadmap"]} />
      <ThreadCard name="Study — MSc" category="education" keywords={["uni", "thesis"]} />
    </section>
  );
}
