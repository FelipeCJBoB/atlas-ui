import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..');
export const lock = JSON.parse(readFileSync(join(ROOT, 'sources.lock.json'), 'utf8')).sources;
export const vendorDir = (id) => join(ROOT, 'vendor', id);
export const TMP = join(ROOT, 'build/.tmp');

export const walk = (d, out = []) => {
  if (!existsSync(d)) return out;
  for (const f of readdirSync(d).sort()) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};

// ── patches: patches/<id>.json = [{file, find, replace, why}] aplicados em memória no build ──
const patchCache = {};
export function patchesFor(id) {
  if (!patchCache[id]) {
    const p = join(ROOT, 'patches', `${id}.json`);
    patchCache[id] = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : [];
  }
  return patchCache[id];
}
export const patchUsed = new Set();
export function applyPatches(id, relFile, text) {
  for (const [i, p] of patchesFor(id).entries()) {
    if (p.file !== relFile) continue;
    if (!text.includes(p.find)) throw new Error(`patch ${id}#${i} (${p.file}): trecho não encontrado — a lib mudou? ${p.find.slice(0, 60)}`);
    text = text.split(p.find).join(p.replace);
    patchUsed.add(`${id}#${i}`);
  }
  return text;
}
// lê arquivo do vendor já com patches
export const readVendor = (id, rel) => applyPatches(id, rel, readFileSync(join(vendorDir(id), rel), 'utf8'));

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const title = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
