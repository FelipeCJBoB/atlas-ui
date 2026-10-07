// Lista pacotes npm importados por vendor/<id> (para montar package.json)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const id = process.argv[2];
const walk = (d, o = []) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, o) : /\.(tsx?|jsx?)$/.test(f) && o.push(p); } return o; };
const pk = {};
for (const f of walk(join('vendor', id))) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/(?:from|import)\s*\(?\s*["']([^"'.@][^"']*|@[^"'/]+\/[^"']+)["']/g)) {
    let n = m[1]; if (n.startsWith('@') ) { if (/^@\/|^@app\//.test(n)) continue; n = n.split('/').slice(0, 2).join('/'); } else n = n.split('/')[0];
    (pk[n] ||= new Set()).add(f.split('/').slice(2, 4).join('/'));
  }
}
for (const [n, s] of Object.entries(pk).sort()) console.log(n.padEnd(34), s.size);
