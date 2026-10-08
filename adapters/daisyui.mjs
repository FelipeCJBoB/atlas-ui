// Adapter daisyUI (Atlas Low): cada "### ~Título" das páginas de docs (packages/docs/src/routes/(routes)/components/<nome>/+page.md)
// é um componente; o código oficial é o bloco ```html com o marcador de destaque `$$` removido (é o que o site mostra como código).
// O CSS vem do plugin npm daisyui@<mesma versão do commit> compilado com Tailwind v4 (stubs/daisyui/globals.css). O código de cada item
// é gravado em src/gen/snips/daisyui/ (gerado; o Código/preview o usam) e o sync deixa o vendor intacto.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, vendorDir } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const custom = true;
const title = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const FILL = /^(navbar|drawer|hero|footer|dock|menu|steps|tab|stat|timeline|carousel|artboard|mockup-(browser|window|phone)|indicator|join|stack|swap|collapse|dropdown)$/;

export async function generate(id) {
  const vd = vendorDir(id), base = join(vd, 'packages/docs/src/routes/(routes)/components');
  const snips = join(ROOT, 'src/gen/snips', id); mkdirSync(snips, { recursive: true });
  const meta = [], loaders = [];
  for (const comp of readdirSync(base).sort()) {
    const f = join(base, comp, '+page.md'); if (!existsSync(f)) continue;
    const t = readFileSync(f, 'utf8').replace(/\r/g, '');
    const pageTitle = t.match(/^title:\s*(.+)$/m)?.[1]?.trim() || title(comp), desc = t.match(/^desc:\s*(.+)$/m)?.[1]?.trim() || '';
    const parts = t.split(/^### ~/m).slice(1);
    parts.forEach((sec, i) => {
      const name = sec.split('\n')[0].trim();
      const fence = sec.match(/```html\n([\s\S]*?)\n```/);
      if (!fence) return;
      const code = fence[1].replace(/\$\$/g, '').replace(/^\s*\n/, '');
      const n = i + 1, eid = `${comp}/${n}`, rel = `${id}/${comp}-${n}.html`;
      writeFileSync(join(ROOT, 'src/gen/snips', rel), code);
      const e = { uid: `${id}:${eid}`, lib: id, id: eid, category: pageTitle, name, desc: desc.slice(0, 180), layout: FILL.test(comp) ? 'fill' : 'centered', kind: 'demo', wide: FILL.test(comp), files: [`@gen/snips/${rel}`], deps: [], flags: [] };
      meta.push(applyOverride(e));
      loaders.push(`${JSON.stringify(e.uid)}:()=>import(${JSON.stringify(`./snips/${rel}?raw`)}).then((m)=>({default:C(m.default)}))`);
    });
  }
  writeFileSync(join(ROOT, `src/gen/${id}.meta.json`), JSON.stringify(meta));
  writeFileSync(join(ROOT, `src/gen/${id}.lib.tsx`), `// @ts-nocheck — gerado por adapters/daisyui.mjs
import { createElement } from 'react';
import { useStageTheme } from '../shell/ctx';
const C = (html) => () => createElement('div', { 'data-theme': useStageTheme(), style: { background: 'transparent' }, dangerouslySetInnerHTML: { __html: html } });
((window).__ATLAS_REG ||= {})[${JSON.stringify(id)}] = {
${loaders.join(',\n')}
};
`);
  return meta.filter((m) => !m.exclude).length;
}
