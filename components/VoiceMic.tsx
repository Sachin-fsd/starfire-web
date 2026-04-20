"use client";

import { Mic, MicOff, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClarificationDrawer } from "./ClarificationDrawer";

export function VoiceMic() {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  async function handleClarificationAnswer(answer: string) {
    const fullTranscript = transcriptRef.current + " " + answer;
    setClarificationQuestion(null);
    await runPipeline(fullTranscript);
  }

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
    console.log("intentRes", intentRes, intent);
    if (intent.clarificationNeeded) {
      setClarificationQuestion(intent.clarificationQuestion || intent.body || "Could not parse command.");
      setStatus("");
      return;
    }

    if (intent.action === "CHAT") {
      setStatus(intent.body);
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

    if (intent.action === "EMAIL") {
      const to = intent.recipients?.[0]?.email;
      if (!to) {
        setStatus("No email recipient found.");
        return;
      }
      const emailRes = await fetch("/api/execute/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject: intent.subject || "No subject", body: intent.body })
      });
      setStatus(emailRes.ok ? "Email sent." : "Failed to send email.");
      return;
    }

    if (intent.action === "CALENDAR") {
      if (!intent.datetime) {
        setStatus("No date/time specified for calendar event.");
        return;
      }

      const startDate = new Date(intent.datetime);
      if (isNaN(startDate.getTime())) {
        setStatus("Unable to parse the requested date/time.");
        return;
      }

      // Check if the event is in the past
      const now = new Date();
      if (startDate < now) {
        setStatus("Cannot create calendar events in the past.");
        return;
      }

      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const calRes = await fetch("/api/execute/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: intent.subject || "Event",
          description: intent.body,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          attendees: intent.recipients || []
        })
      });

      if (calRes.ok) {
        const calData = await calRes.json();
        console.log("Calendar event created:", calData);
        setStatus(`Calendar event created. Link: ${calData.link}`);
      } else {
        const errorData = await calRes.json();
        console.error("Calendar creation failed:", errorData);
        setStatus("Failed to create calendar event.");
      }
      return;
    }

    if (intent.action === "TASK") {
      const taskRes = await fetch("/api/execute/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: intent.subject || intent.body.slice(0, 50),
          notes: intent.body,
          dueDate: intent.datetime || undefined
        })
      });
      setStatus(taskRes.ok ? "Task created." : "Failed to create task.");
      return;
    }

    setStatus(`Parsed action: ${intent.action}. Execution pending.`);
  }

  async function handleTextSubmit() {
    const nextInput = textInput.trim();
    if (!nextInput) return;
    setTranscript(nextInput);
    transcriptRef.current = nextInput;
    setTextInput("");
    await runPipeline(nextInput);
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
      <div className="flex justify-between">
        <div className="flex max-w-sm items-end gap-2 rounded-2xl border bg-white p-2 shadow-lg">
          <input
            type="text"
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleTextSubmit();
              }
            }}
            placeholder="Type a request..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            aria-label="Type a request"
          />
          <button
            type="button"
            onClick={() => void handleTextSubmit()}
            disabled={!textInput.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send typed request"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={toggle}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${isRecording ? "bg-red-500" : "bg-slate-900"
            }`}
          aria-label="Voice input"
        >
          {isRecording ? <MicOff /> : <Mic />}
        </button>
      </div>

      <ClarificationDrawer
        open={!!clarificationQuestion}
        question={clarificationQuestion || ""}
        onAnswer={handleClarificationAnswer}
        onClose={() => setClarificationQuestion(null)}
      />
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
