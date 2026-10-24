#!/usr/bin/env node
// Folha de comparação original × reescrita (capturas de `node build/qa.mjs <html> --shots --frames=2 --uids=…`):
//   node reescrita/comparar.mjs   → reescrita/comparacao-piloto.webp
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
const ROOT = resolve(import.meta.dirname, '..');
const origem = JSON.parse(readFileSync(join(ROOT, 'reescrita/origem.json'), 'utf8'));
const meta = JSON.parse(readFileSync(join(ROOT, 'src/gen/atlas.meta.json'), 'utf8'));
const shot = (uid, s = '') => join(ROOT, 'out/qa/shots', uid.replace(/[:/]/g, '__') + s + '.jpg');
const W = 260, H = 165, BG = '#0b0b0d';
async function painel(src) {
  if (!existsSync(src)) return sharp({ create: { width: W, height: H, channels: 3, background: '#2a0d12' } }).png().toBuffer();
  const m = await sharp(src).metadata();
  const cut = await sharp(src).extract({ left: 0, top: 0, width: m.width, height: Math.floor(m.height * 0.9) }).toBuffer();
  const t = await sharp(cut).trim({ threshold: 18 }).extend({ top: 10, bottom: 10, left: 10, right: 10, background: BG }).toBuffer().catch(() => cut);
  return sharp(t).resize(W, H, { fit: 'contain', background: BG }).png().toBuffer();
}
const txt = (s, w, c = '#e4e4e7', size = 12) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20"><rect width="100%" height="100%" fill="#000"/><text x="6" y="14" font-family="monospace" font-size="${size}" fill="${c}">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`);
// casa cada reescrita com o original pela pasta do componente que o demo importa
const pares = Object.entries(origem).map(([slug, o]) => {
  const e = meta.find((x) => (x.files || []).some((f) => f.includes(`componentes/${slug}/`)));
  return { slug, orig: o.uid, novo: e?.uid };
}).filter((p) => p.novo);
const comps = [], RW = W * 4 + 30, RH = H + 40;
comps.push({ input: txt('ORIGINAL (normal | cursor em cima)', W * 2 + 10, '#fca5a5'), left: 0, top: 0 }, { input: txt('REESCRITA ATLAS (normal | cursor em cima)', W * 2 + 10, '#86efac'), left: W * 2 + 20, top: 0 });
for (const [i, p] of pares.entries()) {
  const y = 24 + i * RH;
  comps.push({ input: txt(`${p.slug}   ${p.orig}  →  ${p.novo}`, RW, '#fde047', 11), left: 0, top: y });
  const imgs = await Promise.all([painel(shot(p.orig)), painel(shot(p.orig, '.f1')), painel(shot(p.novo)), painel(shot(p.novo, '.f1'))]);
  imgs.forEach((b, k) => comps.push({ input: b, left: k * (W + 6) + (k >= 2 ? 12 : 0), top: y + 20 }));
}
await sharp({ create: { width: RW, height: 24 + pares.length * RH, channels: 3, background: '#3f3f46' } }).composite(comps).webp({ quality: 80 }).toFile(join(ROOT, 'reescrita/comparacao-piloto.webp'));
console.log(`comparação: ${pares.length} pares → reescrita/comparacao-piloto.webp`);
