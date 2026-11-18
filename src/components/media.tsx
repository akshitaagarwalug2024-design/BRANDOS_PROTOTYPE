"use client";
import { useRef, useState, useEffect } from "react";
import {
  Upload,
  Film,
  Music,
  Check,
  Play,
  Pause,
  ImageIcon,
  LayoutGrid,
  List,
  Folder,
  FolderPlus,
  WandSparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { putFile } from "@/lib/storage";
import { analyze } from "@/lib/library";
import {
  gradeFilter,
  type Item,
  type Media,
  type Project,
  type Brand,
} from "@/lib/model";
import { svgUrl } from "@/lib/shapes";
import { fill } from "@/lib/colour";
import { startMusic } from "@/lib/music";
import { contrastText } from "@/lib/render";
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
          <span>Audio</span>
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
  collection = "My uploads",
}: {
  onAdd: (media: Media[]) => void;
  notify: (s: string) => void;
  collection?: string;
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
        if (!/^(image|video)\//.test(f.type) || f.type === "image/svg+xml") {
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
          collection,
          tags: "",
          size: f.size,
          ...(await analyze(
            f,
            f.type.split("/")[0] as Media["type"],
            f.lastModified,
          )),
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
      className={`upload-bar ${drag ? "drag" : ""}`}
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
      <Upload size={17} />
      <span>
        {busy ? (
          `Storing your media · ${progress}%`
        ) : (
          <>
            <b>Drop videos or photos here</b> · goes into “{collection}” · up to
            100 MB each
          </>
        )}
      </span>
      {busy && (
        <progress
          max={100}
          value={progress}
          aria-label="File storage progress"
        />
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        Browse files
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => void add(e.target.files)}
        hidden
      />
    </div>
  );
}
const fileSize = (n?: number) =>
  !n
    ? "—"
    : n > 1048576
      ? `${(n / 1048576).toFixed(1)} MB`
      : `${Math.ceil(n / 1024)} KB`;
export function MediaLibrary({
  media,
  onAdd,
  onChange,
  onDelete,
  onMove,
  onMake,
  notify,
}: {
  media: Media[];
  onAdd: (m: Media[]) => void;
  onChange: (m: Media) => void;
  onDelete: (id: string) => void;
  onMove: (ids: string[], collection: string) => void;
  onMake: (ids: string[]) => void;
  notify: (s: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [list, setList] = useState(false),
    [folder, setFolder] = useState(""),
    [extra, setExtra] = useState<string[]>([]),
    [naming, setNaming] = useState(false),
    [picked, setPicked] = useState<string[]>([]),
    [over, setOver] = useState(""),
    [selected, setSelected] = useState<Media | null>(null);
  const folders = [...new Set([...media.map((m) => m.collection), ...extra])];
  const filtered = media.filter(
    (m) =>
      (!folder || m.collection === folder) &&
      (filter === "all" || m.type === filter) &&
      `${m.name} ${m.tags} ${m.collection} ${m.auto || ""} ${m.note || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const move = (ids: string[], to: string) => {
    if (!ids.length || !to) return;
    onMove(ids, to);
    setPicked([]);
    notify(
      `Moved ${ids.length} file${ids.length === 1 ? "" : "s"} to “${to}”.`,
    );
  };
  const drop = (to: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(to);
    },
    onDragLeave: () => setOver(""),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver("");
      const id = e.dataTransfer.getData("text/brandos-media");
      if (id) move(picked.includes(id) ? picked : [id], to);
    },
  });
  return (
    <div className="lib">
      <nav className="lib-folders" aria-label="Folders">
        <button
          className={!folder ? "active" : ""}
          onClick={() => setFolder("")}
        >
          <Folder size={15} /> All files <span>{media.length}</span>
        </button>
        {folders.map((f) => (
          <button
            key={f}
            className={`${folder === f ? "active" : ""} ${over === f ? "over" : ""}`}
            onClick={() => setFolder(f)}
            {...drop(f)}
          >
            <Folder size={15} /> {f}{" "}
            <span>{media.filter((m) => m.collection === f).length}</span>
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
                if (picked.length) move(picked, name);
              }
              setNaming(false);
            }}
          >
            <input
              name="name"
              autoFocus
              aria-label="New folder name"
              placeholder="Folder name, then Enter"
              maxLength={40}
              onBlur={() => setNaming(false)}
            />
          </form>
        ) : (
          <button className="lib-new" onClick={() => setNaming(true)}>
            <FolderPlus size={15} /> New folder
          </button>
        )}
        <small>Drag files onto a folder, or tick them and choose Move.</small>
      </nav>
      <div className="lib-main">
        <Uploader
          onAdd={onAdd}
          notify={notify}
          collection={folder || "My uploads"}
        />
        <div className="filter-row media-toolbar">
          <input
            aria-label="Search media"
            placeholder="Search names, tags, folders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="segmented" role="group" aria-label="Media type">
            {[
              ["all", "All"],
              ["image", "Photos"],
              ["video", "Videos"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={filter === key ? "active" : ""}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <span>
            {filtered.length} of {media.length} files
          </span>
          <div className="segmented" role="group" aria-label="Layout">
            <button
              className={!list ? "active" : ""}
              aria-pressed={!list}
              aria-label="Grid view"
              title="Grid view"
              onClick={() => setList(false)}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={list ? "active" : ""}
              aria-pressed={list}
              aria-label="List view"
              title="List view"
              onClick={() => setList(true)}
            >
              <List size={14} />
            </button>
          </div>
        </div>
        {picked.length > 0 && (
          <div
            className="lib-actions"
            role="region"
            aria-label="Selected files"
          >
            <b>{picked.length} selected</b>
            <select
              aria-label="Move selected files to folder"
              value=""
              onChange={(e) =>
                e.target.value === "+"
                  ? setNaming(true)
                  : move(picked, e.target.value)
              }
            >
              <option value="">Move to folder…</option>
              {folders.map((f) => (
                <option key={f}>{f}</option>
              ))}
              <option value="+">+ New folder</option>
            </select>
            <Button size="sm" onClick={() => onMake(picked)}>
              <WandSparkles size={14} /> Make a post from these
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
              Clear
            </Button>
          </div>
        )}
        <div className={list ? "media-list" : "media-tiles"}>
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`media-cell ${picked.includes(m.id) ? "picked" : ""}`}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("text/brandos-media", m.id)
              }
            >
              <input
                type="checkbox"
                aria-label={`Select ${m.name}`}
                checked={picked.includes(m.id)}
                onChange={(e) =>
                  setPicked(
                    e.target.checked
                      ? [...picked, m.id]
                      : picked.filter((id) => id !== m.id),
                  )
                }
              />
              <button
                className="media-tile"
                title={`${m.name} · ${m.collection}`}
                onClick={() => setSelected(m)}
              >
                <Thumbnail media={m} />
                <b>{m.name}</b>
                <small>
                  {m.collection}
                  {m.sample ? " · Sample" : ""}
                </small>
                {list && (
                  <>
                    <small>{m.auto || m.type}</small>
                    <small>{m.tags || "No tags"}</small>
                    <small>{fileSize(m.size)}</small>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            <ImageIcon />
            <h3>{folder ? `“${folder}” is empty` : "No media found"}</h3>
            <p>
              {folder
                ? "Drop files above to add them straight to this folder."
                : "Try a different search or add a new file above."}
            </p>
          </div>
        )}
      </div>
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
            <h2>File details</h2>
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
                    list="lib-folders"
                    value={selected.collection}
                    onChange={(e) =>
                      setSelected({ ...selected, collection: e.target.value })
                    }
                  />
                  <datalist id="lib-folders">
                    {folders.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
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
              {selected.auto && (
                <p className="muted">
                  Indexed automatically as: {selected.auto}
                  {selected.meta?.duration
                    ? ` · ${selected.meta.duration}s`
                    : ""}
                </p>
              )}
              <div className="row between">
                <Button type="submit">
                  Save details <Check size={15} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this file?")) {
                      onDelete(selected.id);
                      setSelected(null);
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
    </div>
  );
}
const slug = (s: string) => s.toLowerCase().replaceAll(" ", "-");
export function Preview({
  project,
  media,
  brand,
  active = 0,
  onActive,
  selected,
  onSelect,
  onItem,
}: {
  project: Project;
  media: Media[];
  brand: Brand;
  active?: number;
  onActive?: (i: number) => void;
  // Passing these makes overlay items selectable and draggable.
  selected?: string;
  onSelect?: (id: string) => void;
  onItem?: (id: string, v: Partial<Item>) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = (
    e: React.PointerEvent,
    item: Item,
    mode: "move" | "size" | "rot",
  ) => {
    if (!onItem || !frame.current) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(item.id);
    const box = frame.current.getBoundingClientRect();
    const cx = box.left + item.x * box.width,
      cy = box.top + item.y * box.height;
    const sx = e.clientX,
      sy = e.clientY,
      reach = Math.hypot(sx - cx, sy - cy) || 1;
    const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
    const move = (ev: PointerEvent) =>
      onItem(
        item.id,
        mode === "move"
          ? {
              x: clamp(item.x + (ev.clientX - sx) / box.width),
              y: clamp(item.y + (ev.clientY - sy) / box.height),
            }
          : mode === "size"
            ? {
                w: clamp(
                  (item.w * Math.hypot(ev.clientX - cx, ev.clientY - cy)) /
                    reach,
                  0.05,
                  1.5,
                ),
              }
            : {
                rot: Math.round(
                  (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) /
                    Math.PI +
                    90,
                ),
              },
      );
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scene = project.scenes[active] || project.scenes[0];
  const item = media.find(
    (m) => m.id === (scene?.mediaId || project.mediaIds[0]),
  );
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const total = project.scenes.reduce((n, s) => n + s.duration, 0) || 1;
  const before = project.scenes
    .slice(0, active)
    .reduce((n, s) => n + s.duration, 0);
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
  // Backing track plays only while the preview is playing.
  const ownTrack =
    project.music === "My audio"
      ? media.find((m) => m.id === project.musicId)?.url
      : undefined;
  useEffect(() => {
    if (!playing || project.music === "None") return;
    if (project.music === "My audio") {
      if (!ownTrack) return;
      const track = new Audio(ownTrack);
      track.loop = true;
      track.volume = project.musicVolume;
      void track.play().catch(() => {});
      return () => track.pause();
    }
    const ctx = new AudioContext();
    const stop = startMusic(
      ctx,
      ctx.destination,
      project.music,
      project.musicVolume,
    );
    return () => {
      stop();
      setTimeout(() => void ctx.close(), 450);
    };
  }, [playing, project.music, project.musicVolume, ownTrack]);
  const accent = fill(project.accent || brand.color);
  const motion = {
    animationDuration: `${scene?.duration || 5}s`,
    animationPlayState: playing ? "running" : "paused",
  };
  const motionClass = `mo-${slug(scene?.motion || "None")}`;
  return (
    <div className="preview-wrap">
      <div
        className={`video-preview ratio-${project.ratio.replace(":", "-")} font-${slug(brand.font)}`}
        style={{ background: "#000" }}
        ref={frame}
        onPointerDown={() => onSelect?.("")}
      >
        <div
          key={scene?.id}
          className={`pv-stage ${playing ? `tr-${slug(scene?.transition || project.transition)}` : ""}`}
          style={{
            background: accent,
            filter: gradeFilter(project.grade, project.brightness),
          }}
        >
          {item?.type === "video" ? (
            <video
              ref={video}
              className={motionClass}
              style={motion}
              src={item.url}
              loop
              playsInline
              muted={project.volume === 0}
            />
          ) : item?.type === "image" ? (
            <img
              className={motionClass}
              style={motion}
              src={item.url}
              alt={item.name}
            />
          ) : (
            <div className="audio-art">
              <Music size={48} />
              <p>{item?.name || "No media selected"}</p>
              {item?.type === "audio" && (
                <audio ref={audio} src={item.url} loop />
              )}
            </div>
          )}
        </div>
        {project.items
          .filter((item) => item.scene === "all" || item.scene === scene?.id)
          .map((item) => {
            const file = media.find((m) => m.id === item.mediaId);
            const src = item.svg ? svgUrl(item.svg, item.color) : file?.url;
            if (!src) return null;
            return (
              <div
                key={item.id}
                className={`pv-item ${selected === item.id ? "sel" : ""} ${onItem ? "edit" : ""}`}
                style={{
                  left: `${item.x * 100}%`,
                  top: `${item.y * 100}%`,
                  width: `${item.w * 100}%`,
                  aspectRatio: item.aspect,
                  transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
                }}
                onPointerDown={(e) => drag(e, item, "move")}
              >
                <div
                  key={`${scene?.id}${playing}`}
                  className={`an-${slug(item.anim)}`}
                >
                  {file?.type === "video" ? (
                    <video src={src} muted loop autoPlay playsInline />
                  ) : (
                    <img src={src} alt={item.name} draggable={false} />
                  )}
                </div>
                {selected === item.id && onItem && (
                  <>
                    <span
                      className="h-size"
                      title="Drag to resize"
                      onPointerDown={(e) => drag(e, item, "size")}
                    />
                    <span
                      className="h-rot"
                      title="Drag to rotate"
                      onPointerDown={(e) => drag(e, item, "rot")}
                    />
                  </>
                )}
              </div>
            );
          })}
        {project.elements.progress && (
          <div className="pv-progress">
            <span
              style={{
                background: accent,
                width: `${((before + (playing ? scene?.duration || 0 : 0)) / total) * 100}%`,
                transitionDuration: playing ? `${scene?.duration}s` : "0s",
              }}
            />
          </div>
        )}
        {project.elements.watermark && (
          <div className="preview-brand">
            {brand.logo && <img src={brand.logo} alt="Brand logo" />}
            {project.mark}
          </div>
        )}
        {project.elements.title && active === 0 && (
          <div
            key={`t${playing}`}
            className={`pv-title ${playing ? "timed" : ""}`}
          >
            <span style={{ background: accent, color: contrastText(accent) }}>
              {project.coverTitle || project.title}
            </span>
          </div>
        )}
        {project.subtitles && scene?.text && (
          <div
            key={`s${scene.id}${playing}`}
            className={`preview-caption ts-${slug(project.textStyle)} tp-${slug(project.textPosition)} ta-${slug(project.textAnim)}`}
          >
            <span>
              {scene.text.split(" ").map((word, i, all) => {
                const step = Math.max(
                  0.22,
                  Math.min(0.5, (scene.duration * 0.8) / all.length),
                );
                const on =
                  project.captionFx === "Highlight" &&
                  project.textStyle !== "Minimal";
                return (
                  <i
                    key={i}
                    className={
                      on ? (playing ? "hl" : i === 0 ? "hl-on" : "") : ""
                    }
                    style={
                      {
                        "--hl": accent,
                        "--hlc": contrastText(accent),
                        animationDuration: `${step}s`,
                        animationDelay: `${i * step}s`,
                      } as React.CSSProperties
                    }
                  >
                    {word}{" "}
                  </i>
                );
              })}
            </span>
          </div>
        )}
        {project.elements.cta &&
          project.cta &&
          active === project.scenes.length - 1 && (
            <div
              className="pv-cta"
              style={{
                background: accent,
                color: contrastText(accent),
                animationDelay: playing
                  ? `${Math.max(0, (scene?.duration || 0) - 2.5)}s`
                  : "0s",
              }}
              key={`c${playing}`}
            >
              <b>{project.cta}</b>
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
      </div>
      <div className="row between preview-meta">
        <span>
          Scene {active + 1} of {Math.max(1, project.scenes.length)}
        </span>
        <span>
          {Math.round(total * 10) / 10} sec · {project.ratio} ·{" "}
          {project.music === "None" ? "no music" : `${project.music} music`}
        </span>
      </div>
    </div>
  );
}
