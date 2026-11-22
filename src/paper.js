// File: paper.js
// Directory: src/
// Hand-written, child-friendly walkthroughs for everything that is not a plain "+ and −" chain:
// multiplication (groups / partial products / decimals), long division, powers, square roots,
// brackets and order of operations, signed numbers and percentages.
// Whenever a step is just adding or subtracting, it is shown on the abacus (with little/big friends),
// so the board stays the star; the rest is told "on paper" in short, friendly lines.
// Returns {scenes, layout, boardable, result} or null when an expression is not covered.

import { buildScenes, pretty } from "./coach.js";
import { Q, calc, parse, solve } from "./engine.js";
import { P } from "./player-i18n.js";
import { layoutFor } from "./soroban.js";

const minus = "−";
const times = "×";
const divide = "÷";
const big = (q) => (q.d === 1n ? q.n : null);

/** Exact value -> text ("3.25", "−5", or "7/3" if it never ends). */
export function fmtQ(q) {
  const neg = q.n < 0n;
  const n = neg ? -q.n : q.n;
  let out = null;
  if (q.d === 1n) out = n.toString();
  else
    for (let s = 1; s <= 12; s++) {
      const t = n * 10n ** BigInt(s);
      if (t % q.d === 0n) {
        const v = (t / q.d).toString().padStart(s + 1, "0");
        out = `${v.slice(0, -s)}.${v.slice(-s)}`;
        break;
      }
    }
  if (out === null) out = `${n}/${q.d}`;
  return (neg ? minus : "") + out;
}
const abs = (q) => (q.n < 0n ? new Q(-q.n, q.d) : q);
const isNeg = (q) => q.n < 0n;
const toNum = (q) => Number(q.n) / Number(q.d);
const decimals = (q) => (q.d === 1n ? 0 : fmtQ(abs(q)).split(".")[1]?.length ?? 0);

const PREC = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };
const sym = { "+": "+", "-": minus, "*": times, "/": divide, "^": "^" };

/** Print a (partly reduced) AST. */
function show(node, red, parentPrec = 0, right = false, parentOp = "") {
  if (red.has(node)) {
    const v = fmtQ(red.get(node));
    return isNeg(red.get(node)) && parentPrec > 0 ? `(${v})` : v;
  }
  if (node.op === "num") return fmtQ(node.q);
  if (node.op === "neg") return `(${minus}${show(node.a, red, 4)})`;
  if (node.op === "sqrt") return `√(${show(node.a, red, 0)})`;
  const pr = PREC[node.op];
  const inner = `${show(node.a, red, pr, false, node.op)} ${sym[node.op]} ${show(node.b, red, pr, true, node.op)}`;
  const need = pr < parentPrec || (right && pr === parentPrec && (parentOp === "-" || parentOp === "/"));
  return need ? `(${inner})` : inner;
}

function value(node, memo) {
  if (memo.has(node)) return memo.get(node);
  let v;
  if (node.op === "num") v = node.q;
  else if (node.op === "neg") {
    const a = value(node.a, memo);
    v = new Q(-a.n, a.d);
  } else if (node.op === "sqrt") return null;
  else v = calc(node.op, value(node.a, memo), value(node.b, memo));
  memo.set(node, v);
  return v;
}

/** Post-order reductions of binary / sqrt nodes. */
function reductions(node, out = []) {
  if (node.op === "num") return out;
  if (node.op === "neg") return reductions(node.a, out);
  if (node.op === "sqrt") {
    reductions(node.a, out);
    out.push(node);
    return out;
  }
  reductions(node.a, out);
  reductions(node.b, out);
  out.push(node);
  return out;
}

