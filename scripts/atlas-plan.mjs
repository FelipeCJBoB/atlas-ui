// Cobertura obrigatória do Atlas: pesquisa em TODOS os tipos de aplicação, mapa de decisão por tipo/função e verificação.
//   atlas-find survey "<necessidade 1>; <necessidade 2>; …" [--stack=] [--offline] [--profile=] [--per=3]
//   atlas-find coverage                       mapa completo: tipos de aplicação × funções, com contagens
//   atlas-find plan init "<descrição do projeto>"   cria .atlas/cobertura.md com TODAS as linhas (tipos e funções) para decidir
//   atlas-find plan status | plan verify      mostra pendências / confere o mapa e o histórico de buscas (só então liberado para codar)
// O histórico de buscas fica em ./.atlas/log.jsonl (pasta do projeto onde o comando roda; ATLAS_NOLOG=1 desliga; ATLAS_WORK muda a pasta).
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const dir = () => resolve(process.env.ATLAS_WORK || join(process.cwd(), '.atlas'));
export function registra(e) {
  if (process.env.ATLAS_NOLOG) return;
  try { mkdirSync(dir(), { recursive: true }); appendFileSync(join(dir(), 'log.jsonl'), JSON.stringify({ t: Date.now(), ...e }) + '\n'); } catch (err) { /* sem log: o comando continua */ }
}
const lerLog = () => { const f = join(dir(), 'log.jsonl'); return existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean) : []; };
const uniq = (a) => [...new Set(a)];

