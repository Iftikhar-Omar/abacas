// File: run.mjs
// Directory: tests/
// Runs the whole automated suite: lint, build, every lesson, and the focused flows.
// Needs the dev server (npm run dev) running on http://localhost:5173/ (or set BASE).
import { spawnSync } from 'node:child_process';

const steps = [
  ['lint', 'npx', ['eslint', 'src', 'tests', 'tools']],
  ['build', 'node', ['tools/build.mjs']],
  ['lessons', 'node', ['tests/sweep-lessons.mjs']],
  ['flows', 'node', ['tests/flows.mjs']],
];
let failed = 0;
for (const [name, cmd, args] of steps) {
  console.log(`\n=== ${name} ===`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) { failed++; console.log(`>>> ${name} FAILED`); }
}
console.log(failed ? `\n${failed} step(s) failed` : '\nEverything passed');
process.exit(failed ? 1 : 0);
