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
  { name: "@slowstudio", followers: 18400, perWeek: 5, engagement: 4.6 },
  { name: "@everyday.edit", followers: 9200, perWeek: 4, engagement: 3.8 },
  { name: "@madebymira", followers: 5100, perWeek: 2, engagement: 6.1 },
];
export const reactions = [
  {
    title: "A slower kind of morning",
    type: "Reel",
    views: 12400,
    likes: 1180,
    comments: 96,
    saves: 412,
    mood: "Loved",
    theme: "“Needed this today” — people relate to the calm pace.",
  },
  {
    title: "3 things I learned this month",
    type: "Reel",
    views: 8900,
    likes: 640,
    comments: 152,
    saves: 233,
    mood: "Talked about",
    theme: "Lots of questions about tip #2 — worth a follow-up.",
  },
  {
    title: "Studio tour",
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
  "Lifestyle & everyday": [
    ["Sunday reset routines", 42],
    ["5-to-9 before the 9-to-5", 31],
    ["Romanticising small rituals", 18],
  ],
  "Education & learning": [
    ["Study with me", 38],
    ["Learn this in 30 seconds", 27],
    ["Notes that actually work", 16],
  ],
  "Business & products": [
    ["Packing an order", 44],
    ["Honest founder diaries", 29],
    ["Pricing, explained", 14],
  ],
  "Travel & food": [
    ["48 hours in one city", 36],
    ["Hidden local spots", 30],
    ["What I ate today", 19],
  ],
  "Art & design": [
    ["Process timelapses", 47],
    ["Sketchbook tours", 25],
    ["Redesigning old work", 17],
  ],
};
export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
