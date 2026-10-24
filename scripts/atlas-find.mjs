#!/usr/bin/env node
// Busca no catálogo do Atlas e mostra o código original — feito para o Claude Code usar via Bash.
//   atlas-find find <termos…> [--app=…] [--fn=…] [--lib=…] [--stack=react|html] [--profile=compartilhavel] [--limit=15] [--json]
//   atlas-find code <uid> [--max=60000]      metadados + licença + dependências + código-fonte
//   atlas-find facets                        tipos de aplicação / funções / bibliotecas com contagens
// Lê catalogo/catalog.jsonl (gerado por scripts/make-index.mjs; ou $ATLAS_INDEX).
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { registra } from './atlas-plan.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const INDEX = process.env.ATLAS_INDEX ? resolve(process.env.ATLAS_INDEX) : join(ROOT, 'catalogo');
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const rest = args.slice(1).filter((a) => !a.startsWith('--'));
const catFile = join(INDEX, 'catalog.jsonl');
if (!existsSync(catFile)) { console.error(`índice não encontrado em ${INDEX}. Gere com: node scripts/make-index.mjs`); process.exit(1); }
const rows = readFileSync(catFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const lock = JSON.parse(readFileSync(join(ROOT, 'sources.lock.json'), 'utf8')).sources;

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// sinônimos PT → termos do catálogo (EN)
const SYN = {
  preco: 'pricing price', precos: 'pricing price', plano: 'pricing plans', planos: 'pricing plans', rodape: 'footer', cabecalho: 'header navbar', navegacao: 'navbar navigation', menu: 'menu dropdown',
  tabela: 'table data grid', grafico: 'chart', graficos: 'chart', formulario: 'form', botao: 'button', botoes: 'button', cartao: 'card', depoimento: 'testimonial review', depoimentos: 'testimonial review',
  avaliacao: 'rating review', carrinho: 'cart checkout', produto: 'product', pagamento: 'payment checkout', entrar: 'login sign in', cadastro: 'signup register', senha: 'password', barra: 'bar',
  lateral: 'sidebar', modal: 'modal dialog', alerta: 'alert toast', notificacao: 'notification toast', carregando: 'loader loading spinner', galeria: 'gallery carousel', carrossel: 'carousel',
  calendario: 'calendar date', data: 'date calendar', texto: 'text', fundo: 'background', animacao: 'animation', chat: 'chat ai', painel: 'dashboard', estatisticas: 'stats kpi', perfil: 'profile avatar',
  equipe: 'team', logos: 'logo cloud', duvidas: 'faq', perguntas: 'faq', rolagem: 'scroll', busca: 'search', pesquisa: 'search', seletor: 'select picker', interruptor: 'toggle switch',
};
const STOP = new Set('de da do das dos para com um uma uns umas e o a os as em no na nos nas por que ao aos pra pro the a an for with of to in on and or'.split(' '));
const PHRASE = [[/tabela de preco(s)?|quadro de preco(s)?|planos e preco(s)?/g, 'pricing'], [/pagina inicial|landing page/g, 'landing hero'], [/card de produto|cartao de produto/g, 'product card'], [/tela de login|pagina de login/g, 'login form'], [/barra lateral|menu lateral/g, 'sidebar'], [/barra de navegacao|menu superior/g, 'navbar']];
// cada termo vira um grupo [original, ...sinônimos]; o melhor casamento do grupo conta (sinônimo vale menos)
const tokens = (q) => {
  let n = norm(q); for (const [re, to] of PHRASE) n = n.replace(re, to);
  return [...new Set(n.split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t)))].map((t) => ({ t, syn: SYN[t] ? SYN[t].split(' ') : [] }));
};

function score(r, groups) {
  const f = { name: norm(r.name), fn: norm(r.fn), app: norm(r.app), cat: norm(r.category), desc: norm(r.desc), tags: norm((r.tags || []).join(' ')), id: norm(r.uid + ' ' + r.lib) };
  const one = (w) => { let h = 0; if (f.name.includes(w)) h += 4; if (f.fn.includes(w)) h += 3; if (f.tags.includes(w)) h += 2.5; if (f.cat.includes(w)) h += 2; if (f.app.includes(w)) h += 1.5; if (f.desc.includes(w)) h += 1; if (f.id.includes(w)) h += 0.5; return h; };
  let s = 0, hit = 0;
  for (const g of groups) { const h = Math.max(one(g.t), ...g.syn.map((w) => one(w) * 0.7)); if (h) hit++; s += h; }
  return hit ? s * (0.4 + (0.6 * hit) / groups.length) : 0;
}

