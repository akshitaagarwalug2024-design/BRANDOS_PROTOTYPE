import type { VideoProvider } from "./types";
// Gemini Omni video generation through the Interactions API. Every call costs
// money, so the route only uses this provider when a run explicitly asks for it.
export const omniPricePerSecond = 0.07; // USD at 720p, per Google's pricing notes
export const omniVideo: VideoProvider = {
  id: "gemini-omni-1.2-flash",
  label: "Gemini Omni 1.2 Flash · 720p",
  async generate({ prompt, seconds, ratio }) {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-omni-1.2-flash",
          input: `${prompt} No on-screen text, captions, logos or watermarks.`,
          response_format: {
            type: "video",
            // Omni makes 9:16 or 16:9; square posts are cropped from vertical.
            aspect_ratio: ratio === "16:9" ? "16:9" : "9:16",
            resolution: "720p",
            duration: `${Math.max(3, Math.min(15, Math.round(seconds)))}s`,
            delivery: "uri",
          },
        }),
      },
    );
    const data = await response.json();
    if (!response.ok)
      throw Error(
        `Video model error: ${data.error?.message || response.status}`,
      );
    const video = (data.steps || [])
      .flatMap((s: { content?: unknown[] }) => s.content || [])
      .find((c: { type?: string }) => c.type === "video") as
      { uri?: string; mime_type?: string } | undefined;
    const file = video?.uri?.match(/files\/([a-z0-9-]+)/i)?.[1];
    if (!file) throw Error("Video model returned no video");
    return { mime: video!.mime_type || "video/mp4", data: "", url: file };
  },
};
