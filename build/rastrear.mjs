#!/usr/bin/env node
// Lista os arquivos de vendor/ que o build full realmente usa (lidos pelo Node + entradas do esbuild):
//   node build/rastrear.mjs  → out/vendor-usado.json  (entrada de scripts/podar-vendor.mjs)
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { join, resolve, sep } from 'node:path';
const require = createRequire(import.meta.url), fs = require('node:fs');
const ROOT = resolve(import.meta.dirname, '..'), V = join(ROOT, 'vendor') + sep;
const lidos = new Set(), orig = fs.readFileSync;
fs.readFileSync = function (p, ...r) { const s = typeof p === 'string' ? resolve(p) : ''; if (s.startsWith(V)) lidos.add(s.slice(V.length).split(sep).join('/')); return orig.call(this, p, ...r); };
syncBuiltinESMExports();
const OUT = join(ROOT, 'out/vendor-usado'); process.env.ATLAS_TRACE = OUT;
process.argv.push('--profile=full');
await import('./build.mjs');
const eb = JSON.parse(orig(OUT + '.esbuild.json', 'utf8')).map((p) => resolve(ROOT, p.replace(/^[^:]+:/, ''))).filter((p) => p.startsWith(V)).map((p) => p.slice(V.length).split(sep).join('/'));
fs.writeFileSync(OUT + '.json', JSON.stringify({ lidos: [...lidos].sort(), esbuild: [...new Set(eb)].sort() }));
console.log(`rastreio: ${lidos.size} lidos pelo Node, ${new Set(eb).size} entradas do esbuild → out/vendor-usado.json`);
