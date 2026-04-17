"use client";

interface Props {
  open: boolean;
  question: string;
  onClose: () => void;
}

export function ClarificationDrawer({ open, question, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
        <h2 className="font-semibold">Need clarification</h2>
        <p className="mt-2 text-slate-700">{question}</p>
        <input className="mt-3 w-full rounded border px-3 py-2" placeholder="Type or speak your answer" />
      </div>
    </div>
  );
}
