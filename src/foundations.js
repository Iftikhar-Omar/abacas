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
