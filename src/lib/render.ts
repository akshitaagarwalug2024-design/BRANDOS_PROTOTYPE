import { gradeFilter, type Brand, type Project, type Media } from "./model";
import { startMusic } from "./music";
import { svgUrl } from "./shapes";
function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(" "),
    out: string[] = [];
  let line = "";
  for (const word of words) {
    if (ctx.measureText(`${line} ${word}`).width > width && line) {
      out.push(line);
      line = word;
    } else line += (line ? " " : "") + word;
  }
  if (line) out.push(line);
  return out.slice(0, 5);
}
const ease = (k: number) => 1 - (1 - k) ** 3;
export async function renderVideo(
  project: Project,
  media: Media[],
  color: string,
  onProgress: (n: number) => void,
  signal: AbortSignal,
  brand?: Brand,
): Promise<Blob> {
  if (!window.MediaRecorder)
    throw Error(
      "Video export requires a browser with MediaRecorder support. Export a project backup instead.",
    );
  const mime = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime)
    throw Error("This browser cannot encode WebM. Try Chrome or Firefox.");
  const canvas = document.createElement("canvas");
  const dimensions =
    project.ratio === "16:9"
      ? [960, 540]
      : project.ratio === "1:1"
        ? [720, 720]
        : [540, 960];
  // Drawn at 540 wide and scaled up, so the export is 1080 x 1920.
  const density = 2;
  canvas.width = dimensions[0] * density;
  canvas.height = dimensions[1] * density;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(density, density);
  // Holds the last frame of the previous scene so transitions can blend from it.
  const previous = document.createElement("canvas");
  previous.width = canvas.width;
  previous.height = canvas.height;
  const stream = canvas.captureStream(24);
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 8000000,
  });
  const total = project.scenes.reduce((n, s) => n + s.duration, 0);
  if (!total || total > 120)
    throw Error("Choose a timeline between 1 and 120 seconds.");
  const accent = /^#[0-9a-f]{6}$/i.test(project.accent)
    ? project.accent
    : color;
  const onAccent = contrastText(accent);
  // Brand typography: the kit's font choice drives every piece of on-screen text.
  const css = getComputedStyle(document.documentElement);
  const display =
    css.getPropertyValue("--font-display").trim() || "Arial Black, sans-serif";
  const family =
    brand?.font === "Serif"
      ? "Georgia, serif"
      : brand?.font === "Display"
        ? display
        : css.getPropertyValue("--font-body").trim() || "sans-serif";
  const titleFamily = brand?.font === "Serif" ? "Georgia, serif" : display;
  let logo: HTMLImageElement | undefined;
  if (brand?.logo) {
    logo = new Image();
    logo.src = brand.logo;
    await logo.decode().catch(() => (logo = undefined));
  }
  // Overlay items: load each once. GIF stickers are decoded to frames so they
  // animate in the export; other images and looping videos draw directly.
  const overlays = new Map<string, (t: number) => CanvasImageSource>();
  const overlayVideos: HTMLVideoElement[] = [];
  for (const item of project.items || []) {
    const file = media.find((m) => m.id === item.mediaId);
    const src = item.svg ? svgUrl(item.svg, item.color) : file?.url;
    if (!src) continue;
    try {
      if (file?.type === "video") {
        const v = document.createElement("video");
        v.src = src;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        await v.play();
        overlayVideos.push(v);
        overlays.set(item.id, () => v);
        continue;
      }
      const blob = item.svg ? undefined : await (await fetch(src)).blob();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Decoder = (window as any).ImageDecoder;
      if (blob?.type === "image/gif" && Decoder) {
        const decoder = new Decoder({
          data: await blob.arrayBuffer(),
          type: "image/gif",
        });
        await decoder.tracks.ready;
        const count = Math.min(decoder.tracks.selectedTrack.frameCount, 80);
        const frames: { picture: ImageBitmap; end: number }[] = [];
        let length = 0;
        for (let i = 0; i < count; i++) {
          const { image } = await decoder.decode({ frameIndex: i });
          length += (image.duration || 100000) / 1e6;
          frames.push({ picture: await createImageBitmap(image), end: length });
          image.close();
        }
        if (frames.length) {
          overlays.set(
            item.id,
            (t) =>
              (frames.find((f) => t % length < f.end) || frames[0]).picture,
          );
          continue;
        }
      }
      const img = new Image();
      img.src = src;
      await img.decode();
      overlays.set(item.id, () => img);
    } catch {
      // An item that cannot load is left out rather than failing the export.
    }
  }
  let audio: AudioContext | undefined;
  let current: HTMLVideoElement | HTMLAudioElement | undefined;
  let stopMusic = () => {};
  try {
    audio = new AudioContext();
    await audio.resume();
    const dest = audio.createMediaStreamDestination();
    const gain = audio.createGain();
    gain.gain.value = project.volume;
    // A compressor keeps clip sound and music at a steady level.
    const level = audio.createDynamicsCompressor();
    level.connect(dest);
    gain.connect(level);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    const done = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      recorder.onerror = () => reject(Error("Browser encoding failed."));
    });
    let elapsed = 0;
    recorder.start(500);
    const own =
      project.music === "My audio"
        ? media.find((m) => m.id === project.musicId)
        : undefined;
    if (own?.url) {
      // The creator's own soundtrack, looped under the whole video.
      const track = new Audio(own.url);
      track.loop = true;
      const trackGain = audio.createGain();
      trackGain.gain.value = project.musicVolume;
      audio.createMediaElementSource(track).connect(trackGain).connect(level);
      await track.play();
      stopMusic = () => track.pause();
    } else
      stopMusic = startMusic(audio, level, project.music, project.musicVolume);
    for (const [index, scene] of project.scenes.entries()) {
      if (signal.aborted) throw Error("Export canceled.");
      const m = media.find((m) => m.id === scene.mediaId);
      if (!m)
        throw Error(
          "A scene’s media is missing. Swap in another file from your library.",
        );
      let asset: HTMLImageElement | HTMLVideoElement | HTMLAudioElement;
      if (m.type === "image") {
        asset = new Image();
        asset.src = m.url;
        await new Promise<void>((resolve, reject) => {
          asset.onload = () => resolve();
          asset.onerror = () => reject(Error(`Could not load ${m.name}`));
        });
      } else {
        asset = document.createElement(m.type);
        current = asset;
        asset.src = m.url;
        asset.preload = "auto";
        await new Promise<void>((resolve, reject) => {
          asset.onloadedmetadata = () => resolve();
          asset.onerror = () => reject(Error(`Could not decode ${m.name}`));
        });
        asset.currentTime = Math.min(
          scene.trim,
          Math.max(0, asset.duration - 0.1),
        );
        asset.loop = true;
        audio.createMediaElementSource(asset).connect(gain);
        await asset.play();
      }
      const transition = scene.transition || project.transition;
      const motion = scene.motion || "None";
      const last = index === project.scenes.length - 1;
      const started = performance.now();
      await new Promise<void>((resolve, reject) => {
        const frame = () => {
          if (signal.aborted) {
            reject(Error("Export canceled."));
            return;
          }
          const delta = (performance.now() - started) / 1000;
          const part = Math.min(1, delta / scene.duration);
          const w = dimensions[0],
            h = dimensions[1];
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, w, h);
          if (index > 0) ctx.drawImage(previous, 0, 0, w, h);
          // Scene picture: transition in, slow motion effect, colour grade.
          const enter =
            transition === "Cut" ? 1 : ease(Math.min(1, delta / 0.45));
          ctx.save();
          if (transition === "Fade" || transition === "Zoom")
            ctx.globalAlpha = enter;
          if (transition === "Slide") ctx.translate(w * (1 - enter), 0);
          let zoom = transition === "Zoom" ? 1.25 - 0.25 * enter : 1,
            shift = 0;
          if (motion === "Zoom in") zoom *= 1 + 0.12 * part;
          if (motion === "Zoom out") zoom *= 1.12 - 0.12 * part;
          if (motion.startsWith("Pan")) {
            zoom *= 1.12;
            shift =
              w * 0.05 * (1 - 2 * part) * (motion === "Pan left" ? 1 : -1);
          }
          ctx.translate(w / 2 + shift, h / 2);
          ctx.scale(zoom, zoom);
          ctx.translate(-w / 2, -h / 2);
          ctx.fillStyle = accent;
          ctx.fillRect(0, 0, w, h);
          ctx.filter = gradeFilter(project.grade, project.brightness);
          if (
            asset instanceof HTMLImageElement ||
            asset instanceof HTMLVideoElement
          ) {
            const aw =
                asset instanceof HTMLImageElement
                  ? asset.naturalWidth
                  : asset.videoWidth,
              ah =
                asset instanceof HTMLImageElement
                  ? asset.naturalHeight
                  : asset.videoHeight;
            const scale = Math.max(w / aw, h / ah);
            ctx.drawImage(
              asset,
              (w - aw * scale) / 2,
              (h - ah * scale) / 2,
              aw * scale,
              ah * scale,
            );
          }
          ctx.restore();
          ctx.filter = "none";
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          // Soft scrims keep text readable on any footage.
          const shade = ctx.createLinearGradient(0, h * 0.55, 0, h);
          shade.addColorStop(0, "rgba(0,0,0,0)");
          shade.addColorStop(1, "rgba(0,0,0,.5)");
          ctx.fillStyle = shade;
          ctx.fillRect(0, h * 0.55, w, h * 0.45);
          const top = ctx.createLinearGradient(0, 0, 0, h * 0.2);
          top.addColorStop(0, "rgba(0,0,0,.35)");
          top.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = top;
          ctx.fillRect(0, 0, w, h * 0.2);
          for (const item of project.items || []) {
            const source = overlays.get(item.id);
            if (!source || (item.scene !== "all" && item.scene !== scene.id))
              continue;
            const clock = elapsed + delta;
            // Items on every scene animate in once; scene items on each entry.
            const k = ease(
              Math.min(1, (item.scene === "all" ? clock : delta) / 0.45),
            );
            const iw = item.w * w,
              ih = iw / item.aspect;
            ctx.save();
            if (item.anim !== "None" && item.anim !== "Pulse")
              ctx.globalAlpha = k;
            ctx.translate(
              item.x * w,
              item.y * h + (item.anim === "Slide up" ? 40 * (1 - k) : 0),
            );
            ctx.rotate((item.rot * Math.PI) / 180);
            const size =
              item.anim === "Pop"
                ? 0.6 + 0.4 * k
                : item.anim === "Pulse"
                  ? 1 + 0.06 * Math.sin(clock * 4)
                  : 1;
            ctx.scale(size, size);
            ctx.drawImage(source(clock), -iw / 2, -ih / 2, iw, ih);
            ctx.restore();
          }
          const ending =
            project.elements.cta &&
            last &&
            Boolean(project.cta) &&
            scene.duration - delta < 2.5;
          if (project.subtitles && scene.text && !ending) {
            const bold = project.textStyle === "Bold",
              minimal = project.textStyle === "Minimal";
            const f = Math.round(w / (bold ? 14 : minimal ? 26 : 19));
            ctx.font = `${bold ? 800 : 700} ${f}px ${family}`;
            ctx.textAlign = "left";
            const k = ease(Math.min(1, delta / 0.5));
            const all = (bold ? scene.text.toUpperCase() : scene.text).split(
              " ",
            );
            const count =
              project.textAnim === "Typewriter"
                ? Math.ceil(all.length * Math.min(1, delta / 1.2))
                : all.length;
            const space = ctx.measureText(" ").width;
            const rows: { word: string; i: number; width: number }[][] = [[]];
            let used = 0;
            all.forEach((word, i) => {
              const width = ctx.measureText(word).width;
              if (used + width > w - 110 && rows.at(-1)!.length) {
                rows.push([]);
                used = 0;
              }
              rows.at(-1)!.push({ word, i, width });
              used += width + space;
            });
            const step = Math.max(
              0.22,
              Math.min(0.5, (scene.duration * 0.8) / all.length),
            );
            const active =
              project.captionFx === "Highlight" && !minimal
                ? Math.min(all.length - 1, Math.floor(delta / step))
                : -1;
            const block = rows.length * f * 1.45;
            const y0 =
              project.textPosition === "Top"
                ? h * 0.16
                : project.textPosition === "Middle"
                  ? (h - block) / 2
                  : h - 110 - block;
            ctx.save();
            if (project.textAnim === "Fade up") {
              ctx.globalAlpha = k;
              ctx.translate(0, 24 * (1 - k));
            }
            if (project.textAnim === "Pop") {
              ctx.globalAlpha = k;
              ctx.translate(w / 2, y0 + block / 2);
              ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
              ctx.translate(-w / 2, -(y0 + block / 2));
            }
            if (!bold && !minimal) {
              ctx.fillStyle = "rgba(0,0,0,.6)";
              ctx.beginPath();
              ctx.roundRect(34, y0 - 16, w - 68, block + 26, 18);
              ctx.fill();
            }
            rows.forEach((row, r) => {
              const width =
                row.reduce((n, x) => n + x.width, 0) + space * (row.length - 1);
              let x = (w - width) / 2;
              const y = y0 + f + r * f * 1.45;
              for (const item of row) {
                if (item.i < count) {
                  if (item.i === active) {
                    ctx.fillStyle = accent;
                    ctx.beginPath();
                    ctx.roundRect(
                      x - 8,
                      y - f * 0.95,
                      item.width + 16,
                      f * 1.28,
                      8,
                    );
                    ctx.fill();
                  }
                  ctx.shadowColor =
                    item.i === active ? "transparent" : "rgba(0,0,0,.8)";
                  ctx.shadowBlur = bold || minimal ? 12 : 0;
                  ctx.fillStyle = item.i === active ? onAccent : "#fff";
                  ctx.fillText(item.word, x, y);
                }
                x += item.width + space;
              }
            });
            ctx.restore();
            ctx.textAlign = "center";
          }
          // Opening title: brand-coloured blocks that wipe in behind each line.
          if (project.elements.title && index === 0 && delta < 2.5) {
            const k = ease(Math.min(1, delta / 0.45));
            const f = Math.round(w / 12);
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, (2.5 - delta) / 0.3));
            ctx.font = `800 ${f}px ${titleFamily}`;
            const ls = lines(ctx, project.coverTitle || project.title, w - 130);
            ls.forEach((s, i) => {
              const width = ctx.measureText(s).width + 36;
              const y = h * 0.24 + i * f * 1.32;
              ctx.fillStyle = accent;
              ctx.fillRect((w - width) / 2, y - f * 0.95, width * k, f * 1.24);
              if (k > 0.5) {
                ctx.fillStyle = onAccent;
                ctx.fillText(s, w / 2, y);
              }
            });
            ctx.restore();
          }
          // End card: the brand colour slides up with the call-to-action and handle.
          if (ending) {
            const k = ease(
              Math.min(1, (delta - (scene.duration - 2.5)) / 0.45),
            );
            const ph = h * 0.42,
              py = h - ph * k;
            const f = Math.round(w / 15);
            ctx.save();
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.roundRect(0, py, w, ph + 40, 36);
            ctx.fill();
            if (logo) {
              const lh = 54,
                lw = (logo.naturalWidth / logo.naturalHeight) * lh;
              ctx.drawImage(logo, (w - lw) / 2, py + 26, lw, lh);
            }
            ctx.fillStyle = onAccent;
            ctx.font = `800 ${f}px ${titleFamily}`;
            const ls = lines(ctx, project.cta, w - 120).slice(0, 3);
            ls.forEach((s, i) =>
              ctx.fillText(s, w / 2, py + ph * 0.36 + i * f * 1.2),
            );
            ctx.font = `600 ${Math.round(w / 30)}px ${family}`;
            ctx.globalAlpha = 0.8;
            ctx.fillText(project.mark, w / 2, py + ph - 46);
            ctx.restore();
          }
          if (project.elements.watermark && (project.mark || logo)) {
            ctx.save();
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            let x = 26;
            if (logo) {
              const lh = 40,
                lw = (logo.naturalWidth / logo.naturalHeight) * lh;
              ctx.drawImage(logo, x, 30, lw, lh);
              x += lw + 12;
            }
            ctx.font = `700 ${Math.round(w / 40)}px ${family}`;
            ctx.shadowColor = "rgba(0,0,0,.6)";
            ctx.shadowBlur = 6;
            ctx.fillStyle = "#fff";
            ctx.fillText(project.mark, x, 50);
            ctx.restore();
          }
          if (project.elements.progress) {
            ctx.fillStyle = "rgba(255,255,255,.3)";
            ctx.fillRect(0, 0, w, 6);
            ctx.fillStyle = accent;
            ctx.fillRect(
              0,
              0,
              (w * (elapsed + Math.min(delta, scene.duration))) / total,
              6,
            );
          }
          onProgress(
            Math.min(
              99,
              Math.round(
                ((elapsed + Math.min(delta, scene.duration)) / total) * 100,
              ),
            ),
          );
          if (delta >= scene.duration) resolve();
          else requestAnimationFrame(frame);
        };
        frame();
      });
      previous.getContext("2d")!.drawImage(canvas, 0, 0);
      if (current) {
        current.pause();
        current.removeAttribute("src");
        current.load();
        current = undefined;
      }
      elapsed += scene.duration;
    }
    recorder.stop();
    const blob = await done;
    onProgress(100);
    return blob;
  } finally {
    stopMusic();
    overlayVideos.forEach((v) => v.pause());
    if (recorder.state !== "inactive") recorder.stop();
    current?.pause();
    stream.getTracks().forEach((t) => t.stop());
    await audio?.close();
  }
}
export function coverSvg(title: string, color: string) {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[c]!,
    );
  const words = title.split(" ");
  const ls = [];
  let l = "";
  for (const w of words) {
    if (l.length + w.length > 19) {
      ls.push(l);
      l = w;
    } else l += (l ? " " : "") + w;
  }
  ls.push(l);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="${/^#[0-9a-f]{6}$/i.test(color) ? color : "#66744d"}"/><circle cx="900" cy="300" r="500" fill="#ffffff" opacity=".07"/><text x="90" y="180" fill="${contrastText(color)}" font-family="sans-serif" font-size="36" letter-spacing="8">NEW POST</text>${ls
    .slice(0, 7)
    .map(
      (s, i) =>
        `<text x="90" y="${800 + i * 110}" fill="${contrastText(color)}" font-family="Georgia" font-size="88">${escape(s)}</text>`,
    )
    .join(
      "",
    )}<text x="90" y="1770" fill="${contrastText(color)}" font-family="sans-serif" font-size="32">Made with UnStuck</text></svg>`;
}

export function contrastText(color: string) {
  const rgb = /^#[0-9a-f]{6}$/i.test(color)
    ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    : [0.4, 0.45, 0.3];
  const linear = rgb.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  const luminance =
    linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance > 0.18 ? "#000000" : "#ffffff";
}
