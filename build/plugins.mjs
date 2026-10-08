import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import sharp from 'sharp';
import { ROOT, lock, applyPatches, vendorDir, walk } from './common.mjs';
import { offlineHtml } from './offline-html.mjs';

const HOSTS = 'images\\.unsplash\\.com|plus\\.unsplash\\.com|assets\\.lummi\\.ai|avatar\\.vercel\\.sh|upload\\.wikimedia\\.org|seeklogo\\.com|sm\\.ign\\.com|avatars\\.githubusercontent\\.com|github\\.com/[\\w.-]+\\.png|ik\\.imagekit\\.io|img\\.logo\\.dev|cdn\\.cosmos\\.so|images\\.beta\\.cosmos\\.so|i\\.scdn\\.co|randomuser\\.me|picsum\\.photos|fastly\\.picsum\\.photos|pbs\\.twimg\\.com|public\\.blob\\.vercel-storage\\.com|cdn\\.simpleicons\\.org|placehold\\.co|bundui-images\\.netlify\\.app|m\\.media-amazon\\.com|pkmncards\\.com|flagcdn\\.com|images\\.pexels\\.com|i\\.pravatar\\.cc|api\\.dicebear\\.com|ui-avatars\\.com';
export const URL_RE = new RegExp(`https?:\\/\\/(?:${HOSTS})[^"'\`\\s)\\\\]*|https?:\\/\\/[^"'\`\\s)\\\\]+\\.(?:png|jpe?g|webp|gif|svg|avif)(?:\\?[^"'\`\\s)\\\\]*)?`, 'g');

