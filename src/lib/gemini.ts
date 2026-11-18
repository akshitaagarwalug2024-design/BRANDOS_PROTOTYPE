// Server-only helper for the Gemini API. The key never reaches the browser.
export type Part =
  { text: string } | { inlineData: { mimeType: string; data: string } };
export const geminiReady = () => Boolean(process.env.GEMINI_API_KEY);
export async function geminiJson<T>(parts: Part[], schema: object): Promise<T> {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          maxOutputTokens: 6000,
        },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw Error(data.error?.message || `Gemini returned ${response.status}`);
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join("");
  if (!text) throw Error("Gemini returned no content");
  return JSON.parse(text) as T;
}
// A small per-instance limiter so a script cannot run up the bill.
const hits = new Map<string, number[]>();
export function allow(req: Request, perMinute = 12) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return false;
  const who = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const recent = (hits.get(who) || []).filter((t) => now - t < 60000);
  if (recent.length >= perMinute) return false;
  hits.set(who, [...recent, now]);
  return true;
}
