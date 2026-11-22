import { evaluate, solve } from './engine.js';
import { lessons } from './curriculum.js';
import { practiceFor } from './practice.js';
import { config } from './config.js';

export function handCompatible(expression) {
  try {
    return solve(expression).steps.every((s) => {
      const q = evaluate(s.after.value);
      return q.d === 1n && q.n >= 0n && q.n <= 99n;
    });
  } catch {
    return false;
  }
}
export function createAssessment(unit, source = "abacus", seed = Date.now(), timed = false) {
  if (!Number.isInteger(unit) || unit < 0 || unit > 11 || !["abacus", "hands", "mental"].includes(source))
    throw Error("Invalid assessment");
  const family = lessons.filter(
    (l) => l.unit === unit && (source === "hands" ? handCompatible(l.example) : l.id !== "hands")
  );
  if (!family.length) throw Error("This unit exceeds finger capacity");
  const items = [], seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < 300 && items.length < 10; i++) {
    const l = family[(i + (seed >>> 0) % family.length) % family.length], expression = practiceFor(l, seed + i * 997, source);
    if (seen.has(expression) || source === "hands" && !handCompatible(expression))
      continue;
    seen.add(expression);
    items.push({
      lessonId: l.id,
      expression,
      expected: solve(expression).result
    });
  }
  if (items.length < 10) throw Error("Not enough distinct items");
  return {
    id: globalThis.crypto?.randomUUID?.() || `${seed}-${Math.random()}`,
    unit,
    source,
    timed,
    limitMs: timed ? 6e5 : 0,
    items,
    index: 0,
    responses: [],
    hinted: false,
    checked: false,
    startedAt: Date.now()
  };
}
export function scoreAssessment(responses, { timed = false, limitMs = 6e5 } = {}) {
  const total = responses.length, correct = responses.filter((r) => r.correct && !r.hinted).length, ms = responses.reduce((n, r) => n + Math.max(0, Number(r.ms) || 0), 0);
  const complete = total === 10, accuracy = total ? correct / total : 0, accurate = complete && accuracy >= 0.9, pace = timed && accurate && ms <= limitMs;
  return {
    total,
    correct,
    ms,
    complete,
    accuracy,
    accurate,
    pace,
    passed: accurate && (!timed || pace)
  };
}
export function assessmentHistory(attempts, unit, source) {
  const groups = /* @__PURE__ */ new Map();
  for (const a of attempts) {
    const c = a.config;
    if (a.mode !== "assessment" || c?.unit !== unit || c.source !== source || typeof c.assessmentId !== "string" || !Number.isInteger(c.itemIndex) || c.itemIndex < 0 || c.itemIndex > 9)
      continue;
    const g = groups.get(c.assessmentId) || /* @__PURE__ */ new Map();
    g.set(c.itemIndex, a);
    groups.set(c.assessmentId, g);
  }
  return [...groups].map(([id, g]) => {
    const rows4 = [...g.values()].sort(
      (a, b) => a.config.itemIndex - b.config.itemIndex
    ), last = rows4.at(-1);
    return {
      id,
      at: last.at,
      ...scoreAssessment(rows4, {
        timed: !!last.config.timed,
        limitMs: 6e5
      })
    };
  }).filter((s) => s.complete).sort((a, b) => a.at - b.at);
}
export function unitReadiness(attempts, unit, source) {
  const checks = assessmentHistory(attempts, unit, source), successful = checks.filter((c) => c.passed), latest = checks.at(-1);
  const retained = successful.some(
    (a, i) => successful.slice(i + 1).some((b) => b.at - a.at >= 864e5)
  );
  return {
    checks,
    latest,
    accuracyReady: !!latest?.accurate,
    paceReady: !!latest?.pace,
    retained: retained && !!latest?.passed
  };
}
