interface PageProps {
  params: { threadId: string };
}

export default function ThreadDetailsPage({ params }: PageProps) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Thread {params.threadId}</h1>
      <p className="text-slate-600">Timeline, contacts, and notes for this context will render here.</p>
    </section>
  );
}
