"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Square } from "lucide-react";
import { wavFromBlob } from "@/lib/sample";
// Sends a recording for transcription. Returns "" when nothing was heard and
// undefined when transcription is not connected.
export async function transcribe(blob: Blob): Promise<string | undefined> {
  const audio = await wavFromBlob(blob, 120);
  if (!audio) return "";
  const r = await fetch("/api/ai/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio }),
  });
  const data = await r.json();
  if (data.connect) return undefined;
  if (!r.ok) throw Error(data.error);
  return data.text as string;
}
// A microphone button that types what you say into the field next to it.
export function Dictate({
  label,
  onText,
  notify,
}: {
  label: string;
  onText: (text: string) => void;
  notify: (s: string) => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "working">("idle");
  const recorder = useRef<MediaRecorder | null>(null);
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("working");
        try {
          const text = await transcribe(new Blob(chunks, { type: r.mimeType }));
          if (text === undefined)
            notify("Transcription is not connected, so type the text instead.");
          else if (!text)
            notify("No speech was heard. Try again a little louder.");
          else onText(text);
        } catch {
          notify("Could not transcribe that recording.");
        }
        setState("idle");
      };
      recorder.current = r;
      r.start();
      setState("recording");
    } catch {
      notify("Allow microphone access to dictate.");
    }
  };
  return (
    <button
      type="button"
      className={`dictate ${state}`}
      aria-label={
        state === "recording" ? `Stop dictating ${label}` : `Dictate ${label}`
      }
      title={
        state === "recording"
          ? "Stop and transcribe"
          : "Speak instead of typing"
      }
      disabled={state === "working"}
      onClick={() =>
        state === "recording" ? recorder.current?.stop() : void start()
      }
    >
      {state === "working" ? (
        <LoaderCircle className="spin" size={15} />
      ) : state === "recording" ? (
        <Square size={13} />
      ) : (
        <Mic size={15} />
      )}
    </button>
  );
}
