"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Check,
  Download,
  LoaderCircle,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Preview } from "./media";
import { download, putFile } from "@/lib/storage";
import { analyze } from "@/lib/library";
import { renderVideo } from "@/lib/render";
import type { Media, Project, State } from "@/lib/model";
import type { AgentEvent, ToolSpec } from "@/lib/agent/types";
type ToolEvent = Extract<AgentEvent, { type: "tool" }>;
type Step = { step: number; thought: string; ms: number; tools: ToolEvent[] };
type Check = { check: string; pass: boolean; detail: string };
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const brief = (value: unknown) => {
  const text = JSON.stringify(value) || "";
  return text.length > 130 ? text.slice(0, 130) + "…" : text;
};
export default function Agent({
  state,
  onResult,
  open,
  notify,
}: {
  state: State;
  onResult: (project: Project, media: Media[]) => void;
  open: (id: string) => void;
  notify: (s: string) => void;
}) {
  const [topic, setTopic] = useState(""),
    [paid, setPaid] = useState(false),
    [passcode, setPasscode] = useState(""),
    [status, setStatus] = useState<
      "idle" | "running" | "rendering" | "done" | "failed"
    >("idle"),
    [info, setInfo] = useState<Extract<AgentEvent, { type: "run" }> | null>(
      null,
    ),
    [steps, setSteps] = useState<Step[]>([]),
    [error, setError] = useState(""),
    [progress, setProgress] = useState(0),
    [result, setResult] = useState<{
      project: Project;
      media: Media[];
      stats: string;
      video?: Blob;
    } | null>(null),
    [meta, setMeta] = useState<{
      model: string;
      video: string;
      limits: { maxSteps: number; maxToolCalls: number; maxClips: number };
      paid: {
        available: boolean;
        label: string;
        maxClips: number;
        usdPerSecond: number;
      };
      tools: ToolSpec[];
    } | null>(null),
    [active, setActive] = useState(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  // Show the tool registry before the first run.
  useEffect(() => {
    void fetch("/api/agent")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);
  const busy = status === "running" || status === "rendering";
  const run = async () => {
    setStatus("running");
    setSteps([]);
    setError("");
    setResult(null);
    setProgress(0);
    abort.current = new AbortController();
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        signal: abort.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: topic.trim(),
          paid,
          passcode: paid ? passcode : undefined,
          today: localDate(),
          profile: { name: state.profile.name, niche: state.profile.niche },
          goal: state.goal,
          brand: { ...state.brand, logo: undefined },
          journal: state.journal
            .filter((e) => e.text)
            .slice(-10)
            .map((e) => e.text.slice(0, 500)),
          media: state.media
            .filter((m) => m.url)
            .slice(-40)
            .map((m) => ({
              id: m.id,
              name: m.name,
              type: m.type,
              collection: m.collection,
              tags: m.tags,
              own: !m.sample,
            })),
          scheduled: state.projects.map((p) => p.date).filter(Boolean),
        }),
      });
      if (!response.ok || !response.body)
        throw Error(
          (await response.json()).error || "The agent could not start.",
        );
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "",
        done: Extract<AgentEvent, { type: "done" }> | null = null;
      for (;;) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines.filter(Boolean)) {
          const event: AgentEvent = JSON.parse(line);
          if (event.type === "run") setInfo(event);
          if (event.type === "step")
            setSteps((s) => [...s, { ...event, tools: [] }]);
          if (event.type === "tool")
            setSteps((s) =>
              s.map((x) =>
                x.step === event.step
                  ? { ...x, tools: [...x.tools, event] }
                  : x,
              ),
            );
          if (event.type === "error") throw Error(event.message);
          if (event.type === "done") done = event;
        }
        if (chunk.done) break;
      }
      if (!done) throw Error("The agent stopped before finishing.");
      // Store generated clips next to uploads so the project survives a reload.
      const media: Media[] = [];
      for (const clip of done.clips) {
        const blob = clip.url
          ? await fetch(`/api/agent/clip?file=${clip.url}`, {
              headers: { "x-agent-passcode": passcode },
            }).then((r) => {
              if (!r.ok)
                throw Error("A generated clip could not be downloaded.");
              return r.blob();
            })
          : new Blob([clip.data], { type: clip.mime });
        const type = clip.mime.startsWith("video") ? "video" : "image";
        await putFile(clip.id, blob);
        media.push({
          id: clip.id,
          name: clip.name,
          type,
          url: URL.createObjectURL(blob),
          collection: "Agent generated",
          tags: clip.prompt.slice(0, 80),
          size: blob.size,
          ...(await analyze(blob, type)),
        });
      }
      onResult(done.project, media);
      const stats = `${done.steps} steps · ${done.toolCalls} tool calls · ${done.rejected} rejected · ${(done.ms / 1000).toFixed(1)}s`;
      setResult({ project: done.project, media, stats });
      setActive(0);
      setStatus("rendering");
      const video = await renderVideo(
        done.project,
        [...state.media, ...media],
        state.brand.color,
        setProgress,
        abort.current.signal,
      );
      setResult({ project: done.project, media, stats, video });
      setStatus("done");
      notify("The agent finished. Your video is ready to download.");
    } catch (e) {
      if (abort.current?.signal.aborted) return setStatus("idle");
      setError(e instanceof Error ? e.message : "The agent run failed.");
      setStatus("failed");
    }
  };
  const tools = info?.tools || meta?.tools || [];
  return (
    <div className="agent">
      <div className="agent-main">
        <form
          className="card agent-start"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void run();
          }}
        >
          <input
            aria-label="Brief (optional)"
            placeholder="Optional: what should the post be about? Leave empty and the agent decides."
            maxLength={200}
            value={topic}
            disabled={busy}
            onChange={(e) => setTopic(e.target.value)}
          />
          {busy ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => abort.current?.abort()}
            >
              <X size={15} /> Stop
            </Button>
          ) : (
            <Button type="submit">
              <Play size={15} /> Run the agent
            </Button>
          )}
        </form>
        {meta?.paid.available && (
          <div className="card agent-paid">
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={paid}
                disabled={busy}
                onChange={(e) => setPaid(e.target.checked)}
              />{" "}
              Generate real video clips with {meta.paid.label}
            </label>
            {paid && (
              <>
                <input
                  type="password"
                  aria-label="Passcode for paid generation"
                  placeholder="Passcode"
                  value={passcode}
                  disabled={busy}
                  onChange={(e) => setPasscode(e.target.value)}
                />
                <small>
                  Costs API credit: up to {meta.paid.maxClips} clips of 3
                  seconds, about $
                  {(meta.paid.maxClips * 3 * meta.paid.usdPerSecond).toFixed(2)}{" "}
                  per run. Scenes covered by your own footage are free. A run
                  takes one to two minutes.
                </small>
              </>
            )}
          </div>
        )}
        {status === "idle" && !steps.length && (
          <div className="empty">
            <Bot />
            <h3>Nothing has run yet</h3>
            <p>
              Press Run. The agent reads your journal, goal and library, decides
              on a post, makes the footage it is missing, edits, checks its own
              work and renders the video. Every step shows up here.
            </p>
          </div>
        )}
        <ol className="trace" aria-live="polite" aria-label="Agent run">
          {steps.map((s) => (
            <li key={s.step}>
              <span className="trace-n">{s.step}</span>
              <div>
                <p className="trace-thought">{s.thought}</p>
                {s.tools.map((t) => {
                  const checks = (t.output as { checks?: Check[] })?.checks;
                  return (
                    <details
                      key={t.id}
                      className={`trace-tool ${t.ok ? "" : "bad"}`}
                    >
                      <summary>
                        {t.ok ? <Check size={13} /> : <X size={13} />}
                        <code>{t.name}</code>
                        <span className="trace-where">{t.runsOn}</span>
                        <span className="trace-out">
                          {t.ok
                            ? brief(t.output)
                            : `Rejected by harness: ${(t.output as { error: string }).error}`}
                        </span>
                        <span className="trace-ms">{t.ms} ms</span>
                      </summary>
                      {checks && (
                        <ul className="trace-checks">
                          {checks.map((c) => (
                            <li key={c.check} className={c.pass ? "" : "bad"}>
                              {c.pass ? <Check size={12} /> : <X size={12} />}
                              {c.check} <small>{c.detail}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                      <pre>
                        {JSON.stringify(
                          { arguments: t.args, result: t.output },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  );
                })}
              </div>
            </li>
          ))}
          {status === "running" && (
            <li className="trace-wait">
              <span className="trace-n">
                <LoaderCircle className="spin" size={13} />
              </span>
              <div>
                <p className="trace-thought">Working…</p>
              </div>
            </li>
          )}
        </ol>
        {status === "rendering" && (
          <div className="card agent-render" role="status">
            <b>render_video is running in your browser · {progress}%</b>
            <progress max={100} value={progress} aria-label="Render progress" />
            <small>
              Keep this tab visible. Rendering takes as long as the video.
            </small>
          </div>
        )}
        {error && (
          <p role="alert" className="notice agent-error">
            <b>The run stopped.</b> {error}
          </p>
        )}
      </div>
      <aside className="agent-side">
        {result && (
          <section className="card agent-result">
            <span className="eyebrow">RESULT</span>
            <h3>{result.project.title}</h3>
            <Preview
              project={result.project}
              media={[...state.media, ...result.media]}
              brand={state.brand}
              active={active}
              onActive={setActive}
            />
            <small>
              {result.stats} · scheduled {result.project.date}
            </small>
            <div className="row wrap">
              <Button
                size="sm"
                disabled={!result.video}
                onClick={() =>
                  result.video && download(result.video, "unstuck-agent.webm")
                }
              >
                <Download size={14} />{" "}
                {result.video ? "Download video" : "Rendering…"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => open(result.project.id)}
              >
                Edit it <ArrowUpRight size={14} />
              </Button>
            </div>
          </section>
        )}
        <section className="card agent-harness">
          <span className="eyebrow">
            <ShieldCheck size={13} /> THE HARNESS
          </span>
          <dl>
            <dt>Model</dt>
            <dd>{info?.model || meta?.model}</dd>
            <dt>Video model</dt>
            <dd>{info?.video || meta?.video}</dd>
            <dt>Limits</dt>
            <dd>
              {meta?.limits.maxSteps} steps · {meta?.limits.maxToolCalls} tool
              calls · {meta?.limits.maxClips} generated clips per run
            </dd>
            <dt>Guardrails</dt>
            <dd>
              Every tool call is schema-checked before it runs. Rendering is
              blocked until the edit passes verification.
            </dd>
          </dl>
          <b>Tools the agent can use ({tools.length})</b>
          <ul className="agent-tools">
            {tools.map((t) => (
              <li key={t.name} title={t.description}>
                <code>{t.name}</code>
                <small>{t.description}</small>
              </li>
            ))}
          </ul>
          <p className="muted">
            The model is a scripted stand-in. Video is placeholder frames unless
            paid generation is switched on.
          </p>
        </section>
      </aside>
    </div>
  );
}
