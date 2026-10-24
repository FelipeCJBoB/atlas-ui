// Baixa (uma vez) as imagens remotas encontradas no build, otimiza com sharp e guarda em cache/images.json (versionado).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ROOT } from './common.mjs';

const CACHE = join(ROOT, 'cache/images.json');
export const loadCache = () => (existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {});

// Hosts mortos (404 no original): gera um placeholder SVG determinístico (avatar/produto/blog), para os demos não ficarem quebrados.
const DEAD = /^https:\/\/bundui-images\.netlify\.app\/([a-z]+)\/([\w-]+)\.\w+$/;
function placeholder(kind, name) {
  let h = 0; for (const ch of kind + name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = h % 360, b = (a + 48) % 360;
  const body = kind === 'avatars'
    ? `<rect width="256" height="256" fill="hsl(${a} 55% 42%)"/><circle cx="128" cy="100" r="46" fill="hsl(${b} 60% 82%)"/><path d="M36 256c4-58 44-92 92-92s88 34 92 92z" fill="hsl(${b} 60% 82%)"/>`
    : `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a} 60% 55%)"/><stop offset="1" stop-color="hsl(${b} 65% 30%)"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><circle cx="470" cy="150" r="90" fill="hsl(${b} 80% 80% / .25)"/><circle cx="170" cy="360" r="130" fill="hsl(${a} 80% 75% / .2)"/>`;
  const [w, hh] = kind === 'avatars' ? [256, 256] : [640, 480];
  return { mime: 'image/svg+xml', b64: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}">${body}</svg>`).toString('base64') };
}

export async function ensureImages(urlMap, { offline = false } = {}) {
  const cache = loadCache();
  for (const u of urlMap.keys()) { const m = u.match(DEAD); if (m) cache[u] = placeholder(m[1], m[2]); }
  // Atlas 1 → mesmo formato; reaproveita
  const legacy = join(ROOT, 'legacy/atlas1/images.json');
  if (existsSync(legacy)) for (const [u, v] of Object.entries(JSON.parse(readFileSync(legacy, 'utf8')))) if (!(u in cache)) cache[u] = v;
  const todo = [...urlMap.keys()].filter((u) => !(u in cache));
  let ok = 0, fail = 0;
  const encode = async (buf, ct, u) => {
    if (ct.includes('svg') || /\.svg(\?|$)/.test(u)) return { mime: 'image/svg+xml', b64: buf.toString('base64') };
    const img = sharp(buf).rotate(); const meta = await img.metadata();
    const keepAlpha = meta.hasAlpha && /png|webp|gif/.test(ct + u);
    const out = keepAlpha ? await img.resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
      : await img.resize({ width: 720, withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true }).toBuffer();
    return { mime: keepAlpha ? 'image/webp' : 'image/jpeg', b64: out.toString('base64') };
  };
  const one = async (u) => {
    try {
      if (u.startsWith('local:')) { cache[u] = await encode(readFileSync(u.slice(6)), '', u); ok++; return; }
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch(u, { signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' });
      clearTimeout(to);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      cache[u] = await encode(Buffer.from(await r.arrayBuffer()), (r.headers.get('content-type') || '').split(';')[0], u);
      ok++;
    } catch (e) { if (!/HTTP 5\d\d|abort|timeout|fetch failed/i.test(String(e.message || e))) cache[u] = null; fail++; console.log('  imagem falhou:', u.slice(0, 90), String(e.message || e)); }
  };
  if (!offline) { let i = 0; await Promise.all(Array.from({ length: 6 }, async () => { while (i < todo.length) await one(todo[i++]); })); }
  if (todo.length) writeFileSync(CACHE, JSON.stringify(cache));
  return { cache, ok, fail, fetched: todo.length };
}

// Mantém no cache só as imagens que o build full usa (o cache é versionado: o build não depende de rede).
export function podarCache(cache, chaves) {
  const out = {}; for (const k of chaves) if (k in cache) out[k] = cache[k];
  writeFileSync(CACHE, JSON.stringify(out));
  return Object.keys(out).length;
}
