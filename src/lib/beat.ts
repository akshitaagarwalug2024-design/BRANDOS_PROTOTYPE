// Estimates the tempo of an audio file in the browser so cuts can land on the
// beat. It measures how the loudness repeats; it is an estimate, not exact.
export async function detectBpm(url: string): Promise<number> {
  const ctx = new AudioContext();
  try {
    const audio = await ctx.decodeAudioData(
      await (await fetch(url)).arrayBuffer(),
    );
    const data = audio.getChannelData(0);
    // Loudness 100 times a second, over the first 40 seconds.
    const hop = Math.floor(audio.sampleRate / 100);
    const frames = Math.min(Math.floor(data.length / hop), 4000);
    const energy = new Float32Array(frames);
    for (let i = 0; i < frames; i++) {
      let sum = 0;
      for (let j = 0; j < hop; j += 4) sum += Math.abs(data[i * hop + j]);
      energy[i] = sum;
    }
    // Keep only rises in loudness, which is where beats are.
    const onset = new Float32Array(frames);
    for (let i = 1; i < frames; i++)
      onset[i] = Math.max(0, energy[i] - energy[i - 1]);
    let best = 0,
      bestLag = 50;
    // 70 to 170 beats a minute.
    for (let lag = 35; lag <= 86; lag++) {
      let score = 0;
      for (let i = 0; i + lag < frames; i++) score += onset[i] * onset[i + lag];
      if (score > best) {
        best = score;
        bestLag = lag;
      }
    }
    return best ? Math.round(6000 / bestLag) : 0;
  } catch {
    return 0;
  } finally {
    void ctx.close();
  }
}
