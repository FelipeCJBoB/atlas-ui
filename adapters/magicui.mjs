// Magic UI: catálogo vem de registry/example/*.tsx (demos oficiais) + metadados de registry-examples.ts / registry-ui.ts.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { transformSync } from 'esbuild';
import { ROOT, vendorDir, title } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const id = 'magicui';

const loadRegistry = (rel, exp) => {
  const js = transformSync(readFileSync(join(vendorDir(id), rel), 'utf8'), { loader: 'ts', format: 'cjs' }).code;
  const m = { exports: {} }; new Function('module', 'exports', 'require', js)(m, m.exports, () => ({}));
  return m.exports[exp] || [];
};

const CATS = [
  ['Mockups de dispositivo', /android|iphone|safari|mockup/],
  ['Texto', /text|typing|word|hyper|morphing|sparkles|spinning|comic|kinetic|reveal|number-ticker|highlighter|glyph|aurora|line-shadow/],
  ['Botões', /button|toggler|toggle/],
  ['Fundos & padrões', /pattern|grid|meteor|particles|ripple|retro|warp|light-rays|noise|flicker|backlight|aurora|orbit/],
  ['Cards & Bento', /card|bento|border-beam|shine|neon|glare/],
  ['Listas, Dock & Marquee', /marquee|dock|list|file-tree|avatar|icon-cloud|scroll|tweet|beam/],
  ['Mídia & 3D', /video|lens|pixel-image|code|terminal|confetti|cool-mode|globe|map|pointer|cursor|blur|progress/],
];
const categoryOf = (name) => (CATS.find(([, rx]) => rx.test(name)) || ['Outros'])[0];
const WIDE = /bento|globe|dock|marquee|safari|iphone|android|terminal|code-comparison|hero|file-tree|animated-beam|scroll-based|light-rays|particles|flickering|retro|warp|pattern|backlight/;

export function generate() {
  const vd = vendorDir(id);
  const ex = loadRegistry('registry/registry-examples.ts', 'examples');
  const ui = loadRegistry('registry/registry-ui.ts', 'ui');
  const exByFile = new Map(ex.map((e) => [basename(e.files[0].path), e]));
  const uiNames = new Set(ui.map((u) => u.name));
  const uiDesc = new Map(ui.map((u) => [u.name, u]));
  const files = readdirSync(join(vd, 'registry/example')).filter((f) => f.endsWith('.tsx')).sort();
  const meta = [], mods = [];
  for (const f of files) {
    const eid = f.replace(/\.tsx$/, '');
    const r = exByFile.get(f);
    const parentDep = r?.registryDependencies?.find((d) => d.startsWith('@magicui/'))?.replace('@magicui/', '');
    const parent = parentDep || [...uiNames].filter((n) => eid.startsWith(n)).sort((a, b) => b.length - a.length)[0] || eid.replace(/-demo.*$/, '');
    const comp = uiDesc.get(parent);
    const srcFiles = [`registry/example/${f}`];
    for (const d of r?.registryDependencies || []) if (d.startsWith('@magicui/')) { const p = `registry/magicui/${d.replace('@magicui/', '')}.tsx`; srcFiles.push(p); }
    const e = {
      uid: `${id}:${eid}`, lib: id, id: eid, category: categoryOf(parent), group: title(parent), name: r?.title?.replace(/ Demo\b/, '') || title(eid), desc: r?.description || comp?.description || '',
      layout: 'centered', kind: 'demo', wide: WIDE.test(parent), files: srcFiles, deps: comp?.dependencies || [], flags: [],
    };
    meta.push(applyOverride(e)); mods.push(f.replace(/\.tsx$/, ''));
  }
  const lines = [], items = [];
  meta.forEach((m, i) => { if (m.exclude) return; lines.push(`import * as s${i} from '../../vendor/${id}/registry/example/${mods[i]}';`); items.push(`  { ...M[${i}], mod: s${i} as any },`); });
  mkdirSync(join(ROOT, 'src/gen'), { recursive: true });
  writeFileSync(join(ROOT, 'src/gen/magicui.gen.tsx'), `// @ts-nocheck — gerado por adapters/magicui.mjs\nimport M from './magicui.meta.json';\n${lines.join('\n')}\nexport const RAW = [\n${items.join('\n')}\n];\n`);
  writeFileSync(join(ROOT, 'src/gen/magicui.meta.json'), JSON.stringify(meta));
  return meta.filter((m) => !m.exclude).length;
}