function filtered() {
  const app = flag('app'), fn = flag('fn'), lib = flag('lib'), stack = flag('stack'), prof = flag('profile'), noNet = args.includes('--offline');
  return rows.filter((r) => (!app || norm(r.app) === norm(app) || norm(r.app).includes(norm(app))) && (!fn || norm(r.fn) === norm(fn) || norm(r.fn).includes(norm(fn))) && (!lib || r.lib === lib) && (!stack || r.stack === stack) && (prof !== 'compartilhavel' || r.share) && (!noNet || !r.flags.some((f) => /needs-/.test(f))));
}

if (['survey', 'coverage', 'plan'].includes(cmd)) {
  const m = await import('./atlas-plan.mjs'); await m.run(cmd, { rows, args, flag, rest, norm, tokens, score, filtered });
} else if (cmd === 'find') {
  const toks = tokens(rest.join(' ')), limit = +flag('limit', 15), pool = filtered();
  let res = toks.length ? pool.map((r) => ({ r, s: score(r, toks) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s) : pool.map((r) => ({ r, s: 0 }));
  // diversidade: no máximo 4 por biblioteca no topo (evita 15 variações da mesma lib)
  const per = {}, top = [];
  for (const x of res) { per[x.r.lib] = (per[x.r.lib] || 0) + 1; if (per[x.r.lib] <= 4) top.push(x); if (top.length >= limit) break; }
  registra({ cmd: 'find', q: rest.join(' '), app: flag('app') || '', fn: flag('fn') || '', apps: [...new Set(top.map((x) => x.r.app))], fns: [...new Set(top.map((x) => x.r.fn))], uids: top.map((x) => x.r.uid) });
  if (args.includes('--json')) console.log(JSON.stringify(top.map((x) => ({ ...x.r, score: +x.s.toFixed(1) })), null, 1));
  else {
    console.log(`${res.length} resultados (mostrando ${top.length}) para "${rest.join(' ')}" [termos: ${toks.map((g) => g.t + (g.syn.length ? '(' + g.syn.join('/') + ')' : '')).join(' ')}]`);
    for (const { r, s } of top) console.log(`${r.uid}  | ${r.name} | ${r.app} › ${r.fn} | ${r.stack}${r.share ? '' : ',pessoal'} | ${r.license}${r.flags.length ? ' | ⚠' + r.flags.join(',') : ''}${r.desc ? ' | ' + r.desc.slice(0, 90) : ''}`);
    const dist = {}; for (const x of res) dist[x.r.app] = (dist[x.r.app] || 0) + 1;
    console.log('\nDistribuição por tipo de aplicação: ' + Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n).join(' · '));
    if (!flag('app')) console.log('⚠ Isto é só o topo. Aprofunde nos outros tipos com resultados: ' + (Object.keys(dist).filter((a) => !top.some((x) => x.r.app === a)).map((a) => '--app="' + a + '"').join(' ') || '(todos já aparecem)') + '  — ou rode: atlas-find survey "<necessidades separadas por ;>"');
    console.log(`\nVer código: atlas-find code <uid>`);
  }
} else if (cmd === 'code') {
  const uid = rest[0], r = rows.find((x) => x.uid === uid) || rows.find((x) => x.uid.endsWith(uid || '\0'));
  if (!r) { console.error(`uid não encontrado: ${uid}. Use: atlas-find find <termos>`); process.exit(1); }
  registra({ cmd: 'code', uid: r.uid });
  const L = lock[r.lib] || {}, max = +flag('max', 60000);
  console.log(`# ${r.name}  (${r.uid})\napp: ${r.app} · função: ${r.fn} · biblioteca: ${L.name || r.lib} · stack: ${r.stack}\nlicença: ${r.license}${r.own ? ' — autoria própria do Atlas' : ` (origem ${L.repo ? L.repo.replace(/\.git$/, '') : ''} @ ${(L.commit || '').slice(0, 8)}; texto em vendor/${r.lib}/LICENSE)`} · pode ir para cliente: ${r.share ? 'sim' : 'NÃO (uso pessoal)'}\n${r.preview ? `prévia (abra a imagem para ver): ${join(ROOT, r.preview)}\n` : ''}${r.flags.length ? `flags: ${r.flags.join(', ')}\n` : ''}${r.desc ? `descrição: ${r.desc}\n` : ''}layout sugerido no Atlas: ${r.layout}\n`);
  const deps = new Set(); let used = 0;
  for (const f of r.files) {
    const p = f.startsWith('@gen/') ? join(ROOT, 'src/gen', f.slice(5)) : join(ROOT, f);
    if (!existsSync(p)) { console.log(`--- ${f} (arquivo não encontrado)`); continue; }
    const t = readFileSync(p, 'utf8');
    for (const m of t.matchAll(/(?:from\s+|import\s*\(\s*|require\(\s*)["']([^"'./@][^"']*|@[^"'/]+\/[^"']+)["']/g)) deps.add(m[1].split('/').slice(0, m[1].startsWith('@') ? 2 : 1).join('/'));
    if (used > max) { console.log(`--- ${f} (omitido: limite --max)`); continue; }
    const body = t.length > max - used ? t.slice(0, max - used) + '\n/* … truncado … */' : t; used += body.length;
    console.log(`--- ${f}\n${body}\n`);
  }
  console.log(`dependências npm: ${(r.deps || []).join(', ') || '(só react)'}`);
  console.log(r.stack === 'html' ? `\nnota: HTML — leia a seção "${r.lib}" em libs.md para o CSS/JS exigido (versão do Tailwind, plugin, tema).` : `\nnota: React — arquivos importam helpers do repo (ex.: @/lib/utils → cn); copie também os relacionados.`);
} else if (cmd === 'ver') {
  // prévias de um ou mais componentes (abra as imagens para olhar): normal | com o cursor em cima
  const us = rest.map((u) => rows.find((x) => x.uid === u) || rows.find((x) => x.uid.endsWith(u))).filter(Boolean);
  if (!us.length) { console.error('uso: atlas-find ver <uid> [uid…]'); process.exit(1); }
  registra({ cmd: 'ver', uids: us.map((r) => r.uid) });
  for (const r of us) console.log(`${r.uid} | ${r.name} | ${r.fn}\n  ${r.preview ? join(ROOT, r.preview) : '(sem prévia)'}`);
  console.log('\nAbra cada imagem (ferramenta de leitura de imagem) antes de decidir: à esquerda o estado normal, à direita com o cursor em cima.');
} else if (cmd === 'folhas') {
  // folhas de contato da função (24 componentes numerados por imagem) — para comparar visualmente
  const fn = flag('fn'); if (!fn) { console.error('uso: atlas-find folhas --fn="<função>"'); process.exit(1); }
  const dirF = join(ROOT, 'catalogo/folhas'), sl = norm(fn).replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fs = await import('node:fs'); const list = fs.existsSync(dirF) ? fs.readdirSync(dirF).filter((f) => f.startsWith(sl + '-') && f.endsWith('.webp')).sort() : [];
  if (!list.length) { console.error(`sem folhas para "${fn}" (funções: atlas-find facets)`); process.exit(1); }
  registra({ cmd: 'folha', fn });
  for (const f of list) console.log(`${join(dirF, f)}\n  números → uids: ${join(dirF, f.replace(/\.webp$/, '.md'))}`);
  console.log('\nAbra as imagens, anote os números que interessam e leia o .md correspondente para obter os uids.');
} else if (cmd === 'facets') {
  const by = (k) => Object.entries(rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([x, n]) => `${x} (${n})`).join(' · ');
  console.log(`apps: ${by('app')}\n\nfunções: ${by('fn')}\n\nbibliotecas: ${by('lib')}\n\nstacks: ${by('stack')}`);
} else {
  console.log('uso: atlas-find find <termos> [--app=] [--fn=] [--lib=] [--stack=react|html] [--profile=compartilhavel] [--offline] [--limit=15] [--json]\n     atlas-find code <uid> [--max=60000]\n     atlas-find ver <uid> [uid…]                 (caminho das prévias para olhar)\n     atlas-find folhas --fn="<função>"           (folhas de prévias numeradas da função)\n     atlas-find facets\n     atlas-find survey "<necessidade 1>; <necessidade 2>"   (pesquisa em TODOS os tipos de aplicação)\n     atlas-find coverage                        (mapa completo tipos × funções)\n     atlas-find plan init "<projeto>" | plan status | plan verify   (mapa de decisões obrigatório antes de codar)');
}
