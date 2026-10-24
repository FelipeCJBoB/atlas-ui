#!/usr/bin/env node
// Prévias para a IA escolher componentes olhando: 1 imagem por componente (estado normal | com o cursor em cima)
// e folhas de contato numeradas por função.
//   node build/previas.mjs   (entrada: out/catalog.full.json + capturas de `node build/qa.mjs <html> --shots --frames=1`)
//   → previews/<lib>/<id>.webp · catalogo/folhas/<função>-NN.webp (+ .md com número → uid)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { FNS } from './taxonomy.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SH = join(ROOT, 'out/qa/shots'), PV = join(ROOT, 'previews'), FO = join(ROOT, 'catalogo/folhas');
const cat = JSON.parse(readFileSync(join(ROOT, 'out/catalog.full.json'), 'utf8'));
const shot = (uid, s = '') => join(SH, uid.replace(/[:/]/g, '__') + s + '.jpg');
export const previewRel = (uid) => { const [lib, ...r] = uid.split(':'); return `previews/${lib}/${r.join(':').replace(/[/:]/g, '__')}.webp`; };
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const W = 300, H = 190, BG = '#0b0b0d';
// recorta o fundo liso (palco largo, componente pequeno) e encaixa em W×H
async function painel(src) {
  if (!src || !existsSync(src)) return sharp({ create: { width: W, height: H, channels: 3, background: '#2a0d12' } }).png().toBuffer();
  const m = await sharp(src).metadata();
  const cut = await sharp(src).extract({ left: 0, top: 0, width: m.width, height: Math.floor(m.height * 0.9) }).toBuffer();
  const t = await sharp(cut).trim({ threshold: 18 }).extend({ top: 12, bottom: 12, left: 12, right: 12, background: BG }).toBuffer().catch(() => cut);
  return sharp(t).resize(W, H, { fit: 'contain', background: BG }).png().toBuffer();
}
const rotulo = (txt, w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="18"><rect width="100%" height="100%" fill="#000"/><text x="6" y="13" font-family="monospace" font-size="11" fill="#a1a1aa">${esc(txt)}</text></svg>`);

// ── 1) prévia por componente
let feitos = 0, sem = 0, i = 0;
const fila = cat.filter((e) => !existsSync(join(ROOT, previewRel(e.uid))) || process.argv.includes('--refazer'));
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < fila.length) {
    const e = fila[i++], out = join(ROOT, previewRel(e.uid));
    if (!existsSync(shot(e.uid))) { sem++; continue; }
    const [a, b] = await Promise.all([painel(shot(e.uid)), painel(existsSync(shot(e.uid, '.f1')) ? shot(e.uid, '.f1') : shot(e.uid))]);
    mkdirSync(join(out, '..'), { recursive: true });
    await sharp({ create: { width: W * 2 + 4, height: H + 18, channels: 3, background: '#27272a' } })
      .composite([{ input: rotulo('normal', W), top: 0, left: 0 }, { input: rotulo('com cursor em cima', W), top: 0, left: W + 4 }, { input: a, top: 18, left: 0 }, { input: b, top: 18, left: W + 4 }])
      .webp({ quality: 70 }).toFile(out);
    feitos++;
  }
}));
console.log(`prévias: ${feitos} novas, ${sem} sem captura (rode qa --shots --frames=1 para elas)`);

// ── 2) folhas de contato por função (4×6, numeradas), usando o painel "com cursor"
rmSync(FO, { recursive: true, force: true }); mkdirSync(FO, { recursive: true });
const COLS = 4, ROWS = 6, TW = 300, TH = 190 + 18, per = COLS * ROWS;
const indice = [];
for (const fn of FNS) {
  const L = cat.filter((e) => e.fn === fn && existsSync(join(ROOT, previewRel(e.uid)))).sort((a, b) => a.app.localeCompare(b.app) || a.lib.localeCompare(b.lib) || a.name.localeCompare(b.name));
  if (!L.length) continue;
  for (let s = 0; s * per < L.length; s++) {
    const part = L.slice(s * per, (s + 1) * per), comps = [], linhas = [];
    for (const [k, e] of part.entries()) {
      const n = s * per + k + 1, x = (k % COLS) * (TW + 6), y = Math.floor(k / COLS) * (TH + 6);
      const img = await sharp(join(ROOT, previewRel(e.uid))).extract({ left: W + 4, top: 18, width: W, height: H }).toBuffer();
      comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="18"><rect width="100%" height="100%" fill="#000"/><text x="4" y="13" font-family="monospace" font-size="12" fill="#fde047">${n}</text><text x="34" y="13" font-family="monospace" font-size="11" fill="#e4e4e7">${esc(e.name.slice(0, 34))}</text></svg>`), left: x, top: y }, { input: img, left: x, top: y + 18 });
      linhas.push(`| ${n} | ${e.name.replace(/\|/g, '/')} | \`${e.uid}\` | ${e.app} |`);
    }
    const nm = `${slug(fn)}-${String(s + 1).padStart(2, '0')}`;
    await sharp({ create: { width: COLS * (TW + 6), height: Math.ceil(part.length / COLS) * (TH + 6), channels: 3, background: '#3f3f46' } }).composite(comps).webp({ quality: 72 }).toFile(join(FO, nm + '.webp'));
    writeFileSync(join(FO, nm + '.md'), `# ${fn} — folha ${s + 1}\n\n![](${nm}.webp)\n\n| nº | nome | uid | tipo de aplicação |\n|---|---|---|---|\n${linhas.join('\n')}\n`);
    indice.push(`- [${fn} · folha ${s + 1}](${nm}.md) — itens ${s * per + 1}–${s * per + part.length}`);
  }
}
writeFileSync(join(FO, 'README.md'), `# Folhas de prévias (por função)\n\nCada folha mostra até 24 componentes com o cursor em cima, numerados. O \`.md\` de cada folha liga número → uid.\n\n${indice.join('\n')}\n`);
console.log(`folhas: ${indice.length} → catalogo/folhas/`);
