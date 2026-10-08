// Adapter Flowbite (Atlas Low): cada {{< example … >}}HTML{{< /example >}} das páginas content/**/*.md é um componente (HTML verbatim).
// Shortcodes Hugo dentro do HTML ({{< param homepage >}}, {{< ref … >}}, …) não são HTML válido: são trocados por um valor mínimo (listado no relatório).
// CSS: Tailwind v4 + tema/plugin do pacote npm flowbite@<mesma versão do commit> (stubs/flowbite/globals.css). JS (data-attributes): initFlowbite() após montar.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, vendorDir } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const custom = true;
const SECTIONS = ['components', 'forms', 'typography', 'plugins'];
const title = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const SC = { homepage: 'https://flowbite.com' };
export const shortcodeFixes = [];

export async function generate(id) {
  const vd = vendorDir(id), snips = join(ROOT, 'src/gen/snips', id); mkdirSync(snips, { recursive: true });
  const meta = [], loaders = []; shortcodeFixes.length = 0;
  for (const sec of SECTIONS) {
    const dir = join(vd, 'content', sec); if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md') && x !== '_index.md').sort()) {
      const slug = f.replace(/\.md$/, ''), t = readFileSync(join(dir, f), 'utf8').replace(/\r/g, '');
      const pageTitle = (t.match(/^title:\s*(.+)$/m)?.[1] || title(slug)).replace(/^["']|["']$/g, '').replace(/^Tailwind CSS\s+/i, '').replace(/\s*-\s*Flowbite$/i, '').trim();
      const desc = (t.match(/^description:\s*(.+)$/m)?.[1] || '').replace(/^["']|["']$/g, '');
      // posição dos títulos (## / ###) para nomear cada exemplo
      const heads = [...t.matchAll(/^#{2,4}\s+(.+)$/gm)].map((m) => ({ at: m.index, text: m[1].trim() }));
      let n = 0;
      for (const m of t.matchAll(/\{\{<\s*example([^>]*?)>\}\}\n?([\s\S]*?)\n?\{\{<\s*\/example\s*>\}\}/g)) {
        n++;
        const attrs = m[1]; let html = m[2];
        const had = [];
        html = html.replace(/\{\{<\s*param\s+(\w+)\s*>\}\}/g, (x, k) => { had.push(x); return SC[k] ?? ''; })
          .replace(/\{\{<\s*ref\s+"[^"]*"\s*>\}\}/g, (x) => { had.push(x); return '#'; })
          .replace(/\{\{<[^>]*>\}\}/g, (x) => { had.push(x); return ''; });
        if (had.length) shortcodeFixes.push(`${sec}/${slug}/${n}: ${had.join(' ')}`);
        const head = [...heads].reverse().find((h) => h.at < m.index)?.text || pageTitle;
        const cls = attrs.match(/\bclass="([^"]*)"/)?.[1] || '';
        const needsJs = /\b(charts|datatables|javascript)\b\s*=/.test(attrs) || /<script[\s>]/i.test(html) || /esm\.sh|cdn\./i.test(html);
        const eid = `${sec}/${slug}/${n}`, rel = `${id}/${sec}-${slug}-${n}.html`;
        writeFileSync(join(ROOT, 'src/gen/snips', rel), html);
        const e = { uid: `${id}:${eid}`, lib: id, id: eid, category: `${title(sec)} · ${pageTitle}`, name: head.replace(/[`*]/g, ''), desc: desc.slice(0, 180), layout: 'fill', kind: 'demo', wide: true, files: [`@gen/snips/${rel}`], deps: [], flags: [...(needsJs ? ['needs-network'] : []), ...(html.includes('/docs/videos/') ? ['needs-files'] : [])] };
        meta.push(applyOverride(e));
        loaders.push(`${JSON.stringify(e.uid)}:()=>import(${JSON.stringify(`./snips/${rel}?raw`)}).then((m)=>({default:C(m.default,${JSON.stringify(cls)})}))`);
      }
    }
  }
  writeFileSync(join(ROOT, `src/gen/${id}.meta.json`), JSON.stringify(meta));
  writeFileSync(join(ROOT, `src/gen/${id}.shortcodes.txt`), shortcodeFixes.join('\n'));
  writeFileSync(join(ROOT, `src/gen/${id}.lib.tsx`), `// @ts-nocheck — gerado por adapters/flowbite.mjs
import { createElement, useEffect } from 'react';
import { initFlowbite } from 'flowbite';
const C = (html, cls) => () => {
  useEffect(() => { try { initFlowbite(); } catch (e) {} }, []);
  return createElement('div', { className: cls, dangerouslySetInnerHTML: { __html: html } });
};
((window).__ATLAS_REG ||= {})[${JSON.stringify(id)}] = {
${loaders.join(',\n')}
};
`);
  console.log(`    flowbite: ${shortcodeFixes.length} exemplos com shortcode Hugo substituído`);
  return meta.filter((m) => !m.exclude).length;
}
