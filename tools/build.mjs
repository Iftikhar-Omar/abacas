// File: build.mjs
// Directory: tools/
// Bundles src/ + css/ + three.js into one self-contained dist/abacus-academy.html
// (opens by double-click, no server needed).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });

const js = await build({
  entryPoints: [path.join(root, 'src/app.js')],
  bundle: true, write: false, format: 'iife', minify: process.argv.includes('--min'),
  legalComments: 'none', logLevel: 'warning', target: 'es2022',
});
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// stylesheets are inlined in the order index.html links them; url(../fonts/x) becomes a data: URI
const cssFiles = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)">/g)].map((m) => m[1]);
const css = cssFiles.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n')
  .replace(/url\(["']?\.\.\/(fonts\/[^)"']+)["']?\)/g, (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, f)).toString('base64')})`);

html = html
  .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
  .replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, '')
  .replace('</head>', `<style>\n${css}\n</style>\n</head>`)
  .replace(/<script type="module" src="src\/app\.js"><\/script>/,
    () => `<script>\n${js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}\n</script>`);
fs.writeFileSync(path.join(dist, 'abacus-academy.html'), html);
console.log('dist/abacus-academy.html', (fs.statSync(path.join(dist, 'abacus-academy.html')).size / 1024) | 0, 'KB');
