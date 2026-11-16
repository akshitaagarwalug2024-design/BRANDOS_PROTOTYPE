import { concepts, looks, suggestIdeas, type State } from "../model";
import type {
  DraftScene,
  Json,
  ModelProvider,
  Transcript,
  VideoProvider,
} from "./types";
// Stand-ins for the real providers. They implement the same interfaces a hosted
// LLM and a hosted video model will, so the harness does not change when they are swapped.
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const call = (name: string, args: Json = {}) => ({
  id: crypto.randomUUID(),
  name,
  args,
});
const output = <T>(t: Transcript, name: string) =>
  t.findLast((e) => e.call.name === name && e.ok)?.output as T | undefined;
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
// A scripted policy, not a language model: it decides the next tool calls from
// what the transcript already contains.
export const demoModel: ModelProvider = {
  id: "demo-scripted",
  label: "Demo model (scripted policy, no LLM)",
  async next({ workspace: w, transcript: t }) {
    await wait(350);
    const done = (name: string) => t.some((e) => e.call.name === name && e.ok);
    const look = looks[w.brand.editing] || looks["Slow & intentional"];
    if (!done("read_creator_context"))
      return {
        thought:
          "Before deciding anything I need to know who this creator is, how their posts are doing and what footage they have.",
        calls: [
          call("read_creator_context"),
          call("review_performance"),
          call("inspect_library"),
        ],
      };
    if (!done("choose_idea")) {
      const perf = output<{ trending: [string, number][] }>(
        t,
        "review_performance",
      );
      const idea = suggestIdeas(
        {
          journal: w.journal.map((text) => ({ text })),
          media: w.media.map((m) => ({ ...m, sample: !m.own })),
          profile: w.profile,
        } as unknown as State,
        w.brief,
      )[0];
      const fromTrend = !w.brief && !w.journal.length && perf?.trending[0];
      const title = fromTrend ? perf.trending[0][0] : idea.title;
      return {
        thought: w.brief
          ? `The creator gave a brief (“${w.brief}”), so I’ll build on that rather than pick my own topic.`
          : fromTrend
            ? `No brief or journal yet. “${title}” is rising fastest in ${w.profile.niche}, so it is the safest bet.`
            : `Their journal points at “${title}”. Using their own words beats a generic trend.`,
        calls: [
          call("choose_idea", {
            title,
            hook: idea.hook,
            reason: fromTrend
              ? `Up ${perf.trending[0][1]}% this week in the creator's niche.`
              : `${idea.why} Source: ${idea.source}.`,
          }),
        ],
      };
    }
    const chosen = t.findLast((e) => e.call.name === "choose_idea" && e.ok)!
      .call.args as { title: string; hook: string };
    const { title, hook } = chosen;
    const beats = concepts(title)[0].outline;
    const own = w.media.filter((m) => m.own && m.type !== "audio");
    const failed = output<{ passed: boolean }>(t, "verify_edit");
    const needsRepair =
      t.at(-1)?.call.name === "verify_edit" && failed && !failed.passed;
    const boards = t.filter(
      (e) => e.call.name === "write_storyboard" && e.ok,
    ).length;
    if (needsRepair && boards >= 2)
      return {
        thought:
          "Verification still fails after one repair, so I’m stopping instead of rendering something that breaks the checks.",
        calls: [],
      };
    if (!boards || needsRepair) {
      const seconds = needsRepair ? 3 : look.pace;
      const scenes: DraftScene[] = beats.map((beat, i) => {
        const file = own[i];
        return {
          beat,
          subtitle: i === 0 ? hook : beat,
          source: file ? "library" : "generate",
          mediaId: file?.id || "",
          prompt: file
            ? ""
            : `${beat} — ${title}. ${w.brand.tone} mood, ${w.profile.niche.toLowerCase()} setting, vertical close-up.`,
          seconds,
          transition: i === 0 ? "Fade" : look.transition,
          motion: look.motions[i % look.motions.length],
        };
      });
      return {
        thought: needsRepair
          ? "Verification failed, so I’m tightening every scene and resubmitting the storyboard."
          : own.length >= beats.length
            ? `The library covers all ${beats.length} beats, so I’ll cut entirely from the creator’s own footage.`
            : own.length
              ? `The library covers ${own.length} of ${beats.length} beats. I’ll use those and generate the rest.`
              : `There is no footage of the creator’s own, so I’ll generate all ${beats.length} scenes.`,
        calls: [call("write_storyboard", { scenes })],
      };
    }
    const board = t.findLast((e) => e.call.name === "write_storyboard" && e.ok)!
      .call.args.scenes as DraftScene[];
    const since = t.slice(
      t.findLastIndex((e) => e.call.name === "write_storyboard" && e.ok) + 1,
    );
    const missing = board
      .map((s, i) => ({ s, n: i + 1 }))
      .filter(
        ({ s, n }) =>
          s.source === "generate" &&
          !since.some(
            (e) =>
              e.call.name === "generate_clip" &&
              e.ok &&
              e.call.args.scene === n,
          ),
      );
    if (missing.length)
      return {
        thought: `Generating ${missing.length} clip${missing.length > 1 ? "s" : ""} in parallel from the storyboard prompts.`,
        calls: missing.map(({ n }) => call("generate_clip", { scene: n })),
      };
    if (!done("set_style"))
      return {
        thought: `Their brand kit says “${w.brand.editing}” and “${w.brand.tone}”, so I’ll match the look and write the copy in that voice.`,
        calls: [
          call("set_style", {
            music: look.music,
            grade: look.grade,
            textStyle: look.textStyle,
            textAnim: look.textAnim,
            textPosition: "Bottom",
          }),
          call("write_post_copy", {
            caption: `${hook}\n\n${title}. A few moments, made for people who care about ${w.profile.niche.toLowerCase()}.\n\nSave this for later.`,
            hashtags: `#${w.profile.niche.split(" ")[0]} #BehindTheScenes #CreatorDiary #${w.brand.platform.split(" ")[0]}`,
            cta: "Save this for later.",
            coverTitle: title,
          }),
        ],
      };
    if (!done("schedule_post")) {
      let date = addDays(w.today, 2);
      while (w.scheduled.includes(date)) date = addDays(date, 1);
      return {
        thought: `Scheduling for ${date}: two days out leaves time to review, and that day is free on the calendar.`,
        calls: [call("schedule_post", { date })],
      };
    }
    const lastVerify = t.findLast((e) => e.call.name === "verify_edit");
    const verifiedAfterEdits =
      lastVerify &&
      t.indexOf(lastVerify) >
        t.findLastIndex(
          (e) =>
            e.call.name !== "verify_edit" && e.call.name !== "render_video",
        );
    if (!verifiedAfterEdits)
      return {
        thought:
          "Everything is drafted. Running the harness checks before I’m allowed to render.",
        calls: [call("verify_edit")],
      };
    if (!done("render_video"))
      return {
        thought: "All checks passed. Handing the edit to the renderer.",
        calls: [call("render_video")],
      };
    return {
      thought: `Done. “${title}” is edited, rendered and on the calendar. Open it in the editor to change anything.`,
      calls: [],
    };
  },
};
const palettes = [
  ["#f6d6ad", "#e58f65", "#7a3e2c"],
  ["#cfe3d4", "#6fa58a", "#23463a"],
  ["#d9d4f5", "#8676d8", "#2b2457"],
  ["#f8c9d4", "#d86f8f", "#5a1f33"],
  ["#c9e4f7", "#5b9bd5", "#1c3a5e"],
];
const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// Returns a labelled placeholder frame, not AI footage. A real provider returns video.
export const demoVideo: VideoProvider = {
  id: "demo-placeholder",
  label: "Demo video generator (placeholder frames)",
  async generate({ prompt, ratio }) {
    await wait(900);
    let h = 0;
    for (const c of prompt) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const [a, b, c] = palettes[h % palettes.length];
    const [w, ht] =
      ratio === "16:9"
        ? [1920, 1080]
        : ratio === "1:1"
          ? [1080, 1080]
          : [1080, 1920];
    const words = prompt.split(" — ")[0].split(" ");
    const lines: string[] = [];
    for (const word of words) {
      if (lines.length && (lines.at(-1) + " " + word).length <= 16)
        lines[lines.length - 1] += " " + word;
      else lines.push(word);
    }
    const shapes = Array.from({ length: 5 }, (_, i) => {
      const k = (h >>> (i * 5)) & 31;
      return `<circle cx="${(k / 31) * w}" cy="${(((k * 7) % 31) / 31) * ht}" r="${180 + k * 14}" fill="${i % 2 ? b : "#ffffff"}" opacity="${i % 2 ? 0.35 : 0.14}"/>`;
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${ht}" viewBox="0 0 ${w} ${ht}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${ht}" fill="url(#g)"/>${shapes}${lines
      .slice(0, 4)
      .map(
        (l, i) =>
          `<text x="${w / 2}" y="${ht * 0.46 + i * 110}" text-anchor="middle" font-family="Georgia, serif" font-size="92" fill="${c}">${escape(l)}</text>`,
      )
      .join(
        "",
      )}<text x="${w / 2}" y="${ht - 90}" text-anchor="middle" font-family="sans-serif" font-size="30" letter-spacing="6" fill="${c}" opacity="0.75">DEMO PLACEHOLDER · NOT AI FOOTAGE</text></svg>`;
    return { mime: "image/svg+xml", data: svg };
  },
};
