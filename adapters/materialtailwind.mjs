// Adapter Material Tailwind v2 (HTML) (Atlas Low): cada <CodePreview …>```html … ```</CodePreview> de documentation/html/*.mdx é um componente
// (HTML verbatim do bloco). Exige Tailwind v3 + withMT (pacote npm @material-tailwind/html@2.3.2 = mesma versão do repo) → o CSS é compilado aqui
// com tailwindcss3 e cada exemplo roda num <iframe srcdoc> (isola o preflight v3 do resto do Atlas) junto com o script oficial
// public/material-tailwind-html-v2.js (ripple, collapse, tabs, popover, dialog…).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { build } from 'esbuild';
import { ROOT, vendorDir } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const custom = true;
const require = createRequire(import.meta.url);
const title = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generate(id) {
  const vd = vendorDir(id), dir = join(vd, 'documentation/html'), snips = join(ROOT, 'src/gen/snips', id); mkdirSync(snips, { recursive: true });
  const meta = [], loaders = [], all = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx')).sort()) {
    const slug = f.replace(/\.mdx$/, ''), t = readFileSync(join(dir, f), 'utf8').replace(/\r/g, '');
    const pageTitle = (t.match(/^title:\s*(.+)$/m)?.[1] || title(slug)).replace(/^Tailwind CSS\s+/i, '').replace(/\s*-\s*Material Tailwind$/i, '').trim();
    const desc = (t.match(/^description:\s*(.+)$/m)?.[1] || '').trim();
    const heads = [...t.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => ({ at: m.index, text: m[1].trim() }));
    let n = 0;
    for (const m of t.matchAll(/<CodePreview[\s\S]*?\n?>\s*```html\n([\s\S]*?)\n```\s*<\/CodePreview>/g)) {
      n++; const html = m[1];
      const head = [...heads].reverse().find((h) => h.at < m.index)?.text || pageTitle;
      const eid = `${slug}/${n}`, rel = `${id}/${slug}-${n}.html`;
      writeFileSync(join(ROOT, 'src/gen/snips', rel), html); all.push(html);
      const flags = [...(/<script[^>]+src=["']https?:/i.test(html) ? ['needs-network'] : []), ...(/(?:src|poster)=["']\/[^"']+\.(?:mp4|webm)/i.test(html) ? ['needs-files'] : [])];   // vídeo local do site: não vai no repo
      const e = { uid: `${id}:${eid}`, lib: id, id: eid, category: pageTitle, name: head.replace(/[`*]/g, ''), desc: desc.slice(0, 180), layout: 'fill', kind: 'demo', wide: true, files: [`@gen/snips/${rel}`], deps: [], flags };
      meta.push(applyOverride(e));
      loaders.push(`${JSON.stringify(e.uid)}:()=>import(${JSON.stringify(`./snips/${rel}?raw`)}).then((m)=>({default:C(m.default)}))`);
    }
  }
  const withMT = require('@material-tailwind/html/utils/withMT');
  const cfg = withMT({ content: all.map((raw) => ({ raw, extension: 'html' })), theme: { extend: { colors: { primary: '#020617' } } } });   // = tailwind.config.js do repo
  const res = await postcss([require('tailwindcss3')(cfg)]).process('@tailwind base;\n@tailwind components;\n@tailwind utilities;', { from: undefined });
  writeFileSync(join(ROOT, `src/gen/${id}.tw.css`), res.css);
  // script oficial (módulo ES com @floating-ui/dom) → IIFE para rodar dentro do iframe
  const js = await build({ entryPoints: [join(vd, 'public/material-tailwind-html-v2.js')], bundle: true, format: 'iife', globalName: '__MT', minify: true, write: false, absWorkingDir: ROOT, logLevel: 'error' });
  writeFileSync(join(ROOT, `src/gen/${id}.init.js`), js.outputFiles[0].text);
  writeFileSync(join(ROOT, `src/gen/${id}.meta.json`), JSON.stringify(meta));
  writeFileSync(join(ROOT, `src/gen/${id}.lib.tsx`), `// @ts-nocheck — gerado por adapters/materialtailwind.mjs
import { createElement, useRef, useState } from 'react';
import TW from './${id}.tw.css?raw';
import JS from './${id}.init.js?raw';
const esc = (s) => s.split('</' + 'script').join('<' + String.fromCharCode(92) + '/script');   // não fechar o <script> inline
const doc = (html) => '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + TW + '</style><style>html{color-scheme:light}body{margin:0;padding:24px;background:#fff}</style></head><body>' + html + '<script>' + esc(JS) + ';__MT.default();</script></body></html>';
const C = (html) => () => {
  const ref = useRef(null); const [h, setH] = useState(240);
  const fit = () => { const d = ref.current && ref.current.contentDocument; if (d && d.documentElement) setH(Math.min(1400, Math.max(120, d.documentElement.scrollHeight + 2))); };
  return createElement('iframe', { ref, srcDoc: doc(html), title: 'Material Tailwind', style: { width: '100%', height: h, border: 0, display: 'block', borderRadius: 8 }, onLoad: () => { fit(); setTimeout(fit, 400); setTimeout(fit, 1200); } });
};
((window).__ATLAS_REG ||= {})[${JSON.stringify(id)}] = {
${loaders.join(',\n')}
};
`);
  console.log(`    materialtailwind: ${all.length} exemplos; css v3 ${(res.css.length / 1024).toFixed(0)} KB`);
  return meta.filter((m) => !m.exclude).length;
}
