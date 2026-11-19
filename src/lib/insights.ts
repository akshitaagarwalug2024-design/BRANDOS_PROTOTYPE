// Sample analytics. No social platform is connected in this prototype, so the
// dashboard is driven by this illustrative data and always labelled as such.
export const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
export const metrics: Record<
  string,
  { values: number[]; unit: string; note: string }
> = {
  Reach: {
    values: [8200, 9100, 8700, 11400, 12900, 12100, 15300, 17800],
    unit: "",
    note: "Reach is climbing fastest on weeks with 3+ posts.",
  },
  "New followers": {
    values: [110, 140, 120, 210, 260, 230, 310, 380],
    unit: "",
    note: "Follower growth has more than tripled in 8 weeks.",
  },
  "Engagement rate": {
    values: [3.1, 3.4, 3.2, 4.0, 4.4, 4.1, 4.9, 5.2],
    unit: "%",
    note: "Engagement is above the 3.5% niche average.",
  },
};
export const competitors = [
  { name: "You", followers: 0, perWeek: 3, engagement: 5.2, you: true },
  { name: "@northside.goods", followers: 18400, perWeek: 5, engagement: 4.6 },
  { name: "@thecornerstore", followers: 9200, perWeek: 4, engagement: 3.8 },
  { name: "@atelier.mira", followers: 5100, perWeek: 2, engagement: 6.1 },
];
export const reactions = [
  {
    title: "How we pack every order",
    type: "Reel",
    views: 12400,
    likes: 1180,
    comments: 96,
    saves: 412,
    mood: "Loved",
    theme: "Viewers asked about delivery times in the comments.",
  },
  {
    title: "3 things customers ask us",
    type: "Reel",
    views: 8900,
    likes: 640,
    comments: 152,
    saves: 233,
    mood: "Talked about",
    theme: "Lots of questions about tip #2 — worth a follow-up.",
  },
  {
    title: "Shop tour",
    type: "Post",
    views: 4300,
    likes: 310,
    comments: 21,
    saves: 58,
    mood: "Quiet",
    theme: "Fewer saves than usual. The hook came late.",
  },
];
export const trending: Record<string, [string, number][]> = {
  "Retail & products": [
    ["Packing an order", 44],
    ["Founder updates", 29],
    ["Pricing, explained", 14],
  ],
  "Food & hospitality": [
    ["Morning prep", 41],
    ["Meet the supplier", 26],
    ["Dish of the week", 18],
  ],
  "Professional services": [
    ["Client questions answered", 38],
    ["A day at the practice", 24],
    ["Process walkthroughs", 15],
  ],
  "Health & wellness": [
    ["Myths corrected", 36],
    ["What a first visit looks like", 27],
    ["Meet the team", 16],
  ],
  "Education & training": [
    ["Learn this in 30 seconds", 39],
    ["Student results", 25],
    ["Course previews", 17],
  ],
};
export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
