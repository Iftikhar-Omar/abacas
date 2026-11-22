// File: fractions.js
// Directory: src/
// Picture-first, step-by-step solutions for fraction sums: a/b + c/d, a/b − c/d, a/b × c/d, a/b ÷ c/d,
// and "make a/b simpler". Each step carries `fractions` (drawn as bars by the player) so a child can SEE
// why the bottoms must match, why two halves make one whole, and so on.

import { P } from "./player-i18n.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const minus = "−";
const times = "×";
const divide = "÷";

const OPS = { "+": "+", "-": "-", "−": "-", "*": "*", "×": "*", "/": "/", "÷": "/" };

/** Recognise "a/b op c/d" (second fraction may be in brackets), or a lone "a/b" when simplify is true. */
export function parseFractionSum(expr, { simplify = false } = {}) {
  const s = String(expr).replace(/\s+/g, "");
  let m = s.match(/^(\d+)\/(\d+)([+\-−*×/÷])\(?(\d+)\/(\d+)\)?$/);
  if (m) {
    const [a, b, c, d] = [m[1], m[2], m[4], m[5]].map(Number);
    if (!b || !d || a > 999 || b > 999 || c > 999 || d > 999) return null;
    return { a, b, op: OPS[m[3]], c, d };
  }
  m = s.match(/^(\d+)\/(\d+)$/);
  if (simplify && m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return b && a < 1000 && b < 1000 ? { a, b, op: null } : null;
  }
  return null;
}

const frac = (n, d) => `${n}/${d}`;
const dec = (n, d) => {
  const v = n / d;
  return Number.isInteger(v) ? String(v) : String(+v.toFixed(4));
};

/** Chains such as 1 + 2/3 + 1/6 or 3 + 1/4 - 1/2 (whole numbers and fractions joined by + and -). */
function parseChain(expr) {
  const s = String(expr).replace(/\s+/g, "").replace(/\u2212/g, "-");
  if (!/^[\d/+\-()]+$/.test(s) || !/\d\/\d/.test(s)) return null;
  const parts = s.replace(/[()]/g, "").match(/[+-]?[^+-]+/g);
  if (!parts || parts.length < 2 || parts.length > 5) return null;
  const terms = [];
  for (const raw of parts) {
    const sign = raw.startsWith("-") ? -1 : 1;
    const body = raw.replace(/^[+-]/, "");
    const m = body.match(/^(\d+)(?:\/(\d+))?$/);
    if (!m) return null;
    const d = m[2] ? Number(m[2]) : 1;
    if (!d || Number(m[1]) > 999 || d > 999) return null;
    terms.push({ sign, n: Number(m[1]), d });
  }
  return terms;
}

function chainScenes(terms, lang) {
  const L = terms.reduce((acc, t) => lcm(acc, t.d), 1);
  const scenes = [];
  const add = (title, body, math, fractions, type = "math") => scenes.push({ id: scenes.length, type, title, body, math, fractions, boardable: false, changes: false, group: 0, first: 0, last: 0 });
  const label = (t, i) => `${i ? (t.sign > 0 ? "+" : minus) + " " : t.sign < 0 ? minus : ""}${t.d === 1 ? t.n : frac(t.n, t.d)}`;
  add(P("fr_chain", lang), P("fr_chainB", lang), terms.map(label).join(" "), terms.filter((t) => t.d > 1).map((t) => ({ n: t.n, d: t.d })));
  const conv = terms.map((t) => ({ ...t, top: t.n * (L / t.d) }));
  add(P("fr_common", lang), P("fr_commonAll", lang, { L }), `${P("fr_lcm", lang)} ${L}`, undefined);
  add(P("fr_convert", lang), P("fr_convertAll", lang, { L }), conv.map((t) => `${t.d === 1 ? t.n : frac(t.n, t.d)} = ${frac(t.top, L)}`).join("  \u00B7  "), conv.map((t) => ({ n: t.top, d: L })).slice(0, 4));
  const total = conv.reduce((acc, t) => acc + t.sign * t.top, 0);
  if (total < 0) return null;
  add(P("fr_addTops", lang), P("fr_combineB", lang, { L }), `${conv.map((t, i) => `${i ? (t.sign > 0 ? "+ " : `${minus} `) : t.sign < 0 ? minus : ""}${t.top}`).join(" ")} = ${total}   \u2192   ${frac(total, L)}`, [{ n: total, d: L }]);
  const g = gcd(total, L) || 1;
  const rn = total / g;
  const rd = L / g;
  if (g > 1 && total > 0) add(P("fr_simplify", lang, { n: total, d: L, g }), P("fr_simplifyB", lang, { n: total, d: L, g, rn, rd }), `${frac(total, L)} = ${frac(rn, rd)}`, [{ n: total, d: L }, { n: rn, d: rd }]);
  const whole = rd === 1;
  const mixed = rd > 1 && rn > rd ? `${Math.floor(rn / rd)} ${frac(rn % rd, rd)}` : null;
  const shown = rn === 0 ? "0" : whole ? String(rn) : frac(rn, rd);
  add(P("fr_answer", lang, { r: shown }), whole ? P("fr_answerWhole", lang) : mixed ? P("fr_answerMixed", lang, { m: mixed, v: dec(rn, rd) }) : P("fr_answerDec", lang, { v: dec(rn, rd) }), shown, [{ n: rn, d: rd || 1 }], "result");
  return { scenes, result: shown };
}

