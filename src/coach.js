// File: coach.js
// Directory: src/
// The "coach" turns the engine's raw bead steps into short, plain-language scenes a beginner can follow.
// It recognises the soroban patterns learners need names for:
//   - direct moves          (just move beads)
//   - little friends        (+d = +5 - k   /   -d = -5 + k)
//   - big friends           (+d = +10 - c)
//   - borrowing a ten       (-d = -10 + c)
// and groups the one-bead-at-a-time engine steps into scenes with a title, a one-line reason, and a
// board change that the player can animate, highlight, or ask the learner to perform.

import { stepText } from './i18n.js';
import { P } from './player-i18n.js';
import { snapshotToDigits } from './soroban.js';

const BOARD_KINDS = new Set(["lowerOn", "lowerOff", "upperOn", "upperOff"]);
const times = "×";
const minus = "−";

export function columnName(place, lang) {
  const key = String(place);
  const map = {
    "1": "ones", "10": "tens", "100": "hundreds", "1000": "thousands", "10000": "tenThousands",
    "100000": "hundredThousands", "1000000": "millions", "0.1": "tenths", "0.01": "hundredths", "0.001": "thousandths",
  };
  return map[key] ? P(`col_${map[key]}`, lang) : P("col_generic", lang, { place: key });
}

const bottom = (n, lang) => P(n === 1 ? "bottomBead_one" : "bottomBead_other", lang, { n });

/** Format a number in the same style used across the app (× and −). */
let fractionStyle = false;
/** Fraction lessons show 1/4 as a fraction; everywhere else "/" is a division sign. */
export const setFractionStyle = (on) => {
  fractionStyle = !!on;
};
export const pretty = (s) => String(s).replaceAll("*", times).replaceAll("/", fractionStyle ? "/" : "\u00F7").replaceAll("-", minus);

/**
 * Build the scenes for a solved trace.
 * @param {object} trace result of engine.solve()
 * @param {string} lang
 * @param {{rods:number, scale:number}} layout
 */
