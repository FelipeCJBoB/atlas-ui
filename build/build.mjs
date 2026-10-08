#!/usr/bin/env node
// Atlas 2 — build unificado:  node build/build.mjs [--profile=full|lite|compartilhavel] [--libs=a,b] [--out=out/atlas.html] [--offline]
//   full (=pessoal): tudo · lite: sem WebGL/3D e sem componentes que exigem rede · compartilhavel: só licenças permissivas
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ROOT, TMP, lock, vendorDir, patchUsed } from './common.mjs';
import { compileAll } from './css.mjs';
import { atlasPlugin, fontsUsed } from './plugins.mjs';
import { ensureImages } from './images.mjs';
import { classify } from './taxonomy.mjs';
import sharp from 'sharp';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] ?? d;
const profile = arg('profile', 'full');
const lockProfile = profile === 'compartilhavel' ? 'compartilhavel' : 'pessoal';   // full/lite usam as libs do perfil pessoal
const lite = profile === 'lite';
const only = arg('libs', '').split(',').filter(Boolean);
const OUT = join(ROOT, arg('out', `out/atlas-${profile}.html`));
const offline = process.argv.includes('--offline');
const t0 = Date.now();
mkdirSync(TMP, { recursive: true }); mkdirSync(join(ROOT, 'out'), { recursive: true });

// ── 0) bibliotecas deste perfil
let ids = Object.keys(lock).filter((id) => lock[id].profile.includes(lockProfile) && (!only.length || only.includes(id)) && existsSync(vendorDir(id)));
console.log(`perfil=${profile} libs=${ids.join(', ')}`);

// ── 1) adapters → src/gen
let total = 0;
const adapters = {};
for (const id of ids) { adapters[id] = await import(`../adapters/${lock[id].adapter?.kind === 'demos' ? 'demos' : id}.mjs`); const n = await adapters[id].generate(id); total += n; console.log(`  adapter ${id}: ${n} componentes`); }