const LOCAL_RE = /(["'`])(\/(?!\/)[\w@./%-]+\.(?:png|jpe?g|webp|gif|svg|avif))(?:\?[^"'`$]*)?\1/g;

export const fontsUsed = new Set();
const _findCache = {};
function findIdx(id, dir) {
  const k = id + ':' + dir; if (_findCache[k]) return _findCache[k];
  const m = new Map();
  for (const f of walk(join(vendorDir(id), dir))) { const mm = f.match(/([^/\\]+)\.(tsx?|jsx?)$/); if (mm && !/\.(test|spec|stories)\./.test(f) && !m.has(mm[1])) m.set(mm[1], f); }
  return (_findCache[k] = m);
}

export function atlasPlugin({ urls, libIds }) {
  return {
    name: 'atlas',
    setup(b) {
      // aliases por biblioteca ('@/…', '@repo/…'): lock.aliases = [[prefixo, pasta relativa ao vendor/<id>]]
      b.onResolve({ filter: /^@(\/|[a-z0-9-]+\/)/ }, async (a) => {
        const m = a.importer.split(sep).join('/').match(/\/vendor\/([^/]+)\//);
        if (!m || !lock[m[1]]) return null;
        const id = m[1];
        const aliases = lock[id].aliases || [['@/', '']];
        for (const [from, to] of [...aliases].sort((x, y) => y[0].length - x[0].length)) {
          if (!a.path.startsWith(from)) continue;
          const r = await b.resolve('./' + join(to, a.path.slice(from.length)).replace(/\\/g, '/'), { resolveDir: vendorDir(id), kind: a.kind, importer: a.importer });
          if (!r.errors.length) return r;
        }
        // aliasFind: [[prefixo, pasta]] → procura <nome>.tsx recursivamente na pasta (ex.: @/components/motiq/<nome>)
        for (const [from, dir] of lock[id].aliasFind || []) {
          if (!a.path.startsWith(from)) continue;
          const idx = findIdx(id, dir); const hit = idx.get(a.path.slice(from.length));
          if (hit) return { path: hit };
        }
        return null;   // pacote npm normal (@radix-ui/…)
      });
      // Vite `?raw` (importa o arquivo como texto)
      b.onResolve({ filter: /\?raw$/ }, (a) => (a.namespace === 'file' && !/constants\/code\//.test(a.path) ? { path: join(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' } : null));
      b.onLoad({ filter: /.*/, namespace: 'raw' }, async (a) => {
        let t = readFileSync(a.path, 'utf8');
        const vm = a.path.split(sep).join('/').match(/\/(?:vendor|src\/gen\/snips)\/([^/]+)\//);   // snips = trechos extraídos por adapters Atlas Low
        if (vm && lock[vm[1]]?.offlineHtml && /\.html?$/.test(a.path)) {
          t = await offlineHtml(t);   // CDNs → embutido (build/offline-html.mjs)
          t = t.replace(URL_RE, (u) => {   // imagens remotas da página → mesma tabela de imagens embutidas dos .tsx
            if (/\.(mp4|webm|mov|m4v|mp3|ogg|wav)(\?|$)/i.test(u)) return u;
            if (!urls.has(u)) urls.set(u, urls.size);
            return `@@IMGH:${urls.get(u)}@@`;
          });
        }
        return { contents: t, loader: 'text' };
      });
      b.onResolve({ filter: /^@faker-js\/faker$/ }, (a) => a.importer.endsWith('stubs/faker.ts') ? null : { path: join(ROOT, 'stubs/faker.ts') });
      // pkgAlias por biblioteca: troca um pacote npm por outro (ex.: Kibo usa @tanstack/react-table v8, ReUI v9)
      b.onResolve({ filter: /^(@tanstack\/react-table|react-resizable-panels)$/ }, async (a) => {
        const m = a.importer.split(sep).join('/').match(/\/vendor\/([^/]+)\//);
        const to = m && lock[m[1]]?.pkgAlias?.[a.path];
        if (!to) return null;
        return b.resolve(to, { resolveDir: ROOT, kind: a.kind, importer: a.importer });
      });
      // stubs por biblioteca (lock.stubs): troca wrappers do site (Chakra, abas, painéis) por versões mínimas
      b.onResolve({ filter: /(^@chakra-ui\/react$|components\/(common|code|context|setup)\/|hooks\/(useComponentProps|useForceRerender)$|constants\/code\/)/ }, (a) => {
        const m = a.importer.split(sep).join('/').match(/\/vendor\/([^/]+)\//);
        const st = m && lock[m[1]]?.stubs; if (!st) return null;
        if (a.path === '@chakra-ui/react') return { path: join(ROOT, st.chakra) };
        if (!new RegExp(st.match).test(a.path)) return null;
        if (/constants\/code\//.test(a.path)) return { path: a.path.startsWith('@/') ? join(vendorDir(m[1]), a.path.slice(2)) : join(a.resolveDir || dirname(a.importer), a.path), namespace: 'libstubcode' };
        return { path: a.path.split('/').pop(), namespace: 'libstub', pluginData: { id: m[1] } };
      });
      // strings de código de exemplo do site (importam ?raw): só os nomes exportados, vazios
      b.onLoad({ filter: /.*/, namespace: 'libstubcode' }, (a) => {
        const f = ['.js', '.jsx', '.ts', '.tsx'].map((e) => a.path + e).find((x) => existsSync(x));
        const names = f ? [...readFileSync(f, 'utf8').matchAll(/export const (\w+)/g)].map((x) => x[1]) : [];
        return { contents: names.map((n) => `export const ${n} = {};`).join('\n') || 'export {}', loader: 'js' };
      });
      b.onLoad({ filter: /.*/, namespace: 'libstub' }, (a) => {
        const st = lock[a.pluginData.id].stubs, f = join(ROOT, st.preview);
        const names = [...readFileSync(f, 'utf8').matchAll(/export (?:const|function) (\w+)/g)].map((x) => x[1]);
        const def = names.includes(a.path) ? `export { ${a.path} as default } from ${JSON.stringify(f)};` : '';
        return { contents: `export * from ${JSON.stringify(f)};\n${def}`, loader: 'js', resolveDir: ROOT };
      });
      // next/font/google: gera um módulo por importador com exatamente as fontes importadas
      b.onResolve({ filter: /^next\/font\/google$/ }, (a) => ({ path: a.importer, namespace: 'nextfont' }));
      b.onLoad({ filter: /.*/, namespace: 'nextfont' }, (a) => {
        const t = readFileSync(a.path, 'utf8'); const out = [];
        for (const m of t.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']next\/font\/google["']/g)) for (const part of m[1].split(',')) {
          const nm = part.trim().split(/\s+as\s+/)[0]; if (!nm) continue; fontsUsed.add(nm);
          const fam = nm.replace(/_/g, ' ');
          out.push(`export const ${nm} = () => ({ className: '', variable: '', style: { fontFamily: "'${fam}', '${fam} Variable', system-ui, sans-serif" } });`);
        }
        return { contents: out.join('\n') || 'export {}', loader: 'js' };
      });
      b.onResolve({ filter: /^next-auth\/react$/ }, () => ({ path: join(ROOT, 'stubs/next-auth.tsx') }));
      b.onResolve({ filter: /^shiki$/ }, () => ({ path: join(ROOT, 'stubs/shiki.ts') }));
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));   // CSS já compilado por biblioteca
      b.onLoad({ filter: /\.(png|jpe?g|webp|gif)$/ }, async (a) => {
        const buf = readFileSync(a.path);
        const meta = await sharp(buf).metadata();
        const vm = a.path.split(sep).join('/').match(/\/vendor\/([^/]+)\//); const asUrl = !!(vm && lock[vm[1]]?.viteAssets);   // libs Vite: import de imagem = string URL
        let out = buf, mime = 'image/' + extname(a.path).slice(1).replace('jpg', 'jpeg');
        if ((meta.width || 0) > 900) { out = await sharp(buf).resize({ width: 900 }).jpeg({ quality: 72 }).toBuffer(); mime = 'image/jpeg'; }
        if (asUrl) return { contents: `export default ${JSON.stringify(`data:${mime};base64,${out.toString('base64')}`)};`, loader: 'js' };
        return { contents: `export default ${JSON.stringify({ src: `data:${mime};base64,${out.toString('base64')}`, width: meta.width, height: meta.height })};`, loader: 'js' };
      });
      // vendor TSX: aplica patches + troca URLs remotas de imagem por @@IMG:n@@
      b.onLoad({ filter: /\.(tsx?|jsx?)$/ }, async (a) => {
        if (a.path.includes('node_modules')) return null;
        const p = a.path.split(sep).join('/');
        const m = p.match(/\/vendor\/([^/]+)\/(.+)$/);
        let t = readFileSync(a.path, 'utf8');
        if (m) t = applyPatches(m[1], m[2], t);
        // Vite `new URL("./x.svg", import.meta.url).href` → data URL embutida
        if (m && /import\.meta\.url/.test(t)) {
          const MT = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', woff2: 'font/woff2', mp3: 'audio/mpeg' };
          const hits = [...t.matchAll(/new URL\(\s*(["'])(\.[^"']+)\1\s*,\s*import\.meta\.url\s*\)(\.href)?/g)];
          for (const h of hits) {
            const f = join(dirname(a.path), h[2]); const ext = extname(f).slice(1).toLowerCase();
            if (!existsSync(f) || !MT[ext]) continue;
            let buf = readFileSync(f), mime = MT[ext];
            if (/^(png|jpe?g|webp)$/.test(ext) && ((await sharp(buf).metadata()).width || 0) > 900) { buf = await sharp(buf).resize({ width: 900 }).jpeg({ quality: 72 }).toBuffer(); mime = 'image/jpeg'; }
            t = t.split(h[0]).join(JSON.stringify(`data:${mime};base64,${buf.toString('base64')}`));
          }
        }
        t = t.replace(URL_RE, (u, off) => {
          if (/\.(mp4|webm|mov|m4v|mp3|ogg|wav)(\?|$)/i.test(u)) return u;   // vídeo/áudio ficam remotos (needs-network)
          if (/ik\.imagekit\.io\/[\w-]+(\/[\w-]+)*$/.test(u)) return u;   // base de URL (sem arquivo): montada em runtime
          if (/\$\{/.test(u) || t.slice(off + u.length, off + u.length + 2) === '${') return u;
          if (!urls.has(u)) urls.set(u, urls.size);
          return `@@IMG:${urls.get(u)}@@`;
        });
        // assets locais de /public referenciados por string ("/img/x.png") → mesma tabela de imagens embutidas
        if (m) t = t.replace(LOCAL_RE, (full, q, pth) => {
          const f = join(vendorDir(m[1]), 'public', decodeURIComponent(pth));
          if (!existsSync(f)) return full;
          const key = 'local:' + f; if (!urls.has(key)) urls.set(key, urls.size);
          return `${q}@@IMG:${urls.get(key)}@@${q}`;
        });
        return { contents: t, loader: /\.[jt]sx$/.test(a.path) ? 'tsx' : 'ts', resolveDir: dirname(a.path) };
      });
    },
  };
}
