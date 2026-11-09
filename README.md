# BRANDOS

A responsive content creation prototype built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style Radix/CVA Button, and Lucide icons. The complete guided journey runs without an account or external API keys.

## Run

Requires Node.js 22.13+ (tested with 24.22.1) and npm 11.

```sh
npm ci
npm run dev
```

Open the application on port 3000. Enter the studio, complete or skip the short introduction, and create a new post. Select your own files or the original sample collection; choose a story direction, edit scenes, request demo revisions, and export a post package. Projects remain available after reloading.

```sh
npm run typecheck
npm run build
npm start
npm test
```

Playwright uses `/usr/bin/chromium` if present. Otherwise install the browser with `npx playwright install chromium` and set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if needed. Tests start their own production server on port 3001; run `npm run build` first.

## What works

- Landing page, optional sign-in, onboarding, collapsible navigation, dashboard, project search and status filtering.
- Five-step idea → media → planning → editor → post package journey.
- Actual local image/video/audio imports, preview, file validation, collections, rename, tags, search, and file removal. Files remain on this device in IndexedDB, not a pretend cloud upload. SVG uploads are disallowed; shipped SVG illustrations are trusted local samples.
- Editable scenes, timing, source start, order, deletion with confirmation, text overlays, source volume, brightness, aspect ratio, fade/cut, and revision snapshots.
- Server API with explicitly labeled deterministic demo planning and rule-based revisions. Requests never claim footage analysis or real AI generation.
- Actual browser canvas/MediaRecorder WebM exports with source audio, scene text, timing, aspect ratio, brightness and fade/cut. Progress, cancellation and errors are shown. Render in a visible tab in real time; total timeline limit 120 seconds. Outputs may need conversion to MP4 for social platforms. Uploaded codec support depends on the browser. Short sources loop. There is no server renderer or background worker.
- Editable captions, hashtags, title, CTA, separate SVG cover export, JSON post package and full workspace metadata backup/restore.
- Publishing status management and dated reminder list. Published status requires manual confirmation. Dates do not schedule posts.
- Brand settings persist; color is used in covers/audio backgrounds. Logo and font are currently preview-only; tone and caption-style preferences are not a trained brand model.

## Demo and production boundaries

Demo data uses localStorage for workspace metadata and IndexedDB for file blobs. Browser storage is not a cloud backup; clearing it deletes local work. Browser quotas and private mode may limit persistence. JSON backups contain metadata, not media bytes: keep original source files. This prototype is intended for a trusted personal device, not shared-user or regulated storage. No fake testimonials, usage stats, generated media or publishing success are shown.

AI directions are templates and revisions are simple rules: shorten/faster, remove the second scene, improve opening text, and hide captions for “minimal captions.” Other requests become literal opening text with an explicit explanation. The demo does not summarize, transcribe, or semantically inspect footage. `PlanningProvider` in `src/lib/providers.ts` is the server-only integration boundary for a real model. The API validates request size and inputs; add authentication, rate limits, abuse controls and request schemas before connecting a paid AI provider.

### Optional Supabase account and metadata backup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Copy `.env.example` to `.env.local`; set the public project URL and publishable/anon key. Never put a service-role key in `NEXT_PUBLIC_*`.
3. In Supabase Auth configure your application origin as Site URL and allow `/studio` as a redirect destination. Enable email/password with email confirmation as appropriate. Restart Next.js after changing environment variables.
4. Sign up through `/auth`, confirm your email, and sign in. Settings provides explicit metadata backup and restore actions protected by Supabase row-level security. Backup excludes local uploaded files; referenced scenes need their original source files on the same device.
5. The schema includes a private media bucket with owner-folder policies for a future cloud storage adapter. The current UI does not send media to Supabase and does not claim it does.

Without Supabase configuration sign-in is visibly unavailable and the entire local Demo Mode remains accessible. Cloud operations require a configured reachable Supabase host. Cloud auth, SQL policies, and backup must be validated against your actual instance before production use.

### Future asynchronous rendering

`RenderJob` defines queued/processing/completed/failed states. The current implementation is a cancellable foreground browser render, not a durable queue. A production worker should authenticate ownership, accept immutable scene manifests, enqueue jobs in a database, issue signed input URLs, process with FFmpeg in a separate worker, persist progress and errors, and return a signed output URL. Add retries, quotas, cleanup, and codec/license checks there. Do not expose credentials or run long video processing inside a request handler.

Social OAuth, direct publishing, scheduling, background music mixing, automatic speech captions, LLM analysis and durable server rendering are not connected. There are no subscription charges.

## Structure

- `src/app`: landing, auth, studio routes and AI API
- `src/components`: workspace, guided editor, media management, shared UI
- `src/lib`: typed model, browser persistence, renderer, demo provider, Supabase client
- `public/media`: original SVG illustrations and an actual MP4 sample generated from the coffee illustration (no third-party stock licensing needed)
- `supabase/schema.sql`: database and private-bucket owner policies
- `tests`: browser tests for critical journeys and honest integration states

## Development notes

Use the existing checkout; a cloud task already provides isolation, so no worktree is necessary. Nothing in this app automatically publishes the environment, pushes Git changes, or posts content to a social platform.
