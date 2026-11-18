import type { Media } from "./model";
// Prepares a clip for analysis in the browser: a few small frames and, when
// there is sound, a low-rate mono WAV. The original file never leaves the device.
const b64 = (bytes: Uint8Array) => {
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(out);
};
function shot(source: CanvasImageSource, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = Math.max(1, Math.round((256 * h) / (w || 1)));
  c.getContext("2d")!.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.6).split(",")[1];
}
async function frames(m: Media) {
  if (m.type === "image") {
    const img = new Image();
    img.src = m.url;
    await img.decode();
    return {
      frames: [shot(img, img.naturalWidth, img.naturalHeight)],
      duration: 0,
    };
  }
  const v = document.createElement("video");
  v.muted = true;
  v.preload = "auto";
  v.src = m.url;
  await new Promise<void>((resolve, reject) => {
    v.onloadeddata = () => resolve();
    v.onerror = () => reject(Error("unreadable"));
    setTimeout(() => reject(Error("timeout")), 6000);
  });
  const duration = Number.isFinite(v.duration) ? v.duration : 0;
  const out: string[] = [];
  for (const at of duration ? [0.15, 0.5, 0.85] : [0]) {
    v.currentTime = duration * at;
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      setTimeout(resolve, 1500);
    });
    out.push(shot(v, v.videoWidth, v.videoHeight));
  }
  return { frames: out, duration: Math.round(duration) };
}
async function audio(m: Media, seconds: number) {
  const data = await (await fetch(m.url)).arrayBuffer();
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(data);
    const rate = 8000,
      length = Math.floor(Math.min(decoded.duration, seconds) * rate);
    if (length < rate) return;
    const offline = new OfflineAudioContext(1, length, rate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start();
    const pcm = (await offline.startRendering()).getChannelData(0);
    const wav = new DataView(new ArrayBuffer(44 + pcm.length * 2));
    const tag = (at: number, s: string) =>
      [...s].forEach((ch, i) => wav.setUint8(at + i, ch.charCodeAt(0)));
    tag(0, "RIFF");
    wav.setUint32(4, 36 + pcm.length * 2, true);
    tag(8, "WAVEfmt ");
    wav.setUint32(16, 16, true);
    wav.setUint16(20, 1, true);
    wav.setUint16(22, 1, true);
    wav.setUint32(24, rate, true);
    wav.setUint32(28, rate * 2, true);
    wav.setUint16(32, 2, true);
    wav.setUint16(34, 16, true);
    tag(36, "data");
    wav.setUint32(40, pcm.length * 2, true);
    pcm.forEach((x, i) =>
      wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 32767, true),
    );
    return b64(new Uint8Array(wav.buffer));
  } finally {
    void ctx.close();
  }
}
export async function sampleClips(clips: Media[]) {
  // About 90 seconds of speech in total keeps the request small.
  let budget = 90;
  const out = [];
  for (const m of clips.slice(0, 8)) {
    const base = {
      id: m.id,
      name: m.name,
      note: m.note || "",
      duration: m.meta?.duration || 0,
      frames: [] as string[],
      audio: undefined as string | undefined,
    };
    try {
      const f = await frames(m);
      base.frames = f.frames;
      base.duration = f.duration || base.duration;
      if (m.type === "video" && budget > 5) {
        const take = Math.min(45, budget);
        base.audio = await audio(m, take).catch(() => undefined);
        if (base.audio) budget -= Math.min(take, base.duration || take);
      }
    } catch {
      // A clip that cannot be sampled is still sent by name and note.
    }
    out.push(base);
  }
  return out;
}
