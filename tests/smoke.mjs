// File: smoke.mjs
// Directory: tests/
// Plays the first lesson end to end and reports any console / page errors.
import { launch, playLesson } from './lib.mjs';
const { browser, page, errors } = await launch();
await page.click('[data-action="openLesson"].primary');
const log = await playLesson(page);
console.log(log.join('\n'));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close();
