import { allow, geminiJson, geminiReady, type Part } from "@/lib/gemini";
import { looks } from "@/lib/model";
// Picks the best moments from uploaded clips and plans several versions of one
// short-form video, or revises one after a change request.
export const maxDuration = 120;
type Clip = {
  id: string;
  name: string;
  duration: number;
  note: string;
  frames: string[];
  audio?: string;
};
type Scene = { clip: string; start: number; seconds: number; subtitle: string };
type Variant = {
  name: string;
  style: string;
  hook: string;
  reason: string;
  coverTitle: string;
  caption: string;
  hashtags: string;
  cta: string;
  bestTime: string;
  scenes: Scene[];
};
const str = { type: "STRING" };
const sceneSchema = {
  type: "OBJECT",
  properties: {
    clip: str,
    start: { type: "NUMBER" },
    seconds: { type: "NUMBER" },
    subtitle: str,
  },
  required: ["clip", "start", "seconds", "subtitle"],
};
const variantSchema = {
  type: "OBJECT",
  properties: {
    name: str,
    style: { type: "STRING", enum: Object.keys(looks) },
    hook: str,
    reason: str,
    coverTitle: str,
    caption: str,
    hashtags: str,
    cta: str,
    bestTime: str,
    scenes: { type: "ARRAY", items: sceneSchema },
  },
  required: [
    "name",
    "style",
    "hook",
    "reason",
    "coverTitle",
    "caption",
    "hashtags",
    "cta",
    "bestTime",
    "scenes",
  ],
};
// The model's plan is checked before the browser is allowed to use it.
function tidy(v: Variant, clips: Clip[]): Variant | undefined {
  const scenes = v.scenes
    .filter((s) => clips.some((c) => c.id === s.clip))
    .slice(0, 8)
    .map((s) => {
      const clip = clips.find((c) => c.id === s.clip)!;
      const seconds = Math.max(2, Math.min(15, Math.round(s.seconds)));
      return {
        clip: s.clip,
        seconds,
        start: Math.max(
          0,
          Math.min(Math.round(s.start), Math.max(0, clip.duration - seconds)),
        ),
        subtitle: s.subtitle.slice(0, 90),
      };
    });
  if (!scenes.length) return;
  // Short-form only: stretch or trim to land between 15 and 60 seconds.
  let total = scenes.reduce((n, s) => n + s.seconds, 0);
  for (let i = 0; total < 15; i = (i + 1) % scenes.length) {
    scenes[i].seconds++;
    total++;
  }
  for (let i = scenes.length - 1; total > 60 && i >= 0; i--) {
    const cut = Math.min(scenes[i].seconds - 2, total - 60);
    scenes[i].seconds -= cut;
    total -= cut;
  }
  if (scenes[0]) scenes[0].subtitle = v.hook.slice(0, 90) || scenes[0].subtitle;
  return {
    ...v,
    style: looks[v.style] ? v.style : "Slow & intentional",
    coverTitle: v.coverTitle.slice(0, 80),
    caption: v.caption.slice(0, 2200),
    scenes,
  };
}
export async function POST(req: Request) {
  if (!allow(req))
    return Response.json(
      { error: "Too many requests. Wait a minute and try again." },
      { status: 429 },
    );
  let body: {
    action?: string;
    clips?: Clip[];
    facts?: string[];
    platform?: string;
    count?: number;
    brief?: string;
    request?: string;
    current?: unknown;
  };
  try {
    const text = await req.text();
    if (text.length > 4_300_000) throw Error("too large");
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!geminiReady()) return Response.json({ mode: "template" });
  const facts = (body.facts || []).slice(0, 60).join("\n");
  try {
    if (body.action === "revise") {
      if (typeof body.request !== "string" || !body.request.trim())
        return Response.json({ error: "Describe the change" }, { status: 400 });
      const revised = await geminiJson<{
        subtitles: string[];
        seconds: number[];
        caption: string;
        hashtags: string;
        cta: string;
        coverTitle: string;
        note: string;
      }>(
        [
          {
            text: `You edit short-form marketing videos for a small business.\nBrand memory:\n${facts}\n\nCurrent video (JSON):\n${JSON.stringify(body.current).slice(0, 6000)}\n\nThe client asked for this change: "${body.request.slice(0, 400)}"\n\nReturn the full revised values. Keep the same number of scenes, one subtitle and one duration in seconds (2-15) per scene, in order. Keep the total between 15 and 60 seconds. "note" is one sentence saying what you changed.`,
          },
        ],
        {
          type: "OBJECT",
          properties: {
            subtitles: { type: "ARRAY", items: str },
            seconds: { type: "ARRAY", items: { type: "NUMBER" } },
            caption: str,
            hashtags: str,
            cta: str,
            coverTitle: str,
            note: str,
          },
          required: [
            "subtitles",
            "seconds",
            "caption",
            "hashtags",
            "cta",
            "coverTitle",
            "note",
          ],
        },
      );
      return Response.json({ mode: "gemini", revised });
    }
    const clips = (body.clips || []).slice(0, 8);
    if (!clips.length)
      return Response.json({ error: "Add at least one clip" }, { status: 400 });
    const count = Math.max(1, Math.min(3, body.count || 3));
    const parts: Part[] = [
      {
        text: `You are a short-form video editor for a small business. Plan ${count} clearly different version${count > 1 ? "s" : ""} of one vertical video (15-60 seconds total) for ${body.platform || "Instagram Reels"} from the clips below.\n\nBrand memory (follow it; never break a "Don't"):\n${facts}\n${body.brief ? `\nBrief from the client: ${body.brief.slice(0, 300)}\n` : ""}\nFor each clip you get its id, length, an optional note, a few frames in time order, and sometimes its audio. First transcribe any speech. Then for each version pick the strongest moments and order them as hook, body, call to action. Each scene uses one clip id, a start time in seconds inside that clip, a length of 2-15 seconds, and an on-screen subtitle of at most 9 words (use the speaker's own words where there is speech). The hook is also at most 9 words. Versions must differ in hook, order and editing style. Write the hook, caption, 4-6 hashtags, a call to action, a cover title, and a best posting time with a brief reason. "reason" is one sentence on why this version suits the brand. Use plain, professional language.`,
      },
    ];
    for (const clip of clips) {
      parts.push({
        text: `Clip id ${clip.id} · "${clip.name.slice(0, 60)}" · ${clip.duration || "unknown"} seconds${clip.note ? ` · note: ${clip.note.slice(0, 200)}` : ""}`,
      });
      for (const frame of (clip.frames || []).slice(0, 3))
        parts.push({ inlineData: { mimeType: "image/jpeg", data: frame } });
      if (clip.audio)
        parts.push({ inlineData: { mimeType: "audio/wav", data: clip.audio } });
    }
    const plan = await geminiJson<{
      transcripts: { clip: string; text: string }[];
      variants: Variant[];
    }>(parts, {
      type: "OBJECT",
      properties: {
        transcripts: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { clip: str, text: str },
            required: ["clip", "text"],
          },
        },
        variants: { type: "ARRAY", items: variantSchema },
      },
      required: ["transcripts", "variants"],
    });
    const variants = plan.variants
      .map((v) => tidy(v, clips))
      .filter(Boolean)
      .slice(0, count);
    if (!variants.length) throw Error("No usable plan");
    return Response.json({
      mode: "gemini",
      variants,
      transcripts: plan.transcripts,
    });
  } catch (e) {
    // The browser falls back to template versions and shows why.
    return Response.json({
      mode: "template",
      problem: e instanceof Error ? e.message.slice(0, 200) : "AI unavailable",
    });
  }
}
