<!-- File: README.md
     Directory: ./
     Project overview: structure, commands, and how lessons are generated and tested. -->
# Abacus Academy

Learn the abacus (soroban) and mental maths through small, friendly steps. Six languages (English, Bangla,
Spanish, Hindi, Arabic, Chinese), works offline, no account needed.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173  (ES modules, no build step)
npm run build    # dist/abacus-academy.html — ONE self-contained file, opens by double-click (~0.7 MB)
npm test         # lint + build + every lesson + focused flows (needs `npm run dev` running)
```

## Designed for first-time learners

* **Touch first.** The very first screen lets a child tap a bead within seconds; no reading needed to start.
* **Bo the bead** speaks in tiny sentences (one idea each), with optional read-aloud and soft sound effects.
* **Never "wrong" while exploring.** Early steps are errorless; hints escalate from a glow to an arrow to "Show me".
* **Tap, don't type.** Early questions are big tap-the-answer buttons (e.g. 35 vs 53 for tens and ones).
* **Concrete → picture → symbol.** Beads are "awake" when they touch the middle bar; the big bead is "a whole hand = 5";
  add/take steps start with a sweets story; the numbers come last.
* **Motivation without pressure.** Stars, stickers for each lesson, a gentle day streak, and a winding lesson path.

## What a lesson feels like

Every lesson is a short, full-screen flow with one obvious button at a time:

1. **Learn** – a picture-first idea (parts of the abacus, place value, *little friends*, *big friends*, borrowing). Same ideas live on the Learn page under **Helpful ideas** and open from the "?" tag on any friend move.
2. **Watch** – a friendly coach narrates each move; the beads that must move glow, arrows show the direction, and the board slides for you. Back / Next / Auto-play / Again.
3. **Try** – you make the same moves. The board checks itself (no "Check" button), explains a wrong move, and offers Undo or "Show me".
4. **Practice** – fresh questions until you get **three in a row**. Wrong twice → a worked solution, then a new question.

Lessons the abacus can't show (fractions, signs, equations…) use the same flow with a "maths pad" instead of beads.

## Structure

```
index.html            dev entry (css/ + src/app.js)
css/
  base.css, overrides.css   legacy layout rules (pruned of dead selectors)
  soroban.css               SVG abacus + finger board
  player.css                the lesson player
  shell.css                 top bar, Learn page, Solve page, helpful-ideas shelf
src/
  app.js              pages (Learn, Solve, Practice, Progress, Account), dialogs, events
  player.js           lesson player: learn / watch / try / practice / unit check / solution
  coach.js            turns engine steps into plain-language scenes (little/big friends, borrowing)
  explainers.js       illustrated ideas (scene lists played on the board)
  soroban.js          SVG abacus (tap, keyboard, highlights, animation)
  fingers.js          two-hand finger board with the same API
  engine.js           exact arithmetic + step-by-step bead move generator
  curriculum.js, journeys.js, advanced-lessons.js   78 mastery lessons + the 15-lesson starter path
  practice.js, assessment.js, gym.js                question generators, unit checks, mental gym
  i18n.js, journey-i18n.js, player-i18n.js, player-i18n-extra.js   text for six languages
tools/                build.mjs (single-file bundle), dev-server.mjs, prune-*.mjs helpers
tests/                lib.mjs, smoke.mjs, sweep-lessons.mjs, flows.mjs, tour.mjs, run.mjs
```

## Tests

* `sweep-lessons.mjs` opens **all 93 lessons**, plays them through with correct answers (keyboard on the board,
  typed answers), and cross-checks the engine's answers against JavaScript arithmetic.
* `flows.mjs` covers the Solve page, unit check, mental gym, all six languages (incl. right-to-left),
  keyboard-only use and text hygiene (no `{placeholder}` / `undefined` leaks).
* `tour.mjs` screenshots every page at desktop and phone size for visual review.

## Notes

* The es / hi / ar / zh strings for the new player (`src/player-i18n-extra.js`) are machine-drafted;
  a native-speaker pass is welcome. Anything missing falls back to English.
* Engine-generated wording for paper-and-pencil steps (fractions, equations, roots) is plain English only;
  other languages still show the engine's original wording for those steps.
