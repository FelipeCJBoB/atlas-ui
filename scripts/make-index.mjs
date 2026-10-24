#!/usr/bin/env node
// Catálogo do Atlas para a IA (dentro do repositório):
//   node scripts/make-index.mjs [--catalog=out/catalog.full.json]
// Saídas em catalogo/: catalog.jsonl (1 componente por linha) · libs.md · por-funcao/<função>.md (com miniaturas)
// As prévias (previews/) e as folhas (catalogo/folhas/) vêm de build/previas.mjs.
// Pré-requisito: build full (npm run build) — ele grava out/catalog.full.json com app/fn/tags/stack.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { APPS, FNS } from '../build/taxonomy.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] ?? d;
const catalog = resolve(ROOT, arg('catalog', 'out/catalog.full.json'));
const OUT = join(ROOT, 'catalogo');
if (!existsSync(catalog)) { console.error(`catálogo não encontrado: ${catalog} (rode: npm run build)`); process.exit(1); }
const lock = JSON.parse(readFileSync(join(ROOT, 'sources.lock.json'), 'utf8')).sources;
const entries = JSON.parse(readFileSync(catalog, 'utf8'));
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const previewRel = (uid) => { const [lib, ...r] = uid.split(':'); return `previews/${lib}/${r.join(':').replace(/[/:]/g, '__')}.webp`; };

const NOTES = {
  uiverse: 'HTML + CSS puro (bloco <style> junto da marcação; seletores globais — namespace ao colar no projeto). Sem build. Alguns usam Tailwind v3.',
  atlas: 'React + Tailwind v4 (+ motion quando indicado). Autoria própria do Atlas: sem aviso de licença de terceiros; arquivos autocontidos.',
};
const REACT_NOTE = 'React + Tailwind (+ motion/shadcn conforme o componente). Os arquivos importam helpers do próprio repositório (ex.: `@/lib/utils` → cn); copie também os relacionados listados em `files` e instale as dependências de `deps`.';
const libInfo = (id) => ({ id, name: lock[id]?.name || id, license: lock[id]?.license || '?', repo: (lock[id]?.repo || '').replace(/\.git$/, ''), commit: (lock[id]?.commit || '').slice(0, 8), stack: lock[id]?.stack || 'react', own: !!lock[id]?.own, share: (lock[id]?.profile || []).includes('compartilhavel'), note: NOTES[id] || REACT_NOTE });

