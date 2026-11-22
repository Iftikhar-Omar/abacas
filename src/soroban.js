// File: soroban.js
// Directory: src/
// A small, dependency-free SVG abacus (soroban) used by the lesson player and explainers.
// Beads are drawn so that a beginner can tell the two kinds apart at a glance:
//   - the single TOP bead (worth 5) is amber
//   - the four BOTTOM beads (worth 1 each) are blue
// A bead only "counts" when it touches the middle bar. Everything is plain SVG, so it stays
// crisp at any size, animates with CSS transitions, and works with keyboard and screen readers.

const NS = "http://www.w3.org/2000/svg";
const GAP = 64; // horizontal distance between rods
const PAD = 22;
const Y0 = 34; // frame top
const BAR = 112; // middle bar y
const Y1 = 296; // frame bottom
const BH = 35; // bead pitch
const TOP_OFF = 56; // top bead resting (away) y
const TOP_ON = BAR - 3 - 17; // top bead counting y
const LOW_ON = (i) => BAR + 3 + 17 + i * BH; // lower bead i counting y
const LOW_OFF = (i) => Y1 - 6 - 17 - (3 - i) * BH; // lower bead i resting y

const el = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
};

/** Convert a digit 0-9 into {top:boolean, low:0-4}. */
export const splitDigit = (d) => ({ top: d >= 5, low: d % 5 });

/**
 * Turn an engine snapshot ({raw, scale, value}) into an array of digits (most significant first)
 * for a board that has `rods` columns and shows `scale` decimal places.
 * Returns null when the number cannot be shown (fractions, too many digits...).
 */
export function snapshotToDigits(snap, rods, scale = 0) {
  if (!snap || snap.raw === null || snap.raw === undefined) return null;
  const raw = String(snap.raw).replace("-", "");
  const own = snap.scale || 0;
  if (!/^\d+$/.test(raw) || own > scale) return null;
  const full = raw + "0".repeat(scale - own);
  if (full.length > rods) return null;
  return full.padStart(rods, "0").split("").map(Number);
}

/** Digits -> printable value, e.g. [0,2,6] with scale 0 -> "26"; [0,1,5] with scale 1 -> "1.5". */
export function digitsToValue(digits, scale = 0) {
  let s = digits.join("");
  if (scale > 0) {
    s = s.padStart(scale + 1, "0");
    s = `${s.slice(0, -scale)}.${s.slice(-scale)}`;
  }
  s = s.replace(/^0+(?=\d)/, "");
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s || "0";
}

export function placeLabel(index, rods, scale) {
  const exp = rods - 1 - index - scale;
  if (exp >= 0) return String(10 ** exp);
  return `0.${"0".repeat(-exp - 1)}1`;
}

export class Soroban {
  /**
   * @param {HTMLElement} host
   * @param {object} o
   * @param {number} o.rods      number of columns
   * @param {number} [o.scale]   decimal places shown (rightmost rods)
   * @param {boolean} [o.interactive]
   * @param {boolean} [o.digits] show the digit above each rod
   * @param {boolean} [o.labels] show place names (1, 10, 100) below
   * @param {(info:{digits:number[],value:string,col:number})=>void} [o.onChange]
   * @param {(k:string)=>string} [o.t] text lookup for aria labels
   */
  constructor(host, o = {}) {
    this.host = host;
    this.rods = Math.max(1, o.rods || 3);
    this.scale = o.scale || 0;
    this.interactive = !!o.interactive;
    this.showDigits = o.digits !== false;
    this.showLabels = o.labels !== false;
    this.onChange = o.onChange || (() => {});
    this.t = o.t || ((k) => k);
    this.digits = Array(this.rods).fill(0);
    this.beads = [];
    this.focusCol = 0;
    this.build();
  }

  get width() {
    return PAD * 2 + this.rods * GAP;
  }

