import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { Library, Moon, Search, Star, Sun, X } from 'lucide-react';
import { CATALOG, LIBS, BY_UID, type Entry } from './catalog';
import { Tile } from './stage';
import { Detail } from './detail';
import { cn, type StageTheme } from './ctx';
import { APPS, FNS } from '../../build/taxonomy.mjs';

type Sel = { lib: string | null; cat: string | null; fav: boolean; app: string | null; fn: string | null; stack: string | null };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const readFavs = (): string[] => { try { return JSON.parse(localStorage.getItem('atlas:favs') || '[]'); } catch { return []; } };
const parseHash = () => { const p = new URLSearchParams(location.hash.slice(1)); return { lib: p.get('lib'), cat: p.get('cat'), fav: p.get('fav') === '1', c: p.get('c'), q: p.get('q') || '', app: p.get('app'), fn: p.get('fn'), stack: p.get('stack'), view: p.get('view') }; };

export function App() {
  const h0 = useMemo(parseHash, []);
  const [sel, setSel] = useState<Sel>({ lib: h0.lib, cat: h0.cat, fav: h0.fav, app: h0.app, fn: h0.fn, stack: h0.stack });
  const [view, setView] = useState<'app' | 'lib'>(h0.view === 'lib' || h0.lib ? 'lib' : 'app');
  const [q, setQ] = useState(h0.q);
  const [theme, setTheme] = useState<StageTheme>('dark');
  const [open, setOpen] = useState<string | null>(h0.c);
  const [favs, setFavs] = useState<string[]>(readFavs);
  const [pal, setPal] = useState(false);
  const [limit, setLimit] = useState(36);
  const main = useRef<HTMLElement>(null);

  useEffect(() => { try { localStorage.setItem('atlas:favs', JSON.stringify(favs)); } catch {} }, [favs]);
  useEffect(() => {
    const p = new URLSearchParams();
    if (view === 'lib') p.set('view', 'lib'); if (sel.app) p.set('app', sel.app); if (sel.fn) p.set('fn', sel.fn); if (sel.stack) p.set('stack', sel.stack); if (sel.lib) p.set('lib', sel.lib); if (sel.cat) p.set('cat', sel.cat); if (sel.fav) p.set('fav', '1'); if (open) p.set('c', open); if (q) p.set('q', q);
    history.replaceState(null, '', '#' + p.toString());
  }, [sel, open, q, view]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal((v) => !v); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  useEffect(() => setLimit(36), [sel, q]);
  useEffect(() => { (window as any).__atlasOpen = setOpen; (window as any).__atlasCount = CATALOG.length; (window as any).__atlasUids = CATALOG.map((e) => e.uid); }, []);

  const toggleFav = useCallback((uid: string) => setFavs((f) => (f.includes(uid) ? f.filter((x) => x !== uid) : [...f, uid])), []);

  const cats = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const e of CATALOG) { const c = m.get(e.lib) || new Map(); c.set(e.category, (c.get(e.category) || 0) + 1); m.set(e.lib, c); }
    return m;
  }, []);

  // facetas: contagem de tipo de aplicação / função considerando o outro filtro e a stack
  const facets = useMemo(() => {
    const a = new Map<string, number>(), f = new Map<string, number>();
    for (const e of CATALOG) {
      if (sel.stack && e.stack !== sel.stack) continue;
      if ((!sel.fn || e.fn === sel.fn) && e.app) a.set(e.app, (a.get(e.app) || 0) + 1);
      if ((!sel.app || e.app === sel.app) && e.fn) f.set(e.fn, (f.get(e.fn) || 0) + 1);
    }
    return { a, f };
  }, [sel.app, sel.fn, sel.stack]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return CATALOG.filter((e) => (!sel.lib || e.lib === sel.lib) && (!sel.cat || e.category === sel.cat) && (!sel.fav || favs.includes(e.uid)) &&
      (!sel.app || e.app === sel.app) && (!sel.fn || e.fn === sel.fn) && (!sel.stack || e.stack === sel.stack) &&
      (!nq || norm(`${e.name} ${e.category} ${e.group || ''} ${e.lib} ${e.id} ${e.desc || ''} ${e.app || ''} ${e.fn || ''} ${(e.tags || []).join(' ')}`).includes(nq)));
  }, [sel, q, favs]);

  // render progressivo: rolar até o fim libera mais cartões
  useEffect(() => {
    const el = main.current; if (!el) return;
    const on = () => { if (el.scrollTop + el.clientHeight > el.scrollHeight - 1400) setLimit((l) => l + 36); };
    el.addEventListener('scroll', on, { passive: true }); on();
    return () => el.removeEventListener('scroll', on);
  }, [list]);

  const title = view === 'app' && !sel.fav ? [sel.app, sel.fn].filter(Boolean).join(' · ') || 'Todos os componentes' : sel.fav ? 'Favoritos' : sel.cat ? `${LIBS.find((l) => l.id === sel.lib)?.name} · ${sel.cat}` : sel.lib ? LIBS.find((l) => l.id === sel.lib)?.name : 'Todas as bibliotecas';
  const pick = (s: Partial<Sel>) => { setSel((cur) => ({ ...cur, ...s })); main.current?.scrollTo({ top: 0 }); };
  const NONE = { lib: null, cat: null, fav: false, app: null, fn: null };
  const entry: Entry | undefined = open ? BY_UID[open] : undefined;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="sb hidden w-[264px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-zinc-950/80 p-4 md:flex">
        <div className="mb-5 flex items-center gap-2 px-1"><Library size={18} className="text-amber-200" /><span className="font-display text-lg font-semibold tracking-tight">Atlas</span><span className="font-mono text-[10px] text-zinc-600">v2 · {(window as any).__PROFILE === 'compartilhavel' ? 'compartilhável' : (window as any).__PROFILE || 'full'}</span></div>
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-white/10 p-1 text-[12px]">
          {([['app', 'Por aplicação'], ['lib', 'Por biblioteca']] as const).map(([v, l]) => (
            <button key={v} onClick={() => { setView(v); pick(NONE); }} className={cn('rounded-md px-2 py-1.5 transition', view === v ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200')}>{l}</button>
          ))}
        </div>
        <div className="mb-3 flex gap-1 text-[11px]">
          {([[null, 'Todos'], ['react', 'React'], ['html', 'HTML']] as const).map(([v, l]) => (
            <button key={String(v)} onClick={() => pick({ stack: v })} className={cn('rounded-full border px-2.5 py-0.5 transition', sel.stack === v ? 'border-amber-200/50 text-amber-100' : 'border-white/10 text-zinc-500 hover:text-zinc-200')}>{l}</button>
          ))}
        </div>
        <NavBtn active={!sel.lib && !sel.fav && !sel.app && !sel.fn} onClick={() => pick(NONE)} label="Tudo" n={CATALOG.length} />
        <NavBtn active={sel.fav} onClick={() => pick({ ...NONE, fav: true })} label="★ Favoritos" n={favs.filter((f) => BY_UID[f]).length} />
        {view === 'app' && (
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">Tipo de aplicação</div>
              {APPS.filter((a) => facets.a.get(a)).map((a) => <NavBtn key={a} active={sel.app === a} onClick={() => pick({ app: sel.app === a ? null : a, lib: null, cat: null, fav: false })} label={a} n={facets.a.get(a) || 0} strong />)}
            </div>
            <div>
              <div className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">Função do componente</div>
              {FNS.filter((f) => facets.f.get(f)).map((f) => <NavBtn key={f} active={sel.fn === f} onClick={() => pick({ fn: sel.fn === f ? null : f, lib: null, cat: null, fav: false })} label={f} n={facets.f.get(f) || 0} />)}
            </div>
          </div>
        )}
        {view === 'lib' && <div className="mt-4 space-y-3">
          {LIBS.map((l) => (
            <div key={l.id}>
              <NavBtn active={sel.lib === l.id && !sel.cat && !sel.fav} onClick={() => pick({ lib: l.id, cat: null, fav: false, app: null, fn: null })} label={l.name} n={l.count || 0} strong />
              {sel.lib === l.id && !sel.fav && (
                <div className="ml-2 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                  {[...(cats.get(l.id) || new Map()).entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([c, n]) => (
                    <NavBtn key={c} active={sel.cat === c} onClick={() => pick({ lib: l.id, cat: c, fav: false, app: null, fn: null })} label={c} n={n} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 bg-zinc-950/70 px-5 py-3 backdrop-blur">
          <div className="relative max-w-xl flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar componente, categoria ou biblioteca…" aria-label="Buscar" className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-8 text-sm outline-none placeholder:text-zinc-600 focus:border-amber-200/40" />
            {q && <button onClick={() => setQ('')} aria-label="Limpar" className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"><X size={14} /></button>}
          </div>
          <button onClick={() => setPal(true)} className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-400 hover:text-zinc-100 sm:flex">Atalhos <kbd className="rounded border border-white/10 px-1">⌘K</kbd></button>
          <button onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-label="Alternar tema dos palcos" className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5">{theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} palco {theme === 'dark' ? 'escuro' : 'claro'}</button>
        </header>
        <main ref={main} className="sb min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-zinc-400">{list.length} componentes</span>
          </div>
          {list.length === 0 && <p className="py-24 text-center text-zinc-500">Nada encontrado.</p>}
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 2xl:grid-cols-3">
            {list.slice(0, limit).map((e) => <Tile key={e.uid} entry={e} theme={theme} fav={favs.includes(e.uid)} onFav={() => toggleFav(e.uid)} onOpen={() => setOpen(e.uid)} />)}
          </div>
        </main>
      </div>

      {entry && <Detail entry={entry} theme={theme} onClose={() => setOpen(null)} />}

      <Dialog.Root open={pal} onOpenChange={setPal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
          <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-[12vh] z-[91] w-[min(660px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-zinc-100 shadow-2xl outline-none">
            <Dialog.Title className="sr-only">Buscar componente</Dialog.Title>
            <Command label="Buscar componente" filter={(v, s) => (norm(v).includes(norm(s.trim())) ? 1 : 0)}>
              <div className="flex items-center gap-3 border-b border-white/10 px-4"><Search size={16} className="text-zinc-500" /><Command.Input autoFocus placeholder="Buscar em todas as bibliotecas…" className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-zinc-600" /></div>
              <Command.List className="sb max-h-[52vh] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-10 text-center text-sm text-zinc-500">Nenhum componente encontrado.</Command.Empty>
                {CATALOG.map((e) => (
                  <Command.Item key={e.uid} value={`${e.name} ${e.category} ${e.lib} ${e.id}`} onSelect={() => { setPal(false); setOpen(e.uid); }} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300 data-[selected=true]:bg-white/10 data-[selected=true]:text-white">
                    <span>{e.name}</span><span className="font-mono text-[10px] text-zinc-600">{e.lib} · {e.category}</span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function NavBtn({ active, onClick, label, n, strong }: { active: boolean; onClick: () => void; label: string; n: number; strong?: boolean }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] transition', active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100', strong && 'font-medium')}>
      <span className="truncate">{label}</span><span className="ml-2 font-mono text-[10px] text-zinc-600">{n}</span>
    </button>
  );
}
