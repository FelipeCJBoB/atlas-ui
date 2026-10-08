// Um compile Tailwind por biblioteca (sem preflight) + escopo PostCSS (.lib-<id>) + renomeio de keyframes conflitantes.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import postcss from 'postcss';
import { ROOT, TMP, lock, vendorDir, walk, applyPatches } from './common.mjs';

// url(...) relativo (fontes/imagens) no CSS da lib → data URL (offline). Resolve relativo ao arquivo; se faltar, tenta vendor/<id>/public/<resto>
function inlineUrls(css, baseDir, id) {
  const MIME = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' };
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (m, _q, u) => {
    if (/^(data:|https?:|#|var\()/.test(u)) return m;
    const clean = u.split(/[?#]/)[0]; const ext = clean.split('.').pop().toLowerCase(); if (!MIME[ext]) return m;
    const cands = [join(baseDir, clean)]; const k = clean.indexOf('public/'); if (k >= 0) cands.push(join(vendorDir(id), clean.slice(k)));
    const f = cands.find((c) => existsSync(c)); if (!f) { console.log(`  ! url não resolvida em ${id}: ${u}`); return m; }
    return `url(data:${MIME[ext]};base64,${readFileSync(f).toString('base64')})`;
  });
}
const rel = (from, to) => { const r = relative(dirname(from), to).replace(/\\/g, '/'); return r.startsWith('.') ? r : './' + r; };

function prepare(id) {
  const vd = vendorDir(id), s = lock[id];
  const dir = join(TMP, id); mkdirSync(dir, { recursive: true });
  const main = join(dir, 'main.css');
  const gRel = s.globals || 'styles/globals.css';
  const globalsPath = gRel.startsWith('@atlas/') ? join(ROOT, gRel.slice(7)) : join(vd, gRel);
  let g = applyPatches(id, gRel, readFileSync(globalsPath, 'utf8'));
  // preflight é global (uma vez, no shell): aqui só tema + utilitários
  g = inlineUrls(g, dirname(globalsPath), id);
  g = g.replace(/@import\s+["']tailwindcss["'];?/, '@layer theme, base, components, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities) source(none);');
  const already = new Set();
  g = g.replace(/@import\s+["'](\.[^"']+)["']([^;\n]*);?/g, (_m, p, tail) => {
    const abs = join(dirname(globalsPath), p); already.add(abs);
    return `@import "${rel(main, abs)}"${tail};`;
  });
  // CSS dos componentes (precisam do mesmo compile por causa de @apply)
  const extra = [];
  for (const f of walk(vd).filter((f) => f.endsWith('.css') && f !== globalsPath && !already.has(f))) {
    const t = inlineUrls(readFileSync(f, 'utf8').replace(/^@reference\s+["'][^"']+["'];?\s*$/gm, ''), dirname(f), id);
    const out = join(dir, 'css', relative(vd, f)); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, t);
    extra.push(`@import "${rel(main, out)}";`);
  }
  // os já importados pelo globals também podem ter @reference
  const sources = (s.cssSources || ['.']).map((p) => `@source "${rel(main, join(vd, p))}";`);
  writeFileSync(main, `${g}\n${extra.join('\n')}\n${sources.join('\n')}\n`);
  return main;
}

const norm = (b) => b.replace(/\s+/g, '').replace(/;}/g, '}');

function scopeCss(css, id, renames) {
  const L = `.lib-${id}`;
  const root = postcss.parse(css);
  const kfNames = new Set(); const kfBodies = {};
  root.walkAtRules(/keyframes$/, (r) => { kfNames.add(r.params); kfBodies[r.params] = norm(r.nodes.map((n) => n.toString()).join('')); });
  root.walkRules((rule) => {
    const p = rule.parent;
    if (p.type === 'rule') return;                       // aninhado: herda do pai
    if (p.type === 'atrule' && /keyframes$/.test(p.name)) return;
    const out = [];
    for (let sel of rule.selectors) {
      sel = sel.trim();
      if (/^html(?![\w-])/.test(sel) && !/^html\s/.test(sel)) { continue; }   // regras de <html> não se aplicam ao palco
      if (/^html\s/.test(sel)) { sel = sel.replace(/^html\s+/, ''); }
      let m;
      if ((m = sel.match(/^(:root|:host|body)(?![\w-])(.*)$/))) out.push(L + m[2]);
      else if ((m = sel.match(/^\.dark(?![\w\\-])(.*)$/))) out.push(`${L}.dark${m[1]}`, `${L} .dark${m[1]}`);
      else if (sel === '*' || sel.startsWith('*,')) out.push(`:where(${L}) ${sel}`);
      else out.push(`:where(${L}) ${sel}`);
    }
    if (!out.length) rule.remove(); else rule.selectors = out;
  });
  // renomeia keyframes (somente os que conflitam)
  if (renames.size) {
    root.walkAtRules(/keyframes$/, (r) => { if (renames.has(r.params)) r.params = renames.get(r.params); });
    root.walkDecls((d) => {
      if (!/^(animation|animation-name|--animate-.*|--tw-animation.*)$/.test(d.prop)) return;
      let v = d.value;
      for (const [from, to] of renames) v = v.replace(new RegExp(`(^|[\\s,(])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s,;)]|$)`, 'g'), `$1${to}`);
      d.value = v;
    });
  }
  return { css: root.toString(), kfBodies };
}

export async function compileAll(ids) {
  const raw = {};
  for (const id of ids) {
    const main = prepare(id);
    const out = join(TMP, id, 'out.css');
    execSync(`node ${JSON.stringify(join(ROOT, 'node_modules/@tailwindcss/cli/dist/index.mjs'))} -i ${JSON.stringify(main)} -o ${JSON.stringify(out)} --minify`, { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
    raw[id] = readFileSync(out, 'utf8');
  }
  // 1ª passada: detectar keyframes conflitantes entre libs
  const defs = {};
  for (const id of ids) {
    const { kfBodies } = scopeCss(raw[id], id, new Map());
    for (const [n, b] of Object.entries(kfBodies)) (defs[n] ||= []).push({ id, b });
  }
  const conflicts = {};
  for (const [n, arr] of Object.entries(defs)) if (new Set(arr.map((x) => x.b)).size > 1) conflicts[n] = arr.map((x) => x.id);
  const result = {};
  for (const id of ids) {
    const renames = new Map(Object.entries(conflicts).filter(([, libs]) => libs.includes(id)).map(([n]) => [n, `${id}-${n}`]));
    result[id] = scopeCss(raw[id], id, renames).css;
  }
  return { css: result, conflicts };
}