/** @returns {{scenes:object[], result:string}|null} */
export function fractionScenes(expr, lang, opts = {}) {
  const f = parseFractionSum(expr, opts);
  if (!f) {
    const chain = parseChain(expr);
    return chain ? chainScenes(chain, lang) : null;
  }
  const { a, b, c, d } = f;
  const scenes = [];
  const add = (title, body, math, fractions) => scenes.push({ id: scenes.length, type: "math", title, body, math, fractions, boardable: false, group: 0, first: scenes.length, last: scenes.length });
  const opWord = { "+": "add", "-": "take", "*": "times", "/": "share" };

  let rn;
  let rd;
  if (!f.op) {
    // simplify a lone fraction
    const g = gcd(a, b);
    add(P("fr_simp0", lang, { a, b }), P("fr_simp0b", lang), frac(a, b), [{ n: a, d: b }]);
    rn = a / g;
    rd = b / g;
    if (g > 1) add(P("fr_simplify", lang, { n: a, d: b, g }), P("fr_simplifyB", lang, { n: a, d: b, g, rn, rd }), `${frac(a, b)} = ${frac(rn, rd)}`, [{ n: a, d: b }, { n: rn, d: rd }]);
    else add(P("fr_alreadySimple", lang, { a, b }), P("fr_alreadySimpleB", lang, { g: 1 }), frac(a, b), [{ n: a, d: b }]);
  } else if (f.op === "+" || f.op === "-") {
    const L = lcm(b, d);
    const a2 = a * (L / b);
    const c2 = c * (L / d);
    add(P("fr_start", lang, { a, b, c, d, op: f.op === "+" ? "+" : minus }), P("fr_startB", lang), `${frac(a, b)} ${f.op === "+" ? "+" : minus} ${frac(c, d)}`, [{ n: a, d: b }, { n: c, d }]);
    if (b !== d) {
      add(P("fr_common", lang), P("fr_commonB", lang, { b, d, L }), `${P("fr_lcm", lang)} ${L}`, [{ n: a, d: b }, { n: c, d }]);
      add(P("fr_convert", lang), P("fr_convertB", lang, { a, b, a2, c, d, c2, L }), `${frac(a, b)} = ${frac(a2, L)}  \u00B7  ${frac(c, d)} = ${frac(c2, L)}`, [{ n: a, d: b }, { n: a2, d: L }, { n: c, d }, { n: c2, d: L }]);
    }
    const t = f.op === "+" ? a2 + c2 : a2 - c2;
    if (t < 0) return null; // negative answers are for the signed-numbers lessons
    add(P(f.op === "+" ? "fr_addTops" : "fr_takeTops", lang), P("fr_combineB", lang, { L }), `${a2} ${f.op === "+" ? "+" : minus} ${c2} = ${t}   →   ${frac(t, L)}`, [{ n: t, d: L }]);
    const g = gcd(t, L) || 1;
    rn = t / g;
    rd = L / g;
    if (g > 1 && t > 0) add(P("fr_simplify", lang, { n: t, d: L, g }), P("fr_simplifyB", lang, { n: t, d: L, g, rn, rd }), `${frac(t, L)} = ${frac(rn, rd)}`, [{ n: t, d: L }, { n: rn, d: rd }]);
  } else {
    // multiply / divide
    let x = c;
    let y = d;
    add(P("fr_start", lang, { a, b, c, d, op: f.op === "*" ? times : divide }), P("fr_startB", lang), `${frac(a, b)} ${f.op === "*" ? times : divide} ${frac(c, d)}`, [{ n: a, d: b }, { n: c, d }]);
    if (f.op === "/") {
      if (!c) return null;
      add(P("fr_flip", lang), P("fr_flipB", lang, { c, d }), `${divide} ${frac(c, d)}   →   ${times} ${frac(d, c)}`, [{ n: c, d }, { n: d, d: c }]);
      x = d;
      y = c;
    }
    const n = a * x;
    const m = b * y;
    add(P("fr_mul", lang), P("fr_mulB", lang, { a, x, n, b, y, m }), `${a} ${times} ${x} = ${n}     ${b} ${times} ${y} = ${m}`, [{ n, d: m }]);
    const g = gcd(n, m) || 1;
    rn = n / g;
    rd = m / g;
    if (g > 1 && n > 0) add(P("fr_simplify", lang, { n, d: m, g }), P("fr_simplifyB", lang, { n, d: m, g, rn, rd }), `${frac(n, m)} = ${frac(rn, rd)}`, [{ n, d: m }, { n: rn, d: rd }]);
  }
  void opWord;
  const whole = rd === 1;
  const mixed = rd > 1 && rn > rd ? `${Math.floor(rn / rd)} ${frac(rn % rd, rd)}` : null;
  const answer = whole ? String(rn) : frac(rn, rd);
  const shown = rn === 0 ? "0" : answer;
  add(P("fr_answer", lang, { r: shown }), whole ? P("fr_answerWhole", lang) : mixed ? P("fr_answerMixed", lang, { m: mixed, v: dec(rn, rd) }) : P("fr_answerDec", lang, { v: dec(rn, rd) }), shown, [{ n: rn, d: rd || 1 }]);
  scenes.at(-1).type = "result";
  return { scenes, result: shown };
}

