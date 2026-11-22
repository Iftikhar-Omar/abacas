// File: explainers.js
// Directory: src/
// Small illustrated "ideas" played on the SVG abacus: the parts of the abacus, place value,
// little friends, big friends, and borrowing a ten. They are plain scene lists, so the lesson player
// plays them with exactly the same viewer it uses for worked examples. They also power the
// "Helpful ideas" shelf on the Learn page and the "?" buttons next to friend moves.

import { P } from "./player-i18n.js";

const minus = "−";

const sc = (id, n, { from, to, hl, math, table, friend } = {}, lang) => ({
  title: P(`ex_${id}_${n}_t`, lang),
  body: P(`ex_${id}_${n}_b`, lang),
  math: math || "",
  from: from || to,
  to: to || from,
  hl,
  table,
  friend,
  boardable: true,
});

const BUILD = {
  parts: (lang) => ({
    rods: 3,
    scenes: [
      sc("parts", 1, { to: [0, 0, 0], hl: { cols: [0, 1, 2] } }, lang),
      sc("parts", 2, { to: [0, 0, 0], hl: { bar: true } }, lang),
      sc("parts", 3, { from: [0, 0, 0], to: [0, 0, 5], hl: { beads: [[2, "top"]] }, math: "5" }, lang),
      sc("parts", 4, { from: [0, 0, 0], to: [0, 0, 0], hl: { beads: [[2, "low", 0], [2, "low", 1], [2, "low", 2], [2, "low", 3]] }, math: "1 + 1 + 1 + 1" }, lang),
      sc("parts", 5, { from: [0, 0, 0], to: [0, 0, 3], math: "1 + 1 + 1 = 3" }, lang),
      sc("parts", 6, { from: [0, 0, 0], to: [0, 0, 7], math: "5 + 2 = 7" }, lang),
      sc("parts", 7, { to: [0, 0, 9], math: "5 + 4 = 9" }, lang),
      sc("parts", 8, { from: [0, 0, 9], to: [0, 2, 6], hl: { cols: [1, 2] }, math: "20 + 6 = 26" }, lang),
    ],
  }),
  places: (lang) => ({
    rods: 3,
    scenes: [
      sc("places", 1, { from: [0, 0, 0], to: [0, 0, 4], hl: { labels: [2] }, math: "4 × 1 = 4" }, lang),
      sc("places", 2, { from: [0, 0, 4], to: [0, 4, 0], hl: { labels: [1] }, math: "4 × 10 = 40" }, lang),
      sc("places", 3, { from: [0, 4, 0], to: [4, 0, 0], hl: { labels: [0] }, math: "4 × 100 = 400" }, lang),
      sc("places", 4, { from: [4, 0, 0], to: [1, 2, 3], math: "100 + 20 + 3 = 123" }, lang),
      sc("places", 5, { from: [1, 2, 3], to: [0, 3, 0], hl: { cols: [2] }, math: "3 × 10 + 0 = 30" }, lang),
    ],
  }),
  little: (lang) => ({
    rods: 3,
    scenes: [
      sc("little", 1, { to: [0, 0, 3], hl: { beads: [[2, "low", 3]] }, math: "3 + 4" }, lang),
      sc("little", 2, { to: [0, 0, 3], friend: "little", math: `4 = 5 ${minus} 1`, table: [["+4", `+5 ${minus} 1`], ["+3", `+5 ${minus} 2`], ["+2", `+5 ${minus} 3`], ["+1", `+5 ${minus} 4`]] }, lang),
      sc("little", 3, { from: [0, 0, 3], to: [0, 0, 8], math: "3 + 5 = 8" }, lang),
      sc("little", 4, { from: [0, 0, 8], to: [0, 0, 7], math: `8 ${minus} 1 = 7` }, lang),
      sc("little", 5, { to: [0, 0, 7], math: "3 + 4 = 7" }, lang),
    ],
  }),
  big: (lang) => ({
    rods: 3,
    scenes: [
      sc("big", 1, { to: [0, 0, 8], hl: { cols: [2] }, math: "8 + 7" }, lang),
      sc("big", 2, { to: [0, 0, 8], friend: "big", math: `7 = 10 ${minus} 3`, table: [9, 8, 7, 6, 5, 4, 3, 2, 1].map((d) => [`+${d}`, `+10 ${minus} ${10 - d}`]) }, lang),
      sc("big", 3, { from: [0, 0, 8], to: [0, 0, 5], math: `8 ${minus} 3 = 5` }, lang),
      sc("big", 4, { from: [0, 0, 5], to: [0, 1, 5], hl: { labels: [1] }, math: "5 + 10 = 15" }, lang),
      sc("big", 5, { to: [0, 1, 5], math: "8 + 7 = 15" }, lang),
    ],
  }),
  borrow: (lang) => ({
    rods: 3,
    scenes: [
      sc("borrow", 1, { to: [0, 1, 5], hl: { cols: [2] }, math: `15 ${minus} 7` }, lang),
      sc("borrow", 2, { to: [0, 1, 5], friend: "borrow", math: `${minus}7 = ${minus}10 + 3` }, lang),
      sc("borrow", 3, { from: [0, 1, 5], to: [0, 0, 5], hl: { labels: [1] }, math: `15 ${minus} 10 = 5` }, lang),
      sc("borrow", 4, { from: [0, 0, 5], to: [0, 0, 8], math: "5 + 3 = 8" }, lang),
      sc("borrow", 5, { to: [0, 0, 8], math: `15 ${minus} 7 = 8` }, lang),
    ],
  }),
};

export const explainerIds = ["parts", "places", "little", "big", "borrow"];

export function explainerById(id, lang) {
  const key = id === "borrow" || id === "borrowTen" ? "borrow" : id;
  if (!BUILD[key]) return null;
  const b = BUILD[key](lang);
  return { id: key, title: P(`ex_${key}_title`, lang), blurb: P(`ex_${key}_blurb`, lang), ...b };
}

/** Which explainer introduces a lesson part (once per lesson). */
export function explainerFor(part, lang, seen = new Set()) {
  const id = part?.id;
  const skill = part?.skill;
  let key = null;
  if (id === "zero" || id === "count" || id === "place") key = "parts";
  else if (id === "tens") key = "places";
  else if (skill === "five" && id !== "five-mix") key = "little";
  else if (skill === "ten") key = "big";
  else if (skill === "borrow" && id !== "borrow-chain") key = "borrow";
  if (!key || seen.has(key)) return null;
  return explainerById(key, lang);
}
