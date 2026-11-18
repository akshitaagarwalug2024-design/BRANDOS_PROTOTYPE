export type Status =
  | "Draft"
  | "In Progress"
  | "Needs Review"
  | "In Human Review"
  | "Ready to Publish"
  | "Published";
// What UnStuck has learned about one brand. Sent with every AI request and
// updated whenever a video is approved, rejected or changed.
export type Memory = {
  voice: string;
  dos: string[];
  donts: string[];
  hooks: string[];
  learned: { text: string; at: string }[];
  // Approvals minus rejections per editing style.
  styles: Record<string, number>;
};
export const emptyMemory = (): Memory => ({
  voice: "",
  dos: [],
  donts: [],
  hooks: [],
  learned: [],
  styles: {},
});
export type Plan = "Starter" | "Pro" | "Premium";
// Placeholder prices for the prototype. No payment is taken.
export const plans: Record<
  Plan,
  {
    price: string;
    variants: number;
    memory: boolean;
    review: boolean;
    points: string[];
  }
> = {
  Starter: {
    price: "₹999",
    variants: 1,
    memory: false,
    review: false,
    points: [
      "8 short-form videos a month",
      "1 version per upload",
      "Caption, hashtags, cover and posting time",
      "1 brand",
    ],
  },
  Pro: {
    price: "₹2,999",
    variants: 3,
    memory: true,
    review: false,
    points: [
      "30 short-form videos a month",
      "3 versions from every upload",
      "Brand Memory that learns from approvals",
      "Up to 5 brands",
    ],
  },
  Premium: {
    price: "₹7,999",
    variants: 3,
    memory: true,
    review: true,
    points: [
      "Everything in Pro",
      "A named human editor checks every video before it goes out",
      "Unlimited videos and brands",
      "Priority support",
    ],
  },
};
export type SavedBrand = {
  id: string;
  name: string;
  niche: string;
  brand: Brand;
  memory: Memory;
};
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
  // Set on files added from stock search, so they are not auto-picked as footage.
  brandId?: string;
  stock?: boolean;
  credit?: { creator: string; source: string; link: string };
};
export type ItemKind =
  "photo" | "video" | "sticker" | "icon" | "illustration" | "shape";
