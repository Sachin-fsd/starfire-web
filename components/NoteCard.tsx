interface Props {
  content: string;
  createdAt: string;
}

export function NoteCard({ content, createdAt }: Props) {
  return (
    <article className="rounded-lg border bg-white p-4">
      <p>{content}</p>
      <p className="mt-2 text-xs text-slate-500">{new Date(createdAt).toLocaleString()}</p>
    </article>
  );
}
