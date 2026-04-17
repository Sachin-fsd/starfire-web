interface Props {
  name: string;
  category: string;
  keywords: string[];
}

export function ThreadCard({ name, category, keywords }: Props) {
  return (
    <article className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold">{name}</h2>
      <p className="text-sm text-slate-600">Category: {category}</p>
      <p className="mt-2 text-xs text-slate-500">Keywords: {keywords.join(", ")}</p>
    </article>
  );
}
