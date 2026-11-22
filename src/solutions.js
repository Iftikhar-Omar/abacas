// File: solutions.js
// Directory: src/
// One entry point that picks the best explanation for any calculation:
//   fractions -> picture bars, percent -> friendly fractions, brackets / multiplication / division /
//   powers / roots / signs -> hand-written paper steps (adding and taking away stay on the abacus),
//   plain + and - chains -> the bead flow with little friends, big friends and borrowing.

import { buildScenes, isBoardable } from "./coach.js";
import { solve } from "./engine.js";
import { fractionScenes, percentScenes } from "./fractions.js";
import { paperSolution } from "./paper.js";
import { P } from "./player-i18n.js";
import { layoutFor } from "./soroban.js";

/** @returns {{scenes:object[], layout:{rods:number,scale:number}, boardable:boolean, plain:boolean, trace:object|null, result:string}} */
export function solutionScenes(expr, lang, { simplify = false } = {}) {
  const fr = fractionScenes(expr, lang, { simplify });
  if (fr) return { scenes: fr.scenes, layout: { rods: 3, scale: 0 }, boardable: false, plain: true, trace: null, result: fr.result };
  const pc = percentScenes(expr, lang);
  if (pc) return { scenes: pc.scenes, layout: { rods: 3, scale: 0 }, boardable: false, plain: true, trace: null, result: pc.result };
  let pp = null;
  try {
    pp = paperSolution(expr, lang);
  } catch {
    pp = null;
  }
  if (pp) return { scenes: pp.scenes, layout: pp.layout, boardable: pp.boardable, plain: !pp.boardable, trace: null, result: pp.result };
  const trace = solve(expr);
  const layout = layoutFor(trace.steps.flatMap((s) => [s.before, s.after]));
  const boardable = isBoardable(trace);
  const scenes = buildScenes(trace, lang, layout);
  // every explanation ends with one clear answer line ("x = 6" for equations, "≈ 351.363" for rough roots)
  if (scenes.length && scenes.at(-1).type !== "result" && /[+*/^-]|sqrt/.test(String(expr))) {
    const eq = /[a-z]/i.test(String(expr).replace(/sqrt/g, ""));
    const root = /sqrt/.test(String(expr)) && !Number.isInteger(Number(trace.result));
    const shown = eq ? `x = ${trace.result}` : root ? `\u2248 ${trace.result}` : trace.result;
    scenes.push({ id: scenes.length, type: "result", title: P("sc_result", lang, { r: shown }), body: P("sc_resultBody", lang), math: shown, boardable: false, changes: false, group: 0, first: 0, last: 0 });
  }
  return { scenes, layout, boardable, plain: !boardable, trace, result: trace.result };
}
