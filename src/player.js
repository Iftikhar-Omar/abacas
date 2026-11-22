// File: player.js
// Directory: src/
// The lesson player: a focused, full-screen learning flow that replaces the old
// watch / together / alone panels. One idea per screen, one obvious next action.
//
//   Learn     a short illustrated idea (the "little friend", "big friend"... explainers)
//   Watch     the coach narrates every move while the beads glow and slide
//   Try       the learner makes the same moves; the board checks itself (no "check" button)
//   Practice  fresh questions until three in a row are right (mastery loop)
//
// The player owns its own DOM (an overlay appended to <body>) and its own session state, so the
// app's full re-renders never wipe it. app.js talks to it through configurePlayer() + openLesson().

import { buildScenes, isBoardable, isFractionStyle, pretty, setFractionStyle, taskScenes } from "./coach.js";
import { fractionBarsHTML } from "./fractions.js";
import { solutionScenes } from "./solutions.js";
import { explainerFor, explainerById } from "./explainers.js";
import { P } from "./player-i18n.js";
import { FingerBoard } from "./fingers.js";
import { scriptFor } from "./foundations.js";
import { introExplainer } from "./intro.js";
import { clearCallouts, clearCamera, setCamera, showCallouts } from "./camera.js";
import { sfx } from "./sfx.js";
import { Soroban, layoutFor, snapshotToDigits } from "./soroban.js";

let env = null;
let S = null; // session
let root = null;

export const configurePlayer = (e) => (env = e);
export const playerOpen = () => !!root;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lang = () => env.getLang();
const t = (k, v) => P(k, lang(), v);
const reduced = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const eq = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]);

/* ------------------------------------------------------------------ planning */

function preparePart(part) {
  const trace = env.solve(part.example);
  const sol = solutionScenes(part.example, lang(), { simplify: part.skill === "fractions" });
  const layout = { ...sol.layout };
  // the "fingers" idea is practised on two hands (tens + ones), values 0-99
  if (part.id === "hands") Object.assign(layout, { rods: 2, scale: 0, fingers: true });
  const scenes = sol.scenes;
  if (layout.fingers) handsWording(scenes, layout);
  const boardable = sol.boardable;
  return { part, trace, chips: sol.plain && !sol.trace ? null : sol.trace || chipsFor(part.example), layout, boardable, scenes, tasks: boardable ? taskScenes(scenes) : [], plain: sol.plain };
}

/** A one-chip "equation" strip for explanations that are not a single engine trace. */
const chipsFor = (expr) => ({ source: String(expr), groups: [{ label: String(expr), tone: "neutral" }] });


/** Same scenes, but spoken about hands instead of beads. */
function handsWording(scenes, layout) {
  const fingers = (n) => t(n === 1 ? "finger_one" : "finger_other", { n });
  for (const sc of scenes) {
    if (sc.type === "clear") Object.assign(sc, { title: t("sc_clearHands"), body: t("sc_clearHandsBody") });
    else if (sc.type === "set" && sc.to) {
      const col = layout.rods - 1 - sc.column;
      const digit = sc.to[col];
      const hand = t(sc.column === 0 ? "hand_ones" : "hand_tens");
      sc.title = t("sc_setHands", { digit, hand });
      sc.body = digit === 5 ? t("sc_setHandsBody5") : digit > 5 ? t("sc_setHandsBodyMore", { k: fingers(digit - 5) }) : t("sc_setHandsBody", { k: fingers(digit) });
    } else if (["lowerOn", "lowerOff", "upperOn", "upperOff", "direct", "big1", "big2", "little1", "little2"].includes(sc.type)) {
      sc.body = "";
    }
  }
}

function buildPlan(lesson, seenIdeas) {
  const parts = lesson.parts || [lesson];
  const stages = [];
  if (lesson.intro) return [{ type: "learn", part: 0 }, { type: "done" }];
  const script = scriptFor(lesson.id);
  if (script) stages.push({ type: "script" });
  if (script && !script.keepParts) {
    stages.push({ type: "practice" }, { type: "done" });
    return stages;
  }
  parts.forEach((part, i) => {
    stages.push({ type: "learn", part: i });
    stages.push({ type: "watch", part: i });
    if (S.parts[i].tasks.length) stages.push({ type: "try", part: i });
  });
  stages.push({ type: "practice" });
  stages.push({ type: "done" });
  void seenIdeas;
  return stages;
}

/* ------------------------------------------------------------------ open / close */

export function openLesson(lesson, { startStage = 0 } = {}) {
  closePlayer(true);
  S = {
    lesson,
    parts: [],
    stage: startStage,
    scene: 0,
    auto: false,
    timers: new Set(),
    board: null,
    seen: new Set(),
    q: null,
    started: Date.now(),
    stack: [],
  };
  setFractionStyle(lesson.skill === "fractions" || (lesson.parts || []).some((p) => p.skill === "fractions"));
  S.scriptDef = scriptFor(lesson.id);
  if (lesson.intro) S.explainer = introExplainer(lang());
  S.parts = lesson.intro ? [] : S.scriptDef && !S.scriptDef.keepParts ? [] : (lesson.parts || [lesson]).map(preparePart);
  S.plan = buildPlan(lesson);
  mount();
  enterStage();
}

/** Explainer-only session (the "Helpful ideas" library). */
export function openExplainer(id) {
  const ex = explainerById(id, lang());
  if (!ex) return;
  closePlayer(true);
  S = { lesson: null, explainer: ex, parts: [], plan: [{ type: "learn", part: 0, standalone: true }], stage: 0, scene: 0, auto: false, timers: new Set(), board: null, seen: new Set(), stack: [], started: Date.now() };
  mount();
  enterStage();
}

