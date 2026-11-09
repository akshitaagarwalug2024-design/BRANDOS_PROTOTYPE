import { concepts } from "./model";
export interface PlanningProvider {
  plan(input: {
    idea: string;
    audience: string;
    tone: string;
  }): Promise<{ mode: string; concepts: ReturnType<typeof concepts> }>;
}
// Demo is intentionally deterministic. Replace this adapter server-side to connect an LLM.
export class DemoPlanningProvider implements PlanningProvider {
  async plan(input: { idea: string; audience: string; tone: string }) {
    return { mode: "demo", concepts: concepts(input.idea) };
  }
}
export const planningProvider: PlanningProvider = new DemoPlanningProvider();
export interface RenderJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
}
export function reviseDemo(scenes: import("./model").Scene[], request: string) {
  let next = structuredClone(scenes);
  const r = request.toLowerCase();
  let explanation =
    "Added your direction to the opening text. Demo revisions use simple rules; no AI model is connected.";
  if (/remove.*(second|2)/.test(r)) {
    if (next.length < 2) throw Error("There is no second scene to remove.");
    next.splice(1, 1);
    explanation = "Removed the second scene.";
  } else if (/(shorten|seconds|faster)/.test(r)) {
    const n = r.match(/(\d+)\s*(seconds|s\b)/);
    const target = n
      ? Number(n[1])
      : Math.max(3, Math.round(next.reduce((a, s) => a + s.duration, 0) * 0.7));
    if (target < next.length || target > 120)
      throw Error("Choose a duration between the scene count and 120 seconds.");
    let remaining = target;
    next = next.map((s, i) => {
      const duration =
        i === next.length - 1
          ? remaining
          : Math.max(1, Math.floor(target / next.length));
      remaining -= duration;
      return { ...s, duration };
    });
    explanation = `Adjusted the timeline to ${target} seconds.`;
  } else if (next[0]) {
    next[0].text = /engaging|opening/.test(r)
      ? "Wait. There’s a story in this small moment."
      : request.slice(0, 150);
  }
  return { scenes: next, explanation };
}
