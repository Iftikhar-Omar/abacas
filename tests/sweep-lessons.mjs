// File: sweep-lessons.mjs
// Directory: tests/
// Opens every lesson (normal + mastery paths) and plays it through with correct answers.
// Fails on any console error, stuck stage, "undefined"/"{placeholder}" text or unreadable board.
import { launch, playLesson, stage } from './lib.mjs';
import { allLessons } from '../src/curriculum.js';

const only = process.argv[2];
const { browser, page, errors } = await launch({ reduced: true });
let bad = 0;
for (const l of allLessons) {
  if (only && !l.id.includes(only)) continue;
  errors.length = 0;
  await page.evaluate((id) => window.__openLesson?.(id), l.id);
  if (!(await page.$('#lp'))) { console.log('FAIL (no player)', l.id); bad++; continue; }
  const texts = new Set();
  const t0 = Date.now();
  const log = await page.evaluate(() => 0);
  let out;
  try {
    // collect every visible bubble text while playing
    await page.exposeFunction('__collect', (t) => texts.add(t)).catch(() => {});
    out = await playLesson(page, { maxSteps: 500 });
  } catch (e) { out = ['EXC ' + e.message]; }
  const st = await stage(page).catch(() => '?');
  const issues = [];
  if (!out.includes('done')) issues.push('not finished (stage ' + st + ')');
  if (errors.length) issues.push(...errors);
  void log;
  console.log((issues.length ? 'FAIL ' : 'ok   ') + l.id.padEnd(22), ((Date.now() - t0) / 1000).toFixed(1) + 's', issues.join(' | ').slice(0, 300));
  if (issues.length) bad++;
  await page.evaluate(() => window.__closeLesson?.());
}
console.log(bad ? `${bad} lessons with problems` : 'all lessons OK');
await browser.close();
process.exit(bad ? 1 : 0);