  build() {
    this.host.textContent = "";
    const w = this.width;
    const svg = (this.svg = el("svg", {
      viewBox: `0 0 ${w} ${Y1 + (this.showLabels ? 40 : 12)}`,
      class: `soroban${this.interactive ? " interactive" : ""}`,
      role: this.interactive ? "group" : "img",
      "aria-label": this.t("abacus"),
      preserveAspectRatio: "xMidYMid meet",
    }));
    const defs = el("defs", {}, svg);
    const g1 = el("linearGradient", { id: `sbTop${uid}`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: "0", "stop-color": "var(--sb-top-hi)" }, g1);
    el("stop", { offset: "1", "stop-color": "var(--sb-top)" }, g1);
    const g2 = el("linearGradient", { id: `sbLow${uid}`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: "0", "stop-color": "var(--sb-low-hi)" }, g2);
    el("stop", { offset: "1", "stop-color": "var(--sb-low)" }, g2);
    this.gradTop = `url(#sbTop${uid})`;
    this.gradLow = `url(#sbLow${uid})`;
    uid++;

    // frame
    el("rect", { x: PAD - 8, y: Y0, width: w - PAD * 2 + 16, height: Y1 - Y0, rx: 12, class: "sb-frame" }, svg);
    el("rect", { x: PAD - 8, y: BAR - 5, width: w - PAD * 2 + 16, height: 10, class: "sb-bar" }, svg);
    // rods
    this.rodEls = [];
    for (let c = 0; c < this.rods; c++) {
      const x = PAD + GAP * c + GAP / 2;
      const group = el("g", { class: "sb-rod", "data-col": c }, svg);
      el("rect", { x: x - 30, y: Y0 + 3, width: 60, height: Y1 - Y0 - 6, rx: 10, class: "sb-rod-glow" }, group);
      el("line", { x1: x, x2: x, y1: Y0 + 2, y2: Y1 - 2, class: "sb-rod-line" }, group);
      this.rodEls.push(group);
    }
    // unit-rod dot (soroban convention: the rod that holds the ones)
    const unitCol = this.rods - 1 - this.scale;
    if (unitCol >= 0) el("circle", { cx: PAD + GAP * unitCol + GAP / 2, cy: BAR, r: 3.4, class: "sb-unit-dot" }, svg);

    // digit readouts + labels
    this.digitEls = [];
    for (let c = 0; c < this.rods; c++) {
      const x = PAD + GAP * c + GAP / 2;
      if (this.showDigits) {
        el("rect", { x: x - 15, y: 3, width: 30, height: 24, rx: 8, class: "sb-digit-bg" }, svg);
        this.digitEls.push(el("text", { x, y: 20.5, class: "sb-digit", "text-anchor": "middle" }, svg));
      }
      if (this.showLabels) {
        const t = el("text", { x, y: Y1 + 26, class: "sb-label", "text-anchor": "middle" }, svg);
        t.textContent = placeLabel(c, this.rods, this.scale);
      }
    }
    // beads
    this.beads = [];
    for (let c = 0; c < this.rods; c++) {
      const x = PAD + GAP * c + GAP / 2;
      const top = this.makeBead(svg, x, c, "top", 0);
      const lows = [0, 1, 2, 3].map((i) => this.makeBead(svg, x, c, "low", i));
      this.beads.push({ top, lows });
    }
    // overlay for hint arrows
    this.arrows = el("g", { class: "sb-arrows", "aria-hidden": "true" }, svg);
    this.host.appendChild(svg);

    if (this.interactive) this.bindKeys();
    this.render();
  }

  makeBead(svg, x, col, kind, idx) {
    const g = el("g", { class: `sb-bead ${kind === "top" ? "sb-top" : "sb-low"}`, "data-col": col, "data-kind": kind, "data-idx": idx }, svg);
    g.dataset.x = x;
    // soft hit area (big for fingers)
    el("rect", { x: -GAP / 2 + 2, y: -BH / 2, width: GAP - 4, height: BH, class: "sb-hit", fill: "transparent" }, g);
    el("path", { d: "M-23 0 Q-13 -17 0 -17 Q13 -17 23 0 Q13 17 0 17 Q-13 17 -23 0Z", fill: kind === "top" ? this.gradTop : this.gradLow, class: "sb-bead-body" }, g);
    el("ellipse", { cx: 0, cy: -6.5, rx: 11, ry: 3.2, class: "sb-shine" }, g);
    el("path", { d: "M-23 0 Q-13 -17 0 -17 Q13 -17 23 0 Q13 17 0 17 Q-13 17 -23 0Z", class: "sb-ring", fill: "none" }, g);
    if (this.interactive) g.addEventListener("pointerup", (e) => this.tapBead(e, col, kind, idx));
    return g;
  }

