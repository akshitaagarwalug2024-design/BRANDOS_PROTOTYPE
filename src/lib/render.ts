import type { Project, Media } from "./model";
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
export async function renderVideo(
  project: Project,
  media: Media[],
  color: string,
  onProgress: (n: number) => void,
  signal: AbortSignal,
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
  canvas.width = dimensions[0];
  canvas.height = dimensions[1];
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(24);
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 2500000,
  });
  const total = project.scenes.reduce((n, s) => n + s.duration, 0);
  if (!total || total > 120)
    throw Error("Choose a timeline between 1 and 120 seconds.");
  let audio: AudioContext | undefined;
  let current: HTMLVideoElement | HTMLAudioElement | undefined;
  try {
    audio = new AudioContext();
    await audio.resume();
    const dest = audio.createMediaStreamDestination();
    const gain = audio.createGain();
    gain.gain.value = project.volume;
    gain.connect(dest);
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
    for (const scene of project.scenes) {
      if (signal.aborted) throw Error("Export canceled.");
      const m = media.find((m) => m.id === scene.mediaId);
      if (!m)
        throw Error(
          "A scene’s media is missing. Return to Upload and reselect the file.",
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
      const started = performance.now();
      await new Promise<void>((resolve, reject) => {
        const frame = () => {
          if (signal.aborted) {
            reject(Error("Export canceled."));
            return;
          }
          const delta = (performance.now() - started) / 1000;
          const w = canvas.width,
            h = canvas.height;
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, w, h);
          ctx.filter = `brightness(${project.brightness}%)`;
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
          ctx.filter = "none";
          if (project.transition === "Fade") {
            ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - delta * 3)})`;
            ctx.fillRect(0, 0, w, h);
          }
          if (project.subtitles) {
            const f = Math.round(w / 23);
            ctx.font = `600 ${f}px sans-serif`;
            const ls = lines(ctx, scene.text, w - 80);
            ctx.fillStyle = "rgba(0,0,0,.55)";
            ctx.fillRect(
              25,
              h - 100 - ls.length * f * 1.4,
              w - 50,
              ls.length * f * 1.4 + 30,
            );
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ls.forEach((s, i) =>
              ctx.fillText(s, w / 2, h - 80 - (ls.length - 1 - i) * f * 1.4),
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="${/^#[0-9a-f]{6}$/i.test(color) ? color : "#66744d"}"/><circle cx="900" cy="300" r="500" fill="#ffffff" opacity=".07"/><text x="90" y="180" fill="${contrastText(color)}" font-family="sans-serif" font-size="36" letter-spacing="8">A STORY BY YOU</text>${ls
    .slice(0, 7)
    .map(
      (s, i) =>
        `<text x="90" y="${800 + i * 110}" fill="${contrastText(color)}" font-family="Georgia" font-size="88">${escape(s)}</text>`,
    )
    .join(
      "",
    )}<text x="90" y="1770" fill="${contrastText(color)}" font-family="sans-serif" font-size="32">made with brandos.</text></svg>`;
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
