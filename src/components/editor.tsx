"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  LoaderCircle,
  Plus,
  Repeat,
  RotateCcw,
  Save,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Preview, Thumbnail, Uploader } from "./media";
import PostPackage from "./post-package";
import {
  editSummary,
  looks,
  options,
  platforms,
  type Media,
  type Project,
  type Scene,
  type State,
} from "@/lib/model";
const tabs = [
  "Scenes",
  "Text",
  "Transitions",
  "Music",
  "Elements",
  "Colour",
  "Ask for a change",
];
function Chips({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="chip-field" role="group" aria-label={label}>
      <span>{label}</span>
      <div>
        {items.map((item) => (
          <button
            key={item}
            className={`chip ${value === item ? "selected" : ""}`}
            aria-pressed={value === item}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
export default function Editor({
  project: p,
  state,
  update,
  addMedia,
  notify,
  finish,
}: {
  project: Project;
  state: State;
  update: (p: Project) => void;
  addMedia: (m: Media[]) => void;
  notify: (s: string) => void;
  finish: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [active, setActive] = useState(0),
    [revision, setRevision] = useState(""),
    [tab, setTab] = useState(tabs[0]),
    // Scene index being re-pointed at another file; -1 adds a new scene.
    [picker, setPicker] = useState<number | null>(null);
  const set = (v: Partial<Project>) => update({ ...p, ...v });
  const setScene = (id: string, v: Partial<Scene>) =>
    set({ scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...v } : s)) });
  const total = p.scenes.reduce((n, s) => n + s.duration, 0);
  const snapshot = (label: string) =>
    [
      ...p.history,
      {
        label,
        scenes: structuredClone(p.scenes),
        caption: p.caption,
        style: p.style,
        subtitles: p.subtitles,
      },
    ].slice(-20);
  const restyle = (style: string) => {
    const look = looks[style];
    set({
      style,
      scenes: p.scenes.map((s, i) => ({
        ...s,
        duration: look.pace,
        transition: i === 0 ? "Fade" : look.transition,
        motion: look.motions[i % look.motions.length],
      })),
      transition: look.transition,
      textAnim: look.textAnim,
      textStyle: look.textStyle,
      music: look.music,
      grade: look.grade,
      history: snapshot(`Before “${style}” restyle`),
    });
    notify(`Re-edited as “${style}”. Undo it from the edit history.`);
  };
  const pick = (m: Media) => {
    const mediaIds = p.mediaIds.includes(m.id)
      ? p.mediaIds
      : [...p.mediaIds, m.id];
    if (picker === -1) {
      const look = looks[p.style] || looks["Slow & intentional"];
      set({
        mediaIds,
        scenes: [
          ...p.scenes,
          {
            id: crypto.randomUUID(),
            mediaId: m.id,
            title: m.name,
            duration: look.pace,
            trim: 0,
            text: "",
            transition: look.transition,
            motion: look.motions[p.scenes.length % look.motions.length],
          },
        ],
      });
      setActive(p.scenes.length);
    } else if (picker !== null)
      set({
        mediaIds,
        scenes: p.scenes.map((s, i) =>
          i === picker ? { ...s, mediaId: m.id, trim: 0 } : s,
        ),
      });
    setPicker(null);
  };
  const revise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revision.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revise",
          scenes: p.scenes,
          request: revision,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      set({
        scenes: data.scenes,
        history: snapshot(revision),
        subtitles: /minimal|caption/.test(revision.toLowerCase())
          ? false
          : p.subtitles,
      });
      setActive(0);
      setRevision("");
      notify(data.explanation);
    } catch (e) {
      notify(
        e instanceof Error
          ? e.message
          : "Revision failed. Your project is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wizard">
      <div className="wizard-top">
        <input
          className="title-input"
          aria-label="Post title"
          maxLength={150}
          value={p.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        <div className="segmented" role="group" aria-label="Stage">
          <button
            className={p.step === 0 ? "active" : ""}
            aria-pressed={p.step === 0}
            onClick={() => set({ step: 0 })}
          >
            1 · Edit
          </button>
          <button
            className={p.step === 1 ? "active" : ""}
            aria-pressed={p.step === 1}
            onClick={() => set({ step: 1 })}
          >
            2 · Caption & export
          </button>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            notify("Your draft is saved on this device.");
            finish();
          }}
        >
          <Save size={15} /> Save & exit
        </Button>
      </div>
      {p.step === 0 ? (
        <div className="editor-content">
          <div className="ed-summary">
            <WandSparkles size={18} />
            <p>
              <b>Your ready-to-post edit is done.</b> {editSummary(p)}. Press
              play to watch it, then change anything on the right.
            </p>
            <span className="badge">DEMO AUTO-EDIT</span>
          </div>
          <div className="ed-format">
            <label>
              Posting to
              <select
                aria-label="Platform"
                value={p.platform in platforms ? p.platform : "Other"}
                onChange={(e) =>
                  set({
                    platform: e.target.value,
                    ratio: platforms[e.target.value] || p.ratio,
                  })
                }
              >
                {Object.keys(platforms).map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            {(!(p.platform in platforms) || p.platform === "Other") && (
              <label>
                Specify other
                <input
                  aria-label="Specify other platform"
                  placeholder="e.g. Threads, WhatsApp Status"
                  maxLength={40}
                  value={p.platform === "Other" ? "" : p.platform}
                  onChange={(e) => set({ platform: e.target.value || "Other" })}
                />
              </label>
            )}
            <Chips
              label="Shape"
              value={p.ratio}
              items={["9:16", "1:1", "16:9"]}
              onChange={(ratio) => set({ ratio })}
            />
          </div>
          <div className="editor-grid ed-grid">
            <div className="editor-preview">
              <Preview
                project={p}
                media={state.media}
                brand={state.brand}
                active={active}
                onActive={setActive}
              />
              <div className="timeline" aria-label="Scene timeline">
                {p.scenes.map((s, i) => (
                  <button
                    key={s.id}
                    style={{ flex: s.duration }}
                    className={active === i ? "active" : ""}
                    aria-label={`Show scene ${i + 1}`}
                    onClick={() => setActive(i)}
                  >
                    <span>{i + 1}</span>
                    <b>{s.duration}s</b>
                  </button>
                ))}
              </div>
            </div>
            <div className="editor-controls">
              <Chips
                label="Re-edit everything in one click"
                value={p.style}
                items={Object.keys(looks)}
                onChange={restyle}
              />
              <div className="ed-tabs" role="tablist" aria-label="Edit">
                {tabs.map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    className={tab === t ? "active" : ""}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <section className="ed-panel" role="tabpanel" aria-label={tab}>
                {tab === "Scenes" && (
                  <>
                    <p className="muted">
                      {p.scenes.length} scenes · {total}s total. Reorder, swap
                      the clip, or change how long each one lasts.
                    </p>
                    {p.scenes.map((scene, i) => (
                      <div
                        key={scene.id}
                        className={`ed-scene ${active === i ? "selected" : ""}`}
                      >
                        <button
                          className="scene-select"
                          onClick={() => setActive(i)}
                          aria-label={`Preview scene ${i + 1}`}
                        >
                          <Thumbnail
                            media={state.media.find(
                              (m) => m.id === scene.mediaId,
                            )}
                          />
                        </button>
                        <input
                          aria-label={`Scene ${i + 1} title`}
                          value={scene.title}
                          onFocus={() => setActive(i)}
                          onChange={(e) =>
                            setScene(scene.id, { title: e.target.value })
                          }
                        />
                        <label className="duration-input">
                          <input
                            type="number"
                            aria-label={`Scene ${i + 1} duration`}
                            min={1}
                            max={40}
                            value={scene.duration}
                            onChange={(e) =>
                              setScene(scene.id, {
                                duration: Math.max(
                                  1,
                                  Math.min(40, Number(e.target.value)),
                                ),
                              })
                            }
                          />
                          sec
                        </label>
                        <div className="scene-actions">
                          <button
                            title="Swap clip"
                            aria-label={`Swap clip for scene ${i + 1}`}
                            onClick={() => setPicker(picker === i ? null : i)}
                          >
                            <Repeat size={13} />
                          </button>
                          <button
                            aria-label={`Move scene ${i + 1} earlier`}
                            disabled={i === 0}
                            onClick={() => {
                              const scenes = [...p.scenes];
                              [scenes[i - 1], scenes[i]] = [
                                scenes[i],
                                scenes[i - 1],
                              ];
                              set({ scenes });
                              setActive(i - 1);
                            }}
                          >
                            ↑
                          </button>
                          <button
                            aria-label={`Move scene ${i + 1} later`}
                            disabled={i === p.scenes.length - 1}
                            onClick={() => {
                              const scenes = [...p.scenes];
                              [scenes[i + 1], scenes[i]] = [
                                scenes[i],
                                scenes[i + 1],
                              ];
                              set({ scenes });
                              setActive(i + 1);
                            }}
                          >
                            ↓
                          </button>
                          <button
                            aria-label={`Delete scene ${i + 1}`}
                            disabled={p.scenes.length === 1}
                            onClick={() => {
                              set({
                                scenes: p.scenes.filter(
                                  (s) => s.id !== scene.id,
                                ),
                                history: snapshot(
                                  `Before removing scene ${i + 1}`,
                                ),
                              });
                              setActive(0);
                              notify(
                                "Scene removed. Undo it from the edit history.",
                              );
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPicker(picker === -1 ? null : -1)}
                    >
                      <Plus size={14} /> Add a scene
                    </Button>
                    {picker !== null && (
                      <div className="ed-picker">
                        <b>
                          {picker === -1
                            ? "Choose a file for the new scene"
                            : `Choose a new clip for scene ${picker + 1}`}
                        </b>
                        <div className="media-tiles small">
                          {state.media
                            .filter((m) => m.url)
                            .map((m) => (
                              <button
                                key={m.id}
                                className="media-tile"
                                title={m.name}
                                aria-label={`Use ${m.name}`}
                                onClick={() => pick(m)}
                              >
                                <Thumbnail media={m} />
                              </button>
                            ))}
                        </div>
                        <Uploader notify={notify} onAdd={addMedia} />
                      </div>
                    )}
                    {p.scenes[active] && (
                      <label>
                        Scene {active + 1} starts at (seconds into the clip)
                        <input
                          aria-label="Source start"
                          type="number"
                          min={0}
                          max={3600}
                          value={p.scenes[active].trim}
                          onChange={(e) =>
                            setScene(p.scenes[active].id, {
                              trim: Math.max(
                                0,
                                Math.min(3600, Number(e.target.value)),
                              ),
                            })
                          }
                        />
                      </label>
                    )}
                  </>
                )}
                {tab === "Text" && (
                  <>
                    <label className="toggle-line">
                      <input
                        type="checkbox"
                        checked={p.subtitles}
                        onChange={(e) => set({ subtitles: e.target.checked })}
                      />{" "}
                      Show subtitles on every scene
                    </label>
                    {p.scenes.map((scene, i) => (
                      <label key={scene.id}>
                        Scene {i + 1} subtitle
                        <input
                          aria-label={`Scene ${i + 1} subtitle`}
                          maxLength={150}
                          value={scene.text}
                          onFocus={() => setActive(i)}
                          onChange={(e) =>
                            setScene(scene.id, { text: e.target.value })
                          }
                        />
                      </label>
                    ))}
                    <Chips
                      label="Style"
                      value={p.textStyle}
                      items={options.textStyle}
                      onChange={(textStyle) => set({ textStyle })}
                    />
                    <Chips
                      label="Word-by-word highlight"
                      value={p.captionFx}
                      items={options.captionFx}
                      onChange={(captionFx) => set({ captionFx })}
                    />
                    <Chips
                      label="Position"
                      value={p.textPosition}
                      items={options.textPosition}
                      onChange={(textPosition) => set({ textPosition })}
                    />
                    <Chips
                      label="Animation"
                      value={p.textAnim}
                      items={options.textAnim}
                      onChange={(textAnim) => set({ textAnim })}
                    />
                    <p className="muted">
                      Subtitles are written text, not transcribed speech.
                    </p>
                  </>
                )}
                {tab === "Transitions" && (
                  <>
                    <Chips
                      label="Transition between all scenes"
                      value={p.transition}
                      items={options.transition}
                      onChange={(transition) =>
                        set({
                          transition,
                          scenes: p.scenes.map((s) => ({ ...s, transition })),
                        })
                      }
                    />
                    <p className="muted">Or fine-tune each scene:</p>
                    {p.scenes.map((scene, i) => (
                      <div key={scene.id} className="ed-row">
                        <b>Scene {i + 1}</b>
                        <label>
                          Enters with
                          <select
                            aria-label={`Scene ${i + 1} transition`}
                            value={scene.transition || p.transition}
                            onFocus={() => setActive(i)}
                            onChange={(e) =>
                              setScene(scene.id, { transition: e.target.value })
                            }
                          >
                            {options.transition.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Camera effect
                          <select
                            aria-label={`Scene ${i + 1} camera effect`}
                            value={scene.motion || "None"}
                            onFocus={() => setActive(i)}
                            onChange={(e) =>
                              setScene(scene.id, { motion: e.target.value })
                            }
                          >
                            {options.motion.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}
                  </>
                )}
                {tab === "Music" && (
                  <>
                    <Chips
                      label="Backing track"
                      value={p.music}
                      items={options.music}
                      onChange={(music) => set({ music })}
                    />
                    <label>
                      Music volume
                      <input
                        aria-label="Music volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={p.musicVolume}
                        onChange={(e) =>
                          set({ musicVolume: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Original clip sound
                      <input
                        aria-label="Source audio volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={p.volume}
                        onChange={(e) =>
                          set({ volume: Number(e.target.value) })
                        }
                      />
                    </label>
                    <p className="muted">
                      Tracks are built-in and royalty-free, and are included in
                      your export. Press play on the preview to listen.
                    </p>
                  </>
                )}
                {tab === "Elements" && (
                  <>
                    {(
                      [
                        ["title", "Opening title", "coverTitle"],
                        ["cta", "Call-to-action on the last scene", "cta"],
                        ["watermark", "Watermark in the corner", "mark"],
                        ["progress", "Progress bar along the top", ""],
                      ] as const
                    ).map(([key, label, field]) => (
                      <div key={key} className="ed-element">
                        <label className="toggle-line">
                          <input
                            type="checkbox"
                            checked={p.elements[key]}
                            onChange={(e) => {
                              set({
                                elements: {
                                  ...p.elements,
                                  [key]: e.target.checked,
                                },
                              });
                              if (key === "title") setActive(0);
                              if (key === "cta") setActive(p.scenes.length - 1);
                            }}
                          />{" "}
                          {label}
                        </label>
                        {field && p.elements[key] && (
                          <input
                            aria-label={`${label} text`}
                            maxLength={130}
                            value={p[field]}
                            onChange={(e) => set({ [field]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}
                {tab === "Colour" && (
                  <>
                    <Chips
                      label="Colour grade"
                      value={p.grade}
                      items={options.grade}
                      onChange={(grade) => set({ grade })}
                    />
                    <label>
                      Brightness
                      <input
                        aria-label="Brightness"
                        type="range"
                        min={50}
                        max={150}
                        value={p.brightness}
                        onChange={(e) =>
                          set({ brightness: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Accent colour (title line, call-to-action, progress bar)
                      <div className="color-input">
                        <input
                          type="color"
                          aria-label="Accent colour"
                          value={p.accent}
                          onChange={(e) => set({ accent: e.target.value })}
                        />
                        <span>{p.accent}</span>
                      </div>
                    </label>
                  </>
                )}
                {tab === "Ask for a change" && (
                  <form onSubmit={revise}>
                    <textarea
                      aria-label="Revision request"
                      maxLength={500}
                      value={revision}
                      onChange={(e) => setRevision(e.target.value)}
                      placeholder="Describe a change, e.g. Shorten this to 12 seconds"
                    />
                    <div className="row wrap">
                      {[
                        "Make the opening more engaging",
                        "Use a faster editing style",
                        "Remove the second clip",
                      ].map((s) => (
                        <button
                          type="button"
                          className="chip"
                          onClick={() => setRevision(s)}
                          key={s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="row between">
                      <small>Demo: simple rules, no AI model connected.</small>
                      <Button
                        disabled={busy || !revision.trim()}
                        type="submit"
                        size="sm"
                      >
                        {busy ? (
                          <LoaderCircle className="spin" size={15} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}{" "}
                        Apply revision
                      </Button>
                    </div>
                  </form>
                )}
              </section>
              {p.history.length > 0 && (
                <details className="history">
                  <summary>
                    Edit history · {p.history.length} saved versions
                  </summary>
                  {p.history.map((h, i) => (
                    <div className="row between" key={i}>
                      <span>
                        {i + 1}. {h.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          set({
                            scenes: structuredClone(h.scenes),
                            caption: h.caption,
                            style: h.style,
                            subtitles: h.subtitles,
                          });
                          setActive(0);
                          notify("Saved version restored.");
                        }}
                      >
                        <RotateCcw size={13} /> Restore
                      </Button>
                    </div>
                  ))}
                </details>
              )}
            </div>
          </div>
          <div className="wizard-footer">
            <Button variant="ghost" onClick={finish}>
              <ArrowLeft size={15} /> Dashboard
            </Button>
            <span>Every change is saved automatically</span>
            <Button onClick={() => set({ step: 1, status: "Needs Review" })}>
              Caption & export <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <PostPackage
          project={p}
          state={state}
          update={update}
          notify={notify}
          finish={finish}
        />
      )}
    </div>
  );
}