  place(g, x, y) {
    g.style.transform = `translate(${x}px, ${y}px)`;
  }

  /** Re-position every bead from this.digits */
  render() {
    for (let c = 0; c < this.rods; c++) {
      const x = PAD + GAP * c + GAP / 2;
      const { top, low } = splitDigit(this.digits[c]);
      const b = this.beads[c];
      this.place(b.top, x, top ? TOP_ON : TOP_OFF);
      b.top.classList.toggle("on", top);
      b.lows.forEach((g, i) => {
        const on = i < low;
        this.place(g, x, on ? LOW_ON(i) : LOW_OFF(i));
        g.classList.toggle("on", on);
      });
      if (this.digitEls[c]) this.digitEls[c].textContent = this.digits[c];
    }
    this.rodEls.forEach((r, c) => {
      r.setAttribute("data-digit", this.digits[c]);
    });
    this.svg.setAttribute("aria-label", `${this.t("abacus")}: ${this.value}`);
  }

  get value() {
    return digitsToValue(this.digits, this.scale);
  }

  /** Set digits (array) or a snapshot. Beads animate via CSS. */
  set(digitsOrSnap) {
    const d = Array.isArray(digitsOrSnap) ? digitsOrSnap : snapshotToDigits(digitsOrSnap, this.rods, this.scale);
    if (!d) return false;
    this.digits = d.slice();
    this.render();
    return true;
  }

  /** printable value of a digits array on this board */
  valueOf(digits) {
    return digitsToValue(digits, this.scale);
  }

  /**
   * Highlight spec: { beads:[[col,'top'|'low',idx]], bar:boolean, cols:[col] }
   * Used by the explainers to point at a part of the abacus.
   */
  highlight(spec = {}) {
    this.clearHints();
    for (const [c, kind, idx] of spec.beads || []) {
      const b = this.beads[c];
      if (!b) continue;
      (kind === "top" ? b.top : b.lows[idx ?? 0])?.classList.add("hl");
    }
    for (const c of spec.cols || []) this.rodEls[c]?.classList.add("focus-rod");
    this.svg.querySelector(".sb-bar")?.classList.toggle("hl", !!spec.bar);
    this.svg.querySelector(".sb-frame")?.classList.toggle("hl", !!spec.frame);
    this.svg.querySelector(".sb-unit-dot")?.classList.toggle("hl", !!spec.dot);
    this.svg.querySelectorAll(".sb-label").forEach((n, c) => n.classList.toggle("hl", (spec.labels || []).includes(c)));
  }

  /** Hide the digit readouts above the sticks (used by "what number is this?" questions). */
  hideDigits(on) {
    this.svg.classList.toggle("no-digits", !!on);
  }

  clearHints() {
    this.svg.querySelector(".sb-bar")?.classList.remove("hl");
    this.svg.querySelectorAll(".sb-label.hl").forEach((n) => n.classList.remove("hl"));
    this.svg.querySelectorAll(".hl").forEach((n) => n.classList.remove("hl"));
    this.rodEls.forEach((r) => r.classList.remove("focus-rod"));
    this.arrows.textContent = "";
  }