export async function run(cmd, ctx) {
  const { rows, args, flag, rest, norm, tokens, score, filtered } = ctx;
  const APPS = uniq(rows.map((r) => r.app)).sort((a, b) => rows.filter((r) => r.app === b).length - rows.filter((r) => r.app === a).length);
  const FNS = uniq(rows.map((r) => r.fn)).sort((a, b) => rows.filter((r) => r.fn === b).length - rows.filter((r) => r.fn === a).length);
  const catUid = new Map(rows.map((r) => [r.uid, r]));
  const linha = (r) => `${r.uid}  | ${r.name} | ${r.fn} | ${r.stack}${r.share ? '' : ',pessoal'} | ${r.license}${r.flags.length ? ' | ⚠' + r.flags.join(',') : ''}`;
  const buscar = (txt, pool) => { const toks = tokens(txt); return toks.length ? pool.map((r) => ({ r, s: score(r, toks) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s) : []; };
  const diverso = (res, n) => { const por = {}, out = []; for (const x of res) { por[x.r.lib] = (por[x.r.lib] || 0) + 1; if (por[x.r.lib] <= 2) out.push(x); if (out.length >= n) break; } return out; };

  if (cmd === 'coverage') {
    console.log(`MAPA COMPLETO DO ATLAS: ${rows.length} componentes · ${APPS.length} tipos de aplicação · ${FNS.length} funções\n`);
    for (const a of APPS) {
      const fn = {}; for (const r of rows.filter((x) => x.app === a)) fn[r.fn] = (fn[r.fn] || 0) + 1;
      console.log(`■ ${a} (${rows.filter((x) => x.app === a).length}): ` + Object.entries(fn).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(' · '));
    }
    console.log(`\nFunções (total): ` + FNS.map((f) => `${f} ${rows.filter((r) => r.fn === f).length}`).join(' · '));
    return;
  }

  if (cmd === 'survey') {
    const needs = rest.join(' ').split(/[;\n]/).map((s) => s.trim()).filter(Boolean), per = +flag('per', 3);
    if (!needs.length) { console.error('uso: atlas-find survey "<necessidade 1>; <necessidade 2>; …"'); process.exit(1); }
    const pool = filtered(), toques = new Set();
    for (const need of needs) {
      const res = buscar(need, pool), porApp = {};
      for (const x of res) (porApp[x.r.app] ||= []).push(x);
      console.log(`\n══ "${need}" — ${res.length} resultados em ${Object.keys(porApp).length} de ${APPS.length} tipos de aplicação`);
      const fnsHit = new Set(), appsHit = [];
      for (const a of APPS) {
        const L = porApp[a];
        if (!L) { console.log(`  ○ ${a}: nenhum resultado`); continue; }
        appsHit.push(a);
        const fnc = {}; for (const x of L) { fnc[x.r.fn] = (fnc[x.r.fn] || 0) + 1; fnsHit.add(x.r.fn); }
        console.log(`  ● ${a}: ${L.length} resultados · funções: ${Object.entries(fnc).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([k, n]) => k + ' ' + n).join(', ')}`);
        for (const x of diverso(L, per)) console.log(`      ${linha(x.r)}`);
        toques.add(a);
      }
      registra({ cmd: 'survey', q: need, apps: APPS, appsHit, fns: [...fnsHit] });
    }
    console.log(`\nPesquisa feita em TODOS os ${APPS.length} tipos de aplicação. Próximo passo: para cada necessidade/função que o projeto usa, rode`);
    console.log(`  atlas-find find "<termo>" --app="<tipo>" --fn="<função>" --limit=12   (aprofunde onde houve resultados em mais de um tipo)`);
    console.log(`  atlas-find plan init "<descrição do projeto>"   (mapa de decisões) e depois  atlas-find plan verify`);
    return;
  }

  if (cmd === 'plan') {
    const sub = rest[0], arq = join(dir(), 'cobertura.md');
    if (sub === 'init') {
      const desc = rest.slice(1).join(' ').trim();
      mkdirSync(dir(), { recursive: true });
      if (existsSync(arq) && !args.includes('--force')) { console.error(`já existe ${arq}. Use --force para recriar (apaga as decisões).`); process.exit(1); }
      const res = desc ? buscar(desc, filtered()).slice(0, 300) : [], pa = {}, pf = {};
      for (const x of res) { pa[x.r.app] = (pa[x.r.app] || 0) + x.s; pf[x.r.fn] = (pf[x.r.fn] || 0) + x.s; }
      const rank = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k).join(' · ');
      const tab = (nome, lista, col) => `## ${nome}\n| ${col} | Status | Candidatos (uids; mín. 3, de 2+ bibliotecas) | Escolhido (uid) | Motivo (obrigatório se DESCARTAR) |\n|---|---|---|---|---|\n` + lista.map((x) => `| ${x} | PENDENTE | | | |`).join('\n') + '\n';
      const md = `# Mapa de cobertura do Atlas\n\nProjeto: ${desc || '(descreva)'}\nCriado em: ${new Date().toISOString()}\n${desc ? `Sugestão automática pela descrição — tipos: ${rank(pa) || '—'} · funções: ${rank(pf) || '—'} (é só ponto de partida; decida TODAS as linhas)\n` : ''}\n` +
        `Regras: toda linha precisa de decisão. **USAR** = o projeto precisa: liste ≥3 candidatos de ≥2 bibliotecas, escolha 1 e leia o código dele (\`atlas-find code <uid>\`); precisa de busca com --app= (tipos) ou --fn= (funções) no histórico. **DESCARTAR** = o projeto não precisa: escreva o motivo (≥12 caracteres). Linhas PENDENTE bloqueiam: \`atlas-find plan verify\`.\n\n` +
        tab('Tipos de aplicação', APPS, 'Tipo') + '\n' + tab('Funções do componente', FNS, 'Função');
      writeFileSync(arq, md); console.log(`criado ${arq} com ${APPS.length} tipos e ${FNS.length} funções para decidir.${desc ? `\nSugestão: tipos ${rank(pa)}\n          funções ${rank(pf)}` : ''}`);
      registra({ cmd: 'plan-init', q: desc }); return;
    }
    if (!existsSync(arq)) { console.error(`sem ${arq}. Rode: atlas-find plan init "<descrição do projeto>"`); process.exit(1); }
    const txt = readFileSync(arq, 'utf8'), log = lerLog(), problemas = [], cont = { USAR: 0, DESCARTAR: 0, PENDENTE: 0 };
    const temSurvey = log.some((l) => l.cmd === 'survey');
    const leu = new Set(log.filter((l) => l.cmd === 'code').map((l) => l.uid));
    if (!temSurvey) problemas.push('nenhuma pesquisa "survey" no histórico: rode  atlas-find survey "<necessidades separadas por ;>"');
    const tabelas = txt.split(/^## /m).slice(1);
    for (const t of tabelas) {
      const titulo = t.split('\n')[0].trim(), ehApp = /^Tipos/.test(titulo), lista = ehApp ? APPS : FNS;
      for (const ln of t.split('\n').filter((l) => l.startsWith('|') && !/^\|[-\s|]+\|?$/.test(l))) {
        const c = ln.split('|').slice(1, -1).map((x) => x.trim()); const nome = c[0];
        if (!lista.includes(nome)) continue;
        const st = (c[1] || '').toUpperCase(), cands = (c[2] || '').match(/[a-z0-9_-]+:[^\s,;|]+/gi) || [], esc = (c[3] || '').trim(), motivo = (c[4] || '').trim();
        const p = (m) => problemas.push(`${ehApp ? 'tipo' : 'função'} "${nome}": ${m}`);
        if (st !== 'USAR' && st !== 'DESCARTAR') { cont.PENDENTE++; p('sem decisão (PENDENTE)'); continue; }
        cont[st]++;
        if (st === 'DESCARTAR') { if (motivo.length < 12) p('DESCARTAR sem motivo (≥12 caracteres)'); continue; }
        const rs = cands.map((u) => catUid.get(u)); const inex = cands.filter((u, i) => !rs[i]);
        if (inex.length) p(`uid inexistente no catálogo: ${inex.join(', ')}`);
        const ok = rs.filter(Boolean), disp = rows.filter((r) => (ehApp ? r.app === nome : r.fn === nome)).length;
        const minimo = Math.min(3, disp), minLib = Math.min(2, uniq(rows.filter((r) => (ehApp ? r.app === nome : r.fn === nome)).map((r) => r.lib)).length);
        if (ok.length < minimo) p(`USAR precisa de ≥${minimo} candidatos válidos (há ${ok.length})`);
        if (uniq(ok.map((r) => r.lib)).length < minLib) p(`candidatos de ≥${minLib} bibliotecas diferentes (há ${uniq(ok.map((r) => r.lib)).length})`);
        if (!esc || !catUid.get(esc)) p('falta o "Escolhido" (uid existente)'); else if (!leu.has(esc)) p(`o código do escolhido (${esc}) não foi lido: rode  atlas-find code ${esc}`);
        const prof = log.some((l) => l.cmd === 'find' && (ehApp ? norm(l.app || '') === norm(nome) : norm(l.fn || '') === norm(nome)));
        if (!prof) p(`sem busca aprofundada no histórico: rode  atlas-find find "<termo>" ${ehApp ? '--app=' : '--fn='}"${nome}"`);
      }
    }
    const total = APPS.length + FNS.length, decididas = cont.USAR + cont.DESCARTAR;
    if (sub === 'status') { console.log(`${decididas}/${total} linhas decididas (USAR ${cont.USAR} · DESCARTAR ${cont.DESCARTAR} · PENDENTE ${total - decididas})`); problemas.slice(0, 25).forEach((x) => console.log(' - ' + x)); return; }
    if (sub === 'verify') {
      if (decididas < total) problemas.unshift(`${total - decididas} linha(s) ainda PENDENTE`);
      if (problemas.length) { console.log(`COBERTURA INCOMPLETA — ${problemas.length} pendência(s):`); problemas.slice(0, 60).forEach((x) => console.log(' - ' + x)); console.log('\nResolva e rode de novo: atlas-find plan verify. NÃO escreva código do projeto antes de "COBERTURA OK".'); process.exit(1); }
      writeFileSync(join(dir(), 'cobertura.ok'), JSON.stringify({ t: new Date().toISOString(), sha: createHash('sha256').update(txt).digest('hex').slice(0, 16), USAR: cont.USAR, DESCARTAR: cont.DESCARTAR }) + '\n');
      console.log(`COBERTURA OK — ${cont.USAR} USAR, ${cont.DESCARTAR} DESCARTAR, ${total} linhas decididas. Pode implementar.`); return;
    }
    console.error('uso: atlas-find plan init "<descrição>" | plan status | plan verify'); process.exit(1);
  }
}
