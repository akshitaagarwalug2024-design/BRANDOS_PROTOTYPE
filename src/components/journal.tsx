"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Flame,
  Folder,
  FolderPlus,
  ImagePlus,
  Mic,
  PenLine,
  Square,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Thumbnail } from "./media";
import { deleteFile, getFile, putFile } from "@/lib/storage";
import { analyze, words } from "@/lib/library";
import type { JournalEntry, Media } from "@/lib/model";
const questions = [
  "What is coming up in the business next week?",
  "What did the team work on today?",
  "What did a customer ask or say this week?",
  "What are you launching, making or delivering?",
  "What do customers often get wrong about your work?",
  "What happened behind the scenes today?",
  "What result or milestone is worth sharing?",
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
  move,
  makeReel,
  notify,
}: {
  entries: JournalEntry[];
  media: Media[];
  add: (e: JournalEntry, m?: Media) => void;
  remove: (id: string) => void;
  move: (id: string, folder: string) => void;
  makeReel: () => void;
  notify: (s: string) => void;
}) {
  const [text, setText] = useState(""),
    [recording, setRecording] = useState<"" | "audio" | "video">(""),
    [seconds, setSeconds] = useState(0);
  const [folder, setFolder] = useState(""),
    [extra, setExtra] = useState<string[]>([]),
    [naming, setNaming] = useState(false),
    [over, setOver] = useState(""),
    [open, setOpen] = useState("");
  // A clip or photo lives in its library folder; notes and voice keep their own.
  const place = (e: JournalEntry) =>
    media.find((m) => m.id === e.id)?.collection || e.folder || "Journal";
  const folders = [...new Set([...entries.map(place), ...extra])];
  const shown = entries.find((e) => e.id === open);
  const shownMedia = media.find((m) => m.id === open);
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
          : "Saved to the journal and the media library.",
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
            {streak ? `${streak}-day streak` : "No entry yet today"}
          </span>
        </div>
        <h2>{questions[today.getDay()]}</h2>
        <textarea
          aria-label="Journal entry"
          maxLength={2000}
          placeholder="A sentence or two is enough. You can also record or upload instead."
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
              <b>Record a clip</b>
              <small>A short video update</small>
            </button>
            <button
              className="cap cap-file"
              onClick={() => file.current?.click()}
            >
              <ImagePlus size={22} />
              <b>Add photo or video</b>
              <small>From this device</small>
            </button>
            <button
              className="cap cap-voice"
              onClick={() => void record("audio")}
            >
              <Mic size={22} />
              <b>Voice note</b>
              <small>A quick spoken update</small>
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
                notify("Entry saved. It will inform your content ideas.");
              }}
            >
              <PenLine size={22} />
              <b>Save note</b>
              <small>Text only</small>
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
                ? `${clips} clip${clips === 1 ? "" : "s"} or photo${clips === 1 ? "" : "s"} logged this week.`
                : "No clips or photos logged this week."}
            </b>{" "}
            {clips
              ? "UnStuck can assemble them into a weekly recap video, using your notes as captions."
              : "Record or add one above to create a weekly recap video."}
          </p>
          <Button disabled={!clips} onClick={makeReel}>
            <WandSparkles size={16} /> Create weekly recap video
          </Button>
        </div>
      </section>
      {entries.length > 0 && (
        <section className="jr">
          <div className="jr-folders" role="group" aria-label="Journal folders">
            {["", ...folders].map((f) => (
              <button
                key={f || "all"}
                className={`${folder === f ? "active" : ""} ${over === f && f ? "over" : ""}`}
                aria-pressed={folder === f}
                onClick={() => setFolder(f)}
                onDragOver={(e) => {
                  if (!f) return;
                  e.preventDefault();
                  setOver(f);
                }}
                onDragLeave={() => setOver("")}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver("");
                  const id = e.dataTransfer.getData("text/brandos-entry");
                  if (id && f) move(id, f);
                }}
              >
                <Folder size={13} /> {f || "All entries"}{" "}
                <span>
                  {f
                    ? entries.filter((e) => place(e) === f).length
                    : entries.length}
                </span>
              </button>
            ))}
            {naming ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = new FormData(e.currentTarget)
                    .get("name")!
                    .toString()
                    .trim();
                  if (name) {
                    setExtra([...extra, name]);
                    setFolder(name);
                  }
                  setNaming(false);
                }}
              >
                <input
                  name="name"
                  autoFocus
                  aria-label="New journal folder name"
                  placeholder="Folder name, then Enter"
                  maxLength={40}
                  onBlur={() => setNaming(false)}
                />
              </form>
            ) : (
              <button className="jr-new" onClick={() => setNaming(true)}>
                <FolderPlus size={13} /> New folder
              </button>
            )}
          </div>
          <div className="jr-grid">
            {[...entries]
              .reverse()
              .filter((e) => !folder || place(e) === folder)
              .map((e) => {
                const item = media.find((m) => m.id === e.id);
                return (
                  <button
                    key={e.id}
                    className="jr-tile"
                    draggable
                    onDragStart={(ev) =>
                      ev.dataTransfer.setData("text/brandos-entry", e.id)
                    }
                    title={e.text || e.kind}
                    aria-label={`Open ${e.kind === "text" ? "note" : e.kind} from ${new Date(e.created).toLocaleDateString([], { day: "numeric", month: "short" })}`}
                    onClick={() => setOpen(e.id)}
                  >
                    {item?.url && e.kind !== "audio" ? (
                      <Thumbnail media={item} />
                    ) : (
                      <span className="jr-icon">
                        {e.kind === "audio" ? (
                          <Mic size={20} />
                        ) : e.kind === "text" ? (
                          <PenLine size={20} />
                        ) : (
                          <Camera size={20} />
                        )}
                      </span>
                    )}
                    <small>
                      {new Date(e.created).toLocaleDateString([], {
                        day: "numeric",
                        month: "short",
                      })}
                    </small>
                    <small className="jr-text">
                      {e.text || (e.kind === "text" ? "" : e.kind)}
                    </small>
                  </button>
                );
              })}
          </div>
          {folder && !entries.some((e) => place(e) === folder) && (
            <p className="muted">
              This folder is empty. Drag an entry onto it, or open an entry and
              choose this folder.
            </p>
          )}
        </section>
      )}
      {shown && (
        <div className="modal-backdrop" onClick={() => setOpen("")}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Journal entry"
            className="modal"
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close"
              onClick={() => setOpen("")}
              aria-label="Close entry"
            >
              ×
            </button>
            <span className="eyebrow">
              {shown.kind === "text" ? "NOTE" : shown.kind.toUpperCase()} ·{" "}
              {new Date(shown.created).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {shown.kind === "audio" && <Recording id={shown.id} />}
            {shown.kind === "video" && shownMedia?.url && (
              <video
                className="detail-preview"
                src={shownMedia.url}
                controls
                playsInline
              />
            )}
            {shown.kind === "photo" && shownMedia?.url && (
              <img
                className="detail-preview"
                src={shownMedia.url}
                alt={shownMedia.name}
              />
            )}
            {shown.text && <p>{shown.text}</p>}
            {shownMedia?.auto && (
              <small className="muted">Indexed as: {shownMedia.auto}</small>
            )}
            <label>
              Folder
              <select
                aria-label="Entry folder"
                value={place(shown)}
                onChange={(ev) => move(shown.id, ev.target.value)}
              >
                {[...new Set([place(shown), ...folders])].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <div className="row between">
              <Button variant="outline" onClick={() => setOpen("")}>
                Done
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!confirm("Delete this journal entry?")) return;
                  if (shown.kind === "audio")
                    void deleteFile(shown.id).catch(() => {});
                  remove(shown.id);
                  setOpen("");
                }}
              >
                <Trash2 size={14} /> Delete entry
              </Button>
            </div>
          </section>
        </div>
      )}
      <p className="muted journal-foot">
        Entries are stored on this device. Notes inform content ideas; clips and
        photos are added to the media library. Voice and video are not
        transcribed yet, so add a line of text if the words should be used.
      </p>
    </div>
  );
}
