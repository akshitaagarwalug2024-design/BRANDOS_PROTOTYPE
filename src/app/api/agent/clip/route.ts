// Streams a generated clip to the browser so the API key never leaves the server.
export async function GET(req: Request) {
  const file = new URL(req.url).searchParams.get("file") || "";
  if (
    !process.env.AGENT_PASSCODE ||
    req.headers.get("x-agent-passcode") !== process.env.AGENT_PASSCODE
  )
    return Response.json({ error: "Wrong passcode" }, { status: 403 });
  if (!/^[a-z0-9-]{6,60}$/i.test(file))
    return Response.json({ error: "Unknown clip" }, { status: 400 });
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/files/${file}:download?alt=media`,
    { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY! } },
  );
  if (!upstream.ok || !upstream.body)
    return Response.json({ error: "Clip is not available" }, { status: 502 });
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "video/mp4",
      "Cache-Control": "no-store",
    },
  });
}
