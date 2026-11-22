// File: fingers.js
// Directory: src/
// "Finger abacus": the same digit model as the soroban (thumb = 5, each finger = 1) drawn as two hands,
// tens on the left and ones on the right. It exposes the same small API as Soroban so the lesson player
// can use either board without knowing which one it has.

import { digitsToValue, snapshotToDigits, splitDigit } from "./soroban.js";

const NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
};
const HAND_W = 190;

export class FingerBoard {
  constructor(host, o = {}) {
    this.host = host;
    this.rods = Math.max(1, Math.min(2, o.rods || 2));
    this.scale = 0;
    this.interactive = !!o.interactive;
    this.onChange = o.onChange || (() => {});
    this.t = o.t || ((k) => k);
    this.digits = Array(this.rods).fill(0);
    this.hands = [];
    this.build();
  }

  build() {
    this.host.textContent = "";
    const w = HAND_W * this.rods;
    const svg = (this.svg = el("svg", { viewBox: `0 0 ${w} 330`, class: `soroban fingers${this.interactive ? " interactive" : ""}`, role: "img", "aria-label": this.t("fingers"), preserveAspectRatio: "xMidYMid meet" }));
    this.rodEls = [];
    for (let c = 0; c < this.rods; c++) {
      const g = el("g", { transform: `translate(${c * HAND_W},0)`, class: "fg-hand", "data-col": c }, svg);
      const mirror = el("g", { transform: c === this.rods - 1 ? "" : `translate(${HAND_W},0) scale(-1,1)` }, g);
      // fingers first (so a folded finger hides behind the palm)
      const fingers = [0, 1, 2, 3].map((i) => {
        const fx = 120 - i * 28; // index finger nearest the thumb
        const fg = el("g", { class: "fg-finger", "data-idx": i }, mirror);
        el("rect", { x: fx - 12, y: 56 + (i === 1 || i === 2 ? -10 : 4) + (i === 3 ? 8 : 0), width: 24, height: 100, rx: 12, class: "fg-skin" }, fg);
        el("rect", { x: fx - 12, y: 56 + (i === 1 || i === 2 ? -10 : 4) + (i === 3 ? 8 : 0), width: 24, height: 100, rx: 12, class: "fg-ring", fill: "none" }, fg);
        el("rect", { x: fx - 20, y: 20, width: 40, height: 220, fill: "transparent", class: "fg-hit" }, fg);
        return fg;
      });
      el("rect", { x: 28, y: 150, width: 112, height: 112, rx: 34, class: "fg-palm" }, mirror);
      const thumb = el("g", { class: "fg-thumb" }, mirror);
      el("rect", { x: -13, y: -60, width: 26, height: 76, rx: 13, class: "fg-skin fg-thumb-skin" }, thumb);
      el("rect", { x: -13, y: -60, width: 26, height: 76, rx: 13, class: "fg-ring", fill: "none" }, thumb);
      el("rect", { x: -34, y: -72, width: 68, height: 96, fill: "transparent", class: "fg-hit" }, thumb);
      thumb.dataset.base = "1";
      const label = el("text", { x: HAND_W / 2, y: 304, class: "sb-label", "text-anchor": "middle" }, g);
      label.textContent = c === this.rods - 1 ? "1" : "10";
      const dig = el("text", { x: HAND_W / 2, y: 28, class: "sb-digit fg-digit", "text-anchor": "middle" }, g);
      this.rodEls.push(g);
      this.hands.push({ fingers, thumb, dig, label, group: g });
      fingers.forEach((f, i) => this.interactive && f.addEventListener("pointerup", (e) => this.tap(e, c, "low", i)));
      if (this.interactive) thumb.addEventListener("pointerup", (e) => this.tap(e, c, "top", 0));
    }
    this.host.appendChild(svg);
    if (this.interactive) {
      svg.setAttribute("tabindex", "0");
      this.focusCol = this.rods - 1;
      svg.addEventListener("keydown", (e) => {
        const c = this.focusCol;
        let ok = true;
        if (e.key === "ArrowLeft") this.focusCol = Math.max(0, c - 1);
        else if (e.key === "ArrowRight") this.focusCol = Math.min(this.rods - 1, c + 1);
        else if (e.key === "ArrowUp" || e.key === "+") this.bump(c, 1);
        else if (e.key === "ArrowDown" || e.key === "-") this.bump(c, -1);
        else if (/^[0-9]$/.test(e.key)) this.setDigit(c, Number(e.key));
        else ok = false;
        if (ok) e.preventDefault();
      });
    }
    this.render();
  }

  render() {
    this.hands.forEach((h, c) => {
      const { top, low } = splitDigit(this.digits[c]);
      h.fingers.forEach((f, i) => {
        const up = i < low;
        f.style.transform = `translateY(${up ? 0 : 92}px)`;
        f.classList.toggle("on", up);
      });
      h.thumb.style.transform = top ? "translate(24px,170px) rotate(-38deg)" : "translate(34px,214px) rotate(62deg)";
      h.thumb.classList.toggle("on", top);
      h.dig.textContent = this.digits[c];
    });
    this.svg.setAttribute("aria-label", `${this.t("fingers")}: ${this.value}`);
  }

  get value() {
    return digitsToValue(this.digits, 0);
  }
  valueOf(d) {
    return digitsToValue(d, 0);
  }
  set(x) {
    const d = Array.isArray(x) ? x : snapshotToDigits(x, this.rods, 0);
    if (!d) return false;
    this.digits = d.slice(-this.rods);
    this.render();
    return true;
  }
  tap(e, col, kind, idx) {
    e.preventDefault();
    const { top, low } = splitDigit(this.digits[col]);
    const nTop = kind === "top" ? !top : top;
    const nLow = kind === "low" ? (idx < low ? idx : idx + 1) : low;
    this.setDigit(col, (nTop ? 5 : 0) + nLow);
  }
  setDigit(col, d) {
    this.digits[col] = d;
    this.render();
    this.onChange({ digits: this.digits.slice(), value: this.value, col });
  }
  bump(c, by) {
    const n = this.digits[c] + by;
    if (n >= 0 && n <= 9) this.setDigit(c, n);
  }
  clearHints() {
    this.svg.querySelectorAll(".hl").forEach((n) => n.classList.remove("hl"));
    this.svg.querySelectorAll(".sb-label.hl").forEach((n) => n.classList.remove("hl"));
    this.rodEls.forEach((r) => r.classList.remove("focus-rod"));
  }
  hintMove(from, to) {
    this.clearHints();
    if (!from || !to) return;
    from.forEach((fd, c) => {
      if (fd === to[c] || !this.hands[c]) return;
      this.rodEls[c].classList.add("focus-rod");
      const a = splitDigit(fd);
      const b = splitDigit(to[c]);
      if (a.top !== b.top) this.hands[c].thumb.classList.add("hl");
      for (let i = Math.min(a.low, b.low); i < Math.max(a.low, b.low); i++) this.hands[c].fingers[i].classList.add("hl");
    });
  }
  highlight(spec = {}) {
    this.clearHints();
    for (const [c, kind, idx] of spec.beads || []) (kind === "top" ? this.hands[c]?.thumb : this.hands[c]?.fingers[idx ?? 0])?.classList.add("hl");
    for (const c of spec.cols || []) this.rodEls[c]?.classList.add("focus-rod");
  }
  flash(kind) {
    this.svg.classList.remove("flash-ok", "flash-no");
    void this.svg.getBoundingClientRect();
    this.svg.classList.add(kind === "ok" ? "flash-ok" : "flash-no");
  }
  destroy() {
    this.host.textContent = "";
  }
}
