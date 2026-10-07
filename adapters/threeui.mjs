// Adapter ThreeUI Community: o catálogo é uma lista (READY_SHADERS) de renderers com variantes — não há arquivos de demo.
// Passos: (1) empacota src/data/shaders.tsx em Node com stubs (react.lazy falso, ../shaders/* vazios) para ler os metadados;
// (2) gera meta.json + threeui.lib.tsx próprio (um carregador por entrada) — build.mjs não usa o pipeline "gen" para adaptadores `custom`.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, TMP, vendorDir } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const custom = true;

export async function generate(id) {
  const vd = vendorDir(id); mkdirSync(TMP, { recursive: true });
  const entry = join(vd, 'src/data/shaders.tsx');
  const text = readFileSync(entry, 'utf8');
  const stub = {
    name: 'threeui-stub',
    setup(b) {
      b.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'tu' }));
      b.onResolve({ filter: /^\.\.\/shaders\// }, (a) => ({ path: a.path, namespace: 'tu-empty' }));
      b.onLoad({ filter: /.*/, namespace: 'tu' }, () => ({ contents: 'module.exports={lazy:(fn)=>({__p:fn()})}', loader: 'js' }));
      b.onLoad({ filter: /.*/, namespace: 'tu-empty' }, (a) => ({ contents: `module.exports=new Proxy({},{get:(t,k)=>k==='__esModule'?true:({__path:${JSON.stringify(a.path)},__name:k})})`, loader: 'js' }));
    },
  };
  const out = join(TMP, 'threeui-data.cjs');
  const r = await build({ entryPoints: [entry], bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', logLevel: 'error', plugins: [stub], loader: { '.json': 'json' } });
  writeFileSync(out, r.outputFiles[0].text);
  const { READY_SHADERS } = createRequire(import.meta.url)(out);
  // renderer → arquivo-fonte: cada stub de módulo carrega o caminho de onde veio
  const srcOf = new Map();
  for (const sh of READY_SHADERS.filter((x) => x.component)) {
    const c = sh.component; const path = c.__p ? (await c.__p)?.default?.__path : c.__path;
    srcOf.set(sh.id, path);
  }
  const fileFor = (p) => { if (!p) return null; const base = 'src/' + p.replace(/^\.\.\//, ''); return ['.tsx', '.ts', '/index.tsx'].map((e) => base + e).find((f) => existsSync(join(vd, f))) || null; };

  const meta = [], loaders = [];
  for (const s of READY_SHADERS.filter((x) => !x.variantOf && x.component)) {
    const f = fileFor(srcOf.get(s.id));
    const files = [f, 'src/shaders/community.css'].filter(Boolean);
    const fullHtml = /full html/i.test(s.runtime || '');
    const vs = s.variants?.length ? s.variants : [null];
    for (const v of vs) {
      const eid = v ? `${s.id}/${v.id}` : s.id;
      const e = { uid: `${id}:${eid}`, lib: id, id: eid, category: s.category, name: v ? `${s.label} · ${v.label}` : s.label, desc: (s.description || '').slice(0, 180), layout: 'frame', kind: 'demo', wide: true, files, deps: [], flags: fullHtml ? ['needs-files'] : [] };
      if (v && v.props && Object.keys(v.props).length) e.props = v.props;
      meta.push(applyOverride(e)); loaders.push(`${JSON.stringify(e.uid)}:()=>Promise.resolve({default:W(${JSON.stringify(s.id)})})`);
    }
  }
  mkdirSync(join(ROOT, 'src/gen'), { recursive: true });
  writeFileSync(join(ROOT, `src/gen/${id}.meta.json`), JSON.stringify(meta));
  writeFileSync(join(ROOT, `src/gen/${id}.lib.tsx`), `// @ts-nocheck — gerado por adapters/threeui.mjs\nimport { READY_SHADERS } from '../../vendor/${id}/src/data/shaders';\nimport { createElement } from 'react';\nconst BY = Object.fromEntries(READY_SHADERS.map((s) => [s.id, s]));\nconst WC = {};\nconst W = (id) => WC[id] ||= (p) => createElement(BY[id].component, p);\n((window).__ATLAS_REG ||= {})[${JSON.stringify(id)}] = {\n${loaders.join(',\n')}\n};\n`);
  return meta.filter((m) => !m.exclude).length;
}
