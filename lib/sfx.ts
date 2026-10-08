// Tiny WebAudio sound effects (no audio files needed). Muted state is stored in localStorage.
let ctx: AudioContext | null = null;

export const isMuted = () => {
  try { return localStorage.getItem("cg:muted") === "1"; } catch { return false; }
};
export const setMuted = (m: boolean) => {
  try { localStorage.setItem("cg:muted", m ? "1" : "0"); } catch {}
};

function tone(freq: number, start: number, dur: number, type: OscillatorType = "square", vol = 0.05) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur);
}

export type Sfx = "click" | "correct" | "wrong" | "award" | "whoosh" | "boot";

export function play(name: Sfx) {
  if (typeof window === "undefined" || isMuted()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    switch (name) {
      case "click": tone(520, 0, 0.06); break;
      case "boot": [330, 440, 660].forEach((f, i) => tone(f, i * 0.09, 0.12)); break;
      case "correct": [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.18, "triangle", 0.08)); break;
      case "wrong": tone(180, 0, 0.18, "sawtooth", 0.06); tone(130, 0.12, 0.25, "sawtooth", 0.06); break;
      case "award": [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, "triangle", 0.08)); break;
      case "whoosh": tone(300, 0, 0.12, "sine", 0.04); tone(600, 0.05, 0.15, "sine", 0.03); break;
    }
  } catch {}
}