export function buildScenes(trace, lang, layout) {
  const steps = trace.steps;
  const scenes = [];
  const digitsOf = (snap) => snapshotToDigits(snap, layout.rods, layout.scale);
  const mk = (a, b, extra) => {
    const first = steps[a];
    const last = steps[b];
    const from = digitsOf(first.before);
    const to = digitsOf(last.after);
    return {
      id: scenes.length,
      first: a,
      last: b,
      group: first.group,
      tone: trace.groups[first.group]?.tone || "neutral",
      from,
      to,
      before: first.before,
      after: last.after,
      boardable: !!(from && to),
      changes: !!(from && to && from.join() !== to.join()),
      ...extra,
    };
  };

  let i = 0;
  let pendingBig = null; // {kind:'big'|'borrow', digit, complement}
  while (i < steps.length) {
    const s = steps[i];
    const group = trace.groups[s.group];
    const p = s.params || {};
    const place = p.place;

    if (s.kind === "clear") {
      scenes.push(mk(i, i, { type: "clear", title: P("sc_clear", lang), body: P("sc_clearBody", lang), math: "0" }));
      i++;
      continue;
    }
    if (s.kind === "zero") {
      scenes.push(mk(i, i, { type: "zero", title: P("sc_zero", lang), body: P("sc_zeroBody", lang), math: "0" }));
      i++;
      continue;
    }

    // ---- setting up the first number (group 0): merge moves per column ----
    if (s.group === 0 && BOARD_KINDS.has(s.kind)) {
      let j = i;
      while (j + 1 < steps.length && steps[j + 1].group === 0 && BOARD_KINDS.has(steps[j + 1].kind) && steps[j + 1].params.column === p.column) j++;
      const to = digitsOf(steps[j].after);
      const col = to ? to.length - 1 - (layout.scale ? 0 : 0) : 0;
      void col;
      const digit = to ? to[layout.rods - 1 - Number(p.column)] : "";
      const parts = digit >= 5 ? `5 + ${digit - 5}` : `${digit}`;
      scenes.push(
        mk(i, j, {
          type: "set",
          title: P("sc_set", lang, { digit, col: columnName(place, lang) }),
          body: digit === 5 ? P("sc_setBodyFive0", lang) : digit > 5 ? P("sc_setBodyFive", lang, { k: bottom(digit - 5, lang) }) : P("sc_setBody", lang, { k: bottom(digit, lang) }),
          math: digit >= 5 ? parts : "",
          column: Number(p.column),
        })
      );
      i = j + 1;
      continue;
    }

    if (s.kind === "operation") {
      const look = steps.slice(i + 1).filter((x) => x.group === s.group);
      let hint = "sc_opDirect";
      if (look.some((x) => x.kind === "makeTen")) hint = "sc_opBig";
      else if (look.some((x) => x.kind === "borrowTen")) hint = "sc_opBorrow";
      else if (look.some((x, k) => x.kind === "upperOn" && look[k + 1]?.kind === "lowerOff" && look[k + 1].params.column === x.params.column) || look.some((x, k) => x.kind === "upperOff" && look[k + 1]?.kind === "lowerOn" && look[k + 1].params.column === x.params.column)) hint = "sc_opLittle";
      const word = { "+": "add", [minus]: "take", "-": "take", "*": "times", [times]: "times", "/": "share", "÷": "share" }[p.op] || "add";
      scenes.push(
        mk(i, i, {
          type: "operation",
          title: P(`sc_op_${word}`, lang, { b: pretty(p.b) }),
          body: P(hint, lang),
          math: `${pretty(p.a)} ${pretty(p.op)} ${pretty(p.b)}`,
          friend: hint === "sc_opBig" ? "big" : hint === "sc_opBorrow" ? "borrow" : hint === "sc_opLittle" ? "little" : null,
        })
      );
      i++;
      continue;
    }

    if (s.kind === "makeTen" || s.kind === "borrowTen") {
      pendingBig = { kind: s.kind === "makeTen" ? "big" : "borrow", digit: p.digit, complement: p.complement, taken: 0 };
      const add = s.kind === "makeTen";
      scenes.push(
        mk(i, i, {
          type: add ? "bigFriend" : "borrowTen",
          friend: add ? "big" : "borrow",
          title: P(add ? "sc_bigTitle" : "sc_borrowTitle", lang, { d: p.digit }),
          body: P(add ? "sc_bigBody" : "sc_borrowBody", lang, { d: p.digit, c: p.complement }),
          math: add ? `+${p.digit} = +10 ${minus} ${p.complement}` : `${minus}${p.digit} = ${minus}10 + ${p.complement}`,
        })
      );
      i++;
      continue;
    }

    if (s.kind === "operationDone") {
      scenes.push(
        mk(i, i, {
          type: "result",
          title: P("sc_result", lang, { r: pretty(p.result) }),
          body: P("sc_resultBody", lang),
          math: pretty(p.result),
        })
      );
      pendingBig = null;
      i++;
      continue;
    }

    if (BOARD_KINDS.has(s.kind)) {
      const col = columnName(place, lang);
      const pv = Number(place);
      const next = steps[i + 1];
      const sameCol = next && next.group === s.group && next.params?.column === p.column;
      // little friend (add): top bead down, then some bottom beads away
      if (s.kind === "upperOn" && sameCol && next.kind === "lowerOff") {
        const k = next.params.amount;
        const d = 5 - k;
        scenes.push(mk(i, i, { type: "little1", friend: "little", title: P("sc_little1", lang, { d, col }), body: P("sc_little1Body", lang, { d, k, col }), math: `+${d} = +5 ${minus} ${k}` }));
        scenes.push(mk(i + 1, i + 1, { type: "little2", friend: "little", title: P("sc_little2", lang, { k: bottom(k, lang) }), body: P("sc_little2Body", lang, { d, k }), math: `5 ${minus} ${k} = ${d}` }));
        if (pendingBig) pendingBig = pendingBig.taken ? (pendingBig.kind === "borrow" ? null : pendingBig) : { ...pendingBig, taken: 1 };
        i += 2;
        continue;
      }
      // little friend (subtract): top bead up, then bottom beads back up
      if (s.kind === "upperOff" && sameCol && next.kind === "lowerOn") {
        const k = next.params.amount;
        const d = 5 - k;
        scenes.push(mk(i, i, { type: "little1", friend: "little", title: P("sc_littleSub1", lang, { d, col }), body: P("sc_littleSub1Body", lang, { d, k }), math: `${minus}${d} = ${minus}5 + ${k}` }));
        scenes.push(mk(i + 1, i + 1, { type: "little2", friend: "little", title: P("sc_littleSub2", lang, { k: bottom(k, lang) }), body: P("sc_littleSub2Body", lang, { d, k }), math: `${minus}5 + ${k} = ${minus}${d}` }));
        if (pendingBig) pendingBig = pendingBig.taken ? (pendingBig.kind === "borrow" ? null : pendingBig) : { ...pendingBig, taken: 1 };
        i += 2;
        continue;
      }
      const amt = p.amount;
      let type = "direct";
      let friend = null;
      let title;
      let body;
      let math;
      if (s.kind === "lowerOn") {
        title = P("sc_lowerOn", lang, { k: bottom(amt, lang) });
        body = P("sc_lowerOnBody", lang, { col, pv: place, n: amt, total: amt * pv });
        math = `${amt} ${times} ${place} = ${fmt(amt * pv)}`;
      } else if (s.kind === "lowerOff") {
        title = P("sc_lowerOff", lang, { k: bottom(amt, lang) });
        body = P("sc_lowerOffBody", lang, { col, pv: place, n: amt, total: amt * pv });
        math = `${minus}${amt} ${times} ${place} = ${minus}${fmt(amt * pv)}`;
      } else if (s.kind === "upperOn") {
        title = P("sc_upperOn", lang);
        body = P("sc_upperOnBody", lang, { col, total: fmt(5 * pv) });
        math = `5 ${times} ${place} = ${fmt(5 * pv)}`;
      } else {
        title = P("sc_upperOff", lang);
        body = P("sc_upperOffBody", lang, { col, total: fmt(5 * pv) });
        math = `${minus}5 ${times} ${place} = ${minus}${fmt(5 * pv)}`;
      }
      // role inside a big friend / borrow
      if (pendingBig) {
        if (pendingBig.kind === "big") {
          friend = "big";
          if (pendingBig.taken === 0) {
            type = "big1";
            title = P("sc_big1", lang, { c: pendingBig.complement, col });
            body = P("sc_big1Body", lang, { d: pendingBig.digit, c: pendingBig.complement });
            pendingBig.taken = 1;
          } else {
            type = "big2";
            title = P("sc_big2", lang, { col });
            body = P("sc_big2Body", lang, { d: pendingBig.digit });
            pendingBig = null;
          }
        } else {
          friend = "borrow";
          if (pendingBig.taken === 0) {
            type = "borrow1";
            title = P("sc_borrow1", lang, { col });
            body = P("sc_borrow1Body", lang, { d: pendingBig.digit, c: pendingBig.complement });
            pendingBig.taken = 1;
          } else if (!(s.kind === "upperOn" && sameCol && next.kind === "lowerOff")) {
            type = "borrow2";
            title = P("sc_borrow2", lang, { c: pendingBig.complement, col });
            body = P("sc_borrow2Body", lang, { d: pendingBig.digit, c: pendingBig.complement });
            pendingBig = null;
          }
        }
      }
      scenes.push(mk(i, i, { type, friend, title, body, math, column: Number(p.column) }));
      i++;
      continue;
    }

    // ---- everything the abacus can't show (fractions, signs, equations...) ----
    const info = stepText(s, lang);
    const friendly = lang === "en" ? friendlyMath(s) : null;
    scenes.push(mk(i, i, { type: "math", title: friendly?.title || info.text, body: friendly?.body || "", math: pretty(info.math || ""), group: s.group, tone: group?.tone }));
    i++;
  }
  // un-nest borrow2 that was skipped by a nested little-friend: clear any pending state
  return scenes;
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(6)));