// dependências npm a partir dos imports dos arquivos do componente
const fileAbs = (lib, f) => (f.startsWith('@gen/') ? join(ROOT, 'src/gen', f.slice(5)) : join(ROOT, 'vendor', lib, f));
const depsOf = (lib, files) => {
  const d = new Set();
  for (const f of files) { const p = fileAbs(lib, f); if (!existsSync(p) || !/\.[jt]sx?$/.test(p)) continue;
    for (const m of readFileSync(p, 'utf8').matchAll(/(?:from\s+|import\s*\(\s*|require\(\s*)["']([^"'./@~][^"']*|@[^"'/]+\/[^"']+)["']/g)) d.add(m[1].split('/').slice(0, m[1].startsWith('@') ? 2 : 1).join('/')); }
  return [...d].filter((x) => !/^(react|react-dom|next)$/.test(x) && !/^(@\/|@storybook\/)/.test(x)).sort();   // demos/stories não contam
};

const rows = entries.map((e) => {
  const l = libInfo(e.lib);
  return { uid: e.uid, name: e.name, lib: e.lib, app: e.app, fn: e.fn, tags: e.tags, category: e.category, desc: e.desc || '', stack: e.stack || l.stack, license: l.license, own: l.own, share: l.share, flags: e.flags || [], layout: e.layout,
    preview: existsSync(join(ROOT, previewRel(e.uid))) ? previewRel(e.uid) : '', files: (e.files || []).map((f) => (f.startsWith('@gen/') ? f : `vendor/${e.lib}/${f}`)), deps: depsOf(e.lib, e.files || []) };
});

mkdirSync(OUT, { recursive: true });
rmSync(join(OUT, 'por-funcao'), { recursive: true, force: true });
writeFileSync(join(OUT, 'catalog.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

// ── por-funcao/<fn>.md: tabela com miniatura (o GitHub mostra as imagens)
const dir = join(OUT, 'por-funcao'); mkdirSync(dir, { recursive: true });
const fnCount = {};
for (const f of FNS) {
  const rs = rows.filter((r) => r.fn === f).sort((a, b) => a.app.localeCompare(b.app) || a.lib.localeCompare(b.lib) || a.name.localeCompare(b.name));
  if (!rs.length) continue; fnCount[f] = rs.length;
  const line = (r) => `| ${r.preview ? `<img src="../../${r.preview}" width="300">` : '—'} | **${r.name.replace(/\|/g, '/')}**<br>\`${r.uid}\` | ${r.app} | ${r.lib}${r.own ? ' (própria)' : ''} · ${r.license}${r.share ? '' : ' · **pessoal**'}${r.flags.length ? ' · ⚠' + r.flags.join(',') : ''} | ${r.deps.join(', ') || '—'} |`;
  writeFileSync(join(dir, `${slug(f)}.md`), `# ${f} (${rs.length})\n\nPrévia: estado normal | com o cursor em cima. Código: \`node scripts/atlas-find.mjs code <uid>\` ou os arquivos em \`catalog.jsonl → files\`.\n\n| prévia | componente | tipo de aplicação | biblioteca · licença | dependências npm |\n|---|---|---|---|---|\n${rs.map(line).join('\n')}\n`);
}
writeFileSync(join(dir, 'README.md'), `# Componentes por função\n\n${FNS.filter((f) => fnCount[f]).map((f) => `- [${f}](${slug(f)}.md) — ${fnCount[f]}`).join('\n')}\n`);

// ── libs.md
const libs = [...new Set(rows.map((r) => r.lib))].sort();
writeFileSync(join(OUT, 'libs.md'), `# Bibliotecas do Atlas\n\n${libs.map((id) => { const l = libInfo(id); const n = rows.filter((r) => r.lib === id).length; return `## ${l.name} (\`${id}\`) — ${n} componentes\n- Licença: ${l.license}${l.own ? ' — autoria própria' : ` · origem: ${l.repo} @ ${l.commit} (cópia versionada em \`vendor/${id}/\`, texto da licença em \`vendor/${id}/LICENSE\`)`}\n- Pode ir em trabalho de cliente/redistribuir: ${l.share ? 'sim (mantenha o aviso de licença no código, se houver)' : 'NÃO (uso pessoal)'}\n- Stack: ${l.stack}\n- Como usar: ${l.note}\n`; }).join('\n')}`);

// ── README do catálogo
const appCount = Object.fromEntries(APPS.map((a) => [a, rows.filter((r) => r.app === a).length]));
writeFileSync(join(OUT, 'README.md'), `# Catálogo do Atlas

${rows.length} componentes de UI curados (só o que é difícil de fazer sem instrução) de ${libs.length} bibliotecas. Gerado em ${new Date().toISOString().slice(0, 10)} por \`scripts/make-index.mjs\`.

- \`catalog.jsonl\` — 1 componente por linha: uid, name, lib, app, fn, tags, category, desc, stack (react|html), license, own (autoria própria), share (pode ir para cliente?), flags, layout, preview, files, deps.
- \`por-funcao/\` — uma página por função com miniaturas.
- \`folhas/\` — folhas de prévias numeradas (24 por imagem) para comparar visualmente.
- \`libs.md\` — licença e forma de uso de cada biblioteca.
- Prévias individuais: \`../previews/<lib>/<id>.webp\` (estado normal | com o cursor em cima).

## Tipos de aplicação
${APPS.filter((a) => appCount[a]).map((a) => `- **${a}** — ${appCount[a]}`).join('\n')}

## Funções
${FNS.filter((f) => fnCount[f]).map((f) => `[${f}](por-funcao/${slug(f)}.md) (${fnCount[f]})`).join(' · ')}
`);
console.log(`catálogo: ${rows.length} componentes (${rows.filter((r) => r.preview).length} com prévia) → catalogo/`);
