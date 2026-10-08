// Adapter Uiverse (Galaxy, Atlas Low): 11 pastas por categoria, cada arquivo <autor>_<slug>.html = marcação + bloco <style> (CSS puro,
// seletores globais que colidem entre si) — alguns usam Tailwind v3 (sem <style>). Isolamento: cada item renderiza num Shadow DOM
// (CSS puro vai no próprio shadow root; itens Tailwind recebem uma folha Tailwind v3 compilada em build, compartilhada via adoptedStyleSheets).
// O "código" do item é o arquivo original inteiro, sem alteração.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { ROOT, vendorDir } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const custom = true;
const require = createRequire(import.meta.url);

const CATS = { Buttons: 'Botões', Cards: 'Cards', loaders: 'Loaders', 'Toggle-switches': 'Toggles', Inputs: 'Inputs', Forms: 'Formulários', Checkboxes: 'Checkboxes', Patterns: 'Padrões', 'Radio-buttons': 'Radio buttons', Tooltips: 'Tooltips', Notifications: 'Notificações' };
const title = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generate(id) {
  const vd = vendorDir(id), meta = [], loaders = [], twItems = [];
  for (const [dir, cat] of Object.entries(CATS)) {
    const d = join(vd, dir); if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((x) => x.endsWith('.html')).sort()) {
      const base = f.replace(/\.html$/, ''), k = base.lastIndexOf('_');
      const author = k > 0 ? base.slice(0, k) : 'anon', slug = (k > 0 ? base.slice(k + 1) : base).replace(/-\d+$/, '');
      const html = readFileSync(join(d, f), 'utf8');
      const tags = html.match(/Tags:\s*([^*\n]+?)\s*\*\//)?.[1]?.trim() || '';
      const tw = !/<style[\s>]/i.test(html) || /tailwind/i.test(html);
      if (tw) twItems.push(html);
      const flags = /(src|href)=["']https?:\/\/[^"']+\.(mp4|webm)|url\(["']?https?:\/\/[^)]+\.(mp4|webm)/i.test(html) ? ['needs-network'] : [];
      const eid = `${dir}/${base}`;
      const e = { uid: `${id}:${eid}`, lib: id, id: eid, category: cat, name: `${title(slug)} · ${author}`, desc: tags.slice(0, 180), layout: 'centered', kind: 'demo', wide: false, files: [`${dir}/${f}`], deps: [], flags };
      meta.push(applyOverride(e));
      loaders.push(`${JSON.stringify(e.uid)}:()=>import(${JSON.stringify(`../../vendor/${id}/${dir}/${f}?raw`)}).then((m)=>({default:S(m.default,${tw})}))`);
    }
  }
  // Tailwind v3 (como o site do Uiverse): uma folha para todos os itens que usam utilitários
  const tw3 = require('tailwindcss3');
  const res = await postcss([tw3({ content: twItems.map((raw) => ({ raw, extension: 'html' })) })]).process('@tailwind base;\n@tailwind components;\n@tailwind utilities;', { from: undefined });
  mkdirSync(join(ROOT, 'src/gen'), { recursive: true });
  writeFileSync(join(ROOT, `src/gen/${id}.tw.css`), res.css);
  writeFileSync(join(ROOT, `src/gen/${id}.meta.json`), JSON.stringify(meta));
  writeFileSync(join(ROOT, `src/gen/${id}.lib.tsx`), `// @ts-nocheck — gerado por adapters/uiverse.mjs
import { createElement, useLayoutEffect, useRef } from 'react';
import TW from './${id}.tw.css?raw';
let sheet; const twSheet = () => (sheet ||= (() => { const s = new CSSStyleSheet(); s.replaceSync(TW); return s; })());
// seletores de documento (:root/html/body) não existem no shadow root: viram o contêiner .__u
const fixCss = (h) => h.replace(/(<style[^>]*>)([\\s\\S]*?)(<\\/style>)/gi, (_m, a, css, z) => a + css.replace(/(^|[\\s,{};])(:root|html|body)(?=[\\s,{:.\\[>+~]|$)/g, '$1.__u') + z);
const S = (html, tw) => () => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const host = ref.current; const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    root.adoptedStyleSheets = tw ? [twSheet()] : [];
    // base: centraliza como o preview do Uiverse (o CSS do item vem depois e pode sobrescrever)
    root.innerHTML = '<style>.__u{display:grid;place-items:center;min-height:220px;padding:24px;box-sizing:border-box}</style><div class="__u">' + fixCss(html) + '</div>';
  }, []);
  return createElement('div', { ref, style: { display: 'contents' } });
};
((window).__ATLAS_REG ||= {})[${JSON.stringify(id)}] = {
${loaders.join(',\n')}
};
`);
  console.log(`    uiverse: tailwind v3 ${twItems.length} itens → ${(res.css.length / 1024).toFixed(0)} KB`);
  return meta.filter((m) => !m.exclude).length;
}
