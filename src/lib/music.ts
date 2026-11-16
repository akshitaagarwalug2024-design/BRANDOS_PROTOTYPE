// Built-in backing tracks, synthesised in the browser so they can be previewed and
// rendered into the export without any licensed audio files.
const tracks: Record<
  string,
  { bpm: number; wave: OscillatorType; chords: number[][]; decay: number }
> = {
  Calm: {
    bpm: 60,
    wave: "sine",
    decay: 0.9,
    chords: [
      [60, 64, 67, 71],
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [55, 59, 62, 65],
    ],
  },
  Upbeat: {
    bpm: 120,
    wave: "triangle",
    decay: 0.28,
    chords: [
      [60, 64, 67, 72],
      [55, 59, 62, 67],
      [57, 60, 64, 69],
      [53, 57, 60, 65],
    ],
  },
  Dreamy: {
    bpm: 60,
    wave: "sine",
    decay: 1.6,
    chords: [
      [62, 66, 69, 73],
      [59, 62, 66, 69],
      [55, 59, 62, 66],
      [57, 61, 64, 67],
    ],
  },
};
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export function startMusic(
  ctx: AudioContext,
  out: AudioNode,
  name: string,
  volume: number,
) {
  const track = tracks[name];
  if (!track || volume <= 0) return () => {};
  const master = ctx.createGain();
  master.gain.value = volume * 0.3;
  master.connect(out);
  const beat = 60 / track.bpm / 2;
  let step = 0,
    next = ctx.currentTime + 0.05;
  const note = (freq: number, at: number, length: number, level: number) => {
    const osc = ctx.createOscillator(),
      env = ctx.createGain();
    osc.type = track.wave;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(env).connect(master);
    osc.start(at);
    osc.stop(at + length + 0.05);
  };
  const schedule = () => {
    while (next < ctx.currentTime + 0.4) {
      const chord = track.chords[Math.floor(step / 8) % track.chords.length];
      note(hz(chord[step % chord.length]), next, track.decay, 0.5);
      if (step % 8 === 0) note(hz(chord[0] - 12), next, beat * 7, 0.6);
      next += beat;
      step++;
    }
  };
  schedule();
  const id = setInterval(schedule, 120);
  return () => {
    clearInterval(id);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    setTimeout(() => master.disconnect(), 400);
  };
}
