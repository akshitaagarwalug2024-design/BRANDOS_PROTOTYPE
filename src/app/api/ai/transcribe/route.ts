import { allow, geminiJson, geminiReady } from "@/lib/gemini";
// Turns a short voice recording into text.
export async function POST(req: Request) {
  if (!allow(req, 20))
    return Response.json({ error: "Too many requests." }, { status: 429 });
  if (!geminiReady()) return Response.json({ connect: true });
  try {
    const body = await req.text();
    if (body.length > 3_000_000) throw Error("Recording is too long");
    const { audio } = JSON.parse(body);
    if (typeof audio !== "string" || !audio) throw Error("No audio");
    const { text } = await geminiJson<{ text: string }>(
      [
        {
          text: "Transcribe this recording word for word. Return only what was said, with normal punctuation. If there is no speech, return an empty string.",
        },
        { inlineData: { mimeType: "audio/wav", data: audio } },
      ],
      {
        type: "OBJECT",
        properties: { text: { type: "STRING" } },
        required: ["text"],
      },
    );
    return Response.json({ text: text.trim() });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message.slice(0, 160) : "Failed" },
      { status: 400 },
    );
  }
}
