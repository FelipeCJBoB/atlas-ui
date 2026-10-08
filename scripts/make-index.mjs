#!/usr/bin/env node
// Gera o índice do Atlas para o Claude Code ler/pesquisar (sem abrir o HTML de 100+ MB):
//   node scripts/make-index.mjs [--catalog=out/catalog.full.json] [--out=../atlas-index]
// Saídas em <out>/: README.md · libs.md · catalog.jsonl (1 componente por linha) · by-app/<app>/<função>.md
// Pré-requisito: build full (npm run build) — ele grava out/catalog.full.json com app/fn/tags/stack.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { APPS, FNS } from '../build/taxonomy.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] ?? d;
const catalog = resolve(ROOT, arg('catalog', 'out/catalog.full.json'));
const OUT = resolve(ROOT, arg('out', '../atlas-index'));
if (!existsSync(catalog)) { console.error(`catálogo não encontrado: ${catalog} (rode: npm run build)`); process.exit(1); }
const lock = JSON.parse(readFileSync(join(ROOT, 'sources.lock.json'), 'utf8')).sources;
const entries = JSON.parse(readFileSync(catalog, 'utf8'));
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const NOTES = {
  hyperui: 'HTML + Tailwind v4 (utilitários). Copie o conteúdo do <body>. Variante -dark = classes dark: (ancestral com classe `dark`).',
  uiverse: 'HTML + CSS puro (bloco <style> junto da marcação; seletores globais — namespace ao colar no projeto). Sem build. Alguns usam Tailwind v3.',
  daisyui: 'HTML + Tailwind v4 + plugin daisyUI 5 (`@plugin "daisyui"`); temas via atributo data-theme.',
  flowbite: 'HTML + Tailwind v4 + tema/plugin `flowbite` 4 (classes como text-body, bg-neutral-secondary-medium); componentes interativos exigem o JS do flowbite (data-attributes, initFlowbite()).',
  materialtailwind: 'HTML + Tailwind v3 + @material-tailwind/html 2.3.2 (withMT: cores/sombras próprias) + script do pacote (ripple, collapse, tabs…).',
};
const REACT_NOTE = 'React + Tailwind (+ motion/shadcn conforme o componente). Os arquivos listados importam helpers do repo (ex.: `@/lib/utils` → cn); copie também os arquivos relacionados e instale as dependências citadas nos imports.';

const libInfo = (id) => ({ id, name: lock[id]?.name || id, license: lock[id]?.license || '?', repo: (lock[id]?.repo || '').replace(/\.git$/, ''), commit: (lock[id]?.commit || '').slice(0, 8), stack: lock[id]?.stack || 'react', share: (lock[id]?.profile || []).includes('compartilhavel'), note: NOTES[id] || REACT_NOTE });

