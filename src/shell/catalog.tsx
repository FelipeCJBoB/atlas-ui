import * as React from 'react';
import CATALOG_META from '../gen/catalog.gen.json';

export type Entry = {
  uid: string; app?: string; fn?: string; tags?: string[]; stack?: string; lib: string; id: string; category: string; group?: string; name: string; desc?: string;
  layout: string; noAutoFill?: boolean; kind: 'story' | 'demo'; wide: boolean; files: string[]; deps?: string[]; flags: string[];
  Comp: React.ComponentType; props?: any; export?: string;
};
export type LibMeta = { id: string; name: string; repo: string; commit: string; license: string; status: string; copyright: string; licenseText: string; count?: number; wrap?: string };

function storyComp(mod: any): React.ComponentType | null {
  const meta = mod.default;
  if (!meta) return null;
  const key = mod.Primary ? 'Primary' : Object.keys(mod).find((k) => k !== 'default' && typeof mod[k] === 'object');
  const story = key ? mod[key] : null;
  const args = { ...(meta.args || {}), ...(story?.args || {}) };
  const ctx: any = { args, argTypes: meta.argTypes || {}, globals: {}, parameters: { ...(meta.parameters || {}), ...(story?.parameters || {}) }, viewMode: 'story', id: 'x', name: key };
  const Base: any = story?.render || meta.render;
  const C: any = meta.component;
  if (!Base && !C) return null;
  let inner: () => React.ReactElement = () => (Base ? Base(args, ctx) : React.createElement(C, args));
  for (const d of [...(story?.decorators || []), ...(meta.decorators || [])]) { const prev = inner; inner = () => d(prev, ctx); }
  const Story: React.FC = () => inner();
  return Story;
}
const isComp = (x: any) => typeof x === 'function' || (x && typeof x === 'object' && x.$$typeof);   // inclui memo()/forwardRef()/lazy()
function demoComp(mod: any, exp?: string): React.ComponentType | null {
  if (exp && isComp(mod[exp])) return mod[exp];
  if (isComp(mod.default)) return mod.default;
  const k = Object.keys(mod).find((x) => isComp(mod[x]) && /^[A-Z]/.test(x)) || Object.keys(mod).find((x) => isComp(mod[x]));
  return k ? mod[k] : null;
}

const W = window as any;
// ── bibliotecas sob demanda: cada uma é um bundle gzip+base64 (JS + CSS) dentro do HTML, executado só quando um componente dela aparece
const ready = new Promise<void>((r) => { if (document.readyState !== 'loading') r(); else document.addEventListener('DOMContentLoaded', () => r()); });
async function unz(key: string): Promise<string> {
  const el = document.getElementById(key); const b64 = el?.textContent || '';
  if (!b64) return '';
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
const libP: Record<string, Promise<void>> = {};
export function loadLib(id: string): Promise<void> {
  return (libP[id] ||= (async () => {
    await ready;
    const [js, css] = await Promise.all([unz(`z:js:${id}`), unz(`z:css:${id}`)]);
    if (css) { const st = document.createElement('style'); st.dataset.lib = id; st.textContent = css; document.head.appendChild(st); }
    const sc = document.createElement('script'); sc.textContent = js; document.head.appendChild(sc);   // executa na hora (script clássico)
    if (!W.__ATLAS_REG?.[id]) throw new Error(`biblioteca ${id} não registrou seus componentes`);
  })());
}
const Empty: React.FC = () => <div className="p-3 font-mono text-xs opacity-50">sem componente exportado</div>;
function makeComp(m: any): React.ComponentType {
  const L = React.lazy(async () => {
    W.__atlasPending = (W.__atlasPending || 0) + 1;
    try {
      await loadLib(m.lib);
      const mod = await W.__ATLAS_REG[m.lib][m.uid]();
      let C: any = m.kind === 'story' ? storyComp(mod) : demoComp(mod, m.export);
      if (!C) return { default: Empty };
      if (m.props) { const Base: any = C; C = () => React.createElement(Base, m.props); }   // props de demo definidas em adapters/overrides.json
      return { default: C };
    } finally { W.__atlasPending--; }
  });
  return L as any;
}

export const CATALOG: Entry[] = (CATALOG_META as any[]).map((m) => ({ ...m, Comp: makeComp(m) }) as Entry);
export const BY_UID: Record<string, Entry> = Object.fromEntries(CATALOG.map((e) => [e.uid, e]));
export const LIBS: LibMeta[] = ((window as any).__LIBS || []).map((l: LibMeta) => ({ ...l, count: CATALOG.filter((e) => e.lib === l.id).length }));
export const LIB_BY_ID: Record<string, LibMeta> = Object.fromEntries(LIBS.map((l) => [l.id, l]));

export class Boundary extends React.Component<{ children: React.ReactNode; label?: string }, { err: any }> {
  state = { err: null as any };
  static getDerivedStateFromError(err: any) { return { err }; }
  componentDidCatch(err: any) { (window as any).__atlasErrors = ((window as any).__atlasErrors || []).concat(`${this.props.label}: ${err?.message || err}`); }
  render() {
    if (this.state.err) return <div className="p-3 font-mono text-xs text-red-400">Falha ao renderizar {this.props.label}</div>;
    return this.props.children;
  }
}

// código-fonte: gzip+base64 por biblioteca, descomprimido sob demanda
const srcCache: Record<string, Promise<Record<string, string>>> = {};
export function loadSources(lib: string): Promise<Record<string, string>> {
  return (srcCache[lib] ||= (async () => { await ready; const t = await unz(`z:src:${lib}`); return t ? JSON.parse(t) : {}; })());
}