export function paperSolution(expr, lang) {
  const src = String(expr);
  if (/[a-wyz=%]/i.test(src.replace(/sqrt/g, ""))) return null;
  const trigger = /[*/^()]|sqrt|(^|[(+\-*/])\s*-/.test(src); // plain + / - chains use the bead flow
  let ast;
  try {
    ast = parse(src);
  } catch {
    return null;
  }
  const steps = reductions(ast);
  if (!steps.length || steps.length > 8) return null;
  const memo = new Map();
  // a plain chain only needs this treatment when it dips below zero (the abacus can't show that)
  if (!trigger && !steps.some((st) => st.op !== "sqrt" && isNeg(value(st, memo)))) return null;
  const red = new Map();
  const pieces = []; // {kind:'paper'|'board', ...}
  const boardExprs = [];

  const mixed = new Set(steps.map((s) => PREC[s.op] ?? 4)).size > 1 || /\(/.test(src);
  if (mixed) pieces.push({ kind: "paper", title: P("pp_order", lang), body: P("pp_orderB", lang), math: pretty(show(ast, red)) });

  steps.forEach((node, idx) => {
    const last = idx === steps.length - 1;
    const a = node.op === "sqrt" ? value(node.a, memo) : value(node.a, memo);
    const b = node.op === "sqrt" ? null : value(node.b, memo);
    const r = node.op === "sqrt" ? sqrtQ(a) : value(node, memo);
    if (r === null || r === undefined) throw new Error("unsupported");
    red.set(node, r);
    const rest = last ? "" : show(ast, red);
    const tail = last ? "" : { rest: pretty(rest) };
    const made = stepPieces(node.op, a, b, r, lang, boardExprs, last);
    if (!made) throw new Error("unsupported");
    made.forEach((p) => pieces.push({ ...p, last, tail }));
  });
  return finish(pieces, boardExprs, lang, fmtQ(value(ast, memo) ?? sqrtQ(value(ast.a, memo))));
}

function sqrtQ(a) {
  const n = big(a);
  if (n === null || n < 0n) return null;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x * x === n ? new Q(x, 1n) : null;
}

const word = (op) => ({ "+": "add", "-": "take", "*": "times", "/": "share" })[op];

/** Pieces for one reduction. */
function stepPieces(op, a, b, r, lang, boardExprs, last) {
  const A = fmtQ(a);
  const B = b ? fmtQ(b) : "";
  const R = fmtQ(r);
  const signed = isNeg(a) || (b && isNeg(b));

  if (op === "sqrt") {
    return [
      { kind: "paper", title: P("pp_sqrt", lang, { a: A }), body: P("pp_sqrtB0", lang, { a: A }), math: `√${A}` },
      { kind: "paper", title: P("pp_sqrtR", lang, { r: R, a: A }), body: P("pp_sqrtRB", lang, { r: R, a: A }), math: `${R} ${times} ${R} = ${A}` },
    ];
  }
  if (signed) {
    const sa = isNeg(a);
    const sb = isNeg(b);
    const ma = fmtQ(abs(a));
    const mb = fmtQ(abs(b));
    const out = [];
    if (op === "+" || op === "-") {
      const eff = op === "-" ? !sb : sb; // is the number being added negative?
      out.push({ kind: "paper", title: P("pp_signs", lang), body: op === "-" ? P("pp_sgnSub", lang) : sa === eff ? P("pp_sgnSame", lang) : P("pp_sgnDiff", lang), math: `${A} ${sym[op]} ${isNeg(b) ? `(${B})` : B}` });
    } else if (op === "*" || op === "/") {
      out.push({ kind: "paper", title: P("pp_signs", lang), body: sa === sb ? P("pp_sgnMulSame", lang) : P("pp_sgnMulDiff", lang), math: `${A} ${sym[op]} ${sb ? `(${B})` : B}` });
      out.push({ kind: "paper", title: P("pp_sizes", lang), body: P("pp_sizesB", lang), math: `${ma} ${sym[op]} ${mb} = ${fmtQ(abs(r))}` });
    } else return null;
    out.push({ kind: "paper", title: P("pp_signResult", lang, { r: R }), body: isNeg(r) ? P("pp_belowZero", lang) : P("pp_notBelowZero", lang), math: `${A} ${sym[op]} ${isNeg(b) ? `(${B})` : B} = ${R}` });
    return out;
  }
  if (op === "+") {
    boardExprs.push(`${A}+${B}`);
    return [{ kind: "board", expr: `${A}+${B}`, label: `${A} + ${B} = ${R}` }];
  }
  if (op === "-") {
    if (isNeg(r)) return [{ kind: "paper", title: P("pp_belowTitle", lang, { a: A, b: B }), body: P("pp_belowB", lang, { a: A, b: B }), math: `${A} ${minus} ${B} = ${R}` }];
    boardExprs.push(`${A}-${B}`);
    return [{ kind: "board", expr: `${A}-${B}`, label: `${A} ${minus} ${B} = ${R}` }];
  }
  if (op === "^") {
    const base = big(a);
    const n = big(b);
    if (base === null || n === null || n < 2n || n > 8n) return null;
    const out = [{ kind: "paper", title: P("pp_pow", lang, { a: A, n: B }), body: P("pp_powB", lang, { a: A, n: B }), math: Array(Number(n)).fill(A).join(` ${times} `) }];
    let acc = base;
    for (let k = 2; k <= Number(n); k++) {
      const next = acc * base;
      out.push({ kind: "paper", title: `${acc} ${times} ${A} = ${next}`, body: P("pp_powStep", lang, { k: k - 1, n: Number(n) - 1 }), math: `${acc} ${times} ${A} = ${next}` });
      acc = next;
    }
    return out;
  }
  if (op === "*") return multiplyPieces(a, b, r, lang, boardExprs);
  if (op === "/") return dividePieces(a, b, r, lang);
  return null;
}

function multiplyPieces(a, b, r, lang, boardExprs) {
  const A = fmtQ(a);
  const B = fmtQ(b);
  const R = fmtQ(r);
  const out = [];
  if (a.n === 0n || b.n === 0n) return [{ kind: "paper", title: P("pp_zero", lang), body: P("pp_zeroB", lang), math: `${A} ${times} ${B} = 0` }];
  if (a.d !== 1n || b.d !== 1n) {
    const da = decimals(a);
    const db = decimals(b);
    const ia = BigInt(fmtQ(abs(a)).replace(".", ""));
    const ib = BigInt(fmtQ(abs(b)).replace(".", ""));
    return [
      { kind: "paper", title: P("pp_dots", lang), body: P("pp_dotsB", lang, { a: A, b: B, ia, ib }), math: `${ia} ${times} ${ib} = ${ia * ib}` },
      { kind: "paper", title: P("pp_dotsBack", lang), body: P("pp_dotsBackB", lang, { x: da, y: db, z: da + db, r: R }), math: `${A} ${times} ${B} = ${R}` },
    ];
  }
  let x = a.n;
  let y = b.n;
  let swapped = false;
  if (y > 12n && x <= 12n) {
    [x, y] = [y, x];
    swapped = true;
  }
  if (y <= 12n && x <= 99999n) {
    const parts = Array(Number(y)).fill(String(x));
    out.push({ kind: "paper", title: P("pp_group", lang, { a: x, b: y }), body: `${swapped ? `${P("pp_swapB", lang, { n: y })} ` : ""}${P("pp_groupB", lang, { a: x })}`, math: parts.length > 6 ? `${x} + ${x} + … (${y}×)` : parts.join(" + ") });
    if (y === 1n) return out;
    boardExprs.push(parts.join("+"));
    out.push({ kind: "board", expr: parts.join("+"), label: `${x} ${times} ${y} = ${R}` });
    return out;
  }
  // partial products by place value of y
  const ys = y.toString();
  const partsY = [...ys].map((d, i) => (d === "0" ? null : BigInt(d) * 10n ** BigInt(ys.length - 1 - i))).filter((v) => v !== null);
  out.push({ kind: "paper", title: P("pp_split", lang, { b: y, parts: partsY.join(" + ") }), body: P("pp_splitB", lang, { a: x }), math: `${x} ${times} ${y} = ${partsY.map((p) => `${x} ${times} ${p}`).join(" + ")}` });
  const prods = partsY.map((p) => x * p);
  partsY.forEach((p, i) => out.push({ kind: "paper", title: `${x} ${times} ${p} = ${prods[i]}`, body: P("pp_partB", lang), math: `${x} ${times} ${p} = ${prods[i]}` }));
  if (prods.length > 1 && prods.join("").length < 14) {
    boardExprs.push(prods.join("+"));
    out.push({ kind: "paper", title: P("pp_sumparts", lang), body: P("pp_sumpartsB", lang), math: prods.join(" + ") });
    out.push({ kind: "board", expr: prods.join("+"), label: `${prods.join(" + ")} = ${R}` });
  }
  return out;
}

function dividePieces(a, b, r, lang) {
  const A = fmtQ(a);
  const B = fmtQ(b);
  const R = fmtQ(r);
  if (b.n === 0n) return null;
  let x = a.n;
  let y = b.n;
  const out = [];
  if (a.d !== 1n || b.d !== 1n) {
    // scale both to whole numbers
    const f = 10n ** BigInt(Math.max(decimals(a), decimals(b)));
    x = (a.n * f) / a.d;
    y = (b.n * f) / b.d;
    if ((a.n * f) % a.d || (b.n * f) % b.d) return null;
    out.push({ kind: "paper", title: P("pp_divScale", lang, { b: B }), body: P("pp_divScaleB", lang, { f, a2: x, b2: y }), math: `${A} ${divide} ${B} = ${x} ${divide} ${y}` });
  }
  if (x < 0n || y < 0n) return null;
  const ds = x.toString();
  out.push({ kind: "paper", title: P("pp_divStart", lang, { a: x, b: y }), body: P("pp_divStartB", lang), math: `${x} ${divide} ${y}` });
  let cur = 0n;
  let q = "";
  let shown = 0;
  for (let i = 0; i < ds.length; i++) {
    cur = cur * 10n + BigInt(ds[i]);
    const d = cur / y;
    const used = d * y;
    q += d.toString();
    if (shown < 6 && (d > 0n || i === ds.length - 1 || q.replace(/^0+/, "") !== "")) {
      shown++;
      out.push({ kind: "paper", title: P("pp_divStep", lang, { cur }), body: P(d === 0n ? "pp_divStep0" : "pp_divStepB", lang, { b: y, q: d, cur, u: used, rem: cur - used }), math: `${cur} ${divide} ${y} → ${d};  ${cur} ${minus} ${used} = ${cur - used}` });
    }
    cur -= used;
  }
  const Q = q.replace(/^0+(?=\d)/, "");
  if (cur === 0n) out.push({ kind: "paper", title: P("pp_divExact", lang, { r: R }), body: P("pp_divExactB", lang, { r: Q, b: y, a: x }), math: `${Q} ${times} ${y} = ${x}` });
  else out.push({ kind: "paper", title: P("pp_divRem", lang, { Q, rem: cur }), body: P("pp_divRemB", lang, { a: x, b: y, Q, rem: cur, v: R.includes("/") ? `≈ ${(toNum(r)).toFixed(3)}` : R }), math: `${x} = ${y} ${times} ${Q} + ${cur}` });
  return out;
}

/** Turn pieces into scenes. */
function finish(pieces, boardExprs, lang, finalText) {
  // one shared board size for every board piece
  const snaps = [];
  const traces = new Map();
  for (const e of boardExprs) {
    try {
      const t = solve(e);
      traces.set(e, t);
      snaps.push(...t.steps.flatMap((s) => [s.before, s.after]));
    } catch {
      return null;
    }
  }
  const layout = snaps.length ? layoutFor(snaps) : { rods: 3, scale: 0 };
  if (layout.rods > 13) return null;
  const scenes = [];
  const push = (sc) => scenes.push({ ...sc, id: scenes.length });
  for (const p of pieces) {
    if (p.kind === "paper") {
      push({ type: "math", title: p.title, body: p.body, math: p.math + (p.tail ? `   →   ${p.tail.rest}` : ""), boardable: false, changes: false, group: 0, first: 0, last: 0 });
      continue;
    }
    const sub = buildScenes(traces.get(p.expr), lang, layout);
    sub.forEach((sc, i) => {
      const isLast = i === sub.length - 1;
      if (isLast && sc.type === "result" && !p.last) {
        push({ ...sc, type: "result", title: P("pp_partDone", lang, { eq: pretty(p.label) }), body: p.tail ? P("pp_partDoneB", lang, { rest: p.tail.rest }) : "", math: p.tail ? p.tail.rest : sc.math });
      } else push(sc);
    });
  }
  // the very last scene is always "The answer is ..."
  const lastScene = scenes.at(-1);
  if (!lastScene || lastScene.type !== "result") {
    push({ type: "result", title: P("sc_result", lang, { r: pretty(finalText) }), body: P("pp_finalB", lang), math: pretty(finalText), boardable: false, changes: false, group: 0, first: 0, last: 0 });
  }
  return { scenes, layout, boardable: scenes.some((s) => s.boardable !== false && s.from && s.to), result: finalText };
}
