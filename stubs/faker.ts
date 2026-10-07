// Embrulha o faker: date.between com from > to (exemplos dependentes do dia de hoje) vira intervalo válido.
import * as real from '../node_modules/@faker-js/faker/dist/index.js';
export * from '../node_modules/@faker-js/faker/dist/index.js';
const f: any = (real as any).faker;
for (const k of ['between', 'betweens']) {
  const o = f.date[k]?.bind(f.date);
  if (!o) continue;
  f.date[k] = (opts: any) => {
    try { return o(opts); } catch (e) {
      if (opts && opts.from != null && opts.to != null) return o({ ...opts, from: opts.to, to: opts.from });
      throw e;
    }
  };
}

// imagens aleatórias do faker (avatares/fotos remotos) → SVG embutido: offline e determinístico
const svg = (w: number, h: number, seed: string) => {
  let n = 0; for (const c of seed) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  const a = n % 360, b = (a + 50) % 360;
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${a} 55% 55%)'/><stop offset='1' stop-color='hsl(${b} 60% 40%)'/></linearGradient></defs><rect width='${w}' height='${h}' fill='url(#g)'/><circle cx='${w / 2}' cy='${h * 0.38}' r='${Math.min(w, h) * 0.17}' fill='rgba(255,255,255,.55)'/><ellipse cx='${w / 2}' cy='${h * 0.85}' rx='${Math.min(w, h) * 0.3}' ry='${Math.min(w, h) * 0.26}' fill='rgba(255,255,255,.45)'/></svg>`);
};
const rnd = () => String(f.number.int({ min: 0, max: 99999 }));
const wrap = (obj: any, k: string, fn: (...a: any[]) => string) => { if (obj && typeof obj[k] === 'function') obj[k] = fn; };
for (const o of [f.image, f.internet]) {
  wrap(o, 'avatar', () => svg(128, 128, rnd()));
  wrap(o, 'avatarGitHub', () => svg(128, 128, rnd()));
  wrap(o, 'personPortrait', () => svg(256, 256, rnd()));
}
wrap(f.image, 'url', (opts: any = {}) => svg(opts.width || 640, opts.height || 480, rnd()));
wrap(f.image, 'urlPicsumPhotos', (opts: any = {}) => svg(opts.width || 640, opts.height || 480, rnd()));
wrap(f.image, 'urlLoremFlickr', (opts: any = {}) => svg(opts.width || 640, opts.height || 480, rnd()));
wrap(f.image, 'urlPlaceholder', (opts: any = {}) => svg(opts.width || 640, opts.height || 480, rnd()));
