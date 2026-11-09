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
};
export type Scene = {
  id: string;
  mediaId: string;
  title: string;
  duration: number;
  trim: number;
  text: string;
};
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
};
export const steps = ["Idea", "Upload", "Plan", "Refine", "Post package"];
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
    history: [],
    updated: new Date().toISOString(),
    date: "",
    coverTitle: "",
  };
}
export const defaultBrand: Brand = {
  color: "#66744d",
  font: "Sans",
  tone: "Warm & authentic",
  platform: "Instagram Reels",
  ratio: "9:16",
  captionStyle: "Minimal",
  editing: "Slow & intentional",
};
export function initialState(): State {
  const p = newProject(defaultBrand, "Finding beauty in the everyday");
  p.id = "sample-project";
  p.mediaIds = ["s1", "s2", "s3"];
  p.step = 3;
  p.status = "In Progress";
  p.scenes = samples.map((m, i) => ({
    id: `scene-${i}`,
    mediaId: m.id,
    title: [
      "Start with a small moment",
      "Find your rhythm",
      "Make space for what matters",
    ][i],
    duration: 5,
    trim: 0,
    text: [
      "A slower kind of morning.",
      "A little intention goes a long way.",
      "What will you create today?",
    ][i],
  }));
  p.caption =
    "A slower morning. A little intention. Something worth sharing. ☕\n\nSave this for a little inspiration.";
  p.coverTitle = "The art of a slower morning";
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
      onboarded: false,
    },
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
