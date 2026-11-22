import { ThreeModel } from './scene3d.js';
import { canonicalMask, maskValue, motionAllowed, st, tapFinger } from './studio.js';
import { evaluate, formatScaled, normalize } from './engine.js';

export var sequence = 0;
export var BeadModel = class {
  constructor(el, {
    onChange,
    onLocked,
    prefs: prefs2 = () => ({
      renderer: "2d",
      duration: 2e3,
      fingerStyle: "individual",
      motion: false
    }),
    lang: lang2 = () => "en"
  }) {
    this.el = el;
    this.onChange = onChange;
    this.onLocked = onLocked;
    this.prefs = prefs2;
    this.lang = lang2;
    this.raw = 0n;
    this.scale = 0;
    this.locked = true;
    this.mode = "abacus";
    this.shape = "";
    this.snapshot = null;
    this.masks = [0, 0];
    this.sign = 1n;
    this.history = [];
    this.uid = ++sequence;
    this.abort = new el.ownerDocument.defaultView.AbortController();
    const signal = this.abort.signal;
    el.addEventListener("click", (e) => this.click(e), { signal });
    el.addEventListener(
      "keydown",
      (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-col]")) {
          e.preventDefault();
          this.click(e);
        }
      },
      { signal }
    );
    el.addEventListener(
      "model-fallback",
      () => {
        this.failed3d = true;
        this.useFallback();
      },
      { signal }
    );
    this.mount();
  }
  mount() {
    this.el.innerHTML = '<div class="model-stage"><div class="model-3d"></div><div class="model-fallback"></div><div class="model-unavailable" hidden></div></div><div class="model-place-values" dir="ltr"></div>';
    this.fallback = this.el.querySelector(".model-fallback");
    this.stage = this.el.querySelector(".model-stage");
    this.unavailable = this.el.querySelector(".model-unavailable");
    this.try3d();
  }
  async try3d() {
    if (this.mode === "hands" || this.failed3d || this.prefs().renderer !== "3d" || typeof globalThis.WebGL2RenderingContext === "undefined")
      return;
    const generation = this.generation = (this.generation || 0) + 1;
    try {
      const { ThreeModel: ThreeModel2 } = await import('./scene3d.js');
      if (this.disposed || generation !== this.generation || this.prefs().renderer !== "3d" || this.mode === "hands")
        return;
      this.scene = new ThreeModel2(this.el.querySelector(".model-3d"), {
        prefs: this.prefs,
        onTap: (b) => {
          if (this.locked) this.onLocked?.();
          else if (b) this.tap(b.col, b.index);
        }
      });
      this.el.classList.add("has-3d");
      this.scene.build(this.mode, this.rods || 3);
      this.scene.update(this.states || [], 0, this.scale);
      this.scene.resize();
      this.scene.suspend(!!this.hiddenForMental);
    } catch {
      this.failed3d = true;
      this.useFallback();
    }
  }
  useFallback() {
    this.scene?.dispose();
    this.scene = null;
    this.el.classList.remove("has-3d");
  }
  click(e) {
    if (e.target.closest(".model-3d")) return;
    if (this.locked) {
      this.onLocked?.();
      return;
    }
    if (this.unsupported) return;
    const bead = e.target.closest("[data-col]");
    if (bead) this.tap(Number(bead.dataset.col), Number(bead.dataset.index));
  }
  tap(col, index) {
    if (this.locked) {
      this.onLocked?.();
      return;
    }
    if (this.unsupported) return;
    this.history.push({ ...this.snapshot, pose: [...this.masks] });
    this.history = this.history.slice(-30);
    const before = { ...this.snapshot, pose: [...this.masks] };
    const place = 10n ** BigInt(col), digit = Number(this.raw / place % 10n);
    let next;
    if (this.mode === "hands") {
      this.masks[col] = tapFinger(
        this.masks[col],
        index,
        this.prefs().fingerStyle
      );
      next = maskValue(this.masks[col]);
    } else {
      const lower = digit % 5;
      next = index === 0 ? (digit >= 5 ? 0 : 5) + lower : (digit >= 5 ? 5 : 0) + (index <= lower ? index - 1 : index);
    }
    this.raw += BigInt(next - digit) * place;
    const snap = {
      raw: (this.raw * this.sign).toString(),
      scale: this.scale,
      value: formatScaled(this.raw * this.sign, this.scale),
      ...this.mode === "hands" ? { pose: [...this.masks] } : {}
    };
    this.set(snap, before, col);
    this.onChange?.(snap, { col, index, from: before.value, to: snap.value });
  }
  undo() {
    const s = this.history.pop();
    if (!s) return;
    this.set(s, this.snapshot);
    this.onChange?.(s, { undo: true });
  }
  clear() {
    if (this.locked || this.unsupported) return;
    this.history.push({ ...this.snapshot, pose: [...this.masks] });
    const s = {
      raw: "0",
      scale: this.scale,
      value: formatScaled(0n, this.scale),
      pose: [0, 0]
    };
    this.set(s, this.snapshot);
    this.onChange?.(s, { clear: true });
  }
  normalize(snapshot) {
    if (snapshot.raw !== null && snapshot.raw !== void 0)
      return { ...snapshot };
    try {
      if (!/^-?\d+(\.\d+)?$/.test(snapshot.value)) return null;
      const d = evaluate(snapshot.value).decimal(8);
      return d ? { ...snapshot, raw: d.n.toString(), scale: d.scale } : null;
    } catch {
      return null;
    }
  }
  set(snapshot, before = null, column = -1) {
    const p = this.prefs(), normalized = this.normalize(snapshot);
    if (this.lastRenderer !== p.renderer) {
      this.failed3d = false;
      this.lastRenderer = p.renderer;
    }
    this.el.classList.toggle("is-locked", this.locked);
    this.el.dataset.mode = this.mode;
    this.unsupported = !normalized || this.mode === "hands" && BigInt(normalized.raw) < 0n || String(normalized.raw).replace("-", "").length > 26 || this.mode === "hands" && (normalized.scale || BigInt(normalized.raw) > 99n);
    const s = this.unsupported ? { raw: "0", scale: 0, value: "0" } : normalized;
    let scale = this.mode === "hands" ? 0 : Math.max(s.scale || 0, p.decimalColumns || 0, this.rangeScale || 0);
    this.sign = BigInt(s.raw) < 0n ? -1n : 1n;
    const raw = BigInt(s.raw) * this.sign * 10n ** BigInt(scale - (s.scale || 0));
    const rods = this.mode === "hands" ? 2 : Math.min(
      26,
      Math.max(
        3,
        String(raw).length,
        scale + Math.max(1, p.integerColumns || 0),
        this.rangeRods || 0
      )
    );
    const shape = `${this.mode}-${rods}-${scale}-${p.surface}-${p.customColor}`;
    const representationChanged = this.scale !== scale;
    this.raw = raw;
    this.scale = scale;
    this.rods = rods;
    this.el.classList.toggle("many-columns", rods > 8);
    this.snapshot = {
      ...s,
      raw: (raw * this.sign).toString(),
      scale,
      value: this.unsupported ? snapshot.value : formatScaled(raw * this.sign, scale)
    };
    const prev = this.normalize(before || s);
    const prevRaw = prev ? (BigInt(prev.raw) < 0n ? -BigInt(prev.raw) : BigInt(prev.raw)) * 10n ** BigInt(Math.max(0, scale - (prev.scale || 0))) : raw;
    const mask = this.mode === "hands" && s.pose?.length === 2 ? s.pose : [
      canonicalMask(Number(raw % 10n)),
      canonicalMask(Number(raw / 10n % 10n))
    ];
    const prevMasks = before?.pose?.length === 2 ? before.pose : [
      canonicalMask(Number(prevRaw % 10n)),
      canonicalMask(Number(prevRaw / 10n % 10n))
    ];
    this.masks = [...mask];
    const duration = before && !this.unsupported ? motionAllowed({ ...p, motion: true }) ? p.duration : 0 : 0;
    this.el.style.setProperty("--move-duration", `${duration}ms`);
    if (shape !== this.shape) {
      this.shape = shape;
      this.mode === "hands" ? this.buildHands() : this.buildAbacus(rods);
      this.scene?.build(this.mode, rods);
    }
    this.states = [];
    let movedIndex = 0;
    for (const b of this.fallback.querySelectorAll("[data-col]")) {
      const col = Number(b.dataset.col), i = Number(b.dataset.index), d = Number(raw / 10n ** BigInt(col) % 10n), pd = Number(prevRaw / 10n ** BigInt(col) % 10n);
      const active = this.mode === "hands" ? !!(mask[col] & 1 << i) : i === 0 ? d >= 5 : i <= d % 5;
      const pactive = this.mode === "hands" ? !!(prevMasks[col] & 1 << i) : i === 0 ? pd >= 5 : i <= pd % 5;
      const moved = active !== pactive && !this.unsupported;
      b.style.transitionDelay = `${duration && moved ? movedIndex++ * 140 : 0}ms`;
      this.states.push({ col, index: i, active, moved });
      b.classList.toggle("active", active);
      b.classList.toggle("moved", moved);
      b.setAttribute("aria-pressed", String(active));
      if (this.mode === "abacus") {
        const y = i === 0 ? active ? 88 : 39 : active ? 144 + (i - 1) * 31 : 183 + (i - 1) * 31;
        b.style.transform = `translateY(${y}px)`;
      } else {
        b.classList.toggle(
          "folded",
          p.fingerPose === "extendedCounts" ? !active : active
        );
        b.setAttribute(
          "aria-label",
          `${i === 0 ? col ? 50 : 5 : col ? 10 : 1} \xB7 ${st(active ? "counted" : "resting", this.lang())}`
        );
      }
    }
    this.fallback.querySelectorAll("[data-rod]").forEach(
      (e) => e.classList.toggle("focused", Number(e.dataset.rod) === column)
    );
    this.fallback.querySelectorAll("[data-digit]").forEach(
      (e) => e.textContent = String(
        raw / 10n ** BigInt(e.dataset.digit) % 10n
      )
    );
    this.scene?.update(this.states, duration, scale);
    clearTimeout(this.moveTimer);
    this.moveTimer = setTimeout(() => {
      this.fallback.querySelectorAll(".moved").forEach((e) => e.classList.remove("moved"));
      this.scene?.update(
        this.states.map((s2) => ({ ...s2, moved: false })),
        0,
        scale
      );
    }, duration + 1e3);
    this.unavailable.hidden = !this.unsupported;
    this.el.classList.toggle("model-paused", this.unsupported);
    this.unavailable.innerHTML = this.unsupported ? this.rationalView(snapshot.value) || `<b>${this.escape(snapshot.value)}</b><span>${st(this.mode === "hands" ? "handsLimit" : "modelPaused", this.lang())}</span>` : "";
    this.el.dataset.sign = this.sign < 0n ? "negative" : "positive";
    this.el.querySelector(".model-place-values").innerHTML = this.mode === "hands" ? `<span>${st("fingerTrack", this.lang())} \xB7 0\u201399</span><span>10 \xD7 <b>${raw / 10n % 10n}</b> \uFF0B 1 \xD7 <b>${raw % 10n}</b></span>` : `<span>${scale ? `1 \xB7 0.1${scale >= 2 ? " \xB7 0.01" : ""} \u2026` : "100 \xB7 10 \xB7 1"}</span>`;
    if ((p.renderer === "2d" || this.mode === "hands") && this.scene)
      this.useFallback();
    else if (p.renderer === "3d" && this.mode !== "hands" && !this.scene)
      this.try3d();
    if (representationChanged && scale)
      this.el.dispatchEvent(
        new this.el.ownerDocument.defaultView.CustomEvent("decimal-added", {
          bubbles: true,
          detail: { scale }
        })
      );
    return this.snapshot;
  }
  rationalView(value) {
    if (this.mode === "hands") return null;
    try {
      const q = evaluate(value);
      if (q.d === 1n) return null;
      const magnitude = q.n < 0n ? -q.n : q.n, whole = magnitude / q.d, rem = magnitude % q.d, parts = Number(q.d);
      const visual = parts <= 24 ? `<div class="fraction-bar" aria-label="${rem} / ${q.d}">${Array.from({ length: parts }, (_, i) => `<span class="${BigInt(i) < rem ? "filled" : ""}"></span>`).join("")}</div>` : "";
      const mixed = whole > 0n ? `${q.n < 0n ? "\u2212(" : ""}${whole} + ${rem}/${q.d}${q.n < 0n ? ")" : ""}` : `${q.n < 0n ? "\u2212" : ""}${rem} / ${q.d}`;
      return `<div class="fraction-number" dir="ltr">${q.n < 0n ? "<span>\u2212</span>" : ""}<span class="fraction-stack"><b>${magnitude}</b><b>${q.d}</b></span></div>${visual}<span dir="ltr">${mixed} \xB7 ${st("fractionParts", this.lang())}</span>`;
    } catch {
      return null;
    }
  }
  setHidden(value) {
    this.hiddenForMental = value;
    this.scene?.suspend(value);
  }
  replay(before) {
    if (!before || !this.snapshot) return;
    const after = {
      ...this.snapshot,
      ...this.mode === "hands" ? { pose: [...this.masks] } : {}
    };
    this.set(before);
    this.el.getBoundingClientRect();
    this.set(after, before);
  }
  finish() {
    this.scene?.finish();
  }
  pan(delta) {
    if (this.scene) this.scene.pan(delta);
    else this.fallback.scrollLeft += delta * 80;
  }
  zoom(factor) {
    if (this.scene) this.scene.zoom(factor);
    else {
      this.zoomValue = Math.max(
        0.85,
        Math.min(1.3, (this.zoomValue || 1) * factor)
      );
      this.fallback.style.transform = `scale(${this.zoomValue})`;
    }
  }
  resetView() {
    this.scene?.resetView();
    this.zoomValue = 1;
    this.fallback.style.transform = "";
  }
  escape(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]
    );
  }
  buildAbacus(rods) {
    const w = rods * 76 + 70, id = this.uid;
    let svg = `<svg class="abacus-svg" viewBox="0 0 ${w} 370" role="group" aria-label="Interactive soroban"><defs><linearGradient id="activeBead${id}" x2="0" y2="1"><stop stop-color="var(--custom-bead)"/><stop offset="1" stop-color="var(--custom-bead)"/></linearGradient><linearGradient id="restBead${id}" x2="0" y2="1"><stop stop-color="var(--bead-rest-light)"/><stop offset="1" stop-color="var(--bead-rest)"/></linearGradient></defs><rect x="14" y="17" width="${w - 28}" height="303" rx="20" class="abacus-frame"/><rect x="26" y="28" width="${w - 52}" height="279" rx="11" class="abacus-interior"/>`;
    for (let c = rods - 1; c >= 0; c--) {
      const x = 49 + (rods - 1 - c) * 76;
      svg += `<g data-rod="${c}" class="rod"><rect class="rod-light" x="${x - 4}" y="28" width="58" height="278" rx="10"/><line x1="${x + 25}" x2="${x + 25}" y1="30" y2="307" class="rod-metal" stroke-width="5"/>`;
      for (let i = 0; i < 5; i++)
        svg += `<g data-col="${c}" data-index="${i}" role="button" tabindex="0" aria-label="${i === 0 ? "5" : "1"} \xD7 ${formatScaled(10n ** BigInt(c), this.scale)}" aria-pressed="false" class="bead"><rect x="${x - 5}" y="-7" width="60" height="35" rx="10" class="hit"/><path d="M${x},2 L${x + 11},-5 H${x + 39} L${x + 50},2 V14 L${x + 39},21 H${x + 11} L${x},14 Z" style="fill:url(#restBead${id})"/><path class="bead-counted" d="M${x},2 L${x + 11},-5 H${x + 39} L${x + 50},2 V14 L${x + 39},21 H${x + 11} L${x},14 Z" style="fill:url(#activeBead${id})"/></g>`;
      svg += `<text data-digit="${c}" x="${x + 25}" y="342" text-anchor="middle" class="digit">0</text><text x="${x + 25}" y="365" text-anchor="middle" class="place-label">${formatScaled(10n ** BigInt(c), this.scale)}</text></g>`;
    }
    svg += `<rect x="20" y="118" width="${w - 40}" height="14" rx="4" class="abacus-frame"/><circle cx="${49 + (rods - 1 - this.scale) * 76 + 61}" cy="125" r="4" fill="#fbbe58"/></svg>`;
    this.fallback.innerHTML = svg;
    this.el.style.setProperty("--rods", rods);
  }
  buildHands() {
    let svg = '<svg class="hand-svg" viewBox="0 0 700 345" role="group" aria-label="Finger counting: left tens, right ones">';
    for (let c = 1; c >= 0; c--) {
      const base = c === 1 ? 40 : 390;
      svg += `<g><path d="M${base + 28} 195 Q${base} 275 ${base + 85} 315 L${base + 170} 315 Q${base + 235} 275 ${base + 217} 195 Z" class="palm"/>`;
      for (let i = 1; i <= 4; i++) {
        const x = base + (c === 1 ? 4 - i : i - 1) * 47 + 25, y = [82, 49, 61, 108][i - 1];
        svg += `<g data-col="${c}" data-index="${i}" role="button" tabindex="0" aria-label="${c ? 10 : 1}" aria-pressed="false" class="finger"><text class="finger-value" x="${x + 20}" y="${y - 9}" text-anchor="middle">${c ? 10 : 1}</text><rect class="finger-hit" x="${x - 2}" y="${y}" width="43" height="${241 - y}" rx="19"/><g class="finger-extended"><rect x="${x}" y="${y}" width="39" height="${226 - y}" rx="19"/><path d="M${x + 9} ${y + 50}h21 M${x + 9} ${y + 82}h21" class="finger-joint"/></g><g class="finger-knuckle"><rect x="${x}" y="190" width="39" height="53" rx="18"/><path d="M${x + 8} 215h23" class="finger-joint"/></g></g>`;
      }
      const tx = c === 1 ? base + 213 : base - 14;
      svg += `<g data-col="${c}" data-index="0" role="button" tabindex="0" aria-label="${c ? 50 : 5}" aria-pressed="false" class="finger thumb"><text class="finger-value" x="${tx + 23}" y="194" text-anchor="middle">${c ? 50 : 5}</text><rect class="finger-hit" x="${tx - 4}" y="196" width="54" height="95" rx="20"/><g class="finger-extended"><rect x="${tx}" y="202" width="47" height="86" rx="22" transform="rotate(${c === 1 ? 24 : -24} ${tx + 23} 247)"/></g><g class="finger-knuckle"><rect x="${tx}" y="230" width="47" height="51" rx="20"/></g></g><text x="${base + 125}" y="341" text-anchor="middle" class="digit">${c ? "10 \xD7" : "1 \xD7"} <tspan data-digit="${c}">0</tspan></text></g>`;
    }
    this.fallback.innerHTML = svg + "</svg>";
    this.el.style.setProperty("--rods", 2);
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    clearTimeout(this.moveTimer);
    this.abort.abort();
    this.scene?.dispose();
    this.el.remove();
  }
};