// ── catalog.jsonl
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const rows = entries.map((e) => {
  const l = libInfo(e.lib);
  return { uid: e.uid, name: e.name, lib: e.lib, app: e.app, fn: e.fn, tags: e.tags, category: e.category, desc: e.desc || '', stack: e.stack || l.stack, license: l.license, share: l.share, flags: e.flags || [], layout: e.layout, files: e.files || [] };
});
writeFileSync(join(OUT, 'catalog.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

// ── by-app/<app>/<fn>.md
const flagTxt = (f) => (f.length ? ` ⚠${f.join(',')}` : '');
const line = (r) => `- **${r.name}** · ${r.lib} · ${r.category}${r.desc ? ` — ${r.desc.slice(0, 110)}` : ''} · \`${r.uid}\` [${r.stack}${r.share ? '' : ',pessoal'}]${flagTxt(r.flags)}`;
const appCount = {};
for (const app of APPS) {
  const inApp = rows.filter((r) => r.app === app); if (!inApp.length) continue;
  const dir = join(OUT, 'by-app', slug(app)); mkdirSync(dir, { recursive: true });
  const fns = FNS.filter((f) => inApp.some((r) => r.fn === f));
  appCount[app] = inApp.length;
  writeFileSync(join(dir, '_index.md'), `# ${app} (${inApp.length})\n\nFunções:\n\n${fns.map((f) => `- [${f}](${slug(f)}.md) — ${inApp.filter((r) => r.fn === f).length}`).join('\n')}\n`);
  for (const f of fns) {
    const rs = inApp.filter((r) => r.fn === f).sort((a, b) => a.lib.localeCompare(b.lib) || a.name.localeCompare(b.name));
    writeFileSync(join(dir, `${slug(f)}.md`), `# ${app} › ${f} (${rs.length})\n\nLegenda: \`[stack(,pessoal)]\` · pessoal = não redistribuível (MIT + Commons Clause) · ⚠flags = needs-network/needs-files/needs-props\n\n${rs.map(line).join('\n')}\n`);
  }
}

// ── libs.md
const libs = [...new Set(rows.map((r) => r.lib))].sort();
const libMd = libs.map((id) => { const l = libInfo(id); const n = rows.filter((r) => r.lib === id).length; return `## ${l.name} (\`${id}\`) — ${n} componentes\n- Licença: ${l.license} · perfil compartilhável: ${l.share ? 'sim' : 'NÃO (uso pessoal)'}\n- Stack: ${l.stack}\n- Repositório: ${l.repo} @ ${l.commit}\n- Como usar: ${l.note}\n- Código-fonte local: \`atlas/vendor/${id}/\` (caminhos em \`files\` do catálogo; trechos extraídos ficam em \`atlas/src/gen/snips/${id}/\`)\n`; }).join('\n');
writeFileSync(join(OUT, 'libs.md'), `# Bibliotecas do Atlas\n\n${libMd}`);

// ── README.md
const fnCount = Object.fromEntries(FNS.map((f) => [f, rows.filter((r) => r.fn === f).length]));
const ATLAS = ROOT.replace(/\\/g, '/');
writeFileSync(join(OUT, 'README.md'), `# Atlas — índice para o Claude Code

${rows.length} componentes de UI de ${libs.length} bibliotecas, classificados por **tipo de aplicação** e **função**, independente da origem.
Gerado em ${new Date().toISOString().slice(0, 10)} por \`scripts/make-index.mjs\` (rode de novo após cada rebuild do Atlas).

## Como achar componentes (use esta ordem)
1. **Buscar**: \`node "${ATLAS}/scripts/atlas-find.mjs" find "<o que preciso>" [--app="Landing & Marketing"] [--fn=Pricing] [--stack=html|react] [--profile=compartilhavel] [--limit=15]\`
2. **Ler o código**: \`node "${ATLAS}/scripts/atlas-find.mjs" code <uid>\` (imprime metadados, licença, dependências e o código-fonte original)
3. Sem o comando: \`grep -i "<termo>" "${OUT.replace(/\\/g, '/')}/catalog.jsonl"\` ou abra \`by-app/<app>/<função>.md\`.

Campos de \`catalog.jsonl\`: uid, name, lib, app, fn, tags, category, desc, stack (react|html), license, share (pode redistribuir?), flags, layout, files.

## Regras de recomendação
- **stack**: projeto React → prefira \`react\`; HTML/Tailwind puro → \`html\` (veja \`libs.md\` para a versão de Tailwind exigida).
- **share=false** (React Bits, Animate UI: MIT + Commons Clause) só em projeto pessoal; para algo que será distribuído/vendido use \`--profile=compartilhavel\`.
- **flags**: \`needs-network\` (precisa de internet: vídeo/API/CDN), \`needs-files\` (depende de arquivos próprios), \`needs-props\` (peça sem demo pronta). Evite em recomendações offline.
- Imagens de terceiros (Unsplash etc.) embutidas nos exemplos têm licença não auditada: troque por imagens do projeto.

## Tipos de aplicação
${APPS.filter((a) => appCount[a]).map((a) => `- **${a}** — ${appCount[a]} (\`by-app/${slug(a)}/\`)`).join('\n')}

## Funções
${FNS.filter((f) => fnCount[f]).map((f) => `${f} (${fnCount[f]})`).join(' · ')}

Detalhes de cada biblioteca (licença, stack, como usar): \`libs.md\`.
`);
console.log(`índice: ${rows.length} componentes → ${OUT}`);