// A stock or element search result, also what Recent, Favourites and Brand store.
export type StockResult = {
  key: string;
  kind: ItemKind;
  name: string;
  thumb: string;
  src: string;
  svg?: string;
  aspect: number;
  creator: string;
  source: string;
  link: string;
};
// Something placed on top of the video. Position and width are fractions of the frame.
export type Item = {
  id: string;
  kind: ItemKind;
  name: string;
  mediaId?: string;
  svg?: string;
  color: string;
  x: number;
  y: number;
  w: number;
  aspect: number;
  rot: number;
  anim: string;
  // "all", or the id of the one scene it appears in.
  scene: string;
  creator: string;
  source: string;
  link: string;
};
// Platform -> the shape it usually wants. "" means the creator decides.
export const platforms: Record<string, string> = {
  "Instagram Reels": "9:16",
  TikTok: "9:16",
  "YouTube Shorts": "9:16",
  "Facebook Reels": "9:16",
  "LinkedIn Video": "9:16",
  "X Video": "9:16",
  "Snapchat Spotlight": "9:16",
  "Pinterest Idea Pin": "9:16",
  Other: "9:16",
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
  folder?: string;
  brandId?: string;
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
  // The creator's own audio file, used when music is "My audio".
  musicId?: string;
  // Tempo used to line cuts up with the beat, and whether the track fades out.
  musicBpm?: number;
  musicFade?: boolean;
  musicVolume: number;
  grade: string;
  accent: string;
  textStyle: string;
  textPosition: string;
  textAnim: string;
  captionFx: string;
  elements: Elements;
  mark: string;
  items: Item[];
  brandId?: string;
  // Which of the generated versions this is, and the suggested posting time.
  variant?: string;
  bestTime?: string;
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
  stock: {
    recent: StockResult[];
    favourites: StockResult[];
    brand: StockResult[];
  };
  // The active brand's kit, niche and memory live in brand/profile/memory;
  // `brands` keeps a saved copy of every brand so agencies can switch.
  memory: Memory;
  plan: Plan;
  brands: SavedBrand[];
  brandId: string;
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
    audience: "Local customers",
    platform: brand.platform,
    tone: brand.tone,
    step: 0,
    status: "Draft",
    mediaIds: [],
    concept: 0,
    scenes: [],
    caption: "",
    hashtags: "#SmallBusiness #BehindTheScenes #SupportLocal",
    cta: "Follow for more updates.",
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
      : "MADE WITH UNSTUCK",
    items: [],
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
  let p = newProject(defaultBrand, "A morning at the studio");
  p.mediaIds = ["s1", "s2", "s3"];
  p = autoEdit(p);
  p.id = "sample-project";
  p.scenes = p.scenes.map((s, i) => ({
    ...s,
    id: `scene-${i}`,
    title: ["Opening up", "Preparing today’s orders", "Ready for customers"][i],
    text: [
      "Doors open at eight.",
      "Every order is prepared by hand.",
      "Visit us this week.",
    ][i],
  }));
  p.caption =
    "A look at how each day starts at the studio.\n\nFollow for more updates.";
  p.coverTitle = "A morning at the studio";
  return {
    projects: [p],
    media: samples,
    ideas: [],
    brand: defaultBrand,
    profile: {
      name: "My business",
      niche: "Retail & products",
      platform: "Instagram Reels",
      experience: "Beginner",
      challenge: "Turning footage into stories",
      style: "Warm & minimal",
      onboarded: true,
    },
    journal: [],
    goal: { metric: "Followers", current: 6480, target: 10000 },
    stock: { recent: [], favourites: [], brand: [] },
    memory: emptyMemory(),
    plan: "Pro",
    brands: [
      {
        id: "brand-1",
        name: "My business",
        niche: "Retail & products",
        brand: defaultBrand,
        memory: emptyMemory(),
      },
    ],
    brandId: "brand-1",
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
    caption: `${c.hook}\n\n${p.idea}. A few moments from the process, for ${p.audience.toLowerCase()}.\n\n${p.cta}`,
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
  itemAnim: ["None", "Fade in", "Pop", "Slide up", "Pulse"],
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
    scenes: planned.scenes.map((s, i, all) => ({
      ...s,
      // Short-form only: keep the whole video between 15 and 60 seconds.
      duration: Math.max(
        1,
        Math.min(
          Math.floor(60 / all.length),
          Math.max(look.pace, Math.ceil(15 / all.length)),
        ),
      ),
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
    if (p.mark === "MADE WITH BRANDOS") p.mark = "MADE WITH UNSTUCK";
    p.ratio = "9:16";
    if (old) p.step = raw.step >= 4 ? 1 : 0;
    if (!p.scenes.length) {
      if (!p.mediaIds.length)
        p.mediaIds = s.media.filter((m) => m.sample).map((m) => m.id);
      p = { ...autoEdit(p), step: 0, status: p.status };
    }
    p.step = Math.min(1, Math.max(0, p.step));
    return p;
  });
  const brandId = s.brandId || "brand-1";
  const owned = <T extends { brandId?: string }>(list: T[]) =>
    list.map((x) => (x.brandId ? x : { ...x, brandId }));
  return {
    ...s,
    memory: { ...emptyMemory(), ...s.memory },
    plan: s.plan || "Pro",
    brandId,
    brands: s.brands?.length
      ? s.brands
      : [
          {
            id: brandId,
            name: s.profile.name || "My business",
            niche: s.profile.niche,
            brand: s.brand,
            memory: { ...emptyMemory(), ...s.memory },
          },
        ],
    projects: owned(projects),
    media: s.media.map((m) => (m.sample || m.brandId ? m : { ...m, brandId })),
    ideas: s.ideas || [],
    journal: owned(s.journal || []),
    stock: s.stock || { recent: [], favourites: [], brand: [] },
    goal: s.goal || { metric: "Followers", current: 6480, target: 10000 },
    profile: {
      ...s.profile,
      niche: nicheTopics[s.profile.niche]
        ? s.profile.niche
        : "Retail & products",
      onboarded: true,
    },
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
  "Retail & products": ["packing an order", "a new product", "how it is made"],
  "Food & hospitality": [
    "the morning prep",
    "a signature dish",
    "our suppliers",
  ],
  "Professional services": [
    "a client question",
    "our process",
    "a recent project",
  ],
  "Health & wellness": ["a first appointment", "a common myth", "our team"],
  "Education & training": [
    "a study tip",
    "a course preview",
    "student results",
  ],
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
    (s) => `3 things customers should know about ${s}`,
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
    "Most people only find this out later.",
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
    (s) => `Common mistakes with ${s}`,
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
          nicheTopics[state.profile.niche] || nicheTopics["Retail & products"]
        ).map((t) => [t, "your niche"] as [string, string]),
      ];
  return ideaFormats.map((_, i) => {
    const [format, title, hook, why] =
      ideaFormats[(i + shuffle) % ideaFormats.length];
    const [subject, source] = subjects[(i + shuffle * 2) % subjects.length];
    return { title: title(subject), hook, format, why, source };
  });
}

// Everything UnStuck currently knows about the active brand, as readable facts.
export function memoryFacts(state: State): string[] {
  const { brand, memory, profile } = state;
  const favourite = Object.entries(memory.styles).sort(
    (a, b) => b[1] - a[1],
  )[0];
  return [
    `Industry: ${profile.niche}`,
    `Brand colour: ${brand.color}`,
    `Typography: ${brand.font}`,
    `Tone: ${brand.tone}`,
    `Caption style: ${brand.captionStyle}`,
    ...(brand.logo ? ["Logo on file"] : []),
    ...(brand.handle ? [`Handle: @${brand.handle.replace(/^@/, "")}`] : []),
    ...(memory.voice ? [`Voice: ${memory.voice}`] : []),
    ...memory.dos.map((d) => `Do: ${d}`),
    ...memory.donts.map((d) => `Don’t: ${d}`),
    ...memory.hooks.map((h) => `Approved hook: “${h}”`),
    ...(favourite && favourite[1] > 0
      ? [`Prefers the “${favourite[0]}” editing style`]
      : []),
    ...memory.learned.map((l) => `Learned: ${l.text}`),
  ];
}
// Records an approval, rejection or change request so the next video starts closer.
export function learn(
  memory: Memory,
  event: { approved?: Project; rejected?: Project[]; request?: string },
): Memory {
  const styles = { ...memory.styles };
  const at = new Date().toISOString();
  let { hooks, learned } = memory;
  if (event.approved) {
    styles[event.approved.style] = (styles[event.approved.style] || 0) + 1;
    const hook = event.approved.scenes[0]?.text;
    if (hook && !hooks.includes(hook)) hooks = [hook, ...hooks].slice(0, 12);
  }
  for (const p of event.rejected || [])
    styles[p.style] = (styles[p.style] || 0) - 1;
  if (event.request)
    learned = [
      { text: `Asked for: ${event.request.slice(0, 120)}`, at },
      ...learned,
    ].slice(0, 20);
  return { ...memory, styles, hooks, learned };
}
const slots: Record<string, string[]> = {
  "Instagram Reels": ["Thu 7:00 pm", "Tue 12:30 pm", "Sat 10:00 am"],
  TikTok: ["Tue 8:00 pm", "Fri 6:00 pm", "Sun 11:00 am"],
  "YouTube Shorts": ["Fri 5:00 pm", "Sat 11:00 am", "Wed 7:00 pm"],
  "LinkedIn Video": ["Tue 9:00 am", "Wed 12:00 pm", "Thu 8:30 am"],
};
// A general guideline per platform, not this account's analytics.
export function bestPostingTime(platform: string, n = 0) {
  const list = slots[platform] || slots["Instagram Reels"];
  return `${list[n % list.length]} · general ${platform in slots ? platform : "short-form"} guideline, not your analytics`;
}
// Saves the active brand back into the list, then loads another one.
export function switchBrand(s: State, id: string): State {
  const brands = s.brands.map((b) =>
    b.id === s.brandId
      ? { ...b, niche: s.profile.niche, brand: s.brand, memory: s.memory }
      : b,
  );
  const next = brands.find((b) => b.id === id);
  if (!next) return s;
  return {
    ...s,
    brands,
    brandId: id,
    brand: next.brand,
    memory: next.memory,
    profile: { ...s.profile, niche: next.niche },
  };
}
