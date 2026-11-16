"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Flame,
  ImagePlus,
  Mic,
  PenLine,
  Square,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { deleteFile, getFile, putFile } from "@/lib/storage";
import { analyze, words } from "@/lib/library";
import type { JournalEntry, Media } from "@/lib/model";
const questions = [
  "What’s one small thing that happened today?",
  "What are you working on right now?",
  "What made you smile today?",
  "What did you learn this week?",
  "Where are you, and what does it look like?",
  "What’s hard at the moment?",
  "What are you looking forward to?",
];
const day = (d: Date | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
function Recording({ id }: { id: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let made = "";
    void getFile(id)
      .then((f) => {
        if (f) setUrl((made = URL.createObjectURL(f)));
      })
      .catch(() => {});
    return () => {
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);
  return url ? (
    <audio src={url} controls />
  ) : (
    <small>Recording unavailable on this device.</small>
  );
}
export default function Journal({
  entries,
  media,
  add,
  remove,
  makeReel,
  notify,
}: {
  entries: JournalEntry[];
  media: Media[];
  add: (e: JournalEntry, m?: Media) => void;
  remove: (id: string) => void;
  makeReel: () => void;
  notify: (s: string) => void;
}) {
  const [text, setText] = useState(""),
    [recording, setRecording] = useState<"" | "audio" | "video">(""),
    [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null),
    live = useRef<HTMLVideoElement>(null),
    file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const days = new Set(entries.map((e) => day(e.created)));
  let streak = 0;
  for (let d = new Date(today); ; d.setDate(d.getDate() - 1)) {
    if (days.has(day(d))) streak++;
    else if (day(d) !== day(today)) break;
    if (streak > 365) break;
  }
  const weekStart = day(week[0]);
  const clips = entries.filter(
    (e) =>
      (e.kind === "video" || e.kind === "photo") &&
      day(e.created) >= weekStart &&
      media.some((m) => m.id === e.id && m.url),
  ).length;
  // Stores a capture once and files it in both the journal and the library.
  const store = async (
    kind: "audio" | "video" | "photo",
    blob: Blob,
    name?: string,
  ) => {
    const id = crypto.randomUUID(),
      note = text.trim(),
      created = new Date().toISOString();
    try {
      await putFile(id, blob);
      let item: Media | undefined;
      if (kind !== "audio") {
        const type = kind === "photo" ? "image" : "video";
        item = {
          id,
          name:
            name ||
            `${kind === "photo" ? "Photo" : "Clip"} · ${new Date().toLocaleDateString([], { day: "numeric", month: "short" })}`,
          type,
          url: URL.createObjectURL(blob),
          collection: "Journal",
          tags: [...new Set(words(note))].slice(0, 6).join(", "),
          size: blob.size,
          note,
          ...(await analyze(blob, type)),
        };
      }
      add({ id, kind, text: note, created }, item);
      setText("");
      notify(
        kind === "audio"
          ? "Voice note saved."
          : "Saved to your journal and your footage library.",
      );
    } catch {
      notify("Could not store that. Storage may be full.");
    }
  };
  const record = async (kind: "audio" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video" ? { facingMode: "user" } : false,
      });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording("");
        if (chunks.length)
          void store(kind, new Blob(chunks, { type: r.mimeType }));
      };
      recorder.current = r;
      r.start();
      setSeconds(0);
      setRecording(kind);
      if (kind === "video")
        setTimeout(() => {
          if (live.current) live.current.srcObject = stream;
        });
    } catch {
      notify(
        `Could not start recording. Allow ${kind === "video" ? "camera and microphone" : "microphone"} access, or add a file instead.`,
      );
    }
  };
  return (
    <div className="journal">
      <section className="capture">
        <div className="capture-head">
          <span className="sticker">
            {today.toLocaleDateString([], {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className={`streak ${streak ? "on" : ""}`}>
            <Flame size={15} />{" "}
            {streak ? `${streak}-day streak` : "Start a streak today"}
          </span>
        </div>
        <h2>{questions[today.getDay()]}</h2>
        <textarea
          aria-label="Journal entry"
          maxLength={2000}
          placeholder="Say it however you like. A line is enough. Or skip the words and just film it."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {recording ? (
          <div className="journal-recording" role="status">
            {recording === "video" && (
              <video ref={live} autoPlay muted playsInline />
            )}
            <span className="rec-dot" /> Recording {recording} ·{" "}
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            <Button size="sm" onClick={() => recorder.current?.stop()}>
              <Square size={13} /> Stop & save
            </Button>
          </div>
        ) : (
          <div className="capture-actions">
            <button
              className="cap cap-clip"
              onClick={() => void record("video")}
            >
              <Camera size={22} />
              <b>Film a clip</b>
              <small>10 seconds of your day</small>
            </button>
            <button
              className="cap cap-file"
              onClick={() => file.current?.click()}
            >
              <ImagePlus size={22} />
              <b>Add photo or video</b>
              <small>From your camera roll</small>
            </button>
            <button
              className="cap cap-voice"
              onClick={() => void record("audio")}
            >
              <Mic size={22} />
              <b>Voice note</b>
              <small>Talk it out</small>
            </button>
            <button
              className="cap cap-note"
              disabled={!text.trim()}
              onClick={() => {
                add({
                  id: crypto.randomUUID(),
                  kind: "text",
                  text: text.trim(),
                  created: new Date().toISOString(),
                });
                setText("");
                notify("Saved. Your ideas will use this.");
              }}
            >
              <PenLine size={22} />
              <b>Save note</b>
              <small>Just the words</small>
            </button>
            <input
              ref={file}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              aria-label="Add photo or video"
              onChange={async (e) => {
                const files = [...(e.target.files || [])];
                e.target.value = "";
                for (const f of files) {
                  if (
                    f.size > 100 * 1024 * 1024 ||
                    f.type === "image/svg+xml"
                  ) {
                    notify(`${f.name} is not supported or is over 100 MB.`);
                    continue;
                  }
                  await store(
                    f.type.startsWith("video") ? "video" : "photo",
                    f,
                    f.name,
                  );
                }
              }}
            />
          </div>
        )}
      </section>
      <section className="week">
        <div className="week-days" aria-label="This week">
          {week.map((d) => {
            const mine = entries.filter((e) => day(e.created) === day(d));
            const thumb = media.find(
              (m) => m.type === "image" && mine.some((e) => e.id === m.id),
            );
            return (
              <div
                key={day(d)}
                className={`week-day ${mine.length ? "has" : ""} ${day(d) === day(today) ? "now" : ""}`}
                title={`${mine.length} entr${mine.length === 1 ? "y" : "ies"}`}
              >
                <small>{d.toLocaleDateString([], { weekday: "short" })}</small>
                <span>
                  {thumb ? <img src={thumb.url} alt="" /> : mine.length || ""}
                </span>
              </div>
            );
          })}
        </div>
        <div className="week-cta">
          <p>
            <b>
              {clips
                ? `${clips} moment${clips === 1 ? "" : "s"} captured this week.`
                : "No clips this week yet."}
            </b>{" "}
            {clips
              ? "BRANDOS can cut them into a finished reel, with your notes as the captions."
              : "Film or add one above and BRANDOS can turn your week into a reel."}
          </p>
          <Button disabled={!clips} onClick={makeReel}>
            <WandSparkles size={16} /> Turn my week into a reel
          </Button>
        </div>
      </section>
      {entries.length > 0 && (
        <ol className="journal-list">
          {[...entries].reverse().map((e) => {
            const item = media.find((m) => m.id === e.id);
            return (
              <li key={e.id} className="card">
                <div className="row between">
                  <span className="eyebrow">
                    {e.kind === "text" ? "NOTE" : e.kind.toUpperCase()} ·{" "}
                    {new Date(e.created).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <button
                    className="icon-button"
                    aria-label="Delete entry"
                    title="Delete entry"
                    onClick={() => {
                      if (!confirm("Delete this journal entry?")) return;
                      if (e.kind === "audio")
                        void deleteFile(e.id).catch(() => {});
                      remove(e.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {e.kind === "audio" && <Recording id={e.id} />}
                {e.kind === "video" && item?.url && (
                  <video src={item.url} controls playsInline />
                )}
                {e.kind === "photo" && item?.url && (
                  <img src={item.url} alt={item.name} />
                )}
                {e.text && <p>{e.text}</p>}
                {item?.auto && (
                  <small className="muted">Indexed as: {item.auto}</small>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="muted journal-foot">
        Everything stays on this device. Notes shape your ideas; clips and
        photos join your footage library. Voice and video aren’t transcribed
        yet, so add a line of text if you want the words used.
      </p>
    </div>
  );
}
