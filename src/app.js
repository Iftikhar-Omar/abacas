import { applyPrefs, readPrefs, sanitizePrefs, st, writePrefs } from './studio.js';
import { extraConcepts, languages, skillName, stepText, tr } from './i18n.js';
import { allLessons, concept, freshProgress, lessonFor, lessons, normalLessons, recordAttempt, units } from './curriculum.js';
import { config } from './config.js';
import { answerEquals, evaluate, normalize, parse, solve } from './engine.js';
import { Playback, makeChallenge, presets, suggestNext, validateConfig } from './gym.js';
import { journeyCopy } from './journey-i18n.js';
import { captureFocus, captureFormDrafts, focusWorkspace, restoreFocus, restoreFormDrafts } from './ui.js';
import { createAssessment, handCompatible, scoreAssessment, unitReadiness } from './assessment.js';
import { BeadModel } from './model.js';
import { closePlayer, configurePlayer, openExplainer, openLesson as playLesson, playerOpen } from './player.js';
import { explainerById, explainerIds } from './explainers.js';
import { Soroban, layoutFor } from './soroban.js';
import { P } from './player-i18n.js';
import { actionSteps, freshQuestions, misconception } from './practice.js';

var prefs = readPrefs();
applyPrefs(prefs);
var $ = (s) => document.querySelector(s);
var $$ = (s) => [...document.querySelectorAll(s)];
var esc = (s) => String(s ?? "").replace(
  /[&<>"']/g,
  (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]
);
var lang = "en";
try {
  lang = localStorage.getItem("academy-language") || "en";
} catch {
}
if (!languages.some((l) => l[0] === lang)) lang = "en";
var state = {
  view: "learn",
  progress: freshProgress(),
  user: null,
  revision: 0,
  cloud: !!config.apiBase,
  solver: solve("82-56"),
  solverIndex: 0,
  lesson: null,
  phase: "watch",
  lessonIndex: 0,
  lessonTrace: null,
  returnStack: [],
  modelMode: "abacus",
  locked: true,
  explore: null,
  expanded: false,
  answerIndex: 0,
  feedback: null,
  hinted: false,
  answerStart: 0,
  gymConfig: { ...presets.gentle },
  gym: null,
  sync: "",
  savePending: false
};
Object.assign(state, {
  journey: prefs.journey,
  watchPart: 0,
  track: "abacus",
  focus: false,
  modelFocus: false,
  solverDraft: "82-56",
  solverError: "",
  practice: null,
  practiceCursor: 0,
  mentalStage: "see",
  mentalRevealed: false,
  lessonQuestions: [],
  checkpointFeedback: null,
  firstError: null,
  assessment: null
});
var model = null;
var heroModel = null;
var supportModel = null;
var toastTimer = null;
var clock = null;
var autoTimer = null;
var autoPlaying = false;
var dialogDemo = null;
var dialogFocus = null;
var S = (k) => st(k, lang);
var playback = new Playback();
var T = (k) => tr(k === "estimates" ? "roots" : k, lang);
var L = (l) => l.title[lang] || `${skillName(l.skill, lang)} \xB7 ${l.order + 1}`;
var C = (skill) => extraConcepts[lang]?.[skill] || extraConcepts[lang]?.[skill === "root-estimate" ? "roots" : skill] || concept(skill, lang);
var lessonIdea = (lesson) => {
  const part = lesson.parts && state.phase === "watch" && state.lesson?.id === lesson.id ? lesson.parts[state.watchPart] || lesson : lesson;
  return part.idea?.[lang] || C(part.skill);
};
var words = {
  normal: ["Starter path", "\u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u09AA\u09A5"],
  mastery: ["Full course", "\u09A6\u0995\u09CD\u09B7\u09A4\u09BE\u09B0 \u09AA\u09A5"],
  normalNote: [
    "15 short lessons. From your first bead to mental maths.",
    "\u09AA\u09C1\u0981\u09A4\u09BF \u0997\u09CB\u09A8\u09BE \u09A5\u09C7\u0995\u09C7 \u09AE\u09A8\u09C7 \u09AE\u09A8\u09C7 \u0985\u0999\u09CD\u0995\u2014\u09E7\u09EB\u099F\u09BF \u09A7\u09BE\u09AA\u09C7\u0964"
  ],
  masteryNote: [
    "All 78 lessons, with deeper practice in every skill.",
    "\u09B8\u09AC \u09ED\u09EE\u099F\u09BF \u09AA\u09BE\u09A0, \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AC\u09BF\u09B7\u09AF\u09BC \u0986\u09B0\u0993 \u09AD\u09BE\u09B2\u09CB\u09AD\u09BE\u09AC\u09C7 \u099A\u09B0\u09CD\u099A\u09BE \u0995\u09B0\u09A4\u09C7\u0964"
  ],
  calculation: ["Calculation", "\u0985\u0999\u09CD\u0995"],
  part: ["Part", "\u0985\u0982\u09B6"],
  enlarge: ["Enlarge model", "\u09AC\u09CB\u09B0\u09CD\u09A1 \u09AC\u09A1\u09BC \u0995\u09B0\u09BF"],
  retryQuestion: ["Back to my question", "\u0986\u09AE\u09BE\u09B0 \u0985\u0999\u09CD\u0995\u09C7 \u09AB\u09BF\u09B0\u09BF"],
  boardShows: ["Your board shows", "\u09A4\u09CB\u09AE\u09BE\u09B0 \u09AC\u09CB\u09B0\u09CD\u09A1\u09C7 \u0986\u099B\u09C7"],
  entered: ["You entered", "\u09A4\u09C1\u09AE\u09BF \u09B2\u09BF\u0996\u09C7\u099B"],
  moveHelp: [
    "Tap a bead to move it towards or away from the middle bar.",
    "\u09AA\u09C1\u0981\u09A4\u09BF\u09A4\u09C7 \u099A\u09BE\u09AA \u09A6\u09BF\u09B2\u09C7 \u09AE\u09BE\u099D\u09C7\u09B0 \u09A6\u09BE\u0997\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u0986\u09B8\u09AC\u09C7 \u09AC\u09BE \u09B8\u09B0\u09C7 \u09AF\u09BE\u09AC\u09C7\u0964"
  ],
  oneMove: ["One move at a time.", "\u098F\u0995\u09AC\u09BE\u09B0\u09C7 \u098F\u0995\u099F\u09BE \u09A7\u09BE\u09AA\u0964"],
  menu: ["Menu", "\u09AE\u09C7\u09A8\u09C1"],
  lessonPlan: ["Lesson plan", "\u09AA\u09BE\u09A0\u09C7\u09B0 \u09A7\u09BE\u09AA"],
  ideas: ["ideas", "\u09AC\u09BF\u09B7\u09AF\u09BC"],
  idea: ["Idea", "\u09AC\u09BF\u09B7\u09AF\u09BC"],
  move: ["Move", "\u09A7\u09BE\u09AA"],
  nextMove: ["Next move", "\u09AA\u09B0\u09C7\u09B0 \u09A7\u09BE\u09AA"],
  nextIdea: ["Next idea", "\u09AA\u09B0\u09C7\u09B0 \u09AC\u09BF\u09B7\u09AF\u09BC"],
  tryIt: ["Try it together", "\u098F\u0995\u09B8\u0999\u09CD\u0997\u09C7 \u0995\u09B0\u09BF"],
  replayAll: ["Replay calculation", "\u0986\u09AC\u09BE\u09B0 \u09A6\u09C7\u0996\u09BF"],
  result: ["Board value", "\u09AC\u09CB\u09B0\u09CD\u09A1\u09C7 \u0986\u099B\u09C7"],
  explore: ["Try the beads", "\u09AA\u09C1\u0981\u09A4\u09BF \u09A8\u09BE\u09A1\u09BC\u09BE\u0987"],
  restore: ["Back to the step", "\u09A7\u09BE\u09AA\u09C7 \u09AB\u09BF\u09B0\u09BF"],
  learning: ["Learning journey", "\u09B6\u09C7\u0996\u09BE\u09B0 \u09AA\u09A5"],
  sources: ["Choose a practice track", "\u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u099A\u09B0\u09CD\u099A\u09BE \u0995\u09B0\u09AC\u09C7?"],
  nextLesson: ["Next lesson", "\u09AA\u09B0\u09C7\u09B0 \u09AA\u09BE\u09A0"],
  pathDone: ["You finished the Normal path!", "\u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u09AA\u09A5\u09C7\u09B0 \u09B8\u09AC \u09AA\u09BE\u09A0 \u09B6\u09C7\u09B7!"],
  goMastery: ["Explore the Mastery path", "\u09A6\u0995\u09CD\u09B7\u09A4\u09BE\u09B0 \u09AA\u09A5\u09C7 \u09AF\u09BE\u0987"],
  reviewPath: ["Review this path", "\u098F\u0987 \u09AA\u09BE\u09A0\u0997\u09C1\u09B2\u09CB \u0986\u09AC\u09BE\u09B0 \u09A6\u09C7\u0996\u09BF"],
  chooseIdea: [
    "Choose an idea to watch again.",
    "\u09AF\u09C7 \u09AC\u09BF\u09B7\u09AF\u09BC\u099F\u09BE \u0986\u09AC\u09BE\u09B0 \u09A6\u09C7\u0996\u09A4\u09C7 \u099A\u09BE\u0993, \u09AC\u09C7\u099B\u09C7 \u09A8\u09BE\u0993\u0964"
  ]
};
var W = (k) => journeyCopy[lang]?.[k] || words[k]?.[lang === "bn" ? 1 : 0] || S(k);
function setJourney(journey) {
  closePlayer(true);
  if (!["normal", "mastery"].includes(journey)) return;
  stopAuto();
  closeDialog();
  cancelGym();
  prefs.journey = state.journey = journey;
  writePrefs(prefs);
  state.track = "abacus";
  state.lesson = null;
  state.view = "learn";
  state.focus = state.modelFocus = false;
  render();
  focusWorkspace();
  window.scrollTo(0, 0);
}
function watchIdea(index) {
  const l = state.lesson;
  if (!l?.parts || !l.parts[index]) return;
  stopAuto();
  closeDialog();
  state.watchPart = index;
  state.modelFocus = state.focus = false;
  state.phase = "watch";
  state.lessonTrace = solve(l.parts[index].example);
  state.lessonIndex = 0;
  state.modelMode = l.parts[index].id === "hands" ? "hands" : "abacus";
  state.locked = true;
  state.explore = null;
  state.expanded = false;
  render();
  focusWorkspace();
}
function workspaceHeading() {
  const l = state.view === "learn" ? state.lesson : null;
  return `<div class="workspace-context">${btn(`\u2630 <span>${W("menu")}</span>`, "workspaceMenu", "workspace-menu", `aria-label="${W("menu")}"`)}<div class="workspace-title"><h1>${l ? esc(L(l)) : T(state.view)}</h1><small>${l ? `${W(l.journey || "mastery")} \xB7 ${l.order + 1} / ${l.journey ? normalLessons.length : lessons.length}` : W("oneMove")}</small></div>${l ? btn(icon("list"), "lessonPlan", "icon-button", `aria-label="${W("lessonPlan")}" title="${W("lessonPlan")}"`) : ""}</div>`;
}
function phaseHeader() {
  if (state.view !== "learn" || !state.lesson) return "";
  return `<div class="workspace-phases" aria-label="${W("lessonPlan")}">${["watch", "together", "alone"].map((p, i) => `<span class="${state.phase === p ? "current" : ""}" aria-current="${state.phase === p ? "step" : "false"}"><b>${i + 1}</b>${T(p)}</span>`).join("")}</div>`;
}
function showWorkspaceMenu() {
  dialog(
    W("menu"),
    `<div class="workspace-menu-grid">${["learn", "solver", "gym", "progress", "account"].map((k) => btn(`${icon(k)} ${T(k)}`, "nav", "secondary", `data-view="${k}"`)).join("")}${btn(S("settings"), "settings", "secondary")}${btn(S("guide"), "guide", "secondary")}</div>${languageSelect()}`
  );
}
function showLessonPlan() {
  const l = state.lesson;
  if (!l) return;
  dialog(
    L(l),
    `<p>${W("chooseIdea")}</p><div class="lesson-plan-list">${(l.parts || [l]).map((p, i) => btn(`${i + 1}. ${esc(L(p))} <span dir="ltr">${esc(p.example)}</span>`, "watchIdea", "secondary", `data-index="${i}"`)).join("")}</div><p>${S("guideTip")}</p>`,
    btn(T("allLessons"), "allLessons", "secondary")
  );
}
var icon = (name) => {
  const paths = {
    learn: "M4 5h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-2H4z M20 5h-4a3 3 0 0 0-3 3v13a4 4 0 0 1 4-2h3z",
    solver: "M7 3h10v18H7z M10 7h4 M10 11h1 M14 11h1 M10 15h1 M14 15h1",
    gym: "M13 2 4 14h7l-1 8 10-13h-7z",
    progress: "M5 20V11 M12 20V4 M19 20V8",
    account: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2",
    sound: "M4 9h4l5-4v14l-5-4H4z M17 8q6 4 0 8",
    expand: "M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5",
    close: "m6 6 12 12 M18 6 6 18",
    more: "M5 12h.01 M12 12h.01 M19 12h.01",
    plus: "M12 5v14 M5 12h14",
    minus: "M5 12h14",
    replay: "M4 10a8 8 0 1 1 1 9 M4 4v6h6",
    undo: "M4 9h9a7 7 0 0 1 0 14 M9 4 4 9l5 5",
    reset: "M12 3v3 M12 18v3 M3 12h3 M18 12h3 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
    list: "M4 6h.01 M8 6h12 M4 12h.01 M8 12h12 M4 18h.01 M8 18h12",
    unlock: "M8 10V7a5 5 0 0 1 9-3 M5 10h14v11H5z M12 14v3",
    lock: "M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5z M12 14v3",
    check: "m5 12 4 4L19 6",
    star: "m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ? `<path d="${paths[name]}"/>` : '<circle cx="12" cy="12" r="8"/><path d="M12 11v6M12 7h.01"/>'}</svg>`;
};
function btn(label, action, cls = "", extra = "") {
  return `<button class="button ${cls}" data-action="${action}" ${extra.includes("type=") ? "" : 'type="button"'} ${extra}>${label}</button>`;
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2600);
}
function cancelGym(reason = false) {
  supportModel?.dispose();
  supportModel = null;
  playback.cancel();
  clearInterval(clock);
  if (state.gym?.status === "playing" || state.gym?.status === "answer") {
    state.gym.status = "cancelled";
    if (reason) toast(T("cancelled"));
  }
}
function nav(view) {
  closePlayer(true);
  if (view === "gym" && state.view === "gym") return;
  const previousView = state.view;
  state.lessonReview = null;
  closeDialog();
  stopAuto();
  state.focus = false;
  state.modelFocus = false;
  if (state.view === "gym" && view !== "gym") cancelGym();
  state.view = view;
  if (view !== "assessment") state.assessment = null;
  if (previousView === "assessment" && view !== "assessment") {
    clearInterval(clock);
    clock = null;
  }
  state.feedback = null;
  state.expanded = false;
  render();
  focusWorkspace();
  window.scrollTo(0, 0);
}
function shell() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  const path = eligibleLessons();
  const learned = path.filter(
    (l) => ["learned", "retained"].includes(progressStatus(l))
  ).length;
  $("#app").innerHTML = `<a href="#main" class="skip-link">${S("skipToContent")}</a><aside class="sidebar"><a href="#learn" class="brand" aria-label="Abacus Academy"><span class="brand-mark"><i></i><i></i><i></i></span><span>abacus<span class="brand-sub">ACADEMY</span></span></a><nav aria-label="${T("pathway")}">${["learn", "solver", "gym", "progress", "account"].map((k) => `<button data-action="nav" data-view="${k}" aria-label="${T(k)}" title="${T(k)}" class="nav-item ${state.view === k ? "selected" : ""}" aria-current="${state.view === k ? "page" : "false"}">${icon(k)}<span>${S("nav" + k)}</span></button>`).join("")}</nav><div class="sidebar-bottom"><div class="mini-progress"><span>${T("learned")}</span><b>${learned} / ${path.length}</b><progress value="${learned}" max="${path.length}"></progress></div><small>Abacus Academy \xB7 v5.0</small></div></aside><div class="main-shell"><header class="topbar"><h2 class="top-title">${T(state.view)}</h2><div class="top-actions"><span class="session-badge">${state.user ? esc(state.user.username) : T("guest")}</span><label class="language"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg><select id="language" aria-label="${S("chooseLanguage")}">${languages.map(([code, name]) => `<option value="${code}" ${code === lang ? "selected" : ""}>${name}</option>`).join("")}</select></label>${btn(icon("info"), "guide", "icon-button", `aria-label="${S("guide")}" title="${S("guide")}"`)}${btn(icon("gear"), "settings", "icon-button", `aria-label="${S("settings")}" title="${S("settings")}"`)}</div></header><main id="main" tabindex="-1"></main></div>`;
}
function render() {
  const active = captureFocus(), previousKey = $("#main")?.dataset.renderKey, key = `${state.view}-${state.lesson?.id}-${state.phase}-${state.answerIndex}-${state.practiceCursor}-${state.mentalStage}-${state.assessment?.id}-${state.assessment?.index}-${state.watchPart}-${state.view === "solver" ? state.solver.source : ""}`;
  const drafts = previousKey === key ? captureFormDrafts($("#main")) : [];
  heroModel?.dispose();
  heroModel = null;
  supportModel?.dispose();
  supportModel = null;
  applyPrefs(prefs);
  shell();
  document.body.classList.toggle("focus-view", state.focus || state.modelFocus);
  document.body.classList.toggle("model-focus", state.modelFocus);
  document.body.classList.toggle(
    "active-workspace",
    state.view === "assessment" || state.view === "gym" || state.view === "solver" || state.view === "learn" && !!state.lesson
  );
  document.body.classList.toggle("gym-workspace", state.view === "gym");
  document.body.classList.toggle(
    "learning-workspace",
    state.view === "learn" && !!state.lesson
  );
  if (state.view === "learn") state.lesson ? renderLesson() : renderLearn();
  if (state.view === "solver") renderSolver();
  if (state.view === "gym") renderGym();
  if (state.view === "progress") renderProgress();
  if (state.view === "account") renderAccount();
  if (state.view === "assessment") renderAssessment();
  if (model && !document.contains(model.el)) {
    model.dispose();
    model = null;
  }
  $("#main").dataset.renderKey = key;
  restoreFormDrafts(drafts);
  if (previousKey === key) restoreFocus(active);
}
function progressStatus(l) {
  return state.progress.lessons[l.id]?.status || "new";
}
function showUnitCheck(unit) {
  state.assessmentUnit = unit;
  const supportsHands = lessons.some(
    (l) => l.unit === unit && handCompatible(l.example)
  );
  const source = state.track === "mental" ? "mental" : state.track === "fingers" && supportsHands ? "hands" : "abacus";
  dialog(
    T("assessment"),
    `<h3>${esc(lang === "bn" ? units[unit][1] : units[unit][0])}</h3><p>${S("checkNote")}</p><form id="assessment-options"><label>${T("mode")}<select name="source">${[
      "abacus",
      "hands",
      "mental"
    ].filter((s) => s !== "hands" || supportsHands).map(
      (s) => `<option value="${s}" ${s === source ? "selected" : ""}>${s === "mental" ? S("mentalTrack") : T(s === "hands" ? "hands" : "abacus")}</option>`
    ).join(
      ""
    )}</select></label><label class="toggle-label"><input type="checkbox" name="timed">${S("timedCheck")}</label></form>`,
    btn(T("start"), "startAssessment", "primary")
  );
}
function beginAssessment() {
  const form = $("#assessment-options"), fd = new FormData(form);
  const a = createAssessment(
    state.assessmentUnit,
    String(fd.get("source")),
    Date.now(),
    fd.get("timed") === "on"
  );
  closeDialog();
  stopAuto();
  cancelGym();
  state.lesson = null;
  state.assessment = a;
  state.view = "assessment";
  state.modelMode = a.source === "hands" ? "hands" : "abacus";
  state.focus = false;
  state.modelFocus = false;
  state.explore = null;
  render();
  $("#assessment-answer")?.focus({ preventScroll: true });
}
function renderAssessment() {
  clearInterval(clock);
  clock = null;
  const a = state.assessment;
  if (!a) {
    nav("learn");
    return;
  }
  if (a.index >= a.items.length) {
    const result = scoreAssessment(a.responses, a);
    $("#main").innerHTML = `<section class="completion">${workspaceHeading()}<span class="pill">${T("assessment")}</span><h2>${result.passed ? S("accuracyReady") : S("notYet")}</h2><div class="stats-grid"><div class="stat"><strong>${Math.round(result.accuracy * 100)}%</strong><span>${T("accuracy")}</span></div><div class="stat"><strong>${(result.ms / 1e3).toFixed(1)}s</strong><span>${T("time")}</span></div></div><p>${a.timed ? result.pace ? S("paceReady") : S("notYet") : S("checkNote")}</p><div class="row">${btn(S("checkAgain"), "unitCheck", "secondary", `data-unit="${a.unit}"`)}${btn(T("allLessons"), "nav", "primary", 'data-view="learn"')}</div></section>`;
    return;
  }
  const item = a.items[a.index];
  if (a.current !== a.index) {
    a.current = a.index;
    a.questionAt = Date.now();
    a.hinted = false;
    a.revealed = false;
    a.checked = false;
    state.explore = null;
    state.lessonTrace = solve(item.expression);
    state.lessonIndex = 0;
  }
  const hidden = a.source === "mental" && !a.revealed;
  state.locked = hidden;
  const snapshot = state.explore || { raw: "0", scale: 0, value: "0" };
  $("#main").innerHTML = `<div class="lesson-heading"><div>${btn(`\u2039 ${T("allLessons")}`, "nav", "back-link", 'data-view="learn"')}<h1>${T("assessment")} \xB7 ${a.unit + 1}</h1></div><span class="pill">${a.index + 1} / 10</span></div><div class="solver-workspace assessment-work ${hidden ? "assessment-mental" : ""}"><div class="model-column">${modelCard(snapshot)}</div><section class="step-panel assessment-task"><span class="pill">${a.timed ? S("timedCheck") : T("untimed")}</span><div class="recall-expression" dir="ltr">${esc(item.expression.replaceAll("*", "\xD7"))}</div><form id="assessment-form" class="answer-form"><label for="assessment-answer" class="sr-only">${T("answer")}</label><input id="assessment-answer" name="answer" autocomplete="off" inputmode="text" maxlength="80" placeholder="${T("answer")}" dir="ltr" ${a.checked ? "disabled" : ""}><button class="button primary" ${a.checked ? "disabled" : ""}>${T("check")}</button></form>${a.checked ? `<div class="feedback ${a.responses.at(-1).correct ? "success" : "try"}" role="status"><strong>${T(a.responses.at(-1).correct ? "correct" : "practicing")}</strong>${a.responses.at(-1).correct ? "" : `<span dir="ltr">${esc(item.expected)}</span>`}</div>${btn(a.index === 9 ? T("finish") : S("nextShort"), "nextAssessment", "primary")}` : hidden ? btn(S("revealModel"), "assessmentReveal", "text-button") : ""}<p class="fine">${a.hinted ? T("hint") : S("checkIndependent")}</p></section></div>`;
  attachModel(snapshot);
  model.setHidden(hidden);
  if (hidden) {
    $(".model-stage").inert = true;
    $(".model-stage").setAttribute("aria-hidden", "true");
    $("#total").textContent = "?";
    $(".model-stage").insertAdjacentHTML(
      "beforeend",
      `<div class="mental-cover">${icon("learn")}<span>${S("checkIndependent")}</span></div>`
    );
  }
  if (a.timed) {
    const elapsed = document.createElement("output");
    elapsed.id = "assessment-clock";
    elapsed.setAttribute("aria-label", T("time"));
    $(".lesson-heading").append(elapsed);
    const tick = () => {
      const ms = a.responses.reduce((n, r) => n + r.ms, 0) + (a.checked ? 0 : Date.now() - a.questionAt);
      elapsed.textContent = `${T("time")}: ${Math.floor(ms / 6e4)}:${String(Math.floor(ms / 1e3) % 60).padStart(2, "0")} / 10:00`;
    };
    tick();
    clock = setInterval(tick, 1e3);
  }
}
function checkAssessment(value) {
  const a = state.assessment;
  if (!a || a.checked || !String(value).trim()) return;
  const item = a.items[a.index], correct = answerEquals(value, item.expected), source = a.source === "mental" ? "mental" : state.modelMode;
  const response = {
    correct,
    hinted: a.hinted || source === "hands" && !handCompatible(item.expression),
    ms: Date.now() - a.questionAt,
    source
  };
  a.responses.push(response);
  a.checked = true;
  recordAttempt(state.progress, {
    ...response,
    mode: "assessment",
    expression: item.expression,
    answer: String(value),
    expected: item.expected,
    config: {
      unit: a.unit,
      source,
      assessmentId: a.id,
      itemIndex: a.index,
      timed: a.timed,
      assessmentLesson: item.lessonId
    }
  });
  saveProgress();
  render();
  $('[data-action="nextAssessment"]')?.focus({ preventScroll: true });
}
function nextAssessmentItem() {
  if (!state.assessment?.checked) return;
  state.assessment.index++;
  state.explore = null;
  render();
  $("#assessment-answer")?.focus({ preventScroll: true });
}
function eligibleLessons() {
  if (state.journey === "normal") return normalLessons;
  return lessons.filter(
    (l) => state.track === "abacus" ? true : state.track === "numbers" ? [
      "zero",
      "direct",
      "subtract",
      "place",
      "fractions",
      "decimal",
      "percent",
      "order",
      "equations",
      "powers",
      "roots",
      "strategies"
    ].includes(l.skill) : state.track === "mental" ? ["mental", "speed", "expert", "strategies"].includes(l.skill) : [
      "zero",
      "direct",
      "subtract",
      "place",
      "five-bead",
      "hands",
      "five",
      "ten",
      "borrow",
      "mental"
    ].includes(l.skill) && solve(l.example).steps.every(
      (v) => (() => {
        try {
          const q = evaluate(v.after.value);
          return q.d === 1n && q.n >= 0n && q.n <= 99n;
        } catch {
          return false;
        }
      })()
    )
  );
}
function renderLearn() {
  const list = eligibleLessons(), r = list.find((l) => state.progress.lessons[l.id]?.due < Date.now()) || list.find((l) => !["learned", "retained"].includes(progressStatus(l))) || list[0];
  const completed = list.filter(
    (l) => ["learned", "retained"].includes(progressStatus(l))
  ).length;
  $("#main").innerHTML = `<div class="page-heading"><div><p class="eyebrow">${S("studio")}</p><h1>${T("pathway")}</h1></div><span class="quiet-label">${completed} / ${list.length} ${T("learned")}</span></div><div class="journey-picker" aria-label="${W("learning")}">${["normal", "mastery"].map((j) => `<button data-action="journey" data-journey="${j}" aria-pressed="${state.journey === j}" class="${state.journey === j ? "selected" : ""}"><b>${W(j)}</b><span>${W(j + "Note")}</span></button>`).join("")}</div><details class="track-options" ${state.journey === "normal" ? "hidden" : ""}><summary>${W("sources")}</summary><div class="track-picker" aria-label="${S("tracks")}">${[
    ["numbers", "numberTrack", "01"],
    ["abacus", "abacusTrack", "02"],
    ["fingers", "fingerTrack", "03"],
    ["mental", "mentalTrack", "04"]
  ].map(
    ([k, t, n]) => `<button data-action="track" data-track="${k}" aria-pressed="${state.track === k}" class="${state.track === k ? "selected" : ""}"><small>${n}</small><span>${S(t)}</span></button>`
  ).join(
    ""
  )}</div></details><section class="discovery-card"><div class="discovery-copy"><span class="pill">${r === list[0] && !completed ? P("startHere", lang) : T(progressStatus(r))} \xB7 ${r.minutes} ${T("minutes")}</span><h2>${esc(L(r))}</h2><p>${esc(lessonIdea(r))}</p>${btn(`${T("start")} ${icon("learn")}`, "openLesson", "primary", `data-id="${r.id}"`)}</div><div class="discovery-model"><div class="model-caption"><span>${T(state.track === "fingers" ? "hands" : "abacus")}</span><b dir="ltr">${r.example}</b></div><div id="hero-model" class="model"></div><p>${S("guideTip")}</p></div></section><div class="ideas-shelf"><div class="path-heading"><h2>${P("helpfulIdeas", lang)}</h2><span>${P("helpfulIdeasNote", lang)}</span></div><div class="idea-row">${explainerIds.map((id) => { const e = explainerById(id, lang); return `<button class="idea-card" data-action="explainer" data-id="${id}"><span class="idea-art idea-${id}" aria-hidden="true">${ideaArt(id)}</span><b>${esc(e.title)}</b><small>${esc(e.blurb)}</small></button>`; }).join("")}</div></div><div class="path-heading"><h2>${T("allLessons")}</h2></div><div class="curriculum">${state.journey === "normal" ? `<div class="normal-lesson-list">${list.map((l, i) => `<button data-action="openLesson" data-id="${l.id}" class="normal-lesson ${l.id === r.id ? "recommended" : ""}"><span class="lesson-number">${["learned", "retained"].includes(progressStatus(l)) ? icon("check") : String(i + 1).padStart(2, "0")}</span><span><b>${esc(L(l))}</b><small>${l.parts.length} ${W("ideas")} \xB7 ${l.minutes} ${T("minutes")}</small></span><span class="lesson-status">${T(progressStatus(l))}</span></button>`).join("")}</div>` : units.map((u, i) => {
    const ll = list.filter((l) => l.unit === i);
    if (!ll.length) return "";
    const done = ll.filter(
      (l) => ["learned", "retained"].includes(progressStatus(l))
    ).length;
    const source = state.track === "mental" ? "mental" : state.track === "fingers" ? "hands" : "abacus", ready = unitReadiness(state.progress.attempts, i, source);
    return `<details class="unit" ${r.unit === i ? "open" : ""}><summary><span class="unit-number">${u[2]}</span><div><small>${T("learn")} ${i + 1}</small><h3>${lang === "en" ? u[0] : lang === "bn" ? u[1] : skillName(u[3], lang)}</h3></div><span class="unit-count">${done} / ${ll.length}</span><span class="chevron">\u2304</span></summary><div class="lesson-grid">${ll.map((l, j) => `<button class="lesson-tile ${l.id === r.id ? "recommended" : ""}" data-action="openLesson" data-id="${l.id}"><span class="lesson-symbol">${["learned", "retained"].includes(progressStatus(l)) ? icon("check") : String(j + 1).padStart(2, "0")}</span><span class="lesson-title">${esc(L(l))}</span><small>${l.minutes} ${T("minutes")} \xB7 ${T(progressStatus(l))}</small></button>`).join("")}</div><div class="unit-check-row">${btn(S("checkUnit"), "unitCheck", "secondary", `data-unit="${i}"`)}<span>${ready.retained ? T("retained") : ready.accuracyReady ? S("accuracyReady") : ""}</span></div></details>`;
  }).join("")}</div>`;
  const trace = solve(r.example), start = trace.steps.find((x) => x.kind === "operation")?.before || trace.steps.at(-1).after;
  const layout = layoutFor(trace.steps.flatMap((x) => [x.before, x.after]));
  const hero = new Soroban($("#hero-model"), { rods: layout.rods, scale: layout.scale, labels: true, t: (k) => P(k, lang) });
  if (!hero.set(start)) $("#hero-model").innerHTML = `<div class="hero-expr" dir="ltr">${esc(r.example.replaceAll("*", "\xD7").replaceAll("/", "\xF7"))}</div>`;
  heroModel = { dispose() {} };
}
function openLesson(id) {
  stopAuto();
  closeDialog();
  const l = allLessons.find((l2) => l2.id === id);
  if (!l) return;
  cancelGym();
  state.lessonReview = null;
  playLesson(l);
}
function returnSolver() {
  const saved = state.returnStack.pop();
  if (!saved) return;
  state.lessonReview = saved.lessonReview || null;
  state.solver = saved.trace;
  state.solverIndex = saved.index;
  state.modelMode = saved.mode;
  state.locked = true;
  state.explore = null;
  state.expanded = saved.expanded;
  state.view = "solver";
  render();
}
function traceView() {
  const trace = state.view === "solver" ? state.solver : state.lessonTrace, index = state.view === "solver" ? state.solverIndex : state.lessonIndex;
  return {
    trace,
    index,
    step: trace.steps[index],
    group: trace.groups[trace.steps[index].group]
  };
}
function modelCard(snapshot, step = null) {
  const canExplore = state.view === "solver" || state.view === "learn" && state.phase === "watch";
  const control = (name, action, label) => btn(
    icon(name),
    action,
    "icon-button",
    `aria-label="${label}" title="${label}"`
  );
  return `<section class="model-card canvas-card"><div id="bead-model" class="model"></div><div class="canvas-top">${workspaceHeading()}<div class="total"><small class="sr-only">${W("result")}</small><strong id="total" dir="ltr" aria-live="polite" aria-atomic="true">${esc(snapshot.value)}</strong></div><div class="model-tools">${canExplore ? `<button aria-label="${W(state.locked ? "explore" : "restore")}" title="${W(state.locked ? "explore" : "restore")}" id="lock" class="lock-button ${state.locked ? "" : "exploring"}" data-action="lock" aria-pressed="${!state.locked}">${icon(state.locked ? "lock" : "unlock")}<span class="sr-only">${W(state.locked ? "explore" : "restore")}</span></button>` : ""}${control(state.modelFocus ? "close" : "expand", "enlargeModel", state.modelFocus ? S("done") : W("enlarge"))}${control("more", "modelTools", S("modelControls"))}</div></div><div class="canvas-bottom"><div class="segmented"><button data-action="modelMode" data-mode="abacus" aria-pressed="${state.modelMode === "abacus"}" class="${state.modelMode === "abacus" ? "active" : ""}">${T("abacus")}</button><button data-action="modelMode" data-mode="hands" aria-pressed="${state.modelMode === "hands"}" class="${state.modelMode === "hands" ? "active" : ""}">${T("hands")}</button></div><div class="view-tools">${state.locked ? control("replay", "replay", S("replay")) : control("undo", "undo", S("undo"))}${control("minus", "zoomOut", S("zoomOut"))}${control("plus", "zoomIn", S("zoomIn"))}${control("reset", "resetView", S("resetView"))}</div></div><p id="model-note" class="model-note sr-only"></p></section>`;
}
function lockFeedback() {
  const b = $("#lock");
  if (!b) return;
  b.classList.remove("pulse");
  void b.offsetWidth;
  b.classList.add("pulse", "lock-attention");
  b.setAttribute("aria-label", T("lockHint"));
  toast(T("lockHint"));
  clearTimeout(b._attention);
  b._attention = setTimeout(() => b.classList.remove("lock-attention"), 2500);
}
function attachModel(snapshot, before = null, col = -1) {
  const placeholder = $("#bead-model");
  if (model) {
    placeholder.replaceWith(model.el);
  } else
    model = new BeadModel(placeholder, {
      prefs: () => prefs,
      lang: () => lang,
      onLocked: lockFeedback,
      onChange: (s, action) => {
        state.explore = s;
        $("#total").textContent = s.value;
        if (state.practice)
          state.practice.actions.push({
            ...action,
            value: s.value,
            at: performance.now()
          });
        const undo = $('[data-action="undo"]');
        if (undo) undo.disabled = !model.history.length;
      }
    });
  model.stage.querySelectorAll(".mental-cover").forEach((e) => e.remove());
  model.stage.inert = false;
  model.stage.removeAttribute("aria-hidden");
  model.setHidden(false);
  model.mode = state.modelMode;
  model.locked = state.locked;
  const trace = state.view === "solver" ? state.solver : state.view === "assessment" ? state.lessonTrace : state.phase === "alone" ? state.practice?.trace : state.lessonTrace;
  const numeric = trace?.steps.map((s) => model.normalize(s.after)).filter(Boolean).map((s) => ({
    ...s,
    raw: String(BigInt(s.raw) < 0n ? -BigInt(s.raw) : BigInt(s.raw))
  })).filter((s) => s.raw.length <= 18) || [];
  model.rangeScale = Math.max(0, ...numeric.map((s) => s.scale || 0));
  model.rangeRods = Math.max(
    3,
    ...numeric.map(
      (s) => String(s.raw).length + Math.max(0, model.rangeScale - (s.scale || 0))
    )
  );
  const key = `${state.view}-${state.lesson?.id || ""}-${state.phase}-${state.view === "solver" ? state.solverIndex : state.lessonIndex}-${state.practiceCursor}-${snapshot.value}-${state.modelMode}`;
  const animate = key !== model.lastKey && !state.explore;
  model.lastKey = key;
  if (animate && before?.raw !== null && before) {
    model.set(before);
    model.el.getBoundingClientRect();
  }
  model.set(snapshot, animate ? before : null, col);
  if (animate) model.scene?.focusColumn(col);
  $("#model-note").classList.toggle(
    "important-note",
    model.unsupported || model.sign < 0n || !!model.scale
  );
  $("#model-note").textContent = model.unsupported ? S(state.modelMode === "hands" ? "handsLimit" : "exactFraction") : state.modelMode === "hands" ? S(prefs.fingerPose === "extendedCounts" ? "raiseHelp" : "bendHelp") : model.sign < 0n ? S("signedMagnitude") : model.scale ? `${S("decimalAdded")}: ${model.scale}` : state.locked ? S("snapshot") : W("moveHelp");
  if (model.unsupported && state.modelMode === "hands")
    model.unavailable.insertAdjacentHTML(
      "beforeend",
      btn(S("switchAbacus"), "switchAbacus", "text-button")
    );
  const u = $('[data-action="undo"]');
  if (u) u.disabled = !model.history.length;
}
function contextHTML(group, step) {
  const trace = state.view === "solver" ? state.solver : state.lessonTrace;
  const count = step.total || group.count || 1;
  const sub = Math.min(count, step.sub || 1);
  const expression = trace.source.replaceAll("*", "\xD7").replaceAll("/", "\xF7");
  return `<div class="operation-strip ${group.tone}"><div class="operation-copy"><small dir="ltr" title="${esc(expression)}">${esc(expression)}</small><strong dir="ltr">${esc(group.label)}</strong></div><span class="substep-count">${S("substep")} <b>${sub} / ${count}</b></span><progress max="${count}" value="${sub}" aria-label="${S("substep")}"></progress></div>`;
}
function learningIdea(skill) {
  if (state.view === "learn" && state.lesson?.idea)
    return lessonIdea(state.lesson);
  if (state.modelMode !== "hands") return C(skill);
  const ideas = {
    five: lang === "bn" ? "\u09AC\u09C1\u09A1\u09BC\u09CB \u0986\u0999\u09C1\u09B2\u09C7\u09B0 \u09AE\u09BE\u09A8 \u09AA\u09BE\u0981\u099A\u0964 \u09AA\u09BE\u0981\u099A \u09AF\u09CB\u0997 \u0995\u09B0\u09C7 \u09AC\u09BE\u09A1\u09BC\u09A4\u09BF \u098F\u0995\u0995\u0997\u09C1\u09B2\u09CB \u09B8\u09B0\u09BE\u0987\u0964" : "The thumb is worth five. Add five, then remove the extra ones.",
    ten: lang === "bn" ? "\u09A1\u09BE\u09A8 \u09B9\u09BE\u09A4\u09C7 \u098F\u0995\u0995, \u09AC\u09BE\u0981 \u09B9\u09BE\u09A4\u09C7 \u09A6\u09B6\u0995\u0964 \u09A6\u09B6 \u09B9\u09B2\u09C7 \u09A1\u09BE\u09A8 \u09B9\u09BE\u09A4 \u0996\u09BE\u09B2\u09BF \u0995\u09B0\u09C7 \u09AC\u09BE\u0981 \u09B9\u09BE\u09A4\u09C7 \u098F\u0995\u099F\u09BE \u09A6\u09B6 \u09A8\u09BF\u0987\u0964" : "The right hand holds ones; the left holds tens. Exchange ten ones for one ten.",
    borrow: lang === "bn" ? "\u09AC\u09BE\u0981 \u09B9\u09BE\u09A4\u09C7\u09B0 \u098F\u0995\u099F\u09BE \u09A6\u09B6 \u09A8\u09BF\u0987\u0964 \u09A1\u09BE\u09A8 \u09B9\u09BE\u09A4\u09C7 \u09AC\u09BF\u09AF\u09BC\u09CB\u0997\u09C7\u09B0 \u09AA\u09B0 \u09AF\u09A4 \u09A5\u09BE\u0995\u09C7, \u09A4\u09A4 \u0986\u0999\u09C1\u09B2 \u09B0\u09BE\u0996\u09BF\u0964" : "Exchange one ten from the left hand, keeping the remaining ones on the right.",
    direct: lang === "bn" ? "\u098F\u0995\u099F\u09BE \u0986\u0999\u09C1\u09B2\u09C7\u09B0 \u09AE\u09BE\u09A8 \u098F\u0995\u0964 \u09A1\u09BE\u09A8 \u09B9\u09BE\u09A4\u09C7\u09B0 \u09AC\u09C1\u09A1\u09BC\u09CB \u0986\u0999\u09C1\u09B2\u09C7\u09B0 \u09AE\u09BE\u09A8 \u09AA\u09BE\u0981\u099A\u0964" : "Each right-hand finger is one; its thumb is five.",
    subtract: lang === "bn" ? "\u0997\u09CB\u09A8\u09BE \u0986\u0999\u09C1\u09B2 \u0986\u0997\u09C7\u09B0 \u09AD\u0999\u09CD\u0997\u09BF\u09A4\u09C7 \u09AB\u09C7\u09B0\u09BE\u09B2\u09C7 \u09A4\u09BE\u09B0 \u09AE\u09BE\u09A8 \u09AC\u09BE\u09A6 \u09AF\u09BE\u09AF\u09BC\u0964" : "Return a counted finger to its resting pose to subtract its value."
  };
  return ["en", "bn"].includes(lang) && ideas[skill] ? ideas[skill] : `${S("fingerTrack")} \xB7 ${S("handsLimit")} \xB7 ${C(skill)}`;
}
function stepDescription(step) {
  const info = stepText(step, lang);
  if (state.modelMode === "hands" && step.kind === "clear")
    info.text = lang === "bn" ? prefs.fingerPose === "extendedCounts" ? "\u09B8\u09AC \u0986\u0999\u09C1\u09B2 \u09AD\u09BE\u0981\u099C \u0995\u09B0\u09C7 \u09B6\u09C2\u09A8\u09CD\u09AF \u0995\u09B0\u09BF" : "\u09B8\u09AC \u0986\u0999\u09C1\u09B2 \u0996\u09C1\u09B2\u09C7 \u09B6\u09C2\u09A8\u09CD\u09AF \u0995\u09B0\u09BF" : lang === "en" ? "Rest all fingers at zero" : S("resting");
  if (state.modelMode === "hands" && ["upperOn", "upperOff", "lowerOn", "lowerOff"].includes(step.kind)) {
    info.text = lang === "bn" ? `${step.kind.endsWith("On") === (prefs.fingerPose === "extendedCounts") ? "\u0996\u09C1\u09B2\u09CB" : "\u09AD\u09BE\u0981\u099C \u0995\u09B0\u09CB"} \xB7 ${step.kind.startsWith("upper") ? "\u09AC\u09C1\u09A1\u09BC\u09CB \u0986\u0999\u09C1\u09B2" : "\u0986\u0999\u09C1\u09B2"} \xB7 ${step.params.place}` : lang === "en" ? `${step.kind.endsWith("On") === (prefs.fingerPose === "extendedCounts") ? "Extend" : "Fold"} ${step.kind.startsWith("upper") ? "the thumb" : "the fingers"} \xB7 ${step.params.place}` : `${S("fingerTrack")} \xB7 ${info.math}`;
  }
  return info;
}
function stepPanel(trace, index, step, group) {
  const info = stepDescription(step);
  return `<section class="step-panel teaching-panel">${state.view === "solver" ? solverForm() : phaseHeader()}${contextHTML(group, step)}<div class="step-body"><div class="step-kicker"><span>${W("move")} ${index + 1} / ${trace.steps.length}</span>${btn(icon("sound"), "readStep", "icon-button", `aria-label="${T("listen")}"`)}</div><h2 id="step-heading">${esc(info.text)}</h2><div class="step-math" dir="ltr">${esc(info.math)}</div>${state.view === "learn" ? `<div class="idea-inline"><span>${state.lesson.parts ? `${W("idea")} ${state.watchPart + 1} / ${state.lesson.parts.length}` : T("idea")}</span><p>${esc(lessonIdea(state.lesson))}</p></div>` : ""}<p class="skill-tag">${esc(skillName(step.lesson, lang))}</p><button data-action="explain" class="why-button" aria-expanded="${state.expanded}">${icon("info")} ${T("why")} <span>${state.expanded ? "\u2212" : "+"}</span></button>${state.expanded ? `<div class="explanation"><h3>${T("how")}</h3><p>${esc(info.text)} <b dir="ltr">${esc(info.math)}</b></p><h3>${T("idea")}</h3><p>${esc(learningIdea(step.lesson))}</p>${state.view === "solver" ? btn(T("lesson"), "relatedLesson", "text-button", `data-id="${lessonFor(step.lesson).id}"`) : ""}</div>` : ""}<div class="playback-tools">${state.lessonReview && state.view === "solver" ? btn(W("retryQuestion"), "retryQuestion", "text-button") : ""}${state.returnStack.length ? btn(T("backSolver"), "returnSolver", "text-button") : ""}${state.returnGym ? btn(T("gym"), "backGym", "text-button") : ""}${state.returnGym ? btn(S("firstMistake"), "markMistake", "text-button") : ""}${btn(S(autoPlaying ? "pause" : "autoPlay"), autoPlaying ? "pauseSteps" : "autoSteps", "text-button")}</div><div class="step-dots" aria-label="${T("step")}">${trace.groups.map((g) => `<button aria-label="${esc(g.label)}" title="${esc(g.label)}" data-action="jump" data-index="${g.start}" class="${g.id === group.id ? "active" : ""}"></button>`).join("")}</div></div><div class="step-nav">${btn(S("backShort"), "prev", "secondary", index === 0 && !(state.view === "learn" && state.lesson?.parts && state.watchPart) ? "disabled" : "")}${btn(index === trace.steps.length - 1 ? state.view === "learn" ? state.watchPart < (state.lesson.parts?.length || 1) - 1 ? W("nextIdea") : W("tryIt") : state.lessonReview ? W("retryQuestion") : W("replayAll") : W("nextMove"), index === trace.steps.length - 1 ? state.view === "learn" ? state.watchPart < (state.lesson.parts?.length || 1) - 1 ? "nextIdea" : "phaseTogether" : state.lessonReview ? "retryQuestion" : "resetSteps" : "next", "primary")}</div></section>`;
}
function solverForm() {
  return `<form id="solver-form" class="solver-form"><label for="expression" class="sr-only">${T("equation")}</label><div class="solver-input-row"><input id="expression" name="expression" value="${esc(state.solverDraft)}" aria-describedby="solver-error" aria-invalid="${!!state.solverError}" dir="ltr" autocomplete="off" spellcheck="false" maxlength="2000"><button class="button primary" type="submit">${T("solve")}</button></div><div id="solver-error" class="form-error" role="alert">${esc(state.solverError)}</div></form>`;
}
function renderSolver() {
  const { trace, index, step, group } = traceView();
  $("#main").innerHTML = `<div class="solver-workspace"><div class="model-column">${modelCard(state.explore || step.after, step)}</div>${stepPanel(trace, index, step, group)}</div>`;
  attachModel(state.explore || step.after, step.before, step.column);
}
function renderLesson() {
  const l = state.lesson;
  $("#main").innerHTML = `<div id="lesson-content"></div>`;
  if (state.phase === "watch") {
    const { trace, index, step, group } = traceView();
    $("#lesson-content").innerHTML = `<div class="solver-workspace"><div class="model-column">${modelCard(state.explore || step.after, step)}</div>${stepPanel(trace, index, step, group)}</div>`;
    attachModel(state.explore || step.after, step.before, step.column);
  } else if (state.phase === "together") {
    renderGuided(l);
  } else if (state.phase === "alone") {
    renderRecall(l);
  } else
    $("#lesson-content").innerHTML = `<section class="completion">${workspaceHeading()}<span class="completion-icon">${icon("check")}</span><p class="eyebrow">${T("finish")}</p><h2>${esc(L(l))}</h2><p>${T(progressStatus(l))}</p><p>${T("reviewDue")} \xB7 ${new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(new Date(state.progress.lessons[l.id]?.due || Date.now() + 864e5))}</p><div class="row">${btn(T("allLessons"), "allLessons", "secondary")}${btn(l.journey === "normal" && l.order === normalLessons.length - 1 ? W("goMastery") : W("nextLesson"), "nextLesson", "primary")}</div></section>`;
}
function answerForm() {
  return `<form id="answer-form" class="answer-form"><label for="answer" class="sr-only">${T("answer")}</label><input id="answer" name="answer" inputmode="${state.lesson && ["fractions", "negative", "divide", "equations"].includes(state.lesson.skill) ? "text" : "decimal"}" autocomplete="off" placeholder="${T("answer")}" maxlength="80" dir="ltr" ${state.feedback?.correct ? "disabled" : ""}><button class="button primary" ${state.feedback?.correct ? "disabled" : ""}>${T("check")}</button></form>`;
}
function feedbackHTML() {
  const f = state.feedback;
  if (!f) return "";
  return `<div class="feedback ${f.correct ? "success" : "try"}" role="status"><strong>${T(f.correct ? "correct" : "retry")}</strong>${f.expected ? `<span dir="ltr">${esc(f.expected)}</span>` : ""}${f.correct ? btn(T(state.phase === "together" ? "alone" : "continue"), "continueAnswer", "text-button") : btn(T("show"), "showLesson", "text-button")}</div>`;
}
function goStep(index) {
  model?.finish();
  const trace = state.view === "solver" ? state.solver : state.lessonTrace;
  index = Math.max(0, Math.min(trace.steps.length - 1, index));
  if (state.view === "solver") state.solverIndex = index;
  else state.lessonIndex = index;
  state.locked = true;
  state.explore = null;
  saveProgress();
  render();
}
function solveInput(expr) {
  stopAuto();
  state.feedback = null;
  try {
    const trace = solve(expr);
    state.solver = trace;
    state.solverDraft = trace.source;
    state.solverError = "";
    state.solverIndex = 0;
    state.explore = null;
    state.locked = true;
    state.view = "solver";
    state.expanded = false;
    render();
    return trace;
  } catch (e) {
    state.solverDraft = String(expr);
    state.solverError = `${T("error")} \xB7 ${S("examples")}: 82 \u2212 56`;
    const target = $("#solver-error");
    if (target) target.textContent = state.solverError;
    else toast(T("error"));
    const input = $("#expression");
    if (input) {
      input.setAttribute("aria-invalid", "true");
      input.value = state.solverDraft;
    }
    return null;
  }
}
function gymOptionsHTML() {
  const c = state.gymConfig, g = state.gym;
  return `<h2>${T("goal")}</h2><div class="preset-grid">${[
    ["gentle", "beginner"],
    ["building", "fundamentals"],
    ["challenge", "advanced"],
    ["expert", "competition"]
  ].map(
    ([p, label]) => btn(
      T(label),
      "preset",
      "preset",
      `aria-pressed="${Object.entries(presets[p]).every(([k, v]) => c[k] === v)}" data-preset="${p}" ${g && ["playing", "answer"].includes(g.status) ? "disabled" : ""}`
    )
  ).join(
    ""
  )}</div><form id="gym-settings"><label>${T("discipline")}<select name="type">${["sequence", "mixed", "multiply", "divide", "roots", "estimates", "squares", "percent", "calendar"].map((t) => `<option value="${t}" ${c.type === t ? "selected" : ""}>${T(t)}${t === "estimates" ? " \u2248 (3 d.p.)" : ""}</option>`).join("")}</select></label><div class="settings-pair"><label>${T("digits")}<input name="digits" type="number" min="1" max="${c.modelSource === "hands" ? 2 : 10}" value="${c.digits}"></label><label>${T("terms")}<input name="terms" type="number" min="2" max="100" value="${c.terms}"></label></div><label>${T("pace")} <output>${(c.pace / 1e3).toFixed(2)} s</output><input name="pace" type="range" min="100" max="10000" step="50" value="${c.pace}"></label><label>${T("duration")}<select name="duration">${[0, 60, 120, 180, 420, 600].map((n) => `<option value="${n}" ${c.duration === n ? "selected" : ""}>${n ? `${n / 60} ${T("minutes")}` : T("untimed")}</option>`).join("")}</select></label><label>${T("mode")}<select name="presentation"><option value="visual" ${c.presentation === "visual" ? "selected" : ""}>${T("visual")}</option><option value="audio" ${c.presentation === "audio" ? "selected" : ""}>${T("audio")}</option></select></label><label>${T("support")}<select name="support"><option value="visible" ${c.support === "visible" ? "selected" : ""}>${T("visible")}</option><option value="blur" ${c.support === "blur" ? "selected" : ""}>${S("blur")}</option><option value="hidden" ${c.support === "hidden" ? "selected" : ""}>${T("hidden")}</option></select></label><label>${S("mentalSource")}<select name="modelSource"><option value="abacus" ${c.modelSource !== "hands" ? "selected" : ""}>${T("abacus")}</option><option value="hands" ${c.modelSource === "hands" ? "selected" : ""}>${T("hands")} \xB7 0\u201399</option></select></label></form><p class="fine">${C("speed")}</p>`;
}
function showGymOptions() {
  if (["playing", "answer"].includes(state.gym?.status)) return;
  dialog(
    S("sessionOptions"),
    `<div class="gym-settings">${gymOptionsHTML()}</div>`,
    btn(T("begin"), "startGym", "primary")
  );
}
function syncGymOptions() {
  const form = $("#gym-settings");
  if (!form) return;
  for (const input of form.querySelectorAll("input,select")) {
    if (state.gymConfig[input.name] !== void 0)
      input.value = String(state.gymConfig[input.name]);
  }
  form.querySelector('[name="digits"]').max = state.gymConfig.modelSource === "hands" ? "2" : "10";
  form.querySelector("output").textContent = (state.gymConfig.pace / 1e3).toFixed(2) + " s";
}
function renderGym() {
  const c = state.gymConfig, active = ["playing", "answer"].includes(state.gym?.status);
  $("#main").innerHTML = `${workspaceHeading()}<div class="page-heading"><div><h1>${T("gym")}</h1><span class="quiet-label">${T(c.type)} \xB7 ${c.support === "blur" ? S("blur") : T(c.support === "visible" ? "visible" : "hidden")}</span></div>${btn(S("sessionOptions"), "gymOptions", "secondary", active ? "disabled" : "")}</div><div class="gym-layout"><section class="gym-stage" id="gym-stage" aria-label="${T("session")}"></section></div>`;
  renderGymStage();
}
function renderGymStage() {
  supportModel?.dispose();
  supportModel = null;
  const g = state.gym, c = state.gymConfig, el = $("#gym-stage");
  if (!el) return;
  if (!g || g.status === "cancelled") {
    el.innerHTML = `<div class="gym-orbit">${icon("gym")}</div><span class="eyebrow">${T("picture")}</span><h2>${T("ready")}</h2><p>${C("mental")}</p>${btn(T("begin"), "startGym", "primary large")}<div class="gym-spec"><span>${c.digits}<small>${T("digits")}</small></span><span>${c.terms}<small>${T("terms")}</small></span><span>${c.pace / 1e3}s<small>${T("pace")}</small></span></div>`;
    return;
  }
  if (g.status === "finished") {
    const a = g.results, correct = a.filter((x) => x.correct).length;
    el.innerHTML = `<span class="eyebrow">${T("report")}</span><h2>${a.length ? Math.round(correct / a.length * 100) : 0}%</h2><p>${T("accuracy")} \xB7 ${correct} / ${a.length}</p><p>${T("time")}: ${a.length ? (a.reduce((s, x) => s + x.ms, 0) / a.length / 1e3).toFixed(1) : "\u2014"}s</p>${btn(T("newSession"), "newGym", "primary")}${suggestNext(state.progress.attempts, c) ? btn(`${T("pace")}: ${(suggestNext(state.progress.attempts, c).pace / 1e3).toFixed(2)}s`, "applyPace", "secondary") : ""}<div class="session-log">${a.slice(-6).map(
      (x) => `<button data-action="reviewExpression" data-expression="${esc(x.expression)}">${x.correct ? "\u2713" : "\u25CB"} <span dir="ltr">${esc(x.expression)}</span></button>`
    ).join("")}</div>`;
    return;
  }
  const q = g.question;
  el.innerHTML = `<div class="gym-live-head"><span>${T(c.type)}</span><span id="gym-clock">${c.duration ? `${T("remaining")}: ${c.duration}s` : T("untimed")}</span></div><div class="flash-count" id="flash-count"></div><div class="flash-number" id="flash-number" dir="ltr">${g.status === "playing" ? T("ready") : g.status === "feedback" ? T(g.last.correct ? "correct" : "retry") : "?"}</div><div id="gym-support" class="gym-support"></div><div id="gym-answer-area">${g.status === "answer" ? gymAnswerForm(q) : g.status === "feedback" ? `<p dir="ltr" class="gym-result">${esc(q.expression)} = ${g.revealed ? esc(q.expected) : "?"}</p><p>${T("time")}: ${(g.last.ms / 1e3).toFixed(2)}s</p><div class="row">${btn(T("continue"), "nextGym", "primary")}${!g.last.correct ? btn(S("compare"), "gymReveal", "secondary") : ""}${btn(T("show"), "gymReview", "secondary")}</div>` : ""}</div><div class="gym-bottom">${btn(T("stop"), "finishGym", "text-button")}<span>${g.results.filter((a) => a.correct).length} / ${g.results.length} ${T("correct")}</span></div>`;
}
function gymAnswerForm(q) {
  return q.calendar ? `<form id="gym-answer-form" class="answer-form"><label class="sr-only" for="gym-answer">${T("answer")}</label><select id="gym-answer" name="answer">${Array.from({ length: 7 }, (_, i) => `<option value="${i}">${new Intl.DateTimeFormat(lang, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + i)))}</option>`).join("")}</select><button class="button primary">${T("check")}</button></form>` : `<form id="gym-answer-form" class="answer-form"><label class="sr-only" for="gym-answer">${T("answer")}</label><input id="gym-answer" name="answer" inputmode="${state.gymConfig.type === "mixed" ? "text" : "decimal"}" autocomplete="off" placeholder="${T("answer")}" maxlength="80" dir="ltr"><button class="button primary">${T("check")}</button></form>`;
}
function settingsFromForm() {
  const f = $("#gym-settings");
  if (f) {
    const fd = new FormData(f);
    if (fd.has("digits")) {
      const raw = Object.fromEntries(fd);
      if (raw.modelSource === "hands") {
        let adjusted = false;
        if (Number(raw.digits) > 2) {
          raw.digits = 2;
          adjusted = true;
        }
        if (!["mixed", "sequence"].includes(raw.type)) {
          raw.type = "mixed";
          adjusted = true;
        }
        if (raw.type === "sequence" && Number(raw.terms) > 40) {
          raw.terms = 40;
          adjusted = true;
        }
        if (adjusted) toast(`${S("handsLimit")} \xB7 ${T("mixed")}`);
      }
      state.gymConfig = validateConfig(raw);
    }
  }
}
function startGym() {
  try {
    settingsFromForm();
  } catch {
    toast(T("error"));
    return;
  }
  if (state.gymConfig.presentation === "audio") {
    const voices = globalThis.speechSynthesis?.getVoices() || [];
    if (!voices.some((v) => v.lang.toLowerCase().startsWith(lang))) {
      toast(S("voiceUnavailable"));
      return;
    }
  }
  closeDialog();
  cancelGym();
  state.gym = {
    status: "playing",
    results: [],
    started: performance.now(),
    question: null,
    deadline: state.gymConfig.duration ? performance.now() + state.gymConfig.duration * 1e3 : null
  };
  nextGym();
}
function nextGym() {
  const g = state.gym;
  if (!g) return;
  if (g.deadline && performance.now() >= g.deadline) {
    finishGym();
    return;
  }
  g.status = "playing";
  g.question = makeChallenge(state.gymConfig);
  g.running = "0";
  renderGym();
  const cfg = state.gymConfig;
  let support = null;
  if (cfg.support !== "hidden" && !g.question.calendar) {
    $("#gym-support").innerHTML = '<div class="model" id="support-model"></div>';
    supportModel = support = new BeadModel($("#support-model"), {
      onLocked: () => toast(S("stageHint")),
      prefs: () => ({ ...prefs, motion: false }),
      lang: () => lang
    });
    support.mode = cfg.modelSource || "abacus";
    if (cfg.support === "blur") $("#gym-support").classList.add("obscured");
  }
  const pace = cfg.pace;
  const tokens = g.question.tokens;
  const single = tokens.length === 1;
  playback.run(tokens, {
    pace: single ? Math.max(pace, 1200) : pace,
    voice: cfg.presentation === "audio",
    lang: languages.find((l) => l[0] === lang)[2],
    onToken: (token, i) => {
      if (state.view !== "gym" || g.status !== "playing") return;
      $("#flash-number").textContent = cfg.presentation === "audio" ? token ? "\u266A" : "" : token;
      $("#flash-count").textContent = `${i + 1} / ${tokens.length}`;
      if (token && support) {
        try {
          const expr = tokens.length > 1 ? tokens.slice(0, i + 1).join(" ") : g.question.expression;
          const trace = solve(expr);
          const s = tokens.length > 1 ? trace.steps.at(-1).after : trace.steps.find(
            (s2) => [
              "operation",
              "multiplyPlan",
              "dividePlan",
              "rootCheck",
              "power"
            ].includes(s2.kind)
          )?.before || trace.steps[0].after;
          support.set(s);
        } catch {
        }
      }
    },
    onDone: () => {
      if (state.view !== "gym" || g.status !== "playing") return;
      g.status = "answer";
      g.answerStart = performance.now();
      supportModel?.dispose();
      supportModel = null;
      renderGymStage();
      if (single && !g.question.calendar)
        $("#flash-number").textContent = g.question.tokens[0];
      if (g.question.calendar)
        $("#flash-number").textContent = g.question.expression;
      $("#gym-answer")?.focus();
    }
  });
  clearInterval(clock);
  clock = setInterval(() => {
    if (!state.gym || state.view !== "gym") return;
    if (g.deadline) {
      const left = Math.max(
        0,
        Math.ceil((g.deadline - performance.now()) / 1e3)
      );
      if ($("#gym-clock"))
        $("#gym-clock").textContent = `${T("remaining")}: ${left}s`;
      if (!left) finishGym();
    }
  }, 250);
}
function finishGym() {
  supportModel?.dispose();
  supportModel = null;
  playback.cancel();
  clearInterval(clock);
  if (state.gym) {
    state.gym.status = "finished";
    renderGym();
  }
}
function checkGym(value) {
  const g = state.gym;
  if (!g || g.status !== "answer" || !String(value).trim()) return;
  if (g.deadline && performance.now() > g.deadline) {
    finishGym();
    return;
  }
  const q = g.question, correct = q.calendar ? value === q.expected : answerEquals(value, q.expected);
  const event = recordAttempt(state.progress, {
    correct,
    ms: performance.now() - g.answerStart,
    mode: "gym",
    expression: q.expression,
    answer: value,
    expected: q.expected,
    config: { ...state.gymConfig }
  });
  g.last = event;
  g.results.push(event);
  g.status = "feedback";
  g.revealed = correct;
  saveProgress();
  renderGymStage();
}
function assessmentProgress() {
  const rows4 = units.flatMap(
    (unit, i) => ["abacus", "hands", "mental"].flatMap((source) => {
      const ready = unitReadiness(state.progress.attempts, i, source);
      if (!ready.latest) return [];
      return `<tr><td>${esc(lang === "bn" ? unit[1] : unit[0])}</td><td>${T(source)}</td><td>${Math.round(ready.latest.accuracy * 100)}%</td><td>${(ready.latest.ms / 1e3).toFixed(1)}s</td><td>${ready.retained ? T("retained") : ready.paceReady ? S("paceReady") : ready.accuracyReady ? S("accuracyReady") : S("notYet")}</td></tr>`;
    })
  );
  return rows4.length ? `<section class="panel"><h2>${T("assessment")}</h2><p class="fine">${S("checkNote")}</p><div class="table-scroll" tabindex="0" role="region" aria-label="${T("progress")}"><table><thead><tr><th>${T("learn")}</th><th>${T("mode")}</th><th>${T("accuracy")}</th><th>${T("time")}</th><th>${T("result")}</th></tr></thead><tbody>${rows4.join("")}</tbody></table></div></section>` : "";
}
function renderProgress() {
  const p = state.progress, a = p.attempts, scored = a.filter((x) => x.mode !== "checkpoint"), correct = scored.filter((x) => x.correct).length, done = Object.values(p.lessons).filter(
    (x) => x.status === "learned" || x.status === "retained"
  ).length, retained = Object.values(p.lessons).filter(
    (x) => x.status === "retained"
  ).length, due = allLessons.filter((l) => p.lessons[l.id]?.due < Date.now());
  $("#main").innerHTML = `<div class="page-heading"><div><p class="eyebrow">${T("progress")}</p><h1>${T("welcome")}</h1></div>${btn(T("export"), "export", "secondary")}</div><div class="stats-grid">${[
    [`${done}/${allLessons.length}`, T("learned")],
    [String(retained), T("retained")],
    [
      scored.length ? `${Math.round(correct / scored.length * 100)}%` : "\u2014",
      T("accuracy")
    ],
    [
      String(new Set(a.map((x) => new Date(x.at).toLocaleDateString())).size),
      T("days")
    ]
  ].map(
    ([n, t]) => `<div class="stat"><strong>${n}</strong><span>${t}</span></div>`
  ).join(
    ""
  )}</div>${assessmentProgress()}<section class="panel"><h2>${T("reviewDue")} <span class="count">${due.length}</span></h2>${due.length ? `<div class="review-grid">${due.map((l) => `<button data-action="openLesson" data-id="${l.id}" class="review-item"><span>${esc(L(l))}</span>${icon("learn")}</button>`).join("")}</div>` : `<p>${T(a.length ? "noRush" : "empty")}</p>`}</section><section class="panel"><h2>${T("attempts")}</h2>${a.length ? `<div class="table-scroll" tabindex="0" role="region" aria-label="${T("progress")}"><table><thead><tr><th>${T("equation")}</th><th>${T("answer")}</th><th>${T("result")}</th><th>${T("time")}</th></tr></thead><tbody>${a.slice(-20).reverse().map(
    (x) => `<tr><td dir="ltr"><button class="attempt-link" data-action="reviewAttempt" data-id="${esc(x.id)}">${esc(x.expression)}</button><small class="attempt-mode">${x.mode === "checkpoint" ? S("substep") : x.config?.source ? T(x.config.source === "hands" ? "hands" : x.config.source === "mental" ? "mental" : "abacus") : T("gym")}</small></td><td dir="ltr">${esc(x.answer)}</td><td><span class="status ${x.correct ? "good" : "warm"}">${T(x.correct ? "correct" : "practicing")}</span></td><td>${(x.ms / 1e3).toFixed(1)}s</td></tr>`
  ).join("")}</tbody></table></div>` : `<p>${T("empty")}</p>`}</section><p class="fine">${C("expert")}</p>`;
}
function renderAccount() {
  const enabled = state.cloud;
  const auth = state.user ? `<div class="stack">${btn(T("signOut"), "signOut", "secondary")}${btn(S("changePassword"), "changePassword", "secondary")}${btn(S("deleteAccount"), "deleteAccount", "text-button")}</div>` : enabled ? `<form id="auth-form"><label>${T("username")}<input name="username" autocomplete="username" minlength="3" maxlength="32" pattern="[A-Za-z0-9_]{3,32}" required></label><label>${T("password")}<input name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required></label><div class="row"><button class="button primary" name="action" value="login">${T("signIn")}</button>${state.registrationOpen ? `<button class="button secondary" name="action" value="register">${T("register")}</button>` : ""}</div></form>` : "";
  $("#main").innerHTML = `<div class="page-heading"><div><p class="eyebrow">${T("account")}</p><h1>${state.user ? esc(state.user.username) : T("guest")}</h1></div></div><div class="account-grid"><section class="panel"><div class="account-avatar">${icon("account")}</div><h2>${T(state.user ? "saved" : enabled ? "signIn" : "cloudOff")}</h2><p id="sync-status" role="status">${state.user ? esc(state.sync) : T("guestNote")}</p><div id="sync-actions">${syncActions()}</div>${auth}<p id="auth-error" class="form-error" role="alert"></p></section><section class="panel"><h2>${T("progress")}</h2><p>${T("guestNote")}</p><div class="stack">${btn(T("export"), "export", "secondary")}<label class="button secondary import-label">${T("import")}<input id="import-file" type="file" aria-label="${T("import")}" accept="application/json,.json"></label></div><p class="fine">${S("importHelp")}</p></section></div>`;
}
function syncActions() {
  return state.syncStatus === "conflict" ? btn(S("reloadSaved"), "reloadSaved", "secondary") : state.syncStatus === "error" ? btn(S("retrySave"), "retrySave", "secondary") : "";
}
function showAccountChange(deleting = false) {
  dialog(
    S(deleting ? "deleteAccount" : "changePassword"),
    `<p>${deleting ? S("deleteNote") : S("currentPassword")}</p><form id="account-change-form" data-deleting="${deleting}">${deleting ? `<label>${T("username")}<input name="confirm" autocomplete="username" required></label>` : ""}<label>${S("currentPassword")}<input name="currentPassword" type="password" autocomplete="current-password" minlength="12" maxlength="128" required></label>${deleting ? "" : `<label>${S("newPassword")}<input name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label>`}<p id="account-change-error" class="form-error" role="alert"></p><button class="button ${deleting ? "secondary" : "primary"}" type="submit">${S(deleting ? "deleteAccount" : "changePassword")}</button></form>`
  );
}
async function signOut() {
  await saveQueue;
  if (["error", "conflict"].includes(state.syncStatus) && (state.exportedAt || 0) < (state.progress.updatedAt || 0)) {
    nav("account");
    toast(state.syncStatus === "conflict" ? S("conflict") : T("saveError"));
    return;
  }
  try {
    await api("/auth/logout", { method: "POST", body: "{}" });
    state.user = null;
    state.progress = freshProgress();
    state.revision = 0;
    state.syncStatus = "guest";
    state.syncBlocked = false;
    render();
  } catch (e) {
    toast(e.message);
  }
}
async function reloadSaved() {
  if ((state.exportedAt || 0) < (state.progress.updatedAt || 0)) {
    toast(S("conflict"));
    return;
  }
  try {
    const d = await api("/progress");
    state.progress = d.progress;
    state.revision = d.revision;
    state.syncBlocked = false;
    state.syncStatus = "saved";
    state.sync = T("saved");
    restoreNavigation();
    render();
  } catch (e) {
    toast(e.message);
  }
}
async function api(path, options = {}) {
  if (!config.apiBase) throw Error(T("cloudOff"));
  const response = await fetch(config.apiBase + path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const d = await response.json();
  if (!response.ok) {
    const error2 = Error(d.error || T("saveError"));
    error2.status = response.status;
    throw error2;
  }
  return d;
}
var saveQueue = Promise.resolve();
function saveProgress() {
  state.progress.updatedAt = Date.now();
  state.progress.navigation = {
    expression: state.solver.source,
    index: state.solverIndex,
    lessonId: state.lesson?.id || null
  };
  if (!state.user) return;
  if (state.syncBlocked) return;
  state.sync = "";
  state.syncStatus = "saving";
  const userId = state.user.id;
  saveQueue = saveQueue.then(async () => {
    if (state.user?.id !== userId) return;
    if (state.syncBlocked) return;
    const body = JSON.stringify({
      progress: state.progress,
      revision: state.revision
    });
    try {
      const d = await api("/progress", { method: "PUT", body });
      if (state.user?.id === userId) {
        state.revision = d.revision;
        state.sync = T("saved");
        state.syncStatus = "saved";
      }
    } catch (e) {
      if (state.user?.id !== userId) return;
      state.syncBlocked = e.status === 409;
      state.syncStatus = e.status === 409 ? "conflict" : "error";
      state.sync = e.status === 409 ? S("conflict") : T("saveError");
      toast(state.sync);
    }
    const status = $("#sync-status");
    if (status) status.textContent = state.sync;
    const actions = $("#sync-actions");
    if (actions) actions.innerHTML = syncActions();
  });
}
function restoreNavigation() {
  const n = state.progress.navigation;
  if (n?.expression) {
    try {
      state.solver = solve(n.expression);
      state.solverDraft = state.solver.source;
      state.solverIndex = Math.max(
        0,
        Math.min(state.solver.steps.length - 1, n.index || 0)
      );
    } catch {
    }
  }
}
function exportProgress() {
  state.exportedAt = Date.now();
  const blob = new Blob(
    [
      JSON.stringify(
        { format: "abacus-academy-v2", progress: state.progress },
        null,
        2
      )
    ],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url;
  a.download = "abacus-academy-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function showImportPreview() {
  const p = state.pendingImport;
  if (!p) return;
  const needsBackup = state.progress.attempts.length > 0 && (state.exportedAt || 0) < state.progress.updatedAt;
  const el = dialog(
    T("import"),
    `<p>${S("importHelp")}</p><div class="stats-grid"><div class="stat"><strong>${p.attempts.length}</strong><span>${T("attempts")}</span></div><div class="stat"><strong>${Object.keys(p.lessons).length}</strong><span>${T("learn")}</span></div></div>${needsBackup ? `<p role="status">${S("backupFirst")}</p>` : ""}`,
    `${btn(T("export"), "export", "secondary")}${btn(S("close"), "closeDialog", "secondary")}${btn(S("restoreProgress"), "confirmImport", "primary", needsBackup ? "disabled" : "")}`
  );
  el.dataset.kind = "import";
}
function confirmImport() {
  if (!state.pendingImport || state.progress.attempts.length && (state.exportedAt || 0) < state.progress.updatedAt)
    return;
  state.progress = state.pendingImport;
  state.pendingImport = null;
  closeDialog();
  restoreNavigation();
  saveProgress();
  render();
  focusWorkspace();
  toast(S("imported"));
}
function read(text) {
  if (!globalThis.speechSynthesis) {
    toast(S("voiceUnavailable"));
    return;
  }
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
  if (!voice) {
    toast(S("voiceUnavailable"));
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languages.find((l) => l[0] === lang)[2];
  utterance.voice = voice;
  utterance.rate = 0.86;
  speechSynthesis.speak(utterance);
}
function checkLesson(value, isModel = false) {
  if (state.feedback?.correct) return;
  const l = state.lesson;
  const expr = state.phase === "together" ? l.example : state.lessonQuestions[state.answerIndex % state.lessonQuestions.length];
  const expected = solve(expr).result;
  const correct = answerEquals(value, expected);
  state.feedback = { correct, expected: null };
  if (state.phase === "alone")
    recordAttempt(state.progress, {
      lessonId: l.id,
      correct,
      ms: performance.now() - state.answerStart,
      hinted: state.hinted,
      expression: expr,
      answer: value,
      expected,
      mode: "recall",
      config: {
        source: state.modelMode,
        support: state.mentalRevealed ? "visible" : state.track === "mental" || l.skill === "mental" ? "hidden" : "visible",
        actions: state.practice?.actions.slice(-8) || []
      }
    });
  saveProgress();
  if ($("#feedback")) $("#feedback").innerHTML = feedbackHTML();
  if (correct)
    $$("#answer-form input,#answer-form button").forEach(
      (e) => e.disabled = true
    );
  if (correct)
    $('[data-action="continueAnswer"]')?.focus({ preventScroll: true });
}
function reviewLessonMistake() {
  const fields = [
    "lesson",
    "lessonTrace",
    "phase",
    "lessonIndex",
    "watchPart",
    "lessonQuestions",
    "answerIndex",
    "answerStart",
    "practice",
    "practiceCursor",
    "mentalStage",
    "mentalRevealed",
    "modelMode",
    "explore",
    "firstError"
  ];
  const saved = Object.fromEntries(fields.map((k) => [k, state[k]]));
  const expr = state.phase === "alone" ? state.lessonQuestions[state.answerIndex] : state.lesson.example;
  state.lessonReview = saved;
  state.hinted = true;
  solveInput(expr);
  focusWorkspace();
}
function retryQuestion() {
  if (!state.lessonReview) return;
  const saved = state.lessonReview;
  state.lessonReview = null;
  stopAuto();
  closeDialog();
  Object.assign(state, saved);
  state.view = "learn";
  state.feedback = null;
  state.checkpointFeedback = null;
  state.hinted = true;
  state.modelFocus = false;
  render();
  $("#answer")?.focus({ preventScroll: true });
}
function guidedMoveText(step) {
  if (!["en", "bn"].includes(lang) || state.modelMode === "hands")
    return stepDescription(step).text;
  const amount = step.params.amount;
  const place = String(step.params.place);
  const column = {
    en: {
      1: "ones",
      10: "tens",
      100: "hundreds",
      0.1: "tenths",
      0.01: "hundredths"
    },
    bn: {
      1: "\u098F\u0995\u0995\u09C7\u09B0",
      10: "\u09A6\u09B6\u0995\u09C7\u09B0",
      100: "\u09B6\u09A4\u0995\u09C7\u09B0",
      0.1: "\u09A6\u09B6 \u09AD\u09BE\u0997\u09C7\u09B0 \u098F\u0995 \u09AD\u09BE\u0997\u09C7\u09B0",
      0.01: "\u098F\u0995\u09B6\u09CB \u09AD\u09BE\u0997\u09C7\u09B0 \u098F\u0995 \u09AD\u09BE\u0997\u09C7\u09B0"
    }
  }[lang][place];
  const where = column ? lang === "bn" ? `${column} \u0998\u09B0\u09C7` : `in the ${column} column` : lang === "bn" ? `${place}-\u098F\u09B0 \u0998\u09B0\u09C7` : `in the ${place} column`;
  const on = step.kind.endsWith("On");
  if (lang === "bn")
    return `${where} ${step.kind.startsWith("upper") ? "\u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF\u099F\u09BE" : `\u09A8\u09BF\u099A\u09C7\u09B0 ${amount}\u099F\u09BF \u09AA\u09C1\u0981\u09A4\u09BF`} ${on ? "\u09AE\u09BE\u099D\u09C7\u09B0 \u09A6\u09BE\u0997\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u0986\u09A8\u09CB" : "\u09AE\u09BE\u099D\u09C7\u09B0 \u09A6\u09BE\u0997 \u09A5\u09C7\u0995\u09C7 \u09B8\u09B0\u09BE\u0993"}`;
  return `${on ? "Bring" : "Move"} ${step.kind.startsWith("upper") ? "the five-bead" : `${amount} lower bead${Number(amount) === 1 ? "" : "s"}`} ${on ? "to" : "away from"} the bar ${where}.`;
}
function stopAuto() {
  clearTimeout(autoTimer);
  autoTimer = null;
  autoPlaying = false;
}
function playSteps() {
  stopAuto();
  autoPlaying = true;
  render();
  const tick = () => {
    if (!autoPlaying || document.hidden) return;
    const { trace, index } = traceView();
    if (index >= trace.steps.length - 1) {
      stopAuto();
      render();
      return;
    }
    goStep(index + 1);
    autoTimer = setTimeout(tick, prefs.duration + 700);
  };
  autoTimer = setTimeout(tick, prefs.duration + 700);
}
function switchModel(mode) {
  closeDialog();
  stopAuto();
  model?.finish();
  state.modelMode = mode;
  model && (model.history = []);
  render();
  if (mode === "hands" && !prefs.fingerSeen) showFingerIntro();
}
function practiceSnapshot(step) {
  const revealed = state.checkpointFeedback?.correct || state.mentalRevealed;
  return state.explore || {
    ...revealed ? step.after : step.before,
    ...state.practice?.pose ? { pose: state.practice.pose } : {}
  };
}
function startGuided() {
  stopAuto();
  const trace = state.lessonTrace = solve(state.lesson.example);
  const first = trace.steps.findIndex((s) => s.kind === "operation");
  const moves2 = [
    "fractions",
    "negative",
    "equations",
    "order",
    "powers",
    "roots",
    "root-estimate",
    "percent"
  ].includes(state.lesson.skill) ? [] : actionSteps(trace).filter((s) => s.traceIndex >= Math.max(0, first));
  state.practice = { trace, steps: moves2, actions: [], pose: null };
  state.practiceCursor = 0;
  state.checkpointFeedback = null;
  state.feedback = null;
  state.firstError = null;
  state.explore = null;
  state.mentalRevealed = false;
  state.mentalStage = "see";
  state.phase = "together";
  state.practiceLocked = false;
  state.locked = false;
  render();
}
function supportTabs() {
  return `<div class="support-tabs" aria-label="${S("support")}">${["see", "blur", "hide"].map((k) => `<button data-action="mentalStage" data-stage="${k}" aria-pressed="${state.mentalStage === k}" class="${state.mentalStage === k ? "selected" : ""}">${S(k)}</button>`).join("")}</div>`;
}
function renderGuided(l) {
  if (!state.practice) {
    startGuided();
    return;
  }
  const pr = state.practice, step = pr.steps[state.practiceCursor];
  if (!step) {
    const snap = pr.trace.steps.find(
      (s) => [
        "operation",
        "multiplyPlan",
        "dividePlan",
        "rootCheck",
        "power"
      ].includes(s.kind)
    )?.before || pr.trace.steps[0].after;
    state.locked = true;
    $("#lesson-content").innerHTML = `<div class="solver-workspace"><div class="model-column">${modelCard({ ...snap, raw: null })}</div><section class="practice-prompt">${phaseHeader()}<span class="pill">${T("together")}</span><h2>${S("goal")}</h2><div class="recall-expression" dir="ltr">${esc(l.example)}</div>${answerForm()}<div id="feedback">${feedbackHTML()}</div></section></div>`;
    attachModel({ ...snap, raw: null });
    return;
  }
  const group = pr.trace.groups[step.group], mental = state.mentalStage !== "see", revealed = state.mentalRevealed || state.checkpointFeedback?.correct;
  state.locked = mental || !!state.practiceLocked;
  const move = stepDescription(step).math;
  $("#lesson-content").innerHTML = `<div class="solver-workspace"><div class="model-column">${modelCard(practiceSnapshot(step))}</div><section class="step-panel practice-prompt">${phaseHeader()}${contextHTML(group, step)}<div class="practice-body">${state.lesson.skill === "mental" ? supportTabs() : ""}<div class="step-kicker">${T("together")} \xB7 ${state.practiceCursor + 1} / ${pr.steps.length}</div><h2>${mental ? S("predict") : esc(guidedMoveText(step))}</h2><div class="step-math" dir="ltr">${move}</div><p>${S(mental ? "stageHint" : "checkpoint")}</p></div><div class="practice-actions">${mental ? `<form id="checkpoint-form" class="answer-form"><label class="sr-only" for="checkpoint-answer">${T("answer")}</label><input id="checkpoint-answer" name="answer" inputmode="${state.lesson && ["fractions", "negative", "divide", "equations"].includes(state.lesson.skill) ? "text" : "decimal"}" maxlength="80" autocomplete="off" dir="ltr" placeholder="${T("answer")}" ${state.checkpointFeedback?.correct ? "disabled" : ""}><button class="button primary" ${state.checkpointFeedback?.correct ? "disabled" : ""}>${T("check")}</button></form>` : btn(T("check"), "checkModel", "primary", state.checkpointFeedback?.correct ? "disabled" : "")}<div id="checkpoint-feedback">${checkpointFeedbackHTML()}</div><div class="playback-tools">${btn(S("revealHint"), "checkpointHint", "text-button")}</div>${state.firstError ? `<p class="fine">${S("firstMistake")} \xB7 ${state.firstError.index + 1}</p>` : ""}</div></section></div>`;
  attachModel(practiceSnapshot(step));
  const card = $(".model-card");
  card.classList.toggle("obscured", state.mentalStage === "blur" && !revealed);
  card.classList.toggle("concealed", state.mentalStage === "hide" && !revealed);
  const stage = $(".model-stage");
  stage.setAttribute("aria-hidden", String(mental && !revealed));
  stage.inert = mental && !revealed;
  model.setHidden(mental && !revealed);
  if (mental && !revealed) $("#total").textContent = "?";
  if (state.mentalStage === "hide" && !revealed)
    stage.insertAdjacentHTML(
      "beforeend",
      `<div class="mental-cover">${icon("learn")}<span>${S("answerHidden")}</span></div>`
    );
}
function checkpointFeedbackHTML() {
  const f = state.checkpointFeedback;
  if (!f) return "";
  return `<div class="feedback ${f.correct ? "success" : "try"}" role="status"><strong>${T(f.correct ? "correct" : "retry")}</strong>${f.correct ? `<span dir="ltr">${f.expected}</span>${btn(S("nextShort"), "advanceCheckpoint", "text-button")}` : `<span>${W(state.mentalStage === "see" ? "boardShows" : "entered")}: <b dir="ltr">${esc(f.actual)}</b></span>` + btn(S("compare"), "checkpointHint", "text-button")}</div>`;
}
function checkCheckpoint(value) {
  const pr = state.practice, step = pr?.steps[state.practiceCursor];
  if (!step) {
    checkLesson(value);
    return;
  }
  if (state.checkpointFeedback?.correct) return;
  const correct = answerEquals(value, step.after.value);
  state.checkpointFeedback = {
    correct,
    expected: step.after.value,
    actual: String(value)
  };
  if (!correct && !state.firstError)
    state.firstError = {
      index: state.practiceCursor,
      traceIndex: step.traceIndex,
      skill: misconception(step),
      answer: value
    };
  recordAttempt(state.progress, {
    correct,
    hinted: state.mentalRevealed,
    mode: "checkpoint",
    expression: pr.trace.source,
    answer: value,
    expected: step.after.value,
    config: {
      lesson: state.lesson.id,
      source: state.modelMode,
      support: state.mentalStage,
      traceIndex: step.traceIndex,
      skill: misconception(step),
      actions: pr.actions.slice(-8)
    }
  });
  if (correct) {
    pr.pose = state.explore?.pose || null;
    state.explore = null;
    state.mentalRevealed = true;
  }
  saveProgress();
  render();
}
function advanceCheckpoint() {
  if (!state.checkpointFeedback?.correct) return;
  const pr = state.practice;
  state.practiceCursor++;
  state.checkpointFeedback = null;
  state.explore = null;
  state.mentalRevealed = false;
  if (state.practiceCursor >= pr.steps.length) {
    if (state.lesson.skill === "mental" && state.mentalStage !== "hide") {
      state.mentalStage = state.mentalStage === "see" ? "blur" : "hide";
      state.practiceCursor = 0;
      pr.pose = null;
    } else {
      state.phase = "alone";
      state.practice = null;
      state.answerStart = 0;
      state.answerIndex = 0;
      state.feedback = null;
      state.locked = true;
    }
  }
  render();
}
function renderRecall(l) {
  if (!state.lessonQuestions.length)
    state.lessonQuestions = freshQuestions(l, Date.now(), state.modelMode);
  const expr = state.lessonQuestions[state.answerIndex % state.lessonQuestions.length], trace = solve(expr);
  if (!state.practice || state.practice.trace.source !== expr || state.practice.answerIndex !== state.answerIndex) {
    const start = trace.steps.find((s) => s.kind === "operation")?.before || {
      raw: "0",
      scale: 0,
      value: "0"
    };
    state.practice = {
      trace,
      start,
      actions: [],
      answerIndex: state.answerIndex
    };
    state.explore = null;
    state.mentalRevealed = false;
    state.answerStart = performance.now();
  }
  const mental = state.track === "mental" || l.skill === "mental", hidden = mental && !state.mentalRevealed;
  state.locked = hidden;
  $("#lesson-content").innerHTML = `<div class="solver-workspace"><div class="model-column">${modelCard(state.explore || state.practice.start)}</div><section class="recall-card">${phaseHeader()}<span class="pill">${T("alone")} \xB7 ${state.answerIndex + 1} / ${state.lessonQuestions.length}</span><h2>${S("fresh")}</h2><div class="recall-expression" dir="ltr">${esc(expr.replaceAll("*", "\xD7").replaceAll("/", "\xF7"))}</div><p>${T("noRush")}</p>${answerForm()}<div id="feedback">${feedbackHTML()}</div><div class="playback-tools">${btn(T("hint"), "hint", "text-button")}${hidden ? btn(S("compare"), "recallReveal", "text-button") : ""}</div></section></div>`;
  attachModel(state.explore || state.practice.start);
  model.setHidden(hidden);
  if (hidden) {
    $(".model-card").classList.add("concealed");
    $(".model-stage").inert = true;
    $(".model-stage").setAttribute("aria-hidden", "true");
    $("#total").textContent = "?";
    $(".model-stage").insertAdjacentHTML(
      "beforeend",
      `<div class="mental-cover">${icon("learn")}<span>${S("answerHidden")}</span></div>`
    );
  }
}
function dialog(title, body, footer = "") {
  stopAuto();
  if (state.view === "gym" && ["playing", "answer"].includes(state.gym?.status)) {
    cancelGym(true);
    renderGym();
  }
  const returnTo = $("#studio-dialog") ? dialogFocus : captureFocus();
  closeDialog(false);
  dialogFocus = returnTo;
  const el = document.createElement("dialog");
  el.id = "studio-dialog";
  el.className = "studio-dialog";
  el.setAttribute("aria-labelledby", "dialog-title");
  el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="dialog-head"><span class="guide-avatar">A</span><h2 id="dialog-title">${title}</h2>${btn("\xD7", "closeDialog", "icon-button", `aria-label="${S("close")}"`)}</div><div class="dialog-body">${body}</div><div class="dialog-footer">${footer || btn(S("done"), "closeDialog", "primary")}</div>`;
  document.body.append(el);
  el.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeDialog();
  });
  el.addEventListener("click", (e) => {
    if (e.target === el) closeDialog();
  });
  try {
    el.showModal();
  } catch {
    el.setAttribute("open", "");
  }
  el.querySelector("button,select,input")?.focus();
  return el;
}
function closeDialog(restore = true) {
  dialogDemo?.dispose();
  dialogDemo = null;
  const d = $("#studio-dialog");
  if (d) {
    try {
      d.close();
    } catch {
    }
    d.remove();
    if (restore && !restoreFocus(dialogFocus)) focusWorkspace();
  }
  dialogFocus = null;
}
function preferenceSelect(key, label, options) {
  return `<label>${S(label)}<select data-pref="${key}">${options.map(([v, k]) => `<option value="${v}" ${String(prefs[key]) === String(v) ? "selected" : ""}>${S(k)}</option>`).join("")}</select></label>`;
}
function languageSelect() {
  return `<label>${S("chooseLanguage")}<select id="setup-language">${languages.map(([v, k]) => `<option value="${v}" ${lang === v ? "selected" : ""}>${k}</option>`).join("")}</select></label>`;
}
function showSetup() {
  dialog(
    P("welcomeTitle", lang),
    `<p class="welcome-line">${P("welcomeLine", lang)}</p>${languageSelect()}<p class="fine">${S("setupNote")}</p>`,
    btn(P("startLearning", lang), "finishSetup", "primary")
  );
}
function showModelTools() {
  dialog(
    S("modelControls"),
    `<div class="segmented dialog-model-mode">${["abacus", "hands"].map((mode) => btn(T(mode === "hands" ? "hands" : "abacus"), "modelMode", mode === state.modelMode ? "active" : "", `data-mode="${mode}" aria-pressed="${mode === state.modelMode}"`)).join("")}</div><div class="model-control-grid">${state.view === "solver" || state.view === "learn" && state.phase === "watch" ? btn(W(state.locked ? "explore" : "restore"), "lock", "secondary") : ""}${btn(S(state.modelFocus ? "exitFocus" : "focus"), "enlargeModel", "secondary")}${btn(S("resetView"), "resetView", "secondary")}${state.locked ? btn(S("replay"), "replay", "secondary") : btn(S("undo"), "undo", "secondary") + btn(S("resetExplore"), "clearModel", "secondary")}${btn("\u2212", "zoomOut", "secondary", `aria-label="${S("zoomOut")}"`)}${btn("\uFF0B", "zoomIn", "secondary", `aria-label="${S("zoomIn")}"`)}${btn("\u2039", "panLeft", "secondary", `aria-label="${S("panLeft")}"`)}${btn("\u203A", "panRight", "secondary", `aria-label="${S("panRight")}"`)}</div><p class="fine">${state.modelMode === "hands" ? S(prefs.fingerPose === "extendedCounts" ? "raiseHelp" : "bendHelp") : S("setupNote")}</p><div class="row">${state.view === "learn" && state.lesson ? btn(W("lessonPlan"), "lessonPlan", "text-button") : ""}${state.view === "solver" ? btn(S("examples"), "examplesDialog", "text-button") : ""}${btn(S("settings"), "settings", "text-button")}${btn(T("account"), "nav", "text-button", 'data-view="account"')}</div>`
  );
}
function showExamples() {
  dialog(
    S("examples"),
    `<div class="example-choices">${["82 \u2212 56", "999 + 1", "12.50 \u2212 3.75", "23 \xD7 14", "156 \xF7 12", "1/3 + 1/6", "\u22123 \xD7 4", "2*x+3=15"].map((e) => btn(esc(e), "example", "secondary", `data-expression="${esc(e)}"`)).join("")}</div>`
  );
}
function showSettings() {
  dialog(
    S("settings"),
    `<details open><summary>${S("appearance")}</summary><div class="preference-grid">${preferenceSelect(
      "density",
      "layout",
      [
        ["auto", "auto"],
        ["compact", "compact"],
        ["chunky", "chunky"]
      ]
    )}${preferenceSelect("theme", "theme", [
      ["system", "system"],
      ["light", "light"],
      ["dark", "dark"]
    ])}${preferenceSelect(
      "surface",
      "palette",
      Object.keys({ classic: 1, wood: 1, cyber: 1, orchid: 1 }).map((k) => [
        k,
        k
      ])
    )}<label>${S("colour")}<input data-pref="customColor" type="color" value="${prefs.customColor}"></label>${preferenceSelect(
      "renderer",
      "rendering",
      [
        ["3d", "three"],
        ["2d", "flat"]
      ]
    )}</div></details><details open><summary>${S("controls")}</summary><div class="preference-grid">${preferenceSelect(
      "fingerStyle",
      "fingerControl",
      [
        ["individual", "individual"],
        ["abacus", "abacusStyle"]
      ]
    )}${preferenceSelect("fingerPose", "fingerPose", [
      ["foldedCounts", "foldedCounts"],
      ["extendedCounts", "extendedCounts"]
    ])}${preferenceSelect("duration", "movement", [
      [500, "0.5 s"],
      [1e3, "1 s"],
      [2e3, "2 s"],
      [3e3, "3 s"]
    ])}<label class="toggle-label"><input data-pref="motion" type="checkbox" ${prefs.motion ? "checked" : ""}>${S("ambient")}</label><label class="toggle-label"><input data-pref="lowPower" type="checkbox" ${prefs.lowPower ? "checked" : ""}>${S("lowPower")}</label></div>${btn(S("fingerIntro"), "fingerGuide", "text-button")}</details><details><summary>${S("learning")}</summary><div class="preference-grid">${preferenceSelect("integerColumns", "integerColumns", [[0, "auto"], ...[1, 2, 3, 4, 6, 8, 12, 18].map((n) => [n, String(n)])])}${preferenceSelect("decimalColumns", "decimalColumns", [[0, "auto"], ...[1, 2, 3, 4, 6, 8].map((n) => [n, String(n)])])}<label class="toggle-label"><input data-pref="guide" type="checkbox" ${prefs.guide ? "checked" : ""}>${S("guide")}</label></div><p class="fine">${S("needed")}</p></details>`,
    `${btn(S("restoreDefaults"), "defaultPrefs", "secondary")}${btn(S("done"), "closeDialog", "primary")}`
  );
}
function showFingerIntro() {
  const el = dialog(
    S("fingerIntro"),
    `<p>${S("handsLimit")} ${S(prefs.fingerPose === "extendedCounts" ? "raiseHelp" : "bendHelp")}</p><div class="finger-mode-choices">${["individual", "abacus"].map((k) => `<button data-action="demoStyle" data-style="${k}" class="${prefs.fingerStyle === k ? "selected" : ""}"><b>${S(k === "individual" ? "individual" : "abacusStyle")}</b><span>${S(k === "individual" ? "individualHelp" : "abacusHelp")}</span></button>`).join("")}</div><p>${S("tryDemo")} \xB7 <b id="demo-value" dir="ltr">0</b></p><div id="finger-demo" class="model"></div>`,
    btn(S("useMode"), "finishFingerGuide", "primary")
  );
  dialogDemo = new BeadModel(el.querySelector("#finger-demo"), {
    prefs: () => ({ ...prefs, renderer: "2d" }),
    lang: () => lang,
    onChange: (s) => $("#demo-value").textContent = s.value
  });
  dialogDemo.mode = "hands";
  dialogDemo.locked = false;
  dialogDemo.set({ raw: "0", scale: 0, value: "0" });
}
function showGuide() {
  dialog(
    S("guide"),
    `<p>${S("guideTip")}</p><ol class="guide-list"><li>${S("operation")}</li><li>${S("substep")}</li><li>${T("lockHint")}</li><li>${S("stageHint")}</li></ol><div class="row">${btn(S("fingerIntro"), "fingerGuide", "secondary")}${btn(S("settings"), "settings", "secondary")}</div>`
  );
}
function savePrefs() {
  writePrefs(prefs);
  applyPrefs(prefs);
  render();
}
document.addEventListener(
  "click",
  (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const a = el.dataset.action;
    const actions = {
      journey: () => setJourney(el.dataset.journey),
      explainer: () => openExplainer(el.dataset.id),
      workspaceMenu: showWorkspaceMenu,
      retryQuestion,
      lessonPlan: showLessonPlan,
      watchIdea: () => {
        if (state.lesson.parts) watchIdea(Number(el.dataset.index));
        else {
          closeDialog();
          state.phase = "watch";
          state.lessonTrace = solve(state.lesson.example);
          goStep(0);
        }
      },
      nextIdea: () => watchIdea(state.watchPart + 1),
      unitCheck: () => showUnitCheck(Number(el.dataset.unit)),
      startAssessment: beginAssessment,
      nextAssessment: nextAssessmentItem,
      assessmentReveal: () => {
        state.assessment.hinted = true;
        state.assessment.revealed = true;
        render();
      },
      changePassword: () => showAccountChange(false),
      deleteAccount: () => showAccountChange(true),
      retrySave: () => {
        saveProgress();
        render();
      },
      reloadSaved,
      gymOptions: showGymOptions,
      confirmImport,
      modelTools: showModelTools,
      examplesDialog: showExamples,
      enlargeModel: () => {
        closeDialog();
        state.modelFocus = !state.modelFocus;
        render();
      },
      reviewAttempt: () => {
        const a2 = state.progress.attempts.find((a3) => a3.id === el.dataset.id);
        if (!a2) return;
        const trace = solveInput(a2.expression);
        const index = a2.config?.traceIndex ?? a2.config?.firstMistake?.traceIndex;
        if (trace && index !== void 0) goStep(index);
      },
      gymReveal: () => {
        state.gym.revealed = true;
        renderGymStage();
      },
      markMistake: () => {
        if (state.gym?.last) {
          const step = traceView().step;
          state.gym.last.config.firstMistake = {
            traceIndex: step.id,
            skill: misconception(step)
          };
          saveProgress();
          toast(`${S("firstMistake")} \xB7 ${step.id + 1}`);
        }
      },
      settings: showSettings,
      guide: showGuide,
      closeDialog,
      skipSetup: () => {
        Object.assign(prefs, {
          setupSeen: true,
          density: "auto",
          surface: "classic"
        });
        lang = "en";
        state.modelMode = "abacus";
        try {
          localStorage.setItem("academy-language", "en");
        } catch {
        }
        writePrefs(prefs);
        closeDialog();
        render();
      },
      finishSetup: () => {
        prefs.setupSeen = true;
        writePrefs(prefs);
        closeDialog();
        render();
      },
      fingerGuide: showFingerIntro,
      finishFingerGuide: () => {
        prefs.fingerSeen = true;
        writePrefs(prefs);
        closeDialog();
        render();
      },
      demoStyle: () => {
        prefs.fingerStyle = el.dataset.style;
        writePrefs(prefs);
        $("#studio-dialog").querySelectorAll('[data-action="demoStyle"]').forEach((b) => b.classList.toggle("selected", b === el));
        if (dialogDemo) dialogDemo.set(dialogDemo.snapshot);
      },
      defaultPrefs: () => {
        Object.assign(
          prefs,
          sanitizePrefs({ setupSeen: true, fingerSeen: prefs.fingerSeen })
        );
        savePrefs();
        showSettings();
      },
      track: () => {
        state.track = el.dataset.track;
        state.lesson = null;
        render();
      },
      switchAbacus: () => switchModel("abacus"),
      panLeft: () => model?.pan(0.8),
      panRight: () => model?.pan(-0.8),
      zoomIn: () => model?.zoom(1.08),
      zoomOut: () => model?.zoom(0.92),
      resetView: () => model?.resetView(),
      undo: () => {
        closeDialog();
        model?.undo();
      },
      clearModel: () => {
        closeDialog();
        model?.clear();
      },
      replay: () => {
        closeDialog();
        if (state.phase === "together") {
          state.mentalRevealed = true;
          render();
        } else model?.replay(traceView().step.before);
      },
      focus: () => {
        state.focus = !state.focus;
        render();
      },
      autoSteps: playSteps,
      pauseSteps: () => {
        stopAuto();
        render();
      },
      mentalStage: () => {
        state.mentalStage = el.dataset.stage;
        state.explore = null;
        state.mentalRevealed = false;
        state.checkpointFeedback = null;
        render();
      },
      advanceCheckpoint,
      checkpointHint: () => {
        state.mentalRevealed = true;
        state.hinted = true;
        const step = state.practice?.steps[state.practiceCursor];
        if (step) state.explore = step.after;
        render();
      },
      recallReveal: () => {
        state.mentalRevealed = true;
        state.hinted = true;
        render();
      }
    };
    if (actions[a]) {
      e.stopImmediatePropagation();
      actions[a]();
    }
  },
  true
);
document.addEventListener("change", (e) => {
  if (e.target.id === "setup-language") {
    lang = e.target.value;
    try {
      localStorage.setItem("academy-language", lang);
    } catch {
    }
    render();
    showSetup();
    return;
  }
  const k = e.target.dataset.pref;
  if (!k) return;
  const input = e.target;
  const value = input.type === "checkbox" ? input.checked : input.value;
  Object.assign(prefs, sanitizePrefs({ ...prefs, [k]: value }));
  if (k === "surface")
    prefs.customColor = {
      classic: "#536be8",
      wood: "#a96135",
      cyber: "#00cbbd",
      orchid: "#9762d1"
    }[prefs.surface];
  savePrefs();
  if (k === "surface") {
    const picker = $('[data-pref="customColor"]');
    if (picker) picker.value = prefs.customColor;
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "checkpoint-form") {
    e.preventDefault();
    checkCheckpoint(String(new FormData(e.target).get("answer")));
  }
});
document.addEventListener("keydown", (e) => {
  if ($("#studio-dialog") || e.target.closest("input,select,textarea") || e.ctrlKey || e.metaKey || e.altKey)
    return;
  if ((state.view === "solver" || state.view === "learn" && state.phase === "watch") && state.lessonTrace || state.view === "solver") {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stopAuto();
      goStep(traceView().index + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stopAuto();
      goStep(traceView().index - 1);
    }
  }
  if (e.key === "Escape" && (state.focus || state.modelFocus)) {
    state.focus = false;
    state.modelFocus = false;
    render();
  }
});
globalThis.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
  if (prefs.theme === "system") applyPrefs(prefs);
});
function resizeStudio() {
  const height = globalThis.visualViewport?.height || globalThis.innerHeight || 800;
  document.documentElement.style.setProperty("--studio-height", `${height}px`);
  document.body.classList.toggle("short-viewport", height < 560);
  if (prefs.density === "auto") applyPrefs(prefs);
  const active = document.activeElement;
  if (active?.matches("input,select") && !$("#studio-dialog"))
    active.scrollIntoView?.({ block: "nearest" });
}
globalThis.visualViewport?.addEventListener("resize", resizeStudio);
globalThis.addEventListener?.("resize", resizeStudio);
resizeStudio();
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const a = el.dataset.action;
  switch (a) {
    case "nav":
      if (el.dataset.view === "learn") state.lesson = null;
      nav(el.dataset.view);
      break;
    case "openLesson":
      closeDialog();
      openLesson(el.dataset.id);
      break;
    case "allLessons":
      closeDialog();
      stopAuto();
      state.lesson = null;
      state.modelFocus = state.focus = false;
      state.view = "learn";
      render();
      break;
    case "nextLesson": {
      if (state.lesson?.journey === "normal" && state.lesson.order === normalLessons.length - 1) {
        setJourney("mastery");
        break;
      }
      const path = state.lesson.journey === "normal" ? normalLessons : lessons;
      const next = path.find((l) => l.order > state.lesson.order);
      if (next) openLesson(next.id);
      else {
        state.lesson = null;
        render();
      }
      break;
    }
    case "relatedLesson":
      openLesson(el.dataset.id);
      break;
    case "returnSolver":
      returnSolver();
      break;
    case "example":
      closeDialog();
      solveInput(el.dataset.expression);
      break;
    case "next":
      stopAuto();
      goStep(traceView().index + 1);
      break;
    case "prev":
      stopAuto();
      if (state.view === "learn" && state.watchPart && state.lessonIndex === 0) {
        watchIdea(state.watchPart - 1);
        goStep(state.lessonTrace.steps.length - 1);
      } else goStep(traceView().index - 1);
      break;
    case "jump":
      stopAuto();
      goStep(Number(el.dataset.index));
      break;
    case "resetSteps":
      stopAuto();
      goStep(0);
      break;
    case "explain":
      stopAuto();
      state.expanded = !state.expanded;
      render();
      break;
    case "modelMode":
      switchModel(el.dataset.mode);
      break;
    case "lock":
      closeDialog();
      if (state.phase === "together" && state.view === "learn") {
        if (state.mentalStage !== "see") {
          toast(S("stageHint"));
          break;
        }
        state.practiceLocked = !state.practiceLocked;
        if (state.practiceLocked) {
          state.explore = null;
          model.history = [];
        }
        render();
        break;
      }
      state.locked = !state.locked;
      if (state.locked) state.explore = null;
      model.history = [];
      render();
      break;
    case "readStep": {
      const s = traceView().step;
      read(`${stepDescription(s).text}. ${learningIdea(s.lesson)}`);
      break;
    }
    case "readLesson":
      read(lessonIdea(state.lesson));
      break;
    case "phaseTogether":
      startGuided();
      break;
    case "checkModel":
      checkCheckpoint(model?.snapshot?.value || "0");
      break;
    case "continueAnswer":
      if (state.phase === "together") {
        state.phase = "alone";
        state.answerIndex = 0;
        state.answerStart = 0;
        state.practice = null;
      } else {
        state.answerIndex++;
        state.answerStart = 0;
        state.practice = null;
        if (state.answerIndex >= state.lessonQuestions.length)
          state.phase = "complete";
      }
      state.feedback = null;
      state.hinted = false;
      state.explore = null;
      render();
      break;
    case "hint":
      state.hinted = true;
      dialog(T("hint"), `<p>${esc(lessonIdea(state.lesson))}</p>`);
      break;
    case "showLesson":
      reviewLessonMistake();
      break;
    case "preset":
      cancelGym();
      state.gym = null;
      state.gymConfig = { ...presets[el.dataset.preset] };
      renderGym();
      showGymOptions();
      break;
    case "startGym":
      startGym();
      break;
    case "nextGym":
      nextGym();
      break;
    case "finishGym":
      finishGym();
      break;
    case "newGym":
      state.gym = null;
      renderGym();
      break;
    case "applyPace": {
      const next = suggestNext(state.progress.attempts, state.gymConfig);
      if (next) state.gymConfig = next;
      state.gym = null;
      renderGym();
      break;
    }
    case "gymReview": {
      const q = state.gym.question;
      if (q.calendar) {
        toast(q.explanation);
        break;
      }
      state.returnGym = true;
      cancelGym();
      solveInput(q.expression);
      const first = state.solver.steps.findIndex((s) => s.kind === "operation");
      if (first > 0) goStep(first);
      break;
    }
    case "backGym":
      state.returnGym = false;
      nav("gym");
      break;
    case "reviewExpression":
      if (/^\d{4}-\d{2}-\d{2}$/.test(el.dataset.expression)) {
        toast(el.dataset.expression);
        break;
      }
      state.returnGym = true;
      solveInput(el.dataset.expression);
      break;
    case "export":
      exportProgress();
      if ($("#studio-dialog")?.dataset.kind === "import") showImportPreview();
      break;
    case "signOut":
      signOut();
      break;
  }
});
document.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target, fd = new FormData(form);
  if (form.id === "assessment-form") checkAssessment(fd.get("answer"));
  if (form.id === "assessment-options") beginAssessment();
  if (form.id === "solver-form") solveInput(fd.get("expression"));
  if (form.id === "answer-form") {
    const v = fd.get("answer");
    if (String(v).trim()) checkLesson(v);
  }
  if (form.id === "gym-answer-form") checkGym(String(fd.get("answer")));
  if (form.id === "account-change-form") {
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await saveQueue;
      const deleting = form.dataset.deleting === "true";
      await api(deleting ? "/account" : "/auth/password", {
        method: deleting ? "DELETE" : "POST",
        body: JSON.stringify(Object.fromEntries(fd))
      });
      closeDialog();
      if (deleting) {
        state.user = null;
        state.progress = freshProgress();
        state.revision = 0;
        state.syncStatus = "guest";
        state.syncBlocked = false;
      }
      render();
      toast(T("correct"));
    } catch (error2) {
      $("#account-change-error").textContent = error2.message;
      button.disabled = false;
    }
  }
  if (form.id === "auth-form") {
    if (state.progress.attempts.length && (state.exportedAt || 0) < state.progress.updatedAt) {
      $("#auth-error").textContent = S("exportGuest");
      return;
    }
    const buttons = [...form.querySelectorAll("button")];
    buttons.forEach((b) => b.disabled = true);
    try {
      const d = await api(
        `/auth/${e.submitter?.value === "register" ? "register" : "login"}`,
        { method: "POST", body: JSON.stringify(Object.fromEntries(fd)) }
      );
      state.user = d.user;
      state.syncBlocked = false;
      state.syncStatus = "saved";
      state.sync = T("saved");
      state.progress = d.progress || freshProgress();
      state.revision = d.revision || 0;
      restoreNavigation();
      render();
    } catch (err) {
      const alert = $("#auth-error");
      if (alert) alert.textContent = err.message;
    } finally {
      buttons.forEach((b) => b.disabled = false);
    }
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id === "language") {
    cancelGym();
    lang = e.target.value;
    try {
      localStorage.setItem("academy-language", lang);
    } catch {
    }
    state.progress.settings.lang = lang;
    saveProgress();
    render();
  }
  if (e.target.closest("#gym-settings")) {
    try {
      settingsFromForm();
      syncGymOptions();
      renderGym();
    } catch {
      toast(T("error"));
    }
  }
  if (e.target.id === "import-file") {
    try {
      const file = e.target.files[0];
      if (!file || file.size > 1e6) throw Error();
      const d = JSON.parse(await file.text());
      if (d.format !== "abacus-academy-v2" || d.progress?.schema !== 2 || !Array.isArray(d.progress.attempts) || d.progress.attempts.length > 1e3 || !d.progress.lessons || typeof d.progress.lessons !== "object")
        throw Error();
      const p = freshProgress();
      for (const a of d.progress.attempts) {
        if (typeof a.correct !== "boolean" || !Number.isFinite(a.at) || !Number.isFinite(a.ms) || a.ms < 0 || typeof a.expression !== "string" || a.expression.length > 2e3 || typeof a.answer !== "string" || a.answer.length > 80 || typeof a.expected !== "string" || a.expected.length > 160)
          throw Error();
        p.attempts.push({
          ...a,
          id: typeof a.id === "string" && a.id.length <= 100 ? a.id : globalThis.crypto.randomUUID(),
          hinted: !!a.hinted,
          mode: ["gym", "recall", "checkpoint", "assessment"].includes(a.mode) ? a.mode : "recall"
        });
      }
      for (const l of allLessons) {
        const v = d.progress.lessons[l.id];
        if (v && (!["learned", "retained", "practicing"].includes(v.status) || !Number.isFinite(v.due) || v.due < 0 || v.due > 864e13 || !Array.isArray(v.days) || v.days.length > 1e3 || ["attempts", "correct", "level", "streak", "last"].some(
          (key) => v[key] != null && !Number.isFinite(Number(v[key]))
        )))
          throw Error();
        if (v && ["learned", "retained", "practicing"].includes(v.status) && Number.isFinite(v.due) && Array.isArray(v.days))
          p.lessons[l.id] = {
            status: v.status,
            due: v.due,
            attempts: Math.max(0, Math.floor(Number(v.attempts) || 0)),
            correct: Math.max(0, Math.floor(Number(v.correct) || 0)),
            level: Math.max(0, Math.min(3, Number(v.level) || 0)),
            streak: Math.max(0, Math.floor(Number(v.streak) || 0)),
            last: Math.max(0, Number(v.last) || 0),
            days: v.days.filter(
              (day) => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day)
            ),
            items: Array.isArray(v.items) ? v.items.filter((x) => typeof x === "string" && x.length <= 2e3).slice(-30) : [],
            firstLearnedAt: Number.isFinite(v.firstLearnedAt) ? v.firstLearnedAt : 0
          };
      }
      if (languages.some(([code]) => code === d.progress.settings?.lang))
        p.settings.lang = d.progress.settings.lang;
      p.settings.sound = !!d.progress.settings?.sound;
      const n = d.progress.navigation;
      if (n && typeof n.expression === "string" && n.expression.length <= 2e3)
        p.navigation = {
          expression: n.expression,
          index: Math.max(0, Math.min(8e3, Number(n.index) || 0)),
          lessonId: allLessons.some((l) => l.id === n.lessonId) ? n.lessonId : null
        };
      state.pendingImport = p;
      e.target.value = "";
      showImportPreview();
    } catch {
      const status = $("#auth-error");
      if (status) status.textContent = S("importError");
      toast(S("importError"));
    }
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "expression") {
    state.solverDraft = e.target.value;
    state.solverError = "";
    e.target.setAttribute("aria-invalid", "false");
    const error2 = $("#solver-error");
    if (error2) error2.textContent = "";
  }
  if (e.target.name === "pace" && e.target.closest("#gym-settings"))
    e.target.parentElement.querySelector("output").textContent = (e.target.value / 1e3).toFixed(2) + " s";
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAuto();
    const active = state.gym && ["playing", "answer"].includes(state.gym.status);
    cancelGym(active);
    if (active && state.view === "gym") renderGym();
  }
});
window.addEventListener("pagehide", () => cancelGym());
window.addEventListener("hashchange", () => {
  const view = location.hash.slice(1);
  if (["learn", "solver", "gym", "progress", "account"].includes(view)) {
    closePlayer(true);
    if (view === "learn") state.lesson = null;
    nav(view);
  }
});
const ideaArt = (id) => {
  const beads = { parts: [[14, 16], [14, 30], [34, 30]], places: [[12, 30], [24, 30], [36, 30]], little: [[14, 15], [14, 30], [34, 30]], big: [[14, 30], [34, 14], [34, 30]], borrow: [[34, 30], [14, 14], [14, 30]] }[id] || [];
  return `<svg viewBox="0 0 48 48"><rect x="4" y="5" width="40" height="38" rx="7" class="a-frame"/><path d="M4 21h40" class="a-bar"/>${[14, 34].map((x) => `<path d="M${x} 7v34" class="a-rod"/>`).join("")}${beads.map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.6" class="${y < 21 ? "a-top" : "a-low"}"/>`).join("")}</svg>`;
};
function nextLessonAfter(l) {
  if (l.journey === "normal") return l.order === normalLessons.length - 1 ? "mastery" : normalLessons.find((x) => x.order > l.order);
  return lessons.find((x) => x.order > l.order) || null;
}
configurePlayer({
  getLang: () => lang,
  solve,
  answerEquals,
  freshQuestions: (l, seed) => freshQuestions(l, seed, "abacus"),
  recordAttempt: (payload) => {
    recordAttempt(state.progress, payload);
    saveProgress();
  },
  titleOf: L,
  ideaOf: (part) => part.idea?.[lang] || C(part.skill),
  statusOf: progressStatus,
  track: () => state.track,
  nextLesson: (l) => nextLessonAfter(l),
  dueText: (l) => {
    const due = state.progress.lessons[l.id]?.due;
    return due ? new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(new Date(due)) : "";
  },
  read,
  onClose: () => {
    state.feedback = null;
    render();
  },
  onNext: (l) => {
    const n = nextLessonAfter(l);
    if (n === "mastery") {
      closePlayer(true);
      setJourney("mastery");
    } else if (n) playLesson(n);
    else closePlayer();
  },
});
// test hooks (harmless in production): let automated tests open / close lessons directly
globalThis.__openLesson = (id) => openLesson(id);
globalThis.__closeLesson = () => closePlayer(true);
render();
queueMicrotask(() => {
  if (!prefs.setupSeen) showSetup();
});
if (config.apiBase)
  api("/auth/me").then((d) => {
    state.registrationOpen = !!d.registrationOpen;
    if (d.user) {
      state.user = d.user;
      state.syncStatus = "saved";
      state.sync = T("saved");
      state.progress = d.progress;
      state.revision = d.revision;
      restoreNavigation();
      render();
    } else if (state.view === "account") render();
  }).catch(() => {
    state.cloud = false;
    if (state.view === "account") render();
  });
if (document.modelContext?.registerTool) {
  const life = new AbortController();
  try {
    Promise.resolve(
      document.modelContext.registerTool(
        {
          name: "show_calculation",
          description: "Open a calculation in the step-by-step solver.",
          inputSchema: {
            type: "object",
            properties: { expression: { type: "string", maxLength: 2e3 } },
            required: ["expression"],
            additionalProperties: false
          },
          execute(input) {
            if (!input || typeof input.expression !== "string")
              throw Error("Expression required");
            const trace = solve(input.expression);
            solveInput(input.expression);
            return { result: trace.result, steps: trace.steps.length };
          }
        },
        { signal: life.signal }
      )
    ).catch(() => {
    });
    window.addEventListener("pagehide", () => life.abort(), { once: true });
  } catch {
  }
}
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((registration) => registration.update()).catch(() => {
  });
}
