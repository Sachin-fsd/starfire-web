"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function VoiceMic() {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  async function runPipeline(text: string) {
    if (!text.trim()) return;
    setStatus("Processing...");

    const intentRes = await fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text, profile: {} })
    });

    if (!intentRes.ok) {
      setStatus("Could not parse command.");
      return;
    }

    const intent = await intentRes.json();

    if (intent.clarificationNeeded) {
      setStatus(intent.clarificationQuestion ?? "Need clarification.");
      return;
    }

    if (intent.action === "NOTE") {
      const noteRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: intent.body, threadId: intent.threadId ?? undefined })
      });
      setStatus(noteRes.ok ? "Note captured." : "Failed to save note.");
      return;
    }

    setStatus(`Parsed action: ${intent.action}. Implemented execution can be triggered from API routes.`);
  }

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const next = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setTranscript(next);
      transcriptRef.current = next;
      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => recognition.stop(), 2500);
    };

    recognition.onend = () => {
      setIsRecording(false);
      void runPipeline(transcriptRef.current);
    };

    recognitionRef.current = recognition;
  }, []);

  const waveform = useMemo(() => Array.from({ length: 16 }), []);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }
    setStatus("");
    setTranscript("");
    setIsRecording(true);
    recognitionRef.current.start();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2">
      {!supported && <p className="rounded bg-amber-100 px-3 py-2 text-xs">Voice unsupported here. Type your request instead.</p>}
      {(isRecording || status) && (
        <div className="max-w-sm rounded-lg border bg-white p-3 shadow">
          {isRecording && (
            <div className="mb-2 flex gap-1">
              {waveform.map((_, idx) => (
                <span
                  key={idx}
                  className="inline-block w-1 animate-pulse rounded bg-slate-900"
                  style={{ height: `${8 + ((idx * 7) % 24)}px` }}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-slate-600">{isRecording ? transcript || "Listening..." : status}</p>
        </div>
      )}
      <button
        onClick={toggle}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${
          isRecording ? "bg-red-500" : "bg-slate-900"
        }`}
        aria-label="Voice input"
      >
        {isRecording ? <MicOff /> : <Mic />}
      </button>
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }
}
