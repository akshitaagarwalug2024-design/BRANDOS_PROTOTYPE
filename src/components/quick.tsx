"use client";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  RefreshCw,
  SlidersHorizontal,
  Upload,
  Video,
} from "lucide-react";
import { Button } from "./ui/button";
import { Preview } from "./media";
import { putFile } from "@/lib/storage";
import { analyze } from "@/lib/library";
import { sampleClips } from "@/lib/sample";
import { fromSpec, templateVersions, type Spec } from "@/lib/variants";
import {
  memoryFacts,
  plans,
  suggestIdeas,
  type Media,
  type Project,
  type State,
} from "@/lib/model";
type Version = Project & { reason: string };
// What to film for each idea format.
const shots: Record<string, string> = {
  "Behind the scenes":
    "Film: the workspace, hands at work, the finished result.",
  List: "Film: one short clip for each of the three points.",
  "Day in the life": "Film: opening up, the busiest moment, closing time.",
  "Myth buster": "Film: you stating the myth, then showing the truth.",
  "Before & after": "Film: the starting point, the work, the result.",
  Tips: "Film: the mistake, then the right way to do it.",
};
const prompts = [
  "Introduce one person on the team.",
  "Show a product or service from start to finish.",
  "Share a customer story or review.",
  "Explain one thing you wish every customer knew.",
  "Show how you prepare for a busy day.",
  "Compare two options a customer often asks about.",
  "Show a tool or material you could not work without.",
  "Share what you learned from a recent mistake.",
  "Give a quick tip from your area of expertise.",
  "Show the first thing you do each morning at work.",
  "Announce something new or coming soon.",
  "Thank a supplier, partner or regular customer.",
  "Show how an order is checked before it leaves.",
  "Show what is coming up in the business next week.",
  "Show what the team worked on today.",
  "Answer a question a customer asked this week.",
  "Show something you are launching, making or delivering.",
  "Correct one thing customers often get wrong.",
  "Show what happens behind the scenes.",
  "Share a result or milestone.",
];
export default function Quick({
  state,
  addMedia,
  onApprove,
  onFineTune,
  notify,
}: {
  state: State;
  addMedia: (m: Media[]) => void;
  onApprove: (p: Project, rejected: Project[], requests: string[]) => void;
  onFineTune: (p: Project) => void;
  notify: (s: string) => void;
}) {
  const [stage, setStage] = useState<"start" | "working" | "pick" | "review">(
      "start",
    ),
    [progress, setProgress] = useState(""),
    [versions, setVersions] = useState<Version[]>([]),
    [clips, setClips] = useState<Media[]>([]),
    [chosen, setChosen] = useState(0),
    [active, setActive] = useState(0),
    [mode, setMode] = useState(""),
    [request, setRequest] = useState(""),
    [requests, setRequests] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [brief, setBrief] = useState(""),
    [more, setMore] = useState(0);
  const input = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const plan = plans[state.plan];
  const media = [
    ...state.media,
    ...clips.filter((c) => !state.media.some((m) => m.id === c.id)),
  ];
  const own = state.media.filter(
    (m) => !m.sample && !m.stock && m.url && m.type !== "audio",
  );
  // Plans the versions from a set of clips, with AI when it is connected.
  const make = async (files: Media[]) => {
    setClips(files);
    setStage("working");
    try {
      setProgress("Looking through your clips…");
      const sampled = await sampleClips(files);
      setProgress(
        `Choosing the best moments and building ${plan.variants} version${plan.variants > 1 ? "s" : ""}…`,
      );
      const response = await fetch("/api/ai/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips: sampled,
          facts: plan.memory
            ? memoryFacts(state)
            : memoryFacts(state).slice(0, 5),
          platform: state.projects[0]?.platform || "Instagram Reels",
          count: plan.variants,
          brief,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      const built: Version[] =
        data.mode === "gemini"
          ? (data.variants as Spec[]).map((v) => fromSpec(state, v))
          : templateVersions(state, files, plan.variants, brief);
      setMode(data.mode);
      if (data.problem)
        notify(`AI was unavailable, so templates were used. (${data.problem})`);
      setVersions(built);
      setChosen(0);
      setRequests([]);
      setStage(built.length > 1 ? "pick" : "review");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not build versions.");
      setStage("start");
    }
  };
  const upload = async (list: FileList | null) => {
    const files = [...(list || [])].filter(
      (f) => /^(video|image)\//.test(f.type) && f.type !== "image/svg+xml",
    );
    if (!files.length) return;
    setStage("working");
    setProgress("Saving your clips on this device…");
    const added: Media[] = [];
    try {
      for (const f of files.slice(0, 8)) {
        if (f.size > 100 * 1024 * 1024) {
          notify(`${f.name} is over the 100 MB limit and was skipped.`);
          continue;
        }
        const id = crypto.randomUUID(),
          type = f.type.startsWith("video") ? "video" : "image";
        await putFile(id, f);
        added.push({
          id,
          name: f.name,
          type,
          url: URL.createObjectURL(f),
          collection: `Uploads · ${new Date().toLocaleDateString([], { day: "numeric", month: "short" })}`,
          tags: "",
          size: f.size,
          ...(await analyze(f, type, f.lastModified)),
        });
      }
    } catch {
      notify("Storage is full or unavailable.");
    }
    if (!added.length) return setStage("start");
    addMedia(added);
    await make(added);
  };
  const current = versions[chosen];
  const patch = (v: Partial<Version>) =>
    setVersions(versions.map((x, i) => (i === chosen ? { ...x, ...v } : x)));
  const change = async () => {
    if (!request.trim() || !current) return;
    setBusy(true);
    try {
      const ai = await fetch("/api/ai/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revise",
          request,
          facts: memoryFacts(state),
          current: {
            scenes: current.scenes.map((s) => ({
              subtitle: s.text,
              seconds: s.duration,
            })),
            caption: current.caption,
            hashtags: current.hashtags,
            cta: current.cta,
            coverTitle: current.coverTitle,
          },
        }),
      }).then((r) => r.json());
      if (ai.mode === "gemini") {
        const r = ai.revised;
        patch({
          scenes: current.scenes.map((s, i) => ({
            ...s,
            text: r.subtitles[i] ?? s.text,
            duration: Math.max(
              2,
              Math.min(15, Math.round(r.seconds[i] || s.duration)),
            ),
          })),
          caption: r.caption,
          hashtags: r.hashtags,
          cta: r.cta,
          coverTitle: r.coverTitle,
          title: r.coverTitle,
        });
        notify(r.note);
      } else {
        // No AI connected: the rule-based reviser handles simple requests.
        const rules = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "revise",
            scenes: current.scenes,
            request,
          }),
        });
        const data = await rules.json();
        if (!rules.ok) throw Error(data.error);
        patch({ scenes: data.scenes });
        notify(data.explanation);
      }
      setRequests([...requests, request]);
      setRequest("");
      setActive(0);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not apply that change.");
    } finally {
      setBusy(false);
    }
  };
  const strip = ({ reason: _reason, ...p }: Version): Project => p;
  if (stage === "working")
    return (
      <section className="quick quick-working" role="status">
        <LoaderCircle className="spin" size={26} />
        <h2>{progress}</h2>
        <p>
          This usually takes under a minute. Your files stay on this device.
        </p>
      </section>
    );
  if (stage === "pick")
    return (
      <section className="quick">
        <div className="row between wrap">
          <div>
            <h2>Pick a version</h2>
            <p>
              {versions.length} versions from {clips.length} clip
              {clips.length === 1 ? "" : "s"}.{" "}
              {mode === "gemini"
                ? "Moments chosen by AI from your footage."
                : "Built from templates; AI is not connected."}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setStage("start")}>
            <ArrowLeft size={15} /> Start again
          </Button>
        </div>
        <div className="quick-versions">
          {versions.map((v, i) => (
            <button
              key={v.id}
              className="quick-version"
              aria-label={`Choose ${v.variant}: ${v.coverTitle}`}
              onClick={() => {
                setChosen(i);
                setActive(0);
                setStage("review");
              }}
            >
              <div className="quick-thumb">
                <Preview project={v} media={media} brand={state.brand} />
              </div>
              <span className="eyebrow">
                {v.variant} · {v.style}
              </span>
              <b>{v.coverTitle}</b>
              <small>“{v.scenes[0]?.text}”</small>
              <small className="muted">{v.reason}</small>
            </button>
          ))}
        </div>
      </section>
    );
  if (stage === "review" && current)
    return (
      <section className="quick">
        <div className="row between wrap">
          <h2>
            {current.variant}: {current.coverTitle}
          </h2>
          {versions.length > 1 && (
            <Button variant="ghost" onClick={() => setStage("pick")}>
              <ArrowLeft size={15} /> Other versions
            </Button>
          )}
        </div>
        <div className="quick-review">
          <Preview
            project={current}
            media={media}
            brand={state.brand}
            active={active}
            onActive={setActive}
          />
          <div className="quick-details">
            <dl>
              <dt>Caption</dt>
              <dd>{current.caption}</dd>
              <dt>Hashtags</dt>
              <dd>{current.hashtags}</dd>
              <dt>Best time to post</dt>
              <dd>{current.bestTime}</dd>
              <dt>Cover</dt>
              <dd>{current.coverTitle}</dd>
            </dl>
            <Button
              className="quick-approve"
              onClick={() => {
                onApprove(
                  strip(current),
                  versions.filter((_, i) => i !== chosen).map(strip),
                  requests,
                );
                setStage("start");
                setVersions([]);
              }}
            >
              <Check size={17} /> Approve
              {plan.review ? " and send to human review" : ""}
            </Button>
            <form
              className="quick-change"
              onSubmit={(e) => {
                e.preventDefault();
                void change();
              }}
            >
              <input
                aria-label="Request a change"
                placeholder="Request a change, e.g. make it shorter and more formal"
                maxLength={300}
                value={request}
                onChange={(e) => setRequest(e.target.value)}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={busy || !request.trim()}
              >
                {busy ? <LoaderCircle className="spin" size={14} /> : null}{" "}
                Apply
              </Button>
            </form>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFineTune(strip(current))}
            >
              <SlidersHorizontal size={14} /> Fine-tune script, hook, music and
              style
            </Button>
          </div>
        </div>
      </section>
    );
  return (
    <section className="quick quick-start">
      <span className="eyebrow">TODAY’S PROMPTS</span>
      <h2>What could you film today?</h2>
      <div className="quick-prompts" role="group" aria-label="Today’s prompts">
        {Array.from(
          { length: 4 },
          (_, i) =>
            prompts[(new Date().getDay() * 4 + more * 4 + i) % prompts.length],
        ).map((text) => (
          <button
            key={text}
            className={brief === text ? "active" : ""}
            aria-pressed={brief === text}
            onClick={() => setBrief(brief === text ? "" : text)}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="row between wrap">
        <b className="quick-label">Ideas to start with</b>
        <Button variant="ghost" size="sm" onClick={() => setMore(more + 1)}>
          <RefreshCw size={13} /> More prompts and ideas
        </Button>
      </div>
      <div className="quick-ideas">
        {suggestIdeas(state, "", more)
          .slice(0, 4)
          .map((idea) => (
            <button
              key={idea.title}
              className={brief === idea.title ? "active" : ""}
              aria-pressed={brief === idea.title}
              onClick={() => setBrief(brief === idea.title ? "" : idea.title)}
            >
              <span className="eyebrow">{idea.format}</span>
              <b>{idea.title}</b>
              <small>{shots[idea.format] || shots.List}</small>
            </button>
          ))}
      </div>
      {brief && (
        <p className="quick-brief">
          Your video will be built around: <b>{brief}</b>
        </p>
      )}
      <button className="quick-record" onClick={() => input.current?.click()}>
        <Upload size={26} />
        <b>Record or upload clips</b>
        <small>
          UnStuck picks the best moments and makes {plan.variants} version
          {plan.variants > 1 ? "s" : ""}. You choose one and approve.
        </small>
      </button>
      <div className="row wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => camera.current?.click()}
        >
          <Video size={14} /> Record with the camera
        </Button>
        {own.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void make(own.slice(-4))}
          >
            Use my {Math.min(4, own.length)} most recent clip
            {own.length === 1 ? "" : "s"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void make(state.media.filter((m) => m.sample))}
        >
          Try with sample footage
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="video/*,image/*"
        multiple
        hidden
        aria-label="Upload clips"
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={camera}
        type="file"
        accept="video/*"
        capture="environment"
        hidden
        aria-label="Record a clip"
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}
