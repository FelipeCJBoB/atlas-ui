// Torna offline as páginas HTML completas (ex.: ThreeUI neuform-isolated/sources/*.html) que usam CDN:
//   cdn.tailwindcss.com (Play CDN v3)  → CSS compilado em build com tailwindcss@3 (alias tailwindcss3), <script> removido
//   iconify-icon + api.iconify.design  → web component inline + só os ícones usados (@iconify-json/solar)
//   gsap / ScrollTrigger / three rNNN  → arquivos do npm inline
//   fonts.googleapis.com               → @font-face com woff2 latin do @fontsource (data-URL)
//   cloudflareinsights                 → removido
// Ativado por lock.<id>.offlineHtml = true (aplicado no loader `raw` de build/plugins.mjs).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { ROOT } from './common.mjs';

const require = createRequire(import.meta.url);
const NM = join(ROOT, 'node_modules');
const read = (p) => readFileSync(join(NM, p), 'utf8');
const esc = (js) => js.replace(/<\/(script)/gi, '<\\/$1');
const cache = new Map();
const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

// ── scripts de CDN → arquivos locais ──
const SCRIPTS = [
  [/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/[\d.]+\/(gsap|ScrollTrigger)\.min\.js/, (m) => `gsap/dist/${m[1]}.min.js`],
  [/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/, () => 'three128/build/three.min.js'],
  [/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r134\/three\.min\.js/, () => 'three134/build/three.min.js'],
  [/(cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/0\.160\.0\/three\.min\.js|cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.min\.js)/, () => 'three160/build/three.min.js'],
];

// ── ícones (solar) ──
let solar; const solarData = () => (solar ||= JSON.parse(readFileSync(require.resolve('@iconify-json/solar/icons.json'), 'utf8')));
function iconSubset(names) {
  const d = solarData(), icons = {}, aliases = {};
  const take = (n) => {
    if (d.icons[n]) icons[n] = d.icons[n];
    else if (d.aliases?.[n]) { aliases[n] = d.aliases[n]; take(d.aliases[n].parent); }
  };
  for (const n of names) take(n);
  return { prefix: 'solar', icons, aliases, width: d.width, height: d.height };
}

// ── fontes ──
const FONT_DIR = { 'Geist': 'geist-sans' };
const fontSlug = (fam) => FONT_DIR[fam] || fam.toLowerCase().replace(/\s+/g, '-');
function fontFace(fam, wght, italic) {
  return memo(`font:${fam}:${wght}:${italic}`, () => {
    const dir = join(NM, '@fontsource', fontSlug(fam), 'files');
    if (!existsSync(dir)) return '';
    const slug = fontSlug(fam), style = italic ? 'italic' : 'normal';
    const have = [100, 200, 300, 400, 500, 600, 700, 800, 900].filter((w) => existsSync(join(dir, `${slug}-latin-${w}-${style}.woff2`)));
    if (!have.length) return '';
    const w = have.reduce((b, x) => (Math.abs(x - wght) < Math.abs(b - wght) ? x : b), have[0]);
    const b64 = readFileSync(join(dir, `${slug}-latin-${w}-${style}.woff2`)).toString('base64');
    return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${wght};font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
  });
}
function fontCss(url) {
  const qs = new URLSearchParams(url.replace(/&amp;/g, '&').split('?')[1] || '');
  const out = [];
  for (const spec of qs.getAll('family')) {
    const [famRaw, axes] = spec.split(':'); const fam = famRaw.replace(/\+/g, ' ');
    const hasItal = /ital/.test(axes || '') && /ital,wght@/.test(axes || '');
    const tuples = (axes || '').split('@')[1]?.split(';') || ['400'];
    for (const t of tuples) {
      const parts = t.split(','); const italic = hasItal && parts[0] === '1'; const wr = parts[hasItal ? 1 : 0] || '400';
      const [lo, hi] = wr.split('..').map(Number);
      for (const wght of hi ? [lo, hi] : [lo]) out.push(fontFace(fam, wght, italic));
    }
  }
  return out.filter(Boolean).join('\n');
}

