// File: foundations.js
// Directory: src/
// Hand-written, child-first scripts for the first starter lessons. Young learners meet the abacus by
// TOUCHING it within seconds, are never asked to read long text, and are never "wrong" while exploring.
//
// Step kinds (played by the lesson player):
//   say  - Bo says one short thing; the board may show a picture (from -> to) with highlights.
//   do   - the learner moves beads. `free` = any move is fine; otherwise they must reach `target`.
//   ask  - a tap-the-answer question about what the board shows (no typing for pre-readers).
// `digits` are one number per stick, most significant first.

export const foundations = {
  "normal-beads": {
    id: "b",
    rods: 1,
    steps: [
      { kind: "say", hl: { cols: [0] } },
      { kind: "do", free: true, to: [1], hint: { beads: [[0, "low", 0]] } },
      { kind: "say", to: [1], hl: { bar: true }, math: "1" },
      { kind: "do", target: [3], hintMove: true },
      { kind: "ask", show: [3], choices: [2, 3, 4], answer: 3 },
      { kind: "do", target: [0], hintMove: true },
      { kind: "do", target: [4], hintMove: true },
      { kind: "say", show: [4], math: "1 + 1 + 1 + 1 = 4" },
    ],
  },
  "normal-bigbead": {
    id: "g",
    rods: 1,
    steps: [
      { kind: "say", show: [0], hl: { beads: [[0, "top"]] } },
      { kind: "do", target: [5], hintMove: true, math: "5" },
      { kind: "do", target: [7], hintMove: true, math: "5 + 2 = 7" },
      { kind: "ask", show: [8], choices: [7, 8, 9], answer: 8 },
      { kind: "do", target: [9], hintMove: true, math: "5 + 4 = 9" },
      { kind: "ask", show: [6], choices: [5, 6, 7], answer: 6 },
      { kind: "do", target: [0], hintMove: true },
      { kind: "say", show: [0] },
    ],
  },
  "normal-moves": {
    id: "m",
    rods: 1,
    steps: [
      { kind: "say", show: [2], math: "2" },
      { kind: "do", target: [4], hintMove: true, math: "2 + 2 = 4" },
      { kind: "do", target: [3], hintMove: true, math: "4 \u2212 1 = 3" },
      { kind: "do", target: [1], hintMove: true, math: "3 \u2212 2 = 1" },
      { kind: "ask", show: [3], choices: [3, 4, 5], answer: 4, math: "3 + 1 = ?" },
      { kind: "do", target: [4], hintMove: true, math: "3 + 1 = 4" },
      { kind: "say", show: [4] },
    ],
  },
  "normal-five": {
    id: "f",
    rods: 1,
    steps: [
      { kind: "say", show: [3], hl: { beads: [[0, "low", 3]] }, math: "3 + 4" },
      { kind: "say", show: [3], math: "4 = 5 \u2212 1" },
      { kind: "do", target: [8], hintMove: true, math: "3 + 5 = 8" },
      { kind: "do", target: [7], hintMove: true, math: "8 \u2212 1 = 7" },
      { kind: "ask", show: [2], choices: [5, 6, 7], answer: 6, math: "2 + 4 = ?" },
      { kind: "do", target: [6], loose: true, hintMove: true, math: "+4 = +5 \u2212 1" },
      { kind: "say", show: [6], math: "+4 = +5 \u2212 1    +3 = +5 \u2212 2" },
      { kind: "do", from: [5], target: [3], loose: true, hintMove: true, math: "5 \u2212 2 = 3" },
      { kind: "say", show: [3] },
    ],
  },
  "normal-ten": {
    id: "n",
    rods: 2,
    steps: [
      { kind: "say", show: [0, 8], hl: { cols: [1] }, math: "8 + 7" },
      { kind: "say", show: [0, 8], math: "+7 = +10 \u2212 3" },
      { kind: "do", target: [0, 5], hintMove: true, math: "8 \u2212 3 = 5" },
      { kind: "do", target: [1, 5], hintMove: true, math: "8 + 7 = 15" },
      { kind: "ask", show: [0, 6], choices: [13, 14, 15], answer: 14, math: "6 + 8 = ?" },
      { kind: "do", target: [1, 4], loose: true, hintMove: true, math: "+8 = +10 \u2212 2" },
      { kind: "say", show: [1, 4], math: "7 + 3 = 10" },
      { kind: "say", show: [1, 4] },
    ],
  },
  "normal-borrow": {
    id: "r",
    rods: 2,
    keepParts: true,
    steps: [
      { kind: "say", show: [1, 2], hl: { cols: [1] }, math: "12 \u2212 8" },
      { kind: "say", show: [1, 2], math: "\u22128 = \u221210 + 2" },
      { kind: "do", target: [0, 2], hintMove: true, math: "12 \u2212 10 = 2" },
      { kind: "do", target: [0, 4], hintMove: true, math: "12 \u2212 8 = 4" },
      { kind: "ask", show: [1, 5], choices: [7, 8, 9], answer: 8, math: "15 \u2212 7 = ?" },
      { kind: "do", target: [0, 8], loose: true, hintMove: true, math: "15 \u2212 7 = 8" },
      { kind: "say", show: [0, 8], math: "\u22127 = \u221210 + 3" },
    ],
  },
  "normal-places": {
    id: "t",
    rods: 2,
    keepParts: true,
    steps: [
      { kind: "say", show: [0, 0], hl: { cols: [1], labels: [1] } },
      { kind: "do", target: [0, 4], hintMove: true },
      { kind: "say", from: [0, 9], to: [1, 0], hl: { labels: [0] }, math: "9 + 1 = 10" },
      { kind: "say", from: [0, 0], to: [1, 0], hl: { cols: [0], labels: [0] }, math: "1 ten = 10" },
      { kind: "do", target: [1, 0], hintMove: true, math: "10" },
      { kind: "do", target: [2, 3], hintMove: true, math: "20 + 3 = 23" },
      { kind: "ask", show: [3, 5], choices: [35, 53, 8], answer: 35 },
      { kind: "do", target: [4, 0], hintMove: true, math: "40" },
    ],
  },
};

export const scriptFor = (lessonId) => foundations[lessonId] || null;
