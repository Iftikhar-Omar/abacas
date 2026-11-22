// File: sfx.js
// Directory: src/
// Tiny sound effects made with the Web Audio API (no audio files): a soft bead "tok", a happy chime,
// a gentle "oops" and a little fanfare. Sound feedback helps young learners feel what they did.
// Off switch: Settings > Sound effects (stored in prefs.sfx).

let ctx = null;
let enabled = true;

export const setSfxEnabled = (on) => {
  enabled = !!on;
};

function audio() {
  if (!enabled) return null;
  try {
    ctx ||= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, start, dur, { type = "sine", gain = 0.12, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

export const sfx = {
  /** bead click */
  tap: () => tone(520, 0, 0.07, { type: "triangle", gain: 0.1, slide: -220 }),
  /** correct */
  ok: () => {
    tone(660, 0, 0.12);
    tone(880, 0.09, 0.18);
  },
  /** not yet (soft, never harsh) */
  no: () => tone(300, 0, 0.18, { type: "sine", gain: 0.08, slide: -60 }),
  /** lesson complete */
  done: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.22)),
};
