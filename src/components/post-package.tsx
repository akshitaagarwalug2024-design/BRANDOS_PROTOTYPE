"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Download, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Preview } from "./media";
import type { Project, State, Status } from "@/lib/model";
import { download } from "@/lib/storage";
import { renderVideo, coverSvg, contrastText } from "@/lib/render";
const statuses: Status[] = [
  "Draft",
  "In Progress",
  "Needs Review",
  "In Human Review",
  "Ready to Publish",
  "Published",
];
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}
function Select({
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
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {items.map((i) => (
          <option key={i}>{i}</option>
        ))}
      </select>
    </Field>
  );
}
export default function PostPackage({
  project: p,
  state,
  update,
  notify,
  finish,
}: {
  project: Project;
  state: State;
  update: (p: Project) => void;
  notify: (s: string) => void;
  finish: () => void;
}) {
  const [active, setActive] = useState(0),
    [job, setJob] = useState<{
      status: string;
      progress: number;
      error?: string;
    }>({ status: "idle", progress: 0 }),
    [video, setVideo] = useState<Blob | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    setVideo(null);
  }, [
    p.scenes,
    p.ratio,
    p.brightness,
    p.volume,
    p.subtitles,
    p.transition,
    p.music,
    p.musicId,
    p.musicVolume,
    p.grade,
    p.accent,
    p.textStyle,
    p.textPosition,
    p.textAnim,
    p.elements,
    p.mark,
    p.cta,
    p.coverTitle,
    state.brand.color,
    state.brand.font,
    state.brand.logo,
    p.captionFx,
    p.items,
  ]);
  const set = (v: Partial<Project>) => update({ ...p, ...v });
  // Creator and source of every stock file and element used in this post.
  const credits = [
    ...p.items.filter((i) => i.source !== "Built-in"),
    ...state.media
      .filter((m) => m.credit && p.scenes.some((s) => s.mediaId === m.id))
      .map((m) => ({ name: m.name, ...m.credit! })),
  ];
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard.");
    } catch {
      notify("Clipboard access is blocked. Select and copy the text manually.");
    }
  };
  const exportVideo = async () => {
    setJob({ status: "processing", progress: 0 });
    abort.current = new AbortController();
    try {
      const blob = await renderVideo(
        p,
        state.media,
        state.brand.color,
        (n) => setJob({ status: "processing", progress: n }),
        abort.current.signal,
        state.brand,
      );
      setVideo(blob);
      setJob({ status: "completed", progress: 100 });
      download(blob, "unstuck-draft.webm");
      notify("Actual WebM draft exported. Preview it before posting.");
    } catch (e) {
      setJob({
        status: "failed",
        progress: 0,
        error:
          e instanceof Error
            ? e.message
            : "Rendering failed. Please try again.",
      });
    }
  };
  return (
    <div className="package-content">
      <div className="editor-heading">
        <div>
          <h2>Caption, cover and export</h2>
          <p>
            Everything is pre-written. Tweak what you like, then download the
            video.
          </p>
        </div>
        <span className="badge">NO SOCIAL INTEGRATIONS CONNECTED</span>
      </div>
      <div className="package-grid">
        <div>
          <Preview
            project={p}
            media={state.media}
            brand={state.brand}
            active={active}
            onActive={setActive}
          />
          <div className="export-card">
            <h3>
              <Download size={17} /> Your video
            </h3>
            <p>
              Renders your scenes with transitions, effects, subtitles, music
              and elements as a real WebM video. Keep this tab visible;
              rendering runs in real time (up to 120 seconds).
            </p>
            {job.status === "processing" ? (
              <>
                <progress
                  max={100}
                  value={job.progress}
                  aria-label="Video rendering progress"
                />
                <p role="status">Rendering · {job.progress}%</p>
                <Button
                  variant="outline"
                  onClick={() => abort.current?.abort()}
                >
                  Cancel export
                </Button>
              </>
            ) : (
              <Button
                disabled={!p.scenes.length}
                onClick={
                  video
                    ? () => download(video, "unstuck-draft.webm")
                    : exportVideo
                }
              >
                <Download size={15} />
                {video ? "Download video again" : "Render & download video"}
              </Button>
            )}
            {job.error && (
              <p role="alert" className="error-text">
                {job.error} You can still export the project package below.
              </p>
            )}
            <small>
              WebM · convert to MP4 before posting if your platform requires it.
              This is a draft render, not an AI-generated video.
            </small>
          </div>
        </div>
        <div className="package-fields">
          <Field label="Post title">
            <input
              value={p.title}
              maxLength={150}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Caption · editable demo suggestion">
            <textarea
              className="caption-textarea"
              value={p.caption}
              onChange={(e) => set({ caption: e.target.value })}
            />
          </Field>
          <div className="row wrap">
            <Button variant="outline" size="sm" onClick={() => copy(p.caption)}>
              <Copy size={13} /> Copy caption
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                set({
                  caption: `A little look at ${p.idea.toLowerCase()}.\n\n${p.cta}`,
                })
              }
            >
              Try a shorter caption <Sparkles size={13} />
            </Button>
          </div>
          <Field label="Hashtags">
            <textarea
              value={p.hashtags}
              onChange={(e) => set({ hashtags: e.target.value })}
            />
          </Field>
          <Button variant="ghost" size="sm" onClick={() => copy(p.hashtags)}>
            <Copy size={13} /> Copy hashtags
          </Button>
          <Field label="Call to action">
            <input
              value={p.cta}
              onChange={(e) => set({ cta: e.target.value })}
            />
          </Field>
          <Field label="Cover headline">
            <input
              maxLength={130}
              value={p.coverTitle}
              onChange={(e) => set({ coverTitle: e.target.value })}
            />
          </Field>
          <div
            className="cover-preview"
            style={{
              background: state.brand.color,
              color: contrastText(state.brand.color),
            }}
          >
            <span>{p.platform.toUpperCase()}</span>
            <h3>{p.coverTitle}</h3>
            <small>{p.mark}</small>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              download(
                new Blob([coverSvg(p.coverTitle, state.brand.color)], {
                  type: "image/svg+xml",
                }),
                "unstuck-cover.svg",
              )
            }
          >
            <Download size={14} /> Download cover (SVG)
          </Button>
          <p className="notice">
            Format: {p.platform} · {p.ratio}. Preview your WebM and check
            platform upload requirements before sharing. The cover exports as a
            separate SVG file.
          </p>
          {p.bestTime && (
            <p className="notice best-time">
              <b>Best time to post</b> {p.bestTime}
            </p>
          )}
          {p.status === "In Human Review" && (
            <div className="notice review">
              <b>In human review</b> Your editor, Ananya Rao, checks every video
              before it goes out. No editor is connected in this prototype, so
              complete the review yourself.
              <Button
                size="sm"
                onClick={() => {
                  set({ status: "Ready to Publish" });
                  notify("Review complete. The video is ready to publish.");
                }}
              >
                Mark review complete
              </Button>
            </div>
          )}
          {credits.length > 0 && (
            <div className="credits">
              <b>Credits for stock and elements</b>
              <ul>
                {credits.map((c) => (
                  <li key={c.name + c.creator}>
                    {c.name} — {c.creator}, {c.source}
                    {c.link && (
                      <>
                        {" "}
                        (
                        <a href={c.link} target="_blank" rel="noreferrer">
                          source
                        </a>
                        )
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="two-col">
            <Field label="Plan a day to share">
              <input
                type="date"
                value={p.date}
                onChange={(e) => set({ date: e.target.value })}
              />
            </Field>
            <Select
              label="Review status"
              value={p.status}
              items={statuses.filter((s) => s !== "Published")}
              onChange={(status) => set({ status: status as Status })}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              download(
                new Blob(
                  [
                    JSON.stringify(
                      {
                        project: p,
                        media: state.media
                          .filter((m) => p.mediaIds.includes(m.id))
                          .map((m) => ({
                            ...m,
                            url: m.sample ? m.url : "source-file-required",
                          })),
                        note: "Editable metadata package. Source media and rendered video are separate downloads.",
                      },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                ),
                "unstuck-post-package.json",
              );
              notify(
                "Post package exported. Keep your source media and video download alongside it.",
              );
            }}
          >
            <Download size={16} /> Export editable post package
          </Button>
        </div>
      </div>
      <div className="wizard-footer">
        <Button variant="ghost" onClick={() => set({ step: 0 })}>
          <ArrowLeft size={15} /> Back to edit
        </Button>
        <div className="row">
          <Button
            variant="outline"
            onClick={() => {
              set({ status: "Draft" });
              notify("Draft saved. You can return to it from your dashboard.");
              finish();
            }}
          >
            Save draft
          </Button>
          <Button
            onClick={() => {
              set({ status: "Ready to Publish" });
              notify("Marked ready. Publish manually on your chosen platform.");
              finish();
            }}
          >
            <Check size={16} /> Mark as ready to publish
          </Button>
        </div>
      </div>
    </div>
  );
}
