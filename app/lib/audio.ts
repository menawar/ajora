/**
 * Web Audio API synthesizer for UI micro-interactions.
 * Generates sounds mathematically to avoid network overhead of MP3s.
 */

let audioCtx: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export const playPop = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  
  // Quick frequency sweep (pop sound)
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

  // Volume envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.start(now);
  osc.stop(now + 0.1);
};

export const playClick = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  
  // High pitch, very short
  osc.frequency.setValueAtTime(1200, now);
  
  // Volume envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.005);
  gain.gain.linearRampToValueAtTime(0, now + 0.02);

  osc.start(now);
  osc.stop(now + 0.02);
};

export const playSuccess = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.5);

  // Play a major chord (C E G)
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + (i * 0.05));
    osc.connect(gain);
    osc.start(now + (i * 0.05));
    osc.stop(now + 0.5);
  });
};
