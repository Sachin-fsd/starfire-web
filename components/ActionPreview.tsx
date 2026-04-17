"use client";

interface Props {
  title: string;
  body: string;
  onSend: () => void;
}

export function ActionPreview({ title, body, onSend }: Props) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">{body}</p>
        <div className="mt-6 flex gap-2">
          <button className="rounded border px-4 py-2">Edit</button>
          <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={onSend}>
            Send
          </button>
          <button className="rounded border px-4 py-2">Save as Draft</button>
        </div>
      </div>
    </div>
  );
}
