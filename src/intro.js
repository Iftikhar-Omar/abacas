// File: intro.js
// Directory: src/
// The traditional introduction to the abacus ("What is an abacus?"): what it is and what it is called,
// a little history, the names and jobs of its parts, a short demonstration (with a promise that it is fine
// not to follow it yet), why it is worth learning and the "mental abacus" goal. It is a list of scenes played
// by the same viewer as every other idea; scenes with `art` show a picture instead of the live abacus.

import { P } from "./player-i18n.js";

export const INTRO_ID = "normal-intro";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** A tiny static abacus picture: `rods` sticks, `top` heaven beads and `low` earth beads per stick. `vals` = active beads per rod. */
function miniAbacus({ rods = 3, top = 1, low = 4, vals = [], w = 92, h = 74 } = {}) {
  const gap = (w - 14) / rods, mid = 28;
  let s = `<svg class="in-mini" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="9" class="in-frame"/><path d="M3 ${mid}h${w - 6}" class="in-beam"/>`;
  for (let r = 0; r < rods; r++) {
    const x = 7 + gap * r + gap / 2, v = vals[r] ?? 0, up = v >= 5 && top === 1 ? 1 : 0, lo = v % 5;
    s += `<path d="M${x} 6v${h - 12}" class="in-rod"/>`;
    for (let i = 0; i < top; i++) s += `<ellipse cx="${x}" cy="${up ? mid - 6 - i * 0 : 11 + i * 8}" rx="${Math.min(9, gap / 2 - 2)}" ry="3.6" class="in-top"/>`;
    for (let i = 0; i < low; i++) s += `<ellipse cx="${x}" cy="${i < lo ? mid + 7 + i * 7.5 : h - 9 - (low - 1 - i) * 7.5}" rx="${Math.min(9, gap / 2 - 2)}" ry="3.6" class="in-low"/>`;
  }
  return `${s}</svg>`;
}

