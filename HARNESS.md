# The BRANDOS agent harness

The harness is the code that sits between an AI model and the BRANDOS studio. The model decides *what* to do; the harness decides *what it is allowed to do*, runs it, checks it, and shows every step. It lives in `src/lib/agent/` and is used by the **AI Agent** page (`/studio/agent`).

> **Parked (16 Nov 2026):** the AI Agent page is removed from the studio navigation and routes while the model budget is decided. The code below is intact; re-add `"agent"` to the nav in `src/components/studio.tsx` and the route list in `src/app/studio/[[...view]]/page.tsx` to bring it back.
>
> **Current status:** both providers are demo stand-ins. The "model" is a scripted policy with no LLM behind it, and the "video model" returns labelled placeholder frames, not AI footage. Everything else — the loop, tool registry, validation, limits, verification gate, streaming trace and final render — is real and does not change when real providers are plugged in.

## What one run does

1. The browser sends a read-only snapshot of the workspace (journal, goal, brand kit, library file list, scheduled dates, optional brief) to `POST /api/agent`.
2. The harness asks the model for a **turn**: a short reason plus zero or more tool calls.
3. Each tool call is checked against that tool's schema and the run limits. Invalid calls are **rejected and never run**; the error goes back to the model so it can correct itself.
4. Valid calls run (calls in the same turn run in parallel) and their results are appended to the transcript the model sees next turn.
5. Steps 2–4 repeat until the model returns no tool calls or a limit is hit.
6. The run only counts as finished if the edit **passed verification and was rendered**. Otherwise the harness reports a failure instead of a result.
7. The finished project and any generated clips go back to the browser, which saves them and renders the actual video file.

Every step is streamed to the page as it happens (one JSON event per line), which is what the trace on the AI Agent page displays.

## The tools

The model can only change things through these 11 tools (`tools.ts`):

| Tool | What it does |
|---|---|
| `read_creator_context` | Reads journal, goal, niche and brand defaults |
| `review_performance` | Reads recent post performance and trending topics (sample data today) |
| `inspect_library` | Lists the creator's uploaded files |
| `choose_idea` | Commits to an idea, hook and reason |
| `write_storyboard` | Sets 2–6 scenes; each uses a library file or requests a generated clip |
| `generate_clip` | Calls the video provider for one scene |
| `set_style` | Music, colour grade, subtitle style/animation/position |
| `write_post_copy` | Caption, hashtags, call-to-action, cover title |
| `schedule_post` | Puts the post on the calendar |
| `verify_edit` | Runs the harness checks (below) |
| `render_video` | Hands the edit to the browser renderer |

## Guardrails

- **Schema validation** — types, allowed values, ranges, lengths and unknown arguments are checked before any tool runs.
- **Tool-level rules** — e.g. a library scene must reference a real file; a date cannot be in the past or already taken.
- **Run limits** (`harness.ts`) — 14 model steps, 30 tool calls, 6 generated clips.
- **Verification gate** — `verify_edit` checks: idea and storyboard exist, length is 5–60s, every scene has footage, style is set, caption + CTA + 3–8 hashtags exist, and the date is valid and free. Any later edit clears the pass, and `render_video` refuses to run without it.
- **Read-only input** — the agent never writes to the workspace directly. It builds a draft; the browser adds the result as a new project.

## Files

| File | Role |
|---|---|
| `src/lib/agent/types.ts` | `ModelProvider` and `VideoProvider` interfaces, event and draft types |
| `src/lib/agent/harness.ts` | The loop, limits, and conversion of the draft into a studio project |
| `src/lib/agent/tools.ts` | Tool registry, schema validator, verification checks |
| `src/lib/agent/demo.ts` | The two demo providers |
| `src/app/api/agent/route.ts` | `GET` describes the harness; `POST` streams a run |
| `src/components/agent.tsx` | The trace UI, clip storage and browser render |

## Plugging in real providers

Implement the two interfaces in `types.ts` and pass them to `runAgent` in `src/app/api/agent/route.ts` in place of `demoModel` and `demoVideo`.

- **`ModelProvider.next({ workspace, tools, transcript })`** returns `{ thought, calls }`. A real implementation sends the tool specs and transcript to an LLM with tool calling and maps its tool calls into `calls`.
- **`VideoProvider.generate({ prompt, seconds, ratio })`** returns `{ mime, data }`. The demo returns an SVG image as text. A real video model returns binary video, so `Clip.data` and the clip-saving code in `agent.tsx` (which currently stores every clip as an image) will need to carry a URL or base64 video instead.

Known gaps before production: API keys and per-user rate limiting on `/api/agent`, real analytics behind `review_performance`, and the agent cannot yet see inside footage (it only reads file names and tags).