// ── 1b) catálogo (metadados, vai no shell) + um ponto de entrada por biblioteca (só carregadores: import() preguiçoso)
const GL_RE = /from\s+['"](three|three-stdlib|ogl|postprocessing|cobe|vgpu|@react-three\/[^'"]+|@paper-design\/[^'"]+|@pixi\/[^'"]+|pixi\.js|@webgpu\/[^'"]+)['"]|\.(glb|hdr)['"]/;
const CATALOG_META = []; let dropped = 0;
// lite: sem GL/3D e sem componentes que precisam de rede/props/arquivos externos
const liteDrop = (id, e) => {
  if (id === 'threeui') return true;   // ThreeUI = shaders WebGL/Three (lite não tem WebGL/3D)
  if ((e.flags || []).some((f) => ['needs-network', 'needs-props', 'needs-files'].includes(f))) return true;
  for (const f of e.files || []) { const p = join(vendorDir(id), f); if (existsSync(p) && /\.(tsx?|jsx?)$/.test(p) && GL_RE.test(readFileSync(p, 'utf8'))) return true; }
  return false;
};
for (const id of ids) {
  const meta = JSON.parse(readFileSync(join(ROOT, `src/gen/${id}.meta.json`), 'utf8'));
  const isCustom = !!adapters[id].custom;
  const gen = isCustom ? '' : readFileSync(join(ROOT, `src/gen/${id}.gen.tsx`), 'utf8');
  const imp = {}; for (const m of gen.matchAll(/import \* as (s\d+) from '([^']+)';/g)) imp[m[1]] = m[2];
  const kept = [], loaders = [];
  for (const m of gen.matchAll(/\{ \.\.\.M\[(\d+)\], mod: (s\d+) as any \}/g)) {
    const e = meta[+m[1]];
    if (lite && liteDrop(id, e)) { dropped++; continue; }
    kept.push(e); loaders.push(`${JSON.stringify(e.uid)}:()=>import(${JSON.stringify(imp[m[2]])})`);
  }
  if (isCustom) for (const e of meta) { if (e.exclude) continue; if (lite && liteDrop(id, e)) { dropped++; continue; } kept.push(e); }
  for (const e of kept) Object.assign(e, classify(e), { stack: lock[id].stack || 'react' });   // taxonomia unificada (app/fn/tags) + stack (react|html)
  CATALOG_META.push(...kept);
  if (!isCustom) writeFileSync(join(ROOT, `src/gen/${id}.lib.tsx`), `// @ts-nocheck — gerado por build/build.mjs\n((window).__ATLAS_REG ||= {})[${JSON.stringify(id)}] = {\n${loaders.join(',\n')}\n};\n`);
  lock[id]._kept = new Set(kept.map((e) => e.uid));
}
writeFileSync(join(ROOT, 'src/gen/catalog.gen.json'), JSON.stringify(CATALOG_META));
writeFileSync(join(ROOT, `out/catalog.${profile}.json`), JSON.stringify(CATALOG_META));   // entrada do índice para o Claude Code (scripts/make-index.mjs)
ids = ids.filter((id) => lock[id]._kept.size > 0);   // lib sem nenhum componente neste perfil não entra no bundle
total = CATALOG_META.length;
if (lite) console.log(`  lite: ${dropped} componentes removidos (WebGL/3D/rede)`);

// ── 2) fontes (woff2 → base64)
const fontDefs = [
  ['Inter Variable', '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', '100 900'],
  ['Space Grotesk Variable', '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2', '300 700'],
  ['JetBrains Mono Variable', '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', '100 800'],
  ['Instrument Sans Variable', '@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2', '400 700'],
  ['Tourney', '@fontsource/tourney/files/tourney-latin-700-normal.woff2', '700'],
  ['Tourney', '@fontsource/tourney/files/tourney-latin-900-normal.woff2', '900'],
];
let fontCss = '';
for (const [fam, p, w] of fontDefs) { const f = join(ROOT, 'node_modules', p); if (existsSync(f)) fontCss += `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${readFileSync(f).toString('base64')}) format('woff2');}\n`; }
writeFileSync(join(TMP, 'fonts.gen.css'), fontCss);

// ── 3) CSS: shell (preflight global) + um bloco escopado por biblioteca
execSync(`node ${JSON.stringify(join(ROOT, 'node_modules/@tailwindcss/cli/dist/index.mjs'))} -i src/shell/shell.css -o ${JSON.stringify(join(TMP, 'shell.out.css'))} --minify`, { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
const shellCss = readFileSync(join(TMP, 'shell.out.css'), 'utf8');
const { css: libCss, conflicts } = await compileAll(ids);
if (Object.keys(conflicts).length) console.log('  keyframes renomeados (conflito):', Object.keys(conflicts).join(', '));

// ── 4) JS: shell (IIFE) + um IIFE por biblioteca (react compartilhado via window.__SH)
const urls = new Map();
const common = {
  bundle: true, minify: true, write: false, format: 'iife', target: 'es2022', jsx: 'automatic', charset: 'utf8', logLevel: 'warning', legalComments: 'none',
  alias: {
    'next/link': join(ROOT, 'stubs/next-link.tsx'), 'next/image': join(ROOT, 'stubs/next-image.tsx'),
    'next/navigation': join(ROOT, 'stubs/next-navigation.ts'), 'next/dynamic': join(ROOT, 'stubs/next-dynamic.tsx'), 'next-themes': join(ROOT, 'stubs/next-themes.tsx'),
  },
  define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_APP_URL': '"https://atlas.local"', 'process.env': '{}' },
  loader: { '.svg': 'dataurl', '.woff2': 'dataurl', '.md': 'text', '.glb': 'dataurl', '.hdr': 'dataurl' },
};
const sharedReact = {
  name: 'shared-react',
  setup(b) {
    b.onResolve({ filter: /^react(-dom)?(\/(jsx-runtime|jsx-dev-runtime|client))?$/ }, (a) => ({ path: a.path, namespace: 'shared-react' }));
    b.onLoad({ filter: /.*/, namespace: 'shared-react' }, (a) => ({ contents: a.path === 'react-dom' ? `module.exports = window.__SH_DOM(__ATLAS_LIB);` : `module.exports = window.__SH[${JSON.stringify(a.path)}];`, loader: 'js' }));
  },
};
const shellRes = await build({ ...common, entryPoints: [join(ROOT, 'src/shell/main.tsx')], plugins: [atlasPlugin({ urls, libIds: ids })] });
let shellJs = shellRes.outputFiles[0].text;
const libRes = await build({
  ...common, entryPoints: ids.map((id) => ({ in: join(ROOT, `src/gen/${id}.lib.tsx`), out: id })), outdir: join(TMP, 'libs'),
  plugins: [sharedReact, atlasPlugin({ urls, libIds: ids })],
});
const libJs = Object.fromEntries(libRes.outputFiles.map((f) => [f.path.split(/[\\/]/).pop().replace(/\.js$/, ''), f.text]));

// fontes pedidas via next/font/google → @fontsource (se instalado) embutido em base64
let extraFonts = '';
for (const nm of fontsUsed) {
  const fam = nm.replace(/_/g, ' '), slug = fam.toLowerCase().replace(/\s+/g, '-');
  const cands = [['@fontsource-variable', `${slug}/files/${slug}-latin-wght-normal.woff2`, '100 900'], ['@fontsource', `${slug}/files/${slug}-latin-400-normal.woff2`, '400'], ['@fontsource', `${slug}/files/${slug}-latin-700-normal.woff2`, '700']];
  let got = 0;
  for (const [pkg, f, w] of cands) { const p = join(ROOT, 'node_modules', pkg, f); if (existsSync(p) && !(got && w === '100 900')) { extraFonts += `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${readFileSync(p).toString('base64')}) format('woff2');}\n`; got++; } }
  if (!got) console.log(`  fonte ausente (instale @fontsource/${slug}): ${fam}`);
}
if (fontsUsed.size) console.log('  fontes next/font:', [...fontsUsed].join(', '));

// ── 5) imagens remotas → cache → tabela __I (esparsa, por biblioteca) + __RES (URLs aprendidas pelo QA)
const learnedPath = join(ROOT, 'cache/learned.json');
const learnedRaw = existsSync(learnedPath) ? JSON.parse(readFileSync(learnedPath, 'utf8')) : {};   // { lib: [urls] }
const learnedBy = Object.fromEntries(ids.map((id) => [id, [...new Set(learnedRaw[id] || [])]]));
const allUrls = new Map(urls); const localOf = new Map();   // '/x/y.png?q' aprendido → arquivo em vendor/<lib>/public
for (const id of ids) for (const u of learnedBy[id]) {
  if (u.startsWith('/')) { const rel = decodeURIComponent(u.split('?')[0]); const hit = ids.map((i) => join(vendorDir(i), 'public', rel)).find((f) => existsSync(f)); if (!hit) continue; localOf.set(u, 'local:' + hit); if (!allUrls.has('local:' + hit)) allUrls.set('local:' + hit, allUrls.size); }
  else if (!allUrls.has(u)) allUrls.set(u, allUrls.size);
}
const { cache: imgCache, ok, fail } = await ensureImages(allUrls, { offline });
// lite: reencoda imagens raster em 400px / qualidade menor (o resto do arquivo é código, que comprime bem)
if (lite) {
  const keys = Object.keys(imgCache).filter((k) => imgCache[k] && imgCache[k].mime !== 'image/svg+xml' && imgCache[k].b64.length > 24000);
  let i = 0, before = 0, after = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (i < keys.length) { const k = keys[i++]; const v = imgCache[k]; before += v.b64.length;
    try { const img = sharp(Buffer.from(v.b64, 'base64')); const out = v.mime === 'image/jpeg' ? await img.resize({ width: 400, withoutEnlargement: true }).jpeg({ quality: 55, mozjpeg: true }).toBuffer() : await img.resize({ width: 400, withoutEnlargement: true }).webp({ quality: 60 }).toBuffer();
      const b64 = out.toString('base64'); if (b64.length < v.b64.length) imgCache[k] = { mime: v.mime, b64 }; } catch {} after += imgCache[k].b64.length; } }));
  console.log(`  lite: imagens ${(before / 1048576).toFixed(1)} → ${(after / 1048576).toFixed(1)} MB`);
}
const list = [...urls.keys()];
const FALLBACK = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27272a"/><stop offset="1" stop-color="#52525b"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/></svg>').toString('base64');
const dataUrl = (u) => { const v = imgCache[u]; return v ? `data:${v.mime};base64,${v.b64}` : FALLBACK; };
const fixImgs = (js) => js.replace(/(?<=[{,]\s*)(["'`])@@IMG:(\d+)@@\1(?=\s*:)/g, (_m, _q, n) => `[__I[${n}]]`)   // chave de objeto
  .replace(/(["'`])@@IMG:(\d+)@@\1/g, (_m, _q, n) => `__I[${n}]`).replace(/@@IMG:(\d+)@@/g, (_m, n) => dataUrl(list[+n]))
  .replace(/@@IMGH:(\d+)@@/g, (_m, n) => dataUrl(list[+n]));   // IMGH = dentro de HTML em texto (src="…"): sempre inline, nunca vira __I[n]
// shim: <img src>/<image href> com URL aprendida → data URL embutida (cobre URLs montadas em runtime)
const shim = `var __I={};window.__RES={};(function(){var R=window.__RES;var N=function(v){if(typeof v==='string'&&v.slice(0,5)==='data:'){var c=v.indexOf(','),i=v.slice(c).search(/[?&;]/);if(c>0&&i>0)v=v.slice(0,c+i);}return v;};var d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');if(d&&d.set){Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){d.set.call(this,N(R[v]||v));}});}var sa=Element.prototype.setAttribute;Element.prototype.setAttribute=function(k,v){if((k==='src'||k==='href'||k==='xlink:href')&&typeof v==='string'&&R[v]){v=R[v];}if(k==='src')v=N(v);return sa.call(this,k,v);};})();\n`;

// ── 6) pacotes por biblioteca: JS (+ imagens usadas + RES) e CSS gzip+base64; código-fonte gzip+base64; licenças
const gz = (t) => gzipSync(Buffer.from(t), { level: 9 }).toString('base64');
const blobs = [], LIBS = []; let rawJs = 0, zJs = 0;
for (const id of ids) {
  let js = fixImgs(libJs[id]);
  const used = new Set([...js.matchAll(/__I\[(\d+)\]/g)].map((m) => +m[1]));
  const pre = `Object.assign(__I,{${[...used].map((n) => `${n}:${JSON.stringify(dataUrl(list[n]))}`).join(',')}});Object.assign(window.__RES,${JSON.stringify(Object.fromEntries(learnedBy[id].map((u) => [u, dataUrl(localOf.get(u) || u)])))});\n`;
  js = pre + `(function(__ATLAS_LIB){${js}\n})(${JSON.stringify(id)});`; rawJs += js.length;
  const z = gz(js); zJs += z.length;
  blobs.push(`<script type="text/plain" id="z:js:${id}">${z}</script>`, `<script type="text/plain" id="z:css:${id}">${gz(libCss[id])}</script>`);
  const files = new Set();
  for (const m of JSON.parse(readFileSync(join(ROOT, `src/gen/${id}.meta.json`), 'utf8'))) if (!m.exclude && lock[id]._kept.has(m.uid)) m.files.forEach((f) => files.add(f));
  const map = {};
  for (const f of files) { const p = f.startsWith('@gen/') ? join(ROOT, 'src/gen', f.slice(5)) : join(vendorDir(id), f); if (existsSync(p)) map[f] = readFileSync(p, 'utf8'); }
  blobs.push(`<script type="text/plain" id="z:src:${id}">${gz(JSON.stringify(map))}</script>`);
  const meta = JSON.parse(readFileSync(join(vendorDir(id), '.atlas-source.json'), 'utf8'));
  LIBS.push({ id, name: meta.name, repo: meta.repo, commit: meta.commit, license: meta.license, status: meta.status, copyright: meta.copyright, licenseText: readFileSync(join(vendorDir(id), 'LICENSE'), 'utf8'), wrap: lock[id].wrapClass || '' });
}
const boot = `window.__PROFILE=${JSON.stringify(profile)};window.__LIBS=${JSON.stringify(LIBS)};\n`;
shellJs = (boot + shim + shellJs).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
// o CSS por biblioteca vai só nos blobs; o <style> inline leva shell + fontes
const css = shellCss.replace(/<\/style/gi, '<\\/style');

// ── 7) HTML (shell primeiro: a UI aparece antes de o navegador terminar de ler os blobs)
const html = `<!DOCTYPE html>
<html lang="pt-BR" style="color-scheme:dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Atlas — biblioteca pessoal de componentes UI</title>
<style>${css}${extraFonts}</style>
</head>
<body>
<div id="root"><div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:#888;font-family:system-ui,sans-serif;font-size:14px">Carregando Atlas…</div></div>
<div id="boot-error" style="display:none;position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;background:#2a0d12;color:#ffb4bd;border:1px solid #7f1d2b;border-radius:12px;padding:14px 16px;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap"></div>
<script>
(function(){var b=document.getElementById('boot-error');function s(m){b.style.display='block';b.textContent+=m+'\\n';}
window.addEventListener('error',function(e){s('Erro: '+(e.message||e.error));});
window.addEventListener('unhandledrejection',function(e){if(e.reason&&e.reason.name==='AbortError'){e.preventDefault();return;}s('Promise rejeitada: '+((e.reason&&e.reason.message)||e.reason));});})();
</script>
<script>${shellJs}</script>
${blobs.join('\n')}
</body>
</html>
`;
writeFileSync(OUT, html);
const mb = (n) => (n / 1048576).toFixed(2);
console.log(`\n${OUT.replace(ROOT + '/', '')}: ${mb(html.length)} MB | shell ${(shellJs.length / 1024).toFixed(0)} KB | libs js ${mb(rawJs)} MB → gz ${mb(zJs)} MB | css shell ${(css.length / 1024).toFixed(0)} KB | imagens ${list.length}+aprendidas (baixadas ${ok}, falhas ${fail}) | ${total} componentes | ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(`patches aplicados: ${patchUsed.size}`);