function boardIcon() {
  // a counting board: lines with pebbles
  return `<svg class="in-mini" viewBox="0 0 92 74" aria-hidden="true"><rect x="3" y="3" width="86" height="68" rx="9" class="in-frame sand"/>${[20, 37, 54].map((y) => `<path d="M12 ${y}h68" class="in-line"/>`).join("")}${[[26, 20], [52, 20], [38, 37], [64, 37], [30, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" class="in-pebble"/>`).join("")}</svg>`;
}

const card = (icon, name, sub, cls = "") => `<div class="in-card ${cls}">${icon}<b dir="auto">${esc(name)}</b><small>${esc(sub)}</small></div>`;

function artNames(lang) {
  return `<div class="in-art in-cards">${card(boardIcon(), "Abacus", P("in_a_abacus", lang))}${card(miniAbacus({ vals: [0, 0, 0] }), "そろばん", P("in_a_soroban", lang), "feat")}${card(miniAbacus({ top: 2, low: 5, vals: [0, 0, 0] }), "算盘", P("in_a_suanpan", lang))}</div>`;
}

function artHistory(lang) {
  const icons = [boardIcon(), boardIcon(), miniAbacus({ top: 2, low: 5, vals: [0, 0, 0] }), miniAbacus({ vals: [0, 0, 0] })];
  return `<ol class="in-art in-time">${icons.map((ic, i) => `<li class="${i === 3 ? "now" : ""}"><span class="in-dot">${ic}</span><span class="in-when">${esc(P(`in_h_${i + 1}_when`, lang))}</span><span class="in-what">${esc(P(`in_h_${i + 1}`, lang))}</span></li>`).join("")}</ol>`;
}

function artWhy(lang) {
  const items = [
    ["in_w_1", "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
    ["in_w_2", "M8 6a3 3 0 0 1 6 0 3 3 0 0 1 3 3c2 1 2 5 0 6a3 3 0 0 1-4 3 3 3 0 0 1-5-1c-3-1-3-5-1-6a3 3 0 0 1 1-5z"],
    ["in_w_3", "M13 3 5 13h6l-1 8 8-10h-6z"],
    ["in_w_4", "M4 10h16M6 10l1 9h10l1-9M9 10V7a3 3 0 0 1 6 0v3"],
  ];
  return `<div class="in-art in-why">${items.map(([k, d]) => `<div class="in-card"><span class="in-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg></span><b>${esc(P(k, lang))}</b><small>${esc(P(`${k}_b`, lang))}</small></div>`).join("")}</div>`;
}

function artMind() {
  return `<div class="in-art in-mind"><svg viewBox="0 0 320 210" aria-hidden="true" role="img"><circle cx="70" cy="165" r="9" class="in-puff"/><circle cx="92" cy="140" r="13" class="in-puff"/><path d="M110 28c34-26 92-22 108 14 36-8 70 20 56 52-8 20-30 28-50 24-14 22-50 28-72 12-22 12-52 4-60-18-30-6-40-44-14-62 8-12 20-18 32-22z" class="in-cloud"/><g class="in-mini" transform="translate(118 44) scale(1.25)">${miniAbacus({ vals: [0, 8, 4], w: 92, h: 74 }).replace('<svg class="in-mini" viewBox="0 0 92 74" aria-hidden="true">', "").replace("</svg>", "")}</g><circle cx="52" cy="180" r="22" class="in-face"/><circle cx="44" cy="177" r="2.6" class="in-eye"/><circle cx="60" cy="177" r="2.6" class="in-eye"/><path d="M44 188q8 6 16 0" class="in-smile"/></svg></div>`;
}

function artRoad(lang) {
  const steps = ["in_r_1", "in_r_2", "in_r_3", "in_r_4"];
  return `<ol class="in-art in-road">${steps.map((k, i) => `<li><span class="in-num">${i + 1}</span><b>${esc(P(k, lang))}</b><small>${esc(P(`${k}_b`, lang))}</small></li>`).join("")}</ol>`;
}

const SLIDE = (n, o = {}, lang) => ({
  title: P(`in_${n}_t`, lang),
  body: P(`in_${n}_b`, lang),
  math: o.math || "",
  from: o.from || o.to,
  to: o.to || o.from,
  hl: o.hl,
  table: o.table,
  tableList: !!o.table,
  art: o.art,
  boardable: true,
});

const callout = (part, side, text, o = {}) => ({ part, side, text, ...o });

/** The labelled map of the whole abacus (the same labels the teacher's hand-drawn sketch uses). */
function mapLabels(lang) {
  const t = (k) => P(k, lang);
  return [
    callout("deckU", "l", t("in_c_upperDeck"), { at: [0.03, 0.5], tone: "up" }),
    callout("frame", "l", t("in_c_frame"), { at: [0, 0.5] }),
    callout("deckL", "l", t("in_c_lowerDeck"), { at: [0.03, 0.5], tone: "low" }),
    callout("top:3", "r", t("in_c_upper"), { tone: "up" }),
    callout("bar", "r", t("in_c_bar"), { at: [1, 0.5] }),
    callout("low:3:2", "r", t("in_c_lower"), { tone: "low" }),
    callout("rod:1", "b", t("in_c_hund")),
    callout("rod:2", "b", t("in_c_tens")),
    callout("rod:3", "b", t("in_c_ones")),
  ];
}

export function introExplainer(lang) {
  const t = (k) => P(k, lang);
  const E = [0, 0, 0, 0];
  const glossary = [
    [t("in_t_frame"), t("in_t_frame_b")],
    [t("in_t_decks"), t("in_t_decks_b")],
    [t("in_t_bar"), t("in_t_bar_b")],
    [t("in_t_rod"), t("in_t_rod_b")],
    [t("in_t_upper"), t("in_t_upper_b")],
    [t("in_t_lower"), t("in_t_lower_b")],
  ];
  const MAP = { s: 0.7, sNarrow: 0.6, rx: 6, ry: -10 };
  return {
    id: "intro",
    title: t("in_title"),
    rods: 4,
    scenes: [
      { ...SLIDE(1, { to: [0, 1, 2, 3] }, lang), cam: { s: 1, rx: 6, ry: -12 } },
      SLIDE(2, { to: E, art: artNames(lang) }, lang),
      SLIDE(3, { to: E, art: artHistory(lang) }, lang),
      { ...SLIDE("ov", { to: E }, lang), cam: MAP, labels: mapLabels(lang), hidePlaces: true },
      {
        ...SLIDE("deck", { to: E, hl: { frame: true, deck: "both" } }, lang),
        cam: { focus: ["frame"], fit: 0.6, rx: 5, ry: 10 },
        labels: [callout("deckU", "l", t("in_c_upperDeck"), { at: [0.03, 0.5], tone: "up" }), callout("frame", "l", t("in_c_frame"), { at: [0, 0.5] }), callout("deckL", "l", t("in_c_lowerDeck"), { at: [0.03, 0.5], tone: "low" }), callout("bar", "r", t("in_c_bar"), { at: [1, 0.5] })],
        hidePlaces: true,
      },
      {
        ...SLIDE("bar", { to: E, hl: { bar: true, dot: true } }, lang),
        cam: { s: 0.98, sNarrow: 0.9, rx: 10, ry: -8 },
        labels: [callout("bar", "t", t("in_c_bar"), { at: [0.4, 0.5] }), callout("dot", "b", t("in_c_dot"))],
        hidePlaces: true,
      },
      {
        ...SLIDE("rods", { to: E, hl: { cols: [1, 2, 3] } }, lang),
        cam: { focus: ["frame"], fit: 0.66, rx: 4, ry: -10 },
        labels: [callout("rod:1", "b", t("in_c_hund")), callout("rod:2", "b", t("in_c_tens")), callout("rod:3", "b", t("in_c_ones"))],
        hidePlaces: true,
      },
      {
        ...SLIDE("up", { from: E, to: [0, 0, 0, 5], hl: { beads: [0, 1, 2, 3].map((c) => [c, "top"]) }, math: "1 \u00D7 5 = 5" }, lang),
        cam: { focus: ["deckU"], fit: 0.8, max: 1.35, rx: 8, ry: -10 },
        labels: [callout("top:3", "t", t("in_c_upperVal"), { tone: "up", at: [0.5, 0] })],
        hidePlaces: true,
      },
      {
        ...SLIDE("low", { from: E, to: [0, 0, 0, 4], hl: { beads: [0, 1, 2, 3].map((i) => [3, "low", i]) }, math: "1 + 1 + 1 + 1 = 4" }, lang),
        cam: { focus: ["deckL"], fit: 0.8, max: 1.35, rx: -6, ry: -10 },
        labels: [callout("low:3:3", "b", t("in_c_lowerVal"), { tone: "low", at: [0.5, 1] })],
        hidePlaces: true,
      },
      { ...SLIDE(8, { to: E, table: glossary }, lang), cam: MAP, labels: mapLabels(lang), hidePlaces: true },
      { ...SLIDE(9, { from: [0, 0, 0, 7], to: [0, 3, 4, 7], hl: { labels: [1, 2, 3] }, math: "300 + 40 + 7 = 347" }, lang), cam: { s: 1, rx: 6, ry: -8 } },
      SLIDE(10, { from: E, to: [0, 0, 4, 6], math: "46" }, lang),
      SLIDE(11, { from: [0, 0, 4, 6], to: [0, 0, 7, 6], math: "46 + 30 = 76" }, lang),
      SLIDE(12, { from: [0, 0, 7, 6], to: [0, 0, 8, 4], math: "76 + 8 = 84" }, lang),
      SLIDE(13, { to: [0, 0, 8, 4], math: "46 + 38 = 84" }, lang),
      SLIDE(14, { to: E, art: artWhy(lang) }, lang),
      SLIDE(15, { to: E, art: artMind() }, lang),
      SLIDE(16, { to: E, art: artRoad(lang) }, lang),
    ],
  };
}