/** Step-by-step solution of any calculation (used by the Solve page, practice review and unit checks). */
export function openSolution(expr, { at = 0 } = {}) {
  let trace;
  try {
    trace = env.solve(expr);
  } catch {
    return false;
  }
  closePlayer(true);
  setFractionStyle((String(expr).match(/\//g) || []).length >= 2);
  S = { lesson: null, explainer: { title: pretty(trace.source) }, solution: trace, solutionExpr: expr, at, parts: [], plan: [{ type: "solve" }], stage: 0, scene: 0, auto: false, timers: new Set(), board: null, seen: new Set(), stack: [], started: Date.now() };
  mount();
  enterStage();
  return true;
}

/** Unit check (a short, one-attempt-per-question test). `a` comes from assessment.createAssessment(). */
export function openCheck(a) {
  closePlayer(true);
  const title = env.T("assessment");
  S = { lesson: null, explainer: { title: `${title} \u00B7 ${a.unitName}` }, check: a, parts: [], plan: [{ type: "check" }], stage: 0, scene: 0, auto: false, timers: new Set(), board: null, seen: new Set(), stack: [], started: Date.now() };
  a.index = 0;
  a.responses = a.responses || [];
  mount();
  enterStage();
}

export function closePlayer(silent = false) {
  if (!root) return;
  clearTimers();
  S?.board?.destroy?.();
  document.removeEventListener("keydown", onKey, true);
  root.remove();
  root = null;
  document.body.classList.remove("lp-open");
  const prev = S;
  S = null;
  if (!silent) env.onClose?.(prev);
}

/** Re-draw after a language change. */
export function rerenderPlayer() {
  if (!root || !S) return;
  if (S.lesson?.intro) S.explainer = introExplainer(lang());
  if (S.parts.length) S.parts = S.lesson.parts ? S.lesson.parts.map(preparePart) : [preparePart(S.lesson)];
  if (S.plan[S.stage]?.type === "script") S.sx = Math.min(S.sx || 0, S.scriptDef.steps.length - 1);
  enterStage(true);
}

function clearTimers() {
  S?.timers.forEach(clearTimeout);
  S?.timers.clear();
}
function later(fn, ms) {
  const id = setTimeout(() => {
    S?.timers.delete(id);
    fn();
  }, ms);
  S?.timers.add(id);
  return id;
}

/* ------------------------------------------------------------------ chrome */

function mount() {
  root = document.createElement("div");
  root.id = "lp";
  root.className = "lp";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  root.addEventListener("input", (e) => {
    if (e.target.id === "lp-answer") e.target.classList.remove("bad");
  });
  document.addEventListener("keydown", onKey, true);
  document.body.append(root);
  document.body.classList.add("lp-open");
}

const stageLabel = (st) => t(`stage_${st.type === "script" ? "learn" : st.type}`);

function chrome() {
  const l = S.lesson;
  const title = S.explainer ? S.explainer.title : l ? env.titleOf(l) : "";
  const st = S.plan[S.stage];
  const parts = (l?.parts || []).length;
  const sub = st.type === "check" ? stageLabel({ type: "practice" }) : st.type === "solve" ? t("stage_solve") : st.nested || st.standalone ? t("helpfulIdea") : st.type === "done" ? t("stage_done") : parts > 1 && st.part !== undefined && st.type !== "practice" ? `${t("part")} ${st.part + 1}/${parts} · ${stageLabel(st)}` : stageLabel(st);
  const segs = S.plan.filter((x) => x.type !== "done");
  const solo = segs.length <= 1;
  const cur = Math.min(S.stage, segs.length);
  root.setAttribute("aria-label", title);
  return `<header class="lp-top"><button class="lp-x" data-lp="exit" aria-label="${esc(t("exit"))}" title="${esc(t("exit"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
  <div class="lp-progress${solo ? " solo" : ""}" role="progressbar" aria-label="${esc(t("progress"))}" aria-valuemin="0" aria-valuemax="${segs.length}" aria-valuenow="${cur}">${segs.map((x, i) => `<i class="${i < cur ? "done" : i === cur ? "cur" : ""} ${x.type}"></i>`).join("")}</div>
  <div class="lp-title"><b>${esc(title)}</b><small>${esc(sub)}</small></div>
  <button class="lp-x lp-speak" data-lp="speak" aria-label="${esc(t("readAloud"))}" title="${esc(t("readAloud"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z M17 8q6 4 0 8"/></svg></button></header>`;
}

function avatar(mood = "happy") {
  const mouth = { happy: "M24 41q8 8 16 0", cheer: "M22 39q10 12 20 0z", think: "M26 43h12", oops: "M25 44q7-6 14 0" }[mood] || "M24 41q8 8 16 0";
  const brow = mood === "oops" ? '<path d="M20 25l8 3M44 25l-8 3" class="bo-brow"/>' : "";
  return `<svg class="bo bo-${mood}" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="34" rx="29" ry="24" class="bo-body"/><ellipse cx="32" cy="34" rx="8" ry="7" class="bo-hole"/><ellipse cx="22" cy="22" rx="9" ry="4" class="bo-shine"/>${mood === "cheer" ? '<path d="M8 8l4 6M56 8l-4 6M32 2v7" class="bo-spark"/>' : ""}${brow}<circle cx="23" cy="29" r="3.2" class="bo-eye"/><circle cx="41" cy="29" r="3.2" class="bo-eye"/><path d="${mouth}" class="bo-mouth"/></svg>`;
}

function shell(inner) {
  S.view = null;
  root.innerHTML = `${chrome()}<main class="lp-main" id="lp-main">${inner}</main><div class="lp-live" aria-live="polite" id="lp-live"></div>`;
}

const equationChips = (trace, activeGroup) =>
  trace
    ? `<div class="lp-eq" dir="ltr" aria-label="${esc(pretty(trace.source))}">${trace.groups.length > 4 ? `<span class="on">${esc(pretty(trace.source))}</span>` : trace.groups.map((g, i) => `<span class="${i === activeGroup ? "on" : ""} ${g.tone}">${esc(pretty(g.label))}</span>`).join("")}</div>`
    : "";

function boardPanel({ trace, group, boardable, hide, tools = "", art = false }) {
  return `<section class="lp-stage ${boardable && !hide ? "" : "no-board"}" aria-label="${esc(t("abacus"))}">${equationChips(trace, group)}${art ? `<div class="lp-art" id="lp-art" hidden></div>` : ""}${boardable && !hide ? `<div class="lp-board" id="lp-board"></div><div class="lp-foot"><div class="lp-total"><small>${esc(t("boardShows"))}</small><output id="lp-total" dir="ltr">0</output></div>${tools}</div>` : `<div class="lp-mathpad" id="lp-mathpad"></div>${tools}`}</section>`;
}

function makeBoard(layout, interactive, onChange) {
  S.board?.destroy?.();
  const host = root.querySelector("#lp-board");
  if (!host) return (S.board = null);
  const Board = layout.fingers ? FingerBoard : Soroban;
  S.board = new Board(host, { rods: layout.rods, scale: layout.scale, interactive, onChange: (info) => { sfx.tap(); onChange?.(info); }, t });
  return S.board;
}

function setTotal(v) {
  const o = root.querySelector("#lp-total");
  if (o) o.textContent = v;
}

/* ------------------------------------------------------------------ stage router */

function enterStage(keepScene = false) {
  clearTimers();
  S.auto = false;
  const st = S.plan[S.stage];
  if (!keepScene) S.scene = 0;
  if (st.type !== "try") S.try = null;
  ({ learn: stageLearn, watch: stageWatch, try: stageTry, practice: stagePractice, done: stageDone, solve: stageSolve, check: stageCheck, script: stageScript })[st.type](st);
  root.querySelector("[data-primary]")?.focus({ preventScroll: true });
}

function nextStage() {
  if (S.stage < S.plan.length - 1) {
    S.stage++;
    enterStage();
  }
}

/* ------------------------------------------------------------------ scene viewer (Learn + Watch) */

/**
 * Shows a list of scenes one at a time. Used for explainers (learn) and worked examples (watch).
 * `scenes` have { title, body, math, from, to, friend, table, hl }.
 */
function sceneViewer({ scenes, trace, layout, boardable, onFinish, finishLabel, tag }) {
  const v = { scenes, trace, layout, boardable, onFinish, finishLabel, tag, i: S.scene || 0 };
  shell(`${boardPanel({ trace, group: scenes[0]?.group, boardable, art: scenes.some((x) => x.art), tools: `<div class="lp-tools"><button class="lp-chip" data-lp="replay">${icon("replay")}<span>${esc(t("again"))}</span></button><button class="lp-chip" data-lp="auto" aria-pressed="false" id="lp-auto">${icon("play")}<span>${esc(t("autoplay"))}</span></button></div>` })}<section class="lp-coach" id="lp-coach"></section>`);
  S.view = v;
  if (boardable) makeBoard(layout, false);
  showScene(v.i);
}

function showScene(i) {
  const v = S.view;
  clearTimers();
  v.i = Math.max(0, Math.min(v.scenes.length - 1, i));
  S.scene = v.i;
  const sc = v.scenes[v.i];
  const last = v.i === v.scenes.length - 1;
  const coach = root.querySelector("#lp-coach");
  const friendTag = sc.friend ? `<button class="lp-tag ${sc.friend}" data-lp="explain" data-id="${sc.friend === "borrow" ? "borrow" : sc.friend}">${esc(t(`tag_${sc.friend}`))} <span aria-hidden="true">?</span></button>` : "";
  const table = sc.table ? `<div class="lp-table${sc.tableList ? " list" : ""}"${sc.tableList ? "" : ' dir="ltr"'}>${sc.table.map((r) => `<span><b>${esc(r[0])}</b> = ${esc(r[1])}</span>`).join("")}</div>` : "";
  coach.innerHTML = `<div class="lp-count" aria-hidden="true">${v.scenes.map((_, k) => `<i class="${k < v.i ? "done" : k === v.i ? "cur" : ""}"></i>`).join("")}</div><div class="lp-speech">${avatar(last && v.tag === "learn" ? "happy" : "happy")}<div class="lp-bubble" tabindex="-1"><div class="lp-bubble-top">${friendTag}<span class="lp-step">${v.i + 1}/${v.scenes.length}</span></div><h2>${esc(sc.title)}</h2>${sc.body ? `<p>${esc(sc.body)}</p>` : ""}${sc.math ? `<div class="lp-math" dir="ltr">${esc(sc.math)}</div>` : ""}${table}</div></div><div class="lp-actions"><button class="lp-btn ghost" data-lp="back" ${v.i === 0 ? "disabled" : ""}>${esc(t("back"))}</button><button class="lp-btn primary" data-lp="next" data-primary>${esc(last ? v.finishLabel : t("next"))}</button></div>`;
  root.querySelector("#lp-live").textContent = `${sc.title}. ${sc.body || ""}`;
  autoSpeak(`${sc.title}. ${sc.body || ""}`);
  // picture slides (introduction) replace the live abacus
  const artEl = root.querySelector("#lp-art");
  if (artEl) {
    artEl.hidden = !sc.art;
    artEl.innerHTML = sc.art || "";
    root.querySelector("#lp-board")?.toggleAttribute("hidden", !!sc.art);
    root.querySelector(".lp-total")?.toggleAttribute("hidden", !!sc.art);
  }
  // camera + labelled callouts (introduction): tilt, pan and zoom to the part being explained
  const stageEl = root.querySelector(".lp-stage");
  clearCallouts(stageEl);
  stageEl?.classList.toggle("hide-places", !!sc.hidePlaces);
  if (S.board && sc.cam && !sc.art) {
    setCamera(S.board, sc.cam, { reduced: reduced() });
    if (sc.labels?.length) later(() => showCallouts(stageEl, S.board, sc.labels), reduced() ? 0 : 1500);
  } else if (S.board) clearCamera(S.board);
  // board
  if (S.board && v.boardable && !sc.art) {
    if (sc.hl) {
      S.board.set(sc.from || sc.to);
      S.board.highlight(sc.hl);
      if (sc.to && sc.from && !eq(sc.from, sc.to)) later(() => S.board.set(sc.to), reduced() ? 0 : 900);
      setTotal(sc.after?.value ?? (sc.to ? S.board.valueOf(sc.to) : S.board.value));
    } else if (sc.from && sc.to) {
      S.board.set(sc.from);
      S.board.hintMove(sc.from, sc.to);
      setTotal(sc.from ? S.board.valueOf(sc.from) : "0");
      if (!eq(sc.from, sc.to)) later(() => { S.board.set(sc.to); setTotal(sc.after?.value ?? S.board.valueOf(sc.to)); }, reduced() ? 0 : 750);
      else setTotal(sc.after?.value ?? S.board.valueOf(sc.to));
    } else {
      // scene the abacus can't show: keep the previous picture
      const prev = [...v.scenes.slice(0, v.i)].reverse().find((x) => x.to);
      if (prev) S.board.set(prev.to);
      S.board.clearHints();
    }
  }
  // math pad (for lessons the abacus can't show)
  const pad = root.querySelector("#lp-mathpad");
  if (pad) {
    const lines = v.scenes.slice(0, v.i + 1).filter((x) => x.math).slice(-5);
    pad.innerHTML = sc.fractions ? `${fractionBarsHTML(sc.fractions)}<div class="now" dir="ltr">${esc(sc.math)}</div>` : lines.map((x, k) => `<div class="${k === lines.length - 1 ? "now" : ""}" dir="ltr">${esc(x.math)}</div>`).join("") || `<div class="now" dir="ltr">${esc(pretty(v.trace?.source || ""))}</div>`;
  }
  if (v.auto) autoTick();
}

function autoTick() {
  const v = S.view;
  if (!S.auto) return;
  later(() => {
    if (!S.auto) return;
    if (v.i < v.scenes.length - 1) {
      showScene(v.i + 1);
      autoTick();
    } else setAuto(false);
  }, 3600);
}

function setAuto(on) {
  S.auto = on;
  S.view.auto = on;
  const b = root.querySelector("#lp-auto");
  if (b) {
    b.setAttribute("aria-pressed", String(on));
    b.querySelector("span").textContent = t(on ? "pause" : "autoplay");
    b.querySelector("svg").outerHTML = icon(on ? "pause" : "play");
  }
  if (on) autoTick();
  else clearTimers();
}

/* ------------------------------------------------------------------ Solve (any calculation) */

function stageSolve() {
  const sol = solutionScenes(S.solutionExpr, lang());
  // jump to the scene that contains engine step `at` (only meaningful for plain bead flows)
  const idx = sol.trace ? sol.scenes.findIndex((sc) => sc.first <= S.at && sc.last >= S.at) : 0;
  S.scene = idx > 0 ? idx : 0;
  sceneViewer({ scenes: sol.scenes, trace: sol.trace || (sol.plain ? null : chipsFor(S.solutionExpr)), layout: sol.layout, boardable: sol.boardable, tag: "solution", finishLabel: t("done"), onFinish: () => closePlayer() });
}

/* ------------------------------------------------------------------ Script (child-first lessons) */

function stageScript() {
  S.sx = S.sx || 0;
  S.cur = S.cur || Array(S.scriptDef.rods).fill(0);
  drawScriptStep();
}

function drawScriptStep() {
  const def = S.scriptDef;
  const st = def.steps[S.sx];
  const key = `fd_${def.id}_${S.sx + 1}`;
  const layout = { rods: def.rods, scale: 0 };
  const start = st.from || st.show || S.cur;
  const last = S.sx === def.steps.length - 1;
  const isDo = st.kind === "do";
  const sc = (S.script = { st, key, wrong: 0, done: false, start: start.slice() });
  const dots = `<div class="lp-count" aria-hidden="true">${def.steps.map((_, k) => `<i class="${k < S.sx ? "done" : k === S.sx ? "cur" : ""}"></i>`).join("")}</div>`;
  const kicker = st.kind === "do" ? t("yourTurn") : st.kind === "ask" ? t("quickQuestion") : t("boSays");
  const choices = st.kind === "ask" ? `<div class="lp-choices" role="group" aria-label="${esc(t("pickOne"))}">${st.choices.map((c) => `<button class="lp-choice" data-lp="choice" data-v="${c}" dir="ltr">${c}</button>`).join("")}</div>` : "";
  const tools = isDo ? `<div class="lp-tools"><button class="lp-chip" data-lp="scriptReset">${icon("reset")}<span>${esc(t("startOver"))}</span></button></div>` : "";
  const actions = st.kind === "ask" ? "" : isDo ? `<button class="lp-btn ghost" data-lp="scriptShow">${esc(t("showMeInstead"))}</button>` : `<button class="lp-btn ghost" data-lp="scriptBack" ${S.sx === 0 ? "disabled" : ""}>${esc(t("back"))}</button><button class="lp-btn primary" data-lp="scriptNext" data-primary>${esc(last ? t("fd_great") : S.sx === 0 ? t("fd_lets") : t("next"))}</button>`;
  shell(`${boardPanel({ trace: null, boardable: true, tools })}<section class="lp-coach" id="lp-coach">${dots}<div class="lp-speech">${avatar(S.sx === 0 ? "cheer" : "happy")}<div class="lp-bubble" id="lp-bubble"><div class="lp-bubble-top"><span class="lp-kicker">${esc(kicker)}</span><span class="lp-step">${S.sx + 1}/${def.steps.length}</span></div><h2>${esc(t(`${key}_t`))}</h2><p>${esc(t(`${key}_b`))}</p>${st.math ? `<div class="lp-math" dir="ltr">${esc(st.math)}</div>` : ""}</div></div>${choices}<div class="lp-feedback" id="lp-fb" role="status"></div><div class="lp-actions">${actions}</div></section>`);
  makeBoard(layout, isDo, isDo ? onScriptChange : null);
  S.board.set(start);
  setTotal(S.board.valueOf(start));
  if (st.kind === "ask") {
    S.board.hideDigits(true);
    setTotal("?");
  }
  if (isDo) {
    if (st.hintMove) S.board.hintMove(start, st.target);
    else if (st.hint) S.board.highlight(st.hint);
    if (st.free) sc.free = true;
  } else if (st.kind === "say") {
    if (st.hl) S.board.highlight(st.hl);
    if (st.to && !eq(st.to, start)) {
      if (!st.hl) S.board.hintMove(start, st.to);
      later(() => {
        S.board.set(st.to);
        setTotal(S.board.valueOf(st.to));
      }, reduced() ? 0 : 900);
    }
  }
  const final = st.to || st.show || start;
  if (st.kind === "say") S.cur = final.slice();
  root.querySelector("#lp-live").textContent = `${t(`${key}_t`)}. ${t(`${key}_b`)}`;
  autoSpeak(`${t(`${key}_t`)}. ${t(`${key}_b`)}`);
  root.querySelector("[data-primary]")?.focus({ preventScroll: true });
}

function scriptSuccess(digits) {
  const sc = S.script;
  if (sc.done) return;
  sc.done = true;
  S.cur = digits.slice();
  const { st, key } = sc;
  S.board.hideDigits(false);
  setTotal(S.board.valueOf(digits));
  const fb = root.querySelector("#lp-fb");
  S.board.clearHints();
  S.board.flash("ok");
  sfx.ok();
  root.querySelector(".bo")?.replaceWith(htmlNode(avatar("cheer")));
  const okT = st.kind === "ask" ? t(pick(["nice", "great", "yes"])) : t(`${key}_ok`);
  const okB = t(`${key}_okb`);
  root.querySelector("#lp-bubble").innerHTML = `<div class="lp-bubble-top"><span class="lp-kicker">${esc(t("nice"))}</span><span class="lp-step">${S.sx + 1}/${S.scriptDef.steps.length}</span></div><h2>${esc(okT)}</h2><p>${esc(okB === `${key}_okb` ? "" : okB)}</p>${st.math ? `<div class="lp-math" dir="ltr">${esc(st.math)}</div>` : ""}`;
  fb.className = "lp-feedback";
  fb.textContent = "";
  const last = S.sx === S.scriptDef.steps.length - 1;
  root.querySelector(".lp-actions").innerHTML = `<button class="lp-btn primary" data-lp="scriptNext" data-primary>${esc(last ? t("fd_great") : t("fd_great"))}</button>`;
  root.querySelector("[data-primary]").focus({ preventScroll: true });
  root.querySelector("#lp-live").textContent = `${okT}. ${okB}`;
  autoSpeak(`${okT}. ${okB === `${key}_okb` ? "" : okB}`);
}

function onScriptChange({ digits }) {
  const sc = S.script;
  if (!sc || sc.done) return;
  const st = sc.st;
  setTotal(S.board.valueOf(digits));
  if (st.free) {
    if (!eq(digits, sc.start)) scriptSuccess(digits);
    return;
  }
  if (eq(digits, st.target)) return scriptSuccess(digits);
  const fb = root.querySelector("#lp-fb");
  if (st.loose) {
    // multi-tap step: any in-between state is fine, just keep the hint pointing at what is left
    fb.className = "lp-feedback hint";
    const hn = t(`${sc.key}_nudge`);
    fb.innerHTML = `<b>${esc(t("keepGoing2"))}</b> ${esc(hn === `${sc.key}_nudge` ? "" : hn)}`;
    S.board.hintMove(digits, st.target);
    return;
  }
  if (eq(digits, sc.start)) {
    fb.className = "lp-feedback";
    fb.textContent = "";
    return;
  }
  sc.wrong++;
  sfx.no();
  const nudge = t(`${sc.key}_nudge`);
  fb.className = "lp-feedback no";
  fb.innerHTML = `<b>${esc(t("fd_almost", { v: S.board.valueOf(digits) }))}</b> ${esc(nudge === `${sc.key}_nudge` ? "" : nudge)}`;
  root.querySelector(".bo")?.replaceWith(htmlNode(avatar("think")));
  if (sc.wrong >= 1) S.board.hintMove(digits, st.target);
}

function scriptChoice(btn) {
  const sc = S.script;
  if (sc.done) return;
  const v = Number(btn.dataset.v);
  if (v === sc.st.answer) {
    root.querySelectorAll(".lp-choice").forEach((b) => (b.disabled = true));
    btn.classList.add("right");
    scriptSuccess(sc.st.show || S.cur);
  } else {
    sfx.no();
    btn.disabled = true;
    btn.classList.add("wrong");
    const fb = root.querySelector("#lp-fb");
    fb.className = "lp-feedback no";
    fb.textContent = t("fd_tryAnother");
    root.querySelector(".bo")?.replaceWith(htmlNode(avatar("think")));
  }
}

function scriptNext() {
  if (S.sx < S.scriptDef.steps.length - 1) {
    S.sx++;
    return drawScriptStep();
  }
  S.sx = 0;
  S.cur = null;
  nextStage();
}

/* ------------------------------------------------------------------ Unit check */

const unitLabel = (a) => `${a.index + 1} / ${a.items.length}`;

function stageCheck() {
  const a = S.check;
  if (a.index >= a.items.length) return checkResults();
  const item = a.items[a.index];
  const trace = env.solve(item.expression);
  const layout = layoutFor(trace.steps.flatMap((x) => [x.before, x.after]));
  const hands = a.source === "hands";
  if (hands) Object.assign(layout, { rods: 2, scale: 0, fingers: true });
  const boardable = trace.steps.some((x) => x.after.raw !== null && x.after.raw !== undefined) && !trace.steps.some((x) => String(x.after.raw ?? "").startsWith("-"));
  const op = trace.steps.find((x) => x.kind === "operation");
  const mental = a.source === "mental";
  a.cur = { item, trace, layout, boardable, start: op?.before || { raw: "0", scale: 0, value: "0" }, at: performance.now(), hinted: false, done: false };
  const hidden = mental;
  shell(`${boardPanel({ trace: null, boardable, hide: !boardable, tools: boardable ? `<div class="lp-tools"><button class="lp-chip" data-lp="clearBoard">${icon("reset")}<span>${esc(t("clearBoard"))}</span></button></div>` : "" })}<section class="lp-coach" id="lp-coach"><div class="lp-count" aria-hidden="true">${a.items.map((_, k) => `<i class="${k < a.index ? "done" : k === a.index ? "cur" : ""}"></i>`).join("")}</div><div class="lp-speech">${avatar("think")}<div class="lp-bubble"><div class="lp-bubble-top"><span class="lp-kicker">${esc(a.timed ? env.S("timedCheck") : env.T("untimed"))}</span><span class="lp-step" id="lp-clock">${unitLabel(a)}</span></div><div class="lp-question" dir="ltr">${esc(pretty(item.expression))}</div><p>${esc(env.S("checkIndependent"))}</p></div></div><form class="lp-answer" id="lp-form" autocomplete="off"><label class="sr-only" for="lp-answer">${esc(t("answer"))}</label><input id="lp-answer" name="a" inputmode="text" placeholder="${esc(t("answer"))}" maxlength="80" dir="ltr" autocapitalize="off" spellcheck="false"><button class="lp-btn primary" type="submit">${esc(t("check"))}</button></form><div class="lp-feedback" id="lp-fb" role="status"></div><div class="lp-actions row">${hidden ? `<button class="lp-btn ghost small" data-lp="peek">${esc(env.S("revealModel"))}</button>` : ""}</div></section>`);
  if (boardable) {
    makeBoard(layout, true, ({ digits }) => setTotal(S.board.valueOf(digits))).set(a.cur.start);
    setTotal(a.cur.start.value);
    if (hidden) root.querySelector(".lp-stage").classList.add("covered");
  }
  if (a.timed) {
    const tick = () => {
      const ms = a.responses.reduce((n, r) => n + r.ms, 0) + (a.cur.done ? 0 : performance.now() - a.cur.at);
      const el = root.querySelector("#lp-clock");
      if (el) el.textContent = `${unitLabel(a)} \u00B7 ${Math.floor(ms / 6e4)}:${String(Math.floor(ms / 1e3) % 60).padStart(2, "0")} / 10:00`;
    };
    tick();
    const loop = setInterval(() => (root && S?.check === a ? tick() : clearInterval(loop)), 1000);
  }
  root.querySelector("#lp-answer").focus({ preventScroll: true });
}

function submitCheck(value) {
  const a = S.check;
  const c = a.cur;
  if (c.done || !String(value).trim()) return;
  c.done = true;
  const ok = env.answerEquals(value, c.item.expected, c.item.expression);
  const response = { correct: ok, hinted: c.hinted, ms: performance.now() - c.at, source: a.source };
  a.responses.push(response);
  env.recordCheck({ ...response, lessonId: undefined, mode: "assessment", expression: c.item.expression, answer: String(value), expected: c.item.expected, config: { unit: a.unit, source: a.source, assessmentId: a.id, itemIndex: a.index, timed: a.timed, assessmentLesson: c.item.lessonId } });
  const fb = root.querySelector("#lp-fb");
  fb.className = `lp-feedback ${ok ? "ok" : "no"}`;
  fb.innerHTML = ok ? `<b>${esc(t("nice"))}</b>` : `<b>${esc(env.T("practicing"))}</b> <span dir="ltr">${esc(pretty(c.item.expected))}</span>`;
  root.querySelector("#lp-form").hidden = true;
  const last = a.index >= a.items.length - 1;
  root.querySelector(".lp-actions").classList.remove("row");
  root.querySelector(".lp-actions").innerHTML = `<button class="lp-btn primary" data-lp="checkNext" data-primary>${esc(last ? t("finish") : t("nextQuestion"))}</button>`;
  root.querySelector("[data-primary]").focus({ preventScroll: true });
}

function checkResults() {
  const a = S.check;
  const r = env.scoreCheck(a);
  shell(`<section class="lp-stage no-board done"><div class="lp-trophy" aria-hidden="true">${confetti()}</div></section><section class="lp-coach"><div class="lp-speech">${avatar(r.passed ? "cheer" : "happy")}<div class="lp-bubble"><h2>${esc(r.passed ? env.S("accuracyReady") : env.S("notYet"))}</h2><p>${esc(a.timed ? (r.pace ? env.S("paceReady") : env.S("notYet")) : env.S("checkNote"))}</p><div class="lp-math" dir="ltr">${Math.round(r.accuracy * 100)}% \u00B7 ${(r.ms / 1e3).toFixed(1)}s</div></div></div><div class="lp-actions col"><button class="lp-btn primary" data-lp="exit" data-primary>${esc(t("backToPath"))}</button><button class="lp-btn ghost" data-lp="checkAgain">${esc(env.S("checkAgain"))}</button></div></section>`);
}

/* ------------------------------------------------------------------ Learn */

function stageLearn(st) {
  const part = S.parts[st.part]?.part || S.lesson;
  const ex = S.explainer || explainerFor(part, lang(), S.seen);
  if (ex) {
    S.seen.add(ex.id);
    sceneViewer({
      scenes: ex.scenes,
      trace: null,
      layout: { rods: ex.rods, scale: ex.scale || 0 },
      boardable: true,
      tag: "learn",
      finishLabel: st.nested ? t("backToLesson") : st.standalone ? t("done") : S.lesson?.intro ? t("in_finish") : t("letsWatch"),
      onFinish: () => (st.nested ? popExplainer() : st.standalone ? closePlayer() : nextStage()),
    });
    return;
  }
  // no illustration for this idea: a single "idea" scene with the worked example's starting board
  const p = S.parts[st.part];
  const snap = p.trace.steps.find((x) => x.kind === "operation")?.before || p.trace.steps.at(-1).after;
  const digits = p.boardable ? snapshotToDigits(snap, p.layout.rods, p.layout.scale) : null;
  sceneViewer({
    scenes: [{ title: env.titleOf(part), body: env.ideaOf(part), math: pretty(p.part.example), from: digits, to: digits, boardable: !!digits, group: -1, after: snap }],
    trace: p.trace,
    layout: p.layout,
    boardable: p.boardable,
    tag: "idea",
    finishLabel: t("showMe"),
    onFinish: () => nextStage(),
  });
}

/* ------------------------------------------------------------------ Watch */

function stageWatch(st) {
  const p = S.parts[st.part];
  sceneViewer({
    scenes: p.scenes,
    trace: p.chips,
    layout: p.layout,
    boardable: p.boardable,
    tag: "watch",
    finishLabel: p.tasks.length ? t("nowYou") : S.parts.length > 1 && st.part < S.parts.length - 1 ? t("nextIdea") : t("startPractice"),
    onFinish: () => nextStage(),
  });
}

/* ------------------------------------------------------------------ Try (guided, self-checking) */

function stageTry(st) {
  const p = S.parts[st.part];
  S.try = { p, k: 0, undo: [], wrong: 0, done: false };
  shell(`${boardPanel({ trace: p.chips, group: Math.min(p.tasks[0].group || 0, (p.chips?.groups.length || 1) - 1), boardable: true, tools: `<div class="lp-tools"><button class="lp-chip" data-lp="undo" id="lp-undo" disabled>${icon("undo")}<span>${esc(t("undo"))}</span></button><button class="lp-chip" data-lp="resetTask">${icon("reset")}<span>${esc(t("startOver"))}</span></button></div>` })}<section class="lp-coach" id="lp-coach"></section>`);
  makeBoard(p.layout, true, onTryChange);
  showTask();
}

function showTask() {
  const T = S.try;
  const task = T.p.tasks[T.k];
  const board = S.board;
  T.done = false;
  T.wrong = 0;
  T.undo = [];
  board.set(task.from);
  board.hintMove(task.from, task.to);
  setTotal(board.valueOf(task.from));
  root.querySelector(".lp-eq")?.querySelectorAll("span").forEach((s, i) => s.classList.toggle("on", i === task.group));
  const coach = root.querySelector("#lp-coach");
  coach.innerHTML = `<div class="lp-count" aria-hidden="true">${T.p.tasks.map((_, k) => `<i class="${k < T.k ? "done" : k === T.k ? "cur" : ""}"></i>`).join("")}</div><div class="lp-speech">${avatar("think")}<div class="lp-bubble" id="lp-bubble"><div class="lp-bubble-top"><span class="lp-kicker">${esc(t("yourTurn"))}</span><span class="lp-step">${T.k + 1}/${T.p.tasks.length}</span></div><h2>${esc(task.title)}</h2><p>${esc(t("tryHint"))}</p>${task.math ? `<div class="lp-math" dir="ltr">${esc(task.math)}</div>` : ""}</div></div><div class="lp-feedback" id="lp-fb" role="status"></div><div class="lp-actions"><button class="lp-btn ghost" data-lp="skipTask">${esc(t("showMeInstead"))}</button></div>`;
  root.querySelector("#lp-live").textContent = task.title;
  autoSpeak(task.title);
}

function onTryChange({ digits }) {
  const T = S.try;
  if (!T || T.done) return;
  const task = T.p.tasks[T.k];
  setTotal(S.board.valueOf(digits));
  const undo = root.querySelector("#lp-undo");
  T.undo.push(digits);
  if (undo) undo.disabled = false;
  const fb = root.querySelector("#lp-fb");
  if (eq(digits, task.to)) return taskDone(true);
  if (eq(digits, task.from) || (task.waypoints || []).some((w) => eq(w, digits))) {
    fb.className = "lp-feedback";
    fb.textContent = "";
    return;
  }
  T.wrong++;
  fb.className = "lp-feedback no";
  fb.innerHTML = `<b>${esc(t("notYet"))}</b> ${esc(t("boardNow", { v: S.board.valueOf(digits), want: task.after.value }))} <button class="lp-link" data-lp="undo">${esc(t("undo"))}</button>`;
  S.board.flash("no");
  sfx.no();
  S.board.hintMove(digits, task.to);
  const av = root.querySelector(".bo");
  if (av) av.outerHTML = avatar("oops");
}

function taskDone(ok) {
  const T = S.try;
  T.done = true;
  const task = T.p.tasks[T.k];
  S.board.clearHints();
  S.board.flash("ok");
  sfx.ok();
  const fb = root.querySelector("#lp-fb");
  fb.className = "lp-feedback ok";
  fb.innerHTML = `<b>${esc(t(pick(["nice", "great", "yes"])))}</b> ${esc(t("boardIs", { v: task.after.value }))}`;
  const av = root.querySelector(".bo");
  if (av) av.outerHTML = avatar("cheer");
  root.querySelector("#lp-live").textContent = t("nice");
  const last = T.k >= T.p.tasks.length - 1;
  later(() => {
    if (!S?.try) return;
    if (last) {
      root.querySelector("#lp-coach").innerHTML = `<div class="lp-speech">${avatar("cheer")}<div class="lp-bubble"><h2>${esc(t("tryDone"))}</h2><p>${esc(t("tryDoneBody"))}</p></div></div><div class="lp-actions"><button class="lp-btn primary" data-lp="tryNext" data-primary>${esc(S.stage < S.plan.length - 1 && S.plan[S.stage + 1].type === "learn" ? t("nextIdea") : t("startPractice"))}</button></div>`;
      root.querySelector("[data-primary]").focus({ preventScroll: true });
    } else {
      T.k++;
      showTask();
    }
  }, reduced() ? 300 : 1100);
  void ok;
}
/** Read the coach aloud when "Read to me" is on (Settings / welcome). */
function autoSpeak(text) {
  if (env.autoRead?.() && text) env.read(text, true);
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ------------------------------------------------------------------ Practice (mastery loop) */

const NEED = 3; // in a row
const MAX_Q = 9;

function newQuestion() {
  const l = S.lesson;
  const q = S.q;
  let expr;
  if (!q.pool.length) {
    const seed = Date.now() + q.asked * 7919;
    q.pool = env.freshQuestions(l, seed, "abacus").filter((e) => !q.used.has(e));
    if (!q.pool.length) q.pool = [...l.practice].filter((e) => !q.used.has(e));
    if (!q.pool.length) q.pool = [...l.practice];
  }
  expr = q.pool.shift();
  q.used.add(expr);
  q.expr = expr;
  q.trace = env.solve(expr);
  q.expected = q.trace.result;
  q.tries = 0;
  q.hinted = false;
  q.revealed = false;
  q.start = performance.now();
  q.state = "ask"; // ask | right | show
  const snaps = q.trace.steps.flatMap((s) => [s.before, s.after]);
  q.layout = layoutFor(snaps);
  q.boardable = isBoardable(q.trace) && !isFractionStyle();
  const op = q.trace.steps.find((s) => s.kind === "operation");
  q.startSnap = op?.before || { raw: "0", scale: 0, value: "0" };
  // a plain number means "show it" / "read it" rather than "work it out"
  q.kind = /^\d+(\.\d+)?$/.test(expr.trim()) && q.boardable ? (q.asked % 2 ? "read" : "build") : "calc";
  if (q.kind === "build") q.startSnap = { raw: "0", scale: q.layout.scale, value: "0" };
  if (q.kind === "read") q.startSnap = q.trace.steps.at(-1).after;
  q.mental = S.lesson.skill === "mental" || env.track() === "mental";
}

function stagePractice() {
  S.q = S.q || { pool: [], used: new Set(), asked: 0, streak: 0, right: 0, wrong: 0, log: [] };
  newQuestion();
  drawQuestion();
}

function drawQuestion() {
  const q = S.q;
  const hideBoard = q.mental && !q.revealed;
  const text = q.kind === "build" ? t("showOnBoard", { n: pretty(q.expr) }) : q.kind === "read" ? t("whatNumber") : pretty(q.expr);
  shell(`${boardPanel({ trace: null, boardable: q.boardable, hide: !q.boardable, tools: q.boardable ? `<div class="lp-tools"><button class="lp-chip" data-lp="clearBoard">${icon("reset")}<span>${esc(t("clearBoard"))}</span></button></div>` : "" })}<section class="lp-coach" id="lp-coach"><div class="lp-streak" aria-label="${esc(t("inARow", { n: NEED }))}">${Array.from({ length: NEED }, (_, i) => `<i class="${i < q.streak ? "on" : ""}"></i>`).join("")}<small>${esc(t("inARow", { n: NEED }))}</small></div><div class="lp-speech">${avatar("think")}<div class="lp-bubble"><div class="lp-bubble-top"><span class="lp-kicker">${esc(t("question"))} ${q.asked + 1}</span></div><div class="lp-question" dir="ltr" aria-label="${esc(text)}"${q.kind === "read" ? ` data-read="${esc(q.expr)}"` : ""}>${esc(text)}</div><p>${esc(q.kind === "build" ? t("buildHint") : q.kind === "read" ? t("readHint") : hideBoard ? t("picture") : q.boardable ? t("practiceHint") : t("practiceHintNoBoard"))}</p></div></div><form class="lp-answer" id="lp-form" ${q.kind === "build" ? "hidden" : ""} autocomplete="off"><label class="sr-only" for="lp-answer">${esc(t("answer"))}</label><input id="lp-answer" name="a" inputmode="${/[\/x=\u2212-]/.test(q.expected + q.expr) ? "text" : "decimal"}" placeholder="${esc(t("answer"))}" maxlength="40" dir="ltr" autocapitalize="off" spellcheck="false" enterkeyhint="done"><button class="lp-btn primary" type="submit">${esc(t("check"))}</button></form><div class="lp-feedback" id="lp-fb" role="status"></div><div class="lp-actions row"><button class="lp-btn ghost small" data-lp="hint">${esc(t("hint"))}</button>${q.mental && !q.revealed ? `<button class="lp-btn ghost small" data-lp="peek">${esc(t("peek"))}</button>` : ""}</div></section>`);
  if (q.boardable) {
    const b = makeBoard(q.layout, q.kind !== "read", ({ digits }) => {
      setTotal(S.board.valueOf(digits));
      if (q.kind === "build" && q.state === "ask" && S.board.valueOf(digits) === String(+q.expr)) afterAnswer(true, S.board.valueOf(digits));
    });
    b.set(q.startSnap);
    setTotal(q.startSnap.value);
    if (q.kind === "read") {
      b.hideDigits(true);
      setTotal("?");
    }
    if (hideBoard) {
      root.querySelector(".lp-stage").classList.add("covered");
    }
  }
  if (q.kind !== "build") root.querySelector("#lp-answer").focus({ preventScroll: true });
}

function checkAnswer(value) {
  const q = S.q;
  if (q.state !== "ask" || !String(value).trim()) return;
  afterAnswer(env.answerEquals(value, q.expected, q.expr), value);
}

function afterAnswer(ok, value) {
  const q = S.q;
  q.tries++;
  const ms = performance.now() - q.start;
  env.recordAttempt({ lessonId: S.lesson.id, correct: ok, ms, hinted: q.hinted || q.revealed, mode: "recall", expression: q.expr, answer: String(value), expected: q.expected, config: { source: "abacus", player: 5, support: q.mental && !q.revealed ? "hidden" : "visible" } });
  const fb = root.querySelector("#lp-fb");
  const input = root.querySelector("#lp-answer");
  if (ok) {
    q.state = "right";
    sfx.ok();
    if (q.kind === "read") {
      S.board?.hideDigits(false);
      setTotal(q.startSnap.value);
    }
    if (!q.hinted && !q.revealed && q.tries === 1) q.streak++;
    else q.streak = 0;
    q.right++;
    q.asked++;
    S.board?.flash("ok");
    const done = q.streak >= NEED || q.asked >= MAX_Q;
    fb.className = "lp-feedback ok";
    fb.innerHTML = `<b>${esc(t(pick(["nice", "great", "yes"])))}</b> ${esc(pretty(q.expr))} = <b dir="ltr">${esc(pretty(q.expected))}</b>`;
    root.querySelector(".bo")?.replaceWith(htmlNode(avatar("cheer")));
    root.querySelector(".lp-streak").innerHTML = `${Array.from({ length: NEED }, (_, i) => `<i class="${i < q.streak ? "on pop" : ""}"></i>`).join("")}<small>${esc(t("inARow", { n: NEED }))}</small>`;
    root.querySelector("#lp-form").hidden = true;
    root.querySelector(".lp-actions").classList.remove("row");
    root.querySelector(".lp-actions").innerHTML = `<button class="lp-btn primary" data-lp="qnext" data-primary>${esc(done ? t("finish") : t("nextQuestion"))}</button>`;
    root.querySelector("[data-primary]").focus({ preventScroll: true });
    q.finished = done;
  } else {
    q.streak = 0;
    q.wrong++;
    sfx.no();
    S.board?.flash("no");
    input?.classList.add("bad");
    root.querySelector(".bo")?.replaceWith(htmlNode(avatar("oops")));
    root.querySelector(".lp-streak").innerHTML = `${Array.from({ length: NEED }, () => "<i></i>").join("")}<small>${esc(t("inARow", { n: NEED }))}</small>`;
    if (q.tries >= 2) {
      fb.className = "lp-feedback no";
      fb.innerHTML = `<b>${esc(t("letsSee"))}</b> <span>${esc(t("showSolutionBody"))}</span>`;
      root.querySelector(".lp-actions").innerHTML = `<button class="lp-btn primary" data-lp="showSolution" data-primary>${esc(t("showSolution"))}</button><button class="lp-btn ghost small" data-lp="skipQ">${esc(t("nextQuestion"))}</button>`;
    } else {
      fb.className = "lp-feedback no";
      fb.innerHTML = `<b>${esc(t("notQuite"))}</b> ${esc(t("tryAgain"))}`;
    }
    input?.select();
  }
}
const htmlNode = (h) => {
  const d = document.createElement("div");
  d.innerHTML = h;
  return d.firstElementChild;
};

function nextQuestion() {
  const q = S.q;
  if (q.finished) {
    S.stage = S.plan.findIndex((x) => x.type === "done");
    enterStage();
    return;
  }
  if (q.state === "show") q.asked++;
  if (q.asked >= MAX_Q) {
    S.stage = S.plan.findIndex((x) => x.type === "done");
    enterStage();
    return;
  }
  newQuestion();
  drawQuestion();
}

/** Worked solution of the current question, shown with the same scene viewer. */
function showSolution() {
  const q = S.q;
  q.state = "show";
  const sol = solutionScenes(q.expr, lang(), { simplify: isFractionStyle() });
  const back = () => {
    // returning from a solution always moves on to a fresh question
    q.asked++;
    q.streak = 0;
    if (q.asked >= MAX_Q) {
      S.stage = S.plan.findIndex((x) => x.type === "done");
      enterStage();
    } else {
      newQuestion();
      drawQuestion();
    }
  };
  sceneViewer({ scenes: sol.scenes, trace: sol.trace || (sol.plain ? null : chipsFor(q.expr)), layout: sol.layout, boardable: sol.boardable, tag: "solution", finishLabel: t("nextQuestion"), onFinish: back });
}

/* ------------------------------------------------------------------ Done */

function stageDone() {
  const q = S.q || { right: 0, wrong: 0, streak: 0, asked: 0 };
  const l = S.lesson;
  if (l.intro) env.markLearned?.(l); // an orientation lesson: finishing it is the mastery
  const status = env.statusOf(l);
  const mastered = q.streak >= NEED || ["learned", "retained"].includes(status);
  const stars = l.intro || q.wrong === 0 ? 3 : q.wrong <= 2 ? 2 : 1;
  const next = env.nextLesson(l);
  const due = env.dueText(l);
  sfx.done();
  shell(`<section class="lp-stage no-board done"><div class="lp-trophy" aria-hidden="true">${confetti()}</div></section><section class="lp-coach"><div class="lp-speech">${avatar(mastered ? "cheer" : "happy")}<div class="lp-bubble"><h2>${esc(l.intro ? t("in_doneT") : mastered ? t("lessonDone") : t("keepGoing"))}</h2><p>${esc(l.intro ? t("in_doneB") : mastered ? t("lessonDoneBody") : t("keepGoingBody"))}</p><div class="lp-stars" aria-label="${stars} / 3">${[1, 2, 3].map((n) => `<svg class="${n <= stars ? "on" : ""}" viewBox="0 0 24 24"><path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"/></svg>`).join("")}</div>${mastered ? `<div class="lp-sticker"><span class="sticker on c${l.order % 6}"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="m24 9 4.4 9 9.9 1.4-7.2 7 1.7 9.9L24 31.6l-8.8 4.7 1.7-9.9-7.2-7 9.9-1.4z"/></svg><b>${l.order + 1}</b></span><strong>${esc(t("stickerNew"))}</strong></div>` : ""}${l.intro ? "" : `<p class="lp-fine">${esc(t("scoreLine", { right: q.right, total: q.asked }))}${due ? ` · ${esc(t("reviewOn", { d: due }))}` : ""}</p>`}</div></div><div class="lp-actions col"><button class="lp-btn primary" data-lp="gonext" data-primary>${esc(next ? t("nextLesson") : t("backToPath"))}</button>${l.intro ? "" : `<button class="lp-btn ghost" data-lp="again">${esc(t("practiceMore"))}</button>`}<button class="lp-btn ghost" data-lp="exit">${esc(t("backToPath"))}</button></div></section>`);
  S.board = null;
}

const confetti = () => `<svg viewBox="0 0 200 200"><g class="cf">${Array.from({ length: 18 }, (_, i) => `<rect x="${10 + ((i * 37) % 180)}" y="${(i * 53) % 90}" width="8" height="14" rx="3" fill="${["#ffbd62", "#3458db", "#12b886", "#ff6b81", "#9762d1"][i % 5]}" style="--d:${(i % 6) * 0.18}s" transform="rotate(${i * 29} ${14 + ((i * 37) % 180)} ${(i * 53) % 90})"/>`).join("")}</g><circle cx="100" cy="120" r="46" fill="#fff6e0" stroke="#ffbd62" stroke-width="6"/><path d="m100 92 8.8 18 19.7 2.7-14.3 13.9 3.4 19.7L100 137l-17.6 9.3 3.4-19.7-14.3-13.9 19.7-2.7z" fill="#ffbd62"/></svg>`;

/* ------------------------------------------------------------------ events */

function icon(n) {
  const d = {
    replay: "M4 10a8 8 0 1 1 1 9 M4 4v6h6",
    play: "M7 4v16l13-8z",
    pause: "M8 4v16 M16 4v16",
    undo: "M4 9h9a7 7 0 0 1 0 14 M9 4 4 9l5 5",
    reset: "M4 10a8 8 0 1 1 1 9 M4 4v6h6",
  }[n];
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
}

function onClick(e) {
  const b = e.target.closest("[data-lp]");
  if (!b || b.disabled) return;
  const a = b.dataset.lp;
  const v = S.view;
  switch (a) {
    case "exit":
      return closePlayer();
    case "speak": {
      const sc = v?.scenes?.[v.i];
      const txt = sc ? `${sc.title}. ${sc.body || ""}` : root.querySelector(".lp-bubble")?.innerText || "";
      return env.read(txt);
    }
    case "next":
      if (v.i < v.scenes.length - 1) return showScene(v.i + 1);
      return v.onFinish();
    case "back":
      return showScene(v.i - 1);
    case "replay":
      return showScene(v.i);
    case "auto":
      return setAuto(!S.auto);
    case "learnNext":
      return nextStage();
    case "explain": {
      // nested explainer on top of the lesson
      const ex = explainerById(b.dataset.id, lang());
      if (ex) return pushExplainer(ex);
      return;
    }
    case "undo":
      return tryUndo();
    case "resetTask":
      return showTask();
    case "skipTask":
      return skipTask();
    case "tryNext":
      return nextStage();
    case "clearBoard":
      S.board?.set(Array(S.board.rods).fill(0));
      return setTotal("0");
    case "hint":
      return showHint();
    case "peek":
      if (S.check) S.check.cur.hinted = true;
      else S.q.revealed = true;
      root.querySelector(".lp-stage")?.classList.remove("covered");
      b.remove();
      return;
    case "qnext":
      return nextQuestion();
    case "skipQ":
      S.q.asked++;
      S.q.state = "show";
      return nextQuestion();
    case "showSolution":
      return showSolution();
    case "again":
      S.q = { pool: [], used: new Set(), asked: 0, streak: 0, right: S.q?.right || 0, wrong: S.q?.wrong || 0, log: [] };
      S.stage = S.plan.findIndex((x) => x.type === "practice");
      return enterStage();
    case "choice":
      return scriptChoice(b);
    case "scriptNext":
      return scriptNext();
    case "scriptBack":
      S.sx = Math.max(0, S.sx - 1);
      S.cur = S.scriptDef.steps[S.sx].from || S.scriptDef.steps[S.sx].show || S.cur;
      return drawScriptStep();
    case "scriptReset": {
      S.board.set(S.script.start);
      setTotal(S.board.valueOf(S.script.start));
      const fb = root.querySelector("#lp-fb");
      fb.className = "lp-feedback";
      fb.textContent = "";
      if (S.script.st.hintMove) S.board.hintMove(S.script.start, S.script.st.target);
      return;
    }
    case "scriptShow": {
      const st = S.script.st;
      const to = st.target || st.to;
      S.board.set(to);
      setTotal(S.board.valueOf(to));
      return scriptSuccess(to);
    }
    case "checkNext":
      S.check.index++;
      return stageCheck();
    case "checkAgain":
      return env.onCheckAgain?.(S.check);
    case "gonext":
      return env.onNext?.(S.lesson);
  }
}

function onSubmit(e) {
  e.preventDefault();
  if (e.target.id === "lp-form") {
    const v = new FormData(e.target).get("a");
    if (S.check) submitCheck(v);
    else checkAnswer(v);
  }
}

function onKey(e) {
  if (!root) return;
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    if (S.stack.length) return popExplainer();
    return closePlayer();
  }
  if (e.target.closest("input,select,textarea")) return;
  const v = S.view;
  const st = S.plan[S.stage];
  if (v && (st.type === "watch" || st.type === "learn" || st.type === "solve" || S.view?.tag === "solution")) {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
      if (e.target.closest("button") && e.key !== "ArrowRight") return;
      e.preventDefault();
      if (v.i < v.scenes.length - 1) showScene(v.i + 1);
      else if (e.key === "ArrowRight") return;
      else v.onFinish();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      showScene(v.i - 1);
    }
  }
}

function tryUndo() {
  const T = S.try;
  if (!T || T.done) return;
  T.undo.pop();
  const prev = T.undo.pop();
  if (prev) T.undo.push(prev);
  const task = T.p.tasks[T.k];
  S.board.set(prev || task.from);
  setTotal(S.board.valueOf(prev || task.from));
  const fb = root.querySelector("#lp-fb");
  fb.className = "lp-feedback";
  fb.textContent = "";
  root.querySelector(".bo")?.replaceWith(htmlNode(avatar("think")));
  if (!T.undo.length) root.querySelector("#lp-undo").disabled = true;
  T.wrong = 0;
  S.board.hintMove(prev || task.from, task.to);
}

function skipTask() {
  const T = S.try;
  const task = T.p.tasks[T.k];
  S.board.set(task.to);
  setTotal(task.after.value);
  T.done = true;
  taskDone(false);
}

function showHint() {
  const q = S.q;
  if (q.state !== "ask") return;
  q.hinted = true;
  const fb = root.querySelector("#lp-fb");
  const idea = env.ideaOf(S.lesson.parts?.[0] || S.lesson);
  fb.className = "lp-feedback hint";
  fb.innerHTML = `<b>${esc(t("hint"))}</b> ${esc(idea)}`;
}

/* nested explainer (little friend, big friend...) */
function pushExplainer(ex) {
  S.stack.push({ stage: S.stage, scene: S.scene, plan: S.plan, view: S.view, explainer: S.explainer, try: S.try, q: S.q });
  clearTimers();
  S.plan = [{ type: "learn", part: 0, standalone: true, nested: true }];
  S.stage = 0;
  S.explainer = ex;
  S.lesson = S.lesson;
  S.scene = 0;
  enterStage();
}
function popExplainer() {
  const prev = S.stack.pop();
  Object.assign(S, { stage: prev.stage, scene: prev.scene, plan: prev.plan, explainer: prev.explainer, try: prev.try, q: prev.q });
  enterStage(true);
}
