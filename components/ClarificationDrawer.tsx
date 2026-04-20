"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  question: string;
  onAnswer: (answer: string) => void;
  onClose: () => void;
}

export function ClarificationDrawer({ open, question, onAnswer, onClose }: Props) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswer(answer.trim());
      setAnswer("");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
        <h2 className="font-semibold">Need clarification</h2>
        <p className="mt-2 text-slate-700">{question}</p>
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="Type or speak your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">Submit</button>
        </form>
      </div>
    </div>
  );
}
