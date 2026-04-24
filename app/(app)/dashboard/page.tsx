"use client";

import { Mic, MicOff, SendHorizontal, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClarificationDrawer } from "@/components/ClarificationDrawer";

type Message = { role: "user" | "assistant" | "status"; content: string };

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("")
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  async function runPipeline(text: string) {
    if (!text.trim()) return;
    setIsProcessing(true);
    setStatus("Processing...");

    const intentRes = await fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text, profile: {} })
    });

    setIsProcessing(false);
    if (!intentRes.ok) {
      setStatus("Could not parse command.");
      setMessages(prev => [...prev, { role: "status", content: "Could not parse command." }]);
      return;
    }

    const intent = await intentRes.json();
    console.log("intentRes", intentRes, intent);
    if (intent.clarificationNeeded) {
      setMessages(prev => [...prev, { role: "assistant", content: intent.clarificationQuestion || intent.body || "Could not parse command." }]);
      setStatus("");
      return;
    }

    if (intent.action === "CHAT") {
      setStatus("");
      setMessages(prev => [...prev, { role: "assistant", content: intent.body }]);
      return;
    }

    if (intent.action === "NOTE") {
      const noteRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: intent.body, threadId: intent.threadId ?? undefined })
      });
      const msg = noteRes.ok ? "Note captured." : "Failed to save note.";
      setStatus(msg);
      setMessages(prev => [...prev, { role: "status", content: msg }]);
      return;
    }

    if (intent.action === "EMAIL") {
      const to = intent.recipients?.[0]?.email;
      if (!to) {
        setStatus("No email recipient found.");
        setMessages(prev => [...prev, { role: "status", content: "No email recipient found." }]);
        return;
      }
      const emailRes = await fetch("/api/execute/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject: intent.subject || "No subject", body: intent.body })
      });
      const msg = emailRes.ok ? "Email sent." : "Failed to send email.";
      setStatus(msg);
      setMessages(prev => [...prev, { role: "status", content: msg }]);
      return;
    }

    if (intent.action === "CALENDAR") {
      if (!intent.datetime) {
        setStatus("No date/time specified for calendar event.");
        setMessages(prev => [...prev, { role: "status", content: "No date/time specified for calendar event." }]);
        return;
      }

      const startDate = new Date(intent.datetime);
      if (isNaN(startDate.getTime())) {
        setStatus("Unable to parse the requested date/time.");
        setMessages(prev => [...prev, { role: "status", content: "Unable to parse the requested date/time." }]);
        return;
      }

      // Check if the event is in the past
      const now = new Date();
      if (startDate < now) {
        setStatus("Cannot create calendar events in the past.");
        setMessages(prev => [...prev, { role: "status", content: "Cannot create calendar events in the past." }]);
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
        const msg = `Calendar event created. Link: ${calData.link}`;
        setStatus(msg);
        setMessages(prev => [...prev, { role: "status", content: msg }]);
      } else {
        const errorData = await calRes.json();
        console.error("Calendar creation failed:", errorData);
        setStatus("Failed to create calendar event.");
        setMessages(prev => [...prev, { role: "status", content: "Failed to create calendar event." }]);
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
      const msg = taskRes.ok ? "Task created." : "Failed to create task.";
      setStatus(msg);
      setMessages(prev => [...prev, { role: "status", content: msg }]);
      return;
    }

    const msg = `Parsed action: ${intent.action}. Execution pending.`;
    setStatus(msg);
    setMessages(prev => [...prev, { role: "status", content: msg }]);
  }

  async function handleTextSubmit() {
    const nextInput = textInput.trim();
    if (!nextInput) return;
    setMessages(prev => [...prev, { role: "user", content: nextInput }]);
    setTextInput("");
    transcriptRef.current = nextInput;
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
    <section className="flex flex-col h-full space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="flex-1 overflow-y-auto space-y-2 p-4 border rounded bg-gray-50">
        {messages.length === 0 && !isRecording && !isProcessing ? (
          <p className="text-slate-500">Start a conversation...</p>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg max-w-md ${msg.role === "user" ? "bg-blue-500 text-white self-end ml-auto" : msg.role === "assistant" ? "bg-white border self-start" : "bg-yellow-100 text-center"}`}>
                {msg.role === "user" && <strong>You:</strong>} {msg.role === "assistant" && <strong>AI:</strong>} {msg.content}
              </div>
            ))}
            {isRecording && (
              <div className="p-3 rounded-lg bg-red-100">
                <div className="mb-2 flex gap-1 justify-center">
                  {waveform.map((_, idx) => (
                    <span
                      key={idx}
                      className="inline-block w-1 animate-pulse rounded bg-red-500"
                      style={{ height: `${8 + ((idx * 7) % 24)}px` }}
                    />
                  ))}
                </div>
                <p className="text-center text-sm">{transcript || "Listening..."}</p>
              </div>
            )}
            {isProcessing && (
              <div className="p-3 rounded-lg bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" />
                Processing...
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex gap-2 items-end">
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

          {/* <ClarificationDrawer
            open={!!clarificationQuestion}
            question={clarificationQuestion || ""}
            onAnswer={handleClarificationAnswer}
            onClose={() => setClarificationQuestion(null)}
          /> */}
        </div>
      </div>
      {!supported && <p className="text-amber-600 text-sm">Voice unsupported here. Use text input.</p>}
      {/* <ClarificationDrawer
        open={!!clarificationQuestion}
        question={clarificationQuestion || ""}
        onAnswer={handleClarificationAnswer}
        onClose={() => setClarificationQuestion(null)}
      /> */}
    </section>
  );
}