/** Scenes where the learner has to move beads (used by "Try together"). */
export function taskScenes(scenes) {
  const hasOperation = scenes.some((s) => s.type === "operation");
  // examples that are just a number ("show 12") are practised by building the number itself
  return scenes.filter((s) => s.changes && (hasOperation ? !["set", "clear"].includes(s.type) : s.type === "set"));
}

/** Plain-English wording for the steps that happen "on paper" rather than on the abacus. */
function friendlyMath(s) {
  const p = s.params || {};
  const pl = (n, one, many) => (Number(n) === 1 ? one : many);
  switch (s.kind) {
    case "multiplyPlan":
      return { title: `Multiply ${p.a} ${times} ${p.b}`, body: `Think of ${p.b} equal groups of ${p.a}. We build the answer in small pieces.` };
    case "partialProduct":
      return { title: `Multiply ${p.a} ${times} ${p.factor}`, body: `This piece of the answer is ${p.part}. Keep it, then add the pieces together.` };
    case "dividePlan":
      return { title: `Divide ${p.a} by ${p.b}`, body: `We will share ${p.a} into groups of ${p.b}, one digit at a time.` };
    case "divideDigit":
      return { title: `Look at ${p.total}`, body: `How many times does ${p.divisor} fit into ${p.total}? ${p.digit} ${pl(p.digit, "time", "times")}, which uses ${p.used}. ${p.remain} is left over.` };
    case "divideCheck":
      return { title: "Check by multiplying", body: `${p.result} ${times} ${p.b} = ${p.a}, so the answer is right.` };
    case "negate":
      return { title: `Make it negative`, body: `Put a minus sign in front: ${minus}${p.a}. A number below zero.` };
    case "exact":
    case "signedOrFraction":
      return { title: `The answer is ${pretty(p.value ?? p.result)}`, body: "Read the answer from the last line." };
    case "fractionProduct":
      return { title: "Tops times tops, bottoms times bottoms", body: `(${p.left} ${times} ${p.right}) over (${p.leftDen} ${times} ${p.rightDen}) gives ${p.result}.` };
    case "remainder":
      return { title: "Whole groups and a leftover", body: `${p.a} = ${p.divisor} ${times} ${p.quotient} + ${p.remainder}. So ${p.quotient} whole groups, with ${p.remainder} left over.` };
    case "reciprocal":
      return { title: "Dividing by a fraction? Flip it and multiply", body: `Dividing by ${p.b} is the same as multiplying by ${p.inverse}.` };
    case "divisionScale":
      return { title: "Make the divisor a whole number", body: `Multiply both numbers by ${p.factor}. The answer stays the same, and it is easier: ${p.left} \u00F7 ${p.right}.` };
    case "commonParts":
      return { title: "Use equal-sized parts", body: "Fractions can only be added or subtracted when their bottom numbers match." };
    case "combineParts":
      return { title: "Combine the parts", body: `${p.left} ${pretty(p.op)} ${p.right} parts out of ${p.den} gives ${p.result}.` };
    case "signRule":
      return { title: "Check the signs first", body: "Same signs give a positive answer. Different signs give a negative answer." };
    case "multiplyExact":
      return { title: `The product is ${p.result}`, body: "Now the sign is decided, multiply the numbers." };
    case "power":
      return { title: "Repeated multiplication", body: `${p.a} ${times} ${p.a} = ${p.result}.` };
    case "rootCheck":
      return { title: "Check the root", body: `${p.result} ${times} ${p.result} = ${p.a}, so the square root is ${p.result}.` };
    case "balance":
      return { title: "Both sides must stay balanced", body: "Whatever we do to one side of the equals sign, we do to the other." };
    case "collect":
      return { title: "Gather the x terms", body: `Move the plain numbers away so ${p.coefficient} ${times} x = ${p.constant}.` };
    case "solveX":
      return { title: "Find x", body: `Divide both sides by ${p.coefficient}: x = ${p.result}.` };
    case "verifyX":
      return { title: "Check your answer", body: `Put x = ${p.result} back into the equation: both sides are ${p.left}.` };
    case "rootBring":
      return { title: "Bring down the next pair of digits", body: "We find a square root one pair of digits at a time." };
    case "rootTrial":
      return { title: "Try a digit", body: "Pick the biggest digit that still fits without going over." };
    case "rootDigit":
      return { title: "Keep that digit", body: "Write it in the answer and subtract what we used." };
    case "roundRoot":
      return { title: "Round the answer", body: "Use one extra digit to round to the places we want." };
    default:
      return null;
  }
}
