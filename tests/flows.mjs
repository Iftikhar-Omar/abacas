// File: flows.mjs
// Directory: tests/
// Focused end-to-end checks of the non-lesson flows: Solve page, unit check, mental gym,
// languages (incl. right-to-left), dark mode, keyboard-only lesson, and text hygiene.
import { launch, playLesson, stage } from './lib.mjs';

let failures = 0;
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) failures++; };
const badText = (t) => /undefined|\{\w+\}|NaN|\[object/.test(t);

/* ---- Solve page ---- */
{
  const { browser, page, errors } = await launch();
  await page.evaluate(() => document.querySelector('[data-action=nav][data-view=solver]').click());
  await page.fill('#expression', 'banana'); await page.keyboard.press('Enter');
  check(!(await page.$('#lp')) && (await page.textContent('#solver-error')).length > 5, 'solve: bad input shows a friendly error and no overlay');
  await page.click('[data-action=clearSolver]');
  await page.click('[data-action=opkey][data-key="×"]');
  check((await page.inputValue('#expression')) === '×', 'solve: operator key inserts text');
  await page.fill('#expression', '8+7'); await page.keyboard.press('Enter');
  check(!!(await page.$('#lp')) && (await stage(page)) === 'Solution', 'solve: valid input opens the step-by-step solution');
  for (let i = 0; i < 12 && (await page.$('[data-lp=next]')); i++) { await page.click('[data-lp=next]'); }
  await page.keyboard.press('Escape');
  check(!(await page.$('#lp')), 'solve: Escape closes the solution');
  check(errors.length === 0, 'solve: no console errors ' + errors.join('|'));
  await browser.close();
}

/* ---- Unit check ---- */
{
  const { browser, page, errors } = await launch({ reduced: true });
  await page.click('[data-action="journey"][data-journey="mastery"]');
  await page.click('[data-action=unitCheck] >> nth=0');
  await page.click('[data-action=startAssessment]');
  check(!!(await page.$('#lp')), 'check: starts');
  for (let i = 0; i < 10; i++) {
    const q = await page.textContent('.lp-question');
    const ans = await page.evaluate((e) => window.__solve(e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')), q);
    await page.fill('#lp-answer', String(ans)); await page.keyboard.press('Enter');
    await page.click('[data-lp=checkNext]');
  }
  const txt = await page.textContent('.lp-coach');
  check(/100%/.test(txt), 'check: ten correct answers score 100% (' + txt.replace(/\s+/g, ' ').slice(0, 80) + ')');
  check(errors.length === 0, 'check: no console errors ' + errors.join('|'));
  await browser.close();
}

/* ---- Gym ---- */
{
  const { browser, page, errors } = await launch();
  await page.evaluate(() => document.querySelector('[data-action=nav][data-view=gym]').click());
  await page.click('[data-action=startGym]');
  await page.waitForSelector('#gym-answer', { timeout: 15000 });
  await page.fill('#gym-answer', '9999'); await page.keyboard.press('Enter');
  check(!!(await page.waitForSelector('[data-action=nextGym]', { timeout: 3000 }).catch(() => null)), 'gym: wrong answer gives feedback with a next button');
  await page.click('[data-action=finishGym]');
  check(/\d+%/.test(await page.textContent('#gym-stage')), 'gym: report shows accuracy');
  check(errors.length === 0, 'gym: no console errors ' + errors.join('|'));
  await browser.close();
}

/* ---- Languages ---- */
for (const lang of ['bn', 'es', 'hi', 'ar', 'zh']) {
  const { browser, page, errors } = await launch({ lang, reduced: true });
  await page.evaluate(() => window.__openLesson('normal-five'));
  const dir = await page.evaluate(() => document.documentElement.dir);
  const all = new Set();
  for (let i = 0; i < 60; i++) {
    const t = await page.evaluate(() => document.querySelector('#lp')?.innerText || '');
    all.add(t);
    if (!(await page.$('#lp'))) break;
    const sk = await page.$('[data-lp=skipTask]'); if (sk) { await sk.click(); await page.waitForTimeout(400); continue; }
    const nx = (await page.$('[data-lp=next]')) || (await page.$('[data-primary]'));
    if (!nx || (await stage(page)) === 'Practice') break;
    await nx.click(); await page.waitForTimeout(30);
  }
  const joined = [...all].join('\n');
  check(!badText(joined), `lang ${lang}: no placeholder leaks in lesson text`);
  check(lang !== 'ar' || dir === 'rtl', `lang ${lang}: direction is ${dir}`);
  check(errors.length === 0, `lang ${lang}: no console errors ${errors.join('|')}`);
  await browser.close();
}

/* ---- Child-first lesson: real taps, no shortcuts ---- */
{
  const { browser, page, errors } = await launch({ reduced: true });
  await page.evaluate(() => window.__openLesson('normal-beads'));
  const bead = (idx, kind = 'low') => page.click(`#lp .sb-bead[data-kind=${kind}][data-idx="${idx}"]`);
  const next = async () => { await page.click('[data-lp=scriptNext]'); await page.waitForTimeout(40); };
  await next();
  await bead(0); await next();
  await next();
  await bead(2);
  check(!!(await page.$('[data-lp=scriptNext]')), 'child lesson: reaching 3 beads succeeds');
  await next();
  await page.click('.lp-choice[data-v="2"]');
  check(!!(await page.$('.lp-choice.wrong')) && !(await page.$('[data-lp=scriptNext]')), 'child lesson: wrong choice is gentle and stays on the question');
  await page.click('.lp-choice[data-v="3"]'); await next();
  await bead(0); await next();
  await bead(3); await next();
  await next();
  check((await stage(page)) === 'Practice', 'child lesson: continues into practice (' + (await stage(page)) + ')');
  check(errors.length === 0, 'child lesson: no console errors ' + errors.join('|'));
  await browser.close();
}

/* ---- Keyboard only ---- */
{
  const { browser, page, errors } = await launch({ reduced: true });
  await page.evaluate(() => window.__openLesson('place'));
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  check((await stage(page)).length > 0 && !!(await page.$('#lp')), 'keyboard: arrow keys advance scenes without errors');
  await page.keyboard.press('Escape');
  check(!(await page.$('#lp')), 'keyboard: Escape leaves the lesson');
  check(errors.length === 0, 'keyboard: no console errors ' + errors.join('|'));
  await browser.close();
}

/* ---- Dark mode ---- */
{
  const { browser, page } = await launch({ reduced: true });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; window.__openLesson('normal-ten'); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/tour/dark-lesson.png' });
  await browser.close();
}
console.log(failures ? `${failures} FAILED` : 'ALL FLOW CHECKS PASSED');
process.exit(failures ? 1 : 0);
