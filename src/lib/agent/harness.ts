import { newProject, type Project } from "../model";
import { tools, validate } from "./tools";
import type {
  AgentEvent,
  Context,
  ModelProvider,
  Transcript,
  VideoProvider,
  Workspace,
} from "./types";
// Hard limits the model cannot talk its way past.
export const limits = { maxSteps: 14, maxToolCalls: 30, maxClips: 6 };
function toProject({ draft, workspace }: Context): Project {
  const base = newProject(workspace.brand, draft.idea!.title);
  const style = draft.style as Partial<Project>;
  return {
    ...base,
    ...style,
    idea: draft.idea!.title,
    step: 0,
    status: "Needs Review",
    mediaIds: [...new Set(draft.scenes.map((s) => s.mediaId))],
    scenes: draft.scenes.map((s) => ({
      id: crypto.randomUUID(),
      mediaId: s.mediaId,
      title: s.beat,
      duration: s.seconds,
      trim: 0,
      text: s.subtitle,
      transition: s.transition,
      motion: s.motion,
    })),
    transition: draft.scenes[1]?.transition || "Fade",
    ...draft.copy!,
    date: draft.date,
  };
}
// The loop: ask the model for a turn, validate and run each tool call, feed the
// results back, and stream every step so the UI can show its work.
export async function* runAgent(
  workspace: Workspace,
  model: ModelProvider,
  video: VideoProvider,
  maxClips = limits.maxClips,
): AsyncGenerator<AgentEvent> {
  const started = Date.now();
  const ctx: Context = {
    workspace,
    draft: { scenes: [], date: "", verified: false },
    clips: [],
    video,
  };
  const specs = tools.map(({ run: _run, ...spec }) => spec);
  const transcript: Transcript = [];
  let clipCalls = 0;
  let rejected = 0,
    summary = "";
  yield {
    type: "run",
    model: model.label,
    video: video.label,
    tools: specs,
    maxSteps: limits.maxSteps,
  };
  let step = 0;
  for (step = 1; step <= limits.maxSteps; step++) {
    const asked = Date.now();
    const turn = await model.next({ workspace, tools: specs, transcript });
    yield { type: "step", step, thought: turn.thought, ms: Date.now() - asked };
    if (!turn.calls.length) {
      summary = turn.thought;
      break;
    }
    // Calls in one turn are independent, so they run in parallel.
    const results = await Promise.all(
      turn.calls.map(async (call) => {
        const began = Date.now();
        const tool = tools.find((t) => t.name === call.name);
        let ok = false,
          output: unknown;
        try {
          if (!tool) throw Error(`Unknown tool “${call.name}”`);
          if (transcript.length >= limits.maxToolCalls)
            throw Error("Tool-call budget for this run is used up");
          if (call.name === "generate_clip" && ++clipCalls > maxClips)
            throw Error(`At most ${maxClips} generated clips per run`);
          const errors = validate(tool.schema, call.args);
          if (errors.length)
            throw Error(`Invalid arguments: ${errors.join("; ")}`);
          output = await tool.run(call.args, ctx);
          ok = true;
        } catch (e) {
          output = { error: e instanceof Error ? e.message : String(e) };
        }
        return { call, tool, ok, output, ms: Date.now() - began };
      }),
    );
    // A model that repeats a rejected call unchanged will never get past it.
    const stuck =
      results.every((r) => !r.ok) &&
      results.every((r) =>
        transcript.some(
          (e) =>
            !e.ok &&
            e.call.name === r.call.name &&
            JSON.stringify(e.call.args) === JSON.stringify(r.call.args),
        ),
      );
    for (const r of results) {
      if (!r.ok) rejected++;
      transcript.push({ call: r.call, ok: r.ok, output: r.output });
      yield {
        type: "tool",
        step,
        id: r.call.id,
        name: r.call.name,
        runsOn: r.tool?.runsOn || "server",
        args: r.call.args,
        ok: r.ok,
        output: r.output,
        ms: r.ms,
      };
    }
    if (stuck) {
      summary = `it repeated a rejected ${results[0].call.name} call (${(results[0].output as { error: string }).error})`;
      break;
    }
  }
  if (
    !ctx.draft.verified ||
    !transcript.some((e) => e.call.name === "render_video" && e.ok)
  ) {
    yield {
      type: "error",
      message: summary
        ? `The agent stopped without a verified edit: ${summary}`
        : `The agent hit the ${limits.maxSteps}-step limit before finishing.`,
    };
    return;
  }
  yield {
    type: "done",
    summary,
    project: toProject(ctx),
    clips: ctx.clips,
    steps: step,
    toolCalls: transcript.length,
    rejected,
    ms: Date.now() - started,
  };
}
