import type { Media } from "./model";
// The footage index. Every file gets measurable properties (shape, length,
// colour, light, time of day) worked out in the browser, and ideas are matched
// to footage using those plus names, tags, collections and journal notes.
// It reads pixels, not meaning: no vision model is connected.
const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
function sample(source: CanvasImageSource, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(source, 0, 0, 16, 16);
  const d = ctx.getImageData(0, 0, 16, 16).data;
  let r = 0,
    g = 0,
    b = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
  }
  const n = d.length / 4;
  return { w, h, color: `#${hex(r / n)}${hex(g / n)}${hex(b / n)}` };
}
export async function analyze(
  file: Blob,
  type: Media["type"],
  taken = Date.now(),
): Promise<Pick<Media, "meta" | "auto" | "created">> {
  const created = new Date(taken).toISOString();
  const url = URL.createObjectURL(file);
  try {
    let meta: NonNullable<Media["meta"]>;
    if (type === "image") {
      const img = new Image();
      img.src = url;
      await img.decode();
      meta = {
        ...sample(img, img.naturalWidth, img.naturalHeight),
        duration: 0,
      };
    } else {
      const el = document.createElement(type === "video" ? "video" : "audio");
      el.muted = true;
      el.preload = "auto";
      el.src = url;
      await new Promise<void>((resolve, reject) => {
        el.onloadeddata = () => resolve();
        el.onerror = () => reject(Error("unreadable"));
        setTimeout(() => reject(Error("timeout")), 4000);
      });
      const duration = Number.isFinite(el.duration)
        ? Math.round(el.duration)
        : 0;
      meta =
        el instanceof HTMLVideoElement
          ? { ...sample(el, el.videoWidth, el.videoHeight), duration }
          : { w: 0, h: 0, color: "", duration };
    }
    const [r, g, b] = meta.color
      ? [1, 3, 5].map((i) => parseInt(meta.color.slice(i, i + 2), 16))
      : [0, 0, 0];
    const light = (r * 299 + g * 587 + b * 114) / 1000;
    const hour = new Date(taken).getHours();
    const auto = [
      type,
      meta.w
        ? meta.h > meta.w * 1.1
          ? "vertical"
          : meta.w > meta.h * 1.1
            ? "wide"
            : "square"
        : "",
      meta.color ? (light > 150 ? "bright" : light < 85 ? "dark" : "") : "",
      meta.color ? (r > b + 18 ? "warm" : b > r + 18 ? "cool" : "") : "",
      meta.duration
        ? meta.duration <= 8
          ? "short"
          : meta.duration > 45
            ? "long"
            : ""
        : "",
      hour < 11
        ? "morning"
        : hour < 17
          ? "daytime"
          : hour < 21
            ? "evening"
            : "night",
    ]
      .filter(Boolean)
      .join(", ");
    return { meta, auto, created };
  } catch {
    return { created, auto: type };
  } finally {
    URL.revokeObjectURL(url);
  }
}
const stop = new Set(
  "the and for with about from that this what your you are was have has things thing story behind learned life day nobody tells before after beginner mistakes".split(
    " ",
  ),
);
export const words = (s: string) =>
  (s.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !stop.has(w));
export type Match = { media: Media; score: number; why: string };
// Ranks the creator's own footage for an idea. Higher is a better fit.
export function matchFootage(
  idea: string,
  media: Media[],
  ratio = "9:16",
): Match[] {
  const want = [...new Set(words(idea))];
  return media
    .filter((m) => !m.sample && !m.stock && m.url && m.type !== "audio")
    .map((m) => {
      const have = new Set(
        words(
          `${m.name} ${m.tags} ${m.collection} ${m.note || ""} ${m.auto || ""}`,
        ),
      );
      const hits = want.filter((w) =>
        [...have].some(
          (h) =>
            h === w || (w.length > 4 && (h.startsWith(w) || w.startsWith(h))),
        ),
      );
      const shape =
        m.meta?.w && ratio === "9:16"
          ? m.meta.h > m.meta.w
          : m.meta?.w && ratio === "16:9"
            ? m.meta.w > m.meta.h
            : false;
      const days = m.created
        ? (Date.now() - Date.parse(m.created)) / 864e5
        : 30;
      const score =
        hits.length * 10 +
        (shape ? 2 : 0) +
        (m.type === "video" ? 2 : 0) +
        (days < 7 ? 2 : days < 30 ? 1 : 0);
      return {
        media: m,
        score,
        why: hits.length
          ? `matches “${hits.join("”, “")}”`
          : days < 7
            ? "captured this week"
            : "recent footage",
      };
    })
    .sort((a, b) => b.score - a.score);
}
// Footage that actually mentions the idea, falling back to the freshest files.
export function pickFootage(
  idea: string,
  media: Media[],
  ratio = "9:16",
  n = 4,
) {
  const ranked = matchFootage(idea, media, ratio);
  const strong = ranked.filter((m) => m.score >= 10);
  return (strong.length >= 2 ? strong : ranked).slice(0, n);
}
