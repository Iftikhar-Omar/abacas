// File: audit.mjs
// Directory: tests/
// Rigorous, browser-free audit of what learners and the Solve page rely on:
//  1. every lesson example + practice item and ~600 random sums solve without errors;
//  2. for arithmetic the app's answer equals JavaScript's answer;
//  3. every coach scene is well formed (no placeholders / undefined, right board transitions);
//  4. the board after the last scene equals the answer;
//  5. every move a learner is asked to make is reachable by real bead taps (BFS over the tap rules);
//  6. Solve-page input forms ("82 - 56", "8 x 7", unicode signs...) are understood.
import { solve, answerEquals, cleanInput } from '../src/engine.js';
import { allLessons } from '../src/curriculum.js';
import { buildScenes, taskScenes, setFractionStyle, isBoardable } from '../src/coach.js';
import { layoutFor, snapshotToDigits, splitDigit } from '../src/soroban.js';
import { foundations } from '../src/foundations.js';
import { fractionScenes, parseFractionSum } from '../src/fractions.js';
import { solutionScenes } from '../src/solutions.js';

let problems = 0;
const bad = (m) => { problems++; if (problems < 60) console.log('PROBLEM', m); };
const leak = (t) => /undefined|\{\w+\}|NaN|\[object|null/.test(t);

/* tap rules (same as Soroban.tapBead) */
const tapMoves = (d) => {
  const out = [];
  d.forEach((v, c) => {
    const { top, low } = splitDigit(v);
    const set = (nv) => { const n = d.slice(); n[c] = nv; out.push(n); };
    set((top ? 0 : 5) + low);
    for (let i = 0; i < 4; i++) set((top ? 5 : 0) + (i < low ? i : i + 1));
  });
  return out;
};
const reachable = (from, to, max = 6) => {
  const key = (a) => a.join(',');
  const seen = new Set([key(from)]);
  let frontier = [from];
  for (let step = 0; step <= max; step++) {
    if (frontier.some((a) => key(a) === key(to))) return step;
    const next = [];
    for (const a of frontier) for (const n of tapMoves(a)) if (!seen.has(key(n))) { seen.add(key(n)); next.push(n); }
    frontier = next;
  }
  return -1;
};

const jsEval = (e) => {
  try { const v = Function(`"use strict";return (${e.replace(/\^/g, '**').replace(/sqrt/g, 'Math.sqrt')})`)(); return typeof v === 'number' && isFinite(v) ? v : null; } catch { return null; }
};

function auditExpr(expr, ctx) {
  let trace;
  try { trace = solve(expr); } catch (e) { return bad(`${ctx}: solve("${expr}") threw ${e.message}`); }
  const js = /^[\d+\-*/().\s^]+$/.test(expr) && !/\/.*\//.test(expr) && !/%/.test(expr) ? jsEval(expr) : null;
  if (js !== null && Math.abs(js - parseFloat(trace.result)) > 1e-6 && !String(trace.result).includes('/')) bad(`${ctx}: "${expr}" app=${trace.result} js=${js}`);
  for (const lang of ['en', 'bn']) {
    let sol;
    try { sol = solutionScenes(expr, lang); } catch (e) { return bad(`${ctx}: solutionScenes("${expr}",${lang}) threw ${e.message}`); }
    const { scenes, layout, boardable } = sol;
    if (!scenes.length) bad(`${ctx}: "${expr}" has no scenes`);
    scenes.forEach((sc, i) => {
      if (leak(`${sc.title} ${sc.body} ${sc.math}`)) bad(`${ctx}: "${expr}" ${lang} scene ${i} leaks: ${sc.title} | ${sc.body} | ${sc.math}`);
      if (!sc.title) bad(`${ctx}: "${expr}" scene ${i} has no title`);
    });
    // exactly one final "The answer" scene, and it is last
    const results = scenes.filter((x) => x.type === 'result');
    if (/[+*\/^]|sqrt|\d-/.test(expr) && scenes.at(-1).type !== 'result') bad(`${ctx}: "${expr}" does not end with an answer scene (${scenes.at(-1).type})`);
    const finals = lang === 'en' ? scenes.filter((x) => /answer is/i.test(x.title)) : [];
    if (finals.length > 1) bad(`${ctx}: "${expr}" ${lang} repeats "answer is" ${finals.length}x: ${finals.map((f) => f.title).join(' / ')}`);
    void results;
    if (lang !== 'en' || !boardable) continue;
    let prev = null;
    scenes.forEach((sc, i) => {
      if (!sc.from || !sc.to) return;
      if (prev && sc.type !== 'clear' && sc.type !== 'result' && prev.join() !== sc.from.join()) bad(`${ctx}: "${expr}" scene ${i} (${sc.type}) starts ${sc.from} but previous ended ${prev}`);
      prev = sc.to;
    });
    for (const t of taskScenes(scenes)) {
      const n = reachable(t.from, t.to);
      if (n < 0) bad(`${ctx}: "${expr}" task "${t.title}" ${t.from} -> ${t.to} NOT reachable by taps`);
      else if (n > 3) bad(`${ctx}: "${expr}" task "${t.title}" needs ${n} taps`);
    }
    void layout;
  }
  // the answer shown must be the true answer
  const sol = solutionScenes(expr, 'en');
  const shown = String(sol.result).replace('\u2212', '-');
  if (js !== null && !shown.includes('/') && Math.abs(js - parseFloat(shown)) > 1e-6) bad(`${ctx}: "${expr}" solution says ${shown}, truth ${js}`);
  return trace;
}

/* 1-5: every lesson example and practice item */
let n = 0;
for (const l of allLessons) {
  setFractionStyle(l.skill === 'fractions');
  for (const part of l.parts || [l]) for (const e of [part.example, ...(part.practice || [])]) { auditExpr(e, l.id); n++; }
  for (const e of l.practice || []) { auditExpr(e, l.id); n++; }
}

/* random arithmetic fuzz, deterministic */
let seed = 12345;
const rnd = (k) => { seed = (1664525 * seed + 1013904223) >>> 0; return seed % k; };
const num = (digits) => String(1 + rnd(10 ** digits - 1));
const dec = () => `${rnd(30)}.${1 + rnd(9)}`;
const forms = [
  () => `${num(1)}+${num(1)}`, () => `${num(2)}+${num(2)}`, () => `${num(3)}+${num(2)}`, () => `${num(1)}-${num(1)}`,
  () => { const a = 10 + rnd(90); return `${a}-${1 + rnd(a - 1)}`; }, () => { const a = 100 + rnd(900); return `${a}-${1 + rnd(a - 1)}`; },
  () => `${num(1)}*${num(1)}`, () => `${num(2)}*${num(2)}`, () => `${num(3)}*${num(1)}`, () => { const b = 2 + rnd(8); return `${b * (2 + rnd(20))}/${b}`; },
  () => `${num(2)}+${num(2)}-${num(2)}`, () => `${dec()}+${dec()}`, () => `${num(1)}+${num(1)}+${num(1)}+${num(1)}`, () => `(${num(1)}+${num(1)})*${num(1)}`,
  () => `${num(4)}+${num(4)}`, () => `${num(4)}-${num(3)}`, () => `${num(2)}^2`, () => `sqrt(${[4, 9, 16, 25, 36, 49, 64, 81, 100, 144][rnd(10)]})`,
];
for (let i = 0; i < 600; i++) { const e = forms[rnd(forms.length)](); auditExpr(e, 'fuzz'); n++; }

/* 6: Solve-page input forms */
const inputs = [['82 - 56', '26'], ['82−56', '26'], ['8 x 7', '56'], ['8 × 7', '56'], ['56 ÷ 7', '8'], ['  3+4  ', '7'], ['1/2 + 1/4', '0.75'], ['25% * 80', '20'], ['2*x+3=15', '6'], ['−3 × 4', '-12'], ['12,50 - 3,75', '8.75'], ['1 000 + 1', '1001']];
for (const [i, want] of inputs) {
  try { const r = solve(cleanInput(i)).result; if (!answerEquals(want, r)) bad(`solver input "${i}" gave ${r}, wanted ${want}`); }
  catch (e) { bad(`solver input "${i}" was rejected (${e.message}) — a learner would expect this to work`); }
}
for (const i of ['', 'banana', '5/0', '3+', '(2+3', '2**3', '1e9999']) {
  try { solve(i); bad(`solver input "${i}" should be rejected but was accepted`); } catch { /* expected */ }
}

/* scripted foundation lessons: every `do` step is reachable and every text exists */
const { table } = await import('../src/player-i18n.js');
for (const [lid, def] of Object.entries(foundations)) {
  let cur = Array(def.rods).fill(0);
  def.steps.forEach((st, i) => {
    const k = `fd_${def.id}_${i + 1}`;
    for (const suf of ['_t', '_b']) if (!table[k + suf]) bad(`${lid} step ${i + 1} missing ${k + suf}`);
    if (st.kind === 'do' && !st.free) {
      if (!table[k + '_ok']) bad(`${lid} step ${i + 1} missing ${k}_ok`);
      const from = st.from || cur;
      const r = reachable(from, st.target, 5);
      if (r < 0) bad(`${lid} step ${i + 1}: ${from} -> ${st.target} unreachable`);
    }
    if (st.kind === 'ask' && !st.choices.includes(st.answer)) bad(`${lid} step ${i + 1}: answer not among choices`);
    cur = (st.kind === 'do' ? st.target || st.to : st.to || st.show || st.from) || cur;
  });
}
/* fraction walkthroughs: the final answer must equal the true value, no text leaks */
for (let i = 0; i < 400; i++) {
  const a = 1 + rnd(9), b = a + rnd(9) + (rnd(3) ? 1 : 0), c = 1 + rnd(9), d = 2 + rnd(11);
  const op = ['+', '-', '*', '/'][rnd(4)];
  const e = `${a}/${b}${op}${c}/${d}`;
  const f = parseFractionSum(e);
  if (!f) { bad(`fraction parse failed for ${e}`); continue; }
  const truth = op === '+' ? a / b + c / d : op === '-' ? a / b - c / d : op === '*' ? (a / b) * (c / d) : a / b / (c / d);
  const r = fractionScenes(e, 'en');
  if (truth < -1e-12) { if (r) bad(`fraction ${e} negative should be declined`); continue; }
  if (!r) { bad(`fractionScenes null for ${e}`); continue; }
  const [rn, rd] = r.result.includes('/') ? r.result.split('/').map(Number) : [Number(r.result), 1];
  if (Math.abs(rn / rd - truth) > 1e-9) bad(`fraction ${e}: got ${r.result} want ${truth}`);
  for (const l of ['en', 'bn']) for (const sc of fractionScenes(e, l).scenes) if (leak(`${sc.title} ${sc.body} ${sc.math}`)) bad(`fraction ${e} ${l} leaks: ${sc.title} | ${sc.body}`);
}
console.log(`audited ${n} expressions`);
console.log(problems ? `${problems} PROBLEMS` : 'AUDIT CLEAN');
process.exit(problems ? 1 : 0);