// ── tailwind v3 (Play CDN) ──
async function tailwindCss(html) {
  const tw3 = require('tailwindcss3');
  let config = {};
  const m = html.match(/<script[^>]*>([^<]*\btailwind\.config\s*=[\s\S]*?)<\/script>/);
  if (m) { const tailwind = {}; try { new Function('tailwind', m[1])(tailwind); config = tailwind.config || {}; } catch (e) { console.log('  ! tailwind.config inválido:', e.message.slice(0, 80)); } }
  const inline = [...html.matchAll(/<style[^>]*type=["']text\/tailwindcss["'][^>]*>([\s\S]*?)<\/style>/g)].map((x) => x[1]).join('\n');
  const input = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${inline}`;
  const res = await postcss([tw3({ ...config, content: [{ raw: html, extension: 'html' }] })]).process(input, { from: undefined });
  return res.css;
}

export async function offlineHtml(html) {
  let t = html;
  t = t.replace(/<script[^>]*static\.cloudflareinsights\.com[^>]*><\/script>/g, '');
  // Tailwind
  if (/<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/.test(t)) {
    const css = await tailwindCss(t);
    let first = true;   // algumas páginas repetem o <script> do CDN
    t = t.replace(/<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/g, () => (first ? ((first = false), `<style data-offline="tailwind3">${css}</style>`) : ''));
    t = t.replace(/<script[^>]*>([^<]*\btailwind\.config\s*=[\s\S]*?)<\/script>/, '').replace(/<style[^>]*type=["']text\/tailwindcss["'][^>]*>[\s\S]*?<\/style>/g, '');
  }
  // gsap / three
  for (const [re, file] of SCRIPTS) t = t.replace(new RegExp(`<script[^>]*src=["']https?:\\/\\/${re.source}["'][^>]*><\\/script>`, 'g'), (tag) => { const m = tag.match(re); return `<script>${esc(read(file(m)))}</script>`; });
  // three como módulo ES (skypack) → data-URL do three134 (próximo da 0.136 pedida)
  t = t.replace(/(["'])https:\/\/cdn\.skypack\.dev\/[^"']*three[^"']*\1/g, (_, q) => `${q}data:text/javascript;base64,${memo('three-esm', () => readFileSync(join(NM, 'three134/build/three.module.js')).toString('base64'))}${q}`);
  // iconify
  if (/code\.iconify\.design\/iconify-icon\/[\d.]+\/iconify-icon\.min\.js/.test(t)) {
    const names = [...new Set([...t.matchAll(/["'`]solar:([a-z0-9-]+)["'`]/g)].map((x) => x[1]))];
    const data = JSON.stringify(iconSubset(names));
    t = t.replace(/<script[^>]*src=["']https:\/\/code\.iconify\.design\/iconify-icon\/[\d.]+\/iconify-icon\.min\.js["'][^>]*><\/script>/, () => `<script>${esc(read('iconify-icon107/dist/iconify-icon.min.js'))}</script><script>var I=customElements.get('iconify-icon');I.addCollection(${data.replace(/<\//g, '<\\/')});I.addAPIProvider('',{resources:[]});</script>`);   // sem API: ícones ausentes ficam em branco (não pedem rede)
  }
  // Google Fonts
  t = t.replace(/<link[^>]*rel=["']preconnect["'][^>]*fonts\.g(oogleapis|static)\.com[^>]*>/g, '');
  t = t.replace(/<link[^>]*href=["'](https:\/\/fonts\.googleapis\.com\/css2\?[^"']+)["'][^>]*>/g, (_, url) => `<style data-offline="fonts">${fontCss(url)}</style>`);
  t = t.replace(/@import\s+url\(["']?(https:\/\/fonts\.googleapis\.com\/css2\?[^"')]+)["']?\);?/g, (_, url) => fontCss(url));
  return t;
}
