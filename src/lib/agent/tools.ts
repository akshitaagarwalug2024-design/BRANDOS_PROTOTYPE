import { options } from "../model";
import { metrics, reactions, trending } from "../insights";
import type { Context, DraftScene, Field, Json, ToolSpec } from "./types";
type Tool = ToolSpec & {
  run: (args: Json, ctx: Context) => Promise<unknown> | unknown;
};
// Rejects anything a tool's schema does not allow before the tool can run.
export function validate(
  schema: Record<string, Field>,
  args: Json,
  path = "",
): string[] {
  const errors: string[] = [];
  for (const key of Object.keys(args))
    if (!schema[key]) errors.push(`${path}${key}: unknown argument`);
  for (const [key, field] of Object.entries(schema)) {
    const value = args[key],
      at = `${path}${key}`;
    if (value === undefined || value === null || value === "") {
      if (field.required) errors.push(`${at}: required`);
      continue;
    }
    if (field.type === "array") {
      if (!Array.isArray(value)) errors.push(`${at}: must be a list`);
      else {
        if (field.min && value.length < field.min)
          errors.push(`${at}: needs at least ${field.min} items`);
        if (field.maxItems && value.length > field.maxItems)
          errors.push(`${at}: at most ${field.maxItems} items`);
        if (field.items)
          value.forEach((item, i) =>
            errors.push(
              ...validate(field.items!, item as Json, `${at}[${i}].`),
            ),
          );
      }
    } else if (typeof value !== field.type)
      errors.push(`${at}: must be a ${field.type}`);
    else if (field.type === "number") {
      const n = value as number;
      if (!Number.isFinite(n)) errors.push(`${at}: must be a finite number`);
      if (field.min !== undefined && n < field.min)
        errors.push(`${at}: minimum is ${field.min}`);
      if (field.max !== undefined && n > field.max)
        errors.push(`${at}: maximum is ${field.max}`);
    } else {
      const s = value as string;
      if (field.enum && !field.enum.includes(s))
        errors.push(`${at}: must be one of ${field.enum.join(", ")}`);
      if (field.maxLength && s.length > field.maxLength)
        errors.push(`${at}: at most ${field.maxLength} characters`);
    }
  }
  return errors;
}
const sceneSchema: Record<string, Field> = {
  beat: { type: "string", required: true, maxLength: 80 },
  subtitle: { type: "string", required: true, maxLength: 80 },
  source: { type: "string", required: true, enum: ["library", "generate"] },
  mediaId: { type: "string", description: "Required when source is library" },
  prompt: {
    type: "string",
    maxLength: 300,
    description: "Required when source is generate",
  },
  seconds: { type: "number", required: true, min: 2, max: 15 },
  transition: { type: "string", required: true, enum: options.transition },
  motion: { type: "string", required: true, enum: options.motion },
};
// Final gate. render_video refuses to run until every check here passes.
export function checks(ctx: Context) {
  const { draft, workspace, clips } = ctx;
  const total = draft.scenes.reduce((n, s) => n + s.seconds, 0);
  const tags = (draft.copy?.hashtags.match(/#\w+/g) || []).length;
  return [
    {
      check: "Has an idea and a storyboard",
      pass: Boolean(draft.idea) && draft.scenes.length > 0,
      detail: `${draft.scenes.length} scenes`,
    },
    {
      check: "Length fits a short-form post (5–60s)",
      pass: total >= 5 && total <= 60,
      detail: `${total}s`,
    },
    {
      check: "Every scene has footage",
      pass: draft.scenes.every((s) =>
        s.source === "library"
          ? workspace.media.some((m) => m.id === s.mediaId)
          : clips.some((c) => c.id === s.mediaId),
      ),
      detail: `${draft.scenes.filter((s) => s.mediaId).length} of ${draft.scenes.length} ready`,
    },
    {
      check: "Style is set",
      pass: Boolean(draft.style),
      detail: draft.style ? String(draft.style.music) + " music" : "missing",
    },
    {
      check: "Caption, call-to-action and 3–8 hashtags",
      pass:
        Boolean(draft.copy?.caption && draft.copy.cta) &&
        tags >= 3 &&
        tags <= 8,
      detail: `${tags} hashtags`,
    },
    {
      check: "Scheduled today or later, on a free day",
      pass:
        Boolean(draft.date) &&
        draft.date >= workspace.today &&
        !workspace.scheduled.includes(draft.date),
      detail: draft.date || "no date",
    },
  ];
}
export const tools: Tool[] = [
  {
    name: "read_creator_context",
    description: "Read the creator's journal, goal, niche and brand defaults.",
    runsOn: "server",
    schema: {},
    run: (_a, { workspace: w }) => ({
      brief: w.brief || "(none given)",
      niche: w.profile.niche,
      goal: `${w.goal.current} of ${w.goal.target} ${w.goal.metric.toLowerCase()}`,
      journal: w.journal.slice(-5),
      brand: {
        tone: w.brand.tone,
        editing: w.brand.editing,
        platform: w.brand.platform,
        ratio: w.brand.ratio,
      },
    }),
  },
  {
    name: "review_performance",
    description:
      "Read recent post performance and topics trending in the creator's niche.",
    runsOn: "server",
    schema: {},
    run: (_a, { workspace: w }) => ({
      note: "Sample analytics. No social account is connected.",
      engagementRate: metrics["Engagement rate"].values.at(-1),
      bestPost: reactions[0],
      weakestPost: reactions.at(-1),
      trending: trending[w.profile.niche] || trending["Retail & products"],
    }),
  },
  {
    name: "inspect_library",
    description: "List the files in the creator's media library.",
    runsOn: "server",
    schema: {},
    run: (_a, { workspace: w }) => ({
      own: w.media.filter((m) => m.own),
      samples: w.media.filter((m) => !m.own).length,
    }),
  },
  {
    name: "choose_idea",
    description: "Commit to the post idea and its opening hook.",
    runsOn: "server",
    schema: {
      title: { type: "string", required: true, maxLength: 120 },
      hook: { type: "string", required: true, maxLength: 120 },
      reason: { type: "string", required: true, maxLength: 300 },
    },
    run: (a, { draft }) => {
      draft.idea = a as NonNullable<typeof draft.idea>;
      draft.verified = false;
      return { committed: a.title };
    },
  },
  {
    name: "write_storyboard",
    description:
      "Set the scene-by-scene plan. Each scene uses a library file or asks for a generated clip.",
    runsOn: "server",
    schema: {
      scenes: {
        type: "array",
        required: true,
        min: 2,
        maxItems: 6,
        items: sceneSchema,
      },
    },
    run: (a, { draft, workspace }) => {
      const scenes = a.scenes as DraftScene[];
      for (const [i, s] of scenes.entries()) {
        if (
          s.source === "library" &&
          !workspace.media.some((m) => m.id === s.mediaId)
        )
          throw Error(`scenes[${i}].mediaId is not a file in the library`);
        if (s.source === "generate" && !s.prompt)
          throw Error(`scenes[${i}].prompt is required for a generated clip`);
      }
      draft.scenes = scenes.map((s) => ({
        ...s,
        mediaId: s.source === "library" ? s.mediaId : "",
      }));
      draft.verified = false;
      return {
        scenes: scenes.length,
        seconds: scenes.reduce((n, s) => n + s.seconds, 0),
        toGenerate: scenes.filter((s) => s.source === "generate").length,
      };
    },
  },
  {
    name: "generate_clip",
    description:
      "Generate footage for one storyboard scene with the video model.",
    runsOn: "server",
    schema: {
      scene: { type: "number", required: true, min: 1, max: 6 },
    },
    run: async (a, { draft, clips, video, workspace }) => {
      const scene = draft.scenes[(a.scene as number) - 1];
      if (!scene) throw Error(`There is no scene ${a.scene}`);
      if (scene.source !== "generate")
        throw Error(`Scene ${a.scene} uses a library file`);
      const made = await video.generate({
        prompt: scene.prompt,
        seconds: scene.seconds,
        ratio: workspace.brand.ratio,
      });
      const id = crypto.randomUUID();
      clips.push({
        id,
        name: `Generated · ${scene.beat}`,
        prompt: scene.prompt,
        ...made,
      });
      scene.mediaId = id;
      draft.verified = false;
      return { clip: id, seconds: scene.seconds, provider: video.label };
    },
  },
  {
    name: "set_style",
    description:
      "Choose music, colour grade and subtitle look for the whole video.",
    runsOn: "server",
    schema: {
      music: { type: "string", required: true, enum: options.music },
      grade: { type: "string", required: true, enum: options.grade },
      textStyle: { type: "string", required: true, enum: options.textStyle },
      textAnim: { type: "string", required: true, enum: options.textAnim },
      textPosition: {
        type: "string",
        required: true,
        enum: options.textPosition,
      },
    },
    run: (a, { draft }) => {
      draft.style = a;
      draft.verified = false;
      return a;
    },
  },
  {
    name: "write_post_copy",
    description: "Write the caption, hashtags, call-to-action and cover title.",
    runsOn: "server",
    schema: {
      caption: { type: "string", required: true, maxLength: 2200 },
      hashtags: { type: "string", required: true, maxLength: 200 },
      cta: { type: "string", required: true, maxLength: 120 },
      coverTitle: { type: "string", required: true, maxLength: 80 },
    },
    run: (a, { draft }) => {
      draft.copy = a as NonNullable<typeof draft.copy>;
      draft.verified = false;
      return { captionLength: (a.caption as string).length };
    },
  },
  {
    name: "schedule_post",
    description: "Put the post on the content calendar (YYYY-MM-DD).",
    runsOn: "server",
    schema: { date: { type: "string", required: true, maxLength: 10 } },
    run: (a, { draft, workspace }) => {
      const date = a.date as string;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw Error("date must be YYYY-MM-DD");
      if (date < workspace.today) throw Error("date is in the past");
      if (workspace.scheduled.includes(date))
        throw Error(`${date} already has a post scheduled`);
      draft.date = date;
      draft.verified = false;
      return { scheduled: date };
    },
  },
  {
    name: "verify_edit",
    description:
      "Run the harness checks on the finished edit. Must pass before rendering.",
    runsOn: "server",
    schema: {},
    run: (_a, ctx) => {
      const results = checks(ctx);
      ctx.draft.verified = results.every((r) => r.pass);
      return { passed: ctx.draft.verified, checks: results };
    },
  },
  {
    name: "render_video",
    description: "Render the verified edit to a video file.",
    runsOn: "browser",
    schema: {},
    run: (_a, { draft }) => {
      if (!draft.verified)
        throw Error("Blocked: verify_edit has not passed for this edit");
      return { handedTo: "browser renderer" };
    },
  },
];
