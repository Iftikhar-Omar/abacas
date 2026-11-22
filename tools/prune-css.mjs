// File: prune-css.mjs
// Directory: tools/
// Removes CSS selectors that reference class names / ids that no longer exist anywhere in src/ or index.html.
// Used once after replacing the 3D model + old lesson panels (the old stylesheets were layered patches).
// Usage: node tools/prune-css.mjs css/base.css css/overrides.css
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sources = [...fs.readdirSync(path.join(root, 'src')).map((f) => path.join(root, 'src', f)), path.join(root, 'index.html')];
const text = sources.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const used = new Set(text.match(/[A-Za-z_][\w-]*/g));
const dynamicPrefixes = [...text.matchAll(/["'`]([a-z]+-)\$\{/g)].map((m) => m[1]); // e.g. "idea-${id}"

const alive = (name) => used.has(name) || dynamicPrefixes.some((p) => name.startsWith(p));
const selectorAlive = (sel) => [...sel.matchAll(/[.#]([A-Za-z_][\w-]*)/g)].every((m) => alive(m[1]));

let removed = 0;
for (const file of process.argv.slice(2)) {
  const css = fs.readFileSync(file, 'utf8');
  const header = css.match(/^\/\*[\s\S]*?\*\/\n?/)?.[0] || '';
  const ast = postcss.parse(css);
  ast.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    const keep = rule.selectors.filter(selectorAlive);
    if (keep.length === rule.selectors.length) return;
    removed += rule.selectors.length - keep.length;
    if (keep.length) rule.selectors = keep; else rule.remove();
  });
  ast.walkAtRules((a) => { if (a.nodes && !a.nodes.length && a.name !== 'font-face') a.remove(); });
  fs.writeFileSync(file, ast.toString());
  void header;
}
console.log('removed selectors:', removed);
