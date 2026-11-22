// File: lib.mjs
// Directory: tests/
// Shared Playwright helpers for driving the app like a learner (open a lesson, work through every
// stage with correct answers, read the board). Used by the sweep and the focused tests.
import { createRequire } from 'node:module';
// Playwright + Chromium are provided globally in this environment (resolved via NODE_PATH).
const { chromium } = createRequire(import.meta.url)('playwright');

export const BASE = process.env.BASE || 'http://localhost:5173/';

export async function launch({ width = 1280, height = 800, lang, reduced = false } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript((l) => {
    try {
      localStorage.setItem('academy-language', l || 'en');
      localStorage.setItem('academy-studio', JSON.stringify({ setupSeen: true, fingerSeen: true, version: 5 }));
    } catch {}
  }, lang);
  await page.goto(BASE);
  await page.waitForSelector('#app .sidebar, #app .nav-item', { timeout: 10000 });
  // the first-run dialog may still appear depending on stored pref names
  const skip = await page.$('[data-action="skipSetup"]');
  if (skip) await skip.click();
  return { browser, page, errors };
}

export const stage = (page) => page.evaluate(() => document.querySelector('.lp-title small')?.textContent || '');

/** Type a number onto the board using the keyboard (also exercises keyboard accessibility). */
export async function buildNumber(page, value) {
  const rods = await page.evaluate(() => document.querySelectorAll('#lp .sb-rod').length);
  const scale = await page.evaluate(() => document.querySelectorAll('#lp .sb-label').length && [...document.querySelectorAll('#lp .sb-label')].filter((n) => n.textContent.startsWith('0.')).length);
  let [i, f = ''] = String(value).split('.');
  f = f.padEnd(scale, '0');
  const digits = (i + f).padStart(rods, '0').split('');
  await page.focus('#lp svg.soroban');
  for (let c = 0; c < rods; c++) {
    await page.keyboard.press(digits[c]);
    if (c < rods - 1) await page.keyboard.press('ArrowRight');
  }
}

// Independent check: plain arithmetic is evaluated by JavaScript and compared with the app's own engine.
export const jsEval = (t) => {
  const s = t.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**').replace(/sqrt/g, 'Math.sqrt');
  try {
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict";return (${s})`)();
    return typeof v === 'number' && Number.isFinite(v) ? +v.toFixed(6) : null;
  } catch { return null; }
};

/** Play through the whole lesson. mode: 'good' answers right. Returns a log. */
export async function playLesson(page, { maxSteps = 400, timeoutMs = 45000 } = {}) {
  const log = [];
  const t0 = Date.now();
  for (let i = 0; i < maxSteps; i++) {
    if (Date.now() - t0 > timeoutMs) { log.push('TIMEOUT'); break; }
    const st = await stage(page);
    if (!(await page.$('#lp'))) { log.push('closed'); break; }
    if (st === 'Done') { log.push('done'); break; }
    if (st === 'Practice') { await practiceRound(page, log); continue; }
    if (/Try$/.test(st)) {
      const skip = await page.$('[data-lp=skipTask]');
      if (skip) { await skip.click(); await page.waitForTimeout(450); continue; }
      const nx = await page.$('[data-primary]'); if (nx) { await nx.click(); continue; }
      await page.waitForTimeout(200); continue;
    }
    if ((await page.$('.lp-choices')) && !(await page.$('[data-lp=scriptNext]'))) {
      for (const c of await page.$$('.lp-choice')) { if (await page.$('[data-lp=scriptNext]')) break; await c.click().catch(() => {}); }
      continue;
    }
    const show = await page.$('[data-lp=scriptShow]');
    if (show) { await show.click(); continue; }
    const nx = (await page.$('[data-lp=next]')) || (await page.$('[data-lp=scriptNext]')) || (await page.$('[data-primary]'));
    if (!nx) { await page.waitForTimeout(150); continue; }
    await nx.click();
    await page.waitForTimeout(25);
  }
  return log;
}

async function practiceRound(page, log) {
  const q = await page.evaluate(() => document.querySelector('.lp-question')?.textContent || '');
  if (!q) { const n = await page.$('[data-lp=qnext]'); if (n) await n.click(); await page.waitForTimeout(100); return; }
  log.push('Q ' + q);
  if (/^Show /.test(q)) { await buildNumber(page, q.replace(/^Show\s+/, '').replace(/\s+on the abacus$/, '')); await page.waitForTimeout(300); }
  else {
    let expected;
    if (/^What number/.test(q)) expected = await page.evaluate(() => window.__solve(document.querySelector('.lp-question').dataset.read || '0'));
    else {
      const app = await page.evaluate((e) => window.__solve(e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')), q);
      const js = jsEval(q);
      if (js !== null && !/[a-z=]/i.test(q) && !String(app).includes('/') && Math.abs(js - parseFloat(app)) > 1e-6 && !/remainder|r/i.test(String(app))) log.push(`ENGINE MISMATCH ${q}: js=${js} app=${app}`);
      expected = String(app);
    }
    await page.fill('#lp-answer', expected);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  const n = await page.waitForSelector('[data-lp=qnext]', { timeout: 3000 }).catch(() => null);
  if (n) await n.click();
}
