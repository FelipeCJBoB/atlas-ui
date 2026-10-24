#!/usr/bin/env node
// Verifica se a reescrita em sala limpa não copiou o original (rodar FORA da sala limpa, pelo revisor):
//   node reescrita/similaridade.mjs [slug…]   (originais: reescrita/origem.json; reescrita: vendor/atlas/componentes/<slug>/ + demos)
// Métricas sobre o código sem comentários/strings: maior trecho idêntico (em tokens) e % de 8-gramas em comum.
// Referência: < 15 tokens seguidos e < 10% de 8-gramas = expressão independente.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
const ROOT = resolve(import.meta.dirname, '..');
const origem = JSON.parse(readFileSync(join(ROOT, 'reescrita/origem.json'), 'utf8'));
const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)])) : []);
const toks = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ').replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, ' S ')
  .match(/[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[^\s\w]/g) || [];
const grams = (t, n = 8) => new Set(t.slice(0, Math.max(0, t.length - n + 1)).map((_, i) => t.slice(i, i + n).join(' ')));
function maiorTrecho(a, b) {   // maior sequência contígua comum (DP com 2 linhas) → { n, txt }
  let best = 0, fim = 0, prev = new Uint16Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) { const cur = new Uint16Array(b.length + 1); for (let j = 1; j <= b.length; j++) if (a[i - 1] === b[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > best) { best = cur[j]; fim = i; } } prev = cur; }
  return { n: best, txt: a.slice(fim - best, fim).join(' ') };
}
const pctGramas = (a, b) => { const ga = grams(a), gb = grams(b); let c = 0; for (const g of ga) if (gb.has(g)) c++; return ga.size ? (100 * c) / ga.size : 0; };
const lerOrig = (s) => toks(origem[s].arquivos.map((f) => (existsSync(join(ROOT, f)) ? readFileSync(join(ROOT, f), 'utf8') : '')).join('\n'));
const argSlugs = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const alvo = argSlugs.length ? argSlugs : Object.keys(origem);
const demos = walk(join(ROOT, 'vendor/atlas/demo'));
for (const slug of alvo) {
  const novos = walk(join(ROOT, 'vendor/atlas/componentes', slug)).filter((f) => /\.(tsx?|jsx?|css)$/.test(f));
  if (!novos.length) { console.log(`${slug.padEnd(16)} (ainda não escrito)`); continue; }
  const comp = novos.map((f) => readFileSync(f, 'utf8')).join('\n');
  const demo = demos.filter((f) => readFileSync(f, 'utf8').includes(`componentes/${slug}/`)).map((f) => readFileSync(f, 'utf8')).join('\n');
  const a = toks(comp + '\n' + demo), b = lerOrig(slug);
  const pct = pctGramas(a, b), run = maiorTrecho(a, b);
  // controle: o mesmo código novo contra os originais de OUTROS componentes (mede o "React genérico" que coincide por acaso)
  const ctl = Object.keys(origem).filter((k) => k !== slug).map((k) => ({ run: maiorTrecho(a, lerOrig(k)).n, pct: pctGramas(a, lerOrig(k)) }));
  const cRun = Math.max(...ctl.map((c) => c.run)), cPct = Math.max(...ctl.map((c) => c.pct));
  const ok = run.n <= Math.max(20, cRun + 10) && pct <= Math.max(10, cPct + 5);
  console.log(`${slug.padEnd(16)} trecho igual: ${String(run.n).padStart(3)} tokens (controle ${cRun}) · 8-gramas: ${pct.toFixed(1).padStart(5)}% (controle ${cPct.toFixed(1)}%) · ${ok ? 'OK (independente)' : 'REVISAR'}`);
  if (process.argv.includes('--detalhe') || !ok) console.log(`    trecho: ${run.txt.slice(0, 300)}`);
}
