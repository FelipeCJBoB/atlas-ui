// Adapter HyperUI (Atlas Low): cada public/examples/<grupo>/<slug>/<n>.html é um componente (+ <n>-dark.html quando existe).
// Sem React no original: o "componente" do Atlas só injeta o markup do <body> (regra oficial do HyperUI: conteúdo do <body>,
// sem 4 espaços de indentação) dentro do palco `.lib-hyperui`; o CSS é Tailwind v4 compilado pelo pipeline normal (stubs/hyperui/globals.css).
// Título/descrição vêm do frontmatter de src/content/collection/<grupo>/<slug>.mdx (n-ésimo item de `components`).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, vendorDir } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const custom = true;

const GROUPS = ['application', 'marketing', 'neobrutalism'];
const title = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function frontmatter(file) {
  if (!existsSync(file)) return { title: null, comps: [] };
  const t = readFileSync(file, 'utf8').replace(/\r/g, ''); const m = t.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { title: null, comps: [] };
  const fm = m[1], tt = fm.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') || null;
  const comps = []; let cur = null;
  const sec = fm.split(/^components:\s*$/m)[1] || '';
  for (const line of sec.split('\n')) {
    let x;
    if ((x = line.match(/^\s+-\s+title:\s*(.+)$/))) { cur = { title: x[1].trim().replace(/^["']|["']$/g, '') }; comps.push(cur); }
    else if (cur && (x = line.match(/^\s+description:\s*(.+)$/))) cur.description = x[1].trim().replace(/^["']|["']$/g, '');
    else if (/^\S/.test(line) && line.trim()) break;
  }
  return { title: tt, comps };
}

export async function generate(id) {
  const vd = vendorDir(id), meta = [], loaders = [];
  for (const g of GROUPS) {
    const gdir = join(vd, 'public/examples', g);
    if (!existsSync(gdir)) continue;
    for (const slug of readdirSync(gdir).sort()) {
      const sdir = join(gdir, slug);
      const nums = readdirSync(sdir).map((f) => f.match(/^(\d+)\.html$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
      if (!nums.length) continue;
      const fm = frontmatter(join(vd, 'src/content/collection', g, `${slug}.mdx`));
      for (const n of nums) {
        const rel = `public/examples/${g}/${slug}/${n}`;
        const light = `${rel}.html`, dark = existsSync(join(vd, `${rel}-dark.html`)) ? `${rel}-dark.html` : null;
        const html = readFileSync(join(vd, light), 'utf8');
        const c = fm.comps[n - 1] || {};
        const flags = [];
        if (/<script[^>]+src=["']https?:/i.test(html)) flags.push('needs-network');   // ex.: Chart.js via CDN (scripts não rodam no Atlas)
        const e = {
          uid: `${id}:${g}/${slug}/${n}`, lib: id, id: `${g}/${slug}/${n}`,
          category: `${title(g)} · ${fm.title || title(slug)}`,
          name: c.title || `${fm.title || title(slug)} ${n}`, desc: (c.description || '').slice(0, 180),
          layout: 'fill', kind: 'demo', wide: true, files: [light, dark].filter(Boolean), deps: [], flags,
        };
        meta.push(applyOverride(e));
        const L = `../../vendor/${id}/${light}?raw`, D = dark ? `import(${JSON.stringify(`../../vendor/${id}/${dark}?raw`)})` : 'null';
        loaders.push(`${JSON.stringify(e.uid)}:()=>Promise.all([import(${JSON.stringify(L)}),${D}]).then(([l,d])=>({default:C(l.default,d&&d.default)}))`);
      }
    }
  }
  mkdirSync(join(ROOT, 'src/gen'), { recursive: true });
  writeFileSync(join(ROOT, `src/gen/${id}.meta.json`), JSON.stringify(meta));
  writeFileSync(join(ROOT, `src/gen/${id}.lib.tsx`), `// @ts-nocheck — gerado por adapters/hyperui.mjs
import { createElement } from 'react';
import { useStageTheme } from '../shell/ctx';
// markup oficial = conteúdo do <body> sem os 4 espaços de indentação (src/utils/componentMarkup.ts do HyperUI)
const body = (h) => { const m = /<body[^>]*>([\\s\\S]*?)<\\/body>/.exec(h); return (m ? m[1] : h).replace(/^ {4}/gm, '').trim(); };
const C = (L, D) => () => { const dark = useStageTheme() === 'dark'; return createElement('div', { dangerouslySetInnerHTML: { __html: body(dark && D ? D : L) } }); };
((window).__ATLAS_REG ||= {})[${JSON.stringify(id)}] = {
${loaders.join(',\n')}
};
`);
  return meta.filter((m) => !m.exclude).length;
}
