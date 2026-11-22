// File: tour.mjs
// Directory: tests/
// Takes a screenshot of every page / dialog / flow at desktop and phone size into a folder (default /tmp/tour).
// Usage: node tests/tour.mjs [outDir]
import fs from 'node:fs';
import { launch } from './lib.mjs';

const out = process.argv[2] || '/tmp/tour';
fs.mkdirSync(out, { recursive: true });
for (const [name, width, height] of [['d', 1280, 800], ['m', 390, 800]]) {
  const { browser, page, errors } = await launch({ width, height });
  const shot = async (n) => { await page.waitForTimeout(450); await page.screenshot({ path: `${out}/${name}-${n}.png` }); };
  await shot('01-learn');
  await page.evaluate(() => window.scrollTo(0, 700)); await shot('02-learn-scrolled'); await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('[data-action="journey"][data-journey="mastery"]'); await shot('03-learn-mastery');
  await page.click('[data-action="journey"][data-journey="normal"]');
  for (const v of ['solver', 'gym', 'progress', 'account']) {
    await page.evaluate((x) => document.querySelector(`[data-action=nav][data-view=${x}]`)?.click(), v);
    await shot('10-' + v);
  }
  await page.evaluate(() => document.querySelector('[data-action=nav][data-view=solver]').click());
  await page.fill('#expression', '82-56'); await page.keyboard.press('Enter'); await page.waitForTimeout(1200); await shot('11-solution');
  await page.keyboard.press('Escape');
  await page.fill('#expression', '8+7'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) await page.click('[data-lp=next]'); await shot('12-solution-big-friend');
  await page.click('[data-lp=exit]');
  await page.evaluate(() => document.querySelector('[data-action=nav][data-view=gym]').click());
  await page.click('[data-action=startGym]'); await page.waitForTimeout(1500); await shot('13-gym-running');
  await page.waitForTimeout(6000); await shot('14-gym-answer');
  await page.evaluate(() => document.querySelector('[data-action=nav][data-view=learn]').click());
  await page.click('[data-action=settings]'); await shot('20-settings'); await page.keyboard.press('Escape');
  await page.click('[data-action=guide]'); await shot('21-guide'); await page.keyboard.press('Escape');
  await page.click('[data-action=unitCheck]').catch(() => {});
  if (await page.$('#studio-dialog')) await shot('22-unitcheck-dialog');
  console.log(name, errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
}
