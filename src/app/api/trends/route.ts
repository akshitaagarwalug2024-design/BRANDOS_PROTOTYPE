// Weekly trending short videos for a niche from the YouTube Data API. One
// search costs 100 quota units and is cached for the week, so normal use stays
// far inside the free 10,000 units a day.
import { allow, geminiReady } from "@/lib/gemini";
type Popular = { topic: string; why: string; angle: string };
// One answer per industry and goal per day, so repeat visits cost nothing.
const cache = new Map<string, unknown>();
// Asks Gemini, with Google Search switched on, what is popular this week and
// how this business could use it. `grounded` says whether a search really ran.
async function popular(niche: string, goal: string) {
  const key = `${new Date().toISOString().slice(0, 10)}|${niche}|${goal}`;
  if (cache.has(key)) return cache.get(key);
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Search the web for what is popular on social media and in the news this week. List 5 things a small business in "${niche}" could credibly make a short vertical video about${goal ? `, given its goal is to grow ${goal}` : ""}. Skip anything political, tragic or unsuitable for a brand. Return only a JSON array of objects with keys "topic" (under 8 words), "why" (one sentence on why it is popular now) and "angle" (one sentence on the video this business could make).`,
              },
            ],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: { maxOutputTokens: 1800 },
      }),
    },
  );
  const data = await r.json();
  if (!r.ok) throw Error(data.error?.message || "Gemini is unavailable");
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((p: { text?: string }) => p.text || "")
    .join("");
  const items = (
    JSON.parse(
      text.slice(text.indexOf("["), text.lastIndexOf("]") + 1),
    ) as Popular[]
  )
    .filter((x) => x.topic && x.angle)
    .slice(0, 5);
  const chunks: { web?: { uri: string; title: string } }[] =
    candidate?.groundingMetadata?.groundingChunks || [];
  const out = {
    popular: items,
    grounded: chunks.length > 0,
    sources: chunks.flatMap((c) => (c.web ? [c.web] : [])).slice(0, 5),
  };
  cache.set(key, out);
  return out;
}
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const niche = (params.get("niche") || "")
    .replace(/[^\w &-]/g, "")
    .slice(0, 60);
  if (params.get("popular")) {
    if (!geminiReady() || !niche || !allow(req, 6))
      return Response.json({ popular: [] });
    try {
      return Response.json(
        await popular(
          niche,
          (params.get("goal") || "").replace(/[^\w ]/g, "").slice(0, 30),
        ),
      );
    } catch (e) {
      return Response.json({
        popular: [],
        problem: e instanceof Error ? e.message.slice(0, 160) : "Unavailable",
      });
    }
  }
  if (!process.env.YOUTUBE_API_KEY || !niche)
    return Response.json({ connect: !process.env.YOUTUBE_API_KEY, items: [] });
  // Round to Monday 00:00 UTC so every request in a week shares one cache entry.
  const week = new Date();
  week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7) - 7);
  week.setUTCHours(0, 0, 0, 0);
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&order=viewCount&maxResults=8&publishedAfter=${week.toISOString()}&q=${encodeURIComponent(`${niche} small business #shorts`)}&key=${process.env.YOUTUBE_API_KEY}`,
      { next: { revalidate: 604800 } },
    );
    const data = await r.json();
    if (!r.ok) throw Error(data.error?.message);
    return Response.json({
      since: week.toISOString().slice(0, 10),
      items: (data.items || []).map(
        (v: {
          id: { videoId: string };
          snippet: { title: string; channelTitle: string };
        }) => ({
          title: v.snippet.title,
          channel: v.snippet.channelTitle,
          url: `https://www.youtube.com/shorts/${v.id.videoId}`,
        }),
      ),
    });
  } catch (e) {
    return Response.json({
      items: [],
      problem: e instanceof Error ? e.message : "YouTube is unavailable",
    });
  }
}
