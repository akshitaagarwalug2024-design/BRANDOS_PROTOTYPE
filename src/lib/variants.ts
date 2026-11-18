import {
  autoEdit,
  bestPostingTime,
  looks,
  newProject,
  suggestIdeas,
  type Media,
  type Project,
  type State,
} from "./model";
// One version of a video as planned by the AI endpoint.
export type Spec = {
  name: string;
  style: string;
  hook: string;
  reason: string;
  coverTitle: string;
  caption: string;
  hashtags: string;
  cta: string;
  bestTime: string;
  scenes: { clip: string; start: number; seconds: number; subtitle: string }[];
};
const format = (state: State) => ({
  platform: state.projects[0]?.platform || "Instagram Reels",
  ratio: "9:16",
  brandId: state.brandId,
});
// Turns an AI plan into an editable project in the brand's look.
export function fromSpec(state: State, v: Spec): Project & { reason: string } {
  const look = looks[v.style] || looks["Slow & intentional"];
  return {
    ...newProject(state.brand, v.coverTitle),
    ...format(state),
    style: v.style,
    status: "Needs Review",
    mediaIds: [...new Set(v.scenes.map((s) => s.clip))],
    scenes: v.scenes.map((s, i) => ({
      id: crypto.randomUUID(),
      mediaId: s.clip,
      title: s.subtitle.slice(0, 50) || `Scene ${i + 1}`,
      duration: s.seconds,
      trim: s.start,
      text: s.subtitle,
      transition: i === 0 ? "Fade" : look.transition,
      motion: look.motions[i % look.motions.length],
    })),
    transition: look.transition,
    textAnim: look.textAnim,
    textStyle: look.textStyle,
    music: look.music,
    grade: look.grade,
    caption: v.caption,
    hashtags: v.hashtags,
    cta: v.cta,
    coverTitle: v.coverTitle,
    variant: v.name,
    bestTime: `${v.bestTime} · AI suggestion, not your analytics`,
    reason: v.reason,
  };
}
// Used when no AI is connected: three template versions in different styles,
// leading with the styles and hooks this brand has approved before.
export function templateVersions(
  state: State,
  clips: Media[],
  count: number,
  brief = "",
): (Project & { reason: string })[] {
  const styles = Object.keys(looks).sort(
    (a, b) => (state.memory.styles[b] || 0) - (state.memory.styles[a] || 0),
  );
  const ideas = suggestIdeas(
    state,
    brief || clips[0]?.note || "",
    state.projects.length,
  );
  const ids = clips.map((c) => c.id);
  return styles.slice(0, count).map((style, i) => {
    const order =
      i === 1 ? [...ids].reverse() : i === 2 ? [...ids.slice(1), ids[0]] : ids;
    const p = autoEdit(
      {
        ...newProject(state.brand, ideas[i].title),
        ...format(state),
        mediaIds: order,
      },
      style,
    );
    const hook = state.memory.hooks[i] || ideas[i].hook;
    return {
      ...p,
      status: "Needs Review",
      scenes: p.scenes.map((s, n) => (n === 0 ? { ...s, text: hook } : s)),
      variant: `Version ${"ABC"[i]}`,
      bestTime: bestPostingTime(p.platform, i),
      reason: `${ideas[i].why} Edited in the “${style}” style.`,
    };
  });
}
