import { planningProvider, reviseDemo } from "@/lib/providers";
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 20000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const body = JSON.parse(text);
    if (body.action === "revise") {
      if (
        !Array.isArray(body.scenes) ||
        body.scenes.length > 30 ||
        typeof body.request !== "string" ||
        !body.request.trim() ||
        body.request.length > 500
      )
        return Response.json(
          { error: "Provide scenes and a revision under 500 characters." },
          { status: 400 },
        );
      for (const s of body.scenes)
        if (
          typeof s.duration !== "number" ||
          s.duration < 1 ||
          s.duration > 120 ||
          typeof s.text !== "string"
        )
          return Response.json(
            { error: "Invalid scene data" },
            { status: 400 },
          );
      return Response.json({
        mode: "demo",
        ...reviseDemo(body.scenes, body.request),
      });
    }
    if (
      typeof body.idea !== "string" ||
      !body.idea.trim() ||
      body.idea.length > 300
    )
      return Response.json(
        { error: "Enter an idea between 1 and 300 characters." },
        { status: 400 },
      );
    return Response.json(
      await planningProvider.plan({
        idea: body.idea,
        audience: body.audience || "",
        tone: body.tone || "",
      }),
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to process request" },
      { status: 400 },
    );
  }
}
