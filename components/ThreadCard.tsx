import Link from "next/link";

interface Props {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export function ThreadCard({ id, name, category, keywords }: Props) {
  return (
    <Link href={`/threads/${id}`} className="block rounded-lg border bg-white p-4 transition hover:border-slate-400 hover:shadow-sm">
      <h2 className="font-semibold">{name}</h2>
      <p className="text-sm text-slate-600">Category: {category}</p>
      <p className="mt-2 text-xs text-slate-500">Keywords: {keywords.join(", ") || "No keywords"}</p>
    </Link>
  );
}
