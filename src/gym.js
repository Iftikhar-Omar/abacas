import { Q, rootApproximation } from './engine.js';
import { config } from './config.js';

export function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
export var presets = {
  gentle: {
    digits: 1,
    terms: 3,
    pace: 2200,
    duration: 0,
    type: "mixed",
    support: "visible",
    presentation: "visual"
  },
  building: {
    digits: 2,
    terms: 5,
    pace: 1400,
    duration: 120,
    type: "mixed",
    support: "hidden",
    presentation: "visual"
  },
  challenge: {
    digits: 3,
    terms: 10,
    pace: 750,
    duration: 180,
    type: "sequence",
    support: "hidden",
    presentation: "visual"
  },
  expert: {
    digits: 10,
    terms: 10,
    pace: 2e3,
    duration: 420,
    type: "sequence",
    support: "hidden",
    presentation: "visual"
  }
};
export function validateConfig(c) {
  const r = {
    ...c,
    digits: Number(c.digits),
    terms: Number(c.terms),
    pace: Number(c.pace),
    duration: Number(c.duration)
  };
  if (!Number.isInteger(r.digits) || r.digits < 1 || r.digits > 10 || !Number.isInteger(r.terms) || r.terms < 2 || r.terms > 100 || r.pace < 100 || r.pace > 1e4 || r.duration < 0 || r.duration > 1800 || ![
    "sequence",
    "mixed",
    "multiply",
    "divide",
    "roots",
    "estimates",
    "squares",
    "percent",
    "calendar"
  ].includes(r.type) || !["audio", "visual"].includes(r.presentation) || !["visible", "blur", "hidden"].includes(r.support))
    throw Error("Invalid settings");
  if (r.modelSource === "hands" && (r.digits > 2 || !["mixed", "sequence"].includes(r.type) || r.type === "sequence" && r.terms > 40))
    throw Error("Finger practice needs 1\u20132 digits and addition/subtraction");
  return r;
}
export function makeChallenge(config2, rng = Math.random) {
  const c = validateConfig(config2), min = c.digits === 1 ? 1 : 10 ** (c.digits - 1), max = 10 ** c.digits - 1;
  const num = () => BigInt(randomInt(min, max, rng));
  let tokens = [], expression = "", expected = "", extra = {};
  if (c.modelSource === "hands") {
    let total = BigInt(
      randomInt(1, c.type === "sequence" ? Math.max(1, 99 - c.terms) : 60, rng)
    );
    tokens = [total.toString()];
    for (let i = 1; i < c.terms; i++) {
      const sub = c.type === "mixed" && (total >= 99n || total > 0n && rng() < 0.5);
      const limit = Number(sub ? total : 99n - total);
      const remain = c.type === "sequence" ? c.terms - 1 - i : 0;
      const upper = Math.min(max, Math.max(1, limit - remain));
      const v = BigInt(randomInt(1, upper, rng));
      total += sub ? -v : v;
      tokens.push(`${sub ? "\u2212" : "+"} ${v}`);
    }
    expected = total.toString();
    expression = tokens.join(" ");
  } else if (["sequence", "mixed"].includes(c.type)) {
    let total = num();
    tokens = [total.toString()];
    for (let i = 1; i < c.terms; i++) {
      let v = num();
      if (c.type === "mixed" && rng() < 0.45 && v <= total) {
        total -= v;
        tokens.push(`\u2212 ${v}`);
      } else {
        total += v;
        tokens.push(`+ ${v}`);
      }
    }
    expected = total.toString();
    expression = tokens.join(" ");
  } else if (c.type === "multiply") {
    let a = num(), b = num();
    expression = `${a} * ${b}`;
    expected = (a * b).toString();
    tokens = [`${a} \xD7 ${b}`];
  } else if (c.type === "divide") {
    const b = BigInt(randomInt(2, Math.min(max, 9999), rng)), q = num();
    expression = `${b * q} / ${b}`;
    expected = q.toString();
    tokens = [`${b * q} \xF7 ${b}`];
  } else if (c.type === "roots") {
    const n = BigInt(randomInt(2, Math.min(max, 999999), rng));
    expression = `sqrt(${n * n})`;
    expected = n.toString();
    tokens = [`\u221A${n * n}`];
  } else if (c.type === "estimates") {
    const n = BigInt(randomInt(1e5, 999999, rng));
    expression = `sqrt(${n})`;
    expected = rootApproximation(n).result;
    tokens = [`\u221A${n} \u2248 ? (3 d.p.)`];
    extra = { approximate: true };
  } else if (c.type === "squares") {
    const a = num();
    expression = `${a} ^ 2`;
    expected = (a * a).toString();
    tokens = [`${a}\xB2`];
  } else if (c.type === "percent") {
    const a = num(), p = [5, 10, 12.5, 20, 25, 50, 75][randomInt(0, 6, rng)];
    expression = `${p}% * ${a}`;
    expected = Q.from(p).mul(new Q(a)).div(new Q(100)).toString();
    tokens = [`${p}% \xD7 ${a}`];
  } else {
    const year = randomInt(1600, 2100, rng), month = randomInt(1, 12, rng), day = randomInt(1, new Date(Date.UTC(year, month, 0)).getUTCDate(), rng);
    const date = new Date(Date.UTC(year, month - 1, day));
    expected = String(date.getUTCDay());
    expression = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    tokens = [expression];
    const y = year - (month < 3 ? 1 : 0), offset = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4][month - 1];
    extra = {
      calendar: true,
      year,
      month,
      day,
      explanation: `(${y} + \u230A${y}/4\u230B \u2212 \u230A${y}/100\u230B + \u230A${y}/400\u230B + ${offset} + ${day}) mod 7 = ${expected}`
    };
  }
  return { id: crypto.randomUUID(), tokens, expression, expected, ...extra };
}
export function suggestNext(attempts, config2) {
  const recent = attempts.filter(
    (a) => a.mode === "gym" && a.config?.type === config2.type && a.config?.digits === config2.digits && a.config?.terms === config2.terms && a.config?.pace === config2.pace && a.config?.presentation === config2.presentation && a.config?.support === config2.support && (a.config?.modelSource || "abacus") === (config2.modelSource || "abacus")
  ).slice(-10);
  if (recent.length < 10) return null;
  const accuracy = recent.filter((a) => a.correct).length / recent.length;
  if (accuracy >= 0.9)
    return { ...config2, pace: Math.max(100, Math.round(config2.pace * 0.9)) };
  if (accuracy < 0.7)
    return { ...config2, pace: Math.min(1e4, Math.round(config2.pace * 1.2)) };
  return null;
}
export var Playback = class {
  constructor() {
    this.generation = 0;
    this.timeout = null;
  }
  cancel() {
    this.generation++;
    clearTimeout(this.timeout);
    globalThis.speechSynthesis?.cancel();
  }
  async run(tokens, { pace = 1500, onToken, onDone, voice = false, lang: lang2 = "en-US" }) {
    this.cancel();
    const gen = this.generation;
    const wait = (ms) => new Promise((r) => {
      this.timeout = setTimeout(r, ms);
    });
    for (let i = 0; i < tokens.length; i++) {
      if (gen !== this.generation) return;
      onToken(tokens[i], i);
      if (voice && globalThis.speechSynthesis) {
        await new Promise((resolve) => {
          const u = new SpeechSynthesisUtterance(
            tokens[i].replace(
              "\u2212",
              {
                bn: "\u09AC\u09BF\u09AF\u09BC\u09CB\u0997 ",
                es: "menos ",
                hi: "\u0918\u091F\u093E ",
                ar: "\u0646\u0627\u0642\u0635 ",
                zh: "\u51CF "
              }[lang2.slice(0, 2)] || "minus "
            ).replace(
              "+",
              { bn: "\u09AF\u09CB\u0997 ", es: "m\xE1s ", hi: "\u091C\u094B\u0921\u093C ", ar: "\u0632\u0627\u0626\u062F ", zh: "\u52A0 " }[lang2.slice(0, 2)] || "plus "
            ).replace(
              "\xD7",
              { bn: "\u0997\u09C1\u09A3 ", es: "por ", hi: "\u0917\u0941\u0923\u093E ", ar: "\u0636\u0631\u0628 ", zh: "\u4E58 " }[lang2.slice(0, 2)] || "times "
            ).replace(
              "\xF7",
              {
                bn: "\u09AD\u09BE\u0997 ",
                es: "entre ",
                hi: "\u092D\u093E\u0917 ",
                ar: "\u0642\u0633\u0645\u0629 ",
                zh: "\u9664 "
              }[lang2.slice(0, 2)] || "divided by "
            )
          );
          u.lang = lang2;
          u.onend = resolve;
          u.onerror = resolve;
          speechSynthesis.speak(u);
          this.timeout = setTimeout(resolve, 12e3);
        });
      } else await wait(pace);
      if (gen !== this.generation) return;
      onToken("", i);
      await wait(100);
    }
    if (gen === this.generation) onDone();
  }
};
