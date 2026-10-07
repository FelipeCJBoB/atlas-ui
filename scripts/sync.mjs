#!/usr/bin/env node
// Sincroniza vendor/<id>/ a partir de sources.lock.json (commit fixo) e audita licenças.
//   node scripts/sync.mjs [id…] [--update] [--offline]
// Cache dos clones: .cache/src/<id> (ou $ATLAS_SRC_CACHE).
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CACHE = process.env.ATLAS_SRC_CACHE || join(ROOT, '.cache/src');
const lockPath = join(ROOT, 'sources.lock.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const args = process.argv.slice(2);
const update = args.includes('--update');
const ids = args.filter((a) => !a.startsWith('--'));
const run = (c, cwd) => execSync(c, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();

// ── auditoria de licença ────────────────────────────────────────────────
export function classify(text) {
  const t = text.replace(/\s+/g, ' ');
  const commons = /commons clause/i.test(t);
  let spdx = 'UNKNOWN';
  if (/permission is hereby granted, free of charge/i.test(t) && /the software is provided "as is"/i.test(t)) spdx = 'MIT';
  else if (/apache license/i.test(t) && /version 2\.0/i.test(t)) spdx = 'Apache-2.0';
  else if (/gnu (affero )?general public license/i.test(t)) spdx = 'GPL';
  else if (/redistribution and use in source and binary forms/i.test(t)) spdx = 'BSD';
  else if (/isc license|permission to use, copy, modify, and\/or distribute/i.test(t)) spdx = 'ISC';
  return { spdx, commons, spdxFull: commons ? `${spdx} + Commons Clause` : spdx };
}
const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD', 'ISC']);

// glob mínimo: só '*' no último segmento
function expand(base, pattern) {
  if (!pattern.includes('*')) return existsSync(join(base, pattern)) ? [pattern] : [];
  const dir = dirname(pattern), rx = new RegExp('^' + pattern.slice(dir.length + 1).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  const abs = join(base, dir);
  return existsSync(abs) ? readdirSync(abs).filter((f) => rx.test(f) && statSync(join(abs, f)).isFile()).map((f) => join(dir, f)) : [];
}
const count = (d) => { let n = 0; for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? (n += count(p)) : n++; } return n; };

mkdirSync(CACHE, { recursive: true });
const report = [];
for (const [id, s] of Object.entries(lock.sources)) {
  if (ids.length && !ids.includes(id)) continue;
  const dir = join(CACHE, id);
  if (!existsSync(join(dir, '.git'))) { console.log(`↓ clonando ${id}`); run(`git clone --quiet -c core.autocrlf=false -c core.eol=lf ${s.repo} ${JSON.stringify(dir)}`); }
  if (update) { run('git fetch --quiet origin', dir); const head = run('git rev-parse origin/HEAD', dir); s.commit = head; console.log(`↑ ${id} → ${head}`); }
  try { run(`git checkout --quiet ${s.commit}`, dir); } catch { run('git fetch --quiet origin', dir); run(`git checkout --quiet ${s.commit}`, dir); }
  const got = run('git rev-parse HEAD', dir);
  if (got !== s.commit) throw new Error(`${id}: commit ${got} ≠ ${s.commit}`);

  const base = join(dir, s.root || '.');
  const out = join(ROOT, 'vendor', id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const entry of s.copy) {
    const [p, dst] = entry.split('>');            // "origem>destino" permite copiar de fora da raiz (ex.: ../public/fonts>public/fonts)
    const hits = expand(base, p);
    if (!hits.length) console.warn(`  ! ${id}: caminho ausente: ${p}`);
    for (const h of hits) { const to = join(out, dst && !p.includes('*') ? dst : h); mkdirSync(dirname(to), { recursive: true }); cpSync(join(base, h), to, { recursive: true }); }
  }
  // licença: do repo (raiz) ou do app
  const licPath = [join(dir, s.licenseFile), join(base, s.licenseFile)].find(existsSync);
  const licText = licPath ? readFileSync(licPath, 'utf8') : '';
  if (licPath) cpSync(licPath, join(out, 'LICENSE'));
  const v = classify(licText);
  const status = !licText ? 'SEM-LICENCA' : v.spdx === 'UNKNOWN' ? 'DESCONHECIDA' : v.commons ? 'RESTRITA(Commons Clause)' : PERMISSIVE.has(v.spdx) ? 'OK' : 'REVISAR';
  const meta = { id, name: s.name, repo: s.repo, commit: s.commit, license: v.spdxFull, declared: s.license, status, copyright: (licText.match(/Copyright[^\n]*/i) || [''])[0].trim(), files: count(out) };
  writeFileSync(join(out, '.atlas-source.json'), JSON.stringify(meta, null, 2));
  report.push(meta);
  if (status !== 'OK' && !(v.commons && s.license.includes('Commons'))) console.warn(`  ⚠ ${id}: licença ${v.spdxFull} (${status}) — declarada: ${s.license}`);
  if (v.spdx !== (s.license || '').split(' ')[0]) console.warn(`  ⚠ ${id}: declarada '${s.license}' mas detectada '${v.spdxFull}'`);
  console.log(`✓ ${id} @ ${s.commit.slice(0, 8)} — ${meta.files} arquivos — ${v.spdxFull} [${status}]`);
}
if (update) writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
// licenças consolidadas (perfil compartilhável usa isto como lista de atribuições)
mkdirSync(join(ROOT, 'vendor'), { recursive: true });
const all = readdirSync(join(ROOT, 'vendor')).filter((d) => existsSync(join(ROOT, 'vendor', d, '.atlas-source.json'))).map((d) => JSON.parse(readFileSync(join(ROOT, 'vendor', d, '.atlas-source.json'), 'utf8')));
writeFileSync(join(ROOT, 'vendor', 'LICENSES.json'), JSON.stringify(all, null, 2));
