// Fetches a chosen stock file from its provider so the browser gets it from our
// own origin (needed for the video export) and can keep a local copy.
const allowed =
  /^https:\/\/(images\.pexels\.com|videos\.pexels\.com|pixabay\.com|cdn\.pixabay\.com|media\d*\.giphy\.com|i\.giphy\.com)\//;
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("u") || "";
  if (!allowed.test(url))
    return Response.json({ error: "Source not allowed" }, { status: 400 });
  const upstream = await fetch(url);
  const type = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !upstream.body || !/^(image|video)\//.test(type))
    return Response.json({ error: "File is not available" }, { status: 502 });
  return new Response(upstream.body, {
    headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" },
  });
}
