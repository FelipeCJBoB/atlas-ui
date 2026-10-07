// Contact sheets das capturas do QA:  node build/montage.mjs <lib> [cols=5] [rows=5]
import { readdirSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
const ROOT = resolve(import.meta.dirname, '..');
const lib = process.argv[2] || 'magicui', cols = +(process.argv[3] || 5), rows = +(process.argv[4] || 5);
const dir = join(ROOT, 'out/qa/shots'), out = join(ROOT, 'out/qa/sheets'); mkdirSync(out, { recursive: true });
const files = readdirSync(dir).filter((f) => f.startsWith(lib + '__')).sort();
const W = 300, H = 190, per = cols * rows;
for (let s = 0; s * per < files.length; s++) {
  const part = files.slice(s * per, (s + 1) * per);
  const comps = await Promise.all(part.map(async (f, i) => {
    const img = await sharp(join(dir, f)).resize(W, H - 16, { fit: 'contain', background: '#18181b' }).toBuffer();
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="16"><rect width="100%" height="100%" fill="#09090b"/><text x="4" y="12" font-family="monospace" font-size="10" fill="#d4d4d8">${f.replace(lib + '__', '').replace('.jpg', '').replace(/&/g, '&amp;')}</text></svg>`);
    const tile = await sharp({ create: { width: W, height: H, channels: 3, background: '#09090b' } }).composite([{ input: label, top: 0, left: 0 }, { input: img, top: 16, left: 0 }]).png().toBuffer();
    return { input: tile, left: (i % cols) * W, top: Math.floor(i / cols) * H };
  }));
  await sharp({ create: { width: cols * W, height: rows * H, channels: 3, background: '#09090b' } }).composite(comps).jpeg({ quality: 80 }).toFile(join(out, `${lib}-${String(s + 1).padStart(2, '0')}.jpg`));
}
console.log(lib, files.length, 'capturas →', Math.ceil(files.length / per), 'folhas');
