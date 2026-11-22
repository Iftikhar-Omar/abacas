// File: practice.js
// Directory: src/
// Practice question generator, seeded from lesson definitions.

import { lessons } from './curriculum.js';
import { solve } from './engine.js';

export function practiceFor(l, seed = Date.now(), source = "abacus") {
  if (l.practiceIds?.length) {
    const id = l.practiceIds[(seed >>> 0) % l.practiceIds.length];
    return practiceFor(
      lessons.find((v) => v.id === id),
      seed,
      source
    );
  }
  let x = seed >>> 0 || 1;
  const rnd = (n) => {
    x = 1664525 * x + 1013904223 >>> 0;
    return x % n;
  }, between = (a2, b2) => a2 + rnd(b2 - a2 + 1);
  let a, b, c, d, expr;
  const borrow = () => {
    const tens = between(2, 9), ones = between(0, 6);
    return `${tens * 10 + ones}-${between(1, tens - 1) * 10 + between(ones + 1, 9)}`;
  };
  const chain = (digits = 1) => {
    const low = digits === 1 ? 1 : 10, high = digits === 1 ? 9 : source === "hands" ? 40 : 60;
    a = between(low, high);
    b = between(low, high);
    c = between(1, a + b);
    return `${a}+${b}-${c}`;
  };
  switch (l.id) {
    case "times-zero":
      expr = `${between(1, 99)}*${rnd(2)}`;
      break;
    case "times-five":
      expr = `5*${between(2, 12)}`;
      break;
    case "times-nine":
      expr = `9*${between(2, 12)}`;
      break;
    case "decimal-product":
      expr = `${(between(2, 29) / 10).toFixed(1)}*${(between(2, 9) / 10).toFixed(1)}`;
      break;
    case "division-remainder":
      b = between(3, 9);
      expr = `${b * between(2, 9) + between(1, b - 1)}/${b}`;
      break;
    case "decimal-division":
      b = between(2, 9);
      expr = `${(b * between(2, 9) / 10).toFixed(1)}/${(b / 10).toFixed(1)}`;
      break;
    case "fraction-simplify":
      a = between(1, 5);
      b = between(a + 1, 9);
      c = between(2, 5);
      expr = `${a * c}/${b * c}`;
      break;
    case "fraction-subtract":
      b = between(3, 9);
      expr = `${b - 1}/${b}-1/${b * 2}`;
      break;
    case "fraction-product":
      b = between(3, 9);
      c = between(2, 8);
      expr = `${b - 1}/${b}*${c - 1}/${c}`;
      break;
    case "fraction-division":
      b = between(3, 9);
      c = between(2, 8);
      expr = `${b - 1}/${b}/(1/${c})`;
      break;
    case "mixed-number":
      b = between(3, 9);
      expr = `${between(1, 5)}+${b - 1}/${b}+1/${b * 2}`;
      break;
    case "negative-add":
      expr = `-${between(1, 20)}+${between(1, 20)}`;
      break;
    case "negative-subtract":
      expr = `${between(-10, 10)}-(-${between(1, 10)})`;
      break;
    case "negative-product":
      expr = `-${between(2, 9)}*(${rnd(2) ? "-" : ""}${between(2, 9)})`;
      break;
    case "negative-division":
      b = between(2, 9);
      expr = `-${b * between(2, 9)}/(${rnd(2) ? "-" : ""}${b})`;
      break;
    case "mental-product":
      expr = `${between(2, 9)}*${between(2, 9)}`;
      break;
    case "mental-share":
      b = between(2, 9);
      expr = `${b * between(2, 9)}/${b}`;
      break;
    case "mental-signed":
      expr = `-${between(1, 9)}+${between(1, 15)}-${between(1, 5)}`;
      break;
    case "zero":
      a = rnd(5);
      expr = `${a}-${a}`;
      break;
    case "count":
      a = between(1, 2);
      expr = `${a}+1+1`;
      break;
    case "compare":
      expr = `${between(1, 4)}+1`;
      break;
    case "take":
      expr = `${between(1, 4)}-1`;
      break;
    case "number-four":
      a = between(1, 3);
      expr = `${a}+${4 - a}`;
      break;
    case "place":
      expr = String(between(1, 4));
      break;
    case "five-bead":
      expr = `5+${rnd(5)}`;
      break;
    case "digits":
      expr = String(between(6, 9));
      break;
    case "tens":
    case "hands":
      expr = String(between(10, 89));
      break;
    case "five":
      a = between(1, 4);
      expr = `${a}+${5 - a}`;
      break;
    case "five-two":
      a = between(2, 4);
      expr = `${a}+${between(6 - a, 9 - a)}`;
      break;
    case "five-back":
      a = between(5, 8);
      expr = `${a}-${between(a % 5 + 1, 4)}`;
      break;
    case "five-tens":
      a = between(2, 4);
      expr = `${a * 10}+${between(6 - a, 9 - a) * 10}`;
      break;
    case "five-mix":
      a = between(2, 4);
      b = between(3, 4);
      expr = `${a}+${b}-${between(1, 4)}`;
      break;
    case "ten":
      a = between(1, 9);
      expr = `${a}+${10 - a}`;
      break;
    case "ten-friends":
      a = between(6, 9);
      expr = `${a}+${between(11 - a, 9)}`;
      break;
    case "borrow":
      a = between(10, 18);
      expr = `${a}-${between(a % 10 + 1, 9)}`;
      break;
    case "ten-five":
      expr = `${between(6, 9)}+${between(6, 9)}`;
      break;
    case "ten-mix":
      expr = `${between(11, 16)}-${between(7, 9)}+${between(1, 5)}`;
      break;
    case "subtract":
    case "retention":
      expr = borrow();
      break;
    case "hundreds":
      expr = `${between(101, 399)}+${between(100, 399)}`;
      break;
    case "carry-chain":
      expr = `${[99, 199, 299, 999][rnd(4)]}+${between(1, 9)}`;
      break;
    case "borrow-chain":
      expr = `${[100, 1e3, 2e3, 3e3][rnd(4)]}-${between(1, 89)}`;
      break;
    case "big-mix":
      a = between(200, 899);
      expr = `${a}-${between(100, a - 1)}+${between(10, 99)}`;
      break;
    case "mental":
      a = between(1, 3);
      expr = `${a}+${between(1, 4 - a)}`;
      break;
    case "mental-five":
      expr = `${between(3, 4)}+${between(3, 4)}`;
      break;
    case "mental-ten":
      expr = `${between(6, 9)}+${between(6, 9)}`;
      break;
    case "mental-chain":
    case "flash":
      expr = chain();
      if (l.id === "flash") expr += `+${between(1, 9)}`;
      break;
    case "mental-two":
    case "speed":
    case "audio":
      expr = chain(2);
      break;
    case "multiply":
      expr = `${between(2, 4)}*${between(2, 4)}`;
      break;
    case "times-ten":
      expr = `${between(10, 49)}*${rnd(3) ? 10 : 100}`;
      break;
    case "partial-products":
      expr = `${between(11, 39)}*${between(11, 29)}`;
      break;
    case "divide":
      b = between(2, 8);
      expr = `${b * between(2, 9)}/${b}`;
      break;
    case "long-division":
      b = between(11, 19);
      expr = `${b * between(11, 19)}/${b}`;
      break;
    case "decimal":
      expr = `0.${between(1, 8)}+0.${between(1, 8)}`;
      break;
    case "money":
      expr = `${(between(1e3, 5e3) / 100).toFixed(2)}-${(between(25, 750) / 100).toFixed(2)}`;
      break;
    case "fractions":
      d = [2, 3, 4, 5, 6][rnd(5)];
      expr = `1/${d}+1/${d * (1 + rnd(2))}`;
      break;
    case "percent":
      expr = `${[5, 10, 20, 25, 50][rnd(5)]}%*${20 * between(1, 20)}`;
      break;
    case "negative":
      a = between(1, 9);
      expr = `${a}-${a + between(1, 9)}`;
      break;
    case "compensate":
      expr = `${between(20, 399)}+99`;
      break;
    case "double-half":
      expr = `${between(6, 30) * 2}*25`;
      break;
    case "near-base":
      expr = `${between(96, 104)}*${between(3, 8)}`;
      break;
    case "squares":
      expr = `${between(1, 8) * 10 + 5}^2`;
      break;
    case "estimate":
      expr = `${between(190, 399)}+${between(400, 699)}`;
      break;
    case "order":
      a = between(2, 8);
      b = between(2, 8);
      c = between(2, 8);
      expr = rnd(2) ? `${a}+${b}*${c}` : `(${a}+${b})*${c}`;
      break;
    case "powers":
      expr = `${between(2, 5)}^${between(3, 5)}`;
      break;
    case "roots":
      a = between(11, 25);
      expr = `sqrt(${a * a})`;
      break;
    case "equations":
      a = between(2, 8);
      b = between(1, 10);
      expr = `${a}*x+${b}=${a * between(1, 12) + b}`;
      break;
    case "balance":
      a = between(2, 8);
      b = between(1, 5);
      expr = `${a}*(x-${b})=${a * between(1, 12)}`;
      break;
    case "mixed-recall":
      d = between(3, 8);
      a = d * between(2, 8);
      b = d * between(2, 8);
      expr = `(${a}+${b})/${d}`;
      break;
    case "expert":
      expr = `${between(1e4, 99999)}+${between(1e4, 99999)}+${between(1e4, 99999)}`;
      break;
    case "expert-product":
      expr = `${between(1e3, 9999)}*${between(1e3, 9999)}`;
      break;
    case "expert-divide":
      expr = `${between(1e5, 999999)}/${between(12, 49)}`;
      break;
    case "expert-root":
      expr = `sqrt(${between(1e5, 999999)})`;
      break;
    case "expert-mixed":
      expr = `(${between(1e3, 9999)}*25-${between(100, 999)})/5`;
      break;
    default:
      expr = l.practice[rnd(l.practice.length)] || l.example;
  }
  try {
    solve(expr);
    return expr;
  } catch {
    return l.example;
  }
}
export function freshQuestions(l, seed = Date.now(), source = "abacus") {
  const items = [];
  if (l.practiceIds?.length) {
    for (const id of l.practiceIds) {
      const base = lessons.find((v) => v.id === id);
      for (let i = 0; i < 40; i++) {
        const expr = practiceFor(base, seed + i * 997, source);
        if (!items.includes(expr) && !l.parts.some((p) => p.example === expr)) {
          items.push(expr);
          break;
        }
      }
    }
    return items;
  }
  for (let i = 0; i < 40 && items.length < 3; i++) {
    const expr = practiceFor(l, seed + i * 997, source);
    if (!items.includes(expr)) items.push(expr);
  }
  for (const expr of l.practice)
    if (items.length < 3 && !items.includes(expr)) items.push(expr);
  return items.slice(0, 3);
}
export function actionSteps(trace) {
  return trace.steps.map((s, i) => ({ ...s, traceIndex: i })).filter((s) => s.column !== void 0 && s.before.raw !== s.after.raw);
}
export function misconception(step) {
  return ["makeTen", "borrowTen"].includes(step.kind) || ["ten", "borrow"].includes(step.lesson) ? "ten" : step.kind.startsWith("upper") || step.lesson === "five" ? "five" : "place";
}
