let audioCtx: AudioContext | null = null;

/** Navegadores só liberam som depois de um clique do usuário. */
export function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
  } catch {
    audioCtx = null;
  }
}

export function beep() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [880, 1175].forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx!.destination);
    gain.gain.setValueAtTime(0.2, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.16);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.17);
  });
}
