import { limits, runAgent } from "@/lib/agent/harness";
import { tools } from "@/lib/agent/tools";
import { demoModel, demoVideo } from "@/lib/agent/demo";
import { omniPricePerSecond, omniVideo } from "@/lib/agent/omni";
import type { Workspace } from "@/lib/agent/types";
// Paid generation can take a couple of minutes for three clips.
export const maxDuration = 300;
const paidReady = () =>
  Boolean(process.env.GEMINI_API_KEY && process.env.AGENT_PASSCODE);
const paidClips = 3;
// Describes the harness so the UI can show it before a run.
export function GET() {
  return Response.json({
    model: demoModel.label,
    video: demoVideo.label,
    limits,
    paid: {
      available: paidReady(),
      label: omniVideo.label,
      maxClips: paidClips,
      usdPerSecond: omniPricePerSecond,
    },
    tools: tools.map(({ run: _run, ...spec }) => spec),
  });
}
// Streams one JSON event per line as the agent works.
export async function POST(req: Request) {
  let w: Workspace & { paid?: boolean; passcode?: string };
  try {
    const text = await req.text();
    if (text.length > 60000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    w = JSON.parse(text);
    if (
      typeof w.brief !== "string" ||
      w.brief.length > 200 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(w.today) ||
      !w.brand ||
      !w.profile ||
      !w.goal ||
      !Array.isArray(w.media) ||
      !Array.isArray(w.journal) ||
      !Array.isArray(w.scheduled)
    )
      throw Error();
  } catch {
    return Response.json(
      { error: "Send a workspace snapshot and a brief under 200 characters." },
      { status: 400 },
    );
  }
  const encoder = new TextEncoder();
  const paid = w.paid === true;
  if (paid && (!paidReady() || w.passcode !== process.env.AGENT_PASSCODE))
    return Response.json(
      { error: "Wrong passcode for paid video generation." },
      { status: 403 },
    );
  delete w.passcode;
  w.paidVideo = paid;
  const events = paid
    ? runAgent(w, demoModel, omniVideo, paidClips)
    : runAgent(w, demoModel, demoVideo);
  return new Response(
    new ReadableStream({
      async pull(controller) {
        try {
          const { value, done } = await events.next();
          if (done) controller.close();
          else controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
        } catch (e) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: e instanceof Error ? e.message : "Agent run failed",
              }) + "\n",
            ),
          );
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
