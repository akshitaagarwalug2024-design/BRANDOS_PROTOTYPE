export type Status =
  "Draft" | "In Progress" | "Needs Review" | "Ready to Publish" | "Published";
export type Media = {
  id: string;
  name: string;
  type: "image" | "video" | "audio";
  url: string;
  collection: string;
  tags: string;
  sample?: boolean;
  size?: number;
  created?: string;
  // Journal note that came with this file, if it was captured in the journal.
  note?: string;
  // Filled in by the library indexer (src/lib/library.ts).
  auto?: string;
  meta?: { w: number; h: number; duration: number; color: string };
};
// Platform -> the shape it usually wants. "" means the creator decides.
export const platforms: Record<string, string> = {
  "Instagram Reels": "9:16",
  "Instagram Post": "1:1",
  "Instagram Story": "9:16",
  TikTok: "9:16",
  "YouTube Shorts": "9:16",
  YouTube: "16:9",
  Facebook: "1:1",
  X: "16:9",
  LinkedIn: "1:1",
  Snapchat: "9:16",
  Pinterest: "9:16",
  Other: "",
};
export type Scene = {
  id: string;
  mediaId: string;
  title: string;
  duration: number;
  trim: number;
  text: string;
  transition?: string;
  motion?: string;
};
export type Elements = {
  title: boolean;
  progress: boolean;
  watermark: boolean;
  cta: boolean;
};
export type JournalEntry = {
  id: string;
  kind: "text" | "audio" | "video" | "photo";
  text: string;
  created: string;
};
export type Goal = { metric: string; current: number; target: number };
export type Project = {
  id: string;
  title: string;
  idea: string;
  goal: string;
  audience: string;
  platform: string;
  tone: string;
  step: number;
  status: Status;
  mediaIds: string[];
  concept: number;
  scenes: Scene[];
  caption: string;
  hashtags: string;
  cta: string;
  ratio: string;
  subtitles: boolean;
  style: string;
  volume: number;
  transition: string;
  brightness: number;
  music: string;
  musicVolume: number;
  grade: string;
  accent: string;
  textStyle: string;
  textPosition: string;
  textAnim: string;
  captionFx: string;
  elements: Elements;
  mark: string;
  history: {
    label: string;
    scenes: Scene[];
    caption: string;
    style: string;
    subtitles: boolean;
  }[];
  updated: string;
  date: string;
  coverTitle: string;
};
export type Brand = {
  color: string;
  font: string;
  tone: string;
  platform: string;
  ratio: string;
  captionStyle: string;
  editing: string;
  logo?: string;
  handle?: string;
};
export type Profile = {
  name: string;
  niche: string;
  platform: string;
  experience: string;
  challenge: string;
  style: string;
  onboarded: boolean;
};
export type State = {
  projects: Project[];
  media: Media[];
  ideas: string[];
  brand: Brand;
  profile: Profile;
  journal: JournalEntry[];
  goal: Goal;
  version?: number;
};
export const steps = ["Edit", "Post"];
export const samples: Media[] = [
  {
    id: "s1",
    name: "The morning ritual",
    type: "video",
    url: "/media/morning.mp4",
    collection: "Slow mornings",
    tags: "coffee, routine, detail",
    sample: true,
  },
  {
    id: "s2",
    name: "A little room to grow",
    type: "image",
    url: "/media/grow.svg",
    collection: "Slow mornings",
    tags: "plants, lifestyle, calm",
    sample: true,
  },
  {
    id: "s3",
    name: "Made with intention",
    type: "image",
    url: "/media/made.svg",
    collection: "At the studio",
    tags: "design, process, craft",
    sample: true,
  },
];
export function newProject(brand: Brand, idea = ""): Project {
  return {
    id: crypto.randomUUID(),
    title: idea || "Untitled story",
    idea,
    goal: "Build community",
    audience: "Curious creatives",
    platform: brand.platform,
    tone: brand.tone,
    step: 0,
    status: "Draft",
    mediaIds: [],
    concept: 0,
    scenes: [],
    caption: "",
    hashtags: "#CreativeProcess #BehindTheScenes #MadeWithIntention",
    cta: "Save this for your next creative morning.",
    ratio: brand.ratio,
    subtitles: true,
    style: brand.editing,
    volume: 0.7,
    transition: "Cut",
    brightness: 100,
    music: "Calm",
    musicVolume: 0.5,
    grade: "Natural",
    accent: brand.color,
    textStyle: "Boxed",
    textPosition: "Bottom",
    textAnim: "Fade up",
    captionFx: "Highlight",
    elements: { title: true, progress: true, watermark: true, cta: true },
    mark: brand.handle
      ? `@${brand.handle.replace(/^@/, "")}`
      : "MADE WITH BRANDOS",
    history: [],
    updated: new Date().toISOString(),
    date: "",
    coverTitle: "",
  };
}
export const defaultBrand: Brand = {
  color: "#3264e8",
  font: "Sans",
  tone: "Warm & authentic",
  platform: "Instagram Reels",
  ratio: "9:16",
  captionStyle: "Minimal",
  editing: "Slow & intentional",
};
export function initialState(): State {
  let p = newProject(defaultBrand, "The rhythm of a creative day");
  p.mediaIds = ["s1", "s2", "s3"];
  p = autoEdit(p);
  p.id = "sample-project";
  p.scenes = p.scenes.map((s, i) => ({
    ...s,
    id: `scene-${i}`,
    title: [
      "Start with a small moment",
      "Find your rhythm",
      "Make space for what matters",
    ][i],
    text: [
      "A slower kind of morning.",
      "A little intention goes a long way.",
      "What will you create today?",
    ][i],
  }));
  p.caption =
    "A slower morning. A little intention. Something worth sharing. ☕\n\nSave this for a little inspiration.";
  p.coverTitle = "Create at your own pace";
  return {
    projects: [p],
    media: samples,
    ideas: [],
    brand: defaultBrand,
    profile: {
      name: "Creator",
      niche: "Lifestyle & everyday",
      platform: "Instagram Reels",
      experience: "Beginner",
      challenge: "Turning footage into stories",
      style: "Warm & minimal",
      onboarded: true,
    },
    journal: [],
    goal: { metric: "Followers", current: 6480, target: 10000 },
    version: 2,
  };
}
export function concepts(idea: string) {
  return [
    {
      title: `The story behind ${idea || "your everyday"}`,
      hook: "The part you don’t usually see.",
      outline: [
        "An unexpected detail",
        "The process, one moment at a time",
        "A small takeaway worth saving",
      ],
      why: "A behind-the-scenes structure makes an everyday idea feel personal and approachable.",
      duration: 20,
    },
    {
      title: `3 things about ${idea || "your creative process"}`,
      hook: "Start here. Keep it simple.",
      outline: [
        "Introduce the idea",
        "Share three useful details",
        "Invite your audience to try it",
      ],
      why: "A short list gives your audience a clear reason to stay and save the post.",
      duration: 24,
    },
    {
      title: `A moment of ${idea || "inspiration"}`,
      hook: "A small moment. A different perspective.",
      outline: [
        "Open with atmosphere",
        "Show the transformation",
        "Leave a thoughtful question",
      ],
      why: "An atmospheric story gives your footage room to breathe and invites conversation.",
      duration: 15,
    },
  ];
}
export function makePlan(p: Project, media: Media[]) {
  const c = concepts(p.idea)[p.concept];
  return {
    ...p,
    scenes: p.mediaIds.map((id, i) => ({
      id: crypto.randomUUID(),
      mediaId: id,
      title: c.outline[i % c.outline.length],
      duration: Math.round(c.duration / p.mediaIds.length),
      trim: 0,
      text: i === 0 ? c.hook : c.outline[i % c.outline.length],
    })),
    caption: `${c.hook}\n\n${p.idea}. A few moments from the process, made for ${p.audience.toLowerCase()}.\n\n${p.cta}`,
    coverTitle: p.idea || c.title,
    status: "In Progress" as Status,
  };
}

