// Adapter genérico "demos": cada arquivo de demo/example/componente numa pasta vira uma entrada do catálogo.
// Configuração em sources.lock.json → <id>.adapter = { kind:'demos', demos:[{dir, category:'keywords'|'subdir'|'<texto>', strip?}], related:[pastas], exclude?:regex, include?:regex }
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { ROOT, lock, vendorDir, walk, title } from '../build/common.mjs';
import { applyOverride, categorize } from './util.mjs';

const EXTS = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
const tryFile = (base) => EXTS.map((e) => base + e).find((p) => existsSync(p)) || (existsSync(base) && /\.(tsx?|jsx?)$/.test(base) ? base : null);

function resolveImport(id, fromFile, spec) {
  const vd = vendorDir(id);
  if (spec.startsWith('.')) return tryFile(join(dirname(fromFile), spec));
  for (const [from, to] of [...(lock[id].aliases || [['@/', '']])].sort((a, b) => b[0].length - a[0].length))
    if (spec.startsWith(from)) { const r = tryFile(join(vd, to, spec.slice(from.length))); if (r) return r; }
  return null;
}

export function generate(id) {
  const vd = vendorDir(id), cfg = lock[id].adapter;
  const ex = cfg.exclude ? new RegExp(cfg.exclude) : null, inc = cfg.include ? new RegExp(cfg.include) : null;
  // categoryFrom: "content/docs" → subpastas = categorias; cada <slug>.mdx associa o componente <slug> à categoria
  const catMap = new Map();
  if (cfg.categoryFrom && existsSync(join(vd, cfg.categoryFrom))) for (const f of walk(join(vd, cfg.categoryFrom)).filter((f) => f.endsWith('.mdx'))) {
    const parts = relative(join(vd, cfg.categoryFrom), f).split(/[\\/]/); if (parts.length === 2) catMap.set(parts[1].replace(/\.mdx$/, ''), title(parts[0]));
  }
  const meta = [], mods = [];
  for (const d of cfg.demos) {
    const base = join(vd, d.dir);
    for (const f of walk(base).filter((f) => /\.(tsx|jsx)$/.test(f) && !/\.(stories|test|spec)\./.test(f) && (d.allowIndex || !/(^|\/)index\.[tj]sx?$/.test(f)))) {
      const relInDir = relative(base, f).replace(/\\/g, '/');
      const relV = relative(vd, f).replace(/\\/g, '/');
      if (ex?.test(relV) || (inc && !inc.test(relV))) continue;
      const eid = (d.prefix || '') + relInDir.replace(/\.(tsx|jsx)$/, '').replace(/\/index$/, '');
      const leaf = eid.split('/').pop();
      const segs = relInDir.split('/');
      let category = d.category === 'subdir' && d.depth === 2 ? (segs.length > 2 ? `${title(segs[0])} · ${title(segs[1])}` : title(segs[0])) : d.category === 'subdir' ? title(relInDir.split('/')[0] === leaf + '.tsx' ? 'geral' : relInDir.split('/')[0]) : d.category === 'keywords' || !d.category ? categorize(eid) : d.category;
      if (d.category === 'subdir' && !relInDir.includes('/')) category = 'Geral';
      if (catMap.has(leaf)) category = catMap.get(leaf);
      const name = title(leaf.replace(d.strip ? new RegExp(d.strip, 'i') : /(-demo\d*|-example)$/i, '')) || title(leaf);
      // arquivos relacionados (1 nível): imports locais dentro das pastas "related"
      const src = [relV];
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
        const r = resolveImport(id, f, m[1]); if (!r) continue;
        const rv = relative(vd, r).replace(/\\/g, '/');
        if (rv !== relV && !src.includes(rv) && (cfg.related || []).some((p) => rv.startsWith(p)) && src.length < 7) src.push(rv);
      }
      const e = { uid: `${id}:${eid}`, lib: id, id: eid, category, name, desc: '', layout: d.layout || 'centered', kind: 'demo', wide: !!d.wide || /bento|hero|dock|marquee|carousel|globe|background|pattern|section|block|navbar|footer/i.test(eid), files: src, deps: [], flags: [] };
      meta.push(applyOverride(e)); mods.push(relV.replace(/\.(tsx|jsx)$/, ''));
    }
  }
  const lines = [], items = [];
  meta.forEach((m, i) => { if (m.exclude) return; lines.push(`import * as s${i} from '../../vendor/${id}/${mods[i]}';`); items.push(`  { ...M[${i}], mod: s${i} as any },`); });
  mkdirSync(join(ROOT, 'src/gen'), { recursive: true });
  writeFileSync(join(ROOT, `src/gen/${id}.gen.tsx`), `// @ts-nocheck — gerado por adapters/demos.mjs\nimport M from './${id}.meta.json';\n${lines.join('\n')}\nexport const RAW = [\n${items.join('\n')}\n];\n`);
  writeFileSync(join(ROOT, `src/gen/${id}.meta.json`), JSON.stringify(meta));
  return meta.filter((m) => !m.exclude).length;
}
