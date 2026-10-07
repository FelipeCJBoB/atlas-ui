#!/usr/bin/env node
// Classifica as dependências de rede dos componentes needs-network a partir de out/qa/report-online.json
// (gerado por: node build/qa.mjs out/atlas-full.html --uids=out/net-uids.json --tag=online --webgl)
// Saída: docs/ATLAS-ON.md
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const rows = JSON.parse(readFileSync(join(ROOT, 'out/qa/report-online.json'), 'utf8')).rows;
const host = (u) => { try { return new URL(u).host; } catch { return u; } };
const RULES = [
  ['video', /\.(mp4|webm|mov|m3u8)(\?|$)|videos\.pexels\.com|video\.twimg\.com|stream\.mux\.com|player\.vimeo\.com|youtube\.com/i, 'não embutível (tamanho)'],
  ['tailwind-play-cdn', /cdn\.tailwindcss\.com/, 'embutível com @tailwindcss/browser v4 (checar compatibilidade v3→v4)'],
  ['iconify-api', /api\.iconify\.design/, 'embutível: @iconify-json/<set> (solar etc.) offline'],
  ['fonte', /fonts\.(googleapis|gstatic)\.com/, 'embutível: @fontsource/*'],
  ['script-cdn', /cdn\.jsdelivr\.net|cdn\.skypack\.dev|unpkg\.com|cdnjs|esm\.sh/, 'embutível via npm (three, gsap…)'],
  ['api-viva', /api\.github\.com|react-tweet\.vercel\.app|nominatim\.openstreetmap\.org|supabase\.co|github\.com|sandpack|cloudflareinsights|doubleclick|google\.com|googleapis\.com|gstatic\.com/, 'dado ao vivo: precisa de internet (ou mock)'],
  ['imagem-remota', /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)|cdn\.cosmos\.so|pbs\.twimg\.com|cdn\.magicui\.design/i, 'embutível (cache de imagens)'],
];
const kindOf = (u) => (RULES.find(([, re]) => re.test(u)) || ['outro'])[0];
const how = Object.fromEntries(RULES.map(([k, , h]) => [k, h]));

const byKind = {}, byComp = [];
for (const r of rows) {
  const kinds = [...new Set(r.ext.map(kindOf))].sort();
  const bad = r.errs.filter((e) => /^HTTP|CORS|ERR_/.test(e)).map((e) => e.slice(0, 110));
  byComp.push({ uid: r.uid, kinds, bad, noRequest: !r.ext.length });
  for (const k of kinds) (byKind[k] ||= []).push(r.uid);
}
const L = [];
L.push('# Atlas On — dependências de rede (123 componentes `needs-network`)', '',
  `Gerado por \`build/online-report.mjs\` a partir do QA com internet real (Edge, ${new Date().toISOString().slice(0, 10)}).`, '',
  '## Resumo por tipo', '', '| Tipo | Componentes | Caminho para offline |', '|---|---|---|');
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) L.push(`| ${k} | ${v.length} | ${how[k] || 'revisar'} |`);
const nr = byComp.filter((c) => c.noRequest);
L.push('', `Sem nenhuma requisição externa neste teste (flag provavelmente desnecessária ou depende de interação): **${nr.length}**`, '',
  nr.map((c) => `\`${c.uid}\``).join(', '), '', '## Falhas mesmo com internet', '');
for (const c of byComp.filter((c) => c.bad.length)) L.push(`- \`${c.uid}\` — ${[...new Set(c.bad)].join(' · ')}`);
L.push('', '## Por componente', '', '| Componente | Dependências |', '|---|---|');
for (const c of byComp) L.push(`| \`${c.uid}\` | ${c.kinds.join(', ') || '—'} |`);
writeFileSync(join(ROOT, 'docs/ATLAS-ON.md'), L.join('\n') + '\n');
console.log('docs/ATLAS-ON.md', Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, v.length])), 'sem-req', nr.length);
