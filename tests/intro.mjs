// File: intro.mjs
// Directory: tests/
// Tests the "What is an abacus?" introduction and the home "Current lesson" / "Continue" labels:
// every slide in every language (no raw keys or {placeholders}), nothing wider than the screen (RTL included),
// the lesson counts as learned afterwards, and the home page then says "Continue" with lesson 2 as current.
import { launch } from './lib.mjs';

let bad = 0;
const check = (ok, msg) => { if (!ok) { bad++; console.log('FAIL', msg); } };

for (const lang of ['en', 'bn', 'es', 'hi', 'ar', 'zh']) {
  for (const vp of [{ width: 1280, height: 800 }, { width: 380, height: 760 }]) {
    const { browser, page, errors } = await launch({ ...vp, lang, reduced: true });
    const home = await page.evaluate(() => document.querySelector('.hero')?.innerText || '');
    check(/17/.test(home), `${lang}: home shows 17 lessons`);
    check(!!(await page.$('.hero-chip.first')), `${lang}: first visit labelled "Start here"`);
    await page.evaluate(() => window.__openLesson('normal-intro'));
    await page.waitForSelector('#lp .lp-bubble');
    const total = Number(await page.$eval('#lp .lp-step', (n) => n.textContent.split('/')[1]));
    check(total >= 16, `${lang}: intro has ${total} slides`);
    for (let i = 1; i <= total; i++) {
      const info = await page.evaluate(() => ({
        text: document.querySelector('#lp .lp-bubble')?.innerText || '',
        step: document.querySelector('#lp .lp-step')?.textContent,
        art: document.querySelector('#lp .lp-art') && !document.querySelector('#lp .lp-art').hidden ? document.querySelector('#lp .lp-art').innerText : '',
        wide: document.documentElement.scrollWidth > innerWidth + 1 || document.querySelector('#lp .lp-coach').scrollWidth > document.querySelector('#lp .lp-coach').clientWidth + 1 || [...document.querySelectorAll('#lp .lp-bubble *, #lp .lp-art *, #lp .lp-stage')].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }),
      }));
      const all = info.text + info.art;
      check(info.step === `${i}/${total}`, `${lang} ${vp.width}: step ${i} label ${info.step}`);
      check(!/\{\w+\}|undefined|\bin_[a-z0-9_]+\b/.test(all), `${lang} ${vp.width}: slide ${i} leaks a raw key/placeholder: ${all.slice(0, 80)}`);
      check(!info.wide, `${lang} ${vp.width}: slide ${i} overflows horizontally`);
      if (i < total) await page.click('#lp [data-lp="next"]');
    }
    await page.click('#lp [data-lp="next"]');
    await page.waitForSelector('#lp .lp-sticker');
    check(!(await page.$('#lp [data-lp="again"]')), `${lang}: intro done page has no "practice more"`);
    await page.click('#lp [data-lp="exit"]');
    await page.waitForSelector('.hero');
    const after = await page.evaluate(() => ({ chip: document.querySelector('.hero-chip')?.textContent, where: document.querySelector('.hero-where')?.textContent, cta: document.querySelector('.hero-cta')?.textContent.trim(), done: document.querySelectorAll('.path-strip .node.done').length, cur: document.querySelector('.path-strip .node.current')?.textContent.trim() }));
    check(after.done === 1 && after.cur === '2', `${lang}: path shows lesson 1 done, 2 current (${JSON.stringify(after)})`);
    check(after.chip && !after.cta.includes('Start') || lang !== 'en', `${lang}: CTA changed after progress`);
    if (lang === 'en') check(after.chip === 'Current lesson' && after.cta === 'Continue' && after.where === 'Lesson 2 of 17', `en: hero labels ${JSON.stringify(after)}`);
    check(errors.length === 0, `${lang}: console errors ${errors.join('|')}`);
    await browser.close();
  }
}
console.log(bad ? `${bad} intro problems` : 'INTRO OK');
process.exit(bad ? 1 : 0);