// One complete "look" per editing style: everything the auto-edit decides.
export const looks: Record<
  string,
  {
    transition: string;
    motions: string[];
    textAnim: string;
    textStyle: string;
    music: string;
    grade: string;
    pace: number;
  }
> = {
  "Slow & intentional": {
    transition: "Fade",
    motions: ["Zoom in", "Pan right", "Zoom out"],
    textAnim: "Fade up",
    textStyle: "Boxed",
    music: "Calm",
    grade: "Warm",
    pace: 5,
  },
  "Quick & energetic": {
    transition: "Slide",
    motions: ["Zoom in", "Pan left", "Zoom out"],
    textAnim: "Pop",
    textStyle: "Bold",
    music: "Upbeat",
    grade: "Vivid",
    pace: 3,
  },
  "Clean & minimal": {
    transition: "Fade",
    motions: ["None", "Zoom in", "None"],
    textAnim: "Typewriter",
    textStyle: "Minimal",
    music: "Dreamy",
    grade: "Natural",
    pace: 4,
  },
};
export const options = {
  transition: ["Cut", "Fade", "Slide", "Zoom"],
  motion: ["None", "Zoom in", "Zoom out", "Pan left", "Pan right"],
  textAnim: ["None", "Fade up", "Pop", "Typewriter"],
  textStyle: ["Boxed", "Bold", "Minimal"],
  textPosition: ["Top", "Middle", "Bottom"],
  captionFx: ["Highlight", "Plain"],
  music: ["None", "Calm", "Upbeat", "Dreamy"],
  grade: ["Natural", "Warm", "Cool", "Mono", "Vivid"],
};
// Builds the full ready-to-post edit: scenes, text, transitions, motion, music, colour and elements.
export function autoEdit(p: Project, style = p.style): Project {
  const look = looks[style] || looks["Slow & intentional"];
  const planned = makePlan(p, []);
  return {
    ...planned,
    style,
    scenes: planned.scenes.map((s, i) => ({
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
    subtitles: true,
    elements: { title: true, progress: true, watermark: true, cta: true },
  };
}
export function editSummary(p: Project) {
  return [
    `${p.scenes.length} scene${p.scenes.length === 1 ? "" : "s"}`,
    `${p.scenes[1]?.transition || p.transition} transitions`,
    p.music === "None" ? "no music" : `${p.music} music`,
    `${p.grade} colour`,
    p.subtitles ? "subtitles on" : "subtitles off",
  ].join(" · ");
}
export function gradeFilter(grade: string, brightness: number) {
  const g: Record<string, string> = {
    Warm: " sepia(0.25) saturate(1.15)",
    Cool: " saturate(0.85) contrast(1.05) hue-rotate(10deg)",
    Mono: " grayscale(1) contrast(1.1)",
    Vivid: " saturate(1.45) contrast(1.08)",
  };
  return `brightness(${brightness}%)${g[grade] || ""}`;
}
// Fills in anything a workspace saved by an older version is missing.
export function normalizeState(s: State): State {
  const old = (s.version || 1) < 2;
  const base = newProject(s.brand);
  const projects = s.projects.map((raw) => {
    let p: Project = {
      ...base,
      ...raw,
      elements: { ...base.elements, ...raw.elements },
    };
    if (old) p.step = raw.step >= 4 ? 1 : 0;
    if (!p.scenes.length) {
      if (!p.mediaIds.length)
        p.mediaIds = s.media.filter((m) => m.sample).map((m) => m.id);
      p = { ...autoEdit(p), step: 0, status: p.status };
    }
    p.step = Math.min(1, Math.max(0, p.step));
    return p;
  });
  return {
    ...s,
    projects,
    ideas: s.ideas || [],
    journal: s.journal || [],
    goal: s.goal || { metric: "Followers", current: 6480, target: 10000 },
    profile: { ...s.profile, onboarded: true },
    version: 2,
  };
}
export type Idea = {
  title: string;
  hook: string;
  format: string;
  why: string;
  source: string;
};
const nicheTopics: Record<string, string[]> = {
  "Lifestyle & everyday": ["slow mornings", "a weekly reset", "small rituals"],
  "Education & learning": ["study habits", "learning in public", "one skill"],
  "Business & products": ["a product launch", "customer stories", "pricing"],
  "Travel & food": ["a weekend trip", "street food", "a hidden cafe"],
  "Art & design": ["a work in progress", "my sketchbook", "colour choices"],
};
const stop = new Set(
  "about after again also because been being could every from have just know like make more most much need only other people really some than that their them then there these they thing things this want what when where which while will with would your youre post posts posting content create creating right going start started still doing feel into over year years month months week weeks today currently around".split(
    " ",
  ),
);
export function journalKeywords(journal: JournalEntry[]) {
  const count = new Map<string, number>();
  for (const e of journal)
    for (const w of e.text.toLowerCase().match(/[a-z]{4,}/g) || [])
      if (!stop.has(w)) count.set(w, (count.get(w) || 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);
}
const ideaFormats: [string, (s: string) => string, string, string][] = [
  [
    "Behind the scenes",
    (s) => `The story behind ${s}`,
    "The part you don’t usually see.",
    "Showing the process makes an everyday subject feel personal.",
  ],
  [
    "List",
    (s) => `3 things I learned about ${s}`,
    "Start here. Keep it simple.",
    "A short list gives people a clear reason to stay and save.",
  ],
  [
    "Day in the life",
    (s) => `A day in the life: ${s}`,
    "Come along for the day.",
    "Day-in-the-life posts are easy to film and easy to follow.",
  ],
  [
    "Myth buster",
    (s) => `What nobody tells you about ${s}`,
    "I wish someone had told me this sooner.",
    "A surprising angle earns comments and shares.",
  ],
  [
    "Before & after",
    (s) => `${s[0].toUpperCase()}${s.slice(1)}: before and after`,
    "Wait for the difference.",
    "A visible change keeps people watching to the end.",
  ],
  [
    "Tips",
    (s) => `Beginner mistakes with ${s}`,
    "Avoid these and you’re ahead of most people.",
    "Helpful mistakes-to-avoid posts get saved for later.",
  ],
];
// Demo idea generator: no inputs required. Uses whatever it already knows.
export function suggestIdeas(state: State, topic = "", shuffle = 0): Idea[] {
  const subjects: [string, string][] = topic.trim()
    ? [[topic.trim(), "your topic"]]
    : [
        ...journalKeywords(state.journal).map(
          (w) => [w, "your journal"] as [string, string],
        ),
        ...[
          ...new Set(
            state.media.filter((m) => !m.sample).map((m) => m.collection),
          ),
        ]
          .slice(0, 2)
          .map((c) => [c.toLowerCase(), "your library"] as [string, string]),
        ...(
          nicheTopics[state.profile.niche] ||
          nicheTopics["Lifestyle & everyday"]
        ).map((t) => [t, "your niche"] as [string, string]),
      ];
  return ideaFormats.map((_, i) => {
    const [format, title, hook, why] =
      ideaFormats[(i + shuffle) % ideaFormats.length];
    const [subject, source] = subjects[(i + shuffle * 2) % subjects.length];
    return { title: title(subject), hook, format, why, source };
  });
}
