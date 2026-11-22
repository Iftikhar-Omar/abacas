// File: prune-imports.mjs
// Directory: tools/
// Removes unused named imports reported by ESLint (run after refactors: node tools/prune-imports.mjs).
import { execSync } from 'node:child_process';
import fs from 'node:fs';

let out;
try { out = execSync('npx eslint src -f json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
catch (e) { out = e.stdout; }
for (const f of JSON.parse(out)) {
  const unused = f.messages.filter((m) => m.ruleId === 'no-unused-vars').map((m) => /'(.+?)'/.exec(m.message)[1]);
  if (!unused.length) continue;
  let src = fs.readFileSync(f.filePath, 'utf8');
  src = src.replace(/^import \{([^}]+)\} from ('[^']+');\n/gm, (all, names, from) => {
    const keep = names.split(',').map((n) => n.trim()).filter((n) => n && !unused.includes(n.split(' as ').pop().trim()));
    return keep.length ? `import { ${keep.join(', ')} } from ${from};\n` : '';
  });
  fs.writeFileSync(f.filePath, src);
}