  /**
   * Highlight what changes between two digit arrays: the beads that have to move glow,
   * and a small arrow shows the direction (towards the bar / away from the bar).
   */
  hintMove(from, to) {
    this.clearHints();
    if (!from || !to) return;
    for (let c = 0; c < this.rods; c++) {
      if (from[c] === to[c]) continue;
      this.rodEls[c].classList.add("focus-rod");
      const a = splitDigit(from[c]);
      const b = splitDigit(to[c]);
      const x = PAD + GAP * c + GAP / 2;
      if (a.top !== b.top) {
        this.beads[c].top.classList.add("hl");
        this.arrow(x, b.top ? TOP_OFF + 8 : TOP_ON - 12, b.top ? "down" : "up");
      }
      if (a.low !== b.low) {
        const lo = Math.min(a.low, b.low);
        const hi = Math.max(a.low, b.low);
        for (let i = lo; i < hi; i++) this.beads[c].lows[i].classList.add("hl");
        const towards = b.low > a.low;
        this.arrow(x, towards ? (LOW_OFF(lo) + LOW_ON(lo)) / 2 + 16 : (LOW_OFF(hi - 1) + LOW_ON(hi - 1)) / 2 - 14, towards ? "up" : "down", 38);
      }
    }
  }

  arrow(x, y, dir, shift = 0) {
    const g = el("g", { class: `sb-arrow ${dir}`, transform: `translate(${x + 30},${y})` }, this.arrows);
    el("path", { d: dir === "up" ? "M0 10 L0 -10 M-7 -3 L0 -10 L7 -3" : "M0 -10 L0 10 M-7 3 L0 10 L7 3", class: "sb-arrow-path" }, g);
    void shift;
  }

  /** Mark rods red/green after a check */
  flash(kind) {
    this.svg.classList.remove("flash-ok", "flash-no");
    void this.svg.getBoundingClientRect();
    this.svg.classList.add(kind === "ok" ? "flash-ok" : "flash-no");
  }

  tapBead(e, col, kind, idx) {
    e.preventDefault();
    const d = this.digits[col];
    const { top, low } = splitDigit(d);
    let nTop = top;
    let nLow = low;
    if (kind === "top") nTop = !top;
    else nLow = idx < low ? idx : idx + 1; // tapping an active bead lowers the stack below it
    this.digits[col] = (nTop ? 5 : 0) + nLow;
    this.render();
    this.focusCol = col;
    this.onChange({ digits: this.digits.slice(), value: this.value, col });
  }

  bindKeys() {
    this.svg.setAttribute("tabindex", "0");
    this.svg.setAttribute("aria-roledescription", "abacus");
    this.svg.addEventListener("keydown", (e) => {
      const c = this.focusCol;
      let handled = true;
      if (e.key === "ArrowLeft") this.focusCol = Math.max(0, c - 1);
      else if (e.key === "ArrowRight") this.focusCol = Math.min(this.rods - 1, c + 1);
      else if (e.key === "ArrowUp" || e.key === "+") this.bump(c, 1);
      else if (e.key === "ArrowDown" || e.key === "-") this.bump(c, -1);
      else if (/^[0-9]$/.test(e.key)) {
        this.digits[c] = Number(e.key);
        this.render();
        this.onChange({ digits: this.digits.slice(), value: this.value, col: c });
      } else handled = false;
      if (handled) {
        e.preventDefault();
        this.rodEls.forEach((r, i) => r.classList.toggle("kbd-rod", i === this.focusCol));
      }
    });
    this.svg.addEventListener("focus", () => {
      if (this.svg.matches(":focus-visible")) this.rodEls[this.focusCol]?.classList.add("kbd-rod");
    });
    this.svg.addEventListener("blur", () => this.rodEls.forEach((r) => r.classList.remove("kbd-rod")));
  }

  bump(c, by) {
    const n = this.digits[c] + by;
    if (n < 0 || n > 9) return;
    this.digits[c] = n;
    this.render();
    this.onChange({ digits: this.digits.slice(), value: this.value, col: c });
  }

  destroy() {
    this.host.textContent = "";
  }
}
let uid = 0;

/** Work out how many rods / decimal places a set of snapshots needs. */
export function layoutFor(snapshots, minRods = 3) {
  let scale = 0;
  for (const s of snapshots) if (s && s.raw !== null && s.raw !== undefined) scale = Math.max(scale, s.scale || 0);
  let rods = minRods;
  for (const s of snapshots) {
    if (!s || s.raw === null || s.raw === undefined) continue;
    const raw = String(s.raw).replace("-", "");
    rods = Math.max(rods, raw.length + (scale - (s.scale || 0)));
  }
  return { rods: Math.min(rods, 13), scale };
}