/** HTML for a row of fraction bars (equal parts, shaded = the fraction). */
export function fractionBarsHTML(list) {
  return `<div class="frbars" dir="ltr">${list
    .map(({ n, d }) => {
      const cells = d >= 1 && d <= 24 ? Math.max(d, 1) : 0;
      const whole = cells && n > d ? Math.ceil(n / d) : 1;
      const bars = Array.from({ length: whole }, (_, w) => `<div class="frbar">${Array.from({ length: cells }, (_, i) => `<i class="${w * cells + i < n ? "on" : ""}"></i>`).join("")}</div>`).join("");
      return `<div class="frcard"><b>${n}/${d}</b>${cells ? bars : ""}</div>`;
    })
    .join("")}</div>`;
}

/** "25% * 80" / "25% of 80": percent as a friendly fraction of a whole. */
export function percentScenes(expr, lang) {
  const m = String(expr).replace(/\s+/g, "").match(/^(\d+(?:\.\d+)?)%(?:\*|\u00D7|of)?(\d+(?:\.\d+)?)$/i);
  if (!m) return null;
  const p = Number(m[1]);
  const n = Number(m[2]);
  const ans = +((p * n) / 100).toFixed(8);
  const scenes = [];
  const add = (title, body, math, fractions, type = "math") => scenes.push({ id: scenes.length, type, title, body, math, fractions, boardable: false, changes: false, group: 0, first: 0, last: 0 });
  add(P("pc_what", lang, { p, n }), P("pc_whatB", lang, { p }), `${p}% = ${p}/100`, p <= 100 && Number.isInteger(p) ? [{ n: p, d: 100 }] : undefined);
  if (Number.isInteger(p) && p > 0) {
    const g = gcd(p, 100);
    const rn = p / g;
    const rd = 100 / g;
    add(P("pc_simp", lang), P("pc_simpB", lang, { p, rn, rd }), `${p}/100 = ${rn}/${rd}`, rd <= 24 ? [{ n: rn, d: rd }] : undefined);
    if (Number.isInteger(n) && n % rd === 0) {
      const x = n / rd;
      add(P("pc_find", lang, { rn, rd, n }), P("pc_findB", lang, { n, rd, x }), `${n} ${divide} ${rd} = ${x}`);
      if (rn > 1) add(P("pc_findMul", lang, { rn }), P("pc_findMulB", lang, { x, rn, ans }), `${x} ${times} ${rn} = ${ans}`);
    } else add(P("pc_one", lang), P("pc_oneB", lang, { n, p, m: +(n * p).toFixed(8), ans }), `${n} ${times} ${p} ${divide} 100 = ${ans}`);
  } else add(P("pc_one", lang), P("pc_oneB", lang, { n, p, m: +(n * p).toFixed(8), ans }), `${n} ${times} ${p} ${divide} 100 = ${ans}`);
  add(P("sc_result", lang, { r: ans }), P("sc_resultBody", lang), String(ans), undefined, "result");
  return { scenes, result: String(ans) };
}
