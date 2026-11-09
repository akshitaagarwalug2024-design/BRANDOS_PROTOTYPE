"use client";
import { useRef, useState, useEffect } from "react";
import {
  Upload,
  Film,
  Music,
  Check,
  Play,
  Pause,
  ArrowUpRight,
  ImageIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { putFile, deleteFile } from "@/lib/storage";
import type { Media, Project, Brand } from "@/lib/model";
export function Thumbnail({
  media,
  className = "",
}: {
  media?: Media;
  className?: string;
}) {
  return (
    <div className={`media-thumb ${className}`}>
      {media?.type === "video" ? (
        <video
          src={media.url}
          poster={media.sample ? "/media/morning.svg" : undefined}
          muted
          preload="auto"
        />
      ) : media?.type === "image" ? (
        <img src={media.url} alt={media.name} />
      ) : (
        <div className="audio-art">
          <Music size={36} />
          <span>Sound & story</span>
        </div>
      )}
      {media?.type === "video" && (
        <span className="thumb-icon">
          <Film size={13} />
        </span>
      )}
    </div>
  );
}
export function Uploader({
  onAdd,
  notify,
}: {
  onAdd: (media: Media[]) => void;
  notify: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const added: Media[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (
          !/^(image|video|audio)\//.test(f.type) ||
          f.type === "image/svg+xml"
        ) {
          notify(
            `${f.name}: choose a supported photo, video, or audio file (SVG uploads are not supported).`,
          );
          continue;
        }
        if (f.size > 100 * 1024 * 1024) {
          notify(`${f.name} is over the 100 MB per-file limit.`);
          continue;
        }
        const id = crypto.randomUUID();
        await putFile(id, f);
        added.push({
          id,
          name: f.name,
          type: f.type.split("/")[0] as Media["type"],
          url: URL.createObjectURL(f),
          collection: "My uploads",
          tags: "",
          size: f.size,
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      if (added.length) onAdd(added);
    } catch {
      notify(
        "Storage is full or unavailable. Try a smaller file; files already stored have been kept.",
      );
      if (added.length) onAdd(added);
    } finally {
      setBusy(false);
      setProgress(0);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div
      className={`upload-zone ${drag ? "drag" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!busy) void add(e.dataTransfer.files);
      }}
    >
      <span className="upload-icon">
        <Upload size={25} />
      </span>
      <h3>
        {busy
          ? `Storing your media · ${progress}%`
          : "Good stories start with your moments."}
      </h3>
      <p>Drop videos, photos, or audio here. Up to 100 MB per file.</p>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Upload size={15} /> Browse files
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        onChange={(e) => void add(e.target.files)}
        hidden
      />
      {busy && (
        <progress
          max={100}
          value={progress}
          aria-label="File storage progress"
        />
      )}
      <small>Stored on this device · no upload to an external service</small>
    </div>
  );
}
export function MediaLibrary({
  media,
  onAdd,
  onChange,
  onDelete,
  notify,
  onDiscover,
}: {
  media: Media[];
  onAdd: (m: Media[]) => void;
  onChange: (m: Media) => void;
  onDelete: (id: string) => void;
  notify: (s: string) => void;
  onDiscover: () => void;
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<Media | null>(null);
  const filtered = media.filter(
    (m) =>
      (filter === "all" || m.type === filter) &&
      `${m.name} ${m.tags} ${m.collection}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Uploader onAdd={onAdd} notify={notify} />
      <div className="section-heading compact">
        <div>
          <h2>
            Your media, in one place{" "}
            <span className="count">{media.length}</span>
          </h2>
          <p>Organize a collection. Find the story. Use it again.</p>
        </div>
        <Button variant="outline" onClick={onDiscover}>
          Find posts in my footage <ArrowUpRight size={15} />
        </Button>
      </div>
      <div className="filter-row">
        <input
          aria-label="Search media"
          placeholder="Search names, tags, collections…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter media type"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All media</option>
          <option value="image">Photos</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
        </select>
      </div>
      <div className="media-grid">
        {filtered.map((m) => (
          <button
            key={m.id}
            className="media-card"
            onClick={() => setSelected(m)}
          >
            <Thumbnail media={m} />
            <div>
              <b>{m.name}</b>
              <small>
                {m.collection} {m.sample ? "· Sample" : ""}
              </small>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <ImageIcon />
          <h3>No media found</h3>
          <p>Try a different search or add a new file above.</p>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Media details"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close media details"
            >
              ×
            </button>
            <h2>Make it easy to find.</h2>
            {selected.type === "video" ? (
              <video className="detail-preview" src={selected.url} controls />
            ) : selected.type === "audio" ? (
              <audio src={selected.url} controls />
            ) : (
              <img
                className="detail-preview"
                src={selected.url}
                alt={selected.name}
              />
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onChange(selected);
                setSelected(null);
                notify("Media details saved.");
              }}
            >
              <label>
                Name
                <input
                  required
                  value={selected.name}
                  onChange={(e) =>
                    setSelected({ ...selected, name: e.target.value })
                  }
                />
              </label>
              <div className="two-col">
                <label>
                  Collection
                  <input
                    value={selected.collection}
                    onChange={(e) =>
                      setSelected({ ...selected, collection: e.target.value })
                    }
                  />
                </label>
                <label>
                  Tags
                  <input
                    value={selected.tags}
                    onChange={(e) =>
                      setSelected({ ...selected, tags: e.target.value })
                    }
                  />
                </label>
              </div>
              <p className="notice">
                {selected.sample
                  ? "Sample metadata: illustrative lifestyle scenes."
                  : "No AI footage analysis is connected. Add your own tags to help organize this file."}
              </p>
              <div className="row between">
                <Button type="submit">
                  Save details <Check size={15} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    if (
                      confirm(
                        "Delete this file? Remove it from projects first if you still need it.",
                      )
                    ) {
                      try {
                        onDelete(selected.id);
                        setSelected(null);
                      } catch {
                        notify("Could not delete file. Try again.");
                      }
                    }
                  }}
                >
                  Delete media
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
export function Preview({
  project,
  media,
  brand,
  active = 0,
  onActive,
}: {
  project: Project;
  media: Media[];
  brand: Brand;
  active?: number;
  onActive?: (i: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scene = project.scenes[active] || project.scenes[0];
  const item = media.find(
    (m) => m.id === (scene?.mediaId || project.mediaIds[0]),
  );
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!playing || !scene) return;
    timer.current = setTimeout(() => {
      if (active < project.scenes.length - 1) onActive?.(active + 1);
      else {
        setPlaying(false);
        onActive?.(0);
      }
    }, scene.duration * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, active, scene, onActive, project.scenes.length]);
  useEffect(() => {
    const player = video.current || audio.current;
    if (player) {
      player.currentTime = scene?.trim || 0;
      player.volume = project.volume;
      if (playing) player.play().catch(() => setPlaying(false));
      else player.pause();
    }
  }, [playing, active, item?.url, scene?.trim, project.volume]);
  return (
    <div className="preview-wrap">
      <div
        className={`video-preview ratio-${project.ratio.replace(":", "-")}`}
        style={{
          background: brand.color,
          filter: `brightness(${project.brightness}%)`,
        }}
      >
        {item?.type === "video" ? (
          <video
            ref={video}
            src={item.url}
            loop
            playsInline
            muted={project.volume === 0}
          />
        ) : item?.type === "image" ? (
          <img src={item.url} alt={item.name} />
        ) : (
          <div className="audio-art">
            <Music size={48} />
            <p>{item?.name || "Your story starts here"}</p>
            {item?.type === "audio" && (
              <audio ref={audio} src={item.url} loop />
            )}
          </div>
        )}
        <div className="preview-brand">
          {brand.logo && <img src={brand.logo} alt="Brand logo" />}MADE WITH
          INTENTION
        </div>
        {project.subtitles && (
          <div
            className={`preview-caption ${brand.font === "Serif" ? "serif" : ""}`}
          >
            {scene?.text || project.idea || "A slower kind of morning."}
          </div>
        )}
        <button
          className="preview-play"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          {playing ? (
            <Pause size={20} />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>
        <span className="preview-label">
          {item?.sample ? "SAMPLE FOOTAGE" : "LOCAL PREVIEW"}
        </span>
      </div>
      <div className="row between preview-meta">
        <span>
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(Math.max(1, project.scenes.length)).padStart(2, "0")} scenes
        </span>
        <span>
          {project.scenes.reduce((n, s) => n + s.duration, 0)} sec ·{" "}
          {project.ratio}
        </span>
      </div>
    </div>
  );
}
